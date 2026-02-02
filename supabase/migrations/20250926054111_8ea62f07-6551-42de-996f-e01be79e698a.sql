-- Fix payment_status enum mapping in SQL functions
CREATE OR REPLACE FUNCTION public.init_default_expenses_if_needed()
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH ins AS (
    INSERT INTO expenses (user_id, title, category, amount, payment_status, created_at)
    SELECT 
      auth.uid(),
      wt.title,
      wt.category,
      0,
      CASE 
        WHEN wt.payment_status = 'planned' THEN 'none'::payment_status_new
        WHEN wt.payment_status = 'paid' THEN 'paid'::payment_status_new
        WHEN wt.payment_status = 'deposit_paid' THEN 'deposit_paid'::payment_status_new
        ELSE 'none'::payment_status_new
      END,
      NOW()
    FROM wedding_templates wt
    WHERE wt.template_type = 'expense'
      AND NOT EXISTS (
        SELECT 1 FROM expenses e WHERE e.user_id = auth.uid()
      )
    ORDER BY wt.order_index
    RETURNING 1
  )
  SELECT COUNT(*)::integer FROM ins;
$function$;

CREATE OR REPLACE FUNCTION public.reset_expenses_to_defaults()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  inserted_count integer := 0;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Delete existing expenses atomically, then insert defaults
  DELETE FROM expenses WHERE user_id = auth.uid();
  
  WITH ins AS (
    INSERT INTO expenses (user_id, title, category, amount, payment_status, created_at)
    SELECT 
      auth.uid(),
      wt.title,
      wt.category,
      0,
      CASE 
        WHEN wt.payment_status = 'planned' THEN 'none'::payment_status_new
        WHEN wt.payment_status = 'paid' THEN 'paid'::payment_status_new
        WHEN wt.payment_status = 'deposit_paid' THEN 'deposit_paid'::payment_status_new
        ELSE 'none'::payment_status_new
      END,
      NOW()
    FROM wedding_templates wt
    WHERE wt.template_type = 'expense'
    ORDER BY wt.order_index
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM ins;
  
  RETURN inserted_count;
END;
$function$;