-- ============================================================================
-- Phase 1.2B: Convert Escalate to Review-Only Mode (IDEMPOTENT)
-- ============================================================================
--
-- Changes escalation semantics from "reassign ownership" to "request approval"
-- Key differences:
-- - Original user keeps ownership, just blocked until review
-- - Reviewer sees workflow and can approve/reject
-- - No hiding steps or partial workflows needed
--
-- IDEMPOTENT: All operations check for existing state before modifying
-- ============================================================================

-- ============================================================================
-- STEP 1: RENAME WORKFLOW-LEVEL COLUMNS (idempotent)
-- ============================================================================

DO $$
BEGIN
  -- Rename escalate_triggers -> review_triggers
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'escalate_triggers') THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalate_triggers TO review_triggers;
  END IF;

  -- Rename escalate_trigger_logic -> review_trigger_logic
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'escalate_trigger_logic') THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalate_trigger_logic TO review_trigger_logic;
  END IF;

  -- Rename escalate_last_evaluated_at -> review_last_evaluated_at
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'escalate_last_evaluated_at') THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalate_last_evaluated_at TO review_last_evaluated_at;
  END IF;

  -- Rename escalate_trigger_fired_at -> review_trigger_fired_at
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'escalate_trigger_fired_at') THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalate_trigger_fired_at TO review_trigger_fired_at;
  END IF;

  -- Rename escalate_fired_trigger_type -> review_fired_trigger_type
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'escalate_fired_trigger_type') THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalate_fired_trigger_type TO review_fired_trigger_type;
  END IF;

  -- Rename escalate_to_user_id -> reviewer_id
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'escalate_to_user_id') THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalate_to_user_id TO reviewer_id;
  END IF;

  -- Rename escalated_at -> review_requested_at
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'escalated_at') THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalated_at TO review_requested_at;
  END IF;

  -- Rename escalate_reason -> review_reason
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'escalate_reason') THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalate_reason TO review_reason;
  END IF;
END $$;

-- Add review-specific columns (IF NOT EXISTS is idempotent)
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS review_status TEXT CHECK (review_status IN ('pending', 'approved', 'changes_requested')),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewer_comments TEXT;

-- Update comments (idempotent - overwrites existing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'review_triggers') THEN
    COMMENT ON COLUMN public.workflow_executions.review_triggers IS
    'Array of trigger configurations for notifying reviewer. Same structure as wake_triggers.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'review_trigger_logic') THEN
    COMMENT ON COLUMN public.workflow_executions.review_trigger_logic IS
    'How to combine review triggers: OR (any trigger fires) or AND (all triggers must fire). Defaults to OR.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'reviewer_id') THEN
    COMMENT ON COLUMN public.workflow_executions.reviewer_id IS
    'User ID who is requested to review this workflow.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'review_requested_at') THEN
    COMMENT ON COLUMN public.workflow_executions.review_requested_at IS
    'Timestamp when review was requested.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'review_reason') THEN
    COMMENT ON COLUMN public.workflow_executions.review_reason IS
    'Optional reason provided when review was requested.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'review_status') THEN
    COMMENT ON COLUMN public.workflow_executions.review_status IS
    'Status of the review: pending, approved, or changes_requested.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'reviewed_at') THEN
    COMMENT ON COLUMN public.workflow_executions.reviewed_at IS
    'Timestamp when reviewer approved or requested changes.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_executions'
             AND column_name = 'reviewer_comments') THEN
    COMMENT ON COLUMN public.workflow_executions.reviewer_comments IS
    'Comments from reviewer when approving or requesting changes.';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: RENAME HISTORY TABLE (idempotent)
-- ============================================================================

DO $$
BEGIN
  -- Rename workflow_escalate_triggers -> workflow_review_triggers
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'workflow_escalate_triggers') THEN
    ALTER TABLE public.workflow_escalate_triggers RENAME TO workflow_review_triggers;
  END IF;
END $$;

-- Update table comment (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'workflow_review_triggers') THEN
    COMMENT ON TABLE public.workflow_review_triggers IS
    'History and debugging log for review trigger evaluations. Tracks when triggers are evaluated, if they fire, and any errors.';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: UPDATE INDEXES (idempotent)
-- ============================================================================

DO $$
BEGIN
  -- Rename idx_workflow_escalate_triggers_execution -> idx_workflow_review_triggers_execution
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_workflow_escalate_triggers_execution') THEN
    ALTER INDEX idx_workflow_escalate_triggers_execution RENAME TO idx_workflow_review_triggers_execution;
  END IF;

  -- Rename idx_workflow_escalate_triggers_fired -> idx_workflow_review_triggers_fired
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_workflow_escalate_triggers_fired') THEN
    ALTER INDEX idx_workflow_escalate_triggers_fired RENAME TO idx_workflow_review_triggers_fired;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: UPDATE RLS POLICIES (idempotent with DROP IF EXISTS)
-- ============================================================================

-- Only create policies if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'workflow_review_triggers') THEN

    -- Drop old policies (both old and new names for idempotency)
    DROP POLICY IF EXISTS "Users can view their workflow escalate triggers" ON public.workflow_review_triggers;
    DROP POLICY IF EXISTS "Users can create workflow escalate triggers" ON public.workflow_review_triggers;
    DROP POLICY IF EXISTS "Users can update workflow escalate triggers" ON public.workflow_review_triggers;
    DROP POLICY IF EXISTS "Users can view their workflow review triggers" ON public.workflow_review_triggers;
    DROP POLICY IF EXISTS "Users can create workflow review triggers" ON public.workflow_review_triggers;
    DROP POLICY IF EXISTS "Users can update workflow review triggers" ON public.workflow_review_triggers;

    -- Create new policies with review terminology
    CREATE POLICY "Users can view their workflow review triggers"
      ON public.workflow_review_triggers
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.workflow_executions we
          WHERE we.id = workflow_review_triggers.workflow_execution_id
          AND (we.user_id = auth.uid() OR we.reviewer_id = auth.uid() OR auth.role() = 'authenticated')
        )
      );

    CREATE POLICY "Users can create workflow review triggers"
      ON public.workflow_review_triggers
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.workflow_executions we
          WHERE we.id = workflow_review_triggers.workflow_execution_id
          AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
        )
      );

    CREATE POLICY "Users can update workflow review triggers"
      ON public.workflow_review_triggers
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.workflow_executions we
          WHERE we.id = workflow_review_triggers.workflow_execution_id
          AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
        )
      );
  END IF;
END $$;

-- ============================================================================
-- STEP 5: UPDATE FUNCTIONS (idempotent with CREATE OR REPLACE)
-- ============================================================================

-- Drop old function if exists
DROP FUNCTION IF EXISTS public.get_escalated_workflows_for_evaluation(INTEGER);

-- Create new function (CREATE OR REPLACE is idempotent)
CREATE OR REPLACE FUNCTION public.get_workflows_pending_review_for_evaluation(
  p_evaluation_interval_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  workflow_execution_id UUID,
  review_triggers JSONB,
  review_last_evaluated_at TIMESTAMPTZ,
  customer_id UUID,
  user_id UUID,
  reviewer_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    we.id,
    we.review_triggers,
    we.review_last_evaluated_at,
    we.customer_id,
    we.user_id,
    we.reviewer_id
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

COMMENT ON FUNCTION public.get_workflows_pending_review_for_evaluation IS
'Returns workflows with pending reviews that need trigger evaluation. Called by cron job every 5 minutes.';

-- Drop old timestamp function
DROP FUNCTION IF EXISTS public.update_workflow_escalate_trigger_timestamp() CASCADE;

-- Create new timestamp function
CREATE OR REPLACE FUNCTION public.update_workflow_review_trigger_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Update trigger (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'workflow_review_triggers') THEN
    DROP TRIGGER IF EXISTS workflow_escalate_triggers_updated_at ON public.workflow_review_triggers;
    DROP TRIGGER IF EXISTS workflow_review_triggers_updated_at ON public.workflow_review_triggers;

    CREATE TRIGGER workflow_review_triggers_updated_at
        BEFORE UPDATE ON public.workflow_review_triggers
        FOR EACH ROW
        EXECUTE FUNCTION public.update_workflow_review_trigger_timestamp();
  END IF;
END $$;

-- ============================================================================
-- STEP 6: ADD STEP-LEVEL REVIEW COLUMNS (idempotent with ADD COLUMN IF NOT EXISTS)
-- ============================================================================

-- Add review columns to workflow_step_executions for per-step reviews
ALTER TABLE public.workflow_step_executions
  ADD COLUMN IF NOT EXISTS review_required_from UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS review_status TEXT CHECK (review_status IN ('pending', 'approved', 'changes_requested')),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewer_comments TEXT;

-- Add comments (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_step_executions'
             AND column_name = 'review_required_from') THEN
    COMMENT ON COLUMN public.workflow_step_executions.review_required_from IS
    'User ID who is requested to review this specific step before it can be completed.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_step_executions'
             AND column_name = 'review_status') THEN
    COMMENT ON COLUMN public.workflow_step_executions.review_status IS
    'Status of the step review: pending, approved, or changes_requested.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_step_executions'
             AND column_name = 'reviewed_at') THEN
    COMMENT ON COLUMN public.workflow_step_executions.reviewed_at IS
    'Timestamp when step review was completed.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'workflow_step_executions'
             AND column_name = 'reviewer_comments') THEN
    COMMENT ON COLUMN public.workflow_step_executions.reviewer_comments IS
    'Comments from reviewer for this specific step.';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check workflow_executions columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workflow_executions'
  AND column_name LIKE '%review%'
ORDER BY column_name;

-- Check workflow_review_triggers table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'workflow_review_triggers'
) as review_triggers_table_exists;

-- Check step-level review columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workflow_step_executions'
  AND column_name LIKE '%review%'
ORDER BY column_name;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Escalate has been converted to Review-Only mode.
-- - Workflow-level review: reviewer_id, review_status, reviewed_at, reviewer_comments
-- - Step-level review: review_required_from, review_status, reviewed_at, reviewer_comments
-- - Triggers remain for notification timing
-- - All operations are idempotent and can be re-run safely
-- ============================================================================
