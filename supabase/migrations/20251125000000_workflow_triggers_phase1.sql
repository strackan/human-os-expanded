-- ============================================================================
-- Workflow Trigger Framework - Phase 1.0
-- Foundation: Unified Trigger Architecture
-- ============================================================================
--
-- This migration establishes the foundation for workflow snoozing with triggers.
-- Key insight: DATE and EVENTS are both "triggers" - when a trigger fires, the workflow wakes up.
--
-- Deliverables:
-- 1. Add wake_triggers JSONB column to workflow_executions table
-- 2. Add trigger evaluation tracking columns to workflow_executions
-- 3. Create workflow_wake_triggers table (for history/debugging)
-- 4. Create indexes for efficient trigger evaluation
--
-- Agents 2 & 3 will build on this foundation with:
-- - Agent 2: Cron job for evaluating triggers
-- - Agent 3: UI for snoozing workflows with date/event trigger selection
-- ============================================================================

-- ============================================================================
-- SECTION 1: ALTER workflow_executions TABLE
-- ============================================================================

-- Add trigger-related columns to workflow_executions
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS wake_triggers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_evaluated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trigger_fired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fired_trigger_type TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.workflow_executions.wake_triggers IS
'Array of trigger configurations that can wake this workflow from snoozed state. Each trigger has: id, type (date|event), config, createdAt';

COMMENT ON COLUMN public.workflow_executions.last_evaluated_at IS
'Timestamp when triggers were last evaluated for this workflow. Used by cron job to track evaluation cadence.';

COMMENT ON COLUMN public.workflow_executions.trigger_fired_at IS
'Timestamp when a trigger fired and woke this workflow. Cleared when workflow is snoozed again.';

COMMENT ON COLUMN public.workflow_executions.fired_trigger_type IS
'Type of trigger that fired (date|event). Cleared when workflow is snoozed again.';

-- ============================================================================
-- SECTION 2: CREATE workflow_wake_triggers TABLE
-- ============================================================================

-- This table provides history and debugging for trigger evaluations
-- It's a detailed log of all trigger evaluations, separate from the workflow_executions JSONB
CREATE TABLE IF NOT EXISTS public.workflow_wake_triggers (
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
COMMENT ON TABLE public.workflow_wake_triggers IS
'History and debugging log for workflow trigger evaluations. Tracks when triggers are evaluated, if they fire, and any errors.';

COMMENT ON COLUMN public.workflow_wake_triggers.trigger_config IS
'JSONB configuration for the trigger. For date triggers: {date, timezone}. For event triggers: {eventType, eventConfig}.';

COMMENT ON COLUMN public.workflow_wake_triggers.evaluation_count IS
'Number of times this trigger has been evaluated. Useful for debugging trigger evaluation frequency.';

-- ============================================================================
-- SECTION 3: CREATE INDEXES
-- ============================================================================

-- Index for efficient GIN queries on wake_triggers JSONB
CREATE INDEX IF NOT EXISTS idx_workflow_executions_wake_triggers
  ON public.workflow_executions USING GIN (wake_triggers);

-- Composite index for finding snoozed workflows that need trigger evaluation
-- This is the primary index used by the cron job
CREATE INDEX IF NOT EXISTS idx_workflow_executions_for_evaluation
  ON public.workflow_executions(status, last_evaluated_at)
  WHERE status = 'snoozed';

-- Indexes for workflow_wake_triggers table
CREATE INDEX IF NOT EXISTS idx_workflow_wake_triggers_execution
  ON public.workflow_wake_triggers(workflow_execution_id);

CREATE INDEX IF NOT EXISTS idx_workflow_wake_triggers_fired
  ON public.workflow_wake_triggers(is_fired, trigger_type);

-- ============================================================================
-- SECTION 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.workflow_wake_triggers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 5: CREATE RLS POLICIES
-- ============================================================================

-- Users can view trigger history for their own workflow executions
CREATE POLICY "Users can view their workflow wake triggers"
  ON public.workflow_wake_triggers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_wake_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

-- Users can create trigger history for their own workflow executions
CREATE POLICY "Users can create workflow wake triggers"
  ON public.workflow_wake_triggers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_wake_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

-- Users can update trigger history for their own workflow executions
CREATE POLICY "Users can update workflow wake triggers"
  ON public.workflow_wake_triggers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_wake_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

-- ============================================================================
-- SECTION 6: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_workflow_wake_trigger_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER workflow_wake_triggers_updated_at
    BEFORE UPDATE ON public.workflow_wake_triggers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_workflow_wake_trigger_timestamp();

-- ============================================================================
-- SECTION 7: CREATE HELPER FUNCTIONS FOR TRIGGER EVALUATION
-- ============================================================================

-- Function to get all snoozed workflows that need trigger evaluation
-- This is called by the cron job (Agent 2)
CREATE OR REPLACE FUNCTION public.get_snoozed_workflows_for_evaluation(
  p_evaluation_interval_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  workflow_execution_id UUID,
  wake_triggers JSONB,
  last_evaluated_at TIMESTAMPTZ,
  customer_id UUID,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    we.id,
    we.wake_triggers,
    we.last_evaluated_at,
    we.customer_id,
    we.user_id
  FROM public.workflow_executions we
  WHERE we.status = 'snoozed'
    AND we.wake_triggers IS NOT NULL
    AND jsonb_array_length(we.wake_triggers) > 0
    AND (
      we.last_evaluated_at IS NULL
      OR we.last_evaluated_at < NOW() - (p_evaluation_interval_minutes || ' minutes')::INTERVAL
    )
  ORDER BY we.last_evaluated_at ASC NULLS FIRST
  LIMIT 100; -- Process 100 workflows per cron run
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_snoozed_workflows_for_evaluation IS
'Returns snoozed workflows with triggers that need evaluation. Called by cron job every 5 minutes.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
