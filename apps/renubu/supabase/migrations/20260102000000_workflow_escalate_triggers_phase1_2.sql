-- ============================================================================
-- Workflow Escalate Trigger Framework - Phase 1.2
-- Foundation: Unified Trigger Architecture for Escalate Actions
-- ============================================================================
--
-- This migration extends the trigger framework to support escalating workflows.
-- Mirrors Phase 1.0 (snooze) and Phase 1.1 (skip) architecture with escalate-specific terminology.
--
-- Key insight: Escalate uses the same trigger framework as Snooze and Skip.
-- When an escalate trigger fires, the workflow is flagged for the escalated user's attention.
--
-- Deliverables:
-- 1. Add escalate_triggers JSONB column to workflow_executions table
-- 2. Add escalate trigger evaluation tracking columns to workflow_executions
-- 3. Add escalate_to_user_id column (who receives the escalation)
-- 4. Create workflow_escalate_triggers table (for history/debugging)
-- 5. Create indexes for efficient escalate trigger evaluation
-- 6. Create helper function for escalate evaluation cron job
-- ============================================================================

-- ============================================================================
-- SECTION 1: ALTER workflow_executions TABLE
-- ============================================================================

-- Add escalate trigger-related columns to workflow_executions
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS escalate_triggers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS escalate_trigger_logic TEXT DEFAULT 'OR' CHECK (escalate_trigger_logic IN ('OR', 'AND')),
  ADD COLUMN IF NOT EXISTS escalate_last_evaluated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalate_trigger_fired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalate_fired_trigger_type TEXT,
  ADD COLUMN IF NOT EXISTS escalate_to_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalate_reason TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.workflow_executions.escalate_triggers IS
'Array of trigger configurations that can fire escalation notifications for this workflow. Each trigger has: id, type (date|event), config, createdAt';

COMMENT ON COLUMN public.workflow_executions.escalate_trigger_logic IS
'Logic for combining multiple escalate triggers: OR (any trigger fires) or AND (all triggers must fire). Default: OR';

COMMENT ON COLUMN public.workflow_executions.escalate_last_evaluated_at IS
'Timestamp when escalate triggers were last evaluated for this workflow. Used by cron job to track evaluation cadence.';

COMMENT ON COLUMN public.workflow_executions.escalate_trigger_fired_at IS
'Timestamp when an escalate trigger fired and notified the escalated user. Cleared when workflow is resolved.';

COMMENT ON COLUMN public.workflow_executions.escalate_fired_trigger_type IS
'Type of escalate trigger that fired (date|event). Cleared when workflow is resolved.';

COMMENT ON COLUMN public.workflow_executions.escalate_to_user_id IS
'User ID who should receive escalation notifications. Set when workflow is escalated.';

COMMENT ON COLUMN public.workflow_executions.escalated_at IS
'Timestamp when workflow was escalated. Cleared when workflow is resolved.';

COMMENT ON COLUMN public.workflow_executions.escalate_reason IS
'Reason for escalation. Cleared when workflow is resolved.';

-- ============================================================================
-- SECTION 2: CREATE workflow_escalate_triggers TABLE
-- ============================================================================

-- This table provides history and debugging for escalate trigger evaluations
-- It's a detailed log of all escalate trigger evaluations, separate from the workflow_executions JSONB
CREATE TABLE IF NOT EXISTS public.workflow_escalate_triggers (
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
COMMENT ON TABLE public.workflow_escalate_triggers IS
'History and debugging log for workflow escalate trigger evaluations. Tracks when escalate triggers are evaluated, if they fire, and any errors.';

COMMENT ON COLUMN public.workflow_escalate_triggers.trigger_config IS
'JSONB configuration for the escalate trigger. For date triggers: {date, timezone}. For event triggers: {eventType, eventConfig}.';

COMMENT ON COLUMN public.workflow_escalate_triggers.evaluation_count IS
'Number of times this escalate trigger has been evaluated. Useful for debugging trigger evaluation frequency.';

-- ============================================================================
-- SECTION 3: CREATE INDEXES
-- ============================================================================

-- Index for efficient GIN queries on escalate_triggers JSONB
CREATE INDEX IF NOT EXISTS idx_workflow_executions_escalate_triggers
  ON public.workflow_executions USING GIN (escalate_triggers);

-- Composite index for finding escalated workflows that need trigger evaluation
-- This is the primary index used by the escalate evaluation cron job
CREATE INDEX IF NOT EXISTS idx_workflow_executions_escalate_evaluation
  ON public.workflow_executions(status, escalate_last_evaluated_at)
  WHERE status = 'escalated';

-- Indexes for workflow_escalate_triggers table
CREATE INDEX IF NOT EXISTS idx_workflow_escalate_triggers_execution
  ON public.workflow_escalate_triggers(workflow_execution_id);

CREATE INDEX IF NOT EXISTS idx_workflow_escalate_triggers_fired
  ON public.workflow_escalate_triggers(is_fired, trigger_type);

-- ============================================================================
-- SECTION 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.workflow_escalate_triggers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 5: CREATE RLS POLICIES
-- ============================================================================

-- Users can view escalate trigger history for their own workflow executions
CREATE POLICY "Users can view their workflow escalate triggers"
  ON public.workflow_escalate_triggers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_escalate_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

-- Users can create escalate trigger history for their own workflow executions
CREATE POLICY "Users can create workflow escalate triggers"
  ON public.workflow_escalate_triggers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_escalate_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

-- Users can update escalate trigger history for their own workflow executions
CREATE POLICY "Users can update workflow escalate triggers"
  ON public.workflow_escalate_triggers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_escalate_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

-- ============================================================================
-- SECTION 6: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_workflow_escalate_trigger_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER workflow_escalate_triggers_updated_at
    BEFORE UPDATE ON public.workflow_escalate_triggers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_workflow_escalate_trigger_timestamp();

-- ============================================================================
-- SECTION 7: CREATE HELPER FUNCTIONS FOR ESCALATE TRIGGER EVALUATION
-- ============================================================================

-- Function to get all escalated workflows that need trigger evaluation
-- This is called by the escalate evaluation cron job
CREATE OR REPLACE FUNCTION public.get_escalated_workflows_for_evaluation(
  p_evaluation_interval_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  workflow_execution_id UUID,
  escalate_triggers JSONB,
  escalate_trigger_logic TEXT,
  escalate_last_evaluated_at TIMESTAMPTZ,
  escalate_to_user_id UUID,
  customer_id UUID,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    we.id,
    we.escalate_triggers,
    we.escalate_trigger_logic,
    we.escalate_last_evaluated_at,
    we.escalate_to_user_id,
    we.customer_id,
    we.user_id
  FROM public.workflow_executions we
  WHERE we.status = 'escalated'
    AND we.escalate_triggers IS NOT NULL
    AND jsonb_array_length(we.escalate_triggers) > 0
    AND (
      we.escalate_last_evaluated_at IS NULL
      OR we.escalate_last_evaluated_at < NOW() - (p_evaluation_interval_minutes || ' minutes')::INTERVAL
    )
  ORDER BY we.escalate_last_evaluated_at ASC NULLS FIRST
  LIMIT 100; -- Process 100 workflows per cron run
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_escalated_workflows_for_evaluation IS
'Returns escalated workflows with triggers that need evaluation. Called by escalate evaluation cron job every 5 minutes.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
