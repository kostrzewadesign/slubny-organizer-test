-- Fix existing bride and groom records with incorrect last names
UPDATE guests 
SET last_name = '' 
WHERE role = 'bride' 
  AND last_name = 'Panna Młoda' 
  AND is_linked_to_profile = true;

UPDATE guests 
SET last_name = '' 
WHERE role = 'groom' 
  AND last_name = 'Pan Młody' 
  AND is_linked_to_profile = true;