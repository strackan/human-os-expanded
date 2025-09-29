-- Migration: Schema Configuration and Cleanup
-- This migration sets up proper schema configuration and removes conflicts

-- 1. Create a configuration table to track active schema
CREATE TABLE IF NOT EXISTS mvp.schema_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    active_schema TEXT NOT NULL DEFAULT 'mvp',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert default configuration
INSERT INTO mvp.schema_config (active_schema, description) 
VALUES ('mvp', 'MVP schema is currently active for development')
ON CONFLICT DO NOTHING;

-- 3. Create a function to get active schema
CREATE OR REPLACE FUNCTION mvp.get_active_schema()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT active_schema FROM mvp.schema_config ORDER BY updated_at DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a function to switch active schema
CREATE OR REPLACE FUNCTION mvp.switch_active_schema(schema_name TEXT)
RETURNS TEXT AS $$
BEGIN
    IF schema_name NOT IN ('mvp', 'public') THEN
        RAISE EXCEPTION 'Invalid schema name. Must be "mvp" or "public"';
    END IF;
    
    UPDATE mvp.schema_config 
    SET active_schema = schema_name, updated_at = NOW();
    
    RETURN schema_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Drop conflicting tables from public schema if they exist
-- (These will be recreated in MVP schema if needed)
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.renewals CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;

-- 6. Create a view to show current schema status
CREATE OR REPLACE VIEW mvp.current_schema_status AS
SELECT 
    sc.active_schema,
    sc.description,
    sc.updated_at as last_switched,
    CASE 
        WHEN sc.active_schema = 'mvp' THEN 'MVP Schema Active - Simplified tables for rapid development'
        WHEN sc.active_schema = 'public' THEN 'Public Schema Active - Production schema with full workflow system'
    END as status_description
FROM mvp.schema_config sc
ORDER BY sc.updated_at DESC
LIMIT 1;

-- 7. Grant permissions
GRANT SELECT ON mvp.schema_config TO authenticated;
GRANT SELECT ON mvp.current_schema_status TO authenticated;
GRANT EXECUTE ON FUNCTION mvp.get_active_schema() TO authenticated;
GRANT EXECUTE ON FUNCTION mvp.switch_active_schema(TEXT) TO authenticated;

-- 8. Create a public view for easy access
CREATE OR REPLACE VIEW public.current_schema_status AS SELECT * FROM mvp.current_schema_status;
GRANT SELECT ON public.current_schema_status TO authenticated;
