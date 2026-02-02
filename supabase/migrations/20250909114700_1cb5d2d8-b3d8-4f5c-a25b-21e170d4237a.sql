-- The rsvp_status column is currently text, not an enum
-- First, check current values in use
SELECT DISTINCT rsvp_status FROM public.guests WHERE rsvp_status IS NOT NULL;

-- Create enum type for RSVP status with all values used by the app
CREATE TYPE public.rsvp_status_enum AS ENUM ('sent', 'confirmed', 'declined', 'pending', 'attending');

-- Update the guests table to use the enum (with fallback for existing data)
UPDATE public.guests SET rsvp_status = 'pending' WHERE rsvp_status IS NULL OR rsvp_status = '';
UPDATE public.guests SET rsvp_status = 'confirmed' WHERE rsvp_status = 'attending';

-- Add constraint to ensure only valid values
ALTER TABLE public.guests ADD CONSTRAINT valid_rsvp_status 
CHECK (rsvp_status IN ('sent', 'confirmed', 'declined', 'pending', 'attending'));

-- Check payment_status_new enum and add missing value
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'deposit_only' AND enumtypid = 'public.payment_status_new'::regtype) THEN
        ALTER TYPE public.payment_status_new ADD VALUE 'deposit_only';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON public.guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_guests_user_rsvp ON public.guests(user_id, rsvp_status);
CREATE INDEX IF NOT EXISTS idx_expenses_user_payment ON public.expenses(user_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_expenses_user_amount ON public.expenses(user_id, amount, paid_amount, deposit_amount);