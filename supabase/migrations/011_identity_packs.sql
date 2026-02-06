-- Human OS Migration: Identity Packs
-- Multi-dimensional identity packs (PowerPak + IntelligenceFile merged)

-- =============================================================================
-- IDENTITY PACKS TABLE
-- Stores multi-dimensional identity facets for entities
-- Pack types: professional, interests, social, dating, expertise
-- =============================================================================
CREATE TABLE IF NOT EXISTS identity_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entity this pack belongs to
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,

  -- Pack classification
  pack_type TEXT NOT NULL CHECK (pack_type IN (
    'professional',   -- Work/career identity
    'interests',      -- Hobbies, passions
    'social',         -- Good Hang persona
    'dating',         -- Dating profile
    'expertise',      -- Expert knowledge areas
    'founder'         -- Founder OS identity
  )),

  -- Visibility controls
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN (
    'public',         -- Anyone can see
    'subscribers',    -- PowerPak subscribers only
    'connections',    -- Mutual connections only
    'private'         -- Owner only
  )),

  -- Content
  headline TEXT,              -- One-liner (e.g., "GTM Leader & Whiskey Enthusiast")
  summary TEXT,               -- Longer bio for this facet
  tags TEXT[] DEFAULT '{}',   -- Searchable tags

  -- Structured data varies by pack_type
  metadata JSONB DEFAULT '{}',
  -- Professional: { company, title, years_experience, specialties }
  -- Interests: { hobbies: [], collections: [], activities: [] }
  -- Expertise: { topics: [], credentials: [], publications: [] }

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One pack per type per entity
  UNIQUE(entity_id, pack_type)
);

-- Indexes for pack queries
CREATE INDEX IF NOT EXISTS idx_identity_packs_entity ON identity_packs(entity_id);
CREATE INDEX IF NOT EXISTS idx_identity_packs_type ON identity_packs(pack_type);
CREATE INDEX IF NOT EXISTS idx_identity_packs_visibility ON identity_packs(visibility);
CREATE INDEX IF NOT EXISTS idx_identity_packs_tags ON identity_packs USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_identity_packs_metadata ON identity_packs USING GIN (metadata);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_identity_packs_updated_at ON identity_packs;
CREATE TRIGGER update_identity_packs_updated_at
  BEFORE UPDATE ON identity_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- USER PREFERENCES TABLE
-- Dynamic key-value storage for user settings and state
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User this preference belongs to
  user_id UUID NOT NULL,  -- References human_os.users or auth.users

  -- Key-value storage
  key TEXT NOT NULL,              -- e.g., 'project_weights', 'voice_settings', 'dashboard_layout'
  value JSONB NOT NULL,           -- JSON value for flexibility
  -- Examples:
  -- { key: "project_weights", value: { renubu: 40, founder_os: 40, good_hang: 20 } }
  -- { key: "energy_level", value: "medium" }
  -- { key: "active_mode", value: "strategic" }

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One value per key per user
  UNIQUE(user_id, key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(key);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE identity_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Identity packs: public packs are readable by anyone
DROP POLICY IF EXISTS "identity_packs_public_read" ON identity_packs;
CREATE POLICY "identity_packs_public_read" ON identity_packs
  FOR SELECT
  USING (visibility = 'public');

-- Identity packs: owners can do anything
DROP POLICY IF EXISTS "identity_packs_owner_all" ON identity_packs;
CREATE POLICY "identity_packs_owner_all" ON identity_packs
  FOR ALL
  USING (
    entity_id IN (
      SELECT id FROM entities WHERE owner_id = auth.uid()
    )
  );

-- User preferences: users can only access their own
DROP POLICY IF EXISTS "user_preferences_owner_all" ON user_preferences;
CREATE POLICY "user_preferences_owner_all" ON user_preferences
  FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE identity_packs IS 'Multi-dimensional identity facets for PowerPak discovery';
COMMENT ON COLUMN identity_packs.pack_type IS 'Type: professional, interests, social, dating, expertise, founder';
COMMENT ON COLUMN identity_packs.visibility IS 'Who can see: public, subscribers, connections, private';
COMMENT ON COLUMN identity_packs.tags IS 'Searchable tags for discovery';
COMMENT ON TABLE user_preferences IS 'Dynamic key-value storage for user settings';
COMMENT ON COLUMN user_preferences.key IS 'Preference key: project_weights, energy_level, active_mode, etc.';
