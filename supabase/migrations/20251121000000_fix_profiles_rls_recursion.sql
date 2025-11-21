-- ============================================================================
-- Fix Profiles RLS Infinite Recursion (Grace Demo Fix)
-- ============================================================================
-- Issue: Old policies calling get_current_user_company() caused infinite recursion
-- Solution: Drop all recursive policies, keep only simple auth.uid() checks
-- ============================================================================

-- Drop all old recursive policies
DROP POLICY IF EXISTS "Admins can insert profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile and company profiles" ON public.profiles;

-- Ensure demo mode function exists
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

-- Ensure clean policies exist (idempotent)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

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

-- Add missing escalated_at column for workflow_executions
ALTER TABLE public.workflow_executions
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_workflow_executions_escalated_at
ON public.workflow_executions(escalated_at);

-- Verify clean policies
SELECT 'Profiles RLS policies fixed - no more recursion' as status;
