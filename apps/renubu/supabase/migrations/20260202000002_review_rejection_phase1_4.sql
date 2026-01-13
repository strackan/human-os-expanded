-- ============================================================================
-- Phase 1.4: Review Rejection Enhancement
-- ============================================================================
--
-- Complete the review workflow cycle with formal rejection capability,
-- iteration tracking, and re-submission flow.
--
-- Changes:
-- 1. Extend review_status to include 'rejected' state
-- 2. Add review iteration tracking (workflow-level)
-- 3. Add review rejection history (workflow-level)
-- 4. Add review iteration tracking (step-level)
-- 5. Add review rejection history (step-level)
-- 6. Add indexes for performance
-- ============================================================================

-- ============================================================================
-- STEP 1: EXTEND REVIEW_STATUS TO INCLUDE 'REJECTED'
-- ============================================================================

-- Currently review_status is TEXT with CHECK constraint
-- We need to add 'rejected' to the allowed values

-- Update workflow_executions review_status constraint
ALTER TABLE public.workflow_executions
  DROP CONSTRAINT IF EXISTS workflow_executions_review_status_check;

ALTER TABLE public.workflow_executions
  ADD CONSTRAINT workflow_executions_review_status_check
  CHECK (review_status IN ('pending', 'approved', 'changes_requested', 'rejected'));

-- Update workflow_step_executions review_status constraint
ALTER TABLE public.workflow_step_executions
  DROP CONSTRAINT IF EXISTS workflow_step_executions_review_status_check;

ALTER TABLE public.workflow_step_executions
  ADD CONSTRAINT workflow_step_executions_review_status_check
  CHECK (review_status IN ('pending', 'approved', 'changes_requested', 'rejected'));

-- Update comments
COMMENT ON COLUMN public.workflow_executions.review_status IS
'Status of the review: pending, approved, changes_requested, or rejected.';

COMMENT ON COLUMN public.workflow_step_executions.review_status IS
'Status of the step review: pending, approved, changes_requested, or rejected.';

-- ============================================================================
-- STEP 2: ADD REVIEW ITERATION TRACKING (WORKFLOW-LEVEL)
-- ============================================================================

-- Add review iteration column to track how many times workflow has been reviewed
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS review_iteration INTEGER DEFAULT 1;

-- Add review rejection history to track all rejection events
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS review_rejection_history JSONB DEFAULT '[]'::jsonb;

-- Update comments
COMMENT ON COLUMN public.workflow_executions.review_iteration IS
'Current review iteration number. Increments each time workflow is re-submitted after rejection.';

COMMENT ON COLUMN public.workflow_executions.review_rejection_history IS
'Array of rejection history entries. Each entry contains: iteration, rejectedAt, rejectedBy, reason, and comments.';

-- ============================================================================
-- STEP 3: ADD REVIEW ITERATION TRACKING (STEP-LEVEL)
-- ============================================================================

-- Add review iteration tracking to workflow_step_states table
-- This table is used for step-level snooze/skip actions and should mirror workflow_executions structure
ALTER TABLE public.workflow_step_states
  ADD COLUMN IF NOT EXISTS review_iteration INTEGER DEFAULT 1;

ALTER TABLE public.workflow_step_states
  ADD COLUMN IF NOT EXISTS review_rejection_history JSONB DEFAULT '[]'::jsonb;

-- Update comments
COMMENT ON COLUMN public.workflow_step_states.review_iteration IS
'Current review iteration number for this step. Increments each time step is re-submitted after rejection.';

COMMENT ON COLUMN public.workflow_step_states.review_rejection_history IS
'Array of rejection history entries for this step. Each entry contains: iteration, rejectedAt, rejectedBy, reason, and comments.';

-- Also add to workflow_step_executions for consistency (if not already present)
ALTER TABLE public.workflow_step_executions
  ADD COLUMN IF NOT EXISTS review_iteration INTEGER DEFAULT 1;

ALTER TABLE public.workflow_step_executions
  ADD COLUMN IF NOT EXISTS review_rejection_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.workflow_step_executions.review_iteration IS
'Current review iteration number for this step execution. Increments each time step is re-submitted after rejection.';

COMMENT ON COLUMN public.workflow_step_executions.review_rejection_history IS
'Array of rejection history entries for this step execution. Each entry contains: iteration, rejectedAt, rejectedBy, reason, and comments.';

-- ============================================================================
-- STEP 4: ADD PERFORMANCE INDEXES
-- ============================================================================

-- Index on review_iteration for filtering and sorting workflows by iteration
CREATE INDEX IF NOT EXISTS idx_workflow_executions_review_iteration
  ON public.workflow_executions(review_iteration)
  WHERE review_status IS NOT NULL;

-- Index on review_status including rejected for quick lookups
CREATE INDEX IF NOT EXISTS idx_workflow_executions_review_status
  ON public.workflow_executions(review_status)
  WHERE review_status IS NOT NULL;

-- Index on step-level review iteration
CREATE INDEX IF NOT EXISTS idx_workflow_step_states_review_iteration
  ON public.workflow_step_states(review_iteration);

CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_review_iteration
  ON public.workflow_step_executions(review_iteration)
  WHERE review_status IS NOT NULL;

-- ============================================================================
-- STEP 5: UPDATE HELPER FUNCTION FOR REJECTED WORKFLOWS
-- ============================================================================

-- Update the function that returns workflows pending review to exclude rejected ones
-- (they should only come back when re-submitted with review_status back to 'pending')
DROP FUNCTION IF EXISTS public.get_workflows_pending_review_for_evaluation(INTEGER);

CREATE OR REPLACE FUNCTION public.get_workflows_pending_review_for_evaluation(
  p_evaluation_interval_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  workflow_execution_id UUID,
  review_triggers JSONB,
  review_last_evaluated_at TIMESTAMPTZ,
  customer_id UUID,
  user_id UUID,
  reviewer_id UUID,
  review_iteration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    we.id,
    we.review_triggers,
    we.review_last_evaluated_at,
    we.customer_id,
    we.user_id,
    we.reviewer_id,
    we.review_iteration
  FROM public.workflow_executions we
  WHERE we.review_status = 'pending'
    AND we.review_triggers IS NOT NULL
    AND jsonb_array_length(we.review_triggers) > 0
    AND (
      we.review_last_evaluated_at IS NULL
      OR we.review_last_evaluated_at < NOW() - (p_evaluation_interval_minutes || ' minutes')::INTERVAL
    )
  ORDER BY we.review_last_evaluated_at ASC NULLS FIRST
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_workflows_pending_review_for_evaluation IS
'Returns workflows with pending reviews that need trigger evaluation. Excludes rejected workflows. Called by cron job every 5 minutes.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check workflow_executions review columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workflow_executions'
  AND (column_name LIKE '%review%' OR column_name LIKE '%reviewer%')
ORDER BY column_name;

-- Check workflow_step_states review columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workflow_step_states'
  AND column_name LIKE '%review%'
ORDER BY column_name;

-- Check workflow_step_executions review columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workflow_step_executions'
  AND column_name LIKE '%review%'
ORDER BY column_name;

-- Check indexes
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND (indexname LIKE '%review%')
ORDER BY tablename, indexname;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Review Rejection Enhancement is complete:
-- - review_status now includes 'rejected' state
-- - review_iteration tracks re-submission cycles
-- - review_rejection_history stores complete rejection audit trail
-- - Applied at both workflow and step levels
-- - Performance indexes added for filtering and sorting
-- ============================================================================
