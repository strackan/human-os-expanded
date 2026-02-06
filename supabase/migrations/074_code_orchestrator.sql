-- Code Orchestrator: Track Claude Code executions in isolated worktrees
-- This table tracks code tasks with their associated worktree and GitHub issue

CREATE TABLE IF NOT EXISTS human_os.code_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Task info
  task TEXT NOT NULL,
  repo_path TEXT NOT NULL,

  -- Worktree info (mandatory for isolation)
  branch_name TEXT NOT NULL,
  worktree_path TEXT NOT NULL,

  -- GitHub tracking (mandatory)
  github_issue_number INTEGER NOT NULL,
  github_issue_url TEXT NOT NULL,
  github_project_number INTEGER DEFAULT 2,

  -- Status lifecycle
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'merged', 'discarded')),

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  merged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_code_executions_user ON human_os.code_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_executions_status ON human_os.code_executions(status);
CREATE INDEX IF NOT EXISTS idx_code_executions_issue ON human_os.code_executions(github_issue_number);
CREATE INDEX IF NOT EXISTS idx_code_executions_running ON human_os.code_executions(user_id, status)
  WHERE status = 'running';

-- RLS policies
ALTER TABLE human_os.code_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own executions" ON human_os.code_executions;
CREATE POLICY "Users can view own executions" ON human_os.code_executions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own executions" ON human_os.code_executions;
CREATE POLICY "Users can insert own executions" ON human_os.code_executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own executions" ON human_os.code_executions;
CREATE POLICY "Users can update own executions" ON human_os.code_executions
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role bypass for MCP server
DROP POLICY IF EXISTS "Service role full access" ON human_os.code_executions;
CREATE POLICY "Service role full access" ON human_os.code_executions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add code orchestrator aliases
INSERT INTO human_os.aliases (pattern, description, layer, tools_required, actions, priority, enabled)
VALUES
  ('code {task}', 'Start a Claude Code task in an isolated worktree with GitHub tracking', 'founder:justin',
   ARRAY['code_start'],
   '[{"tool": "code_start", "params": {"task": "{task}"}}]'::jsonb,
   50, true),

  ('code status', 'List all running code tasks', 'founder:justin',
   ARRAY['code_list'],
   '[{"tool": "code_list", "params": {}}]'::jsonb,
   50, true),

  ('code status {issueNumber}', 'Check status of a specific code task by issue number', 'founder:justin',
   ARRAY['code_status'],
   '[{"tool": "code_status", "params": {"issueNumber": "{issueNumber}"}}]'::jsonb,
   40, true),

  ('code merge {issueNumber}', 'Merge a completed code task worktree into main branch', 'founder:justin',
   ARRAY['code_merge'],
   '[{"tool": "code_merge", "params": {"issueNumber": "{issueNumber}"}}]'::jsonb,
   40, true),

  ('code discard {issueNumber}', 'Discard a code task worktree without merging', 'founder:justin',
   ARRAY['code_discard'],
   '[{"tool": "code_discard", "params": {"issueNumber": "{issueNumber}"}}]'::jsonb,
   40, true)
ON CONFLICT (pattern, layer) DO NOTHING;
