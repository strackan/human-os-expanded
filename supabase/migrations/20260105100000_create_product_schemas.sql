-- Create Product Schemas
-- Three schemas with x_ prefix for the new architecture:
-- x_human: Shared infrastructure (auth extensions, activation keys, entities)
-- x_goodhang: Good Hang product-specific tables
-- x_renubu: Renubu product-specific tables

-- Create schemas
CREATE SCHEMA IF NOT EXISTS x_human;
CREATE SCHEMA IF NOT EXISTS x_goodhang;
CREATE SCHEMA IF NOT EXISTS x_renubu;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA x_human TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA x_goodhang TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA x_renubu TO authenticated, anon, service_role;

-- Products enum for tracking which product something belongs to
CREATE TYPE x_human.product_type AS ENUM ('goodhang', 'renubu');

-- ============================================================================
-- ACTIVATION KEYS (Shared Infrastructure)
-- ============================================================================
-- Activation keys can unlock either product. A user takes an assessment,
-- gets a key, and that key grants access to the specified product.

CREATE TABLE x_human.activation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The activation code (format: GH-XXXX-XXXX or RN-XXXX-XXXX)
  code VARCHAR(16) UNIQUE NOT NULL,

  -- Which product this key unlocks
  product x_human.product_type NOT NULL,

  -- Link to assessment session (product-specific, nullable)
  -- For Good Hang: references x_goodhang.assessment_sessions
  -- For Renubu: references x_renubu.assessment_sessions (future)
  session_id UUID,

  -- User who claimed the key (null until claimed)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Key status
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'claimed', 'expired', 'revoked')),

  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,
  claimed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional metadata (tier preview, archetype hint, etc.)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_x_activation_keys_code ON x_human.activation_keys(code);
CREATE INDEX idx_x_activation_keys_product ON x_human.activation_keys(product);
CREATE INDEX idx_x_activation_keys_user_id ON x_human.activation_keys(user_id);
CREATE INDEX idx_x_activation_keys_status ON x_human.activation_keys(status);
CREATE INDEX idx_x_activation_keys_expires ON x_human.activation_keys(expires_at)
  WHERE status = 'pending';

-- Enable RLS
ALTER TABLE x_human.activation_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access"
  ON x_human.activation_keys FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can read own claimed keys"
  ON x_human.activation_keys FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Public can validate pending keys"
  ON x_human.activation_keys FOR SELECT TO anon
  USING (status = 'pending' AND expires_at > NOW());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION x_human.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activation_keys_updated_at
  BEFORE UPDATE ON x_human.activation_keys
  FOR EACH ROW EXECUTE FUNCTION x_human.update_updated_at();

-- ============================================================================
-- ACTIVATION KEY FUNCTIONS
-- ============================================================================

-- Generate activation code with product prefix
CREATE OR REPLACE FUNCTION x_human.generate_activation_code(p_product x_human.product_type)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  prefix TEXT;
  result TEXT;
  i INTEGER;
BEGIN
  -- Product-specific prefix
  prefix := CASE p_product
    WHEN 'goodhang' THEN 'GH-'
    WHEN 'renubu' THEN 'RN-'
  END;

  result := prefix;

  -- Generate 4 random characters
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  result := result || '-';
  -- Generate 4 more random characters
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create activation key
CREATE OR REPLACE FUNCTION x_human.create_activation_key(
  p_product x_human.product_type,
  p_session_id UUID DEFAULT NULL,
  p_expires_in_days INTEGER DEFAULT 7,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(code TEXT, expires_at TIMESTAMPTZ, deep_link TEXT) AS $$
DECLARE
  v_code TEXT;
  v_expires_at TIMESTAMPTZ;
  v_attempts INTEGER := 0;
  v_scheme TEXT;
BEGIN
  v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
  v_scheme := CASE p_product
    WHEN 'goodhang' THEN 'goodhang'
    WHEN 'renubu' THEN 'renubu'
  END;

  LOOP
    v_code := x_human.generate_activation_code(p_product);
    BEGIN
      INSERT INTO x_human.activation_keys (code, product, session_id, expires_at, metadata)
      VALUES (v_code, p_product, p_session_id, v_expires_at, p_metadata);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_attempts := v_attempts + 1;
      IF v_attempts >= 10 THEN
        RAISE EXCEPTION 'Failed to generate unique activation code';
      END IF;
    END;
  END LOOP;

  RETURN QUERY SELECT
    v_code AS code,
    v_expires_at AS expires_at,
    v_scheme || '://activate/' || v_code AS deep_link;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate activation key
CREATE OR REPLACE FUNCTION x_human.validate_activation_key(p_code TEXT)
RETURNS TABLE(
  valid BOOLEAN,
  product x_human.product_type,
  session_id UUID,
  preview JSONB,
  error TEXT
) AS $$
DECLARE
  v_key x_human.activation_keys;
BEGIN
  SELECT * INTO v_key
  FROM x_human.activation_keys ak
  WHERE UPPER(ak.code) = UPPER(p_code);

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::x_human.product_type, NULL::UUID, NULL::JSONB,
      'Invalid activation code'::TEXT;
    RETURN;
  END IF;

  IF v_key.status = 'claimed' THEN
    RETURN QUERY SELECT false, NULL::x_human.product_type, NULL::UUID, NULL::JSONB,
      'This activation code has already been used'::TEXT;
    RETURN;
  END IF;

  IF v_key.expires_at < NOW() THEN
    UPDATE x_human.activation_keys SET status = 'expired' WHERE id = v_key.id;
    RETURN QUERY SELECT false, NULL::x_human.product_type, NULL::UUID, NULL::JSONB,
      'This activation code has expired'::TEXT;
    RETURN;
  END IF;

  IF v_key.status = 'revoked' THEN
    RETURN QUERY SELECT false, NULL::x_human.product_type, NULL::UUID, NULL::JSONB,
      'This activation code is no longer valid'::TEXT;
    RETURN;
  END IF;

  -- Valid key - return with preview from metadata
  RETURN QUERY SELECT
    true,
    v_key.product,
    v_key.session_id,
    v_key.metadata,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Claim activation key
CREATE OR REPLACE FUNCTION x_human.claim_activation_key(p_code TEXT, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, product x_human.product_type, error TEXT) AS $$
DECLARE
  v_key x_human.activation_keys;
BEGIN
  SELECT * INTO v_key
  FROM x_human.activation_keys ak
  WHERE UPPER(ak.code) = UPPER(p_code)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::x_human.product_type, 'Invalid activation code'::TEXT;
    RETURN;
  END IF;

  IF v_key.status = 'claimed' THEN
    RETURN QUERY SELECT false, NULL::x_human.product_type,
      'This activation code has already been used'::TEXT;
    RETURN;
  END IF;

  IF v_key.expires_at < NOW() THEN
    UPDATE x_human.activation_keys SET status = 'expired' WHERE id = v_key.id;
    RETURN QUERY SELECT false, NULL::x_human.product_type,
      'This activation code has expired'::TEXT;
    RETURN;
  END IF;

  IF v_key.status != 'pending' THEN
    RETURN QUERY SELECT false, NULL::x_human.product_type,
      'This activation code is no longer valid'::TEXT;
    RETURN;
  END IF;

  -- Claim the key
  UPDATE x_human.activation_keys
  SET user_id = p_user_id, status = 'claimed', claimed_at = NOW()
  WHERE id = v_key.id;

  RETURN QUERY SELECT true, v_key.product, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USER PRODUCTS (Track which products a user has access to)
-- ============================================================================

CREATE TABLE x_human.user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product x_human.product_type NOT NULL,
  activation_key_id UUID REFERENCES x_human.activation_keys(id),
  tier VARCHAR(50) DEFAULT 'free',
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = never expires
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  UNIQUE(user_id, product)
);

CREATE INDEX idx_user_products_user ON x_human.user_products(user_id);
CREATE INDEX idx_user_products_product ON x_human.user_products(product);

ALTER TABLE x_human.user_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own products"
  ON x_human.user_products FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access"
  ON x_human.user_products FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Function to grant product access after claiming a key
CREATE OR REPLACE FUNCTION x_human.grant_product_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'claimed' AND OLD.status = 'pending' THEN
    INSERT INTO x_human.user_products (user_id, product, activation_key_id, metadata)
    VALUES (NEW.user_id, NEW.product, NEW.id, NEW.metadata)
    ON CONFLICT (user_id, product) DO UPDATE
    SET activation_key_id = EXCLUDED.activation_key_id,
        metadata = x_human.user_products.metadata || EXCLUDED.metadata;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_grant_product_access
  AFTER UPDATE ON x_human.activation_keys
  FOR EACH ROW EXECUTE FUNCTION x_human.grant_product_access();

-- Comments
COMMENT ON SCHEMA x_human IS 'Shared Human OS infrastructure';
COMMENT ON SCHEMA x_goodhang IS 'Good Hang product-specific tables';
COMMENT ON SCHEMA x_renubu IS 'Renubu product-specific tables';
COMMENT ON TABLE x_human.activation_keys IS 'Activation keys for product registration';
COMMENT ON TABLE x_human.user_products IS 'Track which products each user has access to';

-- ============================================================================
-- PUBLIC SCHEMA WRAPPERS (for Supabase RPC compatibility)
-- ============================================================================
-- Supabase .rpc() doesn't support schema-qualified names, so we create
-- public wrappers that delegate to the x_human functions.

CREATE OR REPLACE FUNCTION public.create_activation_key(
  p_product TEXT,
  p_session_id UUID DEFAULT NULL,
  p_expires_in_days INTEGER DEFAULT 7,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(code TEXT, expires_at TIMESTAMPTZ, deep_link TEXT) AS $$
BEGIN
  RETURN QUERY SELECT * FROM x_human.create_activation_key(
    p_product::x_human.product_type,
    p_session_id,
    p_expires_in_days,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.validate_activation_key(p_code TEXT)
RETURNS TABLE(
  valid BOOLEAN,
  product TEXT,
  session_id UUID,
  preview JSONB,
  error TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.valid,
    r.product::TEXT,
    r.session_id,
    r.preview,
    r.error
  FROM x_human.validate_activation_key(p_code) r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.claim_activation_key(p_code TEXT, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, product TEXT, error TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT r.success, r.product::TEXT, r.error
  FROM x_human.claim_activation_key(p_code, p_user_id) r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get activation key for a session
CREATE OR REPLACE FUNCTION public.get_activation_key_for_session(p_session_id UUID)
RETURNS TABLE(
  code TEXT,
  product TEXT,
  expires_at TIMESTAMPTZ,
  deep_link TEXT,
  metadata JSONB,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ak.code,
    ak.product::TEXT,
    ak.expires_at,
    CASE ak.product
      WHEN 'goodhang' THEN 'goodhang://activate/' || ak.code
      WHEN 'renubu' THEN 'renubu://activate/' || ak.code
    END AS deep_link,
    ak.metadata,
    ak.status
  FROM x_human.activation_keys ak
  WHERE ak.session_id = p_session_id
    AND ak.status = 'pending'
    AND ak.expires_at > NOW()
  ORDER BY ak.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
