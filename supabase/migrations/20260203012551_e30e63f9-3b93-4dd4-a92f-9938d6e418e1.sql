-- ============================================
-- FIX: Corrigir função de sincronização de créditos
-- O erro era: "record new has no field last_credit_reset"
-- A coluna correta é credits_reset_at
-- ============================================

-- Drop the old trigger first
DROP TRIGGER IF EXISTS trigger_sync_credits ON public.profiles;

-- Recreate the sync function with correct column name and plan names
CREATE OR REPLACE FUNCTION public.sync_credits_with_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_plan_credits integer;
  v_reset_interval interval;
BEGIN
  -- Only recalculate if plan actually changed
  IF OLD.plan IS DISTINCT FROM NEW.plan THEN
    -- Get credits based on plan (matching get_plan_credits function)
    v_plan_credits := CASE NEW.plan
      WHEN 'free' THEN 5
      WHEN 'basico' THEN 450
      WHEN 'basic' THEN 450  -- Support both spellings
      WHEN 'pro' THEN 1450
      WHEN 'business' THEN 3450
      ELSE 5
    END;
    
    -- Get reset interval based on plan
    v_reset_interval := CASE NEW.plan
      WHEN 'free' THEN interval '1 day'
      ELSE interval '30 days'
    END;

    -- Normalize plan name to 'basico' if 'basic'
    IF NEW.plan = 'basic' THEN
      NEW.plan := 'basico';
    END IF;

    -- Ensure extra_credits is not null
    IF NEW.extra_credits IS NULL THEN
      NEW.extra_credits := 0;
    END IF;

    -- Update credits
    NEW.monthly_credits_limit := v_plan_credits;
    NEW.credits_balance := v_plan_credits + NEW.extra_credits;
    NEW.credits_reset_at := now() + v_reset_interval;  -- FIXED: was last_credit_reset
    NEW.updated_at := now();
    
    -- Log the plan change
    INSERT INTO credit_action_logs (
      user_id, action_type, amount,
      credits_before, credits_after,
      monthly_credits_before, monthly_credits_after,
      extra_credits_before, extra_credits_after,
      plan_before, plan_after,
      description
    ) VALUES (
      NEW.user_id, 'plan_change_trigger', v_plan_credits - COALESCE(OLD.monthly_credits_limit, 0),
      OLD.credits_balance, NEW.credits_balance,
      OLD.monthly_credits_limit, NEW.monthly_credits_limit,
      OLD.extra_credits, NEW.extra_credits,
      OLD.plan, NEW.plan,
      'Trigger: Plan changed from ' || COALESCE(OLD.plan, 'none') || ' to ' || NEW.plan
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER trigger_sync_credits
BEFORE UPDATE OF plan ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_credits_with_plan();

-- ============================================
-- Update get_plan_credits to support both spellings
-- ============================================
CREATE OR REPLACE FUNCTION public.get_plan_credits(p_plan text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE p_plan
    WHEN 'free' THEN 5
    WHEN 'basico' THEN 450
    WHEN 'basic' THEN 450  -- Support both spellings
    WHEN 'pro' THEN 1450
    WHEN 'business' THEN 3450
    ELSE 5
  END;
END;
$function$;

-- ============================================
-- Update get_plan_reset_interval to support both spellings
-- ============================================
CREATE OR REPLACE FUNCTION public.get_plan_reset_interval(p_plan text)
RETURNS interval
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE p_plan
    WHEN 'free' THEN interval '1 day'
    WHEN 'basico' THEN interval '30 days'
    WHEN 'basic' THEN interval '30 days'
    WHEN 'pro' THEN interval '30 days'
    WHEN 'business' THEN interval '30 days'
    ELSE interval '1 day'
  END;
END;
$function$;

-- ============================================
-- Fix recalculate_credits to handle edge cases better
-- ============================================
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
  v_normalized_plan text;
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

  -- Normalize plan name
  v_normalized_plan := CASE v_record.plan
    WHEN 'basic' THEN 'basico'
    ELSE v_record.plan
  END;

  -- Get plan credits and reset interval
  v_plan_credits := get_plan_credits(v_normalized_plan);
  v_reset_interval := get_plan_reset_interval(v_normalized_plan);
  
  -- Ensure extra_credits is not null
  IF v_record.extra_credits IS NULL THEN
    v_record.extra_credits := 0;
  END IF;
  
  -- Check if reset is needed (null or past due)
  v_needs_reset := v_record.credits_reset_at IS NULL OR v_record.credits_reset_at <= now();
  
  -- Also check if monthly_credits_limit doesn't match the plan (inconsistency fix)
  IF v_record.monthly_credits_limit != v_plan_credits THEN
    v_needs_reset := true;
  END IF;
  
  IF v_needs_reset THEN
    -- Reset monthly credits based on plan
    v_new_monthly := v_plan_credits;
    v_new_balance := v_new_monthly + v_record.extra_credits;
    
    -- Update profile (also normalize plan name if needed)
    UPDATE profiles
    SET 
      plan = v_normalized_plan,
      monthly_credits_limit = v_new_monthly,
      credits_balance = v_new_balance,
      extra_credits = v_record.extra_credits,
      credits_reset_at = now() + v_reset_interval,
      updated_at = now()
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
      'Credit reset for plan: ' || v_normalized_plan || ' (interval: ' || v_reset_interval::text || ')'
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
    -- No reset needed, but ensure balance is correct
    v_new_balance := v_record.monthly_credits_limit + v_record.extra_credits;
    
    -- Fix balance if incorrect
    IF v_record.credits_balance != v_new_balance THEN
      UPDATE profiles
      SET credits_balance = v_new_balance, updated_at = now()
      WHERE user_id = p_user_id;
    END IF;
    
    RETURN jsonb_build_object(
      'success', true,
      'reset_performed', false,
      'credits_balance', v_new_balance,
      'monthly_credits_limit', v_record.monthly_credits_limit,
      'extra_credits', v_record.extra_credits,
      'next_reset', v_record.credits_reset_at
    );
  END IF;
END;
$function$;

-- ============================================
-- Update apply_plan_credits for immediate plan changes
-- ============================================
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
  v_normalized_plan text;
BEGIN
  -- Normalize plan name
  v_normalized_plan := CASE p_plan
    WHEN 'basic' THEN 'basico'
    ELSE p_plan
  END;

  -- Get current user data with lock
  SELECT plan, credits_balance, monthly_credits_limit, extra_credits
  INTO v_current_record
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Ensure extra_credits is not null
  IF v_current_record.extra_credits IS NULL THEN
    v_current_record.extra_credits := 0;
  END IF;

  -- Get new monthly limit and reset interval based on plan
  v_new_monthly_limit := get_plan_credits(v_normalized_plan);
  v_reset_interval := get_plan_reset_interval(v_normalized_plan);
  
  -- Calculate new balance: monthly + extra (keep extra credits!)
  v_new_balance := v_new_monthly_limit + v_current_record.extra_credits;

  -- Update profile with new plan and immediate credit application
  -- Note: This bypasses the trigger since we're updating all fields together
  UPDATE profiles
  SET 
    plan = v_normalized_plan,
    monthly_credits_limit = v_new_monthly_limit,
    credits_balance = v_new_balance,
    credits_reset_at = now() + v_reset_interval,
    updated_at = now()
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
    p_user_id, 'plan_change', v_new_monthly_limit - COALESCE(v_current_record.monthly_credits_limit, 0),
    v_current_record.credits_balance, v_new_balance,
    v_current_record.monthly_credits_limit, v_new_monthly_limit,
    v_current_record.extra_credits, v_current_record.extra_credits,
    v_current_record.plan, v_normalized_plan,
    'Plan changed from ' || COALESCE(v_current_record.plan, 'none') || ' to ' || v_normalized_plan || '. Credits: ' || v_new_monthly_limit
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