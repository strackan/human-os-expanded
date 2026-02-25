-- Fix PostgREST schema configuration
--
-- A previous migration from human-os-convergence set pgrst.db_schemas to include
-- schemas that don't exist in this database (human_os, founder_os, gft, global).
-- This caused PGRST002 errors on all API requests.
--
-- This migration resets the configuration to only expose existing schemas.

ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,graphql_public';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
