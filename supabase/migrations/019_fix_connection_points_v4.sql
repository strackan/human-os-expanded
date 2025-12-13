-- Human OS Migration: Fix find_connection_points function (final)
-- Fixes column reference ambiguity by renaming inner CTE columns

-- Drop and recreate to ensure clean state
DROP FUNCTION IF EXISTS find_connection_points(TEXT, TEXT);

CREATE FUNCTION find_connection_points(
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
      'shared_interest'::TEXT AS conn_type,
      vt.tag AS conn_topic,
      vt.headline AS v_context,
      tt.headline AS t_context,
      1.0::REAL AS conn_strength
    FROM viewer_tags vt
    JOIN target_tags tt ON LOWER(vt.tag) = LOWER(tt.tag)
  ),
  -- Find mutual connections (both linked to same entity)
  viewer_connections AS (
    SELECT el.target_slug AS tgt, el.link_type, el.context_snippet, el.strength AS link_str
    FROM entity_links el
    WHERE el.source_slug = p_viewer_slug
  ),
  target_connections AS (
    SELECT el.target_slug AS tgt, el.link_type, el.context_snippet, el.strength AS link_str
    FROM entity_links el
    WHERE el.source_slug = p_target_slug
  ),
  mutual_people AS (
    SELECT
      'mutual_connection'::TEXT AS conn_type,
      e.name AS conn_topic,
      vc.context_snippet AS v_context,
      tc.context_snippet AS t_context,
      ((COALESCE(vc.link_str, 1.0) + COALESCE(tc.link_str, 1.0)) / 2)::REAL AS conn_strength
    FROM viewer_connections vc
    JOIN target_connections tc ON vc.tgt = tc.tgt
    JOIN entities e ON e.slug = vc.tgt
    WHERE e.entity_type = 'person'
  ),
  -- Find similar pack types (both have professional, interests, etc.)
  pack_overlaps AS (
    SELECT
      'shared_facet'::TEXT AS conn_type,
      vp.pack_type AS conn_topic,
      vp.headline AS v_context,
      tp.headline AS t_context,
      0.5::REAL AS conn_strength
    FROM identity_packs vp
    JOIN identity_packs tp ON vp.pack_type = tp.pack_type
    WHERE vp.entity_id = v_viewer_id
      AND tp.entity_id = v_target_id
      AND vp.headline IS NOT NULL
      AND tp.headline IS NOT NULL
  ),
  -- Combine all results
  all_results AS (
    SELECT conn_type, conn_topic, v_context, t_context, conn_strength FROM tag_overlaps
    UNION ALL
    SELECT conn_type, conn_topic, v_context, t_context, conn_strength FROM mutual_people
    UNION ALL
    SELECT conn_type, conn_topic, v_context, t_context, conn_strength FROM pack_overlaps
  )
  SELECT
    ar.conn_type AS connection_type,
    ar.conn_topic AS topic,
    ar.v_context AS viewer_context,
    ar.t_context AS target_context,
    ar.conn_strength AS strength
  FROM all_results ar
  ORDER BY ar.conn_strength DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION find_connection_points IS 'Discover shared interests and connections between two people';
