-- =============================================================================
-- Fix PostgREST exposed schemas
-- =============================================================================
-- Migration 20260104000000_global_entities.sql overwrote the pgrst.db_schemas
-- setting from 070_crm_schema.sql, dropping 'crm' from the list.
-- This caused all CRM tools (get_pipeline_summary, get_open_deals,
-- list_campaigns, etc.) to fail with schema errors.
--
-- Also ensures 'global' schema remains exposed for entity queries.
-- =============================================================================

ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,human_os,founder_os,gft,global,crm';

-- Notify PostgREST to reload config
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
