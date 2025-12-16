-- Human OS Migration: Expose founder_os schema to PostgREST API
-- This allows the REST API to access tables in the founder_os schema

-- Grant usage on the schema to anon and authenticated roles
GRANT USAGE ON SCHEMA founder_os TO anon, authenticated, service_role;

-- Grant permissions on all current tables
GRANT ALL ON ALL TABLES IN SCHEMA founder_os TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA founder_os TO anon, authenticated, service_role;

-- Grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA founder_os
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA founder_os
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- IMPORTANT: To expose this schema via PostgREST, you must also update
-- the "Exposed schemas" setting in Supabase Dashboard:
-- Project Settings > API > Exposed schemas > Add "founder_os"
--
-- Or run this via the Supabase Management API to update the config:
-- ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,founder_os';
-- NOTIFY pgrst, 'reload config';

-- Try to update PostgREST config (may need superuser privileges)
DO $$
BEGIN
  -- Update the db_schemas setting to include founder_os
  EXECUTE 'ALTER ROLE authenticator SET pgrst.db_schemas TO ''public,graphql_public,founder_os''';
  -- Notify PostgREST to reload its configuration
  NOTIFY pgrst, 'reload config';
EXCEPTION WHEN OTHERS THEN
  -- If we don't have permission, log it but continue
  RAISE NOTICE 'Could not update pgrst.db_schemas: %. Manual configuration required in Supabase Dashboard.', SQLERRM;
END $$;
