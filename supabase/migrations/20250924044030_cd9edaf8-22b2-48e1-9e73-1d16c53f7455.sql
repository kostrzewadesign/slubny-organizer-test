-- Fix null discount_type values and improve add_guest_with_companion function
UPDATE guests SET discount_type = 'none' WHERE discount_type IS NULL;

-- Recreate add_guest_with_companion function with better validation
CREATE OR REPLACE FUNCTION public.add_guest_with_companion(p_user_id uuid, p_guest jsonb, p_companion jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_guest_id uuid;
  v_companion_id uuid;
BEGIN
  -- Sprawdź czy user_id jest zgodny z auth.uid()
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  -- Log the data being processed for debugging
  RAISE NOTICE 'Processing guest data: %', p_guest;
  IF p_companion IS NOT NULL THEN
    RAISE NOTICE 'Processing companion data: %', p_companion;
  END IF;

  -- Dodaj głównego gościa
  INSERT INTO guests (
    user_id, 
    first_name, 
    last_name, 
    email, 
    phone, 
    guest_group, 
    rsvp_status,
    accommodation,
    transport,
    dietary_restrictions,
    notes,
    is_child,
    is_service_provider,
    discount_type
  ) VALUES (
    p_user_id,
    COALESCE(TRIM(p_guest->>'first_name'), ''),
    COALESCE(TRIM(p_guest->>'last_name'), ''),
    NULLIF(TRIM(p_guest->>'email'), ''),
    NULLIF(TRIM(p_guest->>'phone'), ''),
    COALESCE(p_guest->>'guest_group', 'family'),
    COALESCE(p_guest->>'rsvp_status', 'pending'),
    COALESCE((p_guest->>'accommodation')::boolean, false),
    COALESCE((p_guest->>'transport')::boolean, false),
    NULLIF(TRIM(p_guest->>'dietary_restrictions'), ''),
    NULLIF(TRIM(p_guest->>'notes'), ''),
    COALESCE((p_guest->>'is_child')::boolean, false),
    COALESCE((p_guest->>'is_service_provider')::boolean, false),
    COALESCE(p_guest->>'discount_type', 'none')
  ) RETURNING id INTO v_guest_id;

  -- Dodaj towarzysza jeśli podany
  IF p_companion IS NOT NULL THEN
    INSERT INTO guests (
      user_id, 
      first_name, 
      last_name, 
      email, 
      phone, 
      guest_group, 
      rsvp_status,
      accommodation,
      transport,
      dietary_restrictions,
      notes,
      companion_of_guest_id,
      is_child,
      is_service_provider,
      discount_type
    ) VALUES (
      p_user_id,
      COALESCE(TRIM(p_companion->>'first_name'), ''),
      COALESCE(TRIM(p_companion->>'last_name'), ''),
      NULLIF(TRIM(p_companion->>'email'), ''),
      NULLIF(TRIM(p_companion->>'phone'), ''),
      COALESCE(p_companion->>'guest_group', 'family'),
      COALESCE(p_companion->>'rsvp_status', 'pending'),
      COALESCE((p_companion->>'accommodation')::boolean, false),
      COALESCE((p_companion->>'transport')::boolean, false),
      NULLIF(TRIM(p_companion->>'dietary_restrictions'), ''),
      NULLIF(TRIM(p_companion->>'notes'), ''),
      v_guest_id,
      COALESCE((p_companion->>'is_child')::boolean, false),
      COALESCE((p_companion->>'is_service_provider')::boolean, false),
      COALESCE(p_companion->>'discount_type', 'none')
    ) RETURNING id INTO v_companion_id;
  END IF;

  RETURN v_guest_id;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in add_guest_with_companion: %', SQLERRM;
  RAISE; -- Rollback automatyczny
END;
$function$;