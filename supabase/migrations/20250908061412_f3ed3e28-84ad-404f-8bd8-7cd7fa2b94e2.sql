-- Fix security triggers blocking admin user deletion operations

-- Update the security function to allow service_role operations
CREATE OR REPLACE FUNCTION security.check_guest_operation_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'security', 'public'
AS $function$
DECLARE
  current_user_id UUID;
  operation_count INTEGER;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Allow service_role operations (admin operations from dashboard)
  IF current_user_id IS NULL AND auth.role() = 'service_role' THEN
    -- Log admin operation but don't block it
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      target_guest_id,
      created_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      'ADMIN_GUEST_OPERATION',
      COALESCE(NEW.id, OLD.id),
      NOW()
    );
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- For regular users, require authentication
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required for guest operations';
  END IF;
  
  -- Count recent operations for authenticated users
  SELECT COUNT(*) INTO operation_count
  FROM public.security_audit_log
  WHERE user_id = current_user_id
    AND action LIKE '%guest%'
    AND created_at > NOW() - INTERVAL '1 minute';
  
  -- Rate limiting for regular users
  IF operation_count > 50 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Too many guest operations.';
  END IF;
  
  -- Log the operation
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    target_guest_id,
    created_at
  ) VALUES (
    current_user_id,
    TG_OP || '_guest',
    COALESCE(NEW.id, OLD.id),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update the sanitization function to allow service_role operations
CREATE OR REPLACE FUNCTION security.enhanced_sanitize_guest_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'security', 'public'
AS $function$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Allow service_role operations (admin operations from dashboard)
  IF current_user_id IS NULL AND auth.role() = 'service_role' THEN
    -- For admin operations, minimal sanitization but allow operation
    IF NEW.email IS NOT NULL THEN
      NEW.email := trim(NEW.email);
    END IF;
    IF NEW.phone IS NOT NULL THEN
      NEW.phone := trim(NEW.phone);
    END IF;
    RETURN NEW;
  END IF;
  
  -- For regular users, require authentication
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required for guest operations';
  END IF;
  
  -- Enhanced sanitization for regular users
  IF NEW.email IS NOT NULL THEN
    -- Basic email validation and sanitization
    NEW.email := lower(trim(NEW.email));
    IF NOT NEW.email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format';
    END IF;
  END IF;
  
  IF NEW.phone IS NOT NULL THEN
    -- Phone sanitization - remove non-numeric characters except + and spaces
    NEW.phone := regexp_replace(trim(NEW.phone), '[^0-9+\s-]', '', 'g');
  END IF;
  
  -- Sanitize text fields
  IF NEW.first_name IS NOT NULL THEN
    NEW.first_name := trim(NEW.first_name);
  END IF;
  
  IF NEW.last_name IS NOT NULL THEN
    NEW.last_name := trim(NEW.last_name);
  END IF;
  
  IF NEW.notes IS NOT NULL THEN
    NEW.notes := trim(NEW.notes);
  END IF;
  
  IF NEW.dietary_restrictions IS NOT NULL THEN
    NEW.dietary_restrictions := trim(NEW.dietary_restrictions);
  END IF;
  
  RETURN NEW;
END;
$function$;