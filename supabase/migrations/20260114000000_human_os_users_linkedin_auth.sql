-- Human OS Users: LinkedIn-Only Auth Model
-- Updates human_os.users to be the primary user table with LinkedIn as the auth method
--
-- Changes:
-- 1. Add linkedin_url, linkedin_id, avatar_url for LinkedIn auth
-- 2. Add updated_at timestamp
-- 3. Add product_active flag
-- 4. Create user_products join table for product memberships
-- 5. Update activation_keys to reference human_os.users instead of auth.users

-- =============================================================================
-- ALTER human_os.users TABLE
-- =============================================================================

-- Add LinkedIn auth fields
ALTER TABLE human_os.users
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS linkedin_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS product_active BOOLEAN DEFAULT true;

-- Create index on linkedin_id for fast lookups during auth
CREATE INDEX IF NOT EXISTS idx_human_os_users_linkedin_id
  ON human_os.users(linkedin_id) WHERE linkedin_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_human_os_users_linkedin_url
  ON human_os.users(linkedin_url) WHERE linkedin_url IS NOT NULL;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION human_os.update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_human_os_users_updated_at ON human_os.users;
CREATE TRIGGER update_human_os_users_updated_at
  BEFORE UPDATE ON human_os.users
  FOR EACH ROW EXECUTE FUNCTION human_os.update_users_updated_at();

-- =============================================================================
-- USER PRODUCTS JOIN TABLE
-- =============================================================================

-- Product types enum
DO $$ BEGIN
  CREATE TYPE human_os.product_type AS ENUM ('goodhang', 'renubu', 'founder_os', 'gft');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- User product memberships
CREATE TABLE IF NOT EXISTS human_os.user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES human_os.users(id) ON DELETE CASCADE,
  product human_os.product_type NOT NULL,
  tier TEXT DEFAULT 'free',
  activation_key_id UUID, -- Will reference activation_keys after FK update
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = never expires
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, product)
);

CREATE INDEX IF NOT EXISTS idx_human_os_user_products_user
  ON human_os.user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_human_os_user_products_product
  ON human_os.user_products(product);

-- RLS for user_products
ALTER TABLE human_os.user_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON human_os.user_products
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can read own products" ON human_os.user_products
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON human_os.user_products TO authenticated;
GRANT ALL ON human_os.user_products TO service_role;

-- =============================================================================
-- UPDATE ACTIVATION_KEYS REFERENCE
-- =============================================================================

-- Add human_os_user_id column to activation_keys (keeping user_id for backwards compat)
ALTER TABLE public.activation_keys
  ADD COLUMN IF NOT EXISTS human_os_user_id UUID REFERENCES human_os.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activation_keys_human_os_user
  ON public.activation_keys(human_os_user_id) WHERE human_os_user_id IS NOT NULL;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to find or create user by LinkedIn
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
  SELECT id INTO v_user_id
  FROM human_os.users
  WHERE linkedin_id = p_linkedin_id;

  IF v_user_id IS NOT NULL THEN
    -- Update existing user with latest info
    UPDATE human_os.users
    SET display_name = COALESCE(p_display_name, display_name),
        email = COALESCE(p_email, email),
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        linkedin_url = COALESCE(p_linkedin_url, linkedin_url)
    WHERE id = v_user_id;

    RETURN v_user_id;
  END IF;

  -- Try to find by linkedin_url
  SELECT id INTO v_user_id
  FROM human_os.users
  WHERE linkedin_url = p_linkedin_url;

  IF v_user_id IS NOT NULL THEN
    -- Update with linkedin_id
    UPDATE human_os.users
    SET linkedin_id = p_linkedin_id,
        display_name = COALESCE(p_display_name, display_name),
        email = COALESCE(p_email, email),
        avatar_url = COALESCE(p_avatar_url, avatar_url)
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
  INSERT INTO human_os.users (slug, display_name, email, linkedin_url, linkedin_id, avatar_url)
  VALUES (v_slug, p_display_name, p_email, p_linkedin_url, p_linkedin_id, p_avatar_url)
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim activation key for human_os user
DROP FUNCTION IF EXISTS human_os.claim_activation_key(TEXT, UUID);
CREATE OR REPLACE FUNCTION human_os.claim_activation_key(
  p_code TEXT,
  p_user_id UUID
) RETURNS TABLE(success BOOLEAN, product TEXT, error TEXT) AS $$
DECLARE
  v_key RECORD;
BEGIN
  -- Find and lock the key
  SELECT * INTO v_key
  FROM public.activation_keys ak
  WHERE UPPER(ak.code) = UPPER(p_code)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'Invalid activation code'::TEXT;
    RETURN;
  END IF;

  IF v_key.redeemed_at IS NOT NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'This activation code has already been used'::TEXT;
    RETURN;
  END IF;

  IF v_key.expires_at < NOW() THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'This activation code has expired'::TEXT;
    RETURN;
  END IF;

  -- Claim the key
  UPDATE public.activation_keys
  SET human_os_user_id = p_user_id,
      redeemed_at = NOW()
  WHERE id = v_key.id;

  -- Create user_product entry
  INSERT INTO human_os.user_products (user_id, product, activation_key_id, metadata)
  VALUES (
    p_user_id,
    v_key.product::human_os.product_type,
    v_key.id,
    v_key.metadata
  )
  ON CONFLICT (user_id, product) DO UPDATE
  SET activation_key_id = EXCLUDED.activation_key_id,
      metadata = human_os.user_products.metadata || EXCLUDED.metadata;

  RETURN QUERY SELECT true, v_key.product::TEXT, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION human_os.get_or_create_user_by_linkedin TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.claim_activation_key TO authenticated, service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN human_os.users.linkedin_id IS 'LinkedIn member ID from OAuth';
COMMENT ON COLUMN human_os.users.linkedin_url IS 'Full LinkedIn profile URL';
COMMENT ON COLUMN human_os.users.avatar_url IS 'Profile picture URL (from LinkedIn)';
COMMENT ON COLUMN human_os.users.product_active IS 'Whether user has any active product access';
COMMENT ON COLUMN human_os.users.auth_id IS 'Legacy: link to auth.users (deprecated, use LinkedIn auth)';

COMMENT ON TABLE human_os.user_products IS 'Product memberships for users';
COMMENT ON FUNCTION human_os.get_or_create_user_by_linkedin IS 'Find or create user by LinkedIn credentials';
COMMENT ON FUNCTION human_os.claim_activation_key IS 'Claim an activation key for a human_os user';
