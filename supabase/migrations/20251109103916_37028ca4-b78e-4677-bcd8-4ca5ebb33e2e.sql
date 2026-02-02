-- Cleanup duplicate "Stół Pary Młodej" tables
-- Keep only the oldest one per user (or the one with table_type = 'main_couple' if it exists)

WITH ranked_couple_tables AS (
  SELECT 
    id,
    user_id,
    name,
    table_type,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY 
        CASE WHEN table_type = 'main_couple' THEN 0 ELSE 1 END,
        created_at ASC
    ) as rn
  FROM tables
  WHERE name = 'Stół Pary Młodej'
)
DELETE FROM tables
WHERE id IN (
  SELECT id 
  FROM ranked_couple_tables 
  WHERE rn > 1
);