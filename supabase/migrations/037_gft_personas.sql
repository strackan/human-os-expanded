-- GFT Migration: Add personas table and region assignment function

-- =============================================================================
-- PERSONAS TABLE
-- Ideal Customer Profile (ICP) definitions for contact targeting
-- =============================================================================
CREATE TABLE IF NOT EXISTS gft.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_name TEXT NOT NULL,
  persona_slug TEXT NOT NULL UNIQUE,
  search_keywords TEXT[],
  job_title_patterns TEXT[],
  description TEXT,
  seniority_level TEXT,
  typical_departments TEXT[],
  connection_message_template TEXT,
  follow_up_template TEXT,
  pain_points TEXT[],
  value_propositions TEXT[],
  expected_skills TEXT[],
  common_interests TEXT[],
  typical_responsibilities TEXT[],
  ai_messaging_prompt TEXT,
  ai_skills_file_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add persona_id to contacts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'persona_id'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES gft.personas(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'persona_match_confidence'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS persona_match_confidence DECIMAL(3,2);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gft_personas_slug ON gft.personas(persona_slug);
CREATE INDEX IF NOT EXISTS idx_gft_personas_active ON gft.personas(is_active);
CREATE INDEX IF NOT EXISTS idx_gft_contacts_persona ON gft.contacts(persona_id);

-- Trigger for personas updated_at
DROP TRIGGER IF EXISTS update_gft_personas_updated_at ON gft.personas;
CREATE TRIGGER update_gft_personas_updated_at
  BEFORE UPDATE ON gft.personas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON gft.personas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON gft.personas TO authenticated;
GRANT SELECT ON gft.personas TO anon;

-- =============================================================================
-- REGION ASSIGNMENT FUNCTION
-- Maps location strings to regions based on city/state patterns
-- =============================================================================
CREATE OR REPLACE FUNCTION gft.assign_region_to_contact(
  p_location TEXT
) RETURNS UUID AS $$
DECLARE
  v_region_id UUID;
  v_location_lower TEXT;
BEGIN
  IF p_location IS NULL OR p_location = '' THEN
    RETURN NULL;
  END IF;

  v_location_lower := LOWER(p_location);

  -- Research Triangle, NC patterns
  IF v_location_lower ~ '(raleigh|durham|chapel hill|cary|morrisville|apex|wake forest|holly springs|research triangle|rtp)'
     AND v_location_lower ~ '(north carolina|nc|, nc)' THEN
    SELECT id INTO v_region_id FROM gft.regions WHERE name = 'research-triangle';
    RETURN v_region_id;
  END IF;

  -- San Francisco Bay Area patterns
  IF v_location_lower ~ '(san francisco|oakland|berkeley|palo alto|mountain view|sunnyvale|san jose|fremont|san mateo|menlo park|redwood city|south bay|east bay|silicon valley)'
     AND v_location_lower ~ '(california|ca|, ca|bay area)' THEN
    SELECT id INTO v_region_id FROM gft.regions WHERE name = 'sf-bay-area';
    RETURN v_region_id;
  END IF;

  -- New York Metro patterns
  IF v_location_lower ~ '(new york|manhattan|brooklyn|queens|bronx|staten island|jersey city|hoboken|newark|white plains|stamford)'
     AND v_location_lower ~ '(new york|ny|, ny|new jersey|nj|connecticut|ct)' THEN
    SELECT id INTO v_region_id FROM gft.regions WHERE name = 'nyc-metro';
    RETURN v_region_id;
  END IF;

  -- Los Angeles Metro patterns
  IF v_location_lower ~ '(los angeles|santa monica|beverly hills|pasadena|long beach|burbank|glendale|anaheim|irvine|orange county)'
     AND v_location_lower ~ '(california|ca|, ca)' THEN
    SELECT id INTO v_region_id FROM gft.regions WHERE name = 'la-metro';
    RETURN v_region_id;
  END IF;

  -- Chicago Metro patterns
  IF v_location_lower ~ '(chicago|evanston|oak park|naperville|schaumburg|aurora|waukegan)'
     AND v_location_lower ~ '(illinois|il|, il)' THEN
    SELECT id INTO v_region_id FROM gft.regions WHERE name = 'chicago-metro';
    RETURN v_region_id;
  END IF;

  -- Boston Metro patterns
  IF v_location_lower ~ '(boston|cambridge|somerville|brookline|newton|quincy|worcester|providence)'
     AND v_location_lower ~ '(massachusetts|ma|, ma|rhode island|ri)' THEN
    SELECT id INTO v_region_id FROM gft.regions WHERE name = 'boston-metro';
    RETURN v_region_id;
  END IF;

  -- Seattle Metro patterns
  IF v_location_lower ~ '(seattle|bellevue|redmond|kirkland|tacoma|everett|olympia)'
     AND v_location_lower ~ '(washington|wa|, wa)' THEN
    SELECT id INTO v_region_id FROM gft.regions WHERE name = 'seattle-metro';
    RETURN v_region_id;
  END IF;

  -- Austin Metro patterns
  IF v_location_lower ~ '(austin|round rock|cedar park|pflugerville|georgetown|san marcos)'
     AND v_location_lower ~ '(texas|tx|, tx)' THEN
    SELECT id INTO v_region_id FROM gft.regions WHERE name = 'austin-metro';
    RETURN v_region_id;
  END IF;

  -- Nashville Metro patterns
  IF v_location_lower ~ '(nashville|franklin|murfreesboro|brentwood|hendersonville)'
     AND v_location_lower ~ '(tennessee|tn|, tn)' THEN
    SELECT id INTO v_region_id FROM gft.regions WHERE name = 'nashville-metro';
    RETURN v_region_id;
  END IF;

  -- Remote/Distributed patterns
  IF v_location_lower ~ '(remote|distributed|anywhere|worldwide|global)' THEN
    SELECT id INTO v_region_id FROM gft.regions WHERE name = 'remote';
    RETURN v_region_id;
  END IF;

  RETURN NULL; -- No match found
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGER TO AUTO-ASSIGN REGION ON CONTACT INSERT/UPDATE
-- =============================================================================
CREATE OR REPLACE FUNCTION gft.trigger_assign_contact_region()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if region_id is null and location exists
  IF NEW.region_id IS NULL AND NEW.location IS NOT NULL THEN
    NEW.region_id := gft.assign_region_to_contact(NEW.location);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_contact_region ON gft.contacts;
CREATE TRIGGER trg_assign_contact_region
  BEFORE INSERT OR UPDATE OF location ON gft.contacts
  FOR EACH ROW
  EXECUTE FUNCTION gft.trigger_assign_contact_region();

-- Grant execute on function
GRANT EXECUTE ON FUNCTION gft.assign_region_to_contact(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION gft.trigger_assign_contact_region() TO authenticated, service_role;

-- Comments
COMMENT ON TABLE gft.personas IS 'Ideal Customer Profile definitions for targeting';
COMMENT ON FUNCTION gft.assign_region_to_contact IS 'Maps location strings to regions based on city/state patterns';
COMMENT ON FUNCTION gft.trigger_assign_contact_region IS 'Auto-assigns region to contacts on insert/update';
