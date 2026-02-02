-- Fix existing bride/groom entries with empty last_name
UPDATE public.guests 
SET last_name = 'Panna Młoda'
WHERE role = 'bride' 
  AND (last_name IS NULL OR last_name = '');

UPDATE public.guests 
SET last_name = 'Pan Młody'
WHERE role = 'groom' 
  AND (last_name IS NULL OR last_name = '');

-- Add comment for documentation
COMMENT ON COLUMN public.guests.last_name IS 'Last name of guest. For bride/groom roles, defaults to "Panna Młoda"/"Pan Młody" if not provided.';