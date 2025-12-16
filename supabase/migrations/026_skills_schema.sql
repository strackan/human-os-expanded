-- ============================================
-- SKILLS SCHEMA
-- Enhanced context_files for skills-based files
-- Supports Anthropic's preferred patterns (tools, programs, nestable)
-- ============================================

-- =============================================================================
-- ENHANCE CONTEXT_FILES FOR SKILLS
-- =============================================================================

-- Add file type column to distinguish skills from other context files
ALTER TABLE context_files ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'context'
  CHECK (file_type IN ('context', 'skills', 'notes', 'goals', 'tasks', 'other'));

-- Add parsed frontmatter storage (YAML → JSONB)
ALTER TABLE context_files ADD COLUMN IF NOT EXISTS frontmatter JSONB DEFAULT '{}';

-- Add skills-specific counts for quick filtering
ALTER TABLE context_files ADD COLUMN IF NOT EXISTS tools_count INTEGER DEFAULT 0;
ALTER TABLE context_files ADD COLUMN IF NOT EXISTS programs_count INTEGER DEFAULT 0;

-- Add source system tracking
ALTER TABLE context_files ADD COLUMN IF NOT EXISTS source_system TEXT;

-- Add updated_at for change tracking
ALTER TABLE context_files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================================================
-- INDEXES FOR SKILLS QUERIES
-- =============================================================================

-- Index on file_type for filtering
CREATE INDEX IF NOT EXISTS idx_context_files_type ON context_files(file_type);

-- Index on source_system for cross-system queries
CREATE INDEX IF NOT EXISTS idx_context_files_source ON context_files(source_system);

-- GIN index on frontmatter for JSONB queries
CREATE INDEX IF NOT EXISTS idx_context_files_frontmatter ON context_files USING GIN(frontmatter);

-- Composite index for skills files by layer
CREATE INDEX IF NOT EXISTS idx_context_files_skills_layer ON context_files(layer, file_type)
  WHERE file_type = 'skills';

-- =============================================================================
-- SKILLS TABLE (Normalized tool/program definitions)
-- =============================================================================

-- Individual tools defined in skills files
CREATE TABLE IF NOT EXISTS skills_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent file
  context_file_id UUID NOT NULL REFERENCES context_files(id) ON DELETE CASCADE,

  -- Tool definition
  name TEXT NOT NULL,
  description TEXT,
  parameters JSONB DEFAULT '{}',  -- JSON Schema for parameters

  -- Metadata
  position INTEGER DEFAULT 0,     -- Order in file

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One tool name per file
  UNIQUE(context_file_id, name)
);

-- Individual programs defined in skills files
CREATE TABLE IF NOT EXISTS skills_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent file
  context_file_id UUID NOT NULL REFERENCES context_files(id) ON DELETE CASCADE,

  -- Program definition
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB DEFAULT '[]',       -- Ordered list of steps

  -- Metadata
  position INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One program name per file
  UNIQUE(context_file_id, name)
);

-- =============================================================================
-- INDEXES FOR TOOLS AND PROGRAMS
-- =============================================================================

CREATE INDEX idx_skills_tools_file ON skills_tools(context_file_id);
CREATE INDEX idx_skills_tools_name ON skills_tools(name);
CREATE INDEX idx_skills_programs_file ON skills_programs(context_file_id);
CREATE INDEX idx_skills_programs_name ON skills_programs(name);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update counts when tools/programs change
CREATE OR REPLACE FUNCTION update_skills_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update tools count
  UPDATE context_files SET tools_count = (
    SELECT COUNT(*) FROM skills_tools WHERE context_file_id = COALESCE(NEW.context_file_id, OLD.context_file_id)
  ) WHERE id = COALESCE(NEW.context_file_id, OLD.context_file_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_programs_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update programs count
  UPDATE context_files SET programs_count = (
    SELECT COUNT(*) FROM skills_programs WHERE context_file_id = COALESCE(NEW.context_file_id, OLD.context_file_id)
  ) WHERE id = COALESCE(NEW.context_file_id, OLD.context_file_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tools_count_trigger
  AFTER INSERT OR DELETE ON skills_tools
  FOR EACH ROW EXECUTE FUNCTION update_skills_counts();

CREATE TRIGGER update_programs_count_trigger
  AFTER INSERT OR DELETE ON skills_programs
  FOR EACH ROW EXECUTE FUNCTION update_programs_counts();

-- Update context_files.updated_at
CREATE TRIGGER update_context_files_updated_at
  BEFORE UPDATE ON context_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- QUERY FUNCTIONS
-- =============================================================================

-- Get all skills files for a layer
CREATE OR REPLACE FUNCTION get_skills_files(
  p_layer TEXT DEFAULT NULL,
  p_source_system TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  layer TEXT,
  file_path TEXT,
  entity_id UUID,
  frontmatter JSONB,
  tools_count INTEGER,
  programs_count INTEGER,
  source_system TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cf.id,
    cf.layer,
    cf.file_path,
    cf.entity_id,
    cf.frontmatter,
    cf.tools_count,
    cf.programs_count,
    cf.source_system,
    cf.created_at,
    cf.updated_at
  FROM context_files cf
  WHERE cf.file_type = 'skills'
    AND (p_layer IS NULL OR cf.layer = p_layer)
    AND (p_source_system IS NULL OR cf.source_system = p_source_system)
  ORDER BY cf.updated_at DESC
  LIMIT p_limit;
END;
$$;

-- Get skills file with tools and programs
CREATE OR REPLACE FUNCTION get_skills_file_detail(
  p_file_id UUID
)
RETURNS TABLE (
  id UUID,
  layer TEXT,
  file_path TEXT,
  entity_id UUID,
  frontmatter JSONB,
  tools JSONB,
  programs JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cf.id,
    cf.layer,
    cf.file_path,
    cf.entity_id,
    cf.frontmatter,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', st.id,
        'name', st.name,
        'description', st.description,
        'parameters', st.parameters
      ) ORDER BY st.position)
      FROM skills_tools st WHERE st.context_file_id = cf.id),
      '[]'::jsonb
    ) AS tools,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', sp.id,
        'name', sp.name,
        'description', sp.description,
        'steps', sp.steps
      ) ORDER BY sp.position)
      FROM skills_programs sp WHERE sp.context_file_id = cf.id),
      '[]'::jsonb
    ) AS programs,
    cf.created_at,
    cf.updated_at
  FROM context_files cf
  WHERE cf.id = p_file_id
    AND cf.file_type = 'skills';
END;
$$;

-- Search skills by tool name
CREATE OR REPLACE FUNCTION search_skills_by_tool(
  p_tool_name TEXT,
  p_layer TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  file_id UUID,
  file_path TEXT,
  layer TEXT,
  tool_id UUID,
  tool_name TEXT,
  tool_description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cf.id AS file_id,
    cf.file_path,
    cf.layer,
    st.id AS tool_id,
    st.name AS tool_name,
    st.description AS tool_description
  FROM skills_tools st
  JOIN context_files cf ON cf.id = st.context_file_id
  WHERE st.name ILIKE '%' || p_tool_name || '%'
    AND cf.file_type = 'skills'
    AND (p_layer IS NULL OR cf.layer = p_layer)
  ORDER BY st.name
  LIMIT p_limit;
END;
$$;

-- Get skills file for an entity (person/expert)
CREATE OR REPLACE FUNCTION get_entity_skills(
  p_entity_id UUID
)
RETURNS TABLE (
  id UUID,
  layer TEXT,
  file_path TEXT,
  frontmatter JSONB,
  tools_count INTEGER,
  programs_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cf.id,
    cf.layer,
    cf.file_path,
    cf.frontmatter,
    cf.tools_count,
    cf.programs_count
  FROM context_files cf
  WHERE cf.entity_id = p_entity_id
    AND cf.file_type = 'skills'
  ORDER BY cf.updated_at DESC;
END;
$$;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE skills_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_programs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "skills_tools_service_all" ON skills_tools
  FOR ALL TO service_role USING (true);

CREATE POLICY "skills_programs_service_all" ON skills_programs
  FOR ALL TO service_role USING (true);

-- Read access based on parent file's layer (via context_files RLS)
-- Note: Additional policies should be added based on layer-based access patterns

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN context_files.file_type IS 'Type of context file: context, skills, notes, goals, tasks';
COMMENT ON COLUMN context_files.frontmatter IS 'Parsed YAML frontmatter as JSONB';
COMMENT ON COLUMN context_files.tools_count IS 'Number of tools defined in skills file';
COMMENT ON COLUMN context_files.programs_count IS 'Number of programs defined in skills file';

COMMENT ON TABLE skills_tools IS 'Individual tool definitions from skills files';
COMMENT ON COLUMN skills_tools.parameters IS 'JSON Schema for tool parameters';

COMMENT ON TABLE skills_programs IS 'Individual program definitions from skills files';
COMMENT ON COLUMN skills_programs.steps IS 'Ordered list of program steps';

COMMENT ON FUNCTION get_skills_files IS 'List skills files by layer and source system';
COMMENT ON FUNCTION get_skills_file_detail IS 'Get full skills file with tools and programs';
COMMENT ON FUNCTION search_skills_by_tool IS 'Search skills files by tool name';
COMMENT ON FUNCTION get_entity_skills IS 'Get skills files linked to an entity';
