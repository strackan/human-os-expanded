-- 059_mcii_priorities.sql
-- MCII-based priorities (Mental Contrasting with Implementation Intentions)
-- Replaces OKR as the default goal-setting framework

-- =============================================================================
-- PRIORITIES TABLE (MCII FORMAT)
-- =============================================================================

CREATE TABLE IF NOT EXISTS founder_os.priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- MCII Framework Fields
  wish TEXT NOT NULL,                         -- "What I want"
  outcome_vision TEXT,                        -- "What changes / how I'll feel when this succeeds"
  obstacle TEXT,                              -- "What's realistically blocking me" (CRITICAL for MCII)
  if_then_plan TEXT,                          -- "When [cue], I will [action]" (implementation intention)

  -- Time Scoping
  quarter TEXT NOT NULL,                      -- 'Q1_2026', 'Q2_2026', etc.
  year INTEGER NOT NULL,                      -- 2026

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'deferred', 'abandoned')),
  completed_at TIMESTAMPTZ,

  -- Priority ordering within quarter (for when user overrides 3 max)
  order_index INTEGER NOT NULL DEFAULT 0,

  -- Links
  identity_profile_id UUID REFERENCES human_os.identity_profiles(id) ON DELETE SET NULL,

  -- Reflection (filled when completed/deferred)
  reflection TEXT,                            -- What did I learn? What would I do differently?

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_priorities_user ON founder_os.priorities(user_id);
CREATE INDEX IF NOT EXISTS idx_priorities_quarter ON founder_os.priorities(year, quarter);
CREATE INDEX IF NOT EXISTS idx_priorities_status ON founder_os.priorities(status);
CREATE INDEX IF NOT EXISTS idx_priorities_identity ON founder_os.priorities(identity_profile_id);
CREATE INDEX IF NOT EXISTS idx_priorities_active ON founder_os.priorities(user_id, status)
  WHERE status = 'active';

-- =============================================================================
-- TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS priorities_updated_at ON founder_os.priorities;
CREATE TRIGGER priorities_updated_at BEFORE UPDATE ON founder_os.priorities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE founder_os.priorities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON founder_os.priorities;
CREATE POLICY "Service role full access" ON founder_os.priorities FOR ALL USING (true);

-- =============================================================================
-- ADD PRIORITY_ID TO PROJECTS
-- =============================================================================

ALTER TABLE founder_os.projects
  ADD COLUMN IF NOT EXISTS priority_id UUID REFERENCES founder_os.priorities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_priority ON founder_os.projects(priority_id);

COMMENT ON COLUMN founder_os.projects.priority_id IS
  'Links project to a quarterly priority (MCII). Project serves the priority.';

-- =============================================================================
-- ADD PRIORITY_ID TO TASKS
-- =============================================================================

ALTER TABLE founder_os.tasks
  ADD COLUMN IF NOT EXISTS priority_id UUID REFERENCES founder_os.priorities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_priority ON founder_os.tasks(priority_id);

COMMENT ON COLUMN founder_os.tasks.priority_id IS
  'Direct link to priority for tasks not tied to a project';

-- =============================================================================
-- RENAME GOALS TABLE TO OKR_GOALS (idempotent)
-- =============================================================================

-- Rename the table only if source exists and target doesn't
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'founder_os' AND table_name = 'goals')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'founder_os' AND table_name = 'okr_goals') THEN
    ALTER TABLE founder_os.goals RENAME TO okr_goals;
  END IF;
END $$;

-- Rename indexes (IF EXISTS handles idempotency)
ALTER INDEX IF EXISTS idx_founder_os_goals_user_id RENAME TO idx_founder_os_okr_goals_user_id;
ALTER INDEX IF EXISTS idx_founder_os_goals_timeframe RENAME TO idx_founder_os_okr_goals_timeframe;
ALTER INDEX IF EXISTS idx_founder_os_goals_parent_id RENAME TO idx_founder_os_okr_goals_parent_id;
ALTER INDEX IF EXISTS idx_founder_os_goals_project_id RENAME TO idx_founder_os_okr_goals_project_id;

-- Rename trigger (wrapped in DO block since ALTER TRIGGER doesn't support IF EXISTS)
DO $$
BEGIN
  -- Only rename if trigger exists on okr_goals table and hasn't been renamed yet
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE t.tgname = 'update_founder_os_goals_updated_at'
      AND n.nspname = 'founder_os'
      AND c.relname = 'okr_goals'
  ) THEN
    ALTER TRIGGER update_founder_os_goals_updated_at ON founder_os.okr_goals
      RENAME TO update_founder_os_okr_goals_updated_at;
  END IF;
END $$;

-- Update task_goal_links table reference (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'founder_os' AND table_name = 'task_goal_links')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'founder_os' AND table_name = 'task_okr_goal_links') THEN
    ALTER TABLE founder_os.task_goal_links RENAME TO task_okr_goal_links;
  END IF;
END $$;

-- Update project_links to clarify it's for OKR goals
COMMENT ON TABLE founder_os.project_links IS
  'Links projects to contacts, companies, OKR goals, and entities';

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE founder_os.priorities IS
  'MCII-based quarterly priorities. Max 3 active per quarter (enforced in app layer).
   MCII = Mental Contrasting with Implementation Intentions - research-backed for ADHD.';

COMMENT ON COLUMN founder_os.priorities.wish IS
  'What I want - the aspiration';
COMMENT ON COLUMN founder_os.priorities.outcome_vision IS
  'What changes when this succeeds - how I will feel, what will be different';
COMMENT ON COLUMN founder_os.priorities.obstacle IS
  'What is realistically blocking me - CRITICAL for MCII effectiveness';
COMMENT ON COLUMN founder_os.priorities.if_then_plan IS
  'Implementation intention: "When [cue], I will [action]" - creates automatic behavior';
COMMENT ON COLUMN founder_os.priorities.quarter IS
  'Quarter in format Q1_2026, Q2_2026, etc.';
COMMENT ON COLUMN founder_os.priorities.reflection IS
  'Post-completion reflection: What did I learn? What would I do differently?';

COMMENT ON TABLE founder_os.okr_goals IS
  'OKR-style goals (Objectives and Key Results). Alternative framework to MCII priorities.
   Kept for users who prefer OKR methodology.';

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON founder_os.priorities TO authenticated;
GRANT ALL ON founder_os.priorities TO service_role;

-- =============================================================================
-- HELPER FUNCTION: Get active priorities for quarter
-- =============================================================================

CREATE OR REPLACE FUNCTION founder_os.get_active_priorities(
  p_user_id UUID,
  p_quarter TEXT DEFAULT NULL,  -- If null, uses current quarter
  p_year INTEGER DEFAULT NULL   -- If null, uses current year
)
RETURNS TABLE (
  id UUID,
  wish TEXT,
  outcome_vision TEXT,
  obstacle TEXT,
  if_then_plan TEXT,
  quarter TEXT,
  year INTEGER,
  status TEXT,
  order_index INTEGER,
  project_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
  WITH current_period AS (
    SELECT
      COALESCE(p_quarter, 'Q' || CEIL(EXTRACT(MONTH FROM NOW()) / 3.0)::INTEGER || '_' || EXTRACT(YEAR FROM NOW())::INTEGER) AS quarter,
      COALESCE(p_year, EXTRACT(YEAR FROM NOW())::INTEGER) AS year
  )
  SELECT
    p.id,
    p.wish,
    p.outcome_vision,
    p.obstacle,
    p.if_then_plan,
    p.quarter,
    p.year,
    p.status,
    p.order_index,
    COUNT(proj.id) AS project_count
  FROM founder_os.priorities p
  CROSS JOIN current_period cp
  LEFT JOIN founder_os.projects proj ON proj.priority_id = p.id
  WHERE p.user_id = p_user_id
    AND p.quarter = cp.quarter
    AND p.year = cp.year
    AND p.status = 'active'
  GROUP BY p.id
  ORDER BY p.order_index;
$$;

GRANT EXECUTE ON FUNCTION founder_os.get_active_priorities TO authenticated, service_role;

COMMENT ON FUNCTION founder_os.get_active_priorities IS
  'Get active MCII priorities for a quarter. Returns project count for each priority.';
