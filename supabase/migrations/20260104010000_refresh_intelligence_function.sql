-- Function to refresh entity_intelligence materialized view
-- Called by Inngest cron job every 15 minutes

CREATE OR REPLACE FUNCTION global.refresh_entity_intelligence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY global.entity_intelligence;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION global.refresh_entity_intelligence() TO service_role;

COMMENT ON FUNCTION global.refresh_entity_intelligence IS 'Refresh the entity_intelligence materialized view. Called by Inngest cron.';
