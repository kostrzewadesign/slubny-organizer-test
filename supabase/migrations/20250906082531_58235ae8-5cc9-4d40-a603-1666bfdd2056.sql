-- Security fixes: Clean up redundant RLS policies and restrict template access

-- 1. Remove redundant guest RLS policies (keep only the comprehensive one)
DROP POLICY IF EXISTS "Users can view own guests" ON public.guests;
DROP POLICY IF EXISTS "Users can insert own guests" ON public.guests;
DROP POLICY IF EXISTS "Users can update own guests" ON public.guests;
DROP POLICY IF EXISTS "Users can delete own guests" ON public.guests;

-- The "Comprehensive guest protection" policy already covers all operations

-- 2. Fix wedding templates access - restrict to authenticated users only for specific operations
DROP POLICY IF EXISTS "Templates are readable by authenticated users" ON public.wedding_templates;
DROP POLICY IF EXISTS "Service role can manage templates" ON public.wedding_templates;

-- Create more restrictive template policies
CREATE POLICY "Authenticated users can read templates"
ON public.wedding_templates
FOR SELECT
TO authenticated
USING (true);

-- Only service role can manage templates (for initial setup)
CREATE POLICY "Service role manages templates"
ON public.wedding_templates
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Add security for suspicious activity tracking
-- Create function to clean up old audit logs (data retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Keep only last 30 days of audit logs
  DELETE FROM public.security_audit_log
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;