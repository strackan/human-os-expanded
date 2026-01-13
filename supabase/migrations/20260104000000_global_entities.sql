-- ============================================
-- Global Entity Schema
-- Cross-organizational knowledge graph for Renubu
-- ============================================

-- Create global schema
CREATE SCHEMA IF NOT EXISTS global;

-- ============================================
-- GLOBAL ENTITIES
-- Canonical cross-tenant entity registry
-- LinkedIn URL is primary identity anchor
-- ============================================
CREATE TABLE global.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity anchors (at least one required)
  linkedin_url TEXT UNIQUE,
  email TEXT,

  -- Canonical data (deduplicated from multiple sources)
  name TEXT NOT NULL,
  headline TEXT,
  current_company TEXT,
  current_title TEXT,
  location TEXT,

  -- Identity resolution metadata
  confidence_score FLOAT DEFAULT 1.0,
  verified_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_global_entities_linkedin ON global.entities(linkedin_url);
CREATE INDEX idx_global_entities_email ON global.entities(email);
CREATE INDEX idx_global_entities_name ON global.entities(name);
CREATE INDEX idx_global_entities_company ON global.entities(current_company);

-- ============================================
-- GLOBAL ENTITY SIGNALS
-- Anonymized signals from contributors
-- No individual attribution - aggregate only
-- ============================================
CREATE TABLE global.entity_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES global.entities(id) ON DELETE CASCADE,

  -- Signal type
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'sentiment',        -- positive/negative interaction sentiment
    'responsiveness',   -- how quickly they respond
    'deal_outcome',     -- won/lost/pending
    'interest',         -- extracted interest/hobby
    'skill',           -- extracted skill/expertise
    'engagement_level', -- high/medium/low engagement
    'champion',        -- acts as internal champion
    'blocker'          -- acts as blocker in deals
  )),

  -- Signal value (interpretation depends on signal_type)
  value TEXT NOT NULL,
  score FLOAT,  -- Optional numeric score (0-1 for sentiment, etc.)

  -- Anonymized contributor tracking
  contributor_hash TEXT NOT NULL,  -- SHA256(user_id + salt) - no reverse lookup

  -- Temporal
  observed_at DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Prevent duplicate signals from same contributor same day
  UNIQUE(entity_id, signal_type, contributor_hash, observed_at),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient aggregation
CREATE INDEX idx_entity_signals_entity ON global.entity_signals(entity_id);
CREATE INDEX idx_entity_signals_type ON global.entity_signals(signal_type);
CREATE INDEX idx_entity_signals_observed ON global.entity_signals(observed_at DESC);

-- ============================================
-- GLOBAL ENTITY EMBEDDINGS
-- pgvector for semantic search
-- ============================================
CREATE TABLE global.entity_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES global.entities(id) ON DELETE CASCADE,

  -- Embedding type
  embedding_type TEXT NOT NULL CHECK (embedding_type IN (
    'profile',        -- Combined profile summary
    'interests',      -- Aggregated interests
    'skills',         -- Aggregated skills
    'conversation'    -- Conversation themes
  )),

  -- The embedding vector (1536 dimensions for OpenAI ada-002)
  embedding vector(1536),

  -- Source text used to generate embedding
  source_text TEXT,

  -- Timestamps
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One embedding per type per entity
  UNIQUE(entity_id, embedding_type)
);

-- Index for vector similarity search (HNSW is fastest)
-- Note: Only create after accumulating data for better index quality
-- CREATE INDEX idx_entity_embeddings_vector ON global.entity_embeddings
--   USING hnsw(embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_entity_embeddings_entity ON global.entity_embeddings(entity_id);
CREATE INDEX idx_entity_embeddings_type ON global.entity_embeddings(embedding_type);

-- ============================================
-- ENTITY INTELLIGENCE (Materialized View)
-- Pre-aggregated metrics for fast queries
-- ============================================
CREATE MATERIALIZED VIEW global.entity_intelligence AS
SELECT
  e.id,
  e.name,
  e.linkedin_url,
  e.current_company,
  e.current_title,
  e.location,

  -- Network metrics
  COUNT(DISTINCT es.contributor_hash) AS network_breadth,

  -- Sentiment aggregates
  AVG(CASE WHEN es.signal_type = 'sentiment' THEN es.score END) AS avg_sentiment,

  -- Responsiveness
  AVG(CASE WHEN es.signal_type = 'responsiveness' THEN es.score END) AS avg_responsiveness,

  -- Deal outcomes
  SUM(CASE WHEN es.signal_type = 'deal_outcome' AND es.value = 'won' THEN 1 ELSE 0 END) AS deals_won,
  SUM(CASE WHEN es.signal_type = 'deal_outcome' AND es.value = 'lost' THEN 1 ELSE 0 END) AS deals_lost,

  -- Aggregated arrays
  ARRAY_AGG(DISTINCT CASE WHEN es.signal_type = 'interest' THEN es.value END)
    FILTER (WHERE es.signal_type = 'interest') AS interests,
  ARRAY_AGG(DISTINCT CASE WHEN es.signal_type = 'skill' THEN es.value END)
    FILTER (WHERE es.signal_type = 'skill') AS skills,

  -- Champion/blocker flags
  BOOL_OR(es.signal_type = 'champion') AS is_champion,
  BOOL_OR(es.signal_type = 'blocker') AS is_blocker,

  -- Timestamps
  MAX(es.observed_at) AS last_signal_at,
  e.updated_at

FROM global.entities e
LEFT JOIN global.entity_signals es ON es.entity_id = e.id
GROUP BY e.id, e.name, e.linkedin_url, e.current_company, e.current_title, e.location, e.updated_at;

-- Index on materialized view
CREATE UNIQUE INDEX idx_entity_intelligence_id ON global.entity_intelligence(id);
CREATE INDEX idx_entity_intelligence_company ON global.entity_intelligence(current_company);
CREATE INDEX idx_entity_intelligence_network ON global.entity_intelligence(network_breadth DESC);

-- ============================================
-- ENTITY RESOLUTION FUNCTION
-- Find or create global entity from local data
-- ============================================
CREATE OR REPLACE FUNCTION global.resolve_entity(
  p_linkedin_url TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_entity_id UUID;
BEGIN
  -- Priority 1: Match by LinkedIn URL (primary anchor)
  IF p_linkedin_url IS NOT NULL THEN
    SELECT id INTO v_entity_id
    FROM global.entities
    WHERE linkedin_url = p_linkedin_url;

    IF v_entity_id IS NOT NULL THEN
      -- Update with latest info
      UPDATE global.entities SET
        name = COALESCE(p_name, name),
        current_company = COALESCE(p_company, current_company),
        current_title = COALESCE(p_title, current_title),
        location = COALESCE(p_location, location),
        updated_at = NOW()
      WHERE id = v_entity_id;

      RETURN v_entity_id;
    END IF;
  END IF;

  -- Priority 2: Match by email
  IF p_email IS NOT NULL THEN
    SELECT id INTO v_entity_id
    FROM global.entities
    WHERE email = p_email;

    IF v_entity_id IS NOT NULL THEN
      -- Update with latest info (including linkedin_url if provided)
      UPDATE global.entities SET
        linkedin_url = COALESCE(p_linkedin_url, linkedin_url),
        name = COALESCE(p_name, name),
        current_company = COALESCE(p_company, current_company),
        current_title = COALESCE(p_title, current_title),
        location = COALESCE(p_location, location),
        updated_at = NOW()
      WHERE id = v_entity_id;

      RETURN v_entity_id;
    END IF;
  END IF;

  -- Priority 3: Fuzzy match by name + company (if both provided)
  IF p_name IS NOT NULL AND p_company IS NOT NULL THEN
    SELECT id INTO v_entity_id
    FROM global.entities
    WHERE
      LOWER(name) = LOWER(p_name)
      AND LOWER(current_company) = LOWER(p_company)
    LIMIT 1;

    IF v_entity_id IS NOT NULL THEN
      -- Update with anchors if provided
      UPDATE global.entities SET
        linkedin_url = COALESCE(p_linkedin_url, linkedin_url),
        email = COALESCE(p_email, email),
        current_title = COALESCE(p_title, current_title),
        location = COALESCE(p_location, location),
        updated_at = NOW()
      WHERE id = v_entity_id;

      RETURN v_entity_id;
    END IF;
  END IF;

  -- No match found - require at least one anchor for new entity
  IF p_linkedin_url IS NULL AND p_email IS NULL AND p_name IS NULL THEN
    RAISE EXCEPTION 'Cannot create entity without linkedin_url, email, or name';
  END IF;

  -- Create new entity
  INSERT INTO global.entities (
    linkedin_url,
    email,
    name,
    current_company,
    current_title,
    location
  ) VALUES (
    p_linkedin_url,
    p_email,
    COALESCE(p_name, 'Unknown'),
    p_company,
    p_title,
    p_location
  )
  RETURNING id INTO v_entity_id;

  RETURN v_entity_id;
END;
$$;

-- ============================================
-- LINK GFT.CONTACTS TO GLOBAL ENTITIES
-- Add foreign key column (conditional)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'gft') THEN
    EXECUTE 'ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS global_entity_id UUID REFERENCES global.entities(id) ON DELETE SET NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_gft_contacts_global_entity ON gft.contacts(global_entity_id)';
    RAISE NOTICE 'Added global_entity_id to gft.contacts';
  ELSE
    RAISE NOTICE 'gft schema not found, skipping';
  END IF;
END $$;

-- ============================================
-- SIGNAL CONTRIBUTION FUNCTION
-- Anonymously contribute a signal
-- ============================================
CREATE OR REPLACE FUNCTION global.contribute_signal(
  p_entity_id UUID,
  p_signal_type TEXT,
  p_value TEXT,
  p_score FLOAT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_contributor_hash TEXT;
  v_signal_id UUID;
BEGIN
  -- Generate anonymized contributor hash
  -- Uses a combination of user_id and a server-side salt
  -- Salt should be set as a database secret in production
  v_contributor_hash := encode(
    sha256(
      (COALESCE(p_user_id::text, 'anonymous') || '_renubu_salt_2024')::bytea
    ),
    'hex'
  );

  -- Insert signal (on conflict update score if provided)
  INSERT INTO global.entity_signals (
    entity_id,
    signal_type,
    value,
    score,
    contributor_hash,
    observed_at
  ) VALUES (
    p_entity_id,
    p_signal_type,
    p_value,
    p_score,
    v_contributor_hash,
    CURRENT_DATE
  )
  ON CONFLICT (entity_id, signal_type, contributor_hash, observed_at)
  DO UPDATE SET
    value = EXCLUDED.value,
    score = COALESCE(EXCLUDED.score, global.entity_signals.score)
  RETURNING id INTO v_signal_id;

  RETURN v_signal_id;
END;
$$;

-- ============================================
-- SEMANTIC SEARCH FUNCTION
-- Search entities by embedding similarity
-- ============================================
CREATE OR REPLACE FUNCTION global.search_entities_semantic(
  query_embedding vector(1536),
  embedding_type TEXT DEFAULT 'profile',
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  entity_id UUID,
  name TEXT,
  linkedin_url TEXT,
  current_company TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id AS entity_id,
    e.name,
    e.linkedin_url,
    e.current_company,
    1 - (ee.embedding <=> query_embedding) AS similarity
  FROM global.entity_embeddings ee
  JOIN global.entities e ON e.id = ee.entity_id
  WHERE
    ee.embedding_type = search_entities_semantic.embedding_type
    AND ee.embedding IS NOT NULL
    AND 1 - (ee.embedding <=> query_embedding) > match_threshold
  ORDER BY ee.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE global.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE global.entity_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE global.entity_embeddings ENABLE ROW LEVEL SECURITY;

-- Entities are readable by all authenticated users
CREATE POLICY "Authenticated users can read entities"
  ON global.entities FOR SELECT
  TO authenticated
  USING (true);

-- Service role can manage all
CREATE POLICY "Service can manage entities"
  ON global.entities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Signals are readable by all authenticated users (anonymized)
CREATE POLICY "Authenticated users can read signals"
  ON global.entity_signals FOR SELECT
  TO authenticated
  USING (true);

-- Service role can insert signals
CREATE POLICY "Service can manage signals"
  ON global.entity_signals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Embeddings are readable by all authenticated users
CREATE POLICY "Authenticated users can read embeddings"
  ON global.entity_embeddings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service can manage embeddings"
  ON global.entity_embeddings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- EXPOSE SCHEMA TO POSTGREST
-- ============================================
ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,human_os,founder_os,gft,global';
NOTIFY pgrst, 'reload config';

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_global_entities_updated_at
  BEFORE UPDATE ON global.entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON SCHEMA global IS 'Cross-organizational knowledge graph';
COMMENT ON TABLE global.entities IS 'Canonical deduplicated entity registry';
COMMENT ON TABLE global.entity_signals IS 'Anonymized signals about entities';
COMMENT ON TABLE global.entity_embeddings IS 'Semantic embeddings for entity search';
COMMENT ON MATERIALIZED VIEW global.entity_intelligence IS 'Pre-aggregated entity metrics';
COMMENT ON FUNCTION global.resolve_entity IS 'Find or create global entity from local data';
COMMENT ON FUNCTION global.contribute_signal IS 'Anonymously contribute a signal about an entity';
COMMENT ON FUNCTION global.search_entities_semantic IS 'Semantic search across entities';
