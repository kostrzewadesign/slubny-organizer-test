-- Fix user_profiles RLS policies and add trigger for automatic profile creation

-- First, ensure the user_profiles table has proper RLS policies
-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles; 
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;

-- Create comprehensive RLS policies for user_profiles
CREATE POLICY "Users can insert own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" 
ON public.user_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Ensure the handle_new_user function exists and is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create user profile with default values
  INSERT INTO public.user_profiles (user_id, bride_name, groom_name, total_budget)
  VALUES (NEW.id, 'Panna Młoda', 'Pan Młody', 0);
  
  -- Initialize default tasks from templates (if templates exist)
  INSERT INTO public.tasks (user_id, title, description, category, is_priority, task_type)
  SELECT 
    NEW.id,
    title,
    description,
    category,
    is_priority,
    template_type
  FROM public.wedding_templates
  WHERE template_type = 'task';
  
  -- Initialize default expenses from templates (if templates exist)
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
$$;

-- Create the trigger to automatically create user profile on registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();