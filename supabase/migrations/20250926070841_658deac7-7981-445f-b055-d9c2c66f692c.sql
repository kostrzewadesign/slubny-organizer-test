-- Fix the add_guest_with_companion RPC function to work in read-write transactions
CREATE OR REPLACE FUNCTION public.add_guest_with_companion(p_user_id uuid, p_guest jsonb, p_companion jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_guest_id uuid;
  v_final_user_id uuid;
BEGIN
  -- Allow both authenticated and anonymous users temporarily
  IF v_caller IS NOT NULL THEN
    -- Authenticated user: enforce user_id match
    IF p_user_id IS NULL OR p_user_id != v_caller THEN
      RAISE EXCEPTION 'Unauthorized: user mismatch for authenticated user'
        USING ERRCODE = '28000';
    END IF;
    v_final_user_id := v_caller;
  ELSE
    -- Anonymous user: allow null user_id for temporary fallback
    v_final_user_id := NULL;
    
    -- Log anonymous guest creation for audit
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      created_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      'ANONYMOUS_GUEST_CREATED',
      NOW()
    );
  END IF;

  -- Insert main guest
  INSERT INTO public.guests (
    id, 
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
    coalesce((p_guest->>'id')::uuid, gen_random_uuid()),
    v_final_user_id,
    p_guest->>'first_name',
    p_guest->>'last_name',
    nullif(trim(p_guest->>'email'), ''),
    nullif(trim(p_guest->>'phone'), ''),
    coalesce(p_guest->>'guest_group', 'family'),
    coalesce(p_guest->>'rsvp_status', 'pending'),
    coalesce((p_guest->>'accommodation')::boolean, false),
    coalesce((p_guest->>'transport')::boolean, false),
    nullif(trim(p_guest->>'dietary_restrictions'), ''),
    nullif(trim(p_guest->>'notes'), ''),
    coalesce((p_guest->>'is_child')::boolean, false),
    coalesce((p_guest->>'is_service_provider')::boolean, false),
    coalesce(p_guest->>'discount_type', 'none')
  ) RETURNING id INTO v_guest_id;

  -- Insert companion if provided
  IF p_companion IS NOT NULL THEN
    INSERT INTO public.guests (
      id,
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
      coalesce((p_companion->>'id')::uuid, gen_random_uuid()),
      v_final_user_id,
      p_companion->>'first_name',
      p_companion->>'last_name',
      nullif(trim(p_companion->>'email'), ''),
      nullif(trim(p_companion->>'phone'), ''),
      coalesce(p_companion->>'guest_group', p_guest->>'guest_group', 'family'),
      coalesce(p_companion->>'rsvp_status', 'pending'),
      coalesce((p_companion->>'accommodation')::boolean, false),
      coalesce((p_companion->>'transport')::boolean, false),
      nullif(trim(p_companion->>'dietary_restrictions'), ''),
      nullif(trim(p_companion->>'notes'), ''),
      v_guest_id,
      coalesce((p_companion->>'is_child')::boolean, false),
      coalesce((p_companion->>'is_service_provider')::boolean, false),
      coalesce(p_companion->>'discount_type', 'none')
    );
  END IF;

  RETURN jsonb_build_object('guest_id', v_guest_id, 'success', true);
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE EXCEPTION 'RLS blocked insert. Check authentication status.'
      USING ERRCODE = '42501';
  WHEN OTHERS THEN
    RAISE;
END;
$function$;