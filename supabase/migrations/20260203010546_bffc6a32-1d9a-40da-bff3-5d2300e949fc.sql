-- Drop existing functions to recreate with correct logic
DROP FUNCTION IF EXISTS public.get_plan_credits(text);
DROP FUNCTION IF EXISTS public.apply_plan_credits(uuid, text);
DROP FUNCTION IF EXISTS public.reset_monthly_credits();

-- Plan credits mapping (monthly values, free is daily but stored as 5)
CREATE OR REPLACE FUNCTION public.get_plan_credits(p_plan text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE p_plan
    WHEN 'free' THEN 5        -- 5 per DAY
    WHEN 'basico' THEN 450    -- 450 per MONTH
    WHEN 'pro' THEN 1450      -- 1450 per MONTH
    WHEN 'business' THEN 3450 -- 3450 per MONTH
    ELSE 5
  END;
END;
$function$;

-- Get reset interval based on plan (free = 1 day, others = 30 days)
CREATE OR REPLACE FUNCTION public.get_plan_reset_interval(p_plan text)
RETURNS interval
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE p_plan
    WHEN 'free' THEN interval '1 day'
    ELSE interval '30 days'
  END;
END;
$function$;

-- Main function: recalculate credits for a user
CREATE OR REPLACE FUNCTION public.recalculate_credits(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_record RECORD;
  v_plan_credits integer;
  v_reset_interval interval;
  v_needs_reset boolean;
  v_new_monthly integer;
  v_new_balance integer;
BEGIN
  -- Get current user data with lock
  SELECT plan, credits_balance, monthly_credits_limit, extra_credits, credits_reset_at
  INTO v_record
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Get plan credits and reset interval
  v_plan_credits := get_plan_credits(v_record.plan);
  v_reset_interval := get_plan_reset_interval(v_record.plan);
  
  -- Check if reset is needed
  v_needs_reset := v_record.credits_reset_at IS NULL OR v_record.credits_reset_at <= now();
  
  IF v_needs_reset THEN
    -- Reset monthly credits based on plan
    v_new_monthly := v_plan_credits;
    v_new_balance := v_new_monthly + v_record.extra_credits;
    
    -- Update profile
    UPDATE profiles
    SET 
      monthly_credits_limit = v_new_monthly,
      credits_balance = v_new_balance,
      credits_reset_at = now() + v_reset_interval
    WHERE user_id = p_user_id;
    
    -- Log the reset
    INSERT INTO credit_action_logs (
      user_id, action_type, amount,
      credits_before, credits_after,
      monthly_credits_before, monthly_credits_after,
      extra_credits_before, extra_credits_after,
      description
    ) VALUES (
      p_user_id, 'reset', v_new_monthly,
      v_record.credits_balance, v_new_balance,
      v_record.monthly_credits_limit, v_new_monthly,
      v_record.extra_credits, v_record.extra_credits,
      'Credit reset for plan: ' || v_record.plan || ' (interval: ' || v_reset_interval::text || ')'
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'reset_performed', true,
      'credits_balance', v_new_balance,
      'monthly_credits_limit', v_new_monthly,
      'extra_credits', v_record.extra_credits,
      'next_reset', now() + v_reset_interval
    );
  ELSE
    -- No reset needed, just return current values
    RETURN jsonb_build_object(
      'success', true,
      'reset_performed', false,
      'credits_balance', v_record.credits_balance,
      'monthly_credits_limit', v_record.monthly_credits_limit,
      'extra_credits', v_record.extra_credits,
      'next_reset', v_record.credits_reset_at
    );
  END IF;
END;
$function$;

-- Apply plan credits (for plan changes) - immediate reset
CREATE OR REPLACE FUNCTION public.apply_plan_credits(p_user_id uuid, p_plan text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_record RECORD;
  v_new_monthly_limit integer;
  v_new_balance integer;
  v_reset_interval interval;
BEGIN
  -- Get current user data with lock
  SELECT plan, credits_balance, monthly_credits_limit, extra_credits
  INTO v_current_record
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Get new monthly limit and reset interval based on plan
  v_new_monthly_limit := get_plan_credits(p_plan);
  v_reset_interval := get_plan_reset_interval(p_plan);
  
  -- Calculate new balance: monthly + extra (keep extra credits!)
  v_new_balance := v_new_monthly_limit + v_current_record.extra_credits;

  -- Update profile with new plan and immediate credit application
  UPDATE profiles
  SET 
    plan = p_plan,
    monthly_credits_limit = v_new_monthly_limit,
    credits_balance = v_new_balance,
    credits_reset_at = now() + v_reset_interval
  WHERE user_id = p_user_id;

  -- Log the plan change
  INSERT INTO credit_action_logs (
    user_id, action_type, amount, 
    credits_before, credits_after,
    monthly_credits_before, monthly_credits_after,
    extra_credits_before, extra_credits_after,
    plan_before, plan_after,
    description
  ) VALUES (
    p_user_id, 'plan_change', v_new_monthly_limit - v_current_record.monthly_credits_limit,
    v_current_record.credits_balance, v_new_balance,
    v_current_record.monthly_credits_limit, v_new_monthly_limit,
    v_current_record.extra_credits, v_current_record.extra_credits,
    v_current_record.plan, p_plan,
    'Plan changed from ' || v_current_record.plan || ' to ' || p_plan || '. Credits: ' || v_new_monthly_limit
  );

  RETURN jsonb_build_object(
    'success', true, 
    'credits_balance', v_new_balance,
    'monthly_credits_limit', v_new_monthly_limit,
    'extra_credits', v_current_record.extra_credits,
    'next_reset', now() + v_reset_interval
  );
END;
$function$;

-- Reset all credits (for cron job) - handles both daily free and monthly paid
CREATE OR REPLACE FUNCTION public.reset_all_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user RECORD;
  v_new_monthly integer;
  v_new_balance integer;
  v_reset_interval interval;
BEGIN
  -- Process all users whose reset date has passed
  FOR v_user IN 
    SELECT user_id, plan, credits_balance, monthly_credits_limit, extra_credits, credits_reset_at
    FROM profiles 
    WHERE credits_reset_at <= now()
  LOOP
    -- Get plan credits and interval
    v_new_monthly := get_plan_credits(v_user.plan);
    v_reset_interval := get_plan_reset_interval(v_user.plan);
    v_new_balance := v_new_monthly + v_user.extra_credits;
    
    -- Update profile
    UPDATE profiles
    SET 
      monthly_credits_limit = v_new_monthly,
      credits_balance = v_new_balance,
      credits_reset_at = now() + v_reset_interval
    WHERE user_id = v_user.user_id;
    
    -- Log the reset
    INSERT INTO credit_action_logs (
      user_id, action_type, amount,
      credits_before, credits_after,
      monthly_credits_before, monthly_credits_after,
      extra_credits_before, extra_credits_after,
      description
    ) VALUES (
      v_user.user_id, 'reset', v_new_monthly,
      v_user.credits_balance, v_new_balance,
      v_user.monthly_credits_limit, v_new_monthly,
      v_user.extra_credits, v_user.extra_credits,
      'Scheduled reset for plan: ' || v_user.plan
    );
  END LOOP;
END;
$function$;

-- Update handle_new_user to use correct credit values
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_monthly_credits integer;
  v_reset_interval interval;
BEGIN
  v_monthly_credits := get_plan_credits('free');
  v_reset_interval := get_plan_reset_interval('free');
  
  INSERT INTO public.profiles (
    user_id, name, plan, 
    monthly_credits_limit, extra_credits, credits_balance, 
    credits_reset_at
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    'free',
    v_monthly_credits,
    0,
    v_monthly_credits,
    now() + v_reset_interval
  );
  
  -- Log signup
  INSERT INTO credit_action_logs (
    user_id, action_type, amount,
    credits_before, credits_after,
    monthly_credits_before, monthly_credits_after,
    extra_credits_before, extra_credits_after,
    plan_after,
    description
  ) VALUES (
    NEW.id, 'signup', v_monthly_credits,
    0, v_monthly_credits,
    0, v_monthly_credits,
    0, 0,
    'free',
    'New user signup with free plan (5 credits/day)'
  );
  
  RETURN NEW;
END;
$function$;

-- Fix existing users: apply correct credits based on their plan
UPDATE profiles
SET 
  monthly_credits_limit = get_plan_credits(plan),
  credits_balance = get_plan_credits(plan) + extra_credits,
  credits_reset_at = CASE 
    WHEN plan = 'free' THEN now() + interval '1 day'
    ELSE now() + interval '30 days'
  END;