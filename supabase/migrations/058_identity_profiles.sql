-- 058_identity_profiles.sql
-- Identity Pack - foundational identity layer from The Sculptor conversation
-- Portable across all Human OS products

-- =============================================================================
-- IDENTITY PROFILES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS human_os.identity_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES human_os.users(id) ON DELETE CASCADE,

  -- Core Identity (from The Sculptor)
  core_values TEXT[] DEFAULT '{}',           -- 3-5 core values, e.g., ['autonomy', 'authenticity', 'joy']
  energy_patterns TEXT,                       -- "night owl, burst worker, needs variety"
  communication_style TEXT,                   -- "direct, warm, uses humor to disarm"
  interest_vectors TEXT[] DEFAULT '{}',       -- "tech, performing arts, systems thinking"
  relationship_orientation TEXT,              -- "deep over wide, allergic to small talk"
  work_style TEXT,                            -- "sprinter not marathoner, needs deadlines"
  cognitive_profile TEXT,                     -- "ADHD+PDA patterns, high novelty-seeking"

  -- The Sculptor conversation reference
  sculptor_conversation_id UUID,              -- Link to transcript if we stored it
  sculptor_completed_at TIMESTAMPTZ,          -- When identity work was done

  -- Annual Theme (lives here, not separate table)
  annual_theme TEXT,                          -- "Sustainable founder"
  annual_theme_year INTEGER,                  -- 2026
  annual_theme_context TEXT,                  -- Why this theme, grounded in identity
  theme_history JSONB DEFAULT '[]',           -- [{year: 2025, theme: "...", context: "..."}]

  -- Metadata
  layer TEXT NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)  -- One identity profile per user
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_identity_profiles_user ON human_os.identity_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_profiles_layer ON human_os.identity_profiles(layer);
CREATE INDEX IF NOT EXISTS idx_identity_profiles_theme_year ON human_os.identity_profiles(annual_theme_year);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER identity_profiles_updated_at
  BEFORE UPDATE ON human_os.identity_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE human_os.identity_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "identity_profiles_service_all" ON human_os.identity_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "identity_profiles_owner_select" ON human_os.identity_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR layer = 'public');

CREATE POLICY "identity_profiles_owner_update" ON human_os.identity_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON human_os.identity_profiles TO authenticated;
GRANT ALL ON human_os.identity_profiles TO service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE human_os.identity_profiles IS
  'Foundational identity layer from The Sculptor conversation. Portable across all Human OS products.';
COMMENT ON COLUMN human_os.identity_profiles.core_values IS
  '3-5 core values that drive decision-making, e.g., autonomy, authenticity, joy';
COMMENT ON COLUMN human_os.identity_profiles.energy_patterns IS
  'When/how energy flows - night owl, burst worker, needs variety, etc.';
COMMENT ON COLUMN human_os.identity_profiles.cognitive_profile IS
  'Neurodivergent patterns if applicable - ADHD, PDA, etc.';
COMMENT ON COLUMN human_os.identity_profiles.annual_theme IS
  'Current year identity-aligned direction - "Who am I becoming this year?"';
COMMENT ON COLUMN human_os.identity_profiles.theme_history IS
  'Past annual themes for reflection and pattern recognition';
