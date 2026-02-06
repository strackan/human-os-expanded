-- Human OS Migration: Glossary
-- Quick term definitions for shorthand, aliases, slang, and acronyms

-- =============================================================================
-- GLOSSARY TABLE
-- Stores term → definition mappings for conversational shorthand
-- =============================================================================
CREATE TABLE IF NOT EXISTS glossary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The term (case-insensitive matching)
  term TEXT NOT NULL,
  term_normalized TEXT NOT NULL,  -- Lowercase for matching

  -- Definition
  definition TEXT NOT NULL,       -- Human-readable explanation
  short_definition TEXT,          -- One-liner for inline expansion

  -- Optional entity linkage (if this term refers to an entity)
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,

  -- Classification
  term_type TEXT NOT NULL DEFAULT 'shorthand' CHECK (term_type IN (
    'person',       -- Nickname for a person (Ruth, Big Mike)
    'group',        -- Group name (Barry Horowitz, The Boys)
    'acronym',      -- Abbreviation (GFT, ADHD, PDA)
    'slang',        -- Personal slang (flattened out, crowded brain)
    'project',      -- Project shorthand (R = Renubu)
    'shorthand'     -- Generic shorthand
  )),

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Context hints (when to surface this definition)
  context_tags TEXT[] DEFAULT '{}',  -- e.g., ['personal', 'work', 'social']
  always_expand BOOLEAN DEFAULT false,  -- Always show definition when term used

  -- Ownership
  owner_id UUID,
  layer TEXT NOT NULL DEFAULT 'founder:justin',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique term per layer
  UNIQUE(layer, term_normalized)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_glossary_term ON glossary(term_normalized);
CREATE INDEX IF NOT EXISTS idx_glossary_layer ON glossary(layer);
CREATE INDEX IF NOT EXISTS idx_glossary_type ON glossary(term_type);
CREATE INDEX IF NOT EXISTS idx_glossary_entity ON glossary(entity_id);
CREATE INDEX IF NOT EXISTS idx_glossary_usage ON glossary(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_glossary_tags ON glossary USING GIN (context_tags);

-- Full-text search on term and definition
CREATE INDEX IF NOT EXISTS idx_glossary_search ON glossary USING GIN (
  to_tsvector('english', term || ' ' || definition)
);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_glossary_updated_at ON glossary;
CREATE TRIGGER update_glossary_updated_at
  BEFORE UPDATE ON glossary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Lookup a term (case-insensitive)
CREATE OR REPLACE FUNCTION glossary_lookup(
  p_term TEXT,
  p_layer TEXT DEFAULT 'founder:justin'
)
RETURNS TABLE (
  id UUID,
  term TEXT,
  definition TEXT,
  short_definition TEXT,
  term_type TEXT,
  entity_id UUID,
  entity_name TEXT
) AS $$
BEGIN
  -- Increment usage count
  UPDATE glossary g
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE g.term_normalized = LOWER(TRIM(p_term))
    AND g.layer = p_layer;

  -- Return the definition
  RETURN QUERY
  SELECT
    g.id,
    g.term,
    g.definition,
    g.short_definition,
    g.term_type,
    g.entity_id,
    e.name as entity_name
  FROM glossary g
  LEFT JOIN entities e ON g.entity_id = e.id
  WHERE g.term_normalized = LOWER(TRIM(p_term))
    AND g.layer = p_layer;
END;
$$ LANGUAGE plpgsql;

-- Quick define a term
CREATE OR REPLACE FUNCTION glossary_define(
  p_term TEXT,
  p_definition TEXT,
  p_term_type TEXT DEFAULT 'shorthand',
  p_short_definition TEXT DEFAULT NULL,
  p_layer TEXT DEFAULT 'founder:justin'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO glossary (term, term_normalized, definition, short_definition, term_type, layer)
  VALUES (
    TRIM(p_term),
    LOWER(TRIM(p_term)),
    p_definition,
    COALESCE(p_short_definition, LEFT(p_definition, 100)),
    p_term_type,
    p_layer
  )
  ON CONFLICT (layer, term_normalized)
  DO UPDATE SET
    definition = EXCLUDED.definition,
    short_definition = EXCLUDED.short_definition,
    term_type = EXCLUDED.term_type,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Get frequently used terms (for session context)
CREATE OR REPLACE FUNCTION glossary_frequent(
  p_layer TEXT DEFAULT 'founder:justin',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  term TEXT,
  short_definition TEXT,
  term_type TEXT,
  usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.term,
    g.short_definition,
    g.term_type,
    g.usage_count
  FROM glossary g
  WHERE g.layer = p_layer
    AND g.usage_count > 0
  ORDER BY g.usage_count DESC, g.last_used_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Search glossary
CREATE OR REPLACE FUNCTION glossary_search(
  p_query TEXT,
  p_layer TEXT DEFAULT 'founder:justin'
)
RETURNS TABLE (
  id UUID,
  term TEXT,
  definition TEXT,
  term_type TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.term,
    g.definition,
    g.term_type,
    ts_rank(
      to_tsvector('english', g.term || ' ' || g.definition),
      plainto_tsquery('english', p_query)
    ) as rank
  FROM glossary g
  WHERE g.layer = p_layer
    AND to_tsvector('english', g.term || ' ' || g.definition) @@ plainto_tsquery('english', p_query)
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE glossary ENABLE ROW LEVEL SECURITY;

-- Owners can do anything with their glossary
DROP POLICY IF EXISTS "glossary_owner_all" ON glossary;
CREATE POLICY "glossary_owner_all" ON glossary
  FOR ALL
  USING (owner_id = auth.uid());

-- Users can read glossary in their layer
DROP POLICY IF EXISTS "glossary_layer_read" ON glossary;
CREATE POLICY "glossary_layer_read" ON glossary
  FOR SELECT
  USING (
    layer LIKE 'founder:%'
    AND SUBSTRING(layer FROM 'founder:(.+)') = auth.uid()::TEXT
  );

-- =============================================================================
-- SEED DATA (Justin's common terms)
-- =============================================================================
INSERT INTO glossary (term, term_normalized, definition, short_definition, term_type, layer, context_tags) VALUES
  ('Ruth', 'ruth', 'Ruth Strackany - Justin''s wife and a Clinical Psychologist. Primary support person and emotional anchor. See [[ruth.md]] for more context.', 'Justin''s wife, Clinical Psychologist', 'person', 'founder:justin', ARRAY['personal', 'family']),

  ('Barry Horowitz', 'barry horowitz', 'Barry Horowitz is a nickname for Justin''s close friend group from college - Ryan Behling, [others]. Named after a wrestling character. When Justin says "Barry Horowitz" he means this group collectively.', 'College friend group nickname', 'group', 'founder:justin', ARRAY['personal', 'social', 'friends']),

  ('flattened out', 'flattened out', 'Slang Justin uses to describe extreme intoxication or being completely wiped out. "I got flattened out last night" = very drunk or exhausted.', 'Extremely drunk/exhausted', 'slang', 'founder:justin', ARRAY['personal', 'slang']),

  ('GFT', 'gft', 'Guy For That - A CRM/expert discovery product Justin is building. Part of the Human OS ecosystem.', 'Guy For That (CRM product)', 'acronym', 'founder:justin', ARRAY['work', 'projects']),

  ('crowded brain', 'crowded brain', 'The mental state when too many thoughts/tasks are competing for attention. Common ADHD experience. The goal of Human OS is to reduce crowded brain moments.', 'Too many competing thoughts (ADHD)', 'slang', 'founder:justin', ARRAY['personal', 'adhd']),

  ('PDA', 'pda', 'Pathological Demand Avoidance - An autism subtype Justin has. Means direct demands trigger resistance. Frame things as choices, not commands.', 'Pathological Demand Avoidance (autism subtype)', 'acronym', 'founder:justin', ARRAY['personal', 'adhd', 'identity']),

  ('whirling dervish', 'whirling dervish', 'State Justin enters when stressed - rapid context switching, starting many things, finishing few. Ruth uses this term. Indicates need to slow down and focus.', 'Stressed rapid-switching state', 'slang', 'founder:justin', ARRAY['personal', 'adhd', 'stress'])

ON CONFLICT (layer, term_normalized) DO NOTHING;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE glossary IS 'Quick term definitions for shorthand, aliases, slang, and acronyms';
COMMENT ON COLUMN glossary.term_normalized IS 'Lowercase version for case-insensitive matching';
COMMENT ON COLUMN glossary.term_type IS 'Classification: person, group, acronym, slang, project, shorthand';
COMMENT ON COLUMN glossary.always_expand IS 'If true, always show definition when term is used';
COMMENT ON FUNCTION glossary_lookup IS 'Look up a term and increment usage count';
COMMENT ON FUNCTION glossary_define IS 'Define or update a term';
COMMENT ON FUNCTION glossary_frequent IS 'Get most frequently used terms';
