-- Fix user deletion by adding proper foreign keys and cleanup

-- Add foreign key constraints with CASCADE DELETE for all user-related tables
-- Note: Some may already exist, so we use IF NOT EXISTS where possible

-- 1. Fix user_profiles table
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Fix tasks table  
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Fix expenses table
ALTER TABLE public.expenses 
DROP CONSTRAINT IF EXISTS expenses_user_id_fkey;

ALTER TABLE public.expenses 
ADD CONSTRAINT expenses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Fix guests table
ALTER TABLE public.guests 
DROP CONSTRAINT IF EXISTS guests_user_id_fkey;

ALTER TABLE public.guests 
ADD CONSTRAINT guests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Fix tables table
ALTER TABLE public.tables 
DROP CONSTRAINT IF EXISTS tables_user_id_fkey;

ALTER TABLE public.tables 
ADD CONSTRAINT tables_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Fix table_assignments table
ALTER TABLE public.table_assignments 
DROP CONSTRAINT IF EXISTS table_assignments_user_id_fkey;

ALTER TABLE public.table_assignments 
ADD CONSTRAINT table_assignments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Fix custom_categories table
ALTER TABLE public.custom_categories 
DROP CONSTRAINT IF EXISTS custom_categories_user_id_fkey;

ALTER TABLE public.custom_categories 
ADD CONSTRAINT custom_categories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 8. Fix security_audit_log table (special case - keep logs but mark user as deleted)
-- Don't cascade delete audit logs for security reasons, but ensure they don't block deletion

-- Create function to handle user deletion cleanup
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Log the user deletion for audit purposes
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    created_at
  ) VALUES (
    OLD.id,
    'USER_ACCOUNT_DELETED',
    NOW()
  );
  
  -- Update any remaining audit logs to mark user as deleted
  UPDATE public.security_audit_log 
  SET user_id = '00000000-0000-0000-0000-000000000000'::uuid
  WHERE user_id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Create trigger for user deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_deletion();

-- Ensure service_role can delete from all tables (for Supabase Dashboard)
-- Update existing policies to allow service_role operations

-- Update user_profiles policy
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
CREATE POLICY "Users can delete own profile" 
ON public.user_profiles 
FOR DELETE 
USING ((auth.uid() = user_id) OR (auth.role() = 'service_role'::text));

-- Update tasks policy  
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" 
ON public.tasks 
FOR DELETE 
USING ((auth.uid() = user_id) OR (auth.role() = 'service_role'::text));

-- Update expenses policy
DROP POLICY IF EXISTS "expenses_secure_delete_policy" ON public.expenses;
CREATE POLICY "expenses_secure_delete_policy" 
ON public.expenses 
FOR DELETE 
USING (((auth.uid() = user_id) AND (auth.uid() IS NOT NULL)) OR (auth.role() = 'service_role'::text));

-- Update guests policy
DROP POLICY IF EXISTS "guests_secure_delete_policy" ON public.guests;
CREATE POLICY "guests_secure_delete_policy" 
ON public.guests 
FOR DELETE 
USING (((auth.uid() = user_id) AND (auth.uid() IS NOT NULL)) OR (auth.role() = 'service_role'::text));

-- Other tables already have correct service_role policies

-- Add cleanup function for manual use if needed
CREATE OR REPLACE FUNCTION public.cleanup_user_data(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow service_role to call this function
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Only service role can cleanup user data';
  END IF;
  
  -- Delete user data in correct order (respecting foreign keys)
  DELETE FROM public.table_assignments WHERE user_id = target_user_id;
  DELETE FROM public.custom_categories WHERE user_id = target_user_id;
  DELETE FROM public.tables WHERE user_id = target_user_id;
  DELETE FROM public.guests WHERE user_id = target_user_id;
  DELETE FROM public.expenses WHERE user_id = target_user_id;
  DELETE FROM public.tasks WHERE user_id = target_user_id;
  DELETE FROM public.user_profiles WHERE user_id = target_user_id;
  
  -- Update audit logs to remove user reference
  UPDATE public.security_audit_log 
  SET user_id = '00000000-0000-0000-0000-000000000000'::uuid
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$;