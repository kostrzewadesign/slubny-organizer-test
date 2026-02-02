-- Add deposit_amount column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN deposit_amount NUMERIC DEFAULT 0;

-- Create new payment status enum
CREATE TYPE payment_status_new AS ENUM ('none', 'deposit_paid', 'paid');

-- Add temporary column with new enum type
ALTER TABLE public.expenses 
ADD COLUMN payment_status_new payment_status_new DEFAULT 'none';

-- Migrate existing data with proper casting
UPDATE public.expenses 
SET payment_status_new = CASE 
  WHEN payment_status = 'planned' THEN 'none'::payment_status_new
  WHEN payment_status = 'Zaliczka' THEN 'deposit_paid'::payment_status_new
  WHEN payment_status = 'Zapłacone' THEN 'paid'::payment_status_new
  ELSE 'none'::payment_status_new
END;

-- Drop old column and rename new one
ALTER TABLE public.expenses DROP COLUMN payment_status;
ALTER TABLE public.expenses RENAME COLUMN payment_status_new TO payment_status;

-- Add validation trigger for deposit_amount <= amount
CREATE OR REPLACE FUNCTION validate_expense_deposit()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate deposit_amount <= amount
  IF NEW.deposit_amount > NEW.amount THEN
    RAISE EXCEPTION 'Deposit amount cannot be greater than total amount';
  END IF;
  
  -- Auto-adjust payment_status if amount drops below deposit_amount
  IF NEW.amount < COALESCE(OLD.deposit_amount, 0) AND NEW.payment_status = 'deposit_paid' THEN
    NEW.payment_status = 'paid';
  END IF;
  
  -- Reset payment_status if deposit_amount becomes 0 and was deposit_paid
  IF NEW.deposit_amount = 0 AND NEW.payment_status = 'deposit_paid' THEN
    NEW.payment_status = 'none';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_expense_deposit_trigger
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION validate_expense_deposit();