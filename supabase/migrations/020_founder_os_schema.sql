-- Human OS Migration: Founder OS Schema
-- Creates founder_os schema for personal executive system
-- This is a VIEW into Human OS for task/goal/planning management

-- =============================================================================
-- CREATE SCHEMA
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS founder_os;

-- =============================================================================
-- CONTEXTS TABLE
-- Project/area tags for organizing tasks and goals (e.g., Renubu, Good Hang, Family)
-- =============================================================================
CREATE TABLE IF NOT EXISTS founder_os.contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,  -- Hex color for UI (e.g., #FF5733)
  icon TEXT,   -- Emoji or icon name
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_os_contexts_user_id ON founder_os.contexts(user_id);

-- =============================================================================
-- GOALS TABLE
-- Hierarchical OKRs (yearly -> quarterly -> monthly -> weekly)
-- =============================================================================
CREATE TABLE IF NOT EXISTS founder_os.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type VARCHAR(20) CHECK (type IN ('objective', 'key_result')),
  parent_id UUID REFERENCES founder_os.goals(id) ON DELETE SET NULL,
  timeframe VARCHAR(20) CHECK (timeframe IN ('yearly', 'quarterly', 'monthly', 'weekly')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,  -- e.g., '$', 'users', 'meetings', '%'
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_os_goals_user_id ON founder_os.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_founder_os_goals_timeframe ON founder_os.goals(timeframe);
CREATE INDEX IF NOT EXISTS idx_founder_os_goals_parent_id ON founder_os.goals(parent_id);

-- =============================================================================
-- TASKS TABLE
-- GTD-style task management with priority, status, context tags, energy levels
-- =============================================================================
CREATE TABLE IF NOT EXISTS founder_os.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'archived')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  context_tags TEXT[],  -- Array of context names
  energy_level VARCHAR(20) CHECK (energy_level IN ('high', 'medium', 'low')),
  estimated_minutes INTEGER,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_os_tasks_user_id ON founder_os.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_founder_os_tasks_status ON founder_os.tasks(status);
CREATE INDEX IF NOT EXISTS idx_founder_os_tasks_priority ON founder_os.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_founder_os_tasks_due_date ON founder_os.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_founder_os_tasks_context_tags ON founder_os.tasks USING GIN(context_tags);

-- =============================================================================
-- TASK-GOAL LINKS (Junction Table)
-- Links tasks to goals for tracking progress toward objectives
-- =============================================================================
CREATE TABLE IF NOT EXISTS founder_os.task_goal_links (
  task_id UUID NOT NULL REFERENCES founder_os.tasks(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES founder_os.goals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, goal_id)
);

CREATE INDEX IF NOT EXISTS idx_founder_os_task_goal_links_task_id ON founder_os.task_goal_links(task_id);
CREATE INDEX IF NOT EXISTS idx_founder_os_task_goal_links_goal_id ON founder_os.task_goal_links(goal_id);

-- =============================================================================
-- DAILY PLANS TABLE
-- Morning intentions and evening reflections for each day
-- =============================================================================
CREATE TABLE IF NOT EXISTS founder_os.daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_date DATE NOT NULL,
  morning_intention TEXT,
  time_blocks JSONB,  -- Structured day plan
  evening_reflection TEXT,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, plan_date)
);

CREATE INDEX IF NOT EXISTS idx_founder_os_daily_plans_user_id ON founder_os.daily_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_founder_os_daily_plans_plan_date ON founder_os.daily_plans(plan_date);

-- =============================================================================
-- RELATIONSHIPS TABLE
-- Track key relationships (investors, team, family) and communication cadence
-- =============================================================================
CREATE TABLE IF NOT EXISTS founder_os.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,  -- e.g., 'investor', 'co-founder', 'friend', 'advisor'
  last_contact DATE,
  contact_frequency_days INTEGER,  -- Desired contact every N days
  notes TEXT,
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'concerned', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_os_relationships_user_id ON founder_os.relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_founder_os_relationships_last_contact ON founder_os.relationships(last_contact);

-- =============================================================================
-- CHECK-INS TABLE
-- Qualitative mood/energy/gratitude tracking for self-awareness
-- =============================================================================
CREATE TABLE IF NOT EXISTS founder_os.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  check_in_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mood VARCHAR(20) CHECK (mood IN ('great', 'good', 'okay', 'stressed', 'overwhelmed')),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  gratitude TEXT,
  challenges TEXT,
  wins TEXT,
  needs_support BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_os_check_ins_user_id ON founder_os.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_founder_os_check_ins_date ON founder_os.check_ins(check_in_date);

-- =============================================================================
-- AUTO-UPDATE TRIGGERS
-- =============================================================================
DROP TRIGGER IF EXISTS update_founder_os_contexts_updated_at ON founder_os.contexts;
CREATE TRIGGER update_founder_os_contexts_updated_at
  BEFORE UPDATE ON founder_os.contexts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_founder_os_goals_updated_at ON founder_os.goals;
CREATE TRIGGER update_founder_os_goals_updated_at
  BEFORE UPDATE ON founder_os.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_founder_os_tasks_updated_at ON founder_os.tasks;
CREATE TRIGGER update_founder_os_tasks_updated_at
  BEFORE UPDATE ON founder_os.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_founder_os_daily_plans_updated_at ON founder_os.daily_plans;
CREATE TRIGGER update_founder_os_daily_plans_updated_at
  BEFORE UPDATE ON founder_os.daily_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_founder_os_relationships_updated_at ON founder_os.relationships;
CREATE TRIGGER update_founder_os_relationships_updated_at
  BEFORE UPDATE ON founder_os.relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS POLICIES (Service role bypasses, but useful for future auth)
-- =============================================================================
ALTER TABLE founder_os.contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_os.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_os.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_os.task_goal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_os.daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_os.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_os.check_ins ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
DROP POLICY IF EXISTS "Service role full access" ON founder_os.contexts;
CREATE POLICY "Service role full access" ON founder_os.contexts FOR ALL USING (true);
DROP POLICY IF EXISTS "Service role full access" ON founder_os.goals;
CREATE POLICY "Service role full access" ON founder_os.goals FOR ALL USING (true);
DROP POLICY IF EXISTS "Service role full access" ON founder_os.tasks;
CREATE POLICY "Service role full access" ON founder_os.tasks FOR ALL USING (true);
DROP POLICY IF EXISTS "Service role full access" ON founder_os.task_goal_links;
CREATE POLICY "Service role full access" ON founder_os.task_goal_links FOR ALL USING (true);
DROP POLICY IF EXISTS "Service role full access" ON founder_os.daily_plans;
CREATE POLICY "Service role full access" ON founder_os.daily_plans FOR ALL USING (true);
DROP POLICY IF EXISTS "Service role full access" ON founder_os.relationships;
CREATE POLICY "Service role full access" ON founder_os.relationships FOR ALL USING (true);
DROP POLICY IF EXISTS "Service role full access" ON founder_os.check_ins;
CREATE POLICY "Service role full access" ON founder_os.check_ins FOR ALL USING (true);

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON SCHEMA founder_os IS 'Personal executive system - VIEW into Human OS for task/goal/planning management';
COMMENT ON TABLE founder_os.contexts IS 'Project/area tags for organizing tasks and goals';
COMMENT ON TABLE founder_os.goals IS 'Hierarchical OKRs with progress tracking';
COMMENT ON TABLE founder_os.tasks IS 'GTD-style task management with context, priority, and energy levels';
COMMENT ON TABLE founder_os.task_goal_links IS 'Links tasks to goals for progress tracking';
COMMENT ON TABLE founder_os.daily_plans IS 'Daily intentions and reflections';
COMMENT ON TABLE founder_os.relationships IS 'Key relationship tracking with communication cadence';
COMMENT ON TABLE founder_os.check_ins IS 'Qualitative mood and energy tracking';
