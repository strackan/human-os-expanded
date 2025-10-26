-- Add tier and account_plan columns to customers table
-- These are referenced by the contract_terms migration

-- Add tier column (customer segment/tier)
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS tier TEXT;

-- Add account_plan column (plan type or subscription level)
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS account_plan TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.customers.tier IS
'Customer tier/segment (e.g., Enterprise, Mid-Market, SMB)';

COMMENT ON COLUMN public.customers.account_plan IS
'Account plan or subscription level (e.g., Starter, Professional, Enterprise)';

-- Create index for tier lookups (used in contract_matrix view)
CREATE INDEX IF NOT EXISTS idx_customers_tier ON public.customers(tier);

-- Create index for account_plan lookups
CREATE INDEX IF NOT EXISTS idx_customers_account_plan ON public.customers(account_plan);
