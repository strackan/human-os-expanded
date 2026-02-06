-- Human OS Migration: API Keys
-- Scoped API keys for external access to Human OS

-- =============================================================================
-- API KEYS TABLE
-- Stores API keys with scoped permissions
-- =============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  -- Key ID is the public identifier (e.g., 'hk_live_abc123')
  id TEXT PRIMARY KEY,

  -- Owner (PowerPak identity or user)
  owner_id UUID,
  name TEXT NOT NULL,                  -- Human-readable name (e.g., 'Acme Corp Production')

  -- Scoped permissions
  scopes TEXT[] NOT NULL DEFAULT '{}', -- Array of scope strings

  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 100,

  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_owner ON api_keys(owner_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

-- GIN index for scope queries
CREATE INDEX IF NOT EXISTS idx_api_keys_scopes ON api_keys USING GIN (scopes);

-- =============================================================================
-- API KEY USAGE LOG
-- Track API key usage for rate limiting and analytics
-- =============================================================================
CREATE TABLE IF NOT EXISTS api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id TEXT NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for rate limiting queries (last minute)
CREATE INDEX IF NOT EXISTS idx_api_key_usage_recent ON api_key_usage(api_key_id, created_at DESC);

-- Partition by time for better performance (optional, for high-volume)
-- CREATE INDEX IF NOT EXISTS idx_api_key_usage_time ON api_key_usage(created_at);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Check if an API key has a specific scope
CREATE OR REPLACE FUNCTION api_key_has_scope(
  p_key_id TEXT,
  p_scope TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_scopes TEXT[];
  v_scope TEXT;
BEGIN
  SELECT scopes INTO v_scopes
  FROM api_keys
  WHERE id = p_key_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_scopes IS NULL THEN
    RETURN false;
  END IF;

  -- Check direct match
  IF p_scope = ANY(v_scopes) THEN
    RETURN true;
  END IF;

  -- Check wildcard matches (e.g., 'voice:*:generate' matches 'voice:justin:generate')
  FOREACH v_scope IN ARRAY v_scopes LOOP
    IF v_scope LIKE '%*%' THEN
      -- Convert wildcard pattern to regex
      IF p_scope ~ ('^' || replace(replace(v_scope, '*', '[^:]+'), ':', ':') || '$') THEN
        RETURN true;
      END IF;
    END IF;
  END LOOP;

  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check rate limit for an API key
CREATE OR REPLACE FUNCTION api_key_check_rate_limit(
  p_key_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  -- Get the rate limit
  SELECT rate_limit_per_minute INTO v_limit
  FROM api_keys
  WHERE id = p_key_id AND is_active = true;

  IF v_limit IS NULL THEN
    RETURN false;
  END IF;

  -- Count requests in the last minute
  SELECT COUNT(*) INTO v_count
  FROM api_key_usage
  WHERE api_key_id = p_key_id
    AND created_at > NOW() - INTERVAL '1 minute';

  RETURN v_count < v_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Log API key usage and update last_used_at
CREATE OR REPLACE FUNCTION api_key_log_usage(
  p_key_id TEXT,
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INTEGER DEFAULT NULL,
  p_response_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Log the usage
  INSERT INTO api_key_usage (api_key_id, endpoint, method, status_code, response_time_ms)
  VALUES (p_key_id, p_endpoint, p_method, p_status_code, p_response_time_ms);

  -- Update last_used_at
  UPDATE api_keys
  SET last_used_at = NOW()
  WHERE id = p_key_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE api_keys IS 'API keys with scoped permissions for external access';
COMMENT ON COLUMN api_keys.scopes IS 'Array of scope strings (e.g., voice:justin:generate, context:public:read)';
COMMENT ON TABLE api_key_usage IS 'Usage log for rate limiting and analytics';
COMMENT ON FUNCTION api_key_has_scope IS 'Check if API key has a specific scope (supports wildcards)';
COMMENT ON FUNCTION api_key_check_rate_limit IS 'Check if API key is within rate limit';
