-- Proper RLS policies with demo_mode support
-- This allows the demo to work while keeping security in production

-- ============================================
-- 1. Create app_settings table for demo_mode flag
-- ============================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert demo_mode setting (set to 'true' for demo, 'false' for production)
INSERT INTO public.app_settings (key, value, description)
VALUES ('demo_mode', 'true', 'Enable demo mode (bypasses auth for workflow actions)')
ON CONFLICT (key) DO UPDATE SET value = 'true';

-- Create function to check demo mode
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

-- ============================================
-- 2. Fix workflow_actions RLS policies
-- ============================================

-- Re-enable RLS (we turned it off before)
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their workflow actions" ON public.workflow_actions;
DROP POLICY IF EXISTS "Users can create workflow actions" ON public.workflow_actions;

-- SELECT policy: Allow if demo_mode OR user has access to the workflow
CREATE POLICY "workflow_actions_select_policy" ON public.workflow_actions
FOR SELECT USING (
  is_demo_mode() OR
  performed_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM workflow_executions we
    WHERE we.id = workflow_actions.execution_id
    AND (we.assigned_csm_id = auth.uid() OR we.user_id = auth.uid())
  )
);

-- INSERT policy: Allow if demo_mode OR user is performing the action on their workflow
CREATE POLICY "workflow_actions_insert_policy" ON public.workflow_actions
FOR INSERT WITH CHECK (
  is_demo_mode() OR
  (
    performed_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM workflow_executions we
      WHERE we.id = execution_id
      AND (we.assigned_csm_id = auth.uid() OR we.user_id = auth.uid())
    )
  )
);

-- ============================================
-- 3. Fix workflow_executions RLS policies
-- ============================================

-- Drop all existing demo policies
DROP POLICY IF EXISTS "Demo: Allow all reads" ON public.workflow_executions;
DROP POLICY IF EXISTS "Demo: Allow all inserts" ON public.workflow_executions;
DROP POLICY IF EXISTS "Demo: Allow all updates" ON public.workflow_executions;
DROP POLICY IF EXISTS "Demo: Allow all deletes" ON public.workflow_executions;

-- SELECT policy: Allow if demo_mode OR user has access
CREATE POLICY "workflow_executions_select_policy" ON public.workflow_executions
FOR SELECT USING (
  is_demo_mode() OR
  assigned_csm_id = auth.uid() OR
  user_id = auth.uid() OR
  escalated_from = auth.uid()
);

-- INSERT policy: Allow if demo_mode OR user is creating for themselves
CREATE POLICY "workflow_executions_insert_policy" ON public.workflow_executions
FOR INSERT WITH CHECK (
  is_demo_mode() OR
  assigned_csm_id = auth.uid() OR
  user_id = auth.uid()
);

-- UPDATE policy: Allow if demo_mode OR user has access
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

-- DELETE policy: Allow if demo_mode OR user owns the workflow
CREATE POLICY "workflow_executions_delete_policy" ON public.workflow_executions
FOR DELETE USING (
  is_demo_mode() OR
  assigned_csm_id = auth.uid() OR
  user_id = auth.uid()
);

-- ============================================
-- 4. Grant public access to app_settings (read-only)
-- ============================================

GRANT SELECT ON public.app_settings TO anon, authenticated;

-- ============================================
-- INSTRUCTIONS FOR PRODUCTION
-- ============================================

-- To disable demo mode in production, run:
-- UPDATE public.app_settings SET value = 'false' WHERE key = 'demo_mode';

-- To re-enable demo mode for testing, run:
-- UPDATE public.app_settings SET value = 'true' WHERE key = 'demo_mode';

COMMENT ON TABLE public.app_settings IS 'Application configuration settings. Set demo_mode to false in production.';
COMMENT ON FUNCTION public.is_demo_mode() IS 'Returns true if demo_mode is enabled, allowing RLS bypass for testing.';
