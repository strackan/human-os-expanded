-- ============================================
-- RELATIONSHIP CONTEXT
-- Private opinions/notes about contacts
-- Attached to GFT contact IDs with layer-based privacy
-- ============================================

-- =============================================================================
-- RELATIONSHIP_CONTEXT TABLE
-- Stores subjective opinions and relationship notes about people
-- =============================================================================
CREATE TABLE IF NOT EXISTS relationship_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who has this opinion
  owner_id UUID NOT NULL,

  -- Who it's about (links to entities table)
  contact_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,

  -- Direct link to gft.contacts if exists (for faster lookups)
  gft_contact_id UUID,

  -- Opinion content
  opinion_type TEXT NOT NULL DEFAULT 'general' CHECK (opinion_type IN (
    'general',           -- Overall impression
    'work_style',        -- How they work/collaborate
    'communication',     -- Communication preferences/style
    'trust',             -- Trust level and history
    'negotiation',       -- Negotiation style/history
    'decision_making',   -- How they make decisions
    'responsiveness',    -- Response patterns
    'relationship_history' -- Key events in the relationship
  )),
  content TEXT NOT NULL,           -- The subjective note/opinion
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),

  -- Additional structured data
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  evidence TEXT[],                 -- Supporting observations
  last_validated_at TIMESTAMPTZ,   -- When this opinion was last confirmed

  -- Privacy and source
  layer TEXT NOT NULL,             -- 'founder:justin', 'renubu:tenant-acme', etc.
  source_system TEXT NOT NULL CHECK (source_system IN (
    'gft',
    'renubu',
    'founder-os',
    'manual'
  )),
  source_context TEXT,             -- Where this came from (e.g., "coffee check-in 2024-01-15")

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure one opinion per type per owner per contact
  UNIQUE(owner_id, contact_entity_id, opinion_type)
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_relationship_context_owner ON relationship_context(owner_id);
CREATE INDEX IF NOT EXISTS idx_relationship_context_contact ON relationship_context(contact_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationship_context_gft ON relationship_context(gft_contact_id) WHERE gft_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_relationship_context_layer ON relationship_context(layer);
CREATE INDEX IF NOT EXISTS idx_relationship_context_type ON relationship_context(opinion_type);
CREATE INDEX IF NOT EXISTS idx_relationship_context_sentiment ON relationship_context(sentiment) WHERE sentiment IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_relationship_context_source ON relationship_context(source_system);

-- Full-text search on content
ALTER TABLE relationship_context ADD COLUMN IF NOT EXISTS content_tsv TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX IF NOT EXISTS idx_relationship_context_search ON relationship_context USING GIN(content_tsv);

-- =============================================================================
-- TRIGGERS
-- =============================================================================
DROP TRIGGER IF EXISTS update_relationship_context_updated_at ON relationship_context;
CREATE TRIGGER update_relationship_context_updated_at BEFORE UPDATE ON relationship_context
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE relationship_context ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
DROP POLICY IF EXISTS "relationship_context_service_all" ON relationship_context;
CREATE POLICY "relationship_context_service_all" ON relationship_context
  FOR ALL TO service_role USING (true);

-- Users can see opinions in their own layer (founder:{userId})
DROP POLICY IF EXISTS "relationship_context_user_read" ON relationship_context;
CREATE POLICY "relationship_context_user_read" ON relationship_context
  FOR SELECT USING (
    layer = 'founder:' || auth.uid()::text
  );

-- Users can create/update opinions in their own layer
DROP POLICY IF EXISTS "relationship_context_user_write" ON relationship_context;
CREATE POLICY "relationship_context_user_write" ON relationship_context
  FOR INSERT WITH CHECK (
    layer = 'founder:' || auth.uid()::text
  );

DROP POLICY IF EXISTS "relationship_context_user_update" ON relationship_context;
CREATE POLICY "relationship_context_user_update" ON relationship_context
  FOR UPDATE USING (
    layer = 'founder:' || auth.uid()::text
  );

-- Tenant-scoped access (for Renubu)
-- Note: Requires tenant_id claim in JWT or separate tenant lookup
DROP POLICY IF EXISTS "relationship_context_tenant_read" ON relationship_context;
CREATE POLICY "relationship_context_tenant_read" ON relationship_context
  FOR SELECT USING (
    layer LIKE 'renubu:tenant-%'
    -- AND layer = 'renubu:tenant-' || (auth.jwt() ->> 'tenant_id')
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get all opinions about a contact
CREATE OR REPLACE FUNCTION get_contact_opinions(
  p_contact_entity_id UUID,
  p_layer TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  opinion_type TEXT,
  content TEXT,
  sentiment TEXT,
  confidence TEXT,
  evidence TEXT[],
  source_system TEXT,
  source_context TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.opinion_type,
    rc.content,
    rc.sentiment,
    rc.confidence,
    rc.evidence,
    rc.source_system,
    rc.source_context,
    rc.created_at,
    rc.updated_at
  FROM relationship_context rc
  WHERE rc.contact_entity_id = p_contact_entity_id
    AND (p_layer IS NULL OR rc.layer = p_layer)
  ORDER BY rc.opinion_type, rc.updated_at DESC;
END;
$$;

-- Upsert an opinion (insert or update)
CREATE OR REPLACE FUNCTION upsert_opinion(
  p_owner_id UUID,
  p_contact_entity_id UUID,
  p_opinion_type TEXT,
  p_content TEXT,
  p_layer TEXT,
  p_source_system TEXT,
  p_sentiment TEXT DEFAULT NULL,
  p_confidence TEXT DEFAULT 'medium',
  p_evidence TEXT[] DEFAULT NULL,
  p_source_context TEXT DEFAULT NULL,
  p_gft_contact_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO relationship_context (
    owner_id, contact_entity_id, opinion_type, content, layer,
    source_system, sentiment, confidence, evidence, source_context, gft_contact_id
  ) VALUES (
    p_owner_id, p_contact_entity_id, p_opinion_type, p_content, p_layer,
    p_source_system, p_sentiment, p_confidence, p_evidence, p_source_context, p_gft_contact_id
  )
  ON CONFLICT (owner_id, contact_entity_id, opinion_type)
  DO UPDATE SET
    content = EXCLUDED.content,
    sentiment = COALESCE(EXCLUDED.sentiment, relationship_context.sentiment),
    confidence = COALESCE(EXCLUDED.confidence, relationship_context.confidence),
    evidence = COALESCE(EXCLUDED.evidence, relationship_context.evidence),
    source_context = COALESCE(EXCLUDED.source_context, relationship_context.source_context),
    last_validated_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Search opinions by keyword
CREATE OR REPLACE FUNCTION search_opinions(
  p_query TEXT,
  p_layer TEXT DEFAULT NULL,
  p_opinion_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  contact_entity_id UUID,
  opinion_type TEXT,
  content TEXT,
  sentiment TEXT,
  source_system TEXT,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.contact_entity_id,
    rc.opinion_type,
    rc.content,
    rc.sentiment,
    rc.source_system,
    ts_rank(rc.content_tsv, plainto_tsquery('english', p_query)) AS rank
  FROM relationship_context rc
  WHERE rc.content_tsv @@ plainto_tsquery('english', p_query)
    AND (p_layer IS NULL OR rc.layer = p_layer)
    AND (p_opinion_type IS NULL OR rc.opinion_type = p_opinion_type)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE relationship_context IS 'Private opinions and relationship notes about contacts';
COMMENT ON COLUMN relationship_context.owner_id IS 'User who created this opinion';
COMMENT ON COLUMN relationship_context.contact_entity_id IS 'Entity this opinion is about';
COMMENT ON COLUMN relationship_context.gft_contact_id IS 'Direct link to gft.contacts for faster lookups';
COMMENT ON COLUMN relationship_context.opinion_type IS 'Category: general, work_style, communication, trust, etc.';
COMMENT ON COLUMN relationship_context.layer IS 'Privacy layer: founder:userId, renubu:tenant-id';
COMMENT ON COLUMN relationship_context.source_system IS 'Where this opinion originated';
COMMENT ON COLUMN relationship_context.evidence IS 'Supporting observations for this opinion';
COMMENT ON FUNCTION get_contact_opinions IS 'Get all opinions about a specific contact';
COMMENT ON FUNCTION upsert_opinion IS 'Insert or update an opinion';
COMMENT ON FUNCTION search_opinions IS 'Full-text search across opinions';
