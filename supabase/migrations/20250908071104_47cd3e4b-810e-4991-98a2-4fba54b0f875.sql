-- Fix security warnings: add search_path to security functions
-- This ensures functions operate in a secure context

-- Update the rate limiting function with proper search_path
CREATE OR REPLACE FUNCTION security.check_guest_operation_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'security', 'public'
AS $$
DECLARE
  current_user_id UUID;
  operation_count INTEGER;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- CRITICAL FIX: Allow system operations (CASCADE DELETE from Dashboard)
  -- When auth.uid() is NULL, this is a system operation and should be allowed
  IF current_user_id IS NULL THEN
    -- This is a system operation (like CASCADE DELETE), allow it
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- For regular user operations, apply rate limiting
  -- Count operations in the last minute
  SELECT COUNT(*) INTO operation_count
  FROM public.security_audit_log
  WHERE user_id = current_user_id
    AND action LIKE '%guest%'
    AND created_at > NOW() - INTERVAL '1 minute';
  
  -- Rate limit: if more than 50 operations per minute, block
  IF operation_count > 50 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many guest operations. Please slow down.';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update the sanitization function with proper search_path
CREATE OR REPLACE FUNCTION security.enhanced_sanitize_guest_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'security', 'public'
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- CRITICAL FIX: Allow system operations (CASCADE DELETE from Dashboard)
  -- When auth.uid() is NULL, this is a system operation and should be allowed
  IF current_user_id IS NULL THEN
    -- This is a system operation, allow it without authentication check
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- For regular user operations, apply normal sanitization
  -- Sanitize input data (basic HTML tag removal)
  IF NEW.first_name IS NOT NULL THEN
    NEW.first_name = regexp_replace(trim(NEW.first_name), '<[^>]*>', '', 'g');
  END IF;
  
  IF NEW.last_name IS NOT NULL THEN
    NEW.last_name = regexp_replace(trim(NEW.last_name), '<[^>]*>', '', 'g');
  END IF;
  
  IF NEW.email IS NOT NULL THEN
    NEW.email = regexp_replace(trim(NEW.email), '<[^>]*>', '', 'g');
  END IF;
  
  IF NEW.phone IS NOT NULL THEN
    NEW.phone = regexp_replace(trim(NEW.phone), '<[^>]*>', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$$;