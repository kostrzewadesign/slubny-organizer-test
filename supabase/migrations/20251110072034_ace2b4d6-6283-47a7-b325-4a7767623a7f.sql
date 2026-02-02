-- Make last_name nullable to allow single-name guests
ALTER TABLE public.guests ALTER COLUMN last_name DROP NOT NULL;

-- Update empty strings to NULL for consistency
UPDATE public.guests SET last_name = NULL WHERE last_name = '';

-- Add a comment for clarity
COMMENT ON COLUMN public.guests.last_name IS 'Optional - guests can have only first name';