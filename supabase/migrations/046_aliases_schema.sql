-- ============================================
-- ALIASES SCHEMA
-- Natural language command routing system
-- Enables "user vocabulary as API" pattern
-- ============================================

-- =============================================================================
-- PGVECTOR EXTENSION (for semantic search)
-- =============================================================================

-- Enable pgvector if available (Supabase has this built-in)
-- If not available, the embedding columns will be created as JSONB instead
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Execution mode hint for aliases
DO $$ BEGIN
  CREATE TYPE human_os.execution_mode AS ENUM ('tactical', 'strategic');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- ALIASES TABLE
-- Pattern-based command definitions
-- =============================================================================

CREATE TABLE IF NOT EXISTS human_os.aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern matching
  pattern TEXT NOT NULL,                           -- e.g., "tie a string to {person} {timing}"
  description TEXT NOT NULL,                       -- Human-readable explanation

  -- Scope & access
  layer TEXT NOT NULL DEFAULT 'public',            -- Privacy scope (public, founder:justin, renubu:tenant-X)
  context TEXT[] DEFAULT '{}',                     -- Contextual availability (modes, states)

  -- Execution hints
  mode human_os.execution_mode,                    -- Preferred execution mode
  tools_required TEXT[] NOT NULL DEFAULT '{}',     -- Tools needed (for lazy loading)

  -- Action chain
  actions JSONB NOT NULL,                          -- Array of AliasAction objects

  -- Metadata
  priority INTEGER DEFAULT 100,                    -- Lower = higher priority (for overlapping patterns)
  enabled BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Embeddings for semantic fallback
  pattern_embedding vector(1536),                  -- For fuzzy matching when exact fails

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique pattern per layer
  UNIQUE(pattern, layer)
);

-- =============================================================================
-- ALIAS ACTIONS SCHEMA (in actions JSONB)
-- =============================================================================

COMMENT ON COLUMN human_os.aliases.actions IS '
Array of action objects:
[
  {
    "tool": "resolve_contact",
    "params": { "query": "{person}" },
    "output": "contact",
    "condition": null
  },
  {
    "tool": "create_string_tie",
    "params": {
      "contact_id": "{contact.id}",
      "timing": "{timing}"
    }
  }
]
Supports {variable} interpolation from pattern extraction and previous outputs.
';

-- =============================================================================
-- EXECUTION LOGS TABLE
-- Full trace storage for RAG recall
-- =============================================================================

CREATE TABLE IF NOT EXISTS human_os.execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request info
  alias_id UUID REFERENCES human_os.aliases(id) ON DELETE SET NULL,
  alias_pattern TEXT NOT NULL,                     -- Copy for when alias deleted
  input_request TEXT NOT NULL,                     -- Original user input
  extracted_vars JSONB DEFAULT '{}',               -- Variables extracted from pattern

  -- Execution trace
  steps JSONB NOT NULL,                            -- Full step-by-step trace
  result_summary TEXT NOT NULL,                    -- Compressed result for context
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,

  -- Entity linking for relationship queries
  entities TEXT[] DEFAULT '{}',                    -- Entity slugs referenced

  -- Semantic search
  embedding vector(1536),                          -- For RAG recall

  -- Scope
  layer TEXT NOT NULL,                             -- Privacy scope of execution
  user_id TEXT,                                    -- Executing user

  -- Performance metrics
  duration_ms INTEGER,
  tokens_used INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Aliases indexes
CREATE INDEX IF NOT EXISTS idx_aliases_layer ON human_os.aliases(layer);
CREATE INDEX IF NOT EXISTS idx_aliases_enabled ON human_os.aliases(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_aliases_priority ON human_os.aliases(priority);
CREATE INDEX IF NOT EXISTS idx_aliases_usage ON human_os.aliases(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_aliases_pattern ON human_os.aliases USING gin(to_tsvector('english', pattern));
CREATE INDEX IF NOT EXISTS idx_aliases_tools ON human_os.aliases USING gin(tools_required);

-- Vector similarity for fuzzy pattern matching
CREATE INDEX IF NOT EXISTS idx_aliases_embedding ON human_os.aliases
  USING ivfflat (pattern_embedding vector_cosine_ops)
  WITH (lists = 100);

-- Execution logs indexes
CREATE INDEX IF NOT EXISTS idx_execution_logs_alias ON human_os.execution_logs(alias_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_layer ON human_os.execution_logs(layer);
CREATE INDEX IF NOT EXISTS idx_execution_logs_user ON human_os.execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_created ON human_os.execution_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_logs_success ON human_os.execution_logs(success);
CREATE INDEX IF NOT EXISTS idx_execution_logs_entities ON human_os.execution_logs USING gin(entities);

-- Vector similarity for RAG recall
CREATE INDEX IF NOT EXISTS idx_execution_logs_embedding ON human_os.execution_logs
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update updated_at on aliases
DROP TRIGGER IF EXISTS update_aliases_updated_at ON human_os.aliases;
CREATE TRIGGER update_aliases_updated_at BEFORE UPDATE ON human_os.aliases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update usage stats when alias is used
CREATE OR REPLACE FUNCTION human_os.record_alias_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.alias_id IS NOT NULL THEN
    UPDATE human_os.aliases
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = NEW.alias_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS record_alias_usage_trigger ON human_os.execution_logs;
CREATE TRIGGER record_alias_usage_trigger AFTER INSERT ON human_os.execution_logs
  FOR EACH ROW EXECUTE FUNCTION human_os.record_alias_usage();

-- =============================================================================
-- QUERY FUNCTIONS
-- =============================================================================

-- Find matching alias by pattern
CREATE OR REPLACE FUNCTION human_os.find_alias(
  p_request TEXT,
  p_layer TEXT DEFAULT 'public',
  p_context TEXT[] DEFAULT '{}'
) RETURNS TABLE (
  id UUID,
  pattern TEXT,
  description TEXT,
  mode human_os.execution_mode,
  tools_required TEXT[],
  actions JSONB,
  match_type TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_words TEXT[];
  v_pattern_regex TEXT;
BEGIN
  -- First try exact pattern match (with variables)
  RETURN QUERY
  SELECT
    a.id, a.pattern, a.description, a.mode, a.tools_required, a.actions,
    'exact'::TEXT as match_type
  FROM human_os.aliases a
  WHERE a.enabled = true
    AND (a.layer = 'public' OR a.layer = p_layer)
    AND (a.context = '{}' OR a.context && p_context)
    -- Convert pattern to regex: {var} -> .*
    AND p_request ~* ('^' || regexp_replace(a.pattern, '\{[^}]+\}', '(.+)', 'g') || '$')
  ORDER BY a.priority, a.layer DESC  -- Prefer specific layer over public
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Fall back to full-text search
  RETURN QUERY
  SELECT
    a.id, a.pattern, a.description, a.mode, a.tools_required, a.actions,
    'fuzzy'::TEXT as match_type
  FROM human_os.aliases a
  WHERE a.enabled = true
    AND (a.layer = 'public' OR a.layer = p_layer)
    AND to_tsvector('english', a.pattern) @@ plainto_tsquery('english', p_request)
  ORDER BY
    ts_rank(to_tsvector('english', a.pattern), plainto_tsquery('english', p_request)) DESC,
    a.priority
  LIMIT 3;
END;
$$;

-- Semantic alias search (for when text search fails)
CREATE OR REPLACE FUNCTION human_os.find_alias_semantic(
  p_embedding vector(1536),
  p_layer TEXT DEFAULT 'public',
  p_threshold FLOAT DEFAULT 0.7,
  p_limit INTEGER DEFAULT 3
) RETURNS TABLE (
  id UUID,
  pattern TEXT,
  description TEXT,
  mode human_os.execution_mode,
  tools_required TEXT[],
  actions JSONB,
  similarity FLOAT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id, a.pattern, a.description, a.mode, a.tools_required, a.actions,
    1 - (a.pattern_embedding <=> p_embedding) as similarity
  FROM human_os.aliases a
  WHERE a.enabled = true
    AND (a.layer = 'public' OR a.layer = p_layer)
    AND a.pattern_embedding IS NOT NULL
    AND 1 - (a.pattern_embedding <=> p_embedding) >= p_threshold
  ORDER BY a.pattern_embedding <=> p_embedding
  LIMIT p_limit;
END;
$$;

-- Search execution logs (RAG recall)
CREATE OR REPLACE FUNCTION human_os.recall_executions(
  p_query TEXT DEFAULT NULL,
  p_embedding vector(1536) DEFAULT NULL,
  p_entity TEXT DEFAULT NULL,
  p_layer TEXT DEFAULT 'public',
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  alias_pattern TEXT,
  input_request TEXT,
  result_summary TEXT,
  entities TEXT[],
  created_at TIMESTAMPTZ,
  similarity FLOAT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- If embedding provided, use semantic search
  IF p_embedding IS NOT NULL THEN
    RETURN QUERY
    SELECT
      e.id, e.alias_pattern, e.input_request, e.result_summary, e.entities, e.created_at,
      1 - (e.embedding <=> p_embedding) as similarity
    FROM human_os.execution_logs e
    WHERE (e.layer = 'public' OR e.layer = p_layer)
      AND e.success = true
      AND (p_entity IS NULL OR p_entity = ANY(e.entities))
      AND e.embedding IS NOT NULL
    ORDER BY e.embedding <=> p_embedding
    LIMIT p_limit;
  -- Otherwise use text search
  ELSIF p_query IS NOT NULL THEN
    RETURN QUERY
    SELECT
      e.id, e.alias_pattern, e.input_request, e.result_summary, e.entities, e.created_at,
      0.0::FLOAT as similarity
    FROM human_os.execution_logs e
    WHERE (e.layer = 'public' OR e.layer = p_layer)
      AND e.success = true
      AND (p_entity IS NULL OR p_entity = ANY(e.entities))
      AND (
        e.input_request ILIKE '%' || p_query || '%'
        OR e.result_summary ILIKE '%' || p_query || '%'
      )
    ORDER BY e.created_at DESC
    LIMIT p_limit;
  -- Default: recent executions
  ELSE
    RETURN QUERY
    SELECT
      e.id, e.alias_pattern, e.input_request, e.result_summary, e.entities, e.created_at,
      0.0::FLOAT as similarity
    FROM human_os.execution_logs e
    WHERE (e.layer = 'public' OR e.layer = p_layer)
      AND e.success = true
      AND (p_entity IS NULL OR p_entity = ANY(e.entities))
    ORDER BY e.created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$;

-- List available aliases for a layer
CREATE OR REPLACE FUNCTION human_os.list_aliases(
  p_layer TEXT DEFAULT 'public',
  p_include_descriptions BOOLEAN DEFAULT true
) RETURNS TABLE (
  pattern TEXT,
  description TEXT,
  mode human_os.execution_mode,
  usage_count INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.pattern,
    CASE WHEN p_include_descriptions THEN a.description ELSE NULL END,
    a.mode,
    a.usage_count
  FROM human_os.aliases a
  WHERE a.enabled = true
    AND (a.layer = 'public' OR a.layer = p_layer)
  ORDER BY a.usage_count DESC, a.priority;
END;
$$;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE human_os.aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_os.execution_logs ENABLE ROW LEVEL SECURITY;

-- Service role full access
DROP POLICY IF EXISTS "aliases_service_all" ON human_os.aliases;
CREATE POLICY "aliases_service_all" ON human_os.aliases
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "execution_logs_service_all" ON human_os.execution_logs;
CREATE POLICY "execution_logs_service_all" ON human_os.execution_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read public and their own layer aliases
DROP POLICY IF EXISTS "aliases_read_policy" ON human_os.aliases;
CREATE POLICY "aliases_read_policy" ON human_os.aliases
  FOR SELECT TO authenticated
  USING (layer = 'public' OR layer LIKE 'founder:%' OR layer LIKE 'renubu:%');

-- Authenticated users can read their own execution logs
DROP POLICY IF EXISTS "execution_logs_read_policy" ON human_os.execution_logs;
CREATE POLICY "execution_logs_read_policy" ON human_os.execution_logs
  FOR SELECT TO authenticated
  USING (layer = 'public' OR layer LIKE 'founder:%' OR layer LIKE 'renubu:%');

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON human_os.aliases TO authenticated;
GRANT SELECT, INSERT ON human_os.execution_logs TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA human_os TO authenticated;

GRANT EXECUTE ON FUNCTION human_os.find_alias TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.find_alias_semantic TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.recall_executions TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.list_aliases TO authenticated, service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE human_os.aliases IS 'Natural language command patterns with action chains';
COMMENT ON COLUMN human_os.aliases.pattern IS 'Command pattern with {variable} placeholders';
COMMENT ON COLUMN human_os.aliases.tools_required IS 'Tools needed for lazy-loading';
COMMENT ON COLUMN human_os.aliases.actions IS 'Ordered list of tool calls to execute';
COMMENT ON COLUMN human_os.aliases.priority IS 'Lower value = higher priority for pattern conflicts';

COMMENT ON TABLE human_os.execution_logs IS 'Full execution traces for RAG recall';
COMMENT ON COLUMN human_os.execution_logs.steps IS 'Step-by-step execution trace';
COMMENT ON COLUMN human_os.execution_logs.result_summary IS 'Compressed result returned to main agent';
COMMENT ON COLUMN human_os.execution_logs.entities IS 'Entity slugs for relationship queries';

COMMENT ON FUNCTION human_os.find_alias IS 'Find best matching alias for a natural language request';
COMMENT ON FUNCTION human_os.find_alias_semantic IS 'Semantic fallback when text matching fails';
COMMENT ON FUNCTION human_os.recall_executions IS 'RAG search over past executions';
COMMENT ON FUNCTION human_os.list_aliases IS 'List available aliases for context building';
