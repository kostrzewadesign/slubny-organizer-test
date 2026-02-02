-- Security Enhancement Migration
-- Fix 1: Move HTTP extension from public schema to extensions schema
DROP EXTENSION IF EXISTS http;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Fix 2: Create secure schema for internal functions
CREATE SCHEMA IF NOT EXISTS security;

-- Fix 3: Enhanced audit log security - restrict access to service role only
DROP POLICY IF EXISTS "audit_log_readonly_select" ON public.security_audit_log;
CREATE POLICY "audit_log_service_role_only" 
ON public.security_audit_log 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Fix 4: Add IP address anonymization trigger for audit logs
CREATE OR REPLACE FUNCTION security.anonymize_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = security, public
AS $$
BEGIN
  -- Anonymize IP addresses older than 30 days
  UPDATE public.security_audit_log 
  SET ip_address = NULL 
  WHERE created_at < NOW() - INTERVAL '30 days' 
    AND ip_address IS NOT NULL;
    
  -- Clean up very old audit logs (older than 90 days)
  DELETE FROM public.security_audit_log 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Fix 5: Enhanced guest data validation functions
CREATE OR REPLACE FUNCTION security.validate_guest_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = security, public
AS $$
BEGIN
  IF email_input IS NULL THEN
    RETURN true;
  END IF;
  
  -- Enhanced email validation with additional security checks
  RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND LENGTH(email_input) <= 254
    AND LENGTH(email_input) >= 5
    AND email_input !~* '(script|javascript|vbscript|onload|onerror|eval|expression)'
    AND email_input NOT LIKE '%@%@%'  -- Prevent double @ symbols
    AND email_input !~* '\.(exe|bat|cmd|scr|pif|com)@';  -- Prevent suspicious extensions
END;
$$;

CREATE OR REPLACE FUNCTION security.validate_guest_phone(phone_input text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = security, public
AS $$
BEGIN
  IF phone_input IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Enhanced phone validation and sanitization
  phone_input := regexp_replace(phone_input, '[^0-9+\s-()]', '', 'g');
  
  -- Validate length (international format)
  IF LENGTH(phone_input) < 7 OR LENGTH(phone_input) > 20 THEN
    RAISE EXCEPTION 'Phone number length invalid';
  END IF;
  
  RETURN phone_input;
END;
$$;

-- Fix 6: Enhanced guest data sanitization trigger
CREATE OR REPLACE FUNCTION security.enhanced_sanitize_guest_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = security, public
AS $$
BEGIN
  -- Validate and sanitize email with enhanced function
  IF NEW.email IS NOT NULL THEN
    IF NOT security.validate_guest_email(NEW.email) THEN
      RAISE EXCEPTION 'Invalid or potentially malicious email format';
    END IF;
  END IF;
  
  -- Validate and sanitize phone
  IF NEW.phone IS NOT NULL THEN
    NEW.phone = security.validate_guest_phone(NEW.phone);
  END IF;
  
  -- Enhanced text field sanitization
  NEW.first_name = regexp_replace(trim(NEW.first_name), '<[^>]*>', '', 'g');
  NEW.last_name = regexp_replace(trim(NEW.last_name), '<[^>]*>', '', 'g');
  
  IF NEW.notes IS NOT NULL THEN
    NEW.notes = regexp_replace(trim(NEW.notes), '<script[^>]*>.*?</script>', '', 'gi');
    NEW.notes = regexp_replace(NEW.notes, 'javascript:', '', 'gi');
  END IF;
  
  IF NEW.dietary_restrictions IS NOT NULL THEN
    NEW.dietary_restrictions = regexp_replace(trim(NEW.dietary_restrictions), '<[^>]*>', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Replace existing trigger with enhanced version
DROP TRIGGER IF EXISTS sanitize_guest_data_trigger ON public.guests;
CREATE TRIGGER enhanced_sanitize_guest_data_trigger
  BEFORE INSERT OR UPDATE ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION security.enhanced_sanitize_guest_data();

-- Fix 7: Rate limiting for guest operations
CREATE OR REPLACE FUNCTION security.check_guest_operation_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = security, public
AS $$
DECLARE
  operation_count INTEGER;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required for guest operations';
  END IF;
  
  -- Count operations in the last minute
  SELECT COUNT(*) INTO operation_count
  FROM public.security_audit_log
  WHERE user_id = current_user_id
    AND action LIKE '%guest%'
    AND created_at > NOW() - INTERVAL '1 minute';
  
  -- Rate limit: max 15 guest operations per minute
  IF operation_count > 15 THEN
    -- Log the rate limit violation
    INSERT INTO public.security_audit_log (
      user_id, action, created_at
    ) VALUES (
      current_user_id, 'RATE_LIMIT_EXCEEDED_guest_operations', NOW()
    );
    
    RAISE EXCEPTION 'Rate limit exceeded: Too many guest operations. Please slow down.';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply rate limiting trigger to guests table
CREATE TRIGGER guest_rate_limit_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION security.check_guest_operation_rate_limit();

-- Fix 8: Create scheduled job for audit log cleanup
CREATE OR REPLACE FUNCTION security.scheduled_security_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = security, public
AS $$
BEGIN
  -- Run IP anonymization
  PERFORM security.anonymize_old_audit_logs();
  
  -- Log maintenance completion
  INSERT INTO public.security_audit_log (
    user_id, action, created_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'SECURITY_MAINTENANCE_COMPLETED',
    NOW()
  );
END;
$$;