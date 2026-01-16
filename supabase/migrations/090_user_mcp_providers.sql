/**
 * User MCP Providers
 *
 * Tracks which MCP providers users have configured for the MCP-native
 * multi-source extraction system. Instead of copying data, we query
 * external sources via MCP at runtime and during dream sequence.
 *
 * Key Design Principles:
 * - Data stays in provider's system (Gong, Fireflies, etc.)
 * - Human OS queries via MCP at runtime
 * - Dream sequence extracts entities/patterns and stores THOSE (not raw data)
 * - Supports incremental sync via extraction_cursor
 */

-- Create enum for provider categories
DO $$ BEGIN
  CREATE TYPE human_os.mcp_provider_category AS ENUM (
    'transcripts',   -- Meeting recordings (Fireflies, Gong, Zoom)
    'email',         -- Email providers (Gmail, Outlook)
    'calendar',      -- Calendar providers (Google Calendar, Outlook)
    'docs',          -- Document providers (Notion, Google Docs)
    'comms',         -- Communication (Slack, Teams)
    'crm',           -- CRM systems (Salesforce, HubSpot)
    'other'          -- Other sources
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for provider status
DO $$ BEGIN
  CREATE TYPE human_os.mcp_provider_status AS ENUM (
    'pending',       -- OAuth not yet completed
    'active',        -- Working and ready to sync
    'error',         -- Connection error
    'paused',        -- User paused sync
    'revoked'        -- User revoked access
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-----------------------------------------------------------
-- Table: user_mcp_providers
-- Purpose: Track which MCP providers each user has configured
-----------------------------------------------------------

CREATE TABLE IF NOT EXISTS human_os.user_mcp_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Provider Identity
  provider_slug TEXT NOT NULL,              -- 'fireflies', 'gong', 'gmail', etc.
  category human_os.mcp_provider_category NOT NULL,
  display_name TEXT,                        -- User-friendly name

  -- MCP Configuration
  mcp_server_url TEXT,                      -- MCP server endpoint (if remote)
  mcp_config JSONB DEFAULT '{}',            -- Provider-specific config

  -- OAuth Reference (if using OAuth)
  -- Links to renubu's oauth_tokens table via user_integration_id
  oauth_integration_slug TEXT,              -- Slug in mcp_integrations table

  -- Status & Sync Tracking
  status human_os.mcp_provider_status NOT NULL DEFAULT 'pending',
  last_queried_at TIMESTAMPTZ,              -- Last runtime query
  last_extraction_at TIMESTAMPTZ,           -- Last dream sequence extraction
  extraction_cursor JSONB DEFAULT '{}',     -- Track incremental sync position

  -- Capabilities
  supports_search BOOLEAN DEFAULT false,     -- Can search across content
  supports_incremental BOOLEAN DEFAULT true, -- Supports cursor-based sync

  -- Error Tracking
  error_message TEXT,
  error_count INTEGER DEFAULT 0,
  last_error_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',              -- Provider-specific metadata

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT unique_user_provider UNIQUE(user_id, provider_slug)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_mcp_providers_user
  ON human_os.user_mcp_providers(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_mcp_providers_category
  ON human_os.user_mcp_providers(category)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_mcp_providers_status
  ON human_os.user_mcp_providers(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_mcp_providers_extraction
  ON human_os.user_mcp_providers(last_extraction_at)
  WHERE deleted_at IS NULL AND status = 'active';

-- RLS Policies
ALTER TABLE human_os.user_mcp_providers ENABLE ROW LEVEL SECURITY;

-- Users can only see their own providers
CREATE POLICY "Users see own mcp providers"
  ON human_os.user_mcp_providers FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Users can insert their own providers
CREATE POLICY "Users can add mcp providers"
  ON human_os.user_mcp_providers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own providers
CREATE POLICY "Users can update own mcp providers"
  ON human_os.user_mcp_providers FOR UPDATE
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Users can soft-delete their own providers
CREATE POLICY "Users can remove own mcp providers"
  ON human_os.user_mcp_providers FOR DELETE
  USING (user_id = auth.uid());

-----------------------------------------------------------
-- Table: mcp_extraction_log
-- Purpose: Track what has been extracted from MCP providers
-----------------------------------------------------------

CREATE TABLE IF NOT EXISTS human_os.mcp_extraction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES human_os.user_mcp_providers(id) ON DELETE CASCADE,

  -- Extraction Details
  extraction_type TEXT NOT NULL,            -- 'dream_sync', 'manual_query', 'initial_sync'
  source_id TEXT,                           -- ID in provider's system (transcript ID, etc.)
  source_type TEXT,                         -- 'transcript', 'email', 'document', etc.
  source_date TIMESTAMPTZ,                  -- When the source was created/modified

  -- Extraction Results
  entities_extracted INTEGER DEFAULT 0,
  patterns_extracted INTEGER DEFAULT 0,
  summary_generated BOOLEAN DEFAULT false,

  -- Processing Metadata
  processing_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_completed_at TIMESTAMPTZ,
  processing_duration_ms INTEGER,

  -- Error Tracking
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying extraction history
CREATE INDEX IF NOT EXISTS idx_mcp_extraction_log_user_provider
  ON human_os.mcp_extraction_log(user_id, provider_id);

CREATE INDEX IF NOT EXISTS idx_mcp_extraction_log_source
  ON human_os.mcp_extraction_log(provider_id, source_id);

-- RLS for extraction log
ALTER TABLE human_os.mcp_extraction_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own extraction log"
  ON human_os.mcp_extraction_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert extraction log"
  ON human_os.mcp_extraction_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-----------------------------------------------------------
-- Seed: Supported MCP Providers Registry
-----------------------------------------------------------

-- Create a registry of supported providers (reference data)
CREATE TABLE IF NOT EXISTS human_os.mcp_provider_registry (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category human_os.mcp_provider_category NOT NULL,
  icon_url TEXT,
  documentation_url TEXT,

  -- OAuth configuration (if applicable)
  requires_oauth BOOLEAN DEFAULT false,
  oauth_provider TEXT,                      -- 'google', 'microsoft', 'slack', etc.
  oauth_scopes TEXT[],

  -- MCP server info
  mcp_server_type TEXT DEFAULT 'remote',    -- 'remote', 'local', 'builtin'
  mcp_server_url_template TEXT,             -- Template for server URL

  -- Feature flags
  supports_search BOOLEAN DEFAULT false,
  supports_incremental BOOLEAN DEFAULT true,
  supports_realtime BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'beta',               -- 'alpha', 'beta', 'stable', 'deprecated'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed supported providers
INSERT INTO human_os.mcp_provider_registry (slug, name, description, category, requires_oauth, oauth_provider, supports_search, status)
VALUES
  ('fireflies', 'Fireflies.ai', 'AI meeting assistant - transcribes and summarizes meetings', 'transcripts', true, 'fireflies', true, 'beta'),
  ('gong', 'Gong', 'Revenue intelligence platform - call recordings and insights', 'transcripts', true, 'gong', true, 'alpha'),
  ('zoom', 'Zoom', 'Video conferencing with recording and transcription', 'transcripts', true, 'zoom', false, 'alpha'),
  ('gmail', 'Gmail', 'Google email service', 'email', true, 'google', true, 'beta'),
  ('google-calendar', 'Google Calendar', 'Google calendar service', 'calendar', true, 'google', false, 'beta'),
  ('notion', 'Notion', 'All-in-one workspace for notes, docs, and collaboration', 'docs', true, 'notion', true, 'alpha'),
  ('slack', 'Slack', 'Team messaging and collaboration platform', 'comms', true, 'slack', true, 'alpha')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Allow all authenticated users to read the registry
ALTER TABLE human_os.mcp_provider_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read provider registry"
  ON human_os.mcp_provider_registry FOR SELECT
  USING (auth.role() = 'authenticated');

-----------------------------------------------------------
-- Triggers
-----------------------------------------------------------

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION human_os.update_mcp_provider_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_mcp_providers_updated_at
  BEFORE UPDATE ON human_os.user_mcp_providers
  FOR EACH ROW
  EXECUTE FUNCTION human_os.update_mcp_provider_updated_at();

-----------------------------------------------------------
-- Comments
-----------------------------------------------------------

COMMENT ON TABLE human_os.user_mcp_providers IS 'Tracks MCP providers configured by each user for multi-source extraction';
COMMENT ON TABLE human_os.mcp_extraction_log IS 'Log of extractions performed from MCP providers during dream sequence';
COMMENT ON TABLE human_os.mcp_provider_registry IS 'Registry of supported MCP providers and their capabilities';
COMMENT ON COLUMN human_os.user_mcp_providers.extraction_cursor IS 'JSON cursor for incremental sync - tracks last processed item ID/timestamp';
