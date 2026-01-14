-- User Properties Table
-- Key-value store for non-essential user attributes (avatars, LinkedIn, etc.)
-- Keeps human_os.users lean with only essential fields

-- =============================================================================
-- CREATE USER_PROPERTIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS human_os.user_properties (
  user_id UUID NOT NULL REFERENCES human_os.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, key)
);

-- Index for looking up all properties for a user
CREATE INDEX IF NOT EXISTS idx_user_properties_user_id
  ON human_os.user_properties(user_id);

-- Index for looking up users by specific property (e.g., find by linkedin_id)
CREATE INDEX IF NOT EXISTS idx_user_properties_key_value
  ON human_os.user_properties(key, value)
  WHERE value IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER update_user_properties_updated_at
  BEFORE UPDATE ON human_os.user_properties
  FOR EACH ROW EXECUTE FUNCTION human_os.update_users_updated_at();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE human_os.user_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON human_os.user_properties
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can read all properties" ON human_os.user_properties
  FOR SELECT TO authenticated USING (true);

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON human_os.user_properties TO authenticated;
GRANT ALL ON human_os.user_properties TO service_role;

-- =============================================================================
-- MIGRATE EXISTING DATA
-- =============================================================================

-- Move linkedin_url, linkedin_id, avatar_url from users to properties
INSERT INTO human_os.user_properties (user_id, key, value)
SELECT id, 'linkedin_url', linkedin_url
FROM human_os.users WHERE linkedin_url IS NOT NULL
ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO human_os.user_properties (user_id, key, value)
SELECT id, 'linkedin_id', linkedin_id
FROM human_os.users WHERE linkedin_id IS NOT NULL
ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO human_os.user_properties (user_id, key, value)
SELECT id, 'avatar_url', avatar_url
FROM human_os.users WHERE avatar_url IS NOT NULL
ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get a user property
CREATE OR REPLACE FUNCTION human_os.get_user_property(
  p_user_id UUID,
  p_key TEXT
) RETURNS TEXT AS $$
  SELECT value FROM human_os.user_properties
  WHERE user_id = p_user_id AND key = p_key;
$$ LANGUAGE sql STABLE;

-- Set a user property (upsert)
CREATE OR REPLACE FUNCTION human_os.set_user_property(
  p_user_id UUID,
  p_key TEXT,
  p_value TEXT
) RETURNS VOID AS $$
  INSERT INTO human_os.user_properties (user_id, key, value)
  VALUES (p_user_id, p_key, p_value)
  ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
$$ LANGUAGE sql;

-- Get all properties for a user as JSONB
CREATE OR REPLACE FUNCTION human_os.get_user_properties(
  p_user_id UUID
) RETURNS JSONB AS $$
  SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
  FROM human_os.user_properties
  WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE;

-- Find user by property value (e.g., find by linkedin_id)
CREATE OR REPLACE FUNCTION human_os.find_user_by_property(
  p_key TEXT,
  p_value TEXT
) RETURNS UUID AS $$
  SELECT user_id FROM human_os.user_properties
  WHERE key = p_key AND value = p_value
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Grant execute
GRANT EXECUTE ON FUNCTION human_os.get_user_property TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.set_user_property TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.get_user_properties TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.find_user_by_property TO authenticated, service_role;

-- =============================================================================
-- UPDATE get_or_create_user_by_linkedin FUNCTION
-- =============================================================================

-- Drop and recreate to use properties table
DROP FUNCTION IF EXISTS human_os.get_or_create_user_by_linkedin(TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION human_os.get_or_create_user_by_linkedin(
  p_linkedin_id TEXT,
  p_linkedin_url TEXT,
  p_display_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_slug TEXT;
BEGIN
  -- Try to find by linkedin_id first
  SELECT user_id INTO v_user_id
  FROM human_os.user_properties
  WHERE key = 'linkedin_id' AND value = p_linkedin_id;

  IF v_user_id IS NOT NULL THEN
    -- Update existing user with latest info
    UPDATE human_os.users
    SET display_name = COALESCE(p_display_name, display_name),
        email = COALESCE(p_email, email)
    WHERE id = v_user_id;

    -- Update properties
    PERFORM human_os.set_user_property(v_user_id, 'linkedin_url', p_linkedin_url);
    IF p_avatar_url IS NOT NULL THEN
      PERFORM human_os.set_user_property(v_user_id, 'avatar_url', p_avatar_url);
    END IF;

    RETURN v_user_id;
  END IF;

  -- Try to find by linkedin_url
  SELECT user_id INTO v_user_id
  FROM human_os.user_properties
  WHERE key = 'linkedin_url' AND value = p_linkedin_url;

  IF v_user_id IS NOT NULL THEN
    -- Update with linkedin_id
    PERFORM human_os.set_user_property(v_user_id, 'linkedin_id', p_linkedin_id);
    IF p_avatar_url IS NOT NULL THEN
      PERFORM human_os.set_user_property(v_user_id, 'avatar_url', p_avatar_url);
    END IF;

    UPDATE human_os.users
    SET display_name = COALESCE(p_display_name, display_name),
        email = COALESCE(p_email, email)
    WHERE id = v_user_id;

    RETURN v_user_id;
  END IF;

  -- Generate slug from display name
  v_slug := LOWER(REGEXP_REPLACE(p_display_name, '[^a-zA-Z0-9]+', '-', 'g'));

  -- Ensure unique slug
  WHILE EXISTS (SELECT 1 FROM human_os.users WHERE slug = v_slug) LOOP
    v_slug := v_slug || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 4);
  END LOOP;

  -- Create new user
  INSERT INTO human_os.users (slug, display_name, email)
  VALUES (v_slug, p_display_name, p_email)
  RETURNING id INTO v_user_id;

  -- Set properties
  PERFORM human_os.set_user_property(v_user_id, 'linkedin_id', p_linkedin_id);
  PERFORM human_os.set_user_property(v_user_id, 'linkedin_url', p_linkedin_url);
  IF p_avatar_url IS NOT NULL THEN
    PERFORM human_os.set_user_property(v_user_id, 'avatar_url', p_avatar_url);
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION human_os.get_or_create_user_by_linkedin TO authenticated, service_role;

-- =============================================================================
-- DROP DEPRECATED COLUMNS (optional - can keep for backwards compat)
-- =============================================================================

-- Uncomment these once confident the migration is complete:
-- ALTER TABLE human_os.users DROP COLUMN IF EXISTS linkedin_url;
-- ALTER TABLE human_os.users DROP COLUMN IF EXISTS linkedin_id;
-- ALTER TABLE human_os.users DROP COLUMN IF EXISTS avatar_url;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE human_os.user_properties IS 'Key-value store for non-essential user attributes';
COMMENT ON COLUMN human_os.user_properties.key IS 'Property name: linkedin_url, linkedin_id, avatar_url, timezone, etc.';
COMMENT ON FUNCTION human_os.get_user_property IS 'Get a single property value for a user';
COMMENT ON FUNCTION human_os.set_user_property IS 'Set (upsert) a property for a user';
COMMENT ON FUNCTION human_os.get_user_properties IS 'Get all properties for a user as JSONB';
COMMENT ON FUNCTION human_os.find_user_by_property IS 'Find user ID by a property key-value pair';
