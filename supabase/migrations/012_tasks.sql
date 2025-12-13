-- Human OS Migration: Tasks with Escalation
-- Tasks with due dates and urgency escalation for "don't let you forget"

-- =============================================================================
-- TASKS TABLE
-- Tracks commitments with due dates and escalating urgency
-- =============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Task identity
  title TEXT NOT NULL,
  description TEXT,

  -- Ownership
  owner_id UUID,                       -- Who owns this task
  assignee_id UUID,                    -- Who should complete it (may differ from owner)
  assignee_name TEXT,                  -- Human-readable name (e.g., "Lisa")

  -- Entity linkage (optional)
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,

  -- Timing
  due_date DATE,                       -- When it's due
  due_time TIME,                       -- Optional specific time
  reminder_days INTEGER[] DEFAULT '{7, 3, 1, 0}',  -- Days before due to escalate

  -- Urgency (computed or manually set)
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN (
    'normal',      -- > 7 days out or no due date
    'upcoming',    -- 3-7 days out
    'urgent',      -- 1-2 days out
    'critical',    -- Due today
    'overdue'      -- Past due
  )),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',     -- Not started
    'in_progress', -- Being worked on
    'blocked',     -- Waiting on something
    'completed',   -- Done
    'cancelled'    -- No longer needed
  )),

  -- Escalation tracking
  last_escalation_at TIMESTAMPTZ,      -- When we last escalated
  escalation_count INTEGER DEFAULT 0,   -- How many times we've escalated
  escalation_notes TEXT[],              -- History of escalation messages

  -- Notification preferences
  notify_on_escalation BOOLEAN DEFAULT true,
  notify_support_person BOOLEAN DEFAULT false,  -- Escalate to support person if overdue

  -- Metadata
  metadata JSONB DEFAULT '{}',
  source_system TEXT,                  -- 'manual', 'renubu', 'calendar', etc.
  source_id TEXT,

  -- Layer scoping
  layer TEXT NOT NULL DEFAULT 'founder:justin',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_urgency ON tasks(urgency);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_layer ON tasks(layer);

-- Composite index for common query: pending tasks by urgency
CREATE INDEX idx_tasks_pending_urgency ON tasks(status, urgency, due_date)
  WHERE status IN ('pending', 'in_progress', 'blocked');

-- Auto-update updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- URGENCY CALCULATION FUNCTION
-- Automatically calculates urgency based on due date
-- =============================================================================
CREATE OR REPLACE FUNCTION calculate_task_urgency(p_due_date DATE)
RETURNS TEXT AS $$
DECLARE
  days_until_due INTEGER;
BEGIN
  IF p_due_date IS NULL THEN
    RETURN 'normal';
  END IF;

  days_until_due := p_due_date - CURRENT_DATE;

  IF days_until_due < 0 THEN
    RETURN 'overdue';
  ELSIF days_until_due = 0 THEN
    RETURN 'critical';
  ELSIF days_until_due <= 2 THEN
    RETURN 'urgent';
  ELSIF days_until_due <= 7 THEN
    RETURN 'upcoming';
  ELSE
    RETURN 'normal';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- TRIGGER TO AUTO-UPDATE URGENCY
-- Recalculates urgency whenever due_date changes
-- =============================================================================
CREATE OR REPLACE FUNCTION update_task_urgency()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-update if status is not completed/cancelled
  IF NEW.status NOT IN ('completed', 'cancelled') THEN
    NEW.urgency := calculate_task_urgency(NEW.due_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_urgency
  BEFORE INSERT OR UPDATE OF due_date, status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_urgency();

-- =============================================================================
-- GET URGENT TASKS FUNCTION
-- Returns tasks that need attention, ordered by urgency
-- =============================================================================
CREATE OR REPLACE FUNCTION get_urgent_tasks(
  p_owner_id UUID DEFAULT NULL,
  p_include_upcoming BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  assignee_name TEXT,
  due_date DATE,
  urgency TEXT,
  status TEXT,
  days_until_due INTEGER,
  escalation_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.assignee_name,
    t.due_date,
    t.urgency,
    t.status,
    (t.due_date - CURRENT_DATE)::INTEGER as days_until_due,
    CASE
      WHEN t.urgency = 'overdue' THEN
        format('%s was due %s days ago and %s STILL hasn''t completed it',
               t.title,
               ABS(t.due_date - CURRENT_DATE),
               COALESCE(t.assignee_name, 'you'))
      WHEN t.urgency = 'critical' THEN
        format('%s is due TODAY. %s needs to complete this now.',
               t.title,
               COALESCE(t.assignee_name, 'You'))
      WHEN t.urgency = 'urgent' THEN
        format('%s is due in %s day(s). This is urgent.',
               t.title,
               t.due_date - CURRENT_DATE)
      WHEN t.urgency = 'upcoming' THEN
        format('%s is coming up (due in %s days)',
               t.title,
               t.due_date - CURRENT_DATE)
      ELSE NULL
    END as escalation_message
  FROM tasks t
  WHERE t.status IN ('pending', 'in_progress', 'blocked')
    AND (p_owner_id IS NULL OR t.owner_id = p_owner_id)
    AND (
      t.urgency IN ('overdue', 'critical', 'urgent')
      OR (p_include_upcoming AND t.urgency = 'upcoming')
    )
  ORDER BY
    CASE t.urgency
      WHEN 'overdue' THEN 1
      WHEN 'critical' THEN 2
      WHEN 'urgent' THEN 3
      WHEN 'upcoming' THEN 4
      ELSE 5
    END,
    t.due_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- RECORD ESCALATION FUNCTION
-- Logs an escalation event on a task
-- =============================================================================
CREATE OR REPLACE FUNCTION record_task_escalation(
  p_task_id UUID,
  p_message TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE tasks
  SET
    escalation_count = escalation_count + 1,
    last_escalation_at = NOW(),
    escalation_notes = array_append(
      COALESCE(escalation_notes, '{}'),
      format('[%s] %s', NOW()::TEXT, p_message)
    )
  WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Owners can do anything with their tasks
CREATE POLICY "tasks_owner_all" ON tasks
  FOR ALL
  USING (owner_id = auth.uid());

-- Users can see tasks assigned to them
CREATE POLICY "tasks_assignee_read" ON tasks
  FOR SELECT
  USING (assignee_id = auth.uid());

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE tasks IS 'Tasks with due dates and urgency escalation';
COMMENT ON COLUMN tasks.urgency IS 'Escalation level: normal, upcoming, urgent, critical, overdue';
COMMENT ON COLUMN tasks.reminder_days IS 'Days before due date to trigger reminders';
COMMENT ON FUNCTION get_urgent_tasks IS 'Get tasks needing attention with escalation messages';
COMMENT ON FUNCTION calculate_task_urgency IS 'Calculate urgency based on days until due';
