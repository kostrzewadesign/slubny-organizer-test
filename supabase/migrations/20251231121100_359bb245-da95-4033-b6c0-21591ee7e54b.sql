-- Add has_seen_welcome_modal column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS has_seen_welcome_modal BOOLEAN DEFAULT false;

-- For existing users who completed setup, set to true (they don't need to see it)
UPDATE public.user_profiles 
SET has_seen_welcome_modal = true 
WHERE setup_completed = true;

-- Update handle_new_user function to initialize the new column
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  profile_id UUID;
BEGIN
  -- Create user profile with explicit onboarding and setup flags
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
  VALUES (
    NEW.id, 
    '', 
    '', 
    50000, 
    '', 
    50, 
    '',
    false,  -- Explicitly set onboarding as not completed
    false,  -- Explicitly set setup as not completed
    false   -- Explicitly set welcome modal as not seen
  )
  RETURNING id INTO profile_id;

  RETURN NEW;
END;
$function$;