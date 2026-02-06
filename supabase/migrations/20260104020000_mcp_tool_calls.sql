-- MCP Tool Calls Capture
-- Logs tool-level calls from MCP servers for searchability

CREATE TABLE IF NOT EXISTS mcp_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  params JSONB DEFAULT '{}',
  result_summary TEXT,
  latency_ms INTEGER,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_tool ON mcp_tool_calls(tool_name);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_user ON mcp_tool_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_created ON mcp_tool_calls(created_at DESC);

-- RLS
ALTER TABLE mcp_tool_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service can insert tool calls" ON mcp_tool_calls;
CREATE POLICY "Service can insert tool calls"
  ON mcp_tool_calls FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own tool calls" ON mcp_tool_calls;
CREATE POLICY "Users can view own tool calls"
  ON mcp_tool_calls FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE mcp_tool_calls IS 'MCP tool call logs for searchability';
