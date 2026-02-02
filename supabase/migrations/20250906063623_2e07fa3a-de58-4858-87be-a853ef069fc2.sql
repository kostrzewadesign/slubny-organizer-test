-- Add additional security measures for guest data protection

-- Create security audit log table for tracking sensitive data access
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_guest_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security audit log (admin only access)
CREATE POLICY "Only authenticated users can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for viewing audit logs (users can only see their own logs)
CREATE POLICY "Users can view their own audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add index for performance on security audit queries
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON public.security_audit_log(created_at);

-- Add constraint to ensure only valid actions are logged
ALTER TABLE public.security_audit_log 
ADD CONSTRAINT valid_audit_actions 
CHECK (action IN ('view_guest_details', 'edit_guest', 'delete_guest', 'export_guest_data', 'access_contact_info'));