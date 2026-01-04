-- ============================================================================
-- Workflow Skip Trigger Framework - Phase 1.1
-- Foundation: Unified Trigger Architecture for Skip Actions
-- ============================================================================
--
-- This migration extends the trigger framework to support skipping workflows.
-- Mirrors Phase 1.0 (snooze) architecture with skip-specific terminology.
--
-- Key insight: Skip uses the same trigger framework as Snooze.
-- When a skip trigger fires, the workflow is reactivated for review.
--
-- Deliverables:
-- 1. Add skip_triggers JSONB column to workflow_executions table
-- 2. Add skip trigger evaluation tracking columns to workflow_executions
-- 3. Create workflow_skip_triggers table (for history/debugging)
-- 4. Create indexes for efficient skip trigger evaluation
-- 5. Create helper function for skip evaluation cron job
-- ============================================================================

-- ============================================================================
-- SECTION 1: ALTER workflow_executions TABLE
-- ============================================================================

-- Add skip trigger-related columns to workflow_executions
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS skip_triggers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS skip_trigger_logic TEXT DEFAULT 'OR' CHECK (skip_trigger_logic IN ('OR', 'AND')),
  ADD COLUMN IF NOT EXISTS skip_last_evaluated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS skip_trigger_fired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS skip_fired_trigger_type TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.workflow_executions.skip_triggers IS
'Array of trigger configurations that can reactivate this workflow from skipped state. Each trigger has: id, type (date|event), config, createdAt';

COMMENT ON COLUMN public.workflow_executions.skip_trigger_logic IS
'Logic for combining multiple skip triggers: OR (any trigger fires) or AND (all triggers must fire). Default: OR';

COMMENT ON COLUMN public.workflow_executions.skip_last_evaluated_at IS
'Timestamp when skip triggers were last evaluated for this workflow. Used by cron job to track evaluation cadence.';

COMMENT ON COLUMN public.workflow_executions.skip_trigger_fired_at IS
'Timestamp when a skip trigger fired and reactivated this workflow. Cleared when workflow is skipped again.';

COMMENT ON COLUMN public.workflow_executions.skip_fired_trigger_type IS
'Type of skip trigger that fired (date|event). Cleared when workflow is skipped again.';

-- ============================================================================
-- SECTION 2: CREATE workflow_skip_triggers TABLE
-- ============================================================================

-- This table provides history and debugging for skip trigger evaluations
-- It's a detailed log of all skip trigger evaluations, separate from the workflow_executions JSONB
CREATE TABLE IF NOT EXISTS public.workflow_skip_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent workflow execution
  workflow_execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,

  -- Trigger configuration
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('date', 'event')),
  trigger_config JSONB NOT NULL,

  -- Evaluation state
  is_fired BOOLEAN DEFAULT false,
  evaluated_at TIMESTAMPTZ,
  evaluation_count INTEGER DEFAULT 0,
  fired_at TIMESTAMPTZ,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.workflow_skip_triggers IS
'History and debugging log for workflow skip trigger evaluations. Tracks when skip triggers are evaluated, if they fire, and any errors.';

COMMENT ON COLUMN public.workflow_skip_triggers.trigger_config IS
'JSONB configuration for the skip trigger. For date triggers: {date, timezone}. For event triggers: {eventType, eventConfig}.';

COMMENT ON COLUMN public.workflow_skip_triggers.evaluation_count IS
'Number of times this skip trigger has been evaluated. Useful for debugging trigger evaluation frequency.';

-- ============================================================================
-- SECTION 3: CREATE INDEXES
-- ============================================================================

-- Index for efficient GIN queries on skip_triggers JSONB
CREATE INDEX IF NOT EXISTS idx_workflow_executions_skip_triggers
  ON public.workflow_executions USING GIN (skip_triggers);

-- Composite index for finding skipped workflows that need trigger evaluation
-- This is the primary index used by the skip evaluation cron job
CREATE INDEX IF NOT EXISTS idx_workflow_executions_skip_evaluation
  ON public.workflow_executions(status, skip_last_evaluated_at)
  WHERE status = 'skipped';

-- Indexes for workflow_skip_triggers table
CREATE INDEX IF NOT EXISTS idx_workflow_skip_triggers_execution
  ON public.workflow_skip_triggers(workflow_execution_id);

CREATE INDEX IF NOT EXISTS idx_workflow_skip_triggers_fired
  ON public.workflow_skip_triggers(is_fired, trigger_type);

-- ============================================================================
-- SECTION 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.workflow_skip_triggers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 5: CREATE RLS POLICIES (idempotent with DROP IF EXISTS)
-- ============================================================================

-- Drop existing policies first for idempotency
DROP POLICY IF EXISTS "Users can view their workflow skip triggers" ON public.workflow_skip_triggers;
DROP POLICY IF EXISTS "Users can create workflow skip triggers" ON public.workflow_skip_triggers;
DROP POLICY IF EXISTS "Users can update workflow skip triggers" ON public.workflow_skip_triggers;

-- Users can view skip trigger history for their own workflow executions
CREATE POLICY "Users can view their workflow skip triggers"
  ON public.workflow_skip_triggers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_skip_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

-- Users can create skip trigger history for their own workflow executions
CREATE POLICY "Users can create workflow skip triggers"
  ON public.workflow_skip_triggers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_skip_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

-- Users can update skip trigger history for their own workflow executions
CREATE POLICY "Users can update workflow skip triggers"
  ON public.workflow_skip_triggers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_skip_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

-- ============================================================================
-- SECTION 6: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_workflow_skip_trigger_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates (idempotent)
DROP TRIGGER IF EXISTS workflow_skip_triggers_updated_at ON public.workflow_skip_triggers;
CREATE TRIGGER workflow_skip_triggers_updated_at
    BEFORE UPDATE ON public.workflow_skip_triggers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_workflow_skip_trigger_timestamp();

-- ============================================================================
-- SECTION 7: CREATE HELPER FUNCTIONS FOR SKIP TRIGGER EVALUATION
-- ============================================================================

-- Function to get all skipped workflows that need trigger evaluation
-- This is called by the skip evaluation cron job
CREATE OR REPLACE FUNCTION public.get_skipped_workflows_for_evaluation(
  p_evaluation_interval_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  workflow_execution_id UUID,
  skip_triggers JSONB,
  skip_trigger_logic TEXT,
  skip_last_evaluated_at TIMESTAMPTZ,
  customer_id UUID,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    we.id,
    we.skip_triggers,
    we.skip_trigger_logic,
    we.skip_last_evaluated_at,
    we.customer_id,
    we.user_id
  FROM public.workflow_executions we
  WHERE we.status = 'skipped'
    AND we.skip_triggers IS NOT NULL
    AND jsonb_array_length(we.skip_triggers) > 0
    AND (
      we.skip_last_evaluated_at IS NULL
      OR we.skip_last_evaluated_at < NOW() - (p_evaluation_interval_minutes || ' minutes')::INTERVAL
    )
  ORDER BY we.skip_last_evaluated_at ASC NULLS FIRST
  LIMIT 100; -- Process 100 workflows per cron run
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_skipped_workflows_for_evaluation IS
'Returns skipped workflows with triggers that need evaluation. Called by skip evaluation cron job every 5 minutes.';

-- ============================================================================
-- SECTION 8: BACKFILL EXISTING SKIPPED WORKFLOWS
-- ============================================================================

-- Convert existing basic skips (with skip_until) to trigger format
-- This ensures backward compatibility with workflows skipped before Phase 1.1
-- Only runs if skip_until column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflow_executions'
    AND column_name = 'skip_until'
  ) THEN
    UPDATE public.workflow_executions
    SET skip_triggers = jsonb_build_array(
      jsonb_build_object(
        'id', 'trigger-date-' || extract(epoch from COALESCE(skipped_at, NOW()))::text,
        'type', 'date',
        'config', jsonb_build_object('date', skip_until),
        'createdAt', COALESCE(skipped_at, NOW())
      )
    ),
    skip_trigger_logic = 'OR'
    WHERE status = 'skipped'
      AND skip_until IS NOT NULL
      AND (skip_triggers IS NULL OR skip_triggers = '[]'::jsonb);

    RAISE NOTICE 'Backfilled existing skipped workflows with date triggers';
  ELSE
    RAISE NOTICE 'skip_until column does not exist, skipping backfill';
  END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
