-- Enhanced security measures for guest contact information protection
-- First, drop ALL existing policies to avoid conflicts

-- Drop all existing guest policies
DROP POLICY IF EXISTS "Enhanced guest view policy" ON public.guests;
DROP POLICY IF EXISTS "Enhanced guest insert policy" ON public.guests;
DROP POLICY IF EXISTS "Enhanced guest update policy" ON public.guests;
DROP POLICY IF EXISTS "Enhanced guest delete policy" ON public.guests;
DROP POLICY IF EXISTS "Users can view only their own guests" ON public.guests;
DROP POLICY IF EXISTS "Users can insert only their own guests" ON public.guests;
DROP POLICY IF EXISTS "Users can update only their own guests" ON public.guests;
DROP POLICY IF EXISTS "Users can delete only their own guests" ON public.guests;

-- Drop all existing expense policies
DROP POLICY IF EXISTS "Secure expense view policy" ON public.expenses;
DROP POLICY IF EXISTS "Secure expense insert policy" ON public.expenses;
DROP POLICY IF EXISTS "Secure expense update policy" ON public.expenses;
DROP POLICY IF EXISTS "Secure expense delete policy" ON public.expenses;
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

-- Drop all existing audit log policies
DROP POLICY IF EXISTS "Users can view own audit logs readonly" ON public.security_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Prevent audit log modifications" ON public.security_audit_log;
DROP POLICY IF EXISTS "Prevent audit log deletion" ON public.security_audit_log;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Only authenticated users can insert audit logs" ON public.security_audit_log;

-- 1. Create data validation and sanitization functions
CREATE OR REPLACE FUNCTION public.encrypt_guest_data(raw_data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Basic sanitization - remove any potential script tags or suspicious content
  IF raw_data IS NULL OR LENGTH(trim(raw_data)) = 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN regexp_replace(trim(raw_data), '<[^>]*>', '', 'g');
END;
$$;

-- 2. Create email validation function
CREATE OR REPLACE FUNCTION public.validate_email_format(email_input text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF email_input IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check basic email format and prevent malicious patterns
  RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND LENGTH(email_input) <= 254
    AND email_input !~* '(script|javascript|vbscript|onload|onerror)';
END;
$$;

-- 3. Create phone validation function
CREATE OR REPLACE FUNCTION public.validate_phone_format(phone_input text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF phone_input IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove all non-numeric characters except + and spaces
  RETURN regexp_replace(phone_input, '[^0-9+\s-]', '', 'g');
END;
$$;

-- 4. Create comprehensive security policies for guests table
CREATE POLICY "guests_secure_select_policy" 
ON public.guests 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "guests_secure_insert_policy" 
ON public.guests 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
  AND (SELECT COUNT(*) FROM public.guests WHERE user_id = auth.uid()) < 500
);

CREATE POLICY "guests_secure_update_policy" 
ON public.guests 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "guests_secure_delete_policy" 
ON public.guests 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 5. Create secure policies for expenses table
CREATE POLICY "expenses_secure_select_policy" 
ON public.expenses 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "expenses_secure_insert_policy" 
ON public.expenses 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
  AND (SELECT COUNT(*) FROM public.expenses WHERE user_id = auth.uid()) < 1000
);

CREATE POLICY "expenses_secure_update_policy" 
ON public.expenses 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "expenses_secure_delete_policy" 
ON public.expenses 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 6. Create tamper-proof audit log policies
CREATE POLICY "audit_log_readonly_select" 
ON public.security_audit_log 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "audit_log_insert_only" 
ON public.security_audit_log 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Explicitly prevent tampering with audit logs
CREATE POLICY "audit_log_no_updates" 
ON public.security_audit_log 
FOR UPDATE 
TO authenticated
USING (false);

CREATE POLICY "audit_log_no_deletes" 
ON public.security_audit_log 
FOR DELETE 
TO authenticated
USING (false);