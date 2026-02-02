-- 1. Add CHECK constraint to ensure names are not blank after trimming
ALTER TABLE guests 
ADD CONSTRAINT guests_name_not_blank_chk 
CHECK (length(trim(first_name)) > 0 AND length(trim(last_name)) > 0);

-- 2. Rewrite add_guest_with_companion function with proper NULLIF validation
CREATE OR REPLACE FUNCTION public.add_guest_with_companion(
  p_user_id uuid, 
  p_guest jsonb, 
  p_companion jsonb DEFAULT NULL::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_guest_first   text := NULLIF(trim(p_guest->>'first_name'), '');
  v_guest_last    text := NULLIF(trim(p_guest->>'last_name'), '');
  v_guest_email   text := NULLIF(trim(p_guest->>'email'), '');
  v_guest_phone   text := NULLIF(trim(p_guest->>'phone'), '');
  v_guest_notes   text := NULLIF(trim(p_guest->>'notes'), '');
  v_guest_dietary text := NULLIF(trim(p_guest->>'dietary_restrictions'), '');
  v_guest_id      uuid;
  v_comp_first    text;
  v_comp_last     text;
  v_comp_email    text;
  v_comp_phone    text;
  v_comp_notes    text;
  v_comp_dietary  text;
  v_comp_id       uuid;
BEGIN
  -- Verify user authorization
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized access'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- Validate required guest fields
  IF v_guest_first IS NULL OR v_guest_last IS NULL THEN
    RAISE EXCEPTION 'first_name and last_name are required and cannot be empty'
      USING ERRCODE = '23514'; -- check_violation
  END IF;

  -- Log guest data for debugging
  RAISE NOTICE 'Creating guest: % %', v_guest_first, v_guest_last;

  -- Insert main guest
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
    v_guest_first,
    v_guest_last,
    v_guest_email,
    v_guest_phone,
    COALESCE(p_guest->>'guest_group', 'family'),
    COALESCE(p_guest->>'rsvp_status', 'pending'),
    COALESCE((p_guest->>'accommodation')::boolean, false),
    COALESCE((p_guest->>'transport')::boolean, false),
    v_guest_dietary,
    v_guest_notes,
    COALESCE((p_guest->>'is_child')::boolean, false),
    COALESCE((p_guest->>'is_service_provider')::boolean, false),
    COALESCE(p_guest->>'discount_type', 'none')
  ) RETURNING id INTO v_guest_id;

  -- Insert companion if provided
  IF p_companion IS NOT NULL THEN
    v_comp_first := NULLIF(trim(p_companion->>'first_name'), '');
    v_comp_last := NULLIF(trim(p_companion->>'last_name'), '');
    v_comp_email := NULLIF(trim(p_companion->>'email'), '');
    v_comp_phone := NULLIF(trim(p_companion->>'phone'), '');
    v_comp_notes := NULLIF(trim(p_companion->>'notes'), '');
    v_comp_dietary := NULLIF(trim(p_companion->>'dietary_restrictions'), '');

    -- Validate companion required fields
    IF v_comp_first IS NULL OR v_comp_last IS NULL THEN
      RAISE EXCEPTION 'companion first_name and last_name are required and cannot be empty'
        USING ERRCODE = '23514'; -- check_violation
    END IF;

    RAISE NOTICE 'Creating companion: % %', v_comp_first, v_comp_last;

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
      v_comp_first,
      v_comp_last,
      v_comp_email,
      v_comp_phone,
      COALESCE(p_companion->>'guest_group', p_guest->>'guest_group', 'family'),
      COALESCE(p_companion->>'rsvp_status', 'pending'),
      COALESCE((p_companion->>'accommodation')::boolean, false),
      COALESCE((p_companion->>'transport')::boolean, false),
      v_comp_dietary,
      v_comp_notes,
      v_guest_id,
      COALESCE((p_companion->>'is_child')::boolean, false),
      COALESCE((p_companion->>'is_service_provider')::boolean, false),
      COALESCE(p_companion->>'discount_type', 'none')
    ) RETURNING id INTO v_comp_id;
  END IF;

  RETURN v_guest_id;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in add_guest_with_companion: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RAISE; -- Re-raise the exception
END;
$$;