/**
 * MCP Registry Infrastructure
 *
 * Creates foundational tables for MCP marketplace:
 * - mcp_integrations: Registry of available integrations
 * - user_integrations: User-installed integrations tracking
 * - oauth_tokens: Encrypted OAuth token storage
 *
 * Security:
 * - All tables use RLS
 * - OAuth tokens encrypted at rest using pgcrypto
 * - Users can only access their own integrations/tokens
 * - Admins can manage integration registry
 *
 * Phase: 0.2 - MCP Registry & Integrations
 * Issue: #2
 */

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-----------------------------------------------------------
-- Table: mcp_integrations
-- Purpose: Registry of available MCP integrations (marketplace)
-----------------------------------------------------------

CREATE TABLE mcp_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Integration Identity
  slug TEXT NOT NULL UNIQUE, -- e.g., 'google-calendar', 'slack', 'gmail'
  name TEXT NOT NULL, -- Display name: 'Google Calendar'
  description TEXT,
  category TEXT NOT NULL, -- 'calendar', 'communication', 'crm', 'email'

  -- Connection Configuration
  connection_type TEXT NOT NULL, -- 'oauth2', 'api_key', 'webhook'
  oauth_provider TEXT, -- 'google', 'microsoft', 'slack', null if not OAuth
  oauth_scopes TEXT[], -- Required OAuth scopes
  config_schema JSONB, -- JSON schema for additional config

  -- Marketplace Status
  status TEXT NOT NULL DEFAULT 'disabled', -- 'disabled', 'enabled', 'deprecated'
  approval_required BOOLEAN DEFAULT true, -- Admin must approve before use

  -- Metadata
  icon_url TEXT,
  documentation_url TEXT,
  vendor TEXT, -- 'Google', 'Slack', 'Renubu'
  version TEXT DEFAULT '1.0.0',

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('disabled', 'enabled', 'deprecated')),
  CONSTRAINT valid_connection_type CHECK (connection_type IN ('oauth2', 'api_key', 'webhook'))
);

-- Indexes
CREATE INDEX idx_mcp_integrations_slug ON mcp_integrations(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_mcp_integrations_category ON mcp_integrations(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_mcp_integrations_status ON mcp_integrations(status) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE mcp_integrations ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read enabled integrations
CREATE POLICY "Users can read enabled integrations"
  ON mcp_integrations FOR SELECT
  USING (
    deleted_at IS NULL
    AND status = 'enabled'
    AND auth.role() = 'authenticated'
  );

-- Admins can manage all integrations
CREATE POLICY "Admins can manage integrations"
  ON mcp_integrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-----------------------------------------------------------
-- Table: user_integrations
-- Purpose: Track which users have which integrations installed
-----------------------------------------------------------

CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES mcp_integrations(id) ON DELETE CASCADE,

  -- Installation Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'error', 'revoked'
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  -- Configuration
  config JSONB, -- User-specific configuration

  -- Error Tracking
  error_message TEXT,
  error_count INTEGER DEFAULT 0,
  last_error_at TIMESTAMPTZ,

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'error', 'revoked')),
  CONSTRAINT unique_user_integration UNIQUE(user_id, integration_id)
);

-- Indexes
CREATE INDEX idx_user_integrations_user ON user_integrations(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_integrations_integration ON user_integrations(integration_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_integrations_status ON user_integrations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_integrations_last_used ON user_integrations(last_used_at DESC) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own integrations
CREATE POLICY "Users see own integrations"
  ON user_integrations FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Users can insert their own integrations
CREATE POLICY "Users can install integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own integrations
CREATE POLICY "Users can update own integrations"
  ON user_integrations FOR UPDATE
  USING (user_id = auth.uid());

-- Users can soft-delete their own integrations
CREATE POLICY "Users can remove own integrations"
  ON user_integrations FOR UPDATE
  USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (user_id = auth.uid());

-- Admins can see all integrations
CREATE POLICY "Admins see all user integrations"
  ON user_integrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-----------------------------------------------------------
-- Table: oauth_tokens
-- Purpose: Encrypted storage for OAuth tokens
-----------------------------------------------------------

CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_integration_id UUID NOT NULL REFERENCES user_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Encrypted Tokens (using pgcrypto)
  access_token_encrypted BYTEA NOT NULL,
  refresh_token_encrypted BYTEA,

  -- Token Metadata
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scope TEXT,

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_refreshed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT unique_user_integration_token UNIQUE(user_integration_id)
);

-- Indexes
CREATE INDEX idx_oauth_tokens_user_integration ON oauth_tokens(user_integration_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_oauth_tokens_user ON oauth_tokens(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_oauth_tokens_expires ON oauth_tokens(expires_at) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tokens
CREATE POLICY "Users see own oauth tokens"
  ON oauth_tokens FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Users can insert their own tokens
CREATE POLICY "Users can create own oauth tokens"
  ON oauth_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own tokens (for refresh)
CREATE POLICY "Users can update own oauth tokens"
  ON oauth_tokens FOR UPDATE
  USING (user_id = auth.uid());

-- Users can soft-delete their own tokens
CREATE POLICY "Users can revoke own oauth tokens"
  ON oauth_tokens FOR UPDATE
  USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (user_id = auth.uid());

-----------------------------------------------------------
-- Helper Functions for Token Encryption/Decryption
-----------------------------------------------------------

-- Function to encrypt OAuth tokens
-- Usage: SELECT encrypt_oauth_token('my-secret-token', 'encryption-key')
CREATE OR REPLACE FUNCTION encrypt_oauth_token(
  token TEXT,
  encryption_key TEXT
)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(token, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt OAuth tokens
-- Usage: SELECT decrypt_oauth_token(encrypted_token, 'encryption-key')
CREATE OR REPLACE FUNCTION decrypt_oauth_token(
  encrypted_token BYTEA,
  encryption_key TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_token, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-----------------------------------------------------------
-- Trigger: Auto-update updated_at timestamp
-----------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mcp_integrations_updated_at
  BEFORE UPDATE ON mcp_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-----------------------------------------------------------
-- Seed Data: Initial MCP Integrations
-----------------------------------------------------------

-- Insert Phase 0.2 integrations (disabled by default)
INSERT INTO mcp_integrations (slug, name, description, category, connection_type, oauth_provider, oauth_scopes, status, vendor, approval_required)
VALUES
  (
    'google-calendar',
    'Google Calendar',
    'Sync events, create meetings, and manage calendar availability',
    'calendar',
    'oauth2',
    'google',
    ARRAY['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
    'disabled',
    'Google',
    true
  ),
  (
    'slack',
    'Slack',
    'Send messages, manage channels, and receive notifications',
    'communication',
    'oauth2',
    'slack',
    ARRAY['chat:write', 'channels:read', 'users:read'],
    'disabled',
    'Slack Technologies',
    true
  ),
  (
    'gmail',
    'Gmail',
    'Send emails, read inbox, and manage labels',
    'email',
    'oauth2',
    'google',
    ARRAY['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
    'disabled',
    'Google',
    true
  );

-- Add comments for documentation
COMMENT ON TABLE mcp_integrations IS 'Registry of available MCP integrations in the marketplace';
COMMENT ON TABLE user_integrations IS 'Tracks which users have which integrations installed';
COMMENT ON TABLE oauth_tokens IS 'Encrypted storage for OAuth access and refresh tokens';
COMMENT ON COLUMN oauth_tokens.access_token_encrypted IS 'Access token encrypted using pgcrypto pgp_sym_encrypt';
COMMENT ON COLUMN oauth_tokens.refresh_token_encrypted IS 'Refresh token encrypted using pgcrypto pgp_sym_encrypt';
