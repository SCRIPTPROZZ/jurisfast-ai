-- Add new columns for the robust credit system
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_credits_limit integer NOT NULL DEFAULT 150,
ADD COLUMN IF NOT EXISTS extra_credits integer NOT NULL DEFAULT 0;

-- Rename credits to credits_balance for clarity (if not already done)
-- First check if credits_balance exists, if not rename credits
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'credits_balance') THEN
    ALTER TABLE public.profiles RENAME COLUMN credits TO credits_balance;
  END IF;
END $$;

-- Create credit_action_logs table for comprehensive logging
CREATE TABLE IF NOT EXISTS public.credit_action_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action_type text NOT NULL, -- 'debit', 'purchase', 'reset', 'plan_change', 'signup'
  amount integer NOT NULL,
  credits_before integer NOT NULL,
  credits_after integer NOT NULL,
  monthly_credits_before integer,
  monthly_credits_after integer,
  extra_credits_before integer,
  extra_credits_after integer,
  plan_before text,
  plan_after text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on credit_action_logs
ALTER TABLE public.credit_action_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_action_logs
CREATE POLICY "Users can view their own credit logs" 
ON public.credit_action_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Plan credits mapping function
CREATE OR REPLACE FUNCTION public.get_plan_credits(p_plan text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  RETURN CASE p_plan
    WHEN 'free' THEN 150
    WHEN 'basico' THEN 450
    WHEN 'pro' THEN 1450
    WHEN 'business' THEN 3450
    ELSE 150
  END;
END;
$function$;

-- Apply plan credits function
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

  -- Get new monthly limit based on plan
  v_new_monthly_limit := get_plan_credits(p_plan);
  
  -- Calculate new balance: monthly + extra (keep extra credits!)
  v_new_balance := v_new_monthly_limit + v_current_record.extra_credits;

  -- Update profile
  UPDATE profiles
  SET 
    plan = p_plan,
    monthly_credits_limit = v_new_monthly_limit,
    credits_balance = v_new_balance,
    credits_reset_at = CASE 
      WHEN v_current_record.plan != p_plan THEN now() + interval '30 days'
      ELSE credits_reset_at
    END
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
    'Plan changed from ' || v_current_record.plan || ' to ' || p_plan
  );

  RETURN jsonb_build_object(
    'success', true, 
    'credits_balance', v_new_balance,
    'monthly_credits_limit', v_new_monthly_limit,
    'extra_credits', v_current_record.extra_credits
  );
END;
$function$;

-- Add extra credits function (for purchases)
CREATE OR REPLACE FUNCTION public.add_extra_credits(p_user_id uuid, p_amount integer, p_reason text DEFAULT 'purchase')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_record RECORD;
  v_new_extra integer;
  v_new_balance integer;
BEGIN
  -- Get current data with lock
  SELECT credits_balance, monthly_credits_limit, extra_credits
  INTO v_current_record
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Calculate new values
  v_new_extra := v_current_record.extra_credits + p_amount;
  v_new_balance := v_current_record.monthly_credits_limit + v_new_extra;

  -- Update profile
  UPDATE profiles
  SET 
    extra_credits = v_new_extra,
    credits_balance = v_new_balance
  WHERE user_id = p_user_id;

  -- Log the purchase
  INSERT INTO credit_action_logs (
    user_id, action_type, amount,
    credits_before, credits_after,
    extra_credits_before, extra_credits_after,
    description
  ) VALUES (
    p_user_id, 'purchase', p_amount,
    v_current_record.credits_balance, v_new_balance,
    v_current_record.extra_credits, v_new_extra,
    p_reason
  );

  RETURN jsonb_build_object(
    'success', true, 
    'credits_balance', v_new_balance,
    'extra_credits', v_new_extra
  );
END;
$function$;

-- Updated debit credits function with proper debit order
CREATE OR REPLACE FUNCTION public.debit_credits(p_user_id uuid, p_credits integer, p_action_type text, p_description text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_record RECORD;
  v_remaining_cost integer;
  v_monthly_debit integer;
  v_extra_debit integer;
  v_new_monthly integer;
  v_new_extra integer;
  v_new_balance integer;
BEGIN
  -- Get current data with lock
  SELECT credits_balance, monthly_credits_limit, extra_credits
  INTO v_current_record
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_current_record.credits_balance < p_credits THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient credits', 
      'current_credits', v_current_record.credits_balance
    );
  END IF;

  -- Debit from monthly first, then extra
  v_remaining_cost := p_credits;
  
  -- Calculate how much to debit from monthly
  v_monthly_debit := LEAST(v_current_record.monthly_credits_limit, v_remaining_cost);
  v_remaining_cost := v_remaining_cost - v_monthly_debit;
  
  -- Calculate how much to debit from extra
  v_extra_debit := v_remaining_cost;
  
  -- Calculate new values
  v_new_monthly := v_current_record.monthly_credits_limit - v_monthly_debit;
  v_new_extra := v_current_record.extra_credits - v_extra_debit;
  v_new_balance := v_new_monthly + v_new_extra;

  -- Update profile
  UPDATE profiles
  SET 
    monthly_credits_limit = v_new_monthly,
    extra_credits = v_new_extra,
    credits_balance = v_new_balance
  WHERE user_id = p_user_id;

  -- Log the consumption
  INSERT INTO credit_action_logs (
    user_id, action_type, amount,
    credits_before, credits_after,
    monthly_credits_before, monthly_credits_after,
    extra_credits_before, extra_credits_after,
    description
  ) VALUES (
    p_user_id, 'debit', -p_credits,
    v_current_record.credits_balance, v_new_balance,
    v_current_record.monthly_credits_limit, v_new_monthly,
    v_current_record.extra_credits, v_new_extra,
    COALESCE(p_description, p_action_type)
  );

  -- Also insert into credit_logs for backward compatibility
  INSERT INTO credit_logs (user_id, action_type, credits_used, description)
  VALUES (p_user_id, p_action_type, p_credits, p_description);

  RETURN jsonb_build_object(
    'success', true, 
    'remaining_credits', v_new_balance,
    'monthly_remaining', v_new_monthly,
    'extra_remaining', v_new_extra
  );
END;
$function$;

-- Monthly credit reset function
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user RECORD;
  v_new_monthly integer;
  v_new_balance integer;
BEGIN
  -- Process users whose reset date has passed
  FOR v_user IN 
    SELECT user_id, plan, credits_balance, monthly_credits_limit, extra_credits 
    FROM profiles 
    WHERE credits_reset_at <= now()
  LOOP
    -- Get plan credits
    v_new_monthly := get_plan_credits(v_user.plan);
    v_new_balance := v_new_monthly + v_user.extra_credits;
    
    -- Update profile
    UPDATE profiles
    SET 
      monthly_credits_limit = v_new_monthly,
      credits_balance = v_new_balance,
      credits_reset_at = now() + interval '30 days'
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
      'Monthly credit reset for plan: ' || v_user.plan
    );
  END LOOP;
END;
$function$;

-- Update handle_new_user to use new credit structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_monthly_credits integer;
BEGIN
  v_monthly_credits := get_plan_credits('free');
  
  INSERT INTO public.profiles (user_id, name, plan, monthly_credits_limit, extra_credits, credits_balance, credits_reset_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    'free',
    v_monthly_credits,
    0,
    v_monthly_credits,
    now() + interval '30 days'
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
    'New user signup with free plan'
  );
  
  RETURN NEW;
END;
$function$;

-- Update existing users to have the new structure
UPDATE profiles
SET 
  monthly_credits_limit = get_plan_credits(plan),
  extra_credits = 0,
  credits_balance = get_plan_credits(plan)
WHERE monthly_credits_limit IS NULL OR monthly_credits_limit = 0;