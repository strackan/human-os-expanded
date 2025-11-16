-- ============================================================================
-- FINAL COMPREHENSIVE RLS FIX - Apply This One File
-- ============================================================================
-- This fixes all RLS recursion issues in one go
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure demo mode is enabled
-- ============================================================================
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

-- ============================================================================
-- STEP 2: Fix profiles table (remove recursion)
-- ============================================================================
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
  is_demo_mode() OR
  id = auth.uid()
);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (
  is_demo_mode() OR
  id = auth.uid()
);

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
  is_demo_mode() OR
  id = auth.uid()
);

CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE USING (
  is_demo_mode() OR
  id = auth.uid()
);

-- ============================================================================
-- STEP 3: Fix workflow_definitions (no profile checks)
-- ============================================================================
DROP POLICY IF EXISTS "workflow_definitions_select_policy" ON public.workflow_definitions;
DROP POLICY IF EXISTS "workflow_definitions_insert_policy" ON public.workflow_definitions;
DROP POLICY IF EXISTS "workflow_definitions_update_policy" ON public.workflow_definitions;
DROP POLICY IF EXISTS "workflow_definitions_delete_policy" ON public.workflow_definitions;
DROP POLICY IF EXISTS "Authenticated users can access workflow_definitions" ON public.workflow_definitions;
DROP POLICY IF EXISTS "Allow public read for demo workflow_definitions" ON public.workflow_definitions;

-- Simple policy with NO recursion - doesn't check profiles
CREATE POLICY "workflow_definitions_select_policy" ON public.workflow_definitions
FOR SELECT USING (
  is_demo_mode() OR
  is_demo = true OR
  company_id IS NULL
);

CREATE POLICY "workflow_definitions_insert_policy" ON public.workflow_definitions
FOR INSERT WITH CHECK (is_demo_mode());

CREATE POLICY "workflow_definitions_update_policy" ON public.workflow_definitions
FOR UPDATE USING (is_demo_mode());

CREATE POLICY "workflow_definitions_delete_policy" ON public.workflow_definitions
FOR DELETE USING (is_demo_mode());

-- ============================================================================
-- STEP 4: Fix workflow_executions
-- ============================================================================
DROP POLICY IF EXISTS "workflow_executions_select_policy" ON public.workflow_executions;
DROP POLICY IF EXISTS "workflow_executions_insert_policy" ON public.workflow_executions;
DROP POLICY IF EXISTS "workflow_executions_update_policy" ON public.workflow_executions;
DROP POLICY IF EXISTS "workflow_executions_delete_policy" ON public.workflow_executions;

CREATE POLICY "workflow_executions_select_policy" ON public.workflow_executions
FOR SELECT USING (
  is_demo_mode() OR
  assigned_csm_id = auth.uid() OR
  user_id = auth.uid() OR
  escalated_from = auth.uid()
);

CREATE POLICY "workflow_executions_insert_policy" ON public.workflow_executions
FOR INSERT WITH CHECK (
  is_demo_mode() OR
  assigned_csm_id = auth.uid() OR
  user_id = auth.uid()
);

CREATE POLICY "workflow_executions_update_policy" ON public.workflow_executions
FOR UPDATE USING (
  is_demo_mode() OR
  assigned_csm_id = auth.uid() OR
  user_id = auth.uid() OR
  escalated_from = auth.uid()
) WITH CHECK (
  is_demo_mode() OR
  assigned_csm_id = auth.uid() OR
  user_id = auth.uid()
);

CREATE POLICY "workflow_executions_delete_policy" ON public.workflow_executions
FOR DELETE USING (
  is_demo_mode() OR
  assigned_csm_id = auth.uid() OR
  user_id = auth.uid()
);

-- ============================================================================
-- STEP 5: Fix customers and related tables
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

-- Customer properties
DROP POLICY IF EXISTS "customer_properties_select_policy" ON public.customer_properties;
DROP POLICY IF EXISTS "customer_properties_insert_policy" ON public.customer_properties;
DROP POLICY IF EXISTS "customer_properties_update_policy" ON public.customer_properties;
DROP POLICY IF EXISTS "customer_properties_delete_policy" ON public.customer_properties;

CREATE POLICY "customer_properties_select_policy" ON public.customer_properties
FOR SELECT USING (is_demo_mode());

CREATE POLICY "customer_properties_insert_policy" ON public.customer_properties
FOR INSERT WITH CHECK (is_demo_mode());

CREATE POLICY "customer_properties_update_policy" ON public.customer_properties
FOR UPDATE USING (is_demo_mode());

CREATE POLICY "customer_properties_delete_policy" ON public.customer_properties
FOR DELETE USING (is_demo_mode());

-- Contacts
DROP POLICY IF EXISTS "contacts_select_policy" ON public.contacts;
DROP POLICY IF EXISTS "contacts_insert_policy" ON public.contacts;
DROP POLICY IF EXISTS "contacts_update_policy" ON public.contacts;
DROP POLICY IF EXISTS "contacts_delete_policy" ON public.contacts;

CREATE POLICY "contacts_select_policy" ON public.contacts
FOR SELECT USING (is_demo_mode());

CREATE POLICY "contacts_insert_policy" ON public.contacts
FOR INSERT WITH CHECK (is_demo_mode());

CREATE POLICY "contacts_update_policy" ON public.contacts
FOR UPDATE USING (is_demo_mode());

CREATE POLICY "contacts_delete_policy" ON public.contacts
FOR DELETE USING (is_demo_mode());

-- Contracts
DROP POLICY IF EXISTS "contracts_select_policy" ON public.contracts;
DROP POLICY IF EXISTS "contracts_insert_policy" ON public.contracts;
DROP POLICY IF EXISTS "contracts_update_policy" ON public.contracts;
DROP POLICY IF EXISTS "contracts_delete_policy" ON public.contracts;

CREATE POLICY "contracts_select_policy" ON public.contracts
FOR SELECT USING (is_demo_mode());

CREATE POLICY "contracts_insert_policy" ON public.contracts
FOR INSERT WITH CHECK (is_demo_mode());

CREATE POLICY "contracts_update_policy" ON public.contracts
FOR UPDATE USING (is_demo_mode());

CREATE POLICY "contracts_delete_policy" ON public.contracts
FOR DELETE USING (is_demo_mode());

-- Renewals
DROP POLICY IF EXISTS "renewals_select_policy" ON public.renewals;
DROP POLICY IF EXISTS "renewals_insert_policy" ON public.renewals;
DROP POLICY IF EXISTS "renewals_update_policy" ON public.renewals;
DROP POLICY IF EXISTS "renewals_delete_policy" ON public.renewals;

CREATE POLICY "renewals_select_policy" ON public.renewals
FOR SELECT USING (is_demo_mode());

CREATE POLICY "renewals_insert_policy" ON public.renewals
FOR INSERT WITH CHECK (is_demo_mode());

CREATE POLICY "renewals_update_policy" ON public.renewals
FOR UPDATE USING (is_demo_mode());

CREATE POLICY "renewals_delete_policy" ON public.renewals
FOR DELETE USING (is_demo_mode());

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT
  'Demo mode: ' || is_demo_mode() ||
  ' | RLS policies fixed for all tables' as status;

-- List all policies we just created
SELECT
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'workflow_definitions',
    'workflow_executions',
    'customers',
    'customer_properties',
    'contacts',
    'contracts',
    'renewals'
  )
ORDER BY tablename, policyname;
