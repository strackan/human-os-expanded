-- Human OS Migration: Fix find_connection_points function
-- Repairs column reference error in mutual_people CTE

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
    SELECT target_slug, link_type, context_snippet, strength AS link_strength
    FROM entity_links
    WHERE source_slug = p_viewer_slug
  ),
  target_connections AS (
    SELECT target_slug, link_type, context_snippet, strength AS link_strength
    FROM entity_links
    WHERE source_slug = p_target_slug
  ),
  mutual_people AS (
    SELECT
      'mutual_connection'::TEXT AS connection_type,
      e.name AS topic,
      vc.context_snippet AS viewer_context,
      tc.context_snippet AS target_context,
      ((COALESCE(vc.link_strength, 1.0) + COALESCE(tc.link_strength, 1.0)) / 2)::REAL AS strength
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
  SELECT connection_type, topic, viewer_context, target_context, strength FROM tag_overlaps
  UNION ALL
  SELECT connection_type, topic, viewer_context, target_context, strength FROM mutual_people
  UNION ALL
  SELECT connection_type, topic, viewer_context, target_context, strength FROM pack_overlaps
  ORDER BY 5 DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION find_connection_points IS 'Discover shared interests and connections between two people (fixed)';
