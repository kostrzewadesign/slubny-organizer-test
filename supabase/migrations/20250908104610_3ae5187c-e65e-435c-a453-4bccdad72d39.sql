-- Create ENUM types for guest roles and table types
DO $$ BEGIN
    CREATE TYPE guest_role AS ENUM ('bride', 'groom', 'guest', 'vendor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE table_type AS ENUM ('main_couple', 'regular');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to guests table (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guests' AND column_name = 'role') THEN
        ALTER TABLE public.guests ADD COLUMN role guest_role DEFAULT 'guest';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guests' AND column_name = 'is_linked_to_profile') THEN
        ALTER TABLE public.guests ADD COLUMN is_linked_to_profile boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guests' AND column_name = 'special_icon') THEN
        ALTER TABLE public.guests ADD COLUMN special_icon text;
    END IF;
END $$;

-- Add seat_number to table_assignments (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'table_assignments' AND column_name = 'seat_number') THEN
        ALTER TABLE public.table_assignments ADD COLUMN seat_number integer;
    END IF;
END $$;

-- Handle table_type column conversion more carefully
DO $$
BEGIN
    -- First, create a new column with the enum type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'table_type_new') THEN
        ALTER TABLE public.tables ADD COLUMN table_type_new table_type DEFAULT 'regular';
        
        -- Copy existing data, mapping text values to enum
        UPDATE public.tables 
        SET table_type_new = CASE 
            WHEN table_type = 'main_couple' THEN 'main_couple'::table_type
            ELSE 'regular'::table_type
        END;
        
        -- Drop the old column and rename the new one
        ALTER TABLE public.tables DROP COLUMN table_type;
        ALTER TABLE public.tables RENAME COLUMN table_type_new TO table_type;
    END IF;
END $$;

-- Add first/last name columns to user_profiles (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bride_first_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN bride_first_name text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bride_last_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN bride_last_name text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'groom_first_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN groom_first_name text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'groom_last_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN groom_last_name text;
    END IF;
END $$;

-- Clean up any duplicate guests before adding constraints
-- Keep only the latest record for each user_id, role combination
DELETE FROM public.guests 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, role) id
    FROM public.guests
    ORDER BY user_id, role, created_at DESC
);

-- Update existing data
UPDATE public.guests SET role = 'guest' WHERE role IS NULL;

-- Add UNIQUE constraints for idempotency (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_user_role') THEN
        ALTER TABLE public.guests ADD CONSTRAINT unique_user_role UNIQUE (user_id, role) DEFERRABLE INITIALLY DEFERRED;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_user_table_type') THEN
        ALTER TABLE public.tables ADD CONSTRAINT unique_user_table_type UNIQUE (user_id, table_type) DEFERRABLE INITIALLY DEFERRED;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_table_seat') THEN
        ALTER TABLE public.table_assignments ADD CONSTRAINT unique_table_seat UNIQUE (table_id, seat_number) DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;

-- Migrate existing data from bride_name and groom_name (only where new columns are empty)
UPDATE public.user_profiles 
SET bride_first_name = SPLIT_PART(bride_name, ' ', 1),
    bride_last_name = CASE 
        WHEN ARRAY_LENGTH(STRING_TO_ARRAY(bride_name, ' '), 1) > 1 
        THEN TRIM(SUBSTRING(bride_name FROM POSITION(' ' IN bride_name) + 1))
        ELSE NULL
    END
WHERE (bride_first_name IS NULL OR bride_first_name = '') 
  AND bride_name IS NOT NULL AND bride_name != '';

UPDATE public.user_profiles 
SET groom_first_name = SPLIT_PART(groom_name, ' ', 1),
    groom_last_name = CASE 
        WHEN ARRAY_LENGTH(STRING_TO_ARRAY(groom_name, ' '), 1) > 1 
        THEN TRIM(SUBSTRING(groom_name FROM POSITION(' ' IN groom_name) + 1))
        ELSE NULL
    END
WHERE (groom_first_name IS NULL OR groom_first_name = '') 
  AND groom_name IS NOT NULL AND groom_name != '';