-- Human OS Migration: Entity Links (Knowledge Graph)
-- Stores relationships between entities with layer-based scoping

-- =============================================================================
-- ENTITY LINKS TABLE
-- Knowledge graph edges - links are also scoped by layer
-- =============================================================================
CREATE TABLE IF NOT EXISTS entity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Layer scoping (links inherit privacy from their layer)
  layer TEXT NOT NULL,                 -- Same layer concept as context_files

  -- Link endpoints (using slugs for flexibility)
  source_slug TEXT NOT NULL,           -- Entity that contains the link
  target_slug TEXT NOT NULL,           -- Entity being linked to

  -- Link type
  link_type TEXT NOT NULL CHECK (link_type IN (
    'wiki_link',      -- [[link]] parsed from markdown
    'mentions',       -- Entity mentions another entity
    'child_of',       -- Hierarchical relationship (goal -> parent goal)
    'related_to',     -- Generic association
    'works_at',       -- Person -> Company
    'contacts',       -- Person -> Person relationship
    'owns',           -- User -> Entity ownership
    'assigned_to',    -- Task -> Person assignment
    'part_of'         -- Entity -> Project/Goal membership
  )),

  -- Link metadata
  link_text TEXT,                      -- Original text (e.g., "Scott Leese" from [[Scott Leese]])
  context_snippet TEXT,                -- Surrounding text for context (~100 chars)
  strength FLOAT DEFAULT 1.0,          -- Edge weight for graph algorithms (0.0 - 1.0)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one link per source/target/type/layer combo
  UNIQUE(layer, source_slug, target_slug, link_type)
);

-- Indexes for graph traversal
CREATE INDEX IF NOT EXISTS idx_entity_links_layer ON entity_links(layer);
CREATE INDEX IF NOT EXISTS idx_entity_links_source ON entity_links(source_slug);
CREATE INDEX IF NOT EXISTS idx_entity_links_target ON entity_links(target_slug);
CREATE INDEX IF NOT EXISTS idx_entity_links_type ON entity_links(link_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_entity_links_layer_source ON entity_links(layer, source_slug);
CREATE INDEX IF NOT EXISTS idx_entity_links_layer_target ON entity_links(layer, target_slug);

-- =============================================================================
-- HELPER FUNCTIONS FOR GRAPH QUERIES
-- =============================================================================

-- Function to get all connections for an entity (incoming + outgoing)
CREATE OR REPLACE FUNCTION get_entity_connections(
  p_slug TEXT,
  p_layers TEXT[] DEFAULT ARRAY['public']
)
RETURNS TABLE (
  direction TEXT,
  other_slug TEXT,
  link_type TEXT,
  strength FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'outgoing'::TEXT as direction,
    el.target_slug as other_slug,
    el.link_type,
    el.strength
  FROM entity_links el
  WHERE el.source_slug = p_slug
    AND el.layer = ANY(p_layers)
  UNION ALL
  SELECT
    'incoming'::TEXT as direction,
    el.source_slug as other_slug,
    el.link_type,
    el.strength
  FROM entity_links el
  WHERE el.target_slug = p_slug
    AND el.layer = ANY(p_layers);
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE entity_links IS 'Knowledge graph edges between entities';
COMMENT ON COLUMN entity_links.layer IS 'Privacy layer - links inherit access from their layer';
COMMENT ON COLUMN entity_links.link_type IS 'Type of relationship: wiki_link, works_at, contacts, etc.';
COMMENT ON COLUMN entity_links.strength IS 'Edge weight for graph algorithms (0.0 - 1.0)';
COMMENT ON FUNCTION get_entity_connections IS 'Get all connections (incoming + outgoing) for an entity';
