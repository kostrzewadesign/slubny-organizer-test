-- Function to initialize default expenses for users who have none
CREATE OR REPLACE FUNCTION public.init_default_expenses_if_needed()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  existing_count integer;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user already has expenses
  SELECT COUNT(*) INTO existing_count
  FROM expenses
  WHERE user_id = current_user_id;
  
  -- If user already has expenses, don't create defaults
  IF existing_count > 0 THEN
    RETURN false;
  END IF;
  
  -- Create default expenses from templates
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