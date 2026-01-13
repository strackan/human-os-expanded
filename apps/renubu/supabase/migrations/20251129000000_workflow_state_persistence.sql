-- ============================================================================
-- Workflow State Persistence System
-- Enables browser crash recovery, state restoration, and audit trails
-- Date: 2025-11-29
-- ============================================================================

-- 1. WORKFLOW STATE SNAPSHOTS
-- Stores the complete workflow UI state for resumption
CREATE TABLE IF NOT EXISTS workflow_state_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),

  -- Position
  current_slide_index INTEGER NOT NULL DEFAULT 0,
  completed_slides INTEGER[] DEFAULT '{}',
  skipped_slides INTEGER[] DEFAULT '{}',

  -- State Data
  slide_states JSONB DEFAULT '{}',      -- Per-slide form values
  workflow_data JSONB DEFAULT '{}',     -- Accumulated workflow data
  chat_messages JSONB DEFAULT '[]',     -- Full chat history
  current_branch TEXT,

  -- Metadata
  is_latest BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,            -- For optimistic locking

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one "latest" snapshot per execution
CREATE UNIQUE INDEX IF NOT EXISTS idx_state_snapshots_latest
  ON workflow_state_snapshots(execution_id)
  WHERE is_latest = true;

-- Fast lookup for resumption
CREATE INDEX IF NOT EXISTS idx_state_snapshots_execution
  ON workflow_state_snapshots(execution_id, created_at DESC);

-- 2. STATE AUDIT LOG
-- Tracks all state changes for debugging and compliance
CREATE TABLE IF NOT EXISTS workflow_state_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),

  -- Action Details
  action_type TEXT NOT NULL,            -- workflow_started, slide_navigated, data_saved, etc.
  slide_index INTEGER,
  previous_state JSONB,
  new_state JSONB,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_state_audit_execution
  ON workflow_state_audit(execution_id, created_at DESC);

-- 3. LLM RESPONSE CACHE (DB-backed for multi-device)
CREATE TABLE IF NOT EXISTS llm_response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,       -- Hash of prompt + context
  prompt_hash TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  workflow_type TEXT,
  slide_id TEXT,

  response_content TEXT NOT NULL,
  response_metadata JSONB,

  hit_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_cache_key ON llm_response_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_llm_cache_expiry ON llm_response_cache(expires_at);

-- 4. ENABLE RLS
ALTER TABLE workflow_state_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_state_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_response_cache ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users manage own state snapshots" ON workflow_state_snapshots;
DROP POLICY IF EXISTS "Users view own audit logs" ON workflow_state_audit;
DROP POLICY IF EXISTS "LLM cache is shared read" ON llm_response_cache;
DROP POLICY IF EXISTS "LLM cache insert allowed" ON llm_response_cache;

-- State Snapshots: Users can manage their own
CREATE POLICY "Users manage own state snapshots" ON workflow_state_snapshots
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Audit Log: Users can view their own (read-only for users)
CREATE POLICY "Users view own audit logs" ON workflow_state_audit
  FOR SELECT
  USING (user_id = auth.uid());

-- LLM Cache: Shared read for efficiency, insert allowed
CREATE POLICY "LLM cache is shared read" ON llm_response_cache
  FOR SELECT
  USING (true);

CREATE POLICY "LLM cache insert allowed" ON llm_response_cache
  FOR INSERT
  WITH CHECK (true);

-- 6. HELPER FUNCTION: Update timestamp on modification
CREATE OR REPLACE FUNCTION update_workflow_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS update_state_snapshot_timestamp ON workflow_state_snapshots;
CREATE TRIGGER update_state_snapshot_timestamp
  BEFORE UPDATE ON workflow_state_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_state_timestamp();

-- 7. HELPER FUNCTION: Prune expired cache entries (call periodically)
CREATE OR REPLACE FUNCTION prune_expired_llm_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM llm_response_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Verification
SELECT 'Workflow state persistence tables created successfully' as status;
