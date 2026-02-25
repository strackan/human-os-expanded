/**
 * Complete Workflow System Migration
 *
 * Creates comprehensive database schema for:
 * - Core workflow storage (structure, notifications, logic)
 * - Chat branches (fixed paths + LLM handlers)
 * - Saved actions (global reusable functions)
 * - LLM chat conversations (dynamic Q&A with tools)
 * - Audit trails and version history
 *
 * Excludes: UI artifacts (handled by frontend)
 */

-- =====================================================
-- 1. WORKFLOWS TABLE (Core Workflow Storage)
-- =====================================================

CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0.0',
  config JSONB NOT NULL,                -- Workflow structure (NO UI artifacts)
  is_core BOOLEAN DEFAULT FALSE,
  tenant_id UUID,                       -- NULL for core, UUID for tenant-specific
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT core_workflow_check CHECK (
    is_core = FALSE OR tenant_id IS NULL
  ),
  CONSTRAINT config_structure_check CHECK (
    config ? 'id' AND
    config ? 'name' AND
    config ? 'steps'
  )
);

COMMENT ON TABLE workflows IS 'Stores workflow configurations (structure, notifications, logic - NO UI)';
COMMENT ON COLUMN workflows.config IS 'JSONB containing: trigger, context, steps with execution/notifications/routing';

-- Indexes
CREATE INDEX idx_workflows_lookup ON workflows(workflow_id, tenant_id);
CREATE INDEX idx_workflows_core ON workflows(is_core) WHERE is_core = TRUE;
CREATE INDEX idx_workflows_tenant ON workflows(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_workflows_config_steps ON workflows USING gin(config->'steps');

-- =====================================================
-- 2. WORKFLOW VERSIONS (Audit Trail)
-- =====================================================

CREATE TABLE workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  version INT NOT NULL,
  config JSONB NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  change_description TEXT,

  UNIQUE(workflow_id, version)
);

COMMENT ON TABLE workflow_versions IS 'Audit trail of workflow configuration changes';

CREATE INDEX idx_workflow_versions_workflow ON workflow_versions(workflow_id);
CREATE INDEX idx_workflow_versions_changed_at ON workflow_versions(changed_at DESC);

-- =====================================================
-- 3. SAVED ACTIONS (Global Reusable Functions)
-- =====================================================

CREATE TABLE saved_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id VARCHAR UNIQUE NOT NULL,
  action_name VARCHAR NOT NULL,
  action_type VARCHAR NOT NULL,         -- 'snooze', 'skip', 'escalation', 'script'
  handler VARCHAR,                       -- 'code:GlobalActions.snooze' or 'file:handlers/custom.js'
  config JSONB,
  available_globally BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE saved_actions IS 'Reusable workflow actions (snooze, skip, escalate, etc.)';

CREATE INDEX idx_saved_actions_type ON saved_actions(action_type);
CREATE INDEX idx_saved_actions_global ON saved_actions(available_globally) WHERE available_globally = TRUE;

-- =====================================================
-- 4. WORKFLOW CHAT BRANCHES (Fixed + Dynamic Paths)
-- =====================================================

CREATE TABLE workflow_chat_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id VARCHAR NOT NULL,
  from_step_id VARCHAR NOT NULL,
  branch_id VARCHAR NOT NULL,
  branch_label VARCHAR NOT NULL,
  branch_type VARCHAR NOT NULL,         -- 'fixed', 'llm', 'saved_action', 'rag'
  user_prompts TEXT[],                  -- Phrases that trigger this branch
  response_text TEXT,                   -- Fixed response (for fixed branches)
  next_step_id VARCHAR,                 -- Next step (for fixed branches)
  saved_action_id VARCHAR REFERENCES saved_actions(action_id),
  llm_handler VARCHAR,                  -- LLM handler name (for dynamic branches)
  allow_off_script BOOLEAN DEFAULT FALSE,
  return_to_step VARCHAR,               -- Where to return after branch completes
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT branch_type_check CHECK (
    branch_type IN ('fixed', 'llm', 'saved_action', 'rag')
  )
);

COMMENT ON TABLE workflow_chat_branches IS 'Chat conversation branches (fixed paths + LLM handlers)';

CREATE INDEX idx_chat_branches_workflow_step ON workflow_chat_branches(workflow_id, from_step_id);
CREATE INDEX idx_chat_branches_type ON workflow_chat_branches(branch_type);

-- =====================================================
-- 5. WORKFLOW CHAT THREADS (LLM Conversation Container)
-- =====================================================

CREATE TABLE workflow_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id UUID REFERENCES workflow_executions(id),
  step_id VARCHAR NOT NULL,
  thread_type VARCHAR NOT NULL,         -- 'llm', 'rag', 'analysis', 'custom'
  started_by UUID REFERENCES users(id),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  status VARCHAR DEFAULT 'active',      -- 'active', 'completed', 'abandoned'
  return_to_step VARCHAR,               -- Where to return when chat ends
  total_messages INT DEFAULT 0,
  total_tokens INT DEFAULT 0
);

COMMENT ON TABLE workflow_chat_threads IS 'LLM conversation threads (dynamic Q&A sessions)';

CREATE INDEX idx_chat_threads_execution ON workflow_chat_threads(workflow_execution_id);
CREATE INDEX idx_chat_threads_status ON workflow_chat_threads(status);
CREATE INDEX idx_chat_threads_started ON workflow_chat_threads(started_at DESC);

-- =====================================================
-- 6. WORKFLOW CHAT MESSAGES (Conversation History)
-- =====================================================

CREATE TABLE workflow_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES workflow_chat_threads(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL,                -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  message_type VARCHAR DEFAULT 'text',  -- 'text', 'chart', 'table', 'code'
  metadata JSONB,                       -- Chart data, sources, tool outputs
  tokens_used INT,
  created_at TIMESTAMP DEFAULT NOW(),
  sequence_number INT NOT NULL,

  CONSTRAINT role_check CHECK (role IN ('user', 'assistant', 'system'))
);

COMMENT ON TABLE workflow_chat_messages IS 'Individual messages in LLM conversations';

CREATE INDEX idx_chat_messages_thread_seq ON workflow_chat_messages(thread_id, sequence_number);
CREATE INDEX idx_chat_messages_created ON workflow_chat_messages(created_at DESC);

-- =====================================================
-- 7. WORKFLOW LLM CONTEXT (Per-Thread State)
-- =====================================================

CREATE TABLE workflow_llm_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES workflow_chat_threads(id) ON DELETE CASCADE UNIQUE,
  system_prompt TEXT NOT NULL,
  tools_available TEXT[],               -- ['rag_search', 'database_query', 'chart_create']
  context_data JSONB NOT NULL,          -- Customer data, workflow state, company info
  model_used VARCHAR,                   -- 'gpt-4', 'claude-3-opus', etc.
  temperature FLOAT DEFAULT 0.7,
  max_tokens INT DEFAULT 2000,
  total_tokens_used INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE workflow_llm_context IS 'LLM configuration and context per conversation thread';

CREATE INDEX idx_llm_context_thread ON workflow_llm_context(thread_id);

-- =====================================================
-- 8. WORKFLOW LLM TOOL CALLS (RAG, Queries, Charts)
-- =====================================================

CREATE TABLE workflow_llm_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES workflow_chat_threads(id) ON DELETE CASCADE,
  message_id UUID REFERENCES workflow_chat_messages(id) ON DELETE CASCADE,
  tool_name VARCHAR NOT NULL,           -- 'rag_search', 'database_query', 'create_chart'
  tool_input JSONB NOT NULL,
  tool_output JSONB,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE workflow_llm_tool_calls IS 'Tool executions during LLM conversations (RAG, queries, charts)';

CREATE INDEX idx_tool_calls_thread ON workflow_llm_tool_calls(thread_id);
CREATE INDEX idx_tool_calls_message ON workflow_llm_tool_calls(message_id);
CREATE INDEX idx_tool_calls_tool_name ON workflow_llm_tool_calls(tool_name);

-- =====================================================
-- 9. ACTION EXECUTIONS (Runtime Tracking)
-- =====================================================

CREATE TABLE action_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id UUID REFERENCES workflow_executions(id),
  action_id VARCHAR REFERENCES saved_actions(action_id),
  executed_by UUID REFERENCES users(id),
  params JSONB,
  result JSONB,
  success BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE action_executions IS 'Log of saved action executions';

CREATE INDEX idx_action_executions_workflow ON action_executions(workflow_execution_id);
CREATE INDEX idx_action_executions_action ON action_executions(action_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update workflow timestamp
CREATE OR REPLACE FUNCTION update_workflow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_updated
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();

-- Auto-create version on workflow update
CREATE OR REPLACE FUNCTION create_workflow_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INT;
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1 INTO next_version
  FROM workflow_versions
  WHERE workflow_id = NEW.id;

  INSERT INTO workflow_versions (
    workflow_id, version, config, changed_by, change_description
  ) VALUES (
    NEW.id, next_version, NEW.config, NEW.created_by, 'Workflow updated'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_version_on_update
  AFTER UPDATE OF config ON workflows
  FOR EACH ROW
  WHEN (OLD.config IS DISTINCT FROM NEW.config)
  EXECUTE FUNCTION create_workflow_version();

-- Update LLM context timestamp
CREATE OR REPLACE FUNCTION update_llm_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER llm_context_updated
  BEFORE UPDATE ON workflow_llm_context
  FOR EACH ROW
  EXECUTE FUNCTION update_llm_context_timestamp();

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View: Workflows accessible to tenant
CREATE VIEW tenant_workflows AS
SELECT
  w.id,
  w.workflow_id,
  w.name,
  w.description,
  w.version,
  w.config,
  w.is_core,
  w.tenant_id,
  w.created_by,
  w.created_at,
  w.updated_at,
  CASE WHEN w.is_core THEN 'core' ELSE 'custom' END as workflow_type,
  u.name as created_by_name,
  u.email as created_by_email
FROM workflows w
LEFT JOIN users u ON w.created_by = u.id;

-- View: Chat thread summary
CREATE VIEW chat_thread_summary AS
SELECT
  t.id,
  t.workflow_execution_id,
  t.step_id,
  t.thread_type,
  t.status,
  t.started_at,
  t.ended_at,
  t.total_messages,
  t.total_tokens,
  u.name as started_by_name,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_message_at
FROM workflow_chat_threads t
LEFT JOIN users u ON t.started_by = u.id
LEFT JOIN workflow_chat_messages m ON m.thread_id = t.id
GROUP BY t.id, t.workflow_execution_id, t.step_id, t.thread_type,
         t.status, t.started_at, t.ended_at, t.total_messages,
         t.total_tokens, u.name;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get workflows for tenant (core + custom)
CREATE OR REPLACE FUNCTION get_tenant_workflows(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  workflow_id VARCHAR,
  name VARCHAR,
  description TEXT,
  version VARCHAR,
  config JSONB,
  is_core BOOLEAN,
  workflow_type VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.workflow_id,
    w.name,
    w.description,
    w.version,
    w.config,
    w.is_core,
    CASE WHEN w.is_core THEN 'core' ELSE 'custom' END as workflow_type
  FROM workflows w
  WHERE w.is_core = TRUE
     OR w.tenant_id = p_tenant_id
  ORDER BY w.is_core DESC, w.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Get workflow with tenant check
CREATE OR REPLACE FUNCTION get_workflow(
  p_workflow_id VARCHAR,
  p_tenant_id UUID
)
RETURNS TABLE (
  id UUID,
  workflow_id VARCHAR,
  name VARCHAR,
  description TEXT,
  version VARCHAR,
  config JSONB,
  is_core BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.workflow_id,
    w.name,
    w.description,
    w.version,
    w.config,
    w.is_core
  FROM workflows w
  WHERE w.workflow_id = p_workflow_id
    AND (w.is_core = TRUE OR w.tenant_id = p_tenant_id)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Get chat branches for step
CREATE OR REPLACE FUNCTION get_step_chat_branches(
  p_workflow_id VARCHAR,
  p_step_id VARCHAR
)
RETURNS TABLE (
  id UUID,
  branch_id VARCHAR,
  branch_label VARCHAR,
  branch_type VARCHAR,
  user_prompts TEXT[],
  response_text TEXT,
  next_step_id VARCHAR,
  saved_action_id VARCHAR,
  llm_handler VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cb.id,
    cb.branch_id,
    cb.branch_label,
    cb.branch_type,
    cb.user_prompts,
    cb.response_text,
    cb.next_step_id,
    cb.saved_action_id,
    cb.llm_handler
  FROM workflow_chat_branches cb
  WHERE cb.workflow_id = p_workflow_id
    AND cb.from_step_id = p_step_id
  ORDER BY cb.branch_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (Optional)
-- =====================================================

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_chat_branches ENABLE ROW LEVEL SECURITY;

-- Workflows: users see core + their tenant's custom
CREATE POLICY workflows_select_policy ON workflows
  FOR SELECT
  USING (
    is_core = TRUE
    OR tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Only admins can insert core workflows
CREATE POLICY workflows_insert_core_policy ON workflows
  FOR INSERT
  WITH CHECK (
    is_core = FALSE
    OR (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
  );

-- Users can insert custom workflows for their tenant
CREATE POLICY workflows_insert_custom_policy ON workflows
  FOR INSERT
  WITH CHECK (
    is_core = FALSE
    AND tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Cannot update/delete core workflows
CREATE POLICY workflows_update_policy ON workflows
  FOR UPDATE
  USING (is_core = FALSE);

CREATE POLICY workflows_delete_policy ON workflows
  FOR DELETE
  USING (is_core = FALSE);

-- =====================================================
-- VALIDATION TESTS
-- =====================================================

DO $$
BEGIN
  -- Test 1: Create core workflow
  INSERT INTO workflows (workflow_id, name, config, is_core)
  VALUES ('test-core', 'Test', '{"id": "test", "name": "Test", "steps": []}', TRUE);
  DELETE FROM workflows WHERE workflow_id = 'test-core';
  RAISE NOTICE 'Test 1 passed: Core workflow creation';

  -- Test 2: Core workflow with tenant_id should fail
  BEGIN
    INSERT INTO workflows (workflow_id, name, config, is_core, tenant_id)
    VALUES ('test-fail', 'Test', '{"id": "test", "name": "Test", "steps": []}', TRUE, gen_random_uuid());
    RAISE EXCEPTION 'Test 2 failed: Core workflow should not allow tenant_id';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'Test 2 passed: Core workflow constraint works';
  END;

  -- Test 3: Config structure validation
  BEGIN
    INSERT INTO workflows (workflow_id, name, config, is_core)
    VALUES ('test-fail-2', 'Test', '{"missing": "fields"}', FALSE);
    RAISE EXCEPTION 'Test 3 failed: Config structure check should fail';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'Test 3 passed: Config structure check works';
  END;
END $$;

RAISE NOTICE '=== All migration tests passed ===';
