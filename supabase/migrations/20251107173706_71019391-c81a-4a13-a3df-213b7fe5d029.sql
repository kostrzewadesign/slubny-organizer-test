-- Set default empty strings for NOT NULL text columns in user_profiles
-- This prevents NULL constraint violations when creating or updating profiles

ALTER TABLE public.user_profiles 
  ALTER COLUMN bride_first_name SET DEFAULT '',
  ALTER COLUMN bride_last_name SET DEFAULT '',
  ALTER COLUMN groom_first_name SET DEFAULT '',
  ALTER COLUMN groom_last_name SET DEFAULT '',
  ALTER COLUMN location SET DEFAULT '',
  ALTER COLUMN notes SET DEFAULT '';

-- Ensure existing NULL values are replaced with empty strings
UPDATE public.user_profiles 
SET 
  bride_first_name = COALESCE(bride_first_name, ''),
  bride_last_name = COALESCE(bride_last_name, ''),
  groom_first_name = COALESCE(groom_first_name, ''),
  groom_last_name = COALESCE(groom_last_name, ''),
  location = COALESCE(location, ''),
  notes = COALESCE(notes, '')
WHERE 
  bride_first_name IS NULL 
  OR bride_last_name IS NULL 
  OR groom_first_name IS NULL 
  OR groom_last_name IS NULL 
  OR location IS NULL 
  OR notes IS NULL;