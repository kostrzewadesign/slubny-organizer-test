-- First clean up invalid actions from audit log
DELETE FROM public.security_audit_log 
WHERE action NOT IN (
  'INSERT_guest', 'UPDATE_guest', 'DELETE_guest', 'SELECT_guest',
  'ADMIN_INSERT_guest', 'ADMIN_UPDATE_guest', 'ADMIN_DELETE_guest',
  'BULK_GUEST_OPERATIONS_DETECTED', 'SUSPICIOUS_BULK_GUEST_ACCESS',
  'GUEST_DATA_EXPORTED', 'GUEST_DATA_CLEANUP_EXECUTED',
  'USER_ACCOUNT_DELETED', 'ADMIN_USER_DATA_CLEANUP',
  'INSERT_expense', 'UPDATE_expense', 'DELETE_expense', 'SELECT_expense',
  'INSERT_task', 'UPDATE_task', 'DELETE_task', 'SELECT_task',
  'INSERT_table', 'UPDATE_table', 'DELETE_table', 'SELECT_table',
  'USER_LOGIN', 'USER_LOGOUT', 'DATA_EXPORT', 'PROFILE_UPDATE'
);

-- Drop the existing constraint
ALTER TABLE public.security_audit_log DROP CONSTRAINT IF EXISTS valid_audit_actions;

-- Add updated constraint with all valid actions
ALTER TABLE public.security_audit_log ADD CONSTRAINT valid_audit_actions 
CHECK (action IN (
  'INSERT_guest', 'UPDATE_guest', 'DELETE_guest', 'SELECT_guest',
  'ADMIN_INSERT_guest', 'ADMIN_UPDATE_guest', 'ADMIN_DELETE_guest',
  'BULK_GUEST_OPERATIONS_DETECTED', 'SUSPICIOUS_BULK_GUEST_ACCESS',
  'GUEST_DATA_EXPORTED', 'GUEST_DATA_CLEANUP_EXECUTED',
  'USER_ACCOUNT_DELETED', 'ADMIN_USER_DATA_CLEANUP',
  'INSERT_expense', 'UPDATE_expense', 'DELETE_expense', 'SELECT_expense',
  'INSERT_task', 'UPDATE_task', 'DELETE_task', 'SELECT_task',
  'INSERT_table', 'UPDATE_table', 'DELETE_table', 'SELECT_table',
  'USER_LOGIN', 'USER_LOGOUT', 'DATA_EXPORT', 'PROFILE_UPDATE'
));