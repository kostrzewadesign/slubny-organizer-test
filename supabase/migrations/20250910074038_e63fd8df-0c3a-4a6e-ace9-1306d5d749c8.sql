-- Migration: Standardize RSVP statuses from 'attending' to 'confirmed'
-- This ensures consistency across the application

-- Check current status distribution before migration
DO $$
DECLARE
    total_attending INTEGER;
    total_confirmed INTEGER;
    total_sent INTEGER;
    total_pending INTEGER;
BEGIN
    -- Count current statuses
    SELECT COUNT(*) INTO total_attending FROM guests WHERE rsvp_status = 'attending';
    SELECT COUNT(*) INTO total_confirmed FROM guests WHERE rsvp_status = 'confirmed';
    SELECT COUNT(*) INTO total_sent FROM guests WHERE rsvp_status = 'sent';
    SELECT COUNT(*) INTO total_pending FROM guests WHERE rsvp_status = 'pending';
    
    -- Log current state
    RAISE NOTICE 'RSVP Migration Report - BEFORE:';
    RAISE NOTICE '- attending: % records', total_attending;
    RAISE NOTICE '- confirmed: % records', total_confirmed; 
    RAISE NOTICE '- sent: % records', total_sent;
    RAISE NOTICE '- pending: % records', total_pending;
END $$;

-- Perform the migration: attending -> confirmed
UPDATE guests 
SET rsvp_status = 'confirmed' 
WHERE rsvp_status = 'attending';

-- Log final state
DO $$
DECLARE
    total_attending INTEGER;
    total_confirmed INTEGER;
    total_sent INTEGER;
    total_pending INTEGER;
    migrated_count INTEGER;
BEGIN
    -- Count after migration
    SELECT COUNT(*) INTO total_attending FROM guests WHERE rsvp_status = 'attending';
    SELECT COUNT(*) INTO total_confirmed FROM guests WHERE rsvp_status = 'confirmed';
    SELECT COUNT(*) INTO total_sent FROM guests WHERE rsvp_status = 'sent';
    SELECT COUNT(*) INTO total_pending FROM guests WHERE rsvp_status = 'pending';
    
    -- Calculate migrated records (should be 0 attending now)
    migrated_count := total_confirmed;
    
    -- Log final state
    RAISE NOTICE 'RSVP Migration Report - AFTER:';
    RAISE NOTICE '- attending: % records (should be 0)', total_attending;
    RAISE NOTICE '- confirmed: % records', total_confirmed;
    RAISE NOTICE '- sent: % records', total_sent;
    RAISE NOTICE '- pending: % records', total_pending;
    RAISE NOTICE 'Migration completed successfully';
END $$;