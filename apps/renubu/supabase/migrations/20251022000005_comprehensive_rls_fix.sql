-- Comprehensive RLS fix for demo mode
-- This migration ensures both workflow_executions and workflow_actions
-- can be accessed without authentication for demo purposes

-- ============================================
-- WORKFLOW_ACTIONS TABLE
-- ============================================

-- Disable RLS on workflow_actions (completely open for demo)
ALTER TABLE IF EXISTS public.workflow_actions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- WORKFLOW_EXECUTIONS TABLE
-- ============================================

-- Keep RLS enabled but make policies very permissive for demo
ALTER TABLE IF EXISTS public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow workflow updates for demo" ON public.workflow_executions;
DROP POLICY IF EXISTS "Allow workflow creation for demo" ON public.workflow_executions;
DROP POLICY IF EXISTS "Allow workflow reads for demo" ON public.workflow_executions;
DROP POLICY IF EXISTS "Users can update their workflows" ON public.workflow_executions;
DROP POLICY IF EXISTS "Users can create workflows" ON public.workflow_executions;
DROP POLICY IF EXISTS "Users can view their workflows" ON public.workflow_executions;

-- Create fully permissive policies for demo
CREATE POLICY "Demo: Allow all reads" ON public.workflow_executions
FOR SELECT USING (true);

CREATE POLICY "Demo: Allow all inserts" ON public.workflow_executions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Demo: Allow all updates" ON public.workflow_executions
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Demo: Allow all deletes" ON public.workflow_executions
FOR DELETE USING (true);

-- ============================================
-- VERIFICATION
-- ============================================

-- Display current RLS status
DO $$
BEGIN
  RAISE NOTICE 'RLS Status:';
  RAISE NOTICE '- workflow_actions: RLS DISABLED (fully open)';
  RAISE NOTICE '- workflow_executions: RLS ENABLED with permissive policies';
END $$;
