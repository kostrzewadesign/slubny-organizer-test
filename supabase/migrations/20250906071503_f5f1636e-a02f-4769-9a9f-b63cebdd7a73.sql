-- Remove the problematic trigger and function that uses http_header
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.send_user_confirmation_email();

-- Ensure we have the basic user profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile with default values
  INSERT INTO public.user_profiles (user_id, bride_name, groom_name, total_budget)
  VALUES (NEW.id, 'Panna Młoda', 'Pan Młody', 0);
  
  -- Initialize default tasks from templates (with proper task_type mapping)
  INSERT INTO public.tasks (user_id, title, description, category, is_priority, task_type)
  SELECT 
    NEW.id,
    title,
    description,
    category,
    is_priority,
    CASE 
      WHEN template_type = 'task' THEN 'wedding'
      ELSE 'wedding'
    END as task_type
  FROM public.wedding_templates
  WHERE template_type = 'task';
  
  -- Initialize default expenses from templates
  INSERT INTO public.expenses (user_id, title, category, amount, payment_status)
  SELECT 
    NEW.id,
    title,
    category,
    COALESCE(amount, 0),
    COALESCE(payment_status, 'planned')
  FROM public.wedding_templates
  WHERE template_type = 'expense';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the correct trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();