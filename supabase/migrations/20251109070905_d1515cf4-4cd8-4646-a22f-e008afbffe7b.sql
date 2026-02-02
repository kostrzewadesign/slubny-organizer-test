-- Add SELECT policy for security_audit_log
-- Allows users to view their own security audit history

CREATE POLICY "audit_log_user_select"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

COMMENT ON POLICY "audit_log_user_select" ON public.security_audit_log IS 
'Allows authenticated users to view their own security audit logs for transparency and self-monitoring';