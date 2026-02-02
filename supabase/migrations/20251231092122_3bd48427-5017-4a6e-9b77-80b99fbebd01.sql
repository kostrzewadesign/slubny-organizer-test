-- Add initialization markers to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS tasks_initialized boolean DEFAULT false;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS expenses_initialized boolean DEFAULT false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_init_flags 
ON user_profiles(user_id, tasks_initialized, expenses_initialized);