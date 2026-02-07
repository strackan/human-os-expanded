-- Add 'founder_os' to x_human.product_type enum
-- This allows activation keys to be created directly for Founder OS
-- (previously only 'goodhang' and 'renubu' were supported)

ALTER TYPE x_human.product_type ADD VALUE IF NOT EXISTS 'founder_os';

-- Update the code generation function to support the FO- prefix
CREATE OR REPLACE FUNCTION x_human.generate_activation_code(p_product x_human.product_type)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  prefix TEXT;
  result TEXT;
  i INTEGER;
BEGIN
  prefix := CASE p_product
    WHEN 'goodhang' THEN 'GH-'
    WHEN 'renubu' THEN 'RN-'
    WHEN 'founder_os' THEN 'FO-'
  END;

  result := prefix;

  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update the create_activation_key function to handle founder_os deep links
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
    WHEN 'founder_os' THEN 'goodhang'
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
