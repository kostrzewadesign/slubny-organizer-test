-- Security fixes: Clean up redundant RLS policies

-- 1. Remove redundant guest RLS policies (keep only the comprehensive one)
DROP POLICY IF EXISTS "Users can view own guests" ON public.guests;
DROP POLICY IF EXISTS "Users can insert own guests" ON public.guests;
DROP POLICY IF EXISTS "Users can update own guests" ON public.guests;
DROP POLICY IF EXISTS "Users can delete own guests" ON public.guests;

-- The "Comprehensive guest protection" policy already covers all operations

-- 2. Add security function for audit log cleanup (data retention)
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