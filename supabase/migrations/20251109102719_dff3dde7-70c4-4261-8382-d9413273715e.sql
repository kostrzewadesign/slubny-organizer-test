-- Migracja: konwersja statusu 'sent' na 'pending' w tabeli guests
UPDATE guests 
SET rsvp_status = 'pending' 
WHERE rsvp_status = 'sent';

-- Dodanie constraint aby uniemożliwić 'sent' w przyszłości
ALTER TABLE guests 
DROP CONSTRAINT IF EXISTS guests_rsvp_status_check;

ALTER TABLE guests 
ADD CONSTRAINT guests_rsvp_status_check 
CHECK (rsvp_status IN ('pending', 'confirmed', 'declined'));