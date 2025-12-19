-- Grant permissions on gft schema

-- Grant usage on schema
GRANT USAGE ON SCHEMA gft TO anon, authenticated, service_role;

-- Grant all on tables to service_role
GRANT ALL ON ALL TABLES IN SCHEMA gft TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA gft TO service_role;

-- Grant select/insert/update/delete to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA gft TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA gft TO authenticated;

-- Grant select to anon (public read)
GRANT SELECT ON ALL TABLES IN SCHEMA gft TO anon;

-- Make sure future tables get same grants
ALTER DEFAULT PRIVILEGES IN SCHEMA gft GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA gft GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA gft GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA gft GRANT USAGE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA gft GRANT SELECT ON TABLES TO anon;
