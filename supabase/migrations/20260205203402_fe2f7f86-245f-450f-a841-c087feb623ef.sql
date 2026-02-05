-- Add INSERT policy for credit_action_logs table
-- This allows the system (via authenticated users) to properly log credit transactions
CREATE POLICY "System can insert credit action logs" 
ON public.credit_action_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);