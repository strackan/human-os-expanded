-- ============================================================================
-- FIX CUSTOMERS TABLE RLS FOR DEMO MODE
-- ============================================================================
-- Adds demo mode support to customers table RLS policies
-- ============================================================================

-- Drop existing customers policies
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON public.customers;

-- Create new policies with demo mode support
CREATE POLICY "customers_select_policy" ON public.customers
FOR SELECT USING (
  is_demo_mode() OR
  assigned_to = auth.uid() OR
  company_id IN (
    SELECT company_id FROM public.profiles
    WHERE id = auth.uid()
  )
);

CREATE POLICY "customers_insert_policy" ON public.customers
FOR INSERT WITH CHECK (
  is_demo_mode() OR
  assigned_to = auth.uid()
);

CREATE POLICY "customers_update_policy" ON public.customers
FOR UPDATE USING (
  is_demo_mode() OR
  assigned_to = auth.uid() OR
  company_id IN (
    SELECT company_id FROM public.profiles
    WHERE id = auth.uid()
  )
);

CREATE POLICY "customers_delete_policy" ON public.customers
FOR DELETE USING (
  is_demo_mode() OR
  assigned_to = auth.uid()
);

-- Verify demo mode is enabled
SELECT key, value FROM public.app_settings WHERE key = 'demo_mode';
