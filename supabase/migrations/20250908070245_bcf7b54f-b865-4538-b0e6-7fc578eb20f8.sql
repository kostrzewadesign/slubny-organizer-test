-- Fix user deletion by expanding valid_audit_actions constraint
-- The current constraint only allows guest-related actions, but system actions are needed

-- Drop the existing constraint
ALTER TABLE public.security_audit_log 
DROP CONSTRAINT IF EXISTS valid_audit_actions;

-- Add the expanded constraint that includes system actions
ALTER TABLE public.security_audit_log 
ADD CONSTRAINT valid_audit_actions 
CHECK (action = ANY (ARRAY[
  -- Guest-related actions (existing)
  'view_guest_details'::text, 
  'edit_guest'::text, 
  'delete_guest'::text, 
  'export_guest_data'::text, 
  'access_contact_info'::text,
  -- System/User management actions (new)
  'USER_ACCOUNT_DELETED'::text,
  'ADMIN_USER_DATA_CLEANUP'::text,
  'USER_SIGNOUT_INITIATED'::text,
  'USER_SESSION_ENDED'::text,
  'user_authenticated'::text,
  'session_timeout_detected'::text,
  'user_session_ended'::text,
  -- Admin actions (new)
  'ADMIN_INSERT_guest'::text,
  'ADMIN_UPDATE_guest'::text,
  'ADMIN_DELETE_guest'::text,
  'INSERT_guest'::text,
  'UPDATE_guest'::text,
  'DELETE_guest'::text,
  'BULK_GUEST_OPERATIONS_DETECTED'::text,
  'SUSPICIOUS_BULK_GUEST_ACCESS'::text,
  'GUEST_DATA_EXPORTED'::text,
  'GUEST_DATA_CLEANUP_EXECUTED'::text
]));