-- Add term_months as a generated column that auto-calculates from start_date and end_date
-- This ensures term_months and end_date are always consistent

-- Add term_months column as a regular column (not generated, since age() is not immutable)
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS term_months INTEGER;

-- Update existing rows with calculated term_months
UPDATE public.contracts
SET term_months = (
  EXTRACT(YEAR FROM age(end_date, start_date))::INTEGER * 12 +
  EXTRACT(MONTH FROM age(end_date, start_date))::INTEGER
)
WHERE term_months IS NULL AND start_date IS NOT NULL AND end_date IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.contracts.term_months IS
'Contract term in months. Should be kept in sync with start_date and end_date.';

-- Add a check constraint to ensure end_date is after start_date (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contracts_end_date_after_start_date'
  ) THEN
    ALTER TABLE public.contracts
    ADD CONSTRAINT contracts_end_date_after_start_date
    CHECK (end_date > start_date);

    COMMENT ON CONSTRAINT contracts_end_date_after_start_date ON public.contracts IS
    'Ensures contract end date is always after start date';
  END IF;
END $$;
