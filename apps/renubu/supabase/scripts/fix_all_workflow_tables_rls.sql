-- ============================================================================
-- COMPREHENSIVE RLS FIX FOR ALL WORKFLOW-RELATED TABLES
-- ============================================================================
-- Adds demo mode support to all tables used in workflow execution
-- ============================================================================

-- Ensure demo mode function exists (from previous fix)
-- If you haven't run fix_demo_mode_rls.sql yet, uncomment this section:
/*
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.app_settings (key, value, description)
VALUES ('demo_mode', 'true', 'Enable demo mode (bypasses auth for workflow actions)')
ON CONFLICT (key) DO UPDATE SET value = 'true';

CREATE OR REPLACE FUNCTION public.is_demo_mode()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT value::boolean FROM public.app_settings WHERE key = 'demo_mode'),
    false
  );
$$;
*/

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON public.customers;

CREATE POLICY "customers_select_policy" ON public.customers
FOR SELECT USING (is_demo_mode() OR assigned_to = auth.uid());

CREATE POLICY "customers_insert_policy" ON public.customers
FOR INSERT WITH CHECK (is_demo_mode() OR assigned_to = auth.uid());

CREATE POLICY "customers_update_policy" ON public.customers
FOR UPDATE USING (is_demo_mode() OR assigned_to = auth.uid());

CREATE POLICY "customers_delete_policy" ON public.customers
FOR DELETE USING (is_demo_mode() OR assigned_to = auth.uid());

-- ============================================================================
-- CUSTOMER_PROPERTIES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "customer_properties_select_policy" ON public.customer_properties;
DROP POLICY IF EXISTS "customer_properties_insert_policy" ON public.customer_properties;
DROP POLICY IF EXISTS "customer_properties_update_policy" ON public.customer_properties;
DROP POLICY IF EXISTS "customer_properties_delete_policy" ON public.customer_properties;

CREATE POLICY "customer_properties_select_policy" ON public.customer_properties
FOR SELECT USING (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

CREATE POLICY "customer_properties_insert_policy" ON public.customer_properties
FOR INSERT WITH CHECK (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

CREATE POLICY "customer_properties_update_policy" ON public.customer_properties
FOR UPDATE USING (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

CREATE POLICY "customer_properties_delete_policy" ON public.customer_properties
FOR DELETE USING (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "contacts_select_policy" ON public.contacts;
DROP POLICY IF EXISTS "contacts_insert_policy" ON public.contacts;
DROP POLICY IF EXISTS "contacts_update_policy" ON public.contacts;
DROP POLICY IF EXISTS "contacts_delete_policy" ON public.contacts;

CREATE POLICY "contacts_select_policy" ON public.contacts
FOR SELECT USING (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

CREATE POLICY "contacts_insert_policy" ON public.contacts
FOR INSERT WITH CHECK (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

CREATE POLICY "contacts_update_policy" ON public.contacts
FOR UPDATE USING (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

CREATE POLICY "contacts_delete_policy" ON public.contacts
FOR DELETE USING (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

-- ============================================================================
-- CONTRACTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "contracts_select_policy" ON public.contracts;
DROP POLICY IF EXISTS "contracts_insert_policy" ON public.contracts;
DROP POLICY IF EXISTS "contracts_update_policy" ON public.contracts;
DROP POLICY IF EXISTS "contracts_delete_policy" ON public.contracts;

CREATE POLICY "contracts_select_policy" ON public.contracts
FOR SELECT USING (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

CREATE POLICY "contracts_insert_policy" ON public.contracts
FOR INSERT WITH CHECK (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

CREATE POLICY "contracts_update_policy" ON public.contracts
FOR UPDATE USING (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

CREATE POLICY "contracts_delete_policy" ON public.contracts
FOR DELETE USING (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

-- ============================================================================
-- RENEWALS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "renewals_select_policy" ON public.renewals;
DROP POLICY IF EXISTS "renewals_insert_policy" ON public.renewals;
DROP POLICY IF EXISTS "renewals_update_policy" ON public.renewals;
DROP POLICY IF EXISTS "renewals_delete_policy" ON public.renewals;

CREATE POLICY "renewals_select_policy" ON public.renewals
FOR SELECT USING (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

CREATE POLICY "renewals_insert_policy" ON public.renewals
FOR INSERT WITH CHECK (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

CREATE POLICY "renewals_update_policy" ON public.renewals
FOR UPDATE USING (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

CREATE POLICY "renewals_delete_policy" ON public.renewals
FOR DELETE USING (
  is_demo_mode() OR
  customer_id IN (SELECT id FROM customers WHERE assigned_to = auth.uid())
);

-- ============================================================================
-- WORKFLOW_DEFINITIONS TABLE (if not already fixed)
-- ============================================================================
DROP POLICY IF EXISTS "workflow_definitions_select_policy" ON public.workflow_definitions;

CREATE POLICY "workflow_definitions_select_policy" ON public.workflow_definitions
FOR SELECT USING (
  is_demo_mode() OR
  is_demo = true OR
  company_id IS NULL OR
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Demo mode enabled: ' || is_demo_mode() as status;

SELECT
  'Policies created for: ' || string_agg(tablename, ', ') as tables
FROM pg_policies
WHERE policyname LIKE '%_select_policy'
  AND schemaname = 'public'
  AND tablename IN ('customers', 'customer_properties', 'contacts', 'contracts', 'renewals', 'workflow_executions', 'workflow_definitions');
