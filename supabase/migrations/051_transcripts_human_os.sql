-- 051_transcripts_human_os.sql
-- Move transcripts to human_os schema with layer-based scoping
-- Raw content stored in Supabase Storage, metadata in DB for search

-- =============================================================================
-- TRANSCRIPTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS human_os.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scoping
  layer TEXT NOT NULL,                              -- e.g., founder:justin, renubu:tenant-x
  user_id UUID,                                     -- User who uploaded (optional)

  -- Storage reference
  storage_path TEXT NOT NULL,                       -- Path in storage: transcripts/{layer}/{id}.md

  -- Core metadata
  title TEXT NOT NULL,
  call_date DATE,
  call_type TEXT CHECK (call_type IN ('demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'sales', 'support', 'other')),
  duration_minutes INT,
  source_url TEXT,                                  -- Link to recording (Fathom, Zoom, etc.)
  source TEXT DEFAULT 'manual',                     -- 'manual', 'zoom', 'fathom', 'gong', 'fireflies'

  -- Participants (JSONB array)
  -- Format: [{name, company?, role?, email?, linkedin_url?, is_internal: bool}]
  participants JSONB DEFAULT '[]',

  -- Extracted content (searchable in DB)
  summary TEXT,                                     -- LLM-generated summary
  key_topics TEXT[] DEFAULT '{}',
  action_items JSONB DEFAULT '[]',                  -- [{description, owner?, due_date?, completed?}]
  notable_quotes JSONB DEFAULT '[]',                -- [{quote, speaker, context?}]
  relationship_insights TEXT,

  -- Labels for easy search (JSONB for flexibility)
  labels JSONB DEFAULT '{}',                        -- {industry: "saas", stage: "discovery", etc.}

  -- Knowledge graph linking
  entity_ids UUID[] DEFAULT '{}',                   -- Linked entities (people, companies)
  project_id UUID,                                  -- Optional link to founder_os.projects
  opportunity_id UUID,                              -- Optional link to gft.opportunities

  -- Context tags for filtering
  context_tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Core lookups
CREATE INDEX idx_transcripts_layer ON human_os.transcripts(layer);
CREATE INDEX idx_transcripts_user ON human_os.transcripts(user_id);
CREATE INDEX idx_transcripts_date ON human_os.transcripts(call_date DESC);
CREATE INDEX idx_transcripts_type ON human_os.transcripts(call_type);

-- Array/JSONB indexes
CREATE INDEX idx_transcripts_topics ON human_os.transcripts USING GIN(key_topics);
CREATE INDEX idx_transcripts_tags ON human_os.transcripts USING GIN(context_tags);
CREATE INDEX idx_transcripts_entities ON human_os.transcripts USING GIN(entity_ids);
CREATE INDEX idx_transcripts_labels ON human_os.transcripts USING GIN(labels);

-- Linking indexes
CREATE INDEX idx_transcripts_project ON human_os.transcripts(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_transcripts_opportunity ON human_os.transcripts(opportunity_id) WHERE opportunity_id IS NOT NULL;

-- Full-text search on summary and title
CREATE INDEX idx_transcripts_fts ON human_os.transcripts
  USING GIN(to_tsvector('english', coalesce(summary, '') || ' ' || coalesce(title, '')));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER transcripts_updated_at
  BEFORE UPDATE ON human_os.transcripts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE human_os.transcripts ENABLE ROW LEVEL SECURITY;

-- Service role full access (for MCP server)
CREATE POLICY "transcripts_service_all" ON human_os.transcripts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can access public layer and their own layer
CREATE POLICY "transcripts_read_policy" ON human_os.transcripts
  FOR SELECT TO authenticated
  USING (layer = 'public' OR layer LIKE 'founder:%' OR layer LIKE 'renubu:%');

CREATE POLICY "transcripts_write_policy" ON human_os.transcripts
  FOR INSERT TO authenticated
  WITH CHECK (layer = 'public' OR layer LIKE 'founder:%' OR layer LIKE 'renubu:%');

CREATE POLICY "transcripts_update_policy" ON human_os.transcripts
  FOR UPDATE TO authenticated
  USING (layer = 'public' OR layer LIKE 'founder:%' OR layer LIKE 'renubu:%');

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- List transcripts with optional filters
CREATE OR REPLACE FUNCTION human_os.list_transcripts(
  p_layer TEXT DEFAULT 'public',
  p_call_type TEXT DEFAULT NULL,
  p_project_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
) RETURNS TABLE (
  id UUID,
  title TEXT,
  call_date DATE,
  call_type TEXT,
  duration_minutes INT,
  summary TEXT,
  participants JSONB,
  labels JSONB,
  entity_ids UUID[],
  project_id UUID,
  created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id, t.title, t.call_date, t.call_type, t.duration_minutes,
    t.summary, t.participants, t.labels, t.entity_ids, t.project_id, t.created_at
  FROM human_os.transcripts t
  WHERE (t.layer = 'public' OR t.layer = p_layer)
    AND (p_call_type IS NULL OR t.call_type = p_call_type)
    AND (p_project_id IS NULL OR t.project_id = p_project_id)
  ORDER BY t.call_date DESC NULLS LAST, t.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Search transcripts
CREATE OR REPLACE FUNCTION human_os.search_transcripts(
  p_query TEXT,
  p_layer TEXT DEFAULT 'public',
  p_limit INT DEFAULT 20
) RETURNS TABLE (
  id UUID,
  title TEXT,
  call_date DATE,
  call_type TEXT,
  summary TEXT,
  participants JSONB,
  labels JSONB,
  rank REAL
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id, t.title, t.call_date, t.call_type, t.summary, t.participants, t.labels,
    ts_rank(to_tsvector('english', coalesce(t.summary, '') || ' ' || coalesce(t.title, '')),
            plainto_tsquery('english', p_query)) as rank
  FROM human_os.transcripts t
  WHERE (t.layer = 'public' OR t.layer = p_layer)
    AND to_tsvector('english', coalesce(t.summary, '') || ' ' || coalesce(t.title, ''))
        @@ plainto_tsquery('english', p_query)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$;

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON human_os.transcripts TO authenticated;
GRANT ALL ON human_os.transcripts TO service_role;

GRANT EXECUTE ON FUNCTION human_os.list_transcripts TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.search_transcripts TO authenticated, service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE human_os.transcripts IS
  'Transcript metadata with layer-based scoping. Raw content stored in Supabase Storage at human-os/transcripts/{layer}/{id}.md';

COMMENT ON COLUMN human_os.transcripts.storage_path IS
  'Path to raw transcript content in Supabase Storage bucket';

COMMENT ON COLUMN human_os.transcripts.labels IS
  'Flexible JSONB labels for easy filtering (e.g., {industry: "saas", stage: "discovery"})';

COMMENT ON COLUMN human_os.transcripts.project_id IS
  'Optional link to founder_os.projects for project-scoped transcripts';

COMMENT ON COLUMN human_os.transcripts.opportunity_id IS
  'Optional link to gft.opportunities for sales-related transcripts';
