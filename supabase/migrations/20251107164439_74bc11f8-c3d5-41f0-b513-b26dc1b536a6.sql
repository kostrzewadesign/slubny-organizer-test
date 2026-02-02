-- Step 1: Modify the guests constraint to only require first_name
ALTER TABLE guests DROP CONSTRAINT IF EXISTS guests_name_not_blank_chk;

ALTER TABLE guests 
ADD CONSTRAINT guests_name_not_blank_chk 
CHECK (length(trim(first_name)) > 0);

-- Step 2: Update handle_new_user function to explicitly set onboarding and setup flags
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
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
    setup_completed
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
    false   -- Explicitly set setup as not completed
  )
  RETURNING id INTO profile_id;

  RETURN NEW;
END;
$$;