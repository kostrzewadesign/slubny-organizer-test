-- Security Hardening Phase 1: Immediate Fixes

-- 1. Secure the public schema by removing CREATE permissions
REVOKE CREATE ON SCHEMA public FROM anon;
REVOKE CREATE ON SCHEMA public FROM authenticated;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Grant only USAGE (not CREATE) to these roles
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO PUBLIC;

-- Ensure service_role retains full permissions
GRANT ALL ON SCHEMA public TO service_role;

-- 2. Set secure default search_path for database roles
ALTER ROLE anon SET search_path = pg_catalog, public;
ALTER ROLE authenticated SET search_path = pg_catalog, public;

-- 3. Create enhanced password validation function
CREATE OR REPLACE FUNCTION public.validate_password_security(password_input text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Check minimum length
  IF LENGTH(password_input) < 8 THEN
    RETURN false;
  END IF;
  
  -- Check for uppercase, lowercase, and digit
  IF NOT (password_input ~ '[A-Z]' AND password_input ~ '[a-z]' AND password_input ~ '[0-9]') THEN
    RETURN false;
  END IF;
  
  -- Check against expanded compromised passwords list
  IF password_input = ANY(ARRAY[
    '123456', 'password', '12345678', 'qwerty', '123456789', '12345',
    '1234', '111111', '1234567', 'dragon', '123123', 'baseball',
    'abc123', 'football', 'monkey', 'letmein', 'shadow', 'master',
    '666666', 'qwertyuiop', '123321', 'mustang', '1234567890',
    'michael', '654321', 'superman', '1qaz2wsx', '7777777',
    '121212', '000000', 'qazwsx', '123qwe', 'killer', 'trustno1',
    'jordan', 'jennifer', 'zxcvbnm', 'asdfgh', 'hunter', 'buster',
    'soccer', 'harley', 'batman', 'andrew', 'tigger', 'sunshine',
    'iloveyou', 'fuckme', '2000', 'charlie', 'robert', 'thomas',
    'hockey', 'ranger', 'daniel', 'starwars', 'klaster', '112233',
    'george', 'asshole', 'computer', 'michelle', 'jessica', 'pepper',
    '1111', 'zxcvbn', '555555', '11111111', '131313', 'freedom',
    '777777', 'pass', 'fuck', 'maggie', '159753', 'aaaaaa',
    'ginger', 'princess', 'joshua', 'cheese', 'amanda', 'summer',
    'love', 'ashley', '6969', 'nicole', 'chelsea', 'biteme',
    'matthew', 'access', 'yankees', '987654321', 'dallas',
    'austin', 'thunder', 'taylor', 'matrix', 'william',
    'corvette', 'hello', 'martin', 'heather', 'secret',
    'Password1', 'admin', 'root', 'user', 'test', 'demo'
  ]) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 4. Create function to log security events with enhanced details
CREATE OR REPLACE FUNCTION public.log_enhanced_security_event(
  event_action text,
  event_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Insert into security audit log with enhanced details
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    target_guest_id,
    created_at
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    event_action,
    (event_details->>'target_guest_id')::uuid,
    NOW()
  );
EXCEPTION WHEN OTHERS THEN
  -- Log failure but don't block operation
  RAISE WARNING 'Failed to log security event: %', SQLERRM;
END;
$$;

-- 5. Create RLS verification function
CREATE OR REPLACE FUNCTION public.verify_rls_isolation()
RETURNS TABLE(
  table_name text,
  rls_enabled boolean,
  policy_count bigint,
  test_result text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.relname::text as table_name,
    c.relrowsecurity as rls_enabled,
    COUNT(pol.polname) as policy_count,
    CASE 
      WHEN c.relrowsecurity AND COUNT(pol.polname) > 0 THEN 'SECURE'
      WHEN c.relrowsecurity AND COUNT(pol.polname) = 0 THEN 'RLS_NO_POLICIES'
      WHEN NOT c.relrowsecurity THEN 'RLS_DISABLED'
      ELSE 'UNKNOWN'
    END as test_result
  FROM pg_class c
  LEFT JOIN pg_policies pol ON pol.tablename = c.relname
  WHERE c.relname IN ('guests', 'tasks', 'expenses', 'tables', 'user_profiles', 'security_audit_log')
    AND c.relkind = 'r'
  GROUP BY c.relname, c.relrowsecurity
  ORDER BY c.relname;
END;
$$;

-- 6. Create trigger for password validation on auth operations
-- Note: This would typically be done in auth schema but we'll log attempts
CREATE OR REPLACE FUNCTION public.monitor_auth_attempts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Log authentication attempts for monitoring
  PERFORM public.log_enhanced_security_event(
    'AUTH_ATTEMPT_MONITORED',
    jsonb_build_object(
      'timestamp', NOW(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    )
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block auth on logging failure
  RETURN NEW;
END;
$$;

-- 7. Enhanced monitoring for privilege escalation attempts
CREATE OR REPLACE FUNCTION public.detect_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  current_user_id uuid;
  suspicious_pattern boolean := false;
BEGIN
  current_user_id := auth.uid();
  
  -- Detect potential privilege escalation patterns
  IF TG_OP = 'UPDATE' AND current_user_id IS NOT NULL THEN
    -- Check if user is trying to modify data they shouldn't
    IF (TG_TABLE_NAME = 'user_profiles' AND NEW.user_id != current_user_id) OR
       (TG_TABLE_NAME = 'guests' AND NEW.user_id != current_user_id) OR
       (TG_TABLE_NAME = 'tasks' AND NEW.user_id != current_user_id) OR
       (TG_TABLE_NAME = 'expenses' AND NEW.user_id != current_user_id) THEN
      suspicious_pattern := true;
    END IF;
  END IF;
  
  IF suspicious_pattern THEN
    PERFORM public.log_enhanced_security_event(
      'PRIVILEGE_ESCALATION_ATTEMPT',
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'attempted_user_id', NEW.user_id,
        'actual_user_id', current_user_id
      )
    );
    
    -- Block the operation
    RAISE EXCEPTION 'Unauthorized privilege escalation attempt detected';
  END IF;
  
  RETURN NEW;
END;
$$;