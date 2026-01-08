-- ============================================
-- ENTITY RESOLUTION SCHEMA
-- Semantic entity resolution with tiered matching
-- Tiers: Glossary → Exact → Fuzzy (pg_trgm) → Semantic (embeddings)
-- ============================================

-- =============================================================================
-- PG_TRGM EXTENSION (for fuzzy string matching)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- TRIGRAM INDEXES FOR FUZZY MATCHING
-- =============================================================================

-- Glossary fuzzy matching on normalized term
CREATE INDEX IF NOT EXISTS idx_glossary_term_trgm
  ON glossary USING gin (term_normalized gin_trgm_ops);

-- Entities fuzzy matching on name (lowercase) and slug
CREATE INDEX IF NOT EXISTS idx_entities_name_trgm
  ON entities USING gin (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_entities_slug_trgm
  ON entities USING gin (slug gin_trgm_ops);

-- =============================================================================
-- ENTITY RESOLUTION RESULT TYPE
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE human_os.entity_resolution_result AS (
    entity_id UUID,
    entity_slug TEXT,
    entity_name TEXT,
    entity_type TEXT,
    match_source TEXT,    -- 'glossary', 'entity_exact', 'entity_fuzzy', 'entity_semantic'
    confidence FLOAT,
    metadata JSONB
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- RESOLVE ENTITY MENTION (Single mention, tiered resolution)
-- =============================================================================

CREATE OR REPLACE FUNCTION human_os.resolve_entity_mention(
  p_mention TEXT,
  p_layer TEXT DEFAULT 'public',
  p_entity_types TEXT[] DEFAULT NULL,  -- Filter to specific types (e.g., ARRAY['person'])
  p_fuzzy_threshold FLOAT DEFAULT 0.3, -- Trigram similarity threshold
  p_embedding vector(1536) DEFAULT NULL -- For semantic fallback (Tier 4)
) RETURNS SETOF human_os.entity_resolution_result
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_normalized TEXT;
  v_result human_os.entity_resolution_result;
  v_found BOOLEAN := false;
BEGIN
  v_normalized := lower(trim(p_mention));

  -- =========================================================================
  -- TIER 1: Exact glossary match (fastest, highest confidence)
  -- =========================================================================
  FOR v_result IN
    SELECT
      g.entity_id,
      e.slug,
      e.name,
      e.entity_type::TEXT,
      'glossary'::TEXT as match_source,
      1.0::FLOAT as confidence,
      e.metadata
    FROM glossary g
    JOIN entities e ON e.id = g.entity_id
    WHERE g.term_normalized = v_normalized
      AND g.layer = p_layer
      AND g.entity_id IS NOT NULL
      AND (p_entity_types IS NULL OR e.entity_type::TEXT = ANY(p_entity_types))
    LIMIT 1
  LOOP
    v_found := true;
    RETURN NEXT v_result;
    RETURN;  -- Early return on Tier 1 match
  END LOOP;

  -- =========================================================================
  -- TIER 2: Exact entity slug/name match (fast, high confidence)
  -- =========================================================================
  FOR v_result IN
    SELECT
      e.id,
      e.slug,
      e.name,
      e.entity_type::TEXT,
      'entity_exact'::TEXT as match_source,
      0.95::FLOAT as confidence,
      e.metadata
    FROM entities e
    WHERE (e.slug = v_normalized OR lower(e.name) = v_normalized)
      AND (p_entity_types IS NULL OR e.entity_type::TEXT = ANY(p_entity_types))
    LIMIT 1
  LOOP
    v_found := true;
    RETURN NEXT v_result;
    RETURN;  -- Early return on Tier 2 match
  END LOOP;

  -- =========================================================================
  -- TIER 3: Fuzzy trigram match (moderate cost, handles typos)
  -- =========================================================================
  FOR v_result IN
    SELECT
      e.id,
      e.slug,
      e.name,
      e.entity_type::TEXT,
      'entity_fuzzy'::TEXT as match_source,
      GREATEST(
        similarity(e.slug, v_normalized),
        similarity(lower(e.name), v_normalized)
      ) as confidence,
      e.metadata
    FROM entities e
    WHERE (
      similarity(e.slug, v_normalized) >= p_fuzzy_threshold
      OR similarity(lower(e.name), v_normalized) >= p_fuzzy_threshold
    )
    AND (p_entity_types IS NULL OR e.entity_type::TEXT = ANY(p_entity_types))
    ORDER BY GREATEST(
      similarity(e.slug, v_normalized),
      similarity(lower(e.name), v_normalized)
    ) DESC
    LIMIT 1
  LOOP
    -- Only return if confidence > 0.7 (otherwise fall through to semantic)
    IF v_result.confidence > 0.7 THEN
      v_found := true;
      RETURN NEXT v_result;
      RETURN;  -- Early return on high-confidence Tier 3 match
    END IF;
  END LOOP;

  -- =========================================================================
  -- TIER 4: Semantic embedding match (highest cost, only if tiers 1-3 failed)
  -- Only called if p_embedding is provided
  -- =========================================================================
  IF p_embedding IS NOT NULL THEN
    -- Try matching against context file embeddings linked to entities
    FOR v_result IN
      SELECT
        e.id,
        e.slug,
        e.name,
        e.entity_type::TEXT,
        'entity_semantic'::TEXT as match_source,
        (1 - (cf.embedding <=> p_embedding))::FLOAT as confidence,
        e.metadata
      FROM entities e
      JOIN human_os.context_files cf ON cf.entity_id = e.id
      WHERE cf.embedding IS NOT NULL
        AND (p_entity_types IS NULL OR e.entity_type::TEXT = ANY(p_entity_types))
        AND (1 - (cf.embedding <=> p_embedding)) >= 0.7
      ORDER BY cf.embedding <=> p_embedding
      LIMIT 1
    LOOP
      v_found := true;
      RETURN NEXT v_result;
      RETURN;
    END LOOP;
  END IF;

  -- No match found at any tier
  RETURN;
END;
$$;

-- =============================================================================
-- BATCH RESOLUTION (Resolve multiple mentions efficiently)
-- =============================================================================

CREATE OR REPLACE FUNCTION human_os.resolve_entity_mentions_batch(
  p_mentions TEXT[],
  p_layer TEXT DEFAULT 'public',
  p_entity_types TEXT[] DEFAULT NULL
) RETURNS TABLE (
  mention TEXT,
  entity_id UUID,
  entity_slug TEXT,
  entity_name TEXT,
  entity_type TEXT,
  match_source TEXT,
  confidence FLOAT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.mention,
    r.entity_id,
    r.entity_slug,
    r.entity_name,
    r.entity_type,
    r.match_source,
    r.confidence
  FROM unnest(p_mentions) AS m(mention)
  CROSS JOIN LATERAL (
    SELECT * FROM human_os.resolve_entity_mention(
      m.mention,
      p_layer,
      p_entity_types,
      0.3,   -- Default fuzzy threshold
      NULL   -- No embedding in batch mode (tiers 1-3 only for performance)
    )
    LIMIT 1
  ) r;
END;
$$;

-- =============================================================================
-- RESOLVE WITH EMBEDDING (For Tier 4 semantic fallback)
-- Called only when tiers 1-3 fail for a specific mention
-- =============================================================================

CREATE OR REPLACE FUNCTION human_os.resolve_entity_semantic(
  p_mention TEXT,
  p_embedding vector(1536),
  p_layer TEXT DEFAULT 'public',
  p_entity_types TEXT[] DEFAULT NULL,
  p_threshold FLOAT DEFAULT 0.7
) RETURNS SETOF human_os.entity_resolution_result
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.slug,
    e.name,
    e.entity_type::TEXT,
    'entity_semantic'::TEXT as match_source,
    (1 - (cf.embedding <=> p_embedding))::FLOAT as confidence,
    e.metadata
  FROM entities e
  JOIN human_os.context_files cf ON cf.entity_id = e.id
  WHERE cf.embedding IS NOT NULL
    AND (p_entity_types IS NULL OR e.entity_type::TEXT = ANY(p_entity_types))
    AND (1 - (cf.embedding <=> p_embedding)) >= p_threshold
  ORDER BY cf.embedding <=> p_embedding
  LIMIT 3;
END;
$$;

-- =============================================================================
-- GLOSSARY FUZZY SEARCH (For Tier 3 glossary matching)
-- =============================================================================

CREATE OR REPLACE FUNCTION human_os.glossary_fuzzy_match(
  p_mention TEXT,
  p_layer TEXT DEFAULT 'public',
  p_threshold FLOAT DEFAULT 0.3
) RETURNS TABLE (
  glossary_id UUID,
  term TEXT,
  entity_id UUID,
  entity_slug TEXT,
  entity_name TEXT,
  entity_type TEXT,
  confidence FLOAT
) LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_normalized TEXT;
BEGIN
  v_normalized := lower(trim(p_mention));

  RETURN QUERY
  SELECT
    g.id as glossary_id,
    g.term,
    g.entity_id,
    e.slug as entity_slug,
    e.name as entity_name,
    e.entity_type::TEXT,
    similarity(g.term_normalized, v_normalized) as confidence
  FROM glossary g
  LEFT JOIN entities e ON g.entity_id = e.id
  WHERE g.layer = p_layer
    AND similarity(g.term_normalized, v_normalized) >= p_threshold
  ORDER BY similarity(g.term_normalized, v_normalized) DESC
  LIMIT 5;
END;
$$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION human_os.resolve_entity_mention IS
'Multi-tier entity resolution with early return:
- Tier 1: Exact glossary match (confidence 1.0, fastest)
- Tier 2: Exact entity slug/name match (confidence 0.95)
- Tier 3: Fuzzy trigram match (confidence > 0.7 required)
- Tier 4: Semantic embedding match (only if embedding provided and tiers 1-3 failed)
Each tier returns immediately on match to minimize latency and API calls.';

COMMENT ON FUNCTION human_os.resolve_entity_mentions_batch IS
'Batch resolve multiple mentions efficiently. Uses tiers 1-3 only (no embeddings) for performance.
For semantic fallback, call resolve_entity_semantic separately for unresolved mentions.';

COMMENT ON FUNCTION human_os.resolve_entity_semantic IS
'Tier 4 semantic resolution via embeddings. Called only when tiers 1-3 fail.
Requires embedding vector to be pre-generated by the application.';

COMMENT ON FUNCTION human_os.glossary_fuzzy_match IS
'Fuzzy search against glossary terms using pg_trgm similarity.
Returns top matches with confidence scores for disambiguation.';
