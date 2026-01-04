-- Create MVP schema only (keep public as production schema)
-- This allows us to maintain both schemas simultaneously

-- Create the MVP schema (simplified version)
CREATE SCHEMA IF NOT EXISTS mvp;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA mvp TO authenticated;

-- Create a function to easily switch between schemas
CREATE OR REPLACE FUNCTION switch_to_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Set the search path to the specified schema
    SET search_path TO schema_name, public;
    
    -- Log the switch for debugging
    RAISE NOTICE 'Switched to schema: %', schema_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view to show current schema status
CREATE OR REPLACE VIEW schema_status AS
SELECT 
    'public' as schema_name,
    'Production-ready complex schema with full workflow system' as description,
    'Complex' as complexity_level
UNION ALL
SELECT 
    'mvp' as schema_name,
    'Simplified MVP schema for rapid development' as description,
    'Simple' as complexity_level;

-- Grant access to the view
GRANT SELECT ON schema_status TO authenticated; 