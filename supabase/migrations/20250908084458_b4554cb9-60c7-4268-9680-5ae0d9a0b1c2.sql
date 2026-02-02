-- Strengthen RLS policies for guests table to ensure maximum security

-- First, let's audit the current guests table policies and strengthen them
DROP POLICY IF EXISTS "guests_secure_select_policy" ON public.guests;
DROP POLICY IF EXISTS "guests_secure_insert_policy" ON public.guests;
DROP POLICY IF EXISTS "guests_secure_update_policy" ON public.guests;
DROP POLICY IF EXISTS "guests_secure_delete_policy" ON public.guests;

-- Create enhanced security function to validate guest ownership
CREATE OR REPLACE FUNCTION public.validate_guest_ownership_secure(guest_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Only allow access if user is authenticated and owns the guest record
  RETURN (
    auth.uid() IS NOT NULL AND 
    guest_user_id IS NOT NULL AND 
    auth.uid() = guest_user_id
  );
END;
$$;

-- Enhanced SELECT policy - users can only see their own guests
CREATE POLICY "guests_enhanced_select_policy" 
ON public.guests 
FOR SELECT 
TO authenticated
USING (public.validate_guest_ownership_secure(user_id));

-- Enhanced INSERT policy - users can only create guests for themselves with strict limits
CREATE POLICY "guests_enhanced_insert_policy" 
ON public.guests 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.validate_guest_ownership_secure(user_id) AND
  (SELECT count(*) FROM public.guests WHERE user_id = auth.uid()) < 500
);

-- Enhanced UPDATE policy - users can only update their own guests
CREATE POLICY "guests_enhanced_update_policy" 
ON public.guests 
FOR UPDATE 
TO authenticated
USING (public.validate_guest_ownership_secure(user_id))
WITH CHECK (public.validate_guest_ownership_secure(user_id));

-- Enhanced DELETE policy - users can only delete their own guests
CREATE POLICY "guests_enhanced_delete_policy" 
ON public.guests 
FOR DELETE 
TO authenticated
USING (public.validate_guest_ownership_secure(user_id));

-- Add explicit policy to block service_role access to guest personal data unless explicitly needed
CREATE POLICY "guests_service_role_restricted" 
ON public.guests 
FOR ALL 
TO service_role
USING (false)
WITH CHECK (false);

-- Create secure audit log SELECT policy to prevent unauthorized access
DROP POLICY IF EXISTS "audit_log_user_insert" ON public.security_audit_log;
DROP POLICY IF EXISTS "audit_log_insert_only" ON public.security_audit_log;

-- Only allow users to see their own audit logs
CREATE POLICY "audit_log_user_select_own" 
ON public.security_audit_log 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Recreate insert policy
CREATE POLICY "audit_log_user_insert" 
ON public.security_audit_log 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add data masking function for sensitive guest data in logs
CREATE OR REPLACE FUNCTION public.log_guest_access_secure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Log access attempt with masked data
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    target_guest_id,
    created_at
  ) VALUES (
    COALESCE(current_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP || '_guest_data_access',
    COALESCE(NEW.id, OLD.id),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Don't block operations if logging fails
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply the secure logging trigger
DROP TRIGGER IF EXISTS secure_guest_access_log ON public.guests;
CREATE TRIGGER secure_guest_access_log
  AFTER SELECT ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_guest_access_secure();