-- Human OS Migration: Row Level Security Policies
-- Enforces privacy model at the database layer

-- =============================================================================
-- USER TENANTS TABLE (Required for tenant policies)
-- Junction table linking users to their tenants
-- Must be created BEFORE policies that reference it
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_tenants (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_user_tenants_user ON user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant ON user_tenants(tenant_id);

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ENTITIES POLICIES
-- =============================================================================

-- Public entities are readable by anyone
DROP POLICY IF EXISTS "entities_public_read" ON entities;
CREATE POLICY "entities_public_read" ON entities
  FOR SELECT
  USING (privacy_scope = 'public');

-- Users can read their own entities
DROP POLICY IF EXISTS "entities_owner_read" ON entities;
CREATE POLICY "entities_owner_read" ON entities
  FOR SELECT
  USING (owner_id = auth.uid());

-- Users can read tenant entities if they belong to the tenant
-- Note: This requires a user_tenants junction table or tenant_id in auth.users
DROP POLICY IF EXISTS "entities_tenant_read" ON entities;
CREATE POLICY "entities_tenant_read" ON entities
  FOR SELECT
  USING (
    privacy_scope = 'tenant'
    AND tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own entities
DROP POLICY IF EXISTS "entities_owner_insert" ON entities;
CREATE POLICY "entities_owner_insert" ON entities
  FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR owner_id IS NULL);

-- Users can update their own entities
DROP POLICY IF EXISTS "entities_owner_update" ON entities;
CREATE POLICY "entities_owner_update" ON entities
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Users can delete their own entities
DROP POLICY IF EXISTS "entities_owner_delete" ON entities;
CREATE POLICY "entities_owner_delete" ON entities
  FOR DELETE
  USING (owner_id = auth.uid());

-- =============================================================================
-- CONTEXT FILES POLICIES
-- =============================================================================

-- Public layer is readable by anyone
DROP POLICY IF EXISTS "context_files_public_read" ON context_files;
CREATE POLICY "context_files_public_read" ON context_files
  FOR SELECT
  USING (layer = 'public');

-- PowerPak published layer (would need subscription check)
DROP POLICY IF EXISTS "context_files_powerpak_read" ON context_files;
CREATE POLICY "context_files_powerpak_read" ON context_files
  FOR SELECT
  USING (layer = 'powerpak-published');
  -- TODO: Add subscription check when PowerPak is integrated

-- Tenant-scoped files
DROP POLICY IF EXISTS "context_files_tenant_read" ON context_files;
CREATE POLICY "context_files_tenant_read" ON context_files
  FOR SELECT
  USING (
    layer LIKE 'renubu:tenant-%'
    AND SUBSTRING(layer FROM 'renubu:tenant-(.+)') IN (
      SELECT tenant_id::TEXT FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- User-scoped files (founder-os)
DROP POLICY IF EXISTS "context_files_user_read" ON context_files;
CREATE POLICY "context_files_user_read" ON context_files
  FOR SELECT
  USING (
    layer LIKE 'founder:%'
    AND SUBSTRING(layer FROM 'founder:(.+)') = auth.uid()::TEXT
  );

-- =============================================================================
-- ENTITY LINKS POLICIES
-- Links inherit access from the layer they belong to
-- =============================================================================

-- Public links
DROP POLICY IF EXISTS "entity_links_public_read" ON entity_links;
CREATE POLICY "entity_links_public_read" ON entity_links
  FOR SELECT
  USING (layer = 'public');

-- Tenant links
DROP POLICY IF EXISTS "entity_links_tenant_read" ON entity_links;
CREATE POLICY "entity_links_tenant_read" ON entity_links
  FOR SELECT
  USING (
    layer LIKE 'renubu:tenant-%'
    AND SUBSTRING(layer FROM 'renubu:tenant-(.+)') IN (
      SELECT tenant_id::TEXT FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- User links
DROP POLICY IF EXISTS "entity_links_user_read" ON entity_links;
CREATE POLICY "entity_links_user_read" ON entity_links
  FOR SELECT
  USING (
    layer LIKE 'founder:%'
    AND SUBSTRING(layer FROM 'founder:(.+)') = auth.uid()::TEXT
  );

-- =============================================================================
-- INTERACTIONS POLICIES
-- =============================================================================

-- Public interactions
DROP POLICY IF EXISTS "interactions_public_read" ON interactions;
CREATE POLICY "interactions_public_read" ON interactions
  FOR SELECT
  USING (layer = 'public');

-- Tenant interactions
DROP POLICY IF EXISTS "interactions_tenant_read" ON interactions;
CREATE POLICY "interactions_tenant_read" ON interactions
  FOR SELECT
  USING (
    layer LIKE 'renubu:tenant-%'
    AND SUBSTRING(layer FROM 'renubu:tenant-(.+)') IN (
      SELECT tenant_id::TEXT FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- User interactions
DROP POLICY IF EXISTS "interactions_user_read" ON interactions;
CREATE POLICY "interactions_user_read" ON interactions
  FOR SELECT
  USING (
    layer LIKE 'founder:%'
    AND SUBSTRING(layer FROM 'founder:(.+)') = auth.uid()::TEXT
  );

-- Owner can do anything with their interactions
DROP POLICY IF EXISTS "interactions_owner_all" ON interactions;
CREATE POLICY "interactions_owner_all" ON interactions
  FOR ALL
  USING (owner_id = auth.uid());

-- =============================================================================
-- API KEYS POLICIES
-- Only owners can see their API keys
-- =============================================================================

DROP POLICY IF EXISTS "api_keys_owner_all" ON api_keys;
CREATE POLICY "api_keys_owner_all" ON api_keys
  FOR ALL
  USING (owner_id = auth.uid());

-- =============================================================================
-- API KEY USAGE POLICIES
-- Only owners can see their usage
-- =============================================================================

DROP POLICY IF EXISTS "api_key_usage_owner_read" ON api_key_usage;
CREATE POLICY "api_key_usage_owner_read" ON api_key_usage
  FOR SELECT
  USING (
    api_key_id IN (
      SELECT id FROM api_keys WHERE owner_id = auth.uid()
    )
  );

-- =============================================================================
-- SERVICE ROLE BYPASS
-- Service role can do anything (for server-side operations)
-- =============================================================================

-- Note: Supabase service role automatically bypasses RLS
-- These policies are for the anon/authenticated roles

-- RLS for user_tenants
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_tenants_read" ON user_tenants;
CREATE POLICY "user_tenants_read" ON user_tenants
  FOR SELECT
  USING (user_id = auth.uid());

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE user_tenants IS 'Junction table linking users to tenants for RLS';
