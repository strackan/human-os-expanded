-- ============================================================================
-- Add Unique Constraint to workflow_definitions
-- ============================================================================
-- Purpose: Ensure same workflow_id can't exist twice for same company
-- Date: 2025-10-21
-- ============================================================================

-- Drop constraint if it exists (cleanup)
ALTER TABLE public.workflow_definitions
  DROP CONSTRAINT IF EXISTS unique_workflow_per_company;

-- Add the unique constraint
ALTER TABLE public.workflow_definitions
  ADD CONSTRAINT unique_workflow_per_company
  UNIQUE(company_id, workflow_id);

-- Verification
SELECT '✅ Unique constraint added to workflow_definitions' as status;
