-- GFT Migration: Add regions table and expose schema
-- This adds location/region support and ensures gft schema is accessible via API

-- =============================================================================
-- REGIONS TABLE
-- Geographic regions for contact segmentation (metro areas, states, etc.)
-- =============================================================================
CREATE TABLE IF NOT EXISTS gft.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  state_code TEXT,
  country_code TEXT DEFAULT 'US',
  metro_population INTEGER,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  timezone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add region_id to contacts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'region_id'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN region_id UUID REFERENCES gft.regions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add additional useful columns to contacts that exist in old schema
DO $$
BEGIN
  -- Location raw (original location string)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'location_raw'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN location_raw TEXT;
  END IF;

  -- About/bio
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'about'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN about TEXT;
  END IF;

  -- LinkedIn avatar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'li_avatar_url'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN li_avatar_url TEXT;
  END IF;

  -- LinkedIn member ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'li_member_id'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN li_member_id TEXT;
  END IF;

  -- Birthday
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'birthday'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN birthday DATE;
  END IF;

  -- LinkedIn connection date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'li_date_connected'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN li_date_connected DATE;
  END IF;

  -- LLM notes (AI-generated notes)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'llm_notes'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN llm_notes TEXT;
  END IF;

  -- Status (active, inactive, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'status'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gft_regions_name ON gft.regions(name);
CREATE INDEX IF NOT EXISTS idx_gft_regions_state ON gft.regions(state_code);
CREATE INDEX IF NOT EXISTS idx_gft_contacts_region ON gft.contacts(region_id);

-- Trigger for regions updated_at
DROP TRIGGER IF EXISTS update_gft_regions_updated_at ON gft.regions;
CREATE TRIGGER update_gft_regions_updated_at
  BEFORE UPDATE ON gft.regions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions on regions table
GRANT ALL ON gft.regions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON gft.regions TO authenticated;
GRANT SELECT ON gft.regions TO anon;

-- =============================================================================
-- EXPOSE GFT SCHEMA TO POSTGREST
-- =============================================================================
DO $$
BEGIN
  -- Update the db_schemas setting to include gft
  EXECUTE 'ALTER ROLE authenticator SET pgrst.db_schemas TO ''public,graphql_public,founder_os,gft''';
  -- Notify PostgREST to reload its configuration
  NOTIFY pgrst, 'reload config';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update pgrst.db_schemas: %. Manual configuration may be required in Supabase Dashboard.', SQLERRM;
END $$;

-- Comments
COMMENT ON TABLE gft.regions IS 'Geographic regions for contact segmentation';
COMMENT ON COLUMN gft.regions.name IS 'URL-friendly identifier (e.g., research-triangle)';
COMMENT ON COLUMN gft.regions.display_name IS 'Human-readable name (e.g., Research Triangle, NC)';
COMMENT ON COLUMN gft.regions.metro_population IS 'Approximate metro area population';
