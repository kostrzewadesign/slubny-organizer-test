-- Zmień grupę pary młodej z 'family' na 'couple' dla istniejących użytkowników
UPDATE guests 
SET guest_group = 'couple' 
WHERE role IN ('bride', 'groom') 
  AND is_linked_to_profile = true;