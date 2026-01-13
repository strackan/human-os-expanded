-- ============================================================================
-- Phase 3: Alter Existing Tables for Database-Driven Workflows
-- ============================================================================
-- Purpose: Modify existing chat tables to match Phase 3 requirements
-- Date: 2025-10-21
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTEND WORKFLOW_DEFINITIONS
-- ============================================================================

-- Add workflow_id column first (will be populated from name initially)
ALTER TABLE public.workflow_definitions
  ADD COLUMN IF NOT EXISTS workflow_id VARCHAR(100);

-- Populate workflow_id from name for existing rows (convert to kebab-case)
UPDATE public.workflow_definitions
SET workflow_id = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
WHERE workflow_id IS NULL;

-- Make workflow_id NOT NULL after populating
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_definitions'
    AND column_name = 'workflow_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.workflow_definitions ALTER COLUMN workflow_id SET NOT NULL;
  END IF;
END $$;

-- Add multi-tenant columns
ALTER TABLE public.workflow_definitions
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS slide_sequence TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS slide_contexts JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_stock_workflow BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cloned_from UUID REFERENCES public.workflow_definitions(id),
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Drop old unique constraint if exists
ALTER TABLE public.workflow_definitions
  DROP CONSTRAINT IF EXISTS workflow_definitions_name_key;

-- Add unique constraint per company (allows same workflow_id across companies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_workflow_per_company'
  ) THEN
    ALTER TABLE public.workflow_definitions
      ADD CONSTRAINT unique_workflow_per_company
      UNIQUE(company_id, workflow_id);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_company
  ON public.workflow_definitions(company_id);

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_stock
  ON public.workflow_definitions(is_stock_workflow)
  WHERE is_stock_workflow = true;

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_workflow_id
  ON public.workflow_definitions(workflow_id);

-- ============================================================================
-- SECTION 2: ALTER OR CREATE CHAT SYSTEM TABLES
-- ============================================================================

-- Drop existing chat tables if they exist with wrong schema
-- We'll recreate them with the correct schema
DROP TABLE IF EXISTS public.workflow_llm_tool_calls CASCADE;
DROP TABLE IF EXISTS public.workflow_llm_context CASCADE;
DROP TABLE IF EXISTS public.workflow_chat_messages CASCADE;
DROP TABLE IF EXISTS public.workflow_chat_threads CASCADE;
DROP TABLE IF EXISTS public.workflow_chat_branches CASCADE;

-- Recreate with correct schema

-- Table 1: Chat Branches
CREATE TABLE public.workflow_chat_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id VARCHAR NOT NULL,
  step_id VARCHAR NOT NULL,
  branch_id VARCHAR NOT NULL,
  branch_label VARCHAR NOT NULL,
  branch_type VARCHAR NOT NULL CHECK (branch_type IN ('fixed', 'llm', 'saved_action', 'rag')),
  user_prompts TEXT[],
  response_text TEXT,
  next_step_id VARCHAR,
  llm_handler VARCHAR,
  allow_off_script BOOLEAN DEFAULT FALSE,
  saved_action_id VARCHAR,
  return_to_step VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workflow_id, step_id, branch_id)
);

-- Table 2: Chat Threads
CREATE TABLE public.workflow_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  step_execution_id UUID REFERENCES public.workflow_step_executions(id) ON DELETE CASCADE,
  thread_type VARCHAR NOT NULL CHECK (thread_type IN ('llm', 'rag', 'fixed')),
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  return_to_step VARCHAR,
  total_messages INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Chat Messages
CREATE TABLE public.workflow_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.workflow_chat_threads(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type VARCHAR DEFAULT 'text' CHECK (message_type IN ('text', 'chart', 'table', 'code')),
  metadata JSONB,
  tokens_used INTEGER,
  sequence_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: LLM Context
CREATE TABLE public.workflow_llm_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.workflow_chat_threads(id) ON DELETE CASCADE UNIQUE,
  system_prompt TEXT NOT NULL,
  tools_available TEXT[],
  context_data JSONB NOT NULL,
  model_used VARCHAR,
  temperature FLOAT DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  total_tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 5: LLM Tool Calls
CREATE TABLE public.workflow_llm_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.workflow_chat_threads(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.workflow_chat_messages(id) ON DELETE CASCADE,
  tool_name VARCHAR NOT NULL,
  tool_input JSONB NOT NULL,
  tool_output JSONB,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 3: ALTER OR CREATE SAVED ACTIONS TABLE
-- ============================================================================

-- Drop and recreate saved_actions
DROP TABLE IF EXISTS public.saved_actions CASCADE;

CREATE TABLE public.saved_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id VARCHAR UNIQUE NOT NULL,
  action_name VARCHAR NOT NULL,
  action_type VARCHAR NOT NULL CHECK (action_type IN ('snooze', 'skip', 'escalation', 'custom')),
  handler VARCHAR,
  config JSONB,
  available_globally BOOLEAN DEFAULT TRUE,
  company_id UUID REFERENCES public.companies(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: CREATE INDEXES
-- ============================================================================

-- Chat branches indexes
CREATE INDEX idx_chat_branches_workflow ON public.workflow_chat_branches(workflow_id, step_id);
CREATE INDEX idx_chat_branches_type ON public.workflow_chat_branches(branch_type);

-- Chat threads indexes
CREATE INDEX idx_chat_threads_execution ON public.workflow_chat_threads(workflow_execution_id);
CREATE INDEX idx_chat_threads_step ON public.workflow_chat_threads(step_execution_id);
CREATE INDEX idx_chat_threads_status ON public.workflow_chat_threads(status);

-- Chat messages indexes
CREATE INDEX idx_chat_messages_thread ON public.workflow_chat_messages(thread_id, sequence_number);
CREATE INDEX idx_chat_messages_role ON public.workflow_chat_messages(role);

-- LLM tool calls indexes
CREATE INDEX idx_llm_tool_calls_thread ON public.workflow_llm_tool_calls(thread_id);
CREATE INDEX idx_llm_tool_calls_message ON public.workflow_llm_tool_calls(message_id);

-- Saved actions indexes
CREATE INDEX idx_saved_actions_type ON public.saved_actions(action_type);
CREATE INDEX idx_saved_actions_global ON public.saved_actions(available_globally) WHERE available_globally = true;
CREATE INDEX idx_saved_actions_company ON public.saved_actions(company_id) WHERE company_id IS NOT NULL;

-- ============================================================================
-- SECTION 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.workflow_chat_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_llm_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_llm_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 6: CREATE RLS POLICIES
-- ============================================================================

-- Chat branches - authenticated users can view
CREATE POLICY "Authenticated users can view chat branches"
  ON public.workflow_chat_branches FOR SELECT
  USING (auth.role() = 'authenticated');

-- Chat threads - users can access their own
CREATE POLICY "Users can view their chat threads"
  ON public.workflow_chat_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_chat_threads.workflow_execution_id
      AND we.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chat threads"
  ON public.workflow_chat_threads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_chat_threads.workflow_execution_id
      AND we.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their chat threads"
  ON public.workflow_chat_threads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_chat_threads.workflow_execution_id
      AND we.user_id = auth.uid()
    )
  );

-- Chat messages - inherit from thread
CREATE POLICY "Users can view messages in their threads"
  ON public.workflow_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_chat_threads wct
      JOIN public.workflow_executions we ON we.id = wct.workflow_execution_id
      WHERE wct.id = workflow_chat_messages.thread_id
      AND we.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their threads"
  ON public.workflow_chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflow_chat_threads wct
      JOIN public.workflow_executions we ON we.id = wct.workflow_execution_id
      WHERE wct.id = workflow_chat_messages.thread_id
      AND we.user_id = auth.uid()
    )
  );

-- LLM context - system managed
CREATE POLICY "Users can view LLM context for their threads"
  ON public.workflow_llm_context FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_chat_threads wct
      JOIN public.workflow_executions we ON we.id = wct.workflow_execution_id
      WHERE wct.id = workflow_llm_context.thread_id
      AND we.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create LLM context"
  ON public.workflow_llm_context FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update LLM context"
  ON public.workflow_llm_context FOR UPDATE
  USING (true);

-- LLM tool calls
CREATE POLICY "Users can view tool calls in their threads"
  ON public.workflow_llm_tool_calls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_chat_threads wct
      JOIN public.workflow_executions we ON we.id = wct.workflow_execution_id
      WHERE wct.id = workflow_llm_tool_calls.thread_id
      AND we.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create tool calls"
  ON public.workflow_llm_tool_calls FOR INSERT
  WITH CHECK (true);

-- Saved actions - global visible to all
CREATE POLICY "Users can view available actions"
  ON public.saved_actions FOR SELECT
  USING (
    available_globally = true
    OR company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create company actions"
  ON public.saved_actions FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- SECTION 7: SEED GLOBAL SAVED ACTIONS
-- ============================================================================

INSERT INTO public.saved_actions (action_id, action_name, action_type, handler, config, available_globally) VALUES
  ('snooze-1-day', 'Snooze 1 Day', 'snooze', 'code:GlobalActions.snooze', '{"days": 1}'::jsonb, true),
  ('snooze-3-days', 'Snooze 3 Days', 'snooze', 'code:GlobalActions.snooze', '{"days": 3}'::jsonb, true),
  ('snooze-7-days', 'Snooze 7 Days', 'snooze', 'code:GlobalActions.snooze', '{"days": 7}'::jsonb, true),
  ('skip-step', 'Skip This Step', 'skip', 'code:GlobalActions.skip', '{}'::jsonb, true),
  ('escalate-manager', 'Escalate to Manager', 'escalation', 'code:GlobalActions.escalate', '{"escalation_type": "manager"}'::jsonb, true)
ON CONFLICT (action_id) DO NOTHING;

-- ============================================================================
-- SECTION 8: HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_llm_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS llm_context_updated_at ON public.workflow_llm_context;
CREATE TRIGGER llm_context_updated_at
    BEFORE UPDATE ON public.workflow_llm_context
    FOR EACH ROW
    EXECUTE FUNCTION public.update_llm_context_timestamp();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '✅ Phase 3 schema migration completed' as status;
SELECT COUNT(*) || ' saved_actions rows' as count FROM public.saved_actions;
