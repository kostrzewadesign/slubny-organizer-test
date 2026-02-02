-- Create ENUM types for guest roles and table types
CREATE TYPE guest_role AS ENUM ('bride', 'groom', 'guest', 'vendor');
CREATE TYPE table_type AS ENUM ('main_couple', 'regular');

-- Add new columns to guests table
ALTER TABLE public.guests 
ADD COLUMN role guest_role DEFAULT 'guest',
ADD COLUMN is_linked_to_profile boolean DEFAULT false,
ADD COLUMN special_icon text;

-- Add new columns to tables table
ALTER TABLE public.tables 
ADD COLUMN table_type table_type DEFAULT 'regular';

-- Add seat_number to table_assignments
ALTER TABLE public.table_assignments 
ADD COLUMN seat_number integer;

-- Add UNIQUE constraints for idempotency
ALTER TABLE public.guests 
ADD CONSTRAINT unique_user_role UNIQUE (user_id, role) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.tables 
ADD CONSTRAINT unique_user_table_type UNIQUE (user_id, table_type) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.table_assignments 
ADD CONSTRAINT unique_table_seat UNIQUE (table_id, seat_number) DEFERRABLE INITIALLY DEFERRED;

-- Update existing data to set default roles
UPDATE public.guests SET role = 'guest' WHERE role IS NULL;

-- Update existing tables to be regular type
UPDATE public.tables SET table_type = 'regular' WHERE table_type IS NULL;

-- Add bride_first_name, bride_last_name, groom_first_name, groom_last_name to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN bride_first_name text,
ADD COLUMN bride_last_name text,
ADD COLUMN groom_first_name text,
ADD COLUMN groom_last_name text;

-- Migrate existing data from bride_name and groom_name
UPDATE public.user_profiles 
SET bride_first_name = SPLIT_PART(bride_name, ' ', 1),
    bride_last_name = CASE 
        WHEN ARRAY_LENGTH(STRING_TO_ARRAY(bride_name, ' '), 1) > 1 
        THEN TRIM(SUBSTRING(bride_name FROM POSITION(' ' IN bride_name) + 1))
        ELSE NULL
    END
WHERE bride_name IS NOT NULL AND bride_name != '';

UPDATE public.user_profiles 
SET groom_first_name = SPLIT_PART(groom_name, ' ', 1),
    groom_last_name = CASE 
        WHEN ARRAY_LENGTH(STRING_TO_ARRAY(groom_name, ' '), 1) > 1 
        THEN TRIM(SUBSTRING(groom_name FROM POSITION(' ' IN groom_name) + 1))
        ELSE NULL
    END
WHERE groom_name IS NOT NULL AND groom_name != '';