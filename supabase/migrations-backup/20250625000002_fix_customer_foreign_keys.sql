-- Fix foreign key references to use public.customers instead of mvp.customers
-- This migration fixes the schema mismatch causing 500 errors

-- Step 1: Drop existing foreign key constraints that reference mvp.customers
ALTER TABLE IF EXISTS public.customer_properties 
DROP CONSTRAINT IF EXISTS customer_properties_customer_id_fkey;

ALTER TABLE IF EXISTS public.key_dates 
DROP CONSTRAINT IF EXISTS key_dates_customer_id_fkey;

ALTER TABLE IF EXISTS public.contracts 
DROP CONSTRAINT IF EXISTS contracts_customer_id_fkey;

ALTER TABLE IF EXISTS public.renewals 
DROP CONSTRAINT IF EXISTS renewals_customer_id_fkey;

ALTER TABLE IF EXISTS public.events 
DROP CONSTRAINT IF EXISTS events_customer_id_fkey;

ALTER TABLE IF EXISTS public.alerts 
DROP CONSTRAINT IF EXISTS alerts_customer_id_fkey;

-- Step 2: Add new foreign key constraints that reference public.customers
ALTER TABLE public.customer_properties 
ADD CONSTRAINT customer_properties_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.key_dates 
ADD CONSTRAINT key_dates_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.contracts 
ADD CONSTRAINT contracts_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.renewals 
ADD CONSTRAINT renewals_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.events 
ADD CONSTRAINT events_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.alerts 
ADD CONSTRAINT alerts_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- Step 3: Ensure all tables are using the public schema consistently
-- Update any remaining references to use public schema
