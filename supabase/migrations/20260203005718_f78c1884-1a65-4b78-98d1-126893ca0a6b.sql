-- Fix security warning: set search_path for get_plan_credits
CREATE OR REPLACE FUNCTION public.get_plan_credits(p_plan text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
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