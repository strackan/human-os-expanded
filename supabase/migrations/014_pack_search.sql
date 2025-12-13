-- Human OS Migration: Pack Search & Serendipity Engine
-- Full-text search across entities, identity_packs, and context_files

-- =============================================================================
-- HELPER: Update content_tsv from stored content
-- =============================================================================

-- Function to update tsvector for a context file
-- Called manually or via background job after file upload
CREATE OR REPLACE FUNCTION update_context_file_tsv(
  p_file_id UUID,
  p_content TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE context_files
  SET content_tsv = to_tsvector('english', COALESCE(p_content, ''))
  WHERE id = p_file_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PACK SEARCH FUNCTION
-- Multi-dimensional identity discovery across entities and their packs
-- =============================================================================

CREATE OR REPLACE FUNCTION pack_search(
  p_keyword TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_pack_type TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_layer TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  entity_id UUID,
  entity_slug TEXT,
  entity_name TEXT,
  entity_type TEXT,
  pack_id UUID,
  pack_type TEXT,
  headline TEXT,
  tags TEXT[],
  visibility TEXT,
  relevance_score REAL,
  matching_snippet TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH entity_matches AS (
    SELECT DISTINCT ON (e.id)
      e.id AS entity_id,
      e.slug AS entity_slug,
      e.name AS entity_name,
      e.entity_type,
      ip.id AS pack_id,
      ip.pack_type,
      ip.headline,
      ip.tags,
      ip.visibility,
      -- Calculate relevance score
      CASE
        WHEN p_keyword IS NOT NULL AND ip.headline ILIKE '%' || p_keyword || '%' THEN 3.0
        WHEN p_keyword IS NOT NULL AND e.name ILIKE '%' || p_keyword || '%' THEN 2.5
        WHEN p_keyword IS NOT NULL AND ip.tags && ARRAY[p_keyword] THEN 2.0
        ELSE 1.0
      END +
      CASE
        WHEN ip.visibility = 'public' THEN 0.5
        ELSE 0.0
      END AS relevance_score,
      -- Get snippet from headline or summary
      COALESCE(
        CASE WHEN p_keyword IS NOT NULL THEN ip.headline ELSE NULL END,
        LEFT(ip.summary, 100)
      ) AS matching_snippet
    FROM entities e
    LEFT JOIN identity_packs ip ON ip.entity_id = e.id
    WHERE
      -- Entity type filter
      (p_entity_type IS NULL OR e.entity_type = p_entity_type)
      -- Pack type filter
      AND (p_pack_type IS NULL OR ip.pack_type = p_pack_type)
      -- Tags filter (any match)
      AND (p_tags IS NULL OR ip.tags && p_tags)
      -- Location filter (fuzzy match on metadata)
      AND (p_location IS NULL OR
           e.metadata->>'location' ILIKE '%' || p_location || '%' OR
           ip.metadata->>'location' ILIKE '%' || p_location || '%')
      -- Layer filter (privacy)
      AND (p_layer IS NULL OR
           ip.visibility = 'public' OR
           EXISTS (
             SELECT 1 FROM context_files cf
             WHERE cf.entity_id = e.id AND cf.layer = p_layer
           ))
      -- Keyword filter on entity name, headline, or tags
      AND (p_keyword IS NULL OR
           e.name ILIKE '%' || p_keyword || '%' OR
           ip.headline ILIKE '%' || p_keyword || '%' OR
           ip.summary ILIKE '%' || p_keyword || '%' OR
           ip.tags && ARRAY[LOWER(p_keyword)])
    ORDER BY e.id, relevance_score DESC
  ),
  -- Add full-text search on context files if keyword provided
  content_matches AS (
    SELECT
      cf.entity_id,
      ts_rank(cf.content_tsv, plainto_tsquery('english', p_keyword)) AS content_rank,
      ts_headline('english',
        COALESCE(e.name, '') || ' ' || COALESCE(ip.headline, ''),
        plainto_tsquery('english', p_keyword),
        'MaxWords=20, MinWords=10'
      ) AS content_snippet
    FROM context_files cf
    JOIN entities e ON e.id = cf.entity_id
    LEFT JOIN identity_packs ip ON ip.entity_id = cf.entity_id
    WHERE p_keyword IS NOT NULL
      AND cf.content_tsv @@ plainto_tsquery('english', p_keyword)
      AND (p_layer IS NULL OR cf.layer = p_layer)
  )
  SELECT
    em.entity_id,
    em.entity_slug,
    em.entity_name,
    em.entity_type,
    em.pack_id,
    em.pack_type,
    em.headline,
    em.tags,
    em.visibility,
    (em.relevance_score + COALESCE(cm.content_rank, 0))::REAL AS relevance_score,
    COALESCE(cm.content_snippet, em.matching_snippet) AS matching_snippet
  FROM entity_matches em
  LEFT JOIN content_matches cm ON cm.entity_id = em.entity_id
  ORDER BY relevance_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- FIND CONNECTION POINTS (Serendipity Engine)
-- Discover shared interests between two people
-- =============================================================================

CREATE OR REPLACE FUNCTION find_connection_points(
  p_viewer_slug TEXT,
  p_target_slug TEXT
)
RETURNS TABLE (
  connection_type TEXT,
  topic TEXT,
  viewer_context TEXT,
  target_context TEXT,
  strength REAL
) AS $$
DECLARE
  v_viewer_id UUID;
  v_target_id UUID;
BEGIN
  -- Get entity IDs
  SELECT id INTO v_viewer_id FROM entities WHERE slug = p_viewer_slug;
  SELECT id INTO v_target_id FROM entities WHERE slug = p_target_slug;

  IF v_viewer_id IS NULL OR v_target_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  -- Find overlapping tags in identity packs
  WITH viewer_tags AS (
    SELECT unnest(tags) AS tag, headline, pack_type
    FROM identity_packs
    WHERE entity_id = v_viewer_id
  ),
  target_tags AS (
    SELECT unnest(tags) AS tag, headline, pack_type
    FROM identity_packs
    WHERE entity_id = v_target_id
  ),
  tag_overlaps AS (
    SELECT
      'shared_interest'::TEXT AS connection_type,
      vt.tag AS topic,
      vt.headline AS viewer_context,
      tt.headline AS target_context,
      1.0::REAL AS strength
    FROM viewer_tags vt
    JOIN target_tags tt ON LOWER(vt.tag) = LOWER(tt.tag)
  ),
  -- Find mutual connections (both linked to same entity)
  viewer_connections AS (
    SELECT target_slug, link_type, context_snippet, strength
    FROM entity_links
    WHERE source_slug = p_viewer_slug
  ),
  target_connections AS (
    SELECT target_slug, link_type, context_snippet, strength
    FROM entity_links
    WHERE source_slug = p_target_slug
  ),
  mutual_people AS (
    SELECT
      'mutual_connection'::TEXT AS connection_type,
      e.name AS topic,
      vc.context_snippet AS viewer_context,
      tc.context_snippet AS target_context,
      ((COALESCE(vc.strength, 1.0) + COALESCE(tc.strength, 1.0)) / 2)::REAL AS strength
    FROM viewer_connections vc
    JOIN target_connections tc ON vc.target_slug = tc.target_slug
    JOIN entities e ON e.slug = vc.target_slug
    WHERE e.entity_type = 'person'
  ),
  -- Find similar pack types (both have professional, interests, etc.)
  pack_overlaps AS (
    SELECT
      'shared_facet'::TEXT AS connection_type,
      vp.pack_type AS topic,
      vp.headline AS viewer_context,
      tp.headline AS target_context,
      0.5::REAL AS strength
    FROM identity_packs vp
    JOIN identity_packs tp ON vp.pack_type = tp.pack_type
    WHERE vp.entity_id = v_viewer_id
      AND tp.entity_id = v_target_id
      AND vp.headline IS NOT NULL
      AND tp.headline IS NOT NULL
  )
  SELECT * FROM tag_overlaps
  UNION ALL
  SELECT * FROM mutual_people
  UNION ALL
  SELECT * FROM pack_overlaps
  ORDER BY strength DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- GENERATE CONVERSATION OPENERS
-- Takes connection points and generates suggested openers
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_openers(
  p_viewer_slug TEXT,
  p_target_slug TEXT,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  opener TEXT,
  based_on TEXT,
  confidence REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE cp.connection_type
      WHEN 'shared_interest' THEN
        'I noticed we both share an interest in ' || cp.topic || ' - ' ||
        COALESCE(cp.target_context, 'I''d love to hear your thoughts on it.')
      WHEN 'mutual_connection' THEN
        'I see we both know ' || cp.topic || '. ' ||
        'Small world! How do you know them?'
      WHEN 'shared_facet' THEN
        'Your ' || cp.topic || ' background caught my eye - ' ||
        COALESCE(cp.target_context, 'I''d love to learn more.')
      ELSE
        'I came across your profile and found your background interesting.'
    END AS opener,
    cp.connection_type || ': ' || cp.topic AS based_on,
    cp.strength AS confidence
  FROM find_connection_points(p_viewer_slug, p_target_slug) cp
  ORDER BY cp.strength DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for tag array searches
CREATE INDEX IF NOT EXISTS idx_identity_packs_tags ON identity_packs USING GIN (tags);

-- Index for text search on headlines (using standard btree for ILIKE queries)
CREATE INDEX IF NOT EXISTS idx_identity_packs_headline ON identity_packs (headline);
CREATE INDEX IF NOT EXISTS idx_identity_packs_summary ON identity_packs (summary);

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON FUNCTION pack_search IS 'Multi-dimensional identity discovery across entities and packs';
COMMENT ON FUNCTION find_connection_points IS 'Discover shared interests and connections between two people';
COMMENT ON FUNCTION generate_openers IS 'Generate conversation openers based on connection points';
COMMENT ON FUNCTION update_context_file_tsv IS 'Update tsvector for full-text search on context file content';
