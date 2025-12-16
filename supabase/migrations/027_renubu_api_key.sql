-- ============================================
-- RENUBU API KEY SETUP
-- Defines scoped permissions for Renubu integration
-- ============================================

-- =============================================================================
-- SCOPE NAMING CONVENTION
-- =============================================================================
-- Scopes follow the pattern: {resource}:{layer}:{action}
--
-- Resources:
--   gft           - GFT CRM data (contacts, companies, posts)
--   relationship  - Relationship context opinions
--   skills        - Skills files and tool definitions
--   entities      - Entity records
--   founder_os    - Personal founder context (BLOCKED for Renubu)
--   powerpak      - Expert configurations (BLOCKED for Renubu)
--
-- Layers:
--   public        - Publicly accessible
--   renubu:*      - Renubu tenant-scoped (e.g., renubu:tenant-acme)
--   founder:*     - Private founder context (BLOCKED for Renubu)
--
-- Actions:
--   read          - Read access
--   write         - Create/update access
--   delete        - Delete access
--   *             - All actions
--
-- Examples:
--   gft:contacts:read              - Read GFT contacts
--   relationship:renubu:*:*        - Full access to renubu relationship opinions
--   skills:public:read             - Read public skills files
-- =============================================================================

-- =============================================================================
-- ADD SCOPE VALIDATION
-- =============================================================================

-- Create a function to validate scope format
CREATE OR REPLACE FUNCTION validate_api_scope(p_scope TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Basic format check: at least 2 parts separated by colons
  IF p_scope !~ '^[a-z_]+:[a-z_*:]+$' THEN
    RETURN false;
  END IF;

  -- Check for blocked scopes (founder_os, powerpak should not be granted to external systems)
  -- This is documentation, actual enforcement is at code level

  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- RENUBU API KEY TEMPLATE
-- =============================================================================
-- This is a template - actual key should be created with a secure ID generator
--
-- DO NOT run this in production without:
-- 1. Generating a proper secure key ID (e.g., hk_live_renubu_xxxxx)
-- 2. Setting the correct owner_id
-- 3. Setting appropriate rate limits for production
-- =============================================================================

-- Example: Create Renubu production API key
-- Uncomment and customize for actual deployment:
/*
INSERT INTO api_keys (
  id,
  name,
  owner_id,
  scopes,
  rate_limit_per_minute,
  is_active
) VALUES (
  'hk_live_renubu_CHANGE_ME',  -- Generate secure ID
  'Renubu Production',
  'CHANGE_TO_OWNER_UUID',       -- Set to actual owner UUID
  ARRAY[
    -- GFT data (public LinkedIn data)
    'gft:contacts:read',
    'gft:companies:read',
    'gft:posts:read',
    'gft:activities:read',

    -- Relationship context (layer-scoped)
    'relationship:renubu:*:read',
    'relationship:renubu:*:write',

    -- Skills files (read-only)
    'skills:public:read',
    'skills:renubu:*:read',

    -- Entities (read-only for lookups)
    'entities:read'

    -- EXPLICITLY EXCLUDED:
    -- 'founder_os:*' - Personal founder context
    -- 'powerpak:*' - Expert configurations
    -- 'relationship:founder:*' - Private relationship opinions
  ],
  200,  -- Higher rate limit for production
  true
);
*/

-- =============================================================================
-- HELPER FUNCTIONS FOR RENUBU
-- =============================================================================

-- Check if a scope allows access to a specific layer
CREATE OR REPLACE FUNCTION scope_allows_layer(
  p_scope TEXT,
  p_layer TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_parts TEXT[];
  v_scope_layer TEXT;
BEGIN
  -- Split scope into parts
  v_parts := string_to_array(p_scope, ':');

  -- Get the layer part (second element for most scopes)
  IF array_length(v_parts, 1) >= 2 THEN
    v_scope_layer := v_parts[2];
  ELSE
    RETURN false;
  END IF;

  -- Check for wildcard match
  IF v_scope_layer = '*' THEN
    RETURN true;
  END IF;

  -- Check for prefix wildcard (e.g., renubu:* matches renubu:tenant-acme)
  IF v_scope_layer LIKE '%:*' THEN
    DECLARE
      v_prefix TEXT := substring(v_scope_layer from 1 for position(':*' in v_scope_layer) - 1);
    BEGIN
      RETURN p_layer LIKE v_prefix || '%';
    END;
  END IF;

  -- Direct match
  RETURN v_scope_layer = p_layer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get all layers an API key can access for a resource
CREATE OR REPLACE FUNCTION api_key_allowed_layers(
  p_key_id TEXT,
  p_resource TEXT
)
RETURNS TEXT[] AS $$
DECLARE
  v_scopes TEXT[];
  v_allowed TEXT[] := '{}';
  v_scope TEXT;
BEGIN
  SELECT scopes INTO v_scopes
  FROM api_keys
  WHERE id = p_key_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_scopes IS NULL THEN
    RETURN v_allowed;
  END IF;

  FOREACH v_scope IN ARRAY v_scopes LOOP
    IF v_scope LIKE p_resource || ':%' THEN
      v_allowed := array_append(v_allowed, v_scope);
    END IF;
  END LOOP;

  RETURN v_allowed;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON FUNCTION validate_api_scope IS 'Validate API scope format';
COMMENT ON FUNCTION scope_allows_layer IS 'Check if a scope pattern allows access to a layer';
COMMENT ON FUNCTION api_key_allowed_layers IS 'Get all scopes for a resource that an API key has';
