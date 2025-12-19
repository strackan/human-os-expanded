-- Human OS Migration: Rename founder_os schema to founder
-- Simpler, cleaner name

-- Rename the schema
ALTER SCHEMA founder_os RENAME TO founder;

-- Grant permissions
GRANT USAGE ON SCHEMA founder TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA founder TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA founder TO anon, authenticated, service_role;

-- Grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA founder
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA founder
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Update comments
COMMENT ON SCHEMA founder IS 'Personal executive system - tasks, goals, planning, relationships';
