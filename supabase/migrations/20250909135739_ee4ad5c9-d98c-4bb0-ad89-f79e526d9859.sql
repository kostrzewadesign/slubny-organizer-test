-- Set default values for guest attributes to prevent null inserts
ALTER TABLE public.guests ALTER COLUMN accommodation SET DEFAULT false;
ALTER TABLE public.guests ALTER COLUMN transport SET DEFAULT false;
ALTER TABLE public.guests ALTER COLUMN is_child SET DEFAULT false;
ALTER TABLE public.guests ALTER COLUMN is_service_provider SET DEFAULT false;
ALTER TABLE public.guests ALTER COLUMN child_age SET DEFAULT NULL;

-- Update any existing null values to false
UPDATE public.guests SET accommodation = false WHERE accommodation IS NULL;
UPDATE public.guests SET transport = false WHERE transport IS NULL;
UPDATE public.guests SET is_child = false WHERE is_child IS NULL;
UPDATE public.guests SET is_service_provider = false WHERE is_service_provider IS NULL;