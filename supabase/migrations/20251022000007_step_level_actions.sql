-- Step-Level Snooze & Skip
-- Allows users to snooze or skip individual workflow steps

-- ============================================
-- 1. Create workflow_step_states table
-- ============================================

CREATE TABLE IF NOT EXISTS public.workflow_step_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  step_label TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'snoozed', 'skipped')),

  -- Snooze fields
  snooze_until TIMESTAMPTZ,
  snooze_days INTEGER,
  snoozed_at TIMESTAMPTZ,

  -- Skip fields
  skipped_at TIMESTAMPTZ,
  skip_reason TEXT,

  -- Completion fields
  completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(execution_id, step_index)
);

-- Index for querying step states
CREATE INDEX IF NOT EXISTS idx_workflow_step_states_execution
  ON public.workflow_step_states(execution_id);

CREATE INDEX IF NOT EXISTS idx_workflow_step_states_status
  ON public.workflow_step_states(status);

CREATE INDEX IF NOT EXISTS idx_workflow_step_states_snooze
  ON public.workflow_step_states(snooze_until)
  WHERE status = 'snoozed';

-- ============================================
-- 2. Create workflow_step_actions table (audit log)
-- ============================================

CREATE TABLE IF NOT EXISTS public.workflow_step_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  step_label TEXT,

  performed_by UUID REFERENCES public.profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('snooze', 'unsnooze', 'skip', 'complete', 'start')),

  previous_status TEXT,
  new_status TEXT NOT NULL,

  action_data JSONB DEFAULT '{}'::jsonb,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_workflow_step_actions_execution
  ON public.workflow_step_actions(execution_id);

CREATE INDEX IF NOT EXISTS idx_workflow_step_actions_performed_by
  ON public.workflow_step_actions(performed_by);

CREATE INDEX IF NOT EXISTS idx_workflow_step_actions_type
  ON public.workflow_step_actions(action_type);

-- ============================================
-- 3. Add column to workflow_executions
-- ============================================

-- Track if workflow has snoozed steps
ALTER TABLE public.workflow_executions
ADD COLUMN IF NOT EXISTS has_snoozed_steps BOOLEAN DEFAULT false;

-- Track next due step date (for prioritization)
ALTER TABLE public.workflow_executions
ADD COLUMN IF NOT EXISTS next_due_step_date TIMESTAMPTZ;

-- ============================================
-- 4. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.workflow_step_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_step_actions ENABLE ROW LEVEL SECURITY;

-- workflow_step_states policies
CREATE POLICY "workflow_step_states_select_policy" ON public.workflow_step_states
FOR SELECT USING (
  is_demo_mode() OR
  EXISTS (
    SELECT 1 FROM workflow_executions we
    WHERE we.id = execution_id
    AND (we.assigned_csm_id = auth.uid() OR we.user_id = auth.uid())
  )
);

CREATE POLICY "workflow_step_states_insert_policy" ON public.workflow_step_states
FOR INSERT WITH CHECK (
  is_demo_mode() OR
  EXISTS (
    SELECT 1 FROM workflow_executions we
    WHERE we.id = execution_id
    AND (we.assigned_csm_id = auth.uid() OR we.user_id = auth.uid())
  )
);

CREATE POLICY "workflow_step_states_update_policy" ON public.workflow_step_states
FOR UPDATE USING (
  is_demo_mode() OR
  EXISTS (
    SELECT 1 FROM workflow_executions we
    WHERE we.id = execution_id
    AND (we.assigned_csm_id = auth.uid() OR we.user_id = auth.uid())
  )
) WITH CHECK (
  is_demo_mode() OR
  EXISTS (
    SELECT 1 FROM workflow_executions we
    WHERE we.id = execution_id
    AND (we.assigned_csm_id = auth.uid() OR we.user_id = auth.uid())
  )
);

-- workflow_step_actions policies
CREATE POLICY "workflow_step_actions_select_policy" ON public.workflow_step_actions
FOR SELECT USING (
  is_demo_mode() OR
  performed_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM workflow_executions we
    WHERE we.id = execution_id
    AND (we.assigned_csm_id = auth.uid() OR we.user_id = auth.uid())
  )
);

CREATE POLICY "workflow_step_actions_insert_policy" ON public.workflow_step_actions
FOR INSERT WITH CHECK (
  is_demo_mode() OR
  performed_by = auth.uid()
);

-- ============================================
-- 5. Helper function to update workflow flags
-- ============================================

CREATE OR REPLACE FUNCTION public.update_workflow_step_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update has_snoozed_steps flag
  UPDATE workflow_executions
  SET
    has_snoozed_steps = EXISTS (
      SELECT 1 FROM workflow_step_states
      WHERE execution_id = NEW.execution_id
      AND status = 'snoozed'
    ),
    next_due_step_date = (
      SELECT MIN(snooze_until)
      FROM workflow_step_states
      WHERE execution_id = NEW.execution_id
      AND status = 'snoozed'
      AND snooze_until IS NOT NULL
    ),
    updated_at = NOW()
  WHERE id = NEW.execution_id;

  RETURN NEW;
END;
$$;

-- Trigger to auto-update workflow flags when step states change
DROP TRIGGER IF EXISTS trigger_update_workflow_step_flags ON public.workflow_step_states;
CREATE TRIGGER trigger_update_workflow_step_flags
AFTER INSERT OR UPDATE ON public.workflow_step_states
FOR EACH ROW
EXECUTE FUNCTION public.update_workflow_step_flags();

-- ============================================
-- 6. View for steps due today
-- ============================================

CREATE OR REPLACE VIEW public.workflow_steps_due AS
SELECT
  wss.*,
  we.workflow_name,
  we.assigned_csm_id,
  c.name as customer_name,
  p.full_name as assigned_csm_name
FROM workflow_step_states wss
JOIN workflow_executions we ON we.id = wss.execution_id
LEFT JOIN customers c ON c.id = we.customer_id
LEFT JOIN profiles p ON p.id = we.assigned_csm_id
WHERE
  wss.status = 'snoozed'
  AND wss.snooze_until <= NOW()
ORDER BY wss.snooze_until ASC;

COMMENT ON VIEW public.workflow_steps_due IS 'Shows all snoozed steps that are now due (snooze_until has passed)';

-- ============================================
-- 7. Grant permissions
-- ============================================

GRANT SELECT, INSERT, UPDATE ON public.workflow_step_states TO anon, authenticated;
GRANT SELECT, INSERT ON public.workflow_step_actions TO anon, authenticated;
GRANT SELECT ON public.workflow_steps_due TO anon, authenticated;
