-- Fix conflicting RSVP status constraints
ALTER TABLE public.guests DROP CONSTRAINT IF EXISTS guests_rsvp_status_check;

-- Keep only the valid_rsvp_status constraint that allows 'sent' status
-- This constraint allows: 'sent', 'confirmed', 'declined', 'pending', 'attending'