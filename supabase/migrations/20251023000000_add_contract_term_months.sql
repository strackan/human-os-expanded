-- Add term_months as a generated column that auto-calculates from start_date and end_date
-- This ensures term_months and end_date are always consistent

-- Add term_months column as a GENERATED ALWAYS column
ALTER TABLE public.contracts
ADD COLUMN term_months INTEGER
GENERATED ALWAYS AS (
  -- Calculate months between start_date and end_date
  -- Uses age() function which returns interval, then extracts years and months
  EXTRACT(YEAR FROM age(end_date, start_date)) * 12 +
  EXTRACT(MONTH FROM age(end_date, start_date))
) STORED;

-- Add comment explaining the column
COMMENT ON COLUMN public.contracts.term_months IS
'Auto-calculated contract term in months based on start_date and end_date. This is a generated column and cannot be manually set.';

-- Add a check constraint to ensure end_date is after start_date
ALTER TABLE public.contracts
ADD CONSTRAINT contracts_end_date_after_start_date
CHECK (end_date > start_date);

-- Add comment
COMMENT ON CONSTRAINT contracts_end_date_after_start_date ON public.contracts IS
'Ensures contract end date is always after start date';
