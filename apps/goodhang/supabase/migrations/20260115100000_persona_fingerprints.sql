-- Persona Fingerprints
-- 8-dimension personality scoring for NPC configuration
-- NPC reflects user's own personality dimensions

-- ============================================================================
-- CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS human_os.persona_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES human_os.users(id) ON DELETE CASCADE,
  entity_slug TEXT NOT NULL,

  -- 8 personality dimensions (0-10 scale)
  self_deprecation INT CHECK (self_deprecation BETWEEN 0 AND 10),
  directness INT CHECK (directness BETWEEN 0 AND 10),
  warmth INT CHECK (warmth BETWEEN 0 AND 10),
  intellectual_signaling INT CHECK (intellectual_signaling BETWEEN 0 AND 10),
  comfort_with_sincerity INT CHECK (comfort_with_sincerity BETWEEN 0 AND 10),
  absurdism_tolerance INT CHECK (absurdism_tolerance BETWEEN 0 AND 10),
  format_awareness INT CHECK (format_awareness BETWEEN 0 AND 10),
  vulnerability_as_tool INT CHECK (vulnerability_as_tool BETWEEN 0 AND 10),

  -- Metadata
  source TEXT NOT NULL DEFAULT 'sculptor', -- sculptor, dream, manual, assessment
  confidence DECIMAL(3,2) DEFAULT 0.70 CHECK (confidence BETWEEN 0 AND 1),
  reasoning JSONB DEFAULT '{}', -- Explanation for each dimension score

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One fingerprint per user (latest wins)
  UNIQUE(user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_persona_fingerprints_entity_slug
  ON human_os.persona_fingerprints(entity_slug);

CREATE INDEX IF NOT EXISTS idx_persona_fingerprints_source
  ON human_os.persona_fingerprints(source);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE human_os.persona_fingerprints ENABLE ROW LEVEL SECURITY;

-- Users can read their own fingerprint
CREATE POLICY "Users can read own fingerprint"
  ON human_os.persona_fingerprints FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own fingerprint
CREATE POLICY "Users can update own fingerprint"
  ON human_os.persona_fingerprints FOR UPDATE
  USING (user_id = auth.uid());

-- Service role can do everything
CREATE POLICY "Service role full access"
  ON human_os.persona_fingerprints FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE human_os.persona_fingerprints IS
'8-dimension personality fingerprint for NPC configuration. NPC mirrors user personality.';

COMMENT ON COLUMN human_os.persona_fingerprints.self_deprecation IS
'Makes fun of themselves first (0 = never, 10 = frequently)';

COMMENT ON COLUMN human_os.persona_fingerprints.directness IS
'How blunt vs diplomatic (0 = very diplomatic, 10 = very direct)';

COMMENT ON COLUMN human_os.persona_fingerprints.warmth IS
'Emotional temperature (0 = cold/distant, 10 = very warm)';

COMMENT ON COLUMN human_os.persona_fingerprints.intellectual_signaling IS
'Leads with intelligence (0 = never, 10 = frequently)';

COMMENT ON COLUMN human_os.persona_fingerprints.comfort_with_sincerity IS
'Can be genuine without awkwardness (0 = uncomfortable, 10 = very comfortable)';

COMMENT ON COLUMN human_os.persona_fingerprints.absurdism_tolerance IS
'Comfort with weird/playful tangents (0 = dislikes, 10 = embraces)';

COMMENT ON COLUMN human_os.persona_fingerprints.format_awareness IS
'Are they meta about the interaction (0 = not at all, 10 = very meta)';

COMMENT ON COLUMN human_os.persona_fingerprints.vulnerability_as_tool IS
'Uses own weakness to connect (0 = never, 10 = frequently)';

-- ============================================================================
-- FUNCTION: Get fingerprint with defaults
-- ============================================================================

CREATE OR REPLACE FUNCTION human_os.get_persona_fingerprint(p_user_id UUID)
RETURNS human_os.persona_fingerprints AS $$
DECLARE
  result human_os.persona_fingerprints;
BEGIN
  SELECT * INTO result
  FROM human_os.persona_fingerprints
  WHERE user_id = p_user_id;

  -- Return with defaults if not found
  IF result IS NULL THEN
    result.user_id := p_user_id;
    result.entity_slug := p_user_id::TEXT;
    result.self_deprecation := 5;
    result.directness := 5;
    result.warmth := 5;
    result.intellectual_signaling := 5;
    result.comfort_with_sincerity := 5;
    result.absurdism_tolerance := 5;
    result.format_awareness := 5;
    result.vulnerability_as_tool := 5;
    result.source := 'default';
    result.confidence := 0.0;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Update timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION human_os.update_persona_fingerprint_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_persona_fingerprint_timestamp ON human_os.persona_fingerprints;
CREATE TRIGGER update_persona_fingerprint_timestamp
  BEFORE UPDATE ON human_os.persona_fingerprints
  FOR EACH ROW
  EXECUTE FUNCTION human_os.update_persona_fingerprint_timestamp();
