/**
 * COMBINED MIGRATION: Chat System + User Preferences
 *
 * Run this SQL file in Supabase SQL Editor to create:
 * - Chat tables (threads, messages, branches, LLM context)
 * - Saved actions
 * - User preferences
 *
 * PREREQUISITES (must already exist):
 * - users table
 * - workflow_executions table
 * - workflow_tasks table
 *
 * HOW TO RUN:
 * 1. Go to Supabase Dashboard → SQL Editor
 * 2. Paste this entire file
 * 3. Click "Run"
 * 4. Check for success messages at bottom
 *
 * Date: October 9, 2025
 * Status: CRITICAL - Blocks frontend chat work
 */

-- =====================================================
-- PART 1: WORKFLOW CHAT SYSTEM (from 005)
-- =====================================================

-- 1. WORKFLOWS TABLE
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0.0',
  config JSONB NOT NULL,
  is_core BOOLEAN DEFAULT FALSE,
  tenant_id UUID,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT core_workflow_check CHECK (
    is_core = FALSE OR tenant_id IS NULL
  ),
  CONSTRAINT config_structure_check CHECK (
    config ? 'id' AND
    config ? 'name' AND
    config ? 'steps'
  )
);

CREATE INDEX IF NOT EXISTS idx_workflows_lookup ON workflows(workflow_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_core ON workflows(is_core) WHERE is_core = TRUE;
CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflows_config_steps ON workflows USING gin((config->'steps'));

-- 2. WORKFLOW VERSIONS
CREATE TABLE IF NOT EXISTS workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  version INT NOT NULL,
  config JSONB NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMP DEFAULT NOW(),
  change_description TEXT,

  UNIQUE(workflow_id, version)
);

CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow ON workflow_versions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_changed_at ON workflow_versions(changed_at DESC);

-- 3. SAVED ACTIONS
CREATE TABLE IF NOT EXISTS saved_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id VARCHAR UNIQUE NOT NULL,
  action_name VARCHAR NOT NULL,
  action_type VARCHAR NOT NULL,
  handler VARCHAR,
  config JSONB,
  available_globally BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_actions_type ON saved_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_saved_actions_global ON saved_actions(available_globally) WHERE available_globally = TRUE;

-- 4. WORKFLOW CHAT BRANCHES
CREATE TABLE IF NOT EXISTS workflow_chat_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id VARCHAR NOT NULL,
  from_step_id VARCHAR NOT NULL,
  branch_id VARCHAR NOT NULL,
  branch_label VARCHAR NOT NULL,
  branch_type VARCHAR NOT NULL,
  user_prompts TEXT[],
  response_text TEXT,
  next_step_id VARCHAR,
  saved_action_id VARCHAR REFERENCES saved_actions(action_id),
  llm_handler VARCHAR,
  allow_off_script BOOLEAN DEFAULT FALSE,
  return_to_step VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT branch_type_check CHECK (
    branch_type IN ('fixed', 'llm', 'saved_action', 'rag')
  )
);

CREATE INDEX IF NOT EXISTS idx_chat_branches_workflow_step ON workflow_chat_branches(workflow_id, from_step_id);
CREATE INDEX IF NOT EXISTS idx_chat_branches_type ON workflow_chat_branches(branch_type);

-- 5. WORKFLOW CHAT THREADS
CREATE TABLE IF NOT EXISTS workflow_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id UUID REFERENCES workflow_executions(id),
  step_id VARCHAR NOT NULL,
  thread_type VARCHAR NOT NULL,
  started_by UUID,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  status VARCHAR DEFAULT 'active',
  return_to_step VARCHAR,
  total_messages INT DEFAULT 0,
  total_tokens INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_execution ON workflow_chat_threads(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_status ON workflow_chat_threads(status);
CREATE INDEX IF NOT EXISTS idx_chat_threads_started ON workflow_chat_threads(started_at DESC);

-- 6. WORKFLOW CHAT MESSAGES
CREATE TABLE IF NOT EXISTS workflow_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES workflow_chat_threads(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR DEFAULT 'text',
  metadata JSONB,
  tokens_used INT,
  created_at TIMESTAMP DEFAULT NOW(),
  sequence_number INT NOT NULL,

  CONSTRAINT role_check CHECK (role IN ('user', 'assistant', 'system'))
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_seq ON workflow_chat_messages(thread_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON workflow_chat_messages(created_at DESC);

-- 7. WORKFLOW LLM CONTEXT
CREATE TABLE IF NOT EXISTS workflow_llm_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES workflow_chat_threads(id) ON DELETE CASCADE UNIQUE,
  system_prompt TEXT NOT NULL,
  tools_available TEXT[],
  context_data JSONB NOT NULL,
  model_used VARCHAR,
  temperature FLOAT DEFAULT 0.7,
  max_tokens INT DEFAULT 2000,
  total_tokens_used INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_context_thread ON workflow_llm_context(thread_id);

-- 8. WORKFLOW LLM TOOL CALLS
CREATE TABLE IF NOT EXISTS workflow_llm_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES workflow_chat_threads(id) ON DELETE CASCADE,
  message_id UUID REFERENCES workflow_chat_messages(id) ON DELETE CASCADE,
  tool_name VARCHAR NOT NULL,
  tool_input JSONB NOT NULL,
  tool_output JSONB,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_calls_thread ON workflow_llm_tool_calls(thread_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_message ON workflow_llm_tool_calls(message_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_tool_name ON workflow_llm_tool_calls(tool_name);

-- 9. ACTION EXECUTIONS
CREATE TABLE IF NOT EXISTS action_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id UUID REFERENCES workflow_executions(id),
  action_id VARCHAR REFERENCES saved_actions(action_id),
  executed_by UUID,
  params JSONB,
  result JSONB,
  success BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_executions_workflow ON action_executions(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_action_executions_action ON action_executions(action_id);

-- =====================================================
-- PART 2: USER PREFERENCES (from 006)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,

  chat_preferences JSONB DEFAULT '{
    "shiftEnterToSubmit": false,
    "enableSoundNotifications": true,
    "autoScrollToBottom": true
  }'::jsonb,

  notification_preferences JSONB DEFAULT '{
    "emailDigest": "daily",
    "inAppNotifications": true,
    "desktopNotifications": false
  }'::jsonb,

  ui_preferences JSONB DEFAULT '{
    "theme": "light",
    "compactMode": false,
    "sidebarCollapsed": false
  }'::jsonb,

  workflow_preferences JSONB DEFAULT '{
    "autoAdvanceSteps": false,
    "showCompletedTasks": true
  }'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_chat ON user_preferences USING gin(chat_preferences);
CREATE INDEX IF NOT EXISTS idx_user_preferences_notifications ON user_preferences USING gin(notification_preferences);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update workflow timestamp
CREATE OR REPLACE FUNCTION update_workflow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workflow_updated ON workflows;
CREATE TRIGGER workflow_updated
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();

-- Update user preferences timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_preferences_updated ON user_preferences;
CREATE TRIGGER user_preferences_updated
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_timestamp();

-- Update LLM context timestamp
CREATE OR REPLACE FUNCTION update_llm_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS llm_context_updated ON workflow_llm_context;
CREATE TRIGGER llm_context_updated
  BEFORE UPDATE ON workflow_llm_context
  FOR EACH ROW
  EXECUTE FUNCTION update_llm_context_timestamp();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get or create user preferences
CREATE OR REPLACE FUNCTION get_or_create_user_preferences(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  chat_preferences JSONB,
  notification_preferences JSONB,
  ui_preferences JSONB,
  workflow_preferences JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.user_id,
    up.chat_preferences,
    up.notification_preferences,
    up.ui_preferences,
    up.workflow_preferences,
    up.created_at,
    up.updated_at
  FROM user_preferences up
  WHERE up.user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO user_preferences (user_id)
    VALUES (p_user_id)
    RETURNING
      user_preferences.id,
      user_preferences.user_id,
      user_preferences.chat_preferences,
      user_preferences.notification_preferences,
      user_preferences.ui_preferences,
      user_preferences.workflow_preferences,
      user_preferences.created_at,
      user_preferences.updated_at
    INTO
      id,
      user_id,
      chat_preferences,
      notification_preferences,
      ui_preferences,
      workflow_preferences,
      created_at,
      updated_at;

    RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Get step chat branches
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
-- PART 3: CUSTOMER TABLE ENHANCEMENTS
-- =====================================================

-- Add account_plan column for workflow orchestrator
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS account_plan VARCHAR(20) CHECK (account_plan IN ('invest', 'manage', 'monitor', 'expand'));

-- Add renewal_stage column (optional - can be calculated from renewal_date)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS renewal_stage VARCHAR(20);

-- Create index for workflow queries
CREATE INDEX IF NOT EXISTS idx_customers_account_plan ON customers(account_plan);
CREATE INDEX IF NOT EXISTS idx_customers_renewal_date ON customers(renewal_date);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers(assigned_to);

-- Function to calculate account_plan based on ARR and health_score
CREATE OR REPLACE FUNCTION calculate_account_plan(arr NUMERIC, health_score INTEGER)
RETURNS VARCHAR AS $$
BEGIN
  -- Logic based on orchestrator business rules:
  -- expand: High ARR (>150k) + High health (>75)
  -- invest: Medium/High ARR (>50k) + Medium health (>60) OR growth potential
  -- manage: Stable accounts
  -- monitor: Low health or at-risk

  IF arr > 150000 AND health_score > 75 THEN
    RETURN 'expand';
  ELSIF arr > 50000 AND health_score > 60 THEN
    RETURN 'invest';
  ELSIF health_score < 50 THEN
    RETURN 'monitor';
  ELSE
    RETURN 'manage';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Populate account_plan for existing customers (if any)
UPDATE customers
SET account_plan = calculate_account_plan(current_arr, health_score)
WHERE account_plan IS NULL;

-- Function to calculate renewal_stage from renewal_date
CREATE OR REPLACE FUNCTION calculate_renewal_stage(renewal_date DATE)
RETURNS VARCHAR AS $$
DECLARE
  days_until_renewal INTEGER;
BEGIN
  days_until_renewal := renewal_date - CURRENT_DATE;

  -- Match the 9 renewal stages from orchestrator
  IF days_until_renewal < 0 THEN
    RETURN 'Overdue';
  ELSIF days_until_renewal < 7 THEN
    RETURN 'Emergency';
  ELSIF days_until_renewal < 15 THEN
    RETURN 'Critical';
  ELSIF days_until_renewal < 31 THEN
    RETURN 'Signature';
  ELSIF days_until_renewal < 61 THEN
    RETURN 'Finalize';
  ELSIF days_until_renewal < 91 THEN
    RETURN 'Negotiate';
  ELSIF days_until_renewal < 120 THEN
    RETURN 'Engage';
  ELSIF days_until_renewal < 180 THEN
    RETURN 'Prepare';
  ELSE
    RETURN 'Monitor';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Populate renewal_stage for existing customers (if any)
UPDATE customers
SET renewal_stage = calculate_renewal_stage(renewal_date::DATE)
WHERE renewal_stage IS NULL AND renewal_date IS NOT NULL;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - workflows';
  RAISE NOTICE '  - workflow_versions';
  RAISE NOTICE '  - saved_actions';
  RAISE NOTICE '  - workflow_chat_branches';
  RAISE NOTICE '  - workflow_chat_threads';
  RAISE NOTICE '  - workflow_chat_messages';
  RAISE NOTICE '  - workflow_llm_context';
  RAISE NOTICE '  - workflow_llm_tool_calls';
  RAISE NOTICE '  - action_executions';
  RAISE NOTICE '  - user_preferences';
  RAISE NOTICE '';
  RAISE NOTICE 'Enhanced customers table:';
  RAISE NOTICE '  - Added account_plan column';
  RAISE NOTICE '  - Added renewal_stage column';
  RAISE NOTICE '  - Created helper functions';
  RAISE NOTICE '';
  RAISE NOTICE 'Chat APIs are now ready to use!';
  RAISE NOTICE 'Customer data ready for orchestrator!';
  RAISE NOTICE '========================================';
END $$;
