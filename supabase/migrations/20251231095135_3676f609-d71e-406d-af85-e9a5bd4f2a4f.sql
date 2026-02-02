-- Fix 1: Add JSONB validation helper function for guest data
CREATE OR REPLACE FUNCTION public.validate_guest_jsonb(guest_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
BEGIN
  -- Check payload size limit (prevent DoS)
  IF length(guest_data::text) > 10000 THEN
    RAISE EXCEPTION 'Payload too large (max 10KB)';
  END IF;
  
  -- Check required field exists
  IF NOT (guest_data ? 'first_name') THEN
    RAISE EXCEPTION 'Missing required field: first_name';
  END IF;
  
  -- Validate field lengths
  IF length(coalesce(guest_data->>'first_name', '')) > 100 THEN
    RAISE EXCEPTION 'first_name too long (max 100 characters)';
  END IF;
  
  IF length(coalesce(guest_data->>'last_name', '')) > 100 THEN
    RAISE EXCEPTION 'last_name too long (max 100 characters)';
  END IF;
  
  IF length(coalesce(guest_data->>'email', '')) > 254 THEN
    RAISE EXCEPTION 'email too long (max 254 characters)';
  END IF;
  
  IF length(coalesce(guest_data->>'phone', '')) > 30 THEN
    RAISE EXCEPTION 'phone too long (max 30 characters)';
  END IF;
  
  IF length(coalesce(guest_data->>'notes', '')) > 1000 THEN
    RAISE EXCEPTION 'notes too long (max 1000 characters)';
  END IF;
  
  IF length(coalesce(guest_data->>'dietary_restrictions', '')) > 500 THEN
    RAISE EXCEPTION 'dietary_restrictions too long (max 500 characters)';
  END IF;
  
  -- Validate boolean fields if present
  IF guest_data ? 'accommodation' AND 
     NOT (guest_data->>'accommodation' IN ('true', 'false', NULL)) THEN
    RAISE EXCEPTION 'Invalid boolean value for accommodation';
  END IF;
  
  IF guest_data ? 'transport' AND 
     NOT (guest_data->>'transport' IN ('true', 'false', NULL)) THEN
    RAISE EXCEPTION 'Invalid boolean value for transport';
  END IF;
  
  IF guest_data ? 'is_child' AND 
     NOT (guest_data->>'is_child' IN ('true', 'false', NULL)) THEN
    RAISE EXCEPTION 'Invalid boolean value for is_child';
  END IF;
  
  RETURN true;
END;
$$;

-- Fix 2: Update init_default_expenses_if_needed with strict auth check
CREATE OR REPLACE FUNCTION public.init_default_expenses_if_needed()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
DECLARE
  inserted_count integer := 0;
  current_user_id uuid;
BEGIN
  -- Strict authentication check
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  
  -- Check if user already has expenses
  IF EXISTS (SELECT 1 FROM public.expenses WHERE user_id = current_user_id LIMIT 1) THEN
    RETURN 0;
  END IF;
  
  -- Insert default expenses from templates
  WITH ins AS (
    INSERT INTO public.expenses (user_id, title, category, amount, payment_status, created_at)
    SELECT 
      current_user_id,
      wt.title,
      wt.category,
      0,
      CASE 
        WHEN wt.payment_status = 'planned' THEN 'none'::public.payment_status_new
        WHEN wt.payment_status = 'paid' THEN 'paid'::public.payment_status_new
        WHEN wt.payment_status = 'deposit_paid' THEN 'deposit_paid'::public.payment_status_new
        ELSE 'none'::public.payment_status_new
      END,
      NOW()
    FROM public.wedding_templates wt
    WHERE wt.template_type = 'expense'
    ORDER BY wt.order_index
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM ins;
  
  RETURN inserted_count;
END;
$$;

-- Fix 3: Update init_default_tasks_if_needed with strict auth check
CREATE OR REPLACE FUNCTION public.init_default_tasks_if_needed()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
DECLARE
  inserted_count integer := 0;
  current_user_id uuid;
BEGIN
  -- Strict authentication check
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  
  -- Check if user already has tasks
  IF EXISTS (SELECT 1 FROM public.tasks WHERE user_id = current_user_id LIMIT 1) THEN
    RETURN 0;
  END IF;
  
  -- Insert default tasks from templates
  WITH ins AS (
    INSERT INTO public.tasks (user_id, title, description, category, is_priority, completed, created_at)
    SELECT 
      current_user_id,
      wt.title,
      wt.description,
      wt.category,
      COALESCE(wt.is_priority, false),
      false,
      NOW()
    FROM public.wedding_templates wt
    WHERE wt.template_type = 'task'
    ORDER BY wt.order_index
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM ins;
  
  RETURN inserted_count;
END;
$$;

-- Fix 4: Update budget_summary with caller verification
CREATE OR REPLACE FUNCTION public.budget_summary(p_user_id uuid)
RETURNS TABLE(total numeric, paid numeric, remaining numeric, deposit_paid numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Verify caller owns the data
  current_user_id := auth.uid();
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID required' USING ERRCODE = '22023';
  END IF;
  
  IF current_user_id IS NULL OR p_user_id != current_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access other users data' USING ERRCODE = '28000';
  END IF;
  
  RETURN QUERY
  SELECT
    COALESCE(SUM(e.amount), 0) as total,
    COALESCE(SUM(CASE WHEN e.payment_status = 'paid' THEN e.amount ELSE 0 END), 0) as paid,
    COALESCE(SUM(CASE WHEN e.payment_status = 'none' THEN e.amount ELSE 0 END), 0) as remaining,
    COALESCE(SUM(CASE WHEN e.payment_status = 'deposit_paid' THEN e.deposit_amount ELSE 0 END), 0) as deposit_paid
  FROM public.expenses e
  WHERE e.user_id = p_user_id;
END;
$$;

-- Fix 5: Update add_guest_with_companion with JSONB validation and strict auth (remove anonymous fallback)
CREATE OR REPLACE FUNCTION public.add_guest_with_companion(p_user_id uuid, p_guest jsonb, p_companion jsonb DEFAULT NULL::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_guest_id uuid;
BEGIN
  -- Strict authentication - no anonymous access allowed
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  
  -- Verify user_id matches authenticated user
  IF p_user_id IS NULL OR p_user_id != v_caller THEN
    RAISE EXCEPTION 'Unauthorized: user mismatch' USING ERRCODE = '28000';
  END IF;
  
  -- Validate guest JSONB payload
  PERFORM public.validate_guest_jsonb(p_guest);
  
  -- Validate companion JSONB payload if provided
  IF p_companion IS NOT NULL THEN
    PERFORM public.validate_guest_jsonb(p_companion);
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
    v_caller,
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
      v_caller,
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
    RAISE EXCEPTION 'RLS blocked insert. Check authentication status.' USING ERRCODE = '42501';
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Fix 6: Update log_enhanced_security_event with proper search_path and input validation
CREATE OR REPLACE FUNCTION public.log_enhanced_security_event(event_action text, event_details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
BEGIN
  -- Validate input length to prevent DoS
  IF length(event_action) > 100 THEN
    RAISE EXCEPTION 'Event action too long (max 100 characters)';
  END IF;
  
  IF length(event_details::text) > 5000 THEN
    RAISE EXCEPTION 'Event details too large (max 5KB)';
  END IF;
  
  -- Insert into security audit log with enhanced details
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    target_guest_id,
    created_at
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    event_action,
    (event_details->>'target_guest_id')::uuid,
    NOW()
  );
EXCEPTION WHEN OTHERS THEN
  -- Log failure but don't block operation
  RAISE WARNING 'Failed to log security event: %', SQLERRM;
END;
$$;

-- Fix 7: Update reset_expenses_to_defaults with proper search_path
CREATE OR REPLACE FUNCTION public.reset_expenses_to_defaults()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
DECLARE
  inserted_count integer := 0;
  current_user_id uuid;
BEGIN
  -- Strict authentication check
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  
  -- Delete existing expenses atomically, then insert defaults
  DELETE FROM public.expenses WHERE user_id = current_user_id;
  
  WITH ins AS (
    INSERT INTO public.expenses (user_id, title, category, amount, payment_status, created_at)
    SELECT 
      current_user_id,
      wt.title,
      wt.category,
      0,
      CASE 
        WHEN wt.payment_status = 'planned' THEN 'none'::public.payment_status_new
        WHEN wt.payment_status = 'paid' THEN 'paid'::public.payment_status_new
        WHEN wt.payment_status = 'deposit_paid' THEN 'deposit_paid'::public.payment_status_new
        ELSE 'none'::public.payment_status_new
      END,
      NOW()
    FROM public.wedding_templates wt
    WHERE wt.template_type = 'expense'
    ORDER BY wt.order_index
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM ins;
  
  RETURN inserted_count;
END;
$$;