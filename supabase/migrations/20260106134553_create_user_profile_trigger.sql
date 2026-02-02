-- Create trigger to automatically create user profile on signup
-- This fixes the issue where user_profiles were not being created automatically

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that calls handle_new_user function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: Create profiles for existing users who don't have one
-- This ensures all existing users have a profile
INSERT INTO public.user_profiles (
  user_id,
  bride_name,
  groom_name,
  total_budget,
  location,
  guest_count,
  notes,
  has_completed_onboarding,
  setup_completed,
  has_seen_welcome_modal
)
SELECT
  u.id,
  '',
  '',
  50000,
  '',
  50,
  '',
  false,
  false,
  false
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Log result
DO $$
DECLARE
  backfilled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backfilled_count
  FROM auth.users u
  LEFT JOIN public.user_profiles p ON u.id = p.user_id
  WHERE p.user_id IS NULL;

  RAISE NOTICE 'User profile trigger created. Backfilled % profiles.', backfilled_count;
END $$;
