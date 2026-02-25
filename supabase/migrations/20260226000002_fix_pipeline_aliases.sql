-- =============================================================================
-- Point pipeline aliases to get_pipeline (MCP tool name).
-- get_pipeline internally calls crm.get_pipeline_summary RPC,
-- which is created by 20260226000003_reapply_crm_schema.sql.
-- =============================================================================

UPDATE human_os.aliases SET
  tools_required = ARRAY['get_pipeline'],
  actions = '[{"tool": "get_pipeline", "params": {}}]'::jsonb,
  description = 'Show sales pipeline summary',
  updated_at = NOW()
WHERE pattern = 'my pipeline' AND layer = 'public';

UPDATE human_os.aliases SET
  tools_required = ARRAY['get_pipeline'],
  actions = '[{"tool": "get_pipeline", "params": {}}]'::jsonb,
  description = 'Show sales pipeline summary',
  updated_at = NOW()
WHERE pattern = 'my deals' AND layer = 'public';
