-- Fix RSVP status enum - add missing values used by the app
ALTER TYPE public.rsvp_status ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE public.rsvp_status ADD VALUE IF NOT EXISTS 'confirmed'; 
ALTER TYPE public.rsvp_status ADD VALUE IF NOT EXISTS 'declined';
ALTER TYPE public.rsvp_status ADD VALUE IF NOT EXISTS 'pending';

-- Fix payment status enum - add missing 'deposit_only' value
ALTER TYPE public.payment_status_new ADD VALUE IF NOT EXISTS 'deposit_only';

-- Migrate existing 'attending' data to 'confirmed' for consistency
UPDATE public.guests 
SET rsvp_status = 'confirmed' 
WHERE rsvp_status = 'attending';

-- Update any default values to use consistent enum values
ALTER TABLE public.guests ALTER COLUMN rsvp_status SET DEFAULT 'pending';

-- Create index for better performance on RSVP filtering
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON public.guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_guests_user_rsvp ON public.guests(user_id, rsvp_status);

-- Create index for budget aggregations
CREATE INDEX IF NOT EXISTS idx_expenses_user_payment ON public.expenses(user_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_expenses_user_amount ON public.expenses(user_id, amount, paid_amount, deposit_amount);