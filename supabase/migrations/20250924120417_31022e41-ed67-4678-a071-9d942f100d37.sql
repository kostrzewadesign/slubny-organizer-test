-- Function to reset user's expenses to defaults
CREATE OR REPLACE FUNCTION public.reset_expenses_to_defaults()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Delete all existing expenses for this user
  DELETE FROM expenses WHERE user_id = current_user_id;
  
  -- Create fresh default expenses from templates
  INSERT INTO expenses (user_id, title, category, amount, payment_status, created_at)
  SELECT 
    current_user_id,
    wt.title,
    wt.category,
    0,
    COALESCE(wt.payment_status, 'none'),
    NOW()
  FROM wedding_templates wt
  WHERE wt.template_type = 'expense'
  ORDER BY wt.order_index;
  
  RETURN true;
END;
$function$;