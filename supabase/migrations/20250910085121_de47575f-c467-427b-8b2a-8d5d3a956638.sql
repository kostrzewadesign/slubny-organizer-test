-- Migrate remaining legacy RSVP statuses (idempotent)
UPDATE guests
SET rsvp_status = 'confirmed'
WHERE rsvp_status = 'attending';

-- Add unique constraint for table assignments to prevent double assignments
-- Use IF NOT EXISTS to make it idempotent
CREATE UNIQUE INDEX IF NOT EXISTS idx_table_assignments_guest_unique
ON table_assignments(guest_id)
WHERE guest_id IS NOT NULL;