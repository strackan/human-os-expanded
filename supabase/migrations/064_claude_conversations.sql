-- Claude Conversation Capture Schema
-- Stores all Claude API interactions for searchability and cross-org intelligence

-- Conversations table
CREATE TABLE IF NOT EXISTS claude_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  system_prompt TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',

  -- Indexing status
  indexed_at TIMESTAMPTZ,
  embedding_generated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation turns (individual messages)
CREATE TABLE IF NOT EXISTS conversation_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES claude_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Token usage
  tokens_input INTEGER,
  tokens_output INTEGER,

  -- Performance metrics
  latency_ms INTEGER,

  -- Extracted entities (populated async by indexing pipeline)
  entities JSONB DEFAULT '[]',

  -- Semantic embedding (populated async)
  embedding vector(1536),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_claude_conversations_user_id
  ON claude_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_claude_conversations_started_at
  ON claude_conversations(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_claude_conversations_model
  ON claude_conversations(model);

CREATE INDEX IF NOT EXISTS idx_conversation_turns_conversation_id
  ON conversation_turns(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_turns_role
  ON conversation_turns(role);

CREATE INDEX IF NOT EXISTS idx_conversation_turns_created_at
  ON conversation_turns(created_at DESC);

-- Full-text search on content
CREATE INDEX IF NOT EXISTS idx_conversation_turns_content_fts
  ON conversation_turns USING gin(to_tsvector('english', content));

-- Semantic search via HNSW (if pgvector with HNSW is available)
-- Falls back to IVFFlat if HNSW not supported
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_conversation_turns_embedding_hnsw
    ON conversation_turns USING hnsw(embedding vector_cosine_ops);
EXCEPTION WHEN undefined_object THEN
  CREATE INDEX IF NOT EXISTS idx_conversation_turns_embedding_ivfflat
    ON conversation_turns USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);
END $$;

-- Capture queue for async processing
CREATE TABLE IF NOT EXISTS claude_capture_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_claude_capture_queue_status
  ON claude_capture_queue(status) WHERE status = 'pending';

-- RLS Policies
ALTER TABLE claude_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE claude_capture_queue ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
  ON claude_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own conversation turns"
  ON conversation_turns FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM claude_conversations WHERE user_id = auth.uid()
    )
  );

-- Service role can insert (proxy uses service key)
CREATE POLICY "Service can insert conversations"
  ON claude_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can insert turns"
  ON conversation_turns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can manage queue"
  ON claude_capture_queue FOR ALL
  WITH CHECK (true);

-- Helper function: Search conversations semantically
CREATE OR REPLACE FUNCTION search_conversations(
  query_embedding vector(1536),
  user_id_filter UUID DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  conversation_id UUID,
  turn_id UUID,
  role TEXT,
  content TEXT,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ct.conversation_id,
    ct.id as turn_id,
    ct.role,
    ct.content,
    1 - (ct.embedding <=> query_embedding) as similarity,
    ct.created_at
  FROM conversation_turns ct
  JOIN claude_conversations cc ON cc.id = ct.conversation_id
  WHERE
    ct.embedding IS NOT NULL
    AND (user_id_filter IS NULL OR cc.user_id = user_id_filter)
    AND 1 - (ct.embedding <=> query_embedding) > match_threshold
  ORDER BY ct.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Helper function: Full-text search conversations
CREATE OR REPLACE FUNCTION search_conversations_text(
  search_query TEXT,
  user_id_filter UUID DEFAULT NULL,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  conversation_id UUID,
  turn_id UUID,
  role TEXT,
  content TEXT,
  rank FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ct.conversation_id,
    ct.id as turn_id,
    ct.role,
    ct.content,
    ts_rank(to_tsvector('english', ct.content), plainto_tsquery('english', search_query)) as rank,
    ct.created_at
  FROM conversation_turns ct
  JOIN claude_conversations cc ON cc.id = ct.conversation_id
  WHERE
    to_tsvector('english', ct.content) @@ plainto_tsquery('english', search_query)
    AND (user_id_filter IS NULL OR cc.user_id = user_id_filter)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

COMMENT ON TABLE claude_conversations IS 'Stores Claude API conversation sessions for searchability';
COMMENT ON TABLE conversation_turns IS 'Individual messages within Claude conversations';
COMMENT ON TABLE claude_capture_queue IS 'Queue for async processing of captured conversations';
