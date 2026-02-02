-- Add seat_index column to guests table for precise seat assignment
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS seat_index integer;

-- Add comment to explain the column
COMMENT ON COLUMN guests.seat_index IS 'Position index (0-based) of the guest at their assigned table';

-- Create index for faster queries on table_assignment + seat_index
CREATE INDEX IF NOT EXISTS idx_guests_table_seat 
ON guests(table_assignment, seat_index) 
WHERE table_assignment IS NOT NULL;