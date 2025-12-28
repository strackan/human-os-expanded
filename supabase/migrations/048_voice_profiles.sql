-- ============================================
-- VOICE PROFILES SCHEMA
-- VoiceOS: Voice profile synthesis system
-- Based on "10 Commandments" architecture
-- ============================================

-- =============================================================================
-- COMMANDMENT TYPE ENUM
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE human_os.commandment_type AS ENUM (
    'THEMES',        -- Core topics and beliefs
    'VOICE',         -- Speech patterns, sentence structure, vocabulary
    'GUARDRAILS',    -- Hard limits, never-say rules
    'STORIES',       -- Extended narratives and case studies
    'ANECDOTES',     -- Short memorable examples
    'OPENINGS',      -- How to start content
    'MIDDLES',       -- How to structure arguments
    'ENDINGS',       -- How to close and CTA patterns
    'BLENDS',        -- Content archetypes and templates
    'EXAMPLES'       -- Reference outputs for calibration
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- VOICE PROFILES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS human_os.voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  entity_slug TEXT NOT NULL,                    -- e.g., "scott-leese", "justin"
  display_name TEXT NOT NULL,                   -- e.g., "Scott Leese"
  description TEXT,                             -- Brief bio or context

  -- Privacy scope
  layer TEXT NOT NULL DEFAULT 'public',         -- public, founder:*, powerpak:*

  -- Source hierarchy for synthesis
  source_hierarchy JSONB DEFAULT '{
    "primary": [],
    "secondary": [],
    "historical": []
  }'::jsonb,

  -- Synthesis status (0-100, % of commandments present)
  completeness INTEGER DEFAULT 0 CHECK (completeness >= 0 AND completeness <= 100),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique entity per layer
  UNIQUE(entity_slug, layer)
);

-- =============================================================================
-- VOICE COMMANDMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS human_os.voice_commandments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Profile reference
  profile_id UUID NOT NULL REFERENCES human_os.voice_profiles(id) ON DELETE CASCADE,

  -- Commandment identity
  commandment_type human_os.commandment_type NOT NULL,

  -- Content
  frontmatter JSONB NOT NULL DEFAULT '{}'::jsonb,   -- title, entity, version, dates
  content TEXT NOT NULL,                             -- Full markdown body

  -- Versioning
  version TEXT DEFAULT '1.0',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One commandment per type per profile
  UNIQUE(profile_id, commandment_type)
);

-- =============================================================================
-- VOICE INPUT SOURCES TABLE
-- Tracks source material used for synthesis
-- =============================================================================

CREATE TABLE IF NOT EXISTS human_os.voice_input_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Profile reference
  profile_id UUID NOT NULL REFERENCES human_os.voice_profiles(id) ON DELETE CASCADE,

  -- Source info
  filename TEXT NOT NULL,
  source_type TEXT NOT NULL,                    -- podcast, interview, newsletter, linkedin_post
  date_range TEXT,                              -- e.g., "2024-2025", "2019-12"
  tier TEXT DEFAULT 'primary',                  -- primary, secondary, historical

  -- Content
  content TEXT,                                 -- Raw source content
  summary TEXT,                                 -- AI-generated summary
  word_count INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(profile_id, filename)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Voice profiles indexes
CREATE INDEX IF NOT EXISTS idx_voice_profiles_entity ON human_os.voice_profiles(entity_slug);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_layer ON human_os.voice_profiles(layer);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_completeness ON human_os.voice_profiles(completeness DESC);

-- Voice commandments indexes
CREATE INDEX IF NOT EXISTS idx_voice_commandments_profile ON human_os.voice_commandments(profile_id);
CREATE INDEX IF NOT EXISTS idx_voice_commandments_type ON human_os.voice_commandments(commandment_type);

-- Voice input sources indexes
CREATE INDEX IF NOT EXISTS idx_voice_input_sources_profile ON human_os.voice_input_sources(profile_id);
CREATE INDEX IF NOT EXISTS idx_voice_input_sources_tier ON human_os.voice_input_sources(tier);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update updated_at on voice_profiles
CREATE TRIGGER update_voice_profiles_updated_at
  BEFORE UPDATE ON human_os.voice_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at on voice_commandments
CREATE TRIGGER update_voice_commandments_updated_at
  BEFORE UPDATE ON human_os.voice_commandments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at on voice_input_sources
CREATE TRIGGER update_voice_input_sources_updated_at
  BEFORE UPDATE ON human_os.voice_input_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Get profile with all commandments
CREATE OR REPLACE FUNCTION human_os.get_voice_profile_full(
  p_entity_slug TEXT,
  p_layer TEXT DEFAULT 'public'
) RETURNS TABLE (
  profile_id UUID,
  entity_slug TEXT,
  display_name TEXT,
  description TEXT,
  layer TEXT,
  completeness INTEGER,
  commandments JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as profile_id,
    p.entity_slug,
    p.display_name,
    p.description,
    p.layer,
    p.completeness,
    COALESCE(
      jsonb_object_agg(c.commandment_type, jsonb_build_object(
        'id', c.id,
        'version', c.version,
        'content', c.content,
        'frontmatter', c.frontmatter,
        'updated_at', c.updated_at
      )) FILTER (WHERE c.id IS NOT NULL),
      '{}'::jsonb
    ) as commandments
  FROM human_os.voice_profiles p
  LEFT JOIN human_os.voice_commandments c ON c.profile_id = p.id
  WHERE p.entity_slug = p_entity_slug
    AND (p.layer = 'public' OR p.layer = p_layer)
  GROUP BY p.id;
END;
$$;

-- List available voice profiles
CREATE OR REPLACE FUNCTION human_os.list_voice_profiles(
  p_layer TEXT DEFAULT 'public'
) RETURNS TABLE (
  id UUID,
  entity_slug TEXT,
  display_name TEXT,
  description TEXT,
  layer TEXT,
  completeness INTEGER,
  commandment_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.entity_slug,
    p.display_name,
    p.description,
    p.layer,
    p.completeness,
    COUNT(c.id) as commandment_count
  FROM human_os.voice_profiles p
  LEFT JOIN human_os.voice_commandments c ON c.profile_id = p.id
  WHERE p.layer = 'public' OR p.layer = p_layer
  GROUP BY p.id
  ORDER BY p.display_name;
END;
$$;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE human_os.voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_os.voice_commandments ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_os.voice_input_sources ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "voice_profiles_service_all" ON human_os.voice_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "voice_commandments_service_all" ON human_os.voice_commandments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "voice_input_sources_service_all" ON human_os.voice_input_sources
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read public and their layer's profiles
CREATE POLICY "voice_profiles_read_policy" ON human_os.voice_profiles
  FOR SELECT TO authenticated
  USING (layer = 'public' OR layer LIKE 'founder:%' OR layer LIKE 'powerpak:%');

CREATE POLICY "voice_commandments_read_policy" ON human_os.voice_commandments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM human_os.voice_profiles p
      WHERE p.id = profile_id
      AND (p.layer = 'public' OR p.layer LIKE 'founder:%' OR p.layer LIKE 'powerpak:%')
    )
  );

CREATE POLICY "voice_input_sources_read_policy" ON human_os.voice_input_sources
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM human_os.voice_profiles p
      WHERE p.id = profile_id
      AND (p.layer = 'public' OR p.layer LIKE 'founder:%' OR p.layer LIKE 'powerpak:%')
    )
  );

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON human_os.voice_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON human_os.voice_commandments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON human_os.voice_input_sources TO authenticated;

GRANT EXECUTE ON FUNCTION human_os.get_voice_profile_full TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.list_voice_profiles TO authenticated, service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE human_os.voice_profiles IS 'Voice profiles for AI content generation in a specific person''s voice';
COMMENT ON COLUMN human_os.voice_profiles.entity_slug IS 'URL-friendly identifier (e.g., scott-leese, justin)';
COMMENT ON COLUMN human_os.voice_profiles.completeness IS 'Percentage of 10 commandments present (0-100)';
COMMENT ON COLUMN human_os.voice_profiles.source_hierarchy IS 'Prioritization of source material by recency';

COMMENT ON TABLE human_os.voice_commandments IS 'Individual commandment files for a voice profile';
COMMENT ON COLUMN human_os.voice_commandments.commandment_type IS 'One of the 10 commandment types';
COMMENT ON COLUMN human_os.voice_commandments.frontmatter IS 'YAML frontmatter metadata (title, version, dates)';
COMMENT ON COLUMN human_os.voice_commandments.content IS 'Markdown body of the commandment file';

COMMENT ON TABLE human_os.voice_input_sources IS 'Source material used to synthesize voice profiles';
COMMENT ON COLUMN human_os.voice_input_sources.tier IS 'Priority tier: primary (current), secondary, historical';

COMMENT ON FUNCTION human_os.get_voice_profile_full IS 'Get complete voice profile with all commandments as JSON';
COMMENT ON FUNCTION human_os.list_voice_profiles IS 'List available voice profiles with commandment counts';
