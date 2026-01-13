-- ============================================================================
-- Event-Driven Workflow Launcher - Phase 1.4
-- Foundation: Automation Rules for Automatic Workflow Launch
-- ============================================================================
--
-- This migration creates the automation rules framework for automatically
-- launching workflows when external events occur.
--
-- Pattern: "When [event] → Launch [workflow]"
--
-- Key Insight: Automation rules listen for events and automatically create
-- new workflow executions when event conditions are met.
--
-- Deliverables:
-- 1. Create automation_rules table (store rule definitions)
-- 2. Create automation_rule_executions table (audit trail)
-- 3. Create indexes for efficient rule evaluation
-- 4. Create RLS policies (users can only see their own rules)
-- 5. Create helper functions for rule management
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE automation_rules TABLE
-- ============================================================================

-- Main automation rules table
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Workflow to launch
  workflow_config_id TEXT NOT NULL,  -- e.g., 'simple-renewal', 'strategic-qbr'

  -- Rule identification
  name TEXT NOT NULL,
  description TEXT,

  -- Event conditions (max 2, with AND/OR logic)
  event_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  logic_operator TEXT CHECK (logic_operator IN ('AND', 'OR')),

  -- Workflow launch configuration
  assign_to_user_id UUID REFERENCES auth.users(id),

  -- Status and tracking
  is_active BOOLEAN DEFAULT true,
  trigger_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT event_conditions_max_2 CHECK (jsonb_array_length(event_conditions) <= 2),
  CONSTRAINT event_conditions_min_1 CHECK (jsonb_array_length(event_conditions) >= 1),
  CONSTRAINT logic_operator_required_for_multiple CHECK (
    jsonb_array_length(event_conditions) = 1 OR logic_operator IS NOT NULL
  )
);

-- Add table comment
COMMENT ON TABLE public.automation_rules IS
'Automation rules that automatically launch workflows when external events occur. Pattern: When [event] → Launch [workflow]';

-- Add column comments
COMMENT ON COLUMN public.automation_rules.user_id IS
'User who created this automation rule. Rule executions will be associated with this user unless assign_to_user_id is specified.';

COMMENT ON COLUMN public.automation_rules.workflow_config_id IS
'References the workflow configuration ID to launch (e.g., simple-renewal, strategic-qbr)';

COMMENT ON COLUMN public.automation_rules.event_conditions IS
'Array of event conditions (max 2). Each condition has: {id, source, config}. Source examples: gmail_received, calendar_event, slack_message, customer_login, usage_threshold.';

COMMENT ON COLUMN public.automation_rules.logic_operator IS
'Logic for combining multiple event conditions: OR (any condition triggers) or AND (all conditions must trigger). Required when multiple conditions exist.';

COMMENT ON COLUMN public.automation_rules.assign_to_user_id IS
'Optional: Assign launched workflows to a different user. If null, workflows are assigned to the rule creator (user_id).';

COMMENT ON COLUMN public.automation_rules.is_active IS
'Whether this automation rule is currently active. Inactive rules will not launch workflows.';

COMMENT ON COLUMN public.automation_rules.trigger_count IS
'Number of times this rule has successfully triggered and launched a workflow.';

COMMENT ON COLUMN public.automation_rules.last_triggered_at IS
'Timestamp when this rule last successfully triggered and launched a workflow.';

-- ============================================================================
-- SECTION 2: CREATE automation_rule_executions TABLE
-- ============================================================================

-- Audit trail for automation rule executions
CREATE TABLE IF NOT EXISTS public.automation_rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent automation rule
  automation_rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,

  -- Workflow that was launched
  workflow_execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE SET NULL,

  -- Execution details
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  trigger_conditions JSONB,  -- Snapshot of conditions that triggered this execution
  success BOOLEAN NOT NULL,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.automation_rule_executions IS
'Audit trail for automation rule executions. Records every time a rule triggers and attempts to launch a workflow.';

-- Add column comments
COMMENT ON COLUMN public.automation_rule_executions.automation_rule_id IS
'The automation rule that triggered this execution.';

COMMENT ON COLUMN public.automation_rule_executions.workflow_execution_id IS
'The workflow execution that was created. NULL if workflow launch failed.';

COMMENT ON COLUMN public.automation_rule_executions.trigger_conditions IS
'Snapshot of the event conditions that triggered this execution. Useful for debugging and audit trail.';

COMMENT ON COLUMN public.automation_rule_executions.success IS
'Whether the workflow was successfully launched. False indicates an error occurred.';

COMMENT ON COLUMN public.automation_rule_executions.error_message IS
'Error message if workflow launch failed. NULL on success.';

-- ============================================================================
-- SECTION 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Automation rules indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_id
  ON public.automation_rules(user_id);

CREATE INDEX IF NOT EXISTS idx_automation_rules_workflow_config
  ON public.automation_rules(workflow_config_id);

CREATE INDEX IF NOT EXISTS idx_automation_rules_is_active
  ON public.automation_rules(is_active)
  WHERE is_active = true;

-- Composite index for finding active rules for a user
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_active
  ON public.automation_rules(user_id, is_active)
  WHERE is_active = true;

-- GIN index for efficient JSONB queries on event_conditions
CREATE INDEX IF NOT EXISTS idx_automation_rules_event_conditions
  ON public.automation_rules USING GIN (event_conditions);

-- Automation rule executions indexes
CREATE INDEX IF NOT EXISTS idx_automation_rule_executions_rule_id
  ON public.automation_rule_executions(automation_rule_id);

CREATE INDEX IF NOT EXISTS idx_automation_rule_executions_workflow_id
  ON public.automation_rule_executions(workflow_execution_id);

CREATE INDEX IF NOT EXISTS idx_automation_rule_executions_triggered_at
  ON public.automation_rule_executions(triggered_at DESC);

-- Composite index for success/failure analysis
CREATE INDEX IF NOT EXISTS idx_automation_rule_executions_success
  ON public.automation_rule_executions(automation_rule_id, success, triggered_at DESC);

-- ============================================================================
-- SECTION 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rule_executions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 5: CREATE RLS POLICIES
-- ============================================================================

-- Automation rules policies
CREATE POLICY "Users can view their own automation rules"
  ON public.automation_rules
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Users can create automation rules"
  ON public.automation_rules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Users can update their own automation rules"
  ON public.automation_rules
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own automation rules"
  ON public.automation_rules
  FOR DELETE
  USING (auth.uid() = user_id OR auth.role() = 'authenticated');

-- Automation rule executions policies (inherit from parent rule)
CREATE POLICY "Users can view their automation rule executions"
  ON public.automation_rule_executions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_rules ar
      WHERE ar.id = automation_rule_executions.automation_rule_id
      AND (ar.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

CREATE POLICY "System can create automation rule executions"
  ON public.automation_rule_executions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.automation_rules ar
      WHERE ar.id = automation_rule_executions.automation_rule_id
      AND (ar.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

-- ============================================================================
-- SECTION 6: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_automation_rule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER automation_rules_updated_at
    BEFORE UPDATE ON public.automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_automation_rule_timestamp();

-- Function to increment trigger count when rule executes successfully
CREATE OR REPLACE FUNCTION public.increment_automation_rule_trigger_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if execution was successful
  IF NEW.success = true THEN
    UPDATE public.automation_rules
    SET
      trigger_count = trigger_count + 1,
      last_triggered_at = NEW.triggered_at
    WHERE id = NEW.automation_rule_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update rule stats
CREATE TRIGGER automation_rule_executions_update_stats
    AFTER INSERT ON public.automation_rule_executions
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_automation_rule_trigger_count();

-- ============================================================================
-- SECTION 7: CREATE HELPER FUNCTIONS FOR RULE EVALUATION
-- ============================================================================

-- Function to get all active automation rules
-- This is called by the automation rule evaluation service
CREATE OR REPLACE FUNCTION public.get_active_automation_rules()
RETURNS TABLE (
  rule_id UUID,
  user_id UUID,
  workflow_config_id TEXT,
  event_conditions JSONB,
  logic_operator TEXT,
  assign_to_user_id UUID,
  trigger_count INTEGER,
  last_triggered_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id,
    ar.user_id,
    ar.workflow_config_id,
    ar.event_conditions,
    ar.logic_operator,
    ar.assign_to_user_id,
    ar.trigger_count,
    ar.last_triggered_at
  FROM public.automation_rules ar
  WHERE ar.is_active = true
    AND ar.event_conditions IS NOT NULL
    AND jsonb_array_length(ar.event_conditions) > 0
  ORDER BY ar.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_active_automation_rules IS
'Returns all active automation rules for evaluation by the automation service.';

-- Function to get automation rule execution history
CREATE OR REPLACE FUNCTION public.get_automation_rule_execution_history(
  p_automation_rule_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  execution_id UUID,
  workflow_execution_id UUID,
  triggered_at TIMESTAMPTZ,
  trigger_conditions JSONB,
  success BOOLEAN,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    are.id,
    are.workflow_execution_id,
    are.triggered_at,
    are.trigger_conditions,
    are.success,
    are.error_message
  FROM public.automation_rule_executions are
  WHERE are.automation_rule_id = p_automation_rule_id
  ORDER BY are.triggered_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_automation_rule_execution_history IS
'Returns execution history for a specific automation rule. Useful for debugging and analytics.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
