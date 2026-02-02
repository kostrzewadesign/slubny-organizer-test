-- Fix security functions to allow admin operations

-- Update monitor_bulk_guest_operations to allow service_role operations
CREATE OR REPLACE FUNCTION public.monitor_bulk_guest_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  operation_count INTEGER;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Allow service_role operations (admin operations from dashboard)
  IF current_user_id IS NULL THEN
    -- Log admin operation but don't block it
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      target_guest_id,
      created_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      'ADMIN_' || TG_OP || '_guest',
      COALESCE(NEW.id, OLD.id),
      NOW()
    );
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Count recent operations in the last minute for authenticated users
  SELECT COUNT(*) INTO operation_count
  FROM public.security_audit_log
  WHERE user_id = current_user_id
    AND action LIKE '%guest%'
    AND created_at > NOW() - INTERVAL '1 minute';
  
  -- If more than 10 operations per minute, log as suspicious
  IF operation_count > 10 THEN
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      target_guest_id,
      created_at
    ) VALUES (
      current_user_id,
      'BULK_GUEST_OPERATIONS_DETECTED',
      COALESCE(NEW.id, OLD.id),
      NOW()
    );
    
    -- Rate limit: reject operation if more than 20 per minute
    IF operation_count > 20 THEN
      RAISE EXCEPTION 'Rate limit exceeded for guest operations. Please slow down.';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update log_guest_data_changes to handle admin operations
CREATE OR REPLACE FUNCTION public.log_guest_data_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id UUID;
  log_user_id UUID;
  log_action TEXT;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- Handle admin operations (service_role) vs user operations
  IF current_user_id IS NULL THEN
    -- Admin operation from dashboard
    log_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
    log_action := 'ADMIN_' || TG_OP || '_guest';
  ELSE
    -- Regular user operation
    log_user_id := current_user_id;
    log_action := TG_OP || '_guest';
  END IF;
  
  -- Log the operation (with error handling to prevent blocking normal operations)
  BEGIN
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      target_guest_id,
      created_at
    ) VALUES (
      log_user_id,
      log_action,
      COALESCE(NEW.id, OLD.id),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- If logging fails, don't block the operation
    -- Log to system log instead
    RAISE WARNING 'Failed to log guest data change: %', SQLERRM;
  END;
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Create triggers for the updated functions (if they don't exist)
DO $$
BEGIN
  -- Check if trigger exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'monitor_bulk_guest_operations_trigger'
  ) THEN
    CREATE TRIGGER monitor_bulk_guest_operations_trigger
      BEFORE INSERT OR UPDATE OR DELETE ON public.guests
      FOR EACH ROW EXECUTE FUNCTION public.monitor_bulk_guest_operations();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'log_guest_data_changes_trigger'
  ) THEN
    CREATE TRIGGER log_guest_data_changes_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.guests
      FOR EACH ROW EXECUTE FUNCTION public.log_guest_data_changes();
  END IF;
END $$;