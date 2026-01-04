-- ============================================================================
-- FIX DEMO MODE RLS FOR TESTING
-- ============================================================================
-- This enables demo mode and sets up RLS policies to allow workflow creation
-- Apply this in Supabase SQL Editor if you get RLS policy violations
-- ============================================================================

-- 1. Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable demo mode
INSERT INTO public.app_settings (key, value, description)
VALUES ('demo_mode', 'true', 'Enable demo mode (bypasses auth for workflow actions)')
ON CONFLICT (key) DO UPDATE SET value = 'true';

-- 3. Create is_demo_mode function
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

-- 4. Drop existing workflow_executions policies
DROP POLICY IF EXISTS "workflow_executions_select_policy" ON public.workflow_executions;
DROP POLICY IF EXISTS "workflow_executions_insert_policy" ON public.workflow_executions;
DROP POLICY IF EXISTS "workflow_executions_update_policy" ON public.workflow_executions;
DROP POLICY IF EXISTS "workflow_executions_delete_policy" ON public.workflow_executions;

-- Drop any old demo policies
DROP POLICY IF EXISTS "Demo: Allow all reads" ON public.workflow_executions;
DROP POLICY IF EXISTS "Demo: Allow all inserts" ON public.workflow_executions;
DROP POLICY IF EXISTS "Demo: Allow all updates" ON public.workflow_executions;
DROP POLICY IF EXISTS "Demo: Allow all deletes" ON public.workflow_executions;
DROP POLICY IF EXISTS "Allow workflow creation for demo" ON public.workflow_executions;
DROP POLICY IF EXISTS "Allow workflow reads for demo" ON public.workflow_executions;
DROP POLICY IF EXISTS "Allow workflow updates for demo" ON public.workflow_executions;
DROP POLICY IF EXISTS "Authenticated users can access workflow_executions" ON public.workflow_executions;
DROP POLICY IF EXISTS "Allow public read for demo workflow_executions" ON public.workflow_executions;
DROP POLICY IF EXISTS "Users can update their workflows" ON public.workflow_executions;

-- 5. Create new unified policies with demo mode support
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

-- 6. Verify demo mode is enabled
SELECT key, value FROM public.app_settings WHERE key = 'demo_mode';

-- 7. Test the function
SELECT is_demo_mode() as demo_mode_enabled;
