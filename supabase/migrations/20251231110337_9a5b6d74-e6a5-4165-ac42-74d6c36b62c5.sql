-- Add has_paid column to track payment status
ALTER TABLE user_profiles 
ADD COLUMN has_paid boolean DEFAULT false;