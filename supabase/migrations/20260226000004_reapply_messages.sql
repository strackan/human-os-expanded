-- =============================================================================
-- Re-apply founder_os.messages table (from 031_messages.sql)
-- May not have been applied to the cloud database.
-- All statements are idempotent.
-- =============================================================================

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS founder_os;

-- Messages table
CREATE TABLE IF NOT EXISTS founder_os.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Sender info
  from_forest TEXT NOT NULL,
  from_name TEXT NOT NULL,

  -- Recipient info
  to_forest TEXT NOT NULL,
  to_name TEXT NOT NULL,

  -- Message content
  subject TEXT,
  content TEXT NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'read', 'replied')),

  -- Threading
  reply_to_id UUID REFERENCES founder_os.messages(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_to_forest ON founder_os.messages(to_forest);
CREATE INDEX IF NOT EXISTS idx_messages_from_forest ON founder_os.messages(from_forest);
CREATE INDEX IF NOT EXISTS idx_messages_status ON founder_os.messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_pending ON founder_os.messages(to_forest, status)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_messages_thread ON founder_os.messages(reply_to_id)
  WHERE reply_to_id IS NOT NULL;

-- Comments
COMMENT ON TABLE founder_os.messages IS 'Cross-forest messaging between founder OS instances';
COMMENT ON COLUMN founder_os.messages.from_forest IS 'Layer/forest identifier of sender (e.g., founder:justin)';
COMMENT ON COLUMN founder_os.messages.to_forest IS 'Layer/forest identifier of recipient (e.g., founder:scott-leese)';
COMMENT ON COLUMN founder_os.messages.status IS 'Message lifecycle: pending -> delivered -> read -> replied';

-- Helper functions
CREATE OR REPLACE FUNCTION founder_os.get_pending_message_count(p_forest TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM founder_os.messages
  WHERE to_forest = p_forest
    AND status = 'pending';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION founder_os.mark_messages_delivered(p_forest TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE founder_os.messages
  SET status = 'delivered',
      delivered_at = NOW()
  WHERE to_forest = p_forest
    AND status = 'pending';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Grants
GRANT USAGE ON SCHEMA founder_os TO service_role, authenticated;
GRANT ALL ON founder_os.messages TO service_role;
GRANT SELECT, INSERT, UPDATE ON founder_os.messages TO authenticated;
GRANT EXECUTE ON FUNCTION founder_os.get_pending_message_count(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION founder_os.mark_messages_delivered(TEXT) TO service_role;

-- Expose schema to PostgREST
ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,human_os,founder_os,gft,global,crm';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
