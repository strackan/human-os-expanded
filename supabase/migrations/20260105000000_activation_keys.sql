-- Activation Keys for Good Hang Desktop Client
-- Bridges web assessment completion to desktop app registration

-- Create activation_keys table
CREATE TABLE IF NOT EXISTS activation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The activation code (format: GH-XXXX-XXXX)
  code VARCHAR(16) UNIQUE NOT NULL,

  -- Link to assessment session (nullable - may be created before assessment)
  session_id UUID REFERENCES cs_assessment_sessions(id) ON DELETE SET NULL,

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

-- Indexes for fast lookups
CREATE INDEX idx_activation_keys_code ON activation_keys(code);
CREATE INDEX idx_activation_keys_session_id ON activation_keys(session_id);
CREATE INDEX idx_activation_keys_user_id ON activation_keys(user_id);
CREATE INDEX idx_activation_keys_status ON activation_keys(status);
CREATE INDEX idx_activation_keys_expires_at ON activation_keys(expires_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE activation_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access"
  ON activation_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read their own claimed keys
CREATE POLICY "Users can read own claimed keys"
  ON activation_keys
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Public can validate keys (read pending keys by code)
-- This allows the desktop app to validate without auth
CREATE POLICY "Public can validate pending keys"
  ON activation_keys
  FOR SELECT
  TO anon
  USING (status = 'pending' AND expires_at > NOW());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_activation_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activation_keys_updated_at
  BEFORE UPDATE ON activation_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_activation_keys_updated_at();

-- Function to generate activation code
CREATE OR REPLACE FUNCTION generate_activation_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No I, O, 0, 1 for clarity
  result TEXT := 'GH-';
  i INTEGER;
BEGIN
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

-- Function to create activation key for a completed assessment
CREATE OR REPLACE FUNCTION create_activation_key(
  p_session_id UUID,
  p_expires_in_days INTEGER DEFAULT 7
)
RETURNS TABLE(code TEXT, expires_at TIMESTAMPTZ, deep_link TEXT) AS $$
DECLARE
  v_code TEXT;
  v_expires_at TIMESTAMPTZ;
  v_attempts INTEGER := 0;
BEGIN
  -- Calculate expiration
  v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;

  -- Generate unique code (retry on collision)
  LOOP
    v_code := generate_activation_code();
    BEGIN
      INSERT INTO activation_keys (code, session_id, expires_at, metadata)
      VALUES (
        v_code,
        p_session_id,
        v_expires_at,
        jsonb_build_object('generated_from', 'assessment_completion')
      );
      EXIT; -- Success, exit loop
    EXCEPTION WHEN unique_violation THEN
      v_attempts := v_attempts + 1;
      IF v_attempts >= 10 THEN
        RAISE EXCEPTION 'Failed to generate unique activation code after 10 attempts';
      END IF;
    END;
  END LOOP;

  RETURN QUERY SELECT
    v_code AS code,
    v_expires_at AS expires_at,
    'goodhang://activate/' || v_code AS deep_link;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate activation key
CREATE OR REPLACE FUNCTION validate_activation_key(p_code TEXT)
RETURNS TABLE(
  valid BOOLEAN,
  session_id UUID,
  tier TEXT,
  archetype_hint TEXT,
  error TEXT
) AS $$
DECLARE
  v_key activation_keys;
  v_session cs_assessment_sessions;
BEGIN
  -- Find the key
  SELECT * INTO v_key
  FROM activation_keys ak
  WHERE ak.code = p_code;

  -- Key not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false AS valid,
      NULL::UUID AS session_id,
      NULL::TEXT AS tier,
      NULL::TEXT AS archetype_hint,
      'Invalid activation code'::TEXT AS error;
    RETURN;
  END IF;

  -- Key already claimed
  IF v_key.status = 'claimed' THEN
    RETURN QUERY SELECT
      false AS valid,
      NULL::UUID AS session_id,
      NULL::TEXT AS tier,
      NULL::TEXT AS archetype_hint,
      'This activation code has already been used'::TEXT AS error;
    RETURN;
  END IF;

  -- Key expired
  IF v_key.expires_at < NOW() THEN
    -- Mark as expired
    UPDATE activation_keys SET status = 'expired' WHERE id = v_key.id;
    RETURN QUERY SELECT
      false AS valid,
      NULL::UUID AS session_id,
      NULL::TEXT AS tier,
      NULL::TEXT AS archetype_hint,
      'This activation code has expired'::TEXT AS error;
    RETURN;
  END IF;

  -- Key revoked
  IF v_key.status = 'revoked' THEN
    RETURN QUERY SELECT
      false AS valid,
      NULL::UUID AS session_id,
      NULL::TEXT AS tier,
      NULL::TEXT AS archetype_hint,
      'This activation code is no longer valid'::TEXT AS error;
    RETURN;
  END IF;

  -- Get session info for preview
  IF v_key.session_id IS NOT NULL THEN
    SELECT * INTO v_session
    FROM cs_assessment_sessions s
    WHERE s.id = v_key.session_id;
  END IF;

  -- Key is valid
  RETURN QUERY SELECT
    true AS valid,
    v_key.session_id,
    COALESCE(v_session.tier, 'unknown')::TEXT AS tier,
    COALESCE(v_session.archetype, 'Your character awaits...')::TEXT AS archetype_hint,
    NULL::TEXT AS error;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim activation key
CREATE OR REPLACE FUNCTION claim_activation_key(p_code TEXT, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, error TEXT) AS $$
DECLARE
  v_key activation_keys;
BEGIN
  -- Find and lock the key
  SELECT * INTO v_key
  FROM activation_keys ak
  WHERE ak.code = p_code
  FOR UPDATE;

  -- Key not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid activation code'::TEXT;
    RETURN;
  END IF;

  -- Key already claimed
  IF v_key.status = 'claimed' THEN
    RETURN QUERY SELECT false, 'This activation code has already been used'::TEXT;
    RETURN;
  END IF;

  -- Key expired
  IF v_key.expires_at < NOW() THEN
    UPDATE activation_keys SET status = 'expired' WHERE id = v_key.id;
    RETURN QUERY SELECT false, 'This activation code has expired'::TEXT;
    RETURN;
  END IF;

  -- Key not pending
  IF v_key.status != 'pending' THEN
    RETURN QUERY SELECT false, 'This activation code is no longer valid'::TEXT;
    RETURN;
  END IF;

  -- Claim the key
  UPDATE activation_keys
  SET
    user_id = p_user_id,
    status = 'claimed',
    claimed_at = NOW()
  WHERE id = v_key.id;

  -- Link assessment session to user if exists
  IF v_key.session_id IS NOT NULL THEN
    UPDATE cs_assessment_sessions
    SET user_id = p_user_id
    WHERE id = v_key.session_id AND user_id IS NULL;
  END IF;

  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE activation_keys IS 'Activation keys for Good Hang desktop client registration';
COMMENT ON FUNCTION generate_activation_code() IS 'Generate a unique, readable activation code (GH-XXXX-XXXX format)';
COMMENT ON FUNCTION create_activation_key(UUID, INTEGER) IS 'Create an activation key for a completed assessment session';
COMMENT ON FUNCTION validate_activation_key(TEXT) IS 'Validate an activation key and return session preview';
COMMENT ON FUNCTION claim_activation_key(TEXT, UUID) IS 'Claim an activation key for a user';
