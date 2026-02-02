-- Enhanced security for wedding guest data protection
-- This migration adds comprehensive security measures for the guests table

-- 1. Create enhanced RLS policies with more specific restrictions
DROP POLICY IF EXISTS "Comprehensive guest protection" ON public.guests;

-- Create more granular policies for better security
CREATE POLICY "Users can view only their own guests"
ON public.guests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own guests"
ON public.guests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own guests"
ON public.guests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own guests"
ON public.guests
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 2. Create a function to validate guest data access (security definer)
CREATE OR REPLACE FUNCTION public.validate_guest_ownership(guest_id uuid, requesting_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the requesting user owns the guest record
  RETURN EXISTS (
    SELECT 1 FROM public.guests 
    WHERE id = guest_id AND user_id = requesting_user_id
  );
END;
$$;

-- 3. Create a secure view for guest data with masked sensitive information
CREATE OR REPLACE VIEW public.guests_masked AS
SELECT 
  g.id,
  g.user_id,
  g.first_name,
  g.last_name,
  g.guest_group,
  g.status,
  g.child_age,
  g.rsvp_status,
  -- Mask email and phone for additional security
  CASE 
    WHEN auth.uid() = g.user_id THEN g.email
    ELSE mask_guest_email(g.email)
  END as email,
  CASE 
    WHEN auth.uid() = g.user_id THEN g.phone
    ELSE mask_guest_phone(g.phone)
  END as phone,
  g.accommodation,
  g.transport,
  g.dietary_restrictions,
  g.is_child,
  g.is_service_provider,
  g.discount_type,
  g.companion_of_guest_id,
  g.table_assignment,
  g.notes,
  g.created_at,
  g.updated_at
FROM public.guests g
WHERE g.user_id = auth.uid();

-- Grant access to the masked view
GRANT SELECT ON public.guests_masked TO authenticated;

-- 4. Create additional security trigger for monitoring bulk operations
CREATE OR REPLACE FUNCTION public.monitor_bulk_guest_operations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  operation_count INTEGER;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required for guest operations';
  END IF;
  
  -- Count recent operations in the last minute
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
$$;

-- Create trigger for bulk operation monitoring
DROP TRIGGER IF EXISTS monitor_bulk_guest_operations_trigger ON public.guests;
CREATE TRIGGER monitor_bulk_guest_operations_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_bulk_guest_operations();

-- 5. Create function for secure guest data export (GDPR compliance)
CREATE OR REPLACE FUNCTION public.export_user_guest_data(requesting_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_data jsonb;
BEGIN
  -- Only allow users to export their own data
  IF requesting_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Can only export your own data';
  END IF;
  
  -- Collect guest data for the user
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'first_name', first_name,
      'last_name', last_name,
      'email', email,
      'phone', phone,
      'guest_group', guest_group,
      'rsvp_status', rsvp_status,
      'dietary_restrictions', dietary_restrictions,
      'notes', notes,
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) INTO guest_data
  FROM public.guests
  WHERE user_id = requesting_user_id;
  
  -- Log the data export
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    created_at
  ) VALUES (
    requesting_user_id,
    'GUEST_DATA_EXPORTED',
    NOW()
  );
  
  RETURN COALESCE(guest_data, '[]'::jsonb);
END;
$$;

-- 6. Enhanced data retention policy function
CREATE OR REPLACE FUNCTION public.cleanup_old_guest_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Archive guests older than 2 years (after wedding typically)
  -- This is commented out for now - implement based on business requirements
  /*
  DELETE FROM public.guests
  WHERE created_at < NOW() - INTERVAL '2 years'
    AND updated_at < NOW() - INTERVAL '1 year';
  */
  
  -- For now, just log that cleanup was attempted
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    created_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'GUEST_DATA_CLEANUP_EXECUTED',
    NOW()
  );
END;
$$;