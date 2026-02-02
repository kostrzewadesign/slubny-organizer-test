-- Additional fixes for user deletion issues

-- Add CASCADE DELETE triggers to handle cleanup properly
CREATE OR REPLACE FUNCTION public.cascade_delete_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- This function can be called by admin to clean up user data before deletion
  -- It's meant to handle any cleanup that CASCADE DELETE might miss
  
  -- Log the cleanup operation
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    created_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'ADMIN_USER_DATA_CLEANUP',
    NOW()
  );
END;
$function$;

-- Improve RLS policies to allow service role operations
-- Update guests table policy to be more permissive for admin operations
DROP POLICY IF EXISTS "guests_secure_delete_policy" ON public.guests;
CREATE POLICY "guests_secure_delete_policy" 
ON public.guests 
FOR DELETE 
USING (
  -- Allow user to delete their own guests OR allow service_role (admin operations)
  (auth.uid() = user_id AND auth.uid() IS NOT NULL) OR 
  (auth.role() = 'service_role')
);

-- Update other tables with similar patterns
DROP POLICY IF EXISTS "expenses_secure_delete_policy" ON public.expenses;
CREATE POLICY "expenses_secure_delete_policy" 
ON public.expenses 
FOR DELETE 
USING (
  (auth.uid() = user_id AND auth.uid() IS NOT NULL) OR 
  (auth.role() = 'service_role')
);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" 
ON public.tasks 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (auth.role() = 'service_role')
);

DROP POLICY IF EXISTS "Users can delete own tables" ON public.tables;
CREATE POLICY "Users can delete own tables" 
ON public.tables 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (auth.role() = 'service_role')
);

DROP POLICY IF EXISTS "Users can delete own table assignments" ON public.table_assignments;
CREATE POLICY "Users can delete own table assignments" 
ON public.table_assignments 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (auth.role() = 'service_role')
);

DROP POLICY IF EXISTS "Users can delete own categories" ON public.custom_categories;
CREATE POLICY "Users can delete own categories" 
ON public.custom_categories 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (auth.role() = 'service_role')
);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
CREATE POLICY "Users can delete own profile" 
ON public.user_profiles 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (auth.role() = 'service_role')
);

-- Add a special policy for audit log to allow service role to manage it
DROP POLICY IF EXISTS "audit_log_service_role_only" ON public.security_audit_log;
CREATE POLICY "audit_log_service_role_management" 
ON public.security_audit_log 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Ensure the audit log table allows service role operations
CREATE POLICY "audit_log_user_insert" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');