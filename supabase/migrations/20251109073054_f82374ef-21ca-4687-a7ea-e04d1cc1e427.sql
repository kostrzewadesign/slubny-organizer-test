-- ============================================================================
-- MIGRATION: Disable Anonymous Guests & Clean RLS Policies
-- ============================================================================
-- Purpose: Completely eliminate anonymous guest creation and enforce 
--          authenticated-only access with clean, simple RLS policies
-- ============================================================================

-- 1. DELETE ORPHANED ANONYMOUS GUESTS (if any exist)
DELETE FROM public.guests WHERE user_id IS NULL;

-- 2. DROP ANONYMOUS GUEST POLICY
DROP POLICY IF EXISTS "temp_anonymous_guest_insert" ON public.guests;

-- 3. DROP OLD POLICIES (verbose names)
DROP POLICY IF EXISTS "guests_secure_delete_policy" ON public.guests;
DROP POLICY IF EXISTS "guests_secure_insert_policy" ON public.guests;
DROP POLICY IF EXISTS "guests_secure_select_policy" ON public.guests;
DROP POLICY IF EXISTS "guests_secure_update_policy" ON public.guests;

-- 4. CREATE NEW, CLEAN POLICIES - AUTHENTICATED USERS ONLY

-- INSERT: Users can only insert their own guests
CREATE POLICY "guests_insert_owner_only"
ON public.guests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- SELECT: Users can only view their own guests
CREATE POLICY "guests_select_owner_only"
ON public.guests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- UPDATE: Users can only update their own guests
CREATE POLICY "guests_update_owner_only"
ON public.guests
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Users can only delete their own guests
CREATE POLICY "guests_delete_owner_only"
ON public.guests
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 5. SERVICE ROLE POLICY (for admin operations)
CREATE POLICY "guests_service_role_all"
ON public.guests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. ADD DOCUMENTATION COMMENTS
COMMENT ON POLICY "guests_insert_owner_only" ON public.guests IS 
'Allows authenticated users to insert only their own guests. Anonymous access completely disabled.';

COMMENT ON POLICY "guests_select_owner_only" ON public.guests IS 
'Allows authenticated users to view only their own guests. Ensures data isolation.';

COMMENT ON POLICY "guests_update_owner_only" ON public.guests IS 
'Allows authenticated users to update only their own guests. Prevents privilege escalation.';

COMMENT ON POLICY "guests_delete_owner_only" ON public.guests IS 
'Allows authenticated users to delete only their own guests. Prevents unauthorized deletions.';

COMMENT ON POLICY "guests_service_role_all" ON public.guests IS 
'Allows service role full access for administrative operations and data cleanup.';

-- 7. VERIFY user_id IS NOT NULL (it already is, but document the requirement)
COMMENT ON COLUMN public.guests.user_id IS 
'User ID is NOT NULL. All guests must belong to an authenticated user. Anonymous guests are not allowed.';

-- ============================================================================
-- Migration complete. All guests now require authentication.
-- Anonymous guest creation is completely disabled.
-- ============================================================================