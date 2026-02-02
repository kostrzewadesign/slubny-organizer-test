-- Sprawdź użytkowników i ich profile
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created,
  p.has_completed_onboarding,
  p.setup_completed,
  p.bride_first_name,
  p.groom_first_name,
  p.total_budget,
  p.created_at as profile_created,
  p.updated_at as profile_updated
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC
LIMIT 5;
