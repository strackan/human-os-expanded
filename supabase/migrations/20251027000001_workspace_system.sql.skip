-- Workspace System Migration
-- Adds status and is_admin columns to profiles for simple invite-only workspace management
-- Status: 0=Disabled, 1=Active, 2=Pending invitation
-- is_admin: true=Admin (can invite/manage users), false=Regular user

-- ============================================================================
-- SECTION 1: ADD COLUMNS TO PROFILES TABLE
-- ============================================================================

-- Add status column (0=Disabled, 1=Active, 2=Pending)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status INTEGER DEFAULT 2 CHECK (status IN (0, 1, 2));

-- Add is_admin column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_company_status ON public.profiles(company_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- ============================================================================
-- SECTION 2: UPDATE EXISTING USERS
-- ============================================================================

-- Set existing users to Active status
-- (This migration runs after some users may already exist)
UPDATE public.profiles
SET status = 1
WHERE status IS NULL OR status = 2;

-- ============================================================================
-- SECTION 3: HELPER FUNCTIONS
-- ============================================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
    AND status = 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's company_id
CREATE OR REPLACE FUNCTION public.get_current_user_company()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT company_id FROM public.profiles
    WHERE id = auth.uid()
    AND status = 1
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 4: UPDATE RLS POLICIES FOR MULTI-TENANCY
-- ============================================================================

-- Drop old permissive policies that allowed any authenticated user
-- These are being replaced with company-scoped policies

-- Profiles table
DROP POLICY IF EXISTS "Authenticated users can access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- New company-scoped profiles policies
CREATE POLICY "Users can view profiles in their company"
  ON public.profiles FOR SELECT
  USING (
    company_id = public.get_current_user_company()
    OR id = auth.uid()
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can update profiles in their company"
  ON public.profiles FOR UPDATE
  USING (
    public.is_current_user_admin()
    AND company_id = public.get_current_user_company()
  );

CREATE POLICY "Admins can insert profiles in their company"
  ON public.profiles FOR INSERT
  WITH CHECK (
    public.is_current_user_admin()
    AND company_id = public.get_current_user_company()
  );

-- Companies table
DROP POLICY IF EXISTS "Authenticated users can access companies" ON public.companies;

CREATE POLICY "Users can view their own company"
  ON public.companies FOR SELECT
  USING (
    id = public.get_current_user_company()
  );

CREATE POLICY "Admins can update their own company"
  ON public.companies FOR UPDATE
  USING (
    id = public.get_current_user_company()
    AND public.is_current_user_admin()
  );

-- Customers table
DROP POLICY IF EXISTS "Authenticated users can access customers" ON public.customers;

CREATE POLICY "Users can access customers in their company"
  ON public.customers FOR ALL
  USING (
    company_id = public.get_current_user_company()
  );

-- Customer Properties
DROP POLICY IF EXISTS "Authenticated users can access customer_properties" ON public.customer_properties;

CREATE POLICY "Users can access customer properties in their company"
  ON public.customer_properties FOR ALL
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE company_id = public.get_current_user_company()
    )
  );

-- Contacts table
DROP POLICY IF EXISTS "Authenticated users can access contacts" ON public.contacts;

CREATE POLICY "Users can access contacts in their company"
  ON public.contacts FOR ALL
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE company_id = public.get_current_user_company()
    )
  );

-- Contracts table
DROP POLICY IF EXISTS "Authenticated users can access contracts" ON public.contracts;

CREATE POLICY "Users can access contracts in their company"
  ON public.contracts FOR ALL
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE company_id = public.get_current_user_company()
    )
  );

-- Renewals table
DROP POLICY IF EXISTS "Authenticated users can access renewals" ON public.renewals;

CREATE POLICY "Users can access renewals in their company"
  ON public.renewals FOR ALL
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE company_id = public.get_current_user_company()
    )
  );

-- Tasks table
DROP POLICY IF EXISTS "Authenticated users can access tasks" ON public.tasks;

CREATE POLICY "Users can access tasks in their company"
  ON public.tasks FOR ALL
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE company_id = public.get_current_user_company()
    )
  );

-- Events table
DROP POLICY IF EXISTS "Authenticated users can access events" ON public.events;

CREATE POLICY "Users can access events in their company"
  ON public.events FOR ALL
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE company_id = public.get_current_user_company()
    )
  );

-- Alerts table
DROP POLICY IF EXISTS "Authenticated users can access alerts" ON public.alerts;

CREATE POLICY "Users can access alerts in their company"
  ON public.alerts FOR ALL
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE company_id = public.get_current_user_company()
    )
  );

-- Notes table
DROP POLICY IF EXISTS "Authenticated users can access notes" ON public.notes;

CREATE POLICY "Users can access notes in their company"
  ON public.notes FOR ALL
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE company_id = public.get_current_user_company()
    )
  );

-- ============================================================================
-- SECTION 5: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_company() TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Migration adds:
-- 1. status column to profiles (0=Disabled, 1=Active, 2=Pending)
-- 2. is_admin column to profiles (true=Admin, false=Regular user)
-- 3. Helper functions for checking admin status and getting user's company
-- 4. Updated RLS policies to enforce company-level data isolation
-- 5. Only active users (status=1) can access data
-- 6. Users can only see data from their own company
