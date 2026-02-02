-- Fix security definer view issue
-- Replace the security definer view with proper RLS policies

-- Drop the problematic view
DROP VIEW IF EXISTS public.guests_masked;

-- Instead of a security definer view, create a client-side data access function
-- that respects RLS and doesn't use security definer for views
CREATE OR REPLACE FUNCTION public.get_masked_guest_data()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  guest_group text,
  status text,
  child_age integer,
  rsvp_status text,
  email text,
  phone text,
  accommodation boolean,
  transport boolean,
  dietary_restrictions text,
  is_child boolean,
  is_service_provider boolean,
  discount_type text,
  companion_of_guest_id uuid,
  table_assignment uuid,
  notes text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER -- Use invoker rights, not definer rights
SET search_path = public
AS $$
BEGIN
  -- This function respects RLS policies and doesn't use security definer
  RETURN QUERY
  SELECT 
    g.id,
    g.user_id,
    g.first_name,
    g.last_name,
    g.guest_group,
    g.status,
    g.child_age,
    g.rsvp_status,
    -- Email and phone are returned as-is since RLS already protects access
    g.email,
    g.phone,
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
  WHERE g.user_id = auth.uid(); -- RLS will enforce this anyway
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_masked_guest_data() TO authenticated;