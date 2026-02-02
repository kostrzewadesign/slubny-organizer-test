-- Update expenses table to align with simplified model
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS is_deposit BOOLEAN DEFAULT FALSE;

-- Migrate existing data: set is_deposit=true where deposit_amount > 0
UPDATE public.expenses 
SET is_deposit = (deposit_amount > 0 AND deposit_amount IS NOT NULL);

-- Simplify payment status to only 'none' and 'paid'
UPDATE public.expenses 
SET payment_status = CASE 
  WHEN payment_status IN ('paid', 'deposit_paid', 'deposit_only') THEN 'paid'
  ELSE 'none'
END;

-- Remove unused columns (optional - can be done later for safety)
-- ALTER TABLE public.expenses DROP COLUMN IF EXISTS deposit_amount;
-- ALTER TABLE public.expenses DROP COLUMN IF EXISTS completed;
-- ALTER TABLE public.expenses DROP COLUMN IF EXISTS paid_amount;