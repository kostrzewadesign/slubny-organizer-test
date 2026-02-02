-- Remove problematic constraints that prevent multiple guests/tables
ALTER TABLE public.guests DROP CONSTRAINT IF EXISTS unique_user_role;
ALTER TABLE public.tables DROP CONSTRAINT IF EXISTS unique_user_table_type;

-- Add partial unique indexes for special roles only
-- Ensure only one bride per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_bride 
ON public.guests (user_id) 
WHERE role = 'bride';

-- Ensure only one groom per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_groom 
ON public.guests (user_id) 
WHERE role = 'groom';

-- No constraint on tables since all types can have multiple instances
-- Users can create as many regular, vip, children, or service tables as needed