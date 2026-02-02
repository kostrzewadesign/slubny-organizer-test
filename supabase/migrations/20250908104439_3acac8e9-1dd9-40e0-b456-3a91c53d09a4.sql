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

-- Convert existing table_type column to use the new ENUM (if needed)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'table_type' AND data_type = 'text') THEN
        -- First update existing data to valid enum values
        UPDATE public.tables SET table_type = 'regular' WHERE table_type NOT IN ('main_couple', 'regular') OR table_type IS NULL;
        
        -- Change column type to use enum
        ALTER TABLE public.tables ALTER COLUMN table_type TYPE table_type USING table_type::table_type;
        ALTER TABLE public.tables ALTER COLUMN table_type SET DEFAULT 'regular';
    END IF;
END $$;

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

-- Update existing data to set default roles
UPDATE public.guests SET role = 'guest' WHERE role IS NULL;

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