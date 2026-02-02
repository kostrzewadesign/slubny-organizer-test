-- Step 1: Create a function to clean up duplicate couple tables
CREATE OR REPLACE FUNCTION cleanup_duplicate_couple_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  duplicate_record RECORD;
BEGIN
  -- Delete duplicate empty couple tables, keeping the ones with assignments or the newest one
  FOR duplicate_record IN
    SELECT t1.id
    FROM tables t1
    WHERE t1.name IN ('Stół Pary Młodej', 'Para Młoda')
    AND EXISTS (
      SELECT 1 FROM tables t2
      WHERE t2.user_id = t1.user_id
      AND t2.name IN ('Stół Pary Młodej', 'Para Młoda')
      AND t2.id <> t1.id
      AND (
        -- Keep table with assignments over empty ones
        (SELECT COUNT(*) FROM table_assignments WHERE table_id = t2.id) > (SELECT COUNT(*) FROM table_assignments WHERE table_id = t1.id)
        OR
        -- If both have same assignment count, keep newer one
        ((SELECT COUNT(*) FROM table_assignments WHERE table_id = t2.id) = (SELECT COUNT(*) FROM table_assignments WHERE table_id = t1.id)
         AND t2.created_at > t1.created_at)
      )
    )
  LOOP
    DELETE FROM tables WHERE id = duplicate_record.id;
    RAISE NOTICE 'Deleted duplicate couple table: %', duplicate_record.id;
  END LOOP;
END;
$function$;

-- Step 2: Run the cleanup
SELECT cleanup_duplicate_couple_tables();

-- Step 3: Add unique constraint to prevent multiple couple tables per user
CREATE UNIQUE INDEX IF NOT EXISTS tables_user_couple_unique 
ON tables (user_id) 
WHERE name IN ('Stół Pary Młodej', 'Para Młoda');