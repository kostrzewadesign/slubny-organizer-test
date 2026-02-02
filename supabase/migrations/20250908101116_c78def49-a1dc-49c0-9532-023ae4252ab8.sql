-- Add setup_completed column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN setup_completed_at TIMESTAMPTZ;

-- Update existing profiles to mark them as completed if they have basic data
UPDATE public.user_profiles 
SET setup_completed = TRUE, 
    setup_completed_at = NOW() 
WHERE bride_name IS NOT NULL 
  AND bride_name != '' 
  AND groom_name IS NOT NULL 
  AND groom_name != '' 
  AND wedding_date IS NOT NULL;