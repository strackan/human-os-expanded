-- ============================================================================
-- Phase 3E: Workflow State Management & Saved Actions
-- ============================================================================
-- Purpose: Add comprehensive state management for workflows with action tracking
-- Date: 2025-10-22
-- ============================================================================

-- 1. Extend workflow_executions status enum
-- Add new statuses: rejected, lost, skipped, escalated
ALTER TABLE public.workflow_executions
DROP CONSTRAINT IF EXISTS workflow_executions_status_check;

ALTER TABLE public.workflow_executions
ADD CONSTRAINT workflow_executions_status_check CHECK (
  status IN (
    'not_started',    -- Initial state
    'in_progress',    -- Actively being worked
    'completed',      -- Successfully finished
    'snoozed',        -- Temporarily hidden (until snooze_until)
    'abandoned',      -- Stopped without completion
    'rejected',       -- CSM decided not to pursue
    'lost',           -- Customer churned/deal lost
    'skipped',        -- Intentionally skipped
    'escalated'       -- Reassigned to another user
  )
);

-- 2. Add missing columns to workflow_executions
ALTER TABLE public.workflow_executions
ADD COLUMN IF NOT EXISTS escalated_from UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_reason TEXT,
ADD COLUMN IF NOT EXISTS lost_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lost_reason TEXT,
ADD COLUMN IF NOT EXISTS action_metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Create workflow_actions audit table
CREATE TABLE IF NOT EXISTS public.workflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  performed_by UUID NOT NULL REFERENCES public.profiles(id),

  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'snooze',       -- Postpone workflow
    'unsnooze',     -- Resume snoozed workflow
    'skip',         -- Skip workflow entirely
    'escalate',     -- Reassign to another user
    'resume',       -- Resume abandoned workflow
    'complete',     -- Mark as complete
    'reject',       -- Reject workflow
    'lose',         -- Mark as lost
    'start'         -- Start workflow
  )),

  -- State tracking
  previous_status TEXT,
  new_status TEXT NOT NULL,

  -- Action-specific data
  action_data JSONB DEFAULT '{}'::jsonb,
  -- Examples:
  -- snooze: { "until": "2025-10-25T00:00:00Z", "days": 3, "reason": "waiting for response" }
  -- escalate: { "to_user_id": "uuid", "reason": "needs senior review" }
  -- skip: { "reason": "customer not interested" }
  -- reject: { "reason": "duplicate workflow" }

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_actions_execution ON public.workflow_actions(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_performed_by ON public.workflow_actions(performed_by);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_type ON public.workflow_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_created ON public.workflow_actions(created_at DESC);

-- Update existing indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_escalated_from ON public.workflow_executions(escalated_from) WHERE escalated_from IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status_assigned ON public.workflow_executions(status, assigned_csm_id);

-- 5. Create helper function to record actions
CREATE OR REPLACE FUNCTION record_workflow_action(
  p_execution_id UUID,
  p_user_id UUID,
  p_action_type TEXT,
  p_new_status TEXT,
  p_action_data JSONB DEFAULT '{}'::jsonb,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_previous_status TEXT;
  v_action_id UUID;
BEGIN
  -- Get current status
  SELECT status INTO v_previous_status
  FROM workflow_executions
  WHERE id = p_execution_id;

  -- Insert action record
  INSERT INTO workflow_actions (
    execution_id,
    performed_by,
    action_type,
    previous_status,
    new_status,
    action_data,
    notes
  ) VALUES (
    p_execution_id,
    p_user_id,
    p_action_type,
    v_previous_status,
    p_new_status,
    p_action_data,
    p_notes
  ) RETURNING id INTO v_action_id;

  -- Update execution status
  UPDATE workflow_executions
  SET
    status = p_new_status,
    updated_at = NOW(),
    last_activity_at = NOW()
  WHERE id = p_execution_id;

  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enable RLS on workflow_actions
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their workflow actions" ON public.workflow_actions;
CREATE POLICY "Users can view their workflow actions" ON public.workflow_actions
FOR SELECT USING (
  performed_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM workflow_executions we
    WHERE we.id = workflow_actions.execution_id
    AND (we.assigned_csm_id = auth.uid() OR we.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can create workflow actions" ON public.workflow_actions;
CREATE POLICY "Users can create workflow actions" ON public.workflow_actions
FOR INSERT WITH CHECK (
  performed_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM workflow_executions we
    WHERE we.id = execution_id
    AND (we.assigned_csm_id = auth.uid() OR we.user_id = auth.uid())
  )
);

-- 7. Create view for active workflows (excludes snoozed/skipped/escalated)
CREATE OR REPLACE VIEW public.active_workflows AS
SELECT
  we.*,
  c.name as customer_name,
  p.full_name as assigned_csm_name
FROM workflow_executions we
LEFT JOIN customers c ON c.id = we.customer_id
LEFT JOIN profiles p ON p.id = we.assigned_csm_id
WHERE
  we.status NOT IN ('snoozed', 'skipped', 'escalated', 'completed', 'abandoned', 'rejected', 'lost')
  OR (we.status = 'snoozed' AND we.snooze_until <= NOW());

-- 8. Create view for snoozed workflows that are due
CREATE OR REPLACE VIEW public.snoozed_workflows_due AS
SELECT
  we.*,
  c.name as customer_name,
  p.full_name as assigned_csm_name
FROM workflow_executions we
LEFT JOIN customers c ON c.id = we.customer_id
LEFT JOIN profiles p ON p.id = we.assigned_csm_id
WHERE
  we.status = 'snoozed'
  AND we.snooze_until <= NOW();

-- 9. Create view for escalated workflows
CREATE OR REPLACE VIEW public.escalated_workflows AS
SELECT
  we.*,
  c.name as customer_name,
  p_from.full_name as escalated_from_name,
  p_to.full_name as escalated_to_name
FROM workflow_executions we
LEFT JOIN customers c ON c.id = we.customer_id
LEFT JOIN profiles p_from ON p_from.id = we.escalated_from
LEFT JOIN profiles p_to ON p_to.id = we.escalation_user_id
WHERE we.status = 'escalated';

-- Grant permissions
GRANT SELECT ON public.active_workflows TO authenticated;
GRANT SELECT ON public.snoozed_workflows_due TO authenticated;
GRANT SELECT ON public.escalated_workflows TO authenticated;

DO $$
BEGIN
  RAISE NOTICE 'Phase 3E: Workflow state management and saved actions migration complete';
END $$;
