-- Optymalizacja budżetu - funkcja podsumowania i indeksy
CREATE OR REPLACE FUNCTION budget_summary(p_user_id uuid)
RETURNS TABLE(total numeric, paid numeric, remaining numeric, deposit_paid numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(amount), 0) as total,
    COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) as paid,
    COALESCE(SUM(CASE WHEN payment_status = 'none' OR payment_status = 'planned' THEN amount ELSE 0 END), 0) as remaining,
    COALESCE(SUM(CASE WHEN payment_status = 'deposit_paid' THEN deposit_amount ELSE 0 END), 0) as deposit_paid
  FROM expenses
  WHERE user_id = p_user_id;
$$;

-- Transakcyjna funkcja dodawania gości z towarzyszami
CREATE OR REPLACE FUNCTION add_guest_with_companion(
  p_user_id uuid,
  p_guest jsonb,
  p_companion jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest_id uuid;
  v_companion_id uuid;
BEGIN
  -- Sprawdź czy user_id jest zgodny z auth.uid()
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  -- Dodaj głównego gościa
  INSERT INTO guests (
    user_id, 
    first_name, 
    last_name, 
    email, 
    phone, 
    guest_group, 
    rsvp_status,
    accommodation,
    transport,
    dietary_restrictions,
    notes
  ) VALUES (
    p_user_id,
    COALESCE(p_guest->>'first_name', ''),
    COALESCE(p_guest->>'last_name', ''),
    NULLIF(TRIM(p_guest->>'email'), ''),
    NULLIF(TRIM(p_guest->>'phone'), ''),
    COALESCE(p_guest->>'guest_group', 'family'),
    COALESCE(p_guest->>'rsvp_status', 'pending'),
    COALESCE((p_guest->>'accommodation')::boolean, false),
    COALESCE((p_guest->>'transport')::boolean, false),
    NULLIF(TRIM(p_guest->>'dietary_restrictions'), ''),
    NULLIF(TRIM(p_guest->>'notes'), '')
  ) RETURNING id INTO v_guest_id;

  -- Dodaj towarzysza jeśli podany
  IF p_companion IS NOT NULL THEN
    INSERT INTO guests (
      user_id, 
      first_name, 
      last_name, 
      email, 
      phone, 
      guest_group, 
      rsvp_status,
      accommodation,
      transport,
      dietary_restrictions,
      notes,
      companion_of_guest_id
    ) VALUES (
      p_user_id,
      COALESCE(p_companion->>'first_name', ''),
      COALESCE(p_companion->>'last_name', ''),
      NULLIF(TRIM(p_companion->>'email'), ''),
      NULLIF(TRIM(p_companion->>'phone'), ''),
      COALESCE(p_companion->>'guest_group', 'family'),
      COALESCE(p_companion->>'rsvp_status', 'pending'),
      COALESCE((p_companion->>'accommodation')::boolean, false),
      COALESCE((p_companion->>'transport')::boolean, false),
      NULLIF(TRIM(p_companion->>'dietary_restrictions'), ''),
      NULLIF(TRIM(p_companion->>'notes'), ''),
      v_guest_id
    ) RETURNING id INTO v_companion_id;
  END IF;

  RETURN v_guest_id;
EXCEPTION WHEN OTHERS THEN
  RAISE; -- Rollback automatyczny
END;
$$;

-- Indeksy dla optymalizacji wydajności
CREATE INDEX IF NOT EXISTS idx_expenses_user_created ON expenses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_payment ON expenses(user_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_guests_user_created ON guests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guests_companion ON guests(companion_of_guest_id) WHERE companion_of_guest_id IS NOT NULL;