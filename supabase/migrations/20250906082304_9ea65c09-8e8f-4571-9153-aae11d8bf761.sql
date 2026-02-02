-- Fix security definer view issue by removing the problematic view
-- and implementing safer alternatives

-- 1. Remove the security definer view
DROP VIEW IF EXISTS public.guests_secure;

-- 2. Create a safer function for data masking without security definer
CREATE OR REPLACE FUNCTION public.mask_guest_email(email_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF email_input IS NULL OR email_input = '' THEN
    RETURN NULL;
  END IF;
  
  IF LENGTH(email_input) <= 6 THEN
    RETURN REPEAT('*', LENGTH(email_input));
  END IF;
  
  RETURN LEFT(email_input, 2) || REPEAT('*', LENGTH(email_input) - 6) || RIGHT(email_input, 4);
END;
$$;

-- 3. Create a safer function for phone masking
CREATE OR REPLACE FUNCTION public.mask_guest_phone(phone_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF phone_input IS NULL OR phone_input = '' THEN
    RETURN NULL;
  END IF;
  
  IF LENGTH(phone_input) <= 3 THEN
    RETURN REPEAT('*', LENGTH(phone_input));
  END IF;
  
  RETURN REPEAT('*', LENGTH(phone_input) - 3) || RIGHT(phone_input, 3);
END;
$$;

-- 4. Update the enhanced RLS policy to be the primary validation
-- (Remove the old one first to avoid conflicts)
DROP POLICY IF EXISTS "Enhanced guest access validation" ON public.guests;

-- Create a comprehensive policy that combines all protections
CREATE POLICY "Comprehensive guest protection"
ON public.guests
FOR ALL
TO authenticated
USING (
  -- User can only access their own guests
  user_id = auth.uid()
  -- Additional validation could be added here for future enhancements
)
WITH CHECK (
  -- User can only create/modify guests for themselves
  user_id = auth.uid()
);

-- 5. Keep the logging functions but make them more lightweight
-- Update the guest data change logging to be less intrusive
CREATE OR REPLACE FUNCTION public.log_guest_data_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- Only log if we have a valid user session
  IF current_user_id IS NOT NULL THEN
    -- Log the operation (with error handling to prevent blocking normal operations)
    BEGIN
      INSERT INTO public.security_audit_log (
        user_id,
        action,
        target_guest_id,
        created_at
      ) VALUES (
        current_user_id,
        TG_OP || '_guest',
        COALESCE(NEW.id, OLD.id),
        NOW()
      );
    EXCEPTION WHEN OTHERS THEN
      -- If logging fails, don't block the operation
      -- Log to system log instead
      RAISE WARNING 'Failed to log guest data change: %', SQLERRM;
    END;
  END IF;
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 6. Keep existing audit trigger but make it more resilient
DROP TRIGGER IF EXISTS guest_data_audit_trigger ON public.guests;
CREATE TRIGGER guest_data_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_guest_data_changes();