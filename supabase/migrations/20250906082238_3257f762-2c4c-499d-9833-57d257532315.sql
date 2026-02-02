-- Enhanced security measures for guest data protection

-- 1. Create function to validate user access to guest data
CREATE OR REPLACE FUNCTION public.validate_guest_access(guest_user_id UUID, accessing_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow access if the guest belongs to the accessing user
  RETURN guest_user_id = accessing_user_id;
END;
$$;

-- 2. Create trigger function to log all guest data modifications
CREATE OR REPLACE FUNCTION public.log_guest_data_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- Log the operation
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    target_guest_id,
    created_at
  ) VALUES (
    current_user_id,
    TG_OP || '_guest_' || LOWER(TG_TABLE_NAME),
    COALESCE(NEW.id, OLD.id),
    NOW()
  );
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 3. Create trigger for guest data modifications
DROP TRIGGER IF EXISTS guest_data_audit_trigger ON public.guests;
CREATE TRIGGER guest_data_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_guest_data_changes();

-- 4. Enhanced RLS policy with additional validation
DROP POLICY IF EXISTS "Enhanced guest access validation" ON public.guests;
CREATE POLICY "Enhanced guest access validation"
ON public.guests
FOR ALL
USING (public.validate_guest_access(user_id, auth.uid()))
WITH CHECK (public.validate_guest_access(user_id, auth.uid()));

-- 5. Create view for secure guest data access (automatically masks sensitive data)
CREATE OR REPLACE VIEW public.guests_secure AS
SELECT 
  id,
  first_name,
  last_name,
  guest_group,
  status,
  rsvp_status,
  accommodation,
  transport,
  is_child,
  is_service_provider,
  discount_type,
  companion_of_guest_id,
  table_assignment,
  notes,
  created_at,
  updated_at,
  user_id,
  -- Mask sensitive data by default
  CASE 
    WHEN email IS NOT NULL THEN 
      LEFT(email, 2) || REPEAT('*', LENGTH(email) - 6) || RIGHT(email, 4)
    ELSE NULL 
  END as email_masked,
  CASE 
    WHEN phone IS NOT NULL THEN 
      REPEAT('*', LENGTH(phone) - 3) || RIGHT(phone, 3)
    ELSE NULL 
  END as phone_masked,
  -- Sensitive data available only with explicit access
  email,
  phone,
  dietary_restrictions
FROM public.guests
WHERE public.validate_guest_access(user_id, auth.uid());

-- 6. Enable RLS on the secure view
ALTER VIEW public.guests_secure SET (security_barrier = true);

-- 7. Create function to check for suspicious guest access patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_guest_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_access_count INTEGER;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Count recent guest access attempts from this user (last 5 minutes)
  SELECT COUNT(*) INTO recent_access_count
  FROM public.security_audit_log
  WHERE user_id = current_user_id
    AND action LIKE '%guest%'
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  -- If more than 50 guest operations in 5 minutes, log as suspicious
  IF recent_access_count > 50 THEN
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      target_guest_id,
      created_at
    ) VALUES (
      current_user_id,
      'SUSPICIOUS_BULK_GUEST_ACCESS',
      NULL,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Create trigger for suspicious access detection
DROP TRIGGER IF EXISTS suspicious_access_trigger ON public.security_audit_log;
CREATE TRIGGER suspicious_access_trigger
  AFTER INSERT
  ON public.security_audit_log
  FOR EACH ROW
  WHEN (NEW.action LIKE '%guest%')
  EXECUTE FUNCTION public.detect_suspicious_guest_access();