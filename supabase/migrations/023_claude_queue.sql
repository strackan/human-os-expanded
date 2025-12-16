-- Claude Queue: Mobile to Desktop Sync
-- Items logged on mobile are processed when starting a desktop session

CREATE TABLE founder_os.claude_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL,

  -- Intent classification
  intent_type TEXT NOT NULL CHECK (intent_type IN ('task', 'event', 'decision', 'note', 'memory_edit')),
  payload JSONB NOT NULL,           -- Flexible structure per intent type
  target_table TEXT,                -- Where it lands when processed (optional hint)

  -- Processing state
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processed', 'skipped', 'failed')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Context
  session_id TEXT,                  -- Group items from same mobile session
  notes TEXT                        -- Any context for processing
);

-- Indexes for efficient queue processing
CREATE INDEX idx_claude_queue_pending ON founder_os.claude_queue(user_id, created_at)
  WHERE status = 'pending';
CREATE INDEX idx_claude_queue_user ON founder_os.claude_queue(user_id);
CREATE INDEX idx_claude_queue_session ON founder_os.claude_queue(session_id)
  WHERE session_id IS NOT NULL;

-- RLS Policies
ALTER TABLE founder_os.claude_queue ENABLE ROW LEVEL SECURITY;

-- Users can only see their own queue items
CREATE POLICY "claude_queue_user_select" ON founder_os.claude_queue
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "claude_queue_user_insert" ON founder_os.claude_queue
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "claude_queue_user_update" ON founder_os.claude_queue
  FOR UPDATE USING (user_id = auth.uid());

-- Service role can do everything (for MCP server)
CREATE POLICY "claude_queue_service_all" ON founder_os.claude_queue
  FOR ALL TO service_role USING (true);

-- Comment on table
COMMENT ON TABLE founder_os.claude_queue IS 'Queue for items logged on mobile, processed on desktop session start';
COMMENT ON COLUMN founder_os.claude_queue.intent_type IS 'task, event, decision, note, or memory_edit';
COMMENT ON COLUMN founder_os.claude_queue.payload IS 'JSON structure depends on intent_type';
COMMENT ON COLUMN founder_os.claude_queue.status IS 'pending (new), processed (done), skipped (ignored), failed (error)';
