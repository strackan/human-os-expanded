-- ============================================
-- JOURNAL SCHEMA
-- Shared journaling tables used by founder-os, renubu, etc.
-- Includes Plutchik-based mood tracking and entity linking
-- ============================================

-- =============================================================================
-- MOOD DEFINITIONS (Plutchik 8-dimension base)
-- =============================================================================
CREATE TABLE IF NOT EXISTS mood_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  -- Plutchik 8 dimensions (0-10 scale)
  joy_rating INTEGER DEFAULT 0 CHECK (joy_rating >= 0 AND joy_rating <= 10),
  trust_rating INTEGER DEFAULT 0 CHECK (trust_rating >= 0 AND trust_rating <= 10),
  fear_rating INTEGER DEFAULT 0 CHECK (fear_rating >= 0 AND fear_rating <= 10),
  surprise_rating INTEGER DEFAULT 0 CHECK (surprise_rating >= 0 AND surprise_rating <= 10),
  sadness_rating INTEGER DEFAULT 0 CHECK (sadness_rating >= 0 AND sadness_rating <= 10),
  anticipation_rating INTEGER DEFAULT 0 CHECK (anticipation_rating >= 0 AND anticipation_rating <= 10),
  anger_rating INTEGER DEFAULT 0 CHECK (anger_rating >= 0 AND anger_rating <= 10),
  disgust_rating INTEGER DEFAULT 0 CHECK (disgust_rating >= 0 AND disgust_rating <= 10),
  -- Additional mood properties
  intensity INTEGER DEFAULT 5 CHECK (intensity >= 1 AND intensity <= 10),
  arousal_level INTEGER DEFAULT 5 CHECK (arousal_level >= 1 AND arousal_level <= 10),
  valence INTEGER DEFAULT 5 CHECK (valence >= 1 AND valence <= 10),
  dominance INTEGER DEFAULT 5 CHECK (dominance >= 1 AND dominance <= 10),
  -- Categorization
  category TEXT,
  color_hex TEXT DEFAULT '#6B7280',
  is_core BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- JOURNAL ENTRIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Ownership
  owner_id UUID NOT NULL,
  tenant_id UUID,
  layer TEXT NOT NULL,
  -- Content
  title TEXT,
  content TEXT NOT NULL,
  content_html TEXT,
  -- Entry metadata
  entry_type TEXT DEFAULT 'freeform' CHECK (entry_type IN ('freeform', 'gratitude', 'mood_check', 'mindfulness', 'reflection', 'daily_review')),
  mode TEXT,
  -- Mood summary (computed from journal_entry_moods)
  primary_mood_id UUID REFERENCES mood_definitions(id),
  mood_intensity INTEGER CHECK (mood_intensity >= 1 AND mood_intensity <= 10),
  valence INTEGER CHECK (valence >= 1 AND valence <= 10),
  -- AI analysis
  ai_summary TEXT,
  ai_insights JSONB DEFAULT '[]',
  extracted_themes TEXT[] DEFAULT '{}',
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_private BOOLEAN DEFAULT true,
  -- Timestamps
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for journal_entries
CREATE INDEX IF NOT EXISTS idx_journal_entries_owner ON journal_entries(owner_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant ON journal_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_layer ON journal_entries(layer);
CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_date ON journal_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_type ON journal_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_mode ON journal_entries(mode);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_primary_mood ON journal_entries(primary_mood_id);

-- =============================================================================
-- JOURNAL ENTRY MOODS (M:N relationship with mood_definitions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS journal_entry_moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  mood_id UUID NOT NULL REFERENCES mood_definitions(id) ON DELETE CASCADE,
  intensity INTEGER DEFAULT 5 CHECK (intensity >= 1 AND intensity <= 10),
  is_primary BOOLEAN DEFAULT false,
  context_snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entry_id, mood_id)
);

CREATE INDEX IF NOT EXISTS idx_journal_entry_moods_entry ON journal_entry_moods(entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_moods_mood ON journal_entry_moods(mood_id);

-- =============================================================================
-- JOURNAL ENTITY MENTIONS
-- Links journal entries to entities (people, companies, projects)
-- =============================================================================
CREATE TABLE IF NOT EXISTS journal_entity_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  mention_text TEXT NOT NULL,
  mention_type TEXT DEFAULT 'explicit' CHECK (mention_type IN ('explicit', 'inferred')),
  context_snippet TEXT,
  relationship_type TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'concerned', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entry_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_journal_entity_mentions_entry ON journal_entity_mentions(entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entity_mentions_entity ON journal_entity_mentions(entity_id);

-- =============================================================================
-- JOURNAL LEADS (Unresolved entity mentions)
-- When entity not found, create a lead for follow-up
-- =============================================================================
CREATE TABLE IF NOT EXISTS journal_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  -- Lead info (what we know)
  name TEXT NOT NULL,
  mention_context TEXT,
  inferred_relationship TEXT DEFAULT 'unknown' CHECK (inferred_relationship IN ('family', 'colleague', 'friend', 'business', 'unknown')),
  -- Resolution status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  resolved_entity_id UUID,
  -- Action items
  action_required TEXT DEFAULT 'gather_details',
  notes TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_journal_leads_owner ON journal_leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_journal_leads_status ON journal_leads(status);
CREATE INDEX IF NOT EXISTS idx_journal_leads_entry ON journal_leads(entry_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_mood_definitions_updated_at ON mood_definitions;
CREATE TRIGGER update_mood_definitions_updated_at BEFORE UPDATE ON mood_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entity_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_definitions ENABLE ROW LEVEL SECURITY;

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access journal_entries" ON journal_entries;
CREATE POLICY "Service role full access journal_entries" ON journal_entries
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access journal_entry_moods" ON journal_entry_moods;
CREATE POLICY "Service role full access journal_entry_moods" ON journal_entry_moods
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access journal_entity_mentions" ON journal_entity_mentions;
CREATE POLICY "Service role full access journal_entity_mentions" ON journal_entity_mentions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access journal_leads" ON journal_leads;
CREATE POLICY "Service role full access journal_leads" ON journal_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access mood_definitions" ON mood_definitions;
CREATE POLICY "Service role full access mood_definitions" ON mood_definitions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Mood definitions are readable by all authenticated users
DROP POLICY IF EXISTS "Authenticated read mood definitions" ON mood_definitions;
CREATE POLICY "Authenticated read mood definitions" ON mood_definitions
  FOR SELECT TO authenticated USING (true);

-- =============================================================================
-- GRANTS
-- =============================================================================
GRANT ALL ON journal_entries TO service_role;
GRANT ALL ON journal_entry_moods TO service_role;
GRANT ALL ON journal_entity_mentions TO service_role;
GRANT ALL ON journal_leads TO service_role;
GRANT ALL ON mood_definitions TO service_role;
GRANT SELECT ON mood_definitions TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE journal_entries IS 'Journal entries with mood tracking and entity linking';
COMMENT ON TABLE mood_definitions IS 'Plutchik-based mood definitions with 8 emotional dimensions';
COMMENT ON TABLE journal_entry_moods IS 'Many-to-many relationship between entries and moods';
COMMENT ON TABLE journal_entity_mentions IS 'Entities mentioned in journal entries';
COMMENT ON TABLE journal_leads IS 'Unresolved entity mentions for follow-up';

COMMENT ON COLUMN mood_definitions.joy_rating IS 'Plutchik joy dimension (0-10)';
COMMENT ON COLUMN mood_definitions.trust_rating IS 'Plutchik trust dimension (0-10)';
COMMENT ON COLUMN mood_definitions.fear_rating IS 'Plutchik fear dimension (0-10)';
COMMENT ON COLUMN mood_definitions.surprise_rating IS 'Plutchik surprise dimension (0-10)';
COMMENT ON COLUMN mood_definitions.sadness_rating IS 'Plutchik sadness dimension (0-10)';
COMMENT ON COLUMN mood_definitions.anticipation_rating IS 'Plutchik anticipation dimension (0-10)';
COMMENT ON COLUMN mood_definitions.anger_rating IS 'Plutchik anger dimension (0-10)';
COMMENT ON COLUMN mood_definitions.disgust_rating IS 'Plutchik disgust dimension (0-10)';
COMMENT ON COLUMN mood_definitions.valence IS 'Positive/negative scale (1=negative, 10=positive)';
COMMENT ON COLUMN mood_definitions.arousal_level IS 'Calm/activated scale (1=calm, 10=activated)';
COMMENT ON COLUMN mood_definitions.dominance IS 'Submissive/dominant scale (1=submissive, 10=dominant)';
