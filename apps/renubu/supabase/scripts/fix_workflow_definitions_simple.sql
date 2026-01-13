-- ============================================================================
-- SIMPLE FIX FOR WORKFLOW_DEFINITIONS RLS
-- ============================================================================
-- Remove any checks that might cause recursion
-- In demo mode, allow all access without profile checks
-- ============================================================================

-- Drop existing workflow_definitions policy
DROP POLICY IF EXISTS "workflow_definitions_select_policy" ON public.workflow_definitions;
DROP POLICY IF EXISTS "Authenticated users can access workflow_definitions" ON public.workflow_definitions;
DROP POLICY IF EXISTS "Allow public read for demo workflow_definitions" ON public.workflow_definitions;

-- Create simple policy that doesn't check other tables
CREATE POLICY "workflow_definitions_select_policy" ON public.workflow_definitions
FOR SELECT USING (
  is_demo_mode() OR
  is_demo = true OR
  company_id IS NULL
);

-- Allow inserts/updates in demo mode (for testing)
CREATE POLICY "workflow_definitions_insert_policy" ON public.workflow_definitions
FOR INSERT WITH CHECK (is_demo_mode());

CREATE POLICY "workflow_definitions_update_policy" ON public.workflow_definitions
FOR UPDATE USING (is_demo_mode());

CREATE POLICY "workflow_definitions_delete_policy" ON public.workflow_definitions
FOR DELETE USING (is_demo_mode());

-- Verify
SELECT 'Workflow definitions RLS simplified' as status;
