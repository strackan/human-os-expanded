-- =============================================================================
-- Re-create crm.get_pipeline_summary function
-- Migration 070_crm_schema.sql defines this but it may not have been applied
-- to the cloud database. This migration is idempotent (CREATE OR REPLACE).
-- =============================================================================

-- Ensure CRM schema exists
CREATE SCHEMA IF NOT EXISTS crm;

-- Ensure PostgREST can see CRM schema
ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,human_os,founder_os,gft,global,crm';

-- Re-create the function
CREATE OR REPLACE FUNCTION crm.get_pipeline_summary(
  p_owner_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  stage_id UUID,
  stage_name TEXT,
  "position" INTEGER,
  opportunity_count BIGINT,
  total_value DECIMAL(12,2),
  weighted_value DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS stage_id,
    s.name AS stage_name,
    s."position",
    COUNT(o.id) AS opportunity_count,
    COALESCE(SUM(o.expected_value), 0) AS total_value,
    COALESCE(SUM(o.expected_value * COALESCE(o.probability, s.probability) / 100.0), 0) AS weighted_value
  FROM crm.pipeline_stages s
  LEFT JOIN crm.opportunities o ON o.stage_id = s.id
    AND o.closed_at IS NULL
    AND (
      (p_owner_id IS NOT NULL AND o.owner_id = p_owner_id)
      OR (p_tenant_id IS NOT NULL AND o.tenant_id = p_tenant_id)
    )
  WHERE
    (
      (p_owner_id IS NOT NULL AND s.owner_id = p_owner_id)
      OR (p_tenant_id IS NOT NULL AND s.tenant_id = p_tenant_id)
    )
    AND s.is_lost = false
  GROUP BY s.id, s.name, s."position"
  ORDER BY s."position";
END;
$$;

-- Grants
GRANT USAGE ON SCHEMA crm TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION crm.get_pipeline_summary TO authenticated, service_role;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
