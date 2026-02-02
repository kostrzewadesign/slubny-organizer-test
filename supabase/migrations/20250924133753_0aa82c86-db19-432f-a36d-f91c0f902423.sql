-- Drop existing functions to change return type
DROP FUNCTION IF EXISTS public.init_default_expenses_if_needed();
DROP FUNCTION IF EXISTS public.reset_expenses_to_defaults();

-- Recreate functions with integer return type and proper enum casting
CREATE OR REPLACE FUNCTION public.init_default_expenses_if_needed()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ins AS (
    INSERT INTO expenses (user_id, title, category, amount, payment_status, created_at)
    SELECT 
      auth.uid(),
      wt.title,
      wt.category,
      0,
      COALESCE(wt.payment_status, 'none')::payment_status_new,
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
$$;

CREATE OR REPLACE FUNCTION public.reset_expenses_to_defaults()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      COALESCE(wt.payment_status, 'none')::payment_status_new,
      NOW()
    FROM wedding_templates wt
    WHERE wt.template_type = 'expense'
    ORDER BY wt.order_index
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM ins;
  
  RETURN inserted_count;
END;
$$;