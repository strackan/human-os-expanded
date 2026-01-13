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
