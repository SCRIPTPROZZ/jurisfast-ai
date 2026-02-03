-- Add credits and content module fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS has_content_module boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS credits_reset_at timestamp with time zone DEFAULT now();

-- Update plan column to support new plans
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- Create credit_logs table for tracking consumption
CREATE TABLE IF NOT EXISTS public.credit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  credits_used integer NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on credit_logs
ALTER TABLE public.credit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_logs
CREATE POLICY "Users can view their own credit logs"
ON public.credit_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert credit logs"
ON public.credit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create credit_purchases table
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  credits_amount integer NOT NULL,
  price_paid numeric(10,2) NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on credit_purchases
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_purchases
CREATE POLICY "Users can view their own purchases"
ON public.credit_purchases
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases"
ON public.credit_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to debit credits securely
CREATE OR REPLACE FUNCTION public.debit_credits(
  p_user_id uuid,
  p_credits integer,
  p_action_type text,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits integer;
  v_new_credits integer;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO v_current_credits
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_current_credits < p_credits THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits', 'current_credits', v_current_credits);
  END IF;

  -- Debit credits
  v_new_credits := v_current_credits - p_credits;
  
  UPDATE profiles
  SET credits = v_new_credits
  WHERE user_id = p_user_id;

  -- Log the transaction
  INSERT INTO credit_logs (user_id, action_type, credits_used, description)
  VALUES (p_user_id, p_action_type, p_credits, p_description);

  RETURN jsonb_build_object('success', true, 'remaining_credits', v_new_credits);
END;
$$;

-- Create function to add credits
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid,
  p_credits integer,
  p_reason text DEFAULT 'purchase'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_credits integer;
BEGIN
  UPDATE profiles
  SET credits = credits + p_credits
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_credits;

  IF v_new_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Log the addition
  INSERT INTO credit_logs (user_id, action_type, credits_used, description)
  VALUES (p_user_id, 'credit_added', -p_credits, p_reason);

  RETURN jsonb_build_object('success', true, 'new_credits', v_new_credits);
END;
$$;

-- Create function to reset credits monthly based on plan
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset credits for users whose reset date has passed
  UPDATE profiles
  SET 
    credits = CASE plan
      WHEN 'free' THEN 5
      WHEN 'basico' THEN 450
      WHEN 'pro' THEN 1450
      WHEN 'business' THEN 3450
      ELSE 5
    END,
    credits_reset_at = now() + interval '1 month'
  WHERE credits_reset_at <= now();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.debit_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits TO authenticated;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_credit_logs_user_id ON public.credit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_logs_created_at ON public.credit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON public.credit_purchases(user_id);