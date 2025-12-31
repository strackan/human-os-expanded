-- 054_context_graph.sql
-- Replace contexts table with a knowledge graph context linking table
-- Any entity can have context, and context_slug groups related entities

-- =============================================================================
-- NEW CONTEXT TABLE (Knowledge Graph Style)
-- =============================================================================

CREATE TABLE IF NOT EXISTS human_os.context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What object is being given context
  object_uuid UUID NOT NULL,
  object_type TEXT NOT NULL,  -- 'relationship', 'entity', 'task', 'project', 'goal', etc.

  -- Context grouping (slug for the context domain)
  context_slug TEXT NOT NULL,  -- e.g., 'marriage', 'renubu', 'good-hang'

  -- The actual context/notes
  notes TEXT,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  active BOOLEAN NOT NULL DEFAULT true,

  -- Layer scoping
  layer TEXT NOT NULL DEFAULT 'public',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one context entry per object per context_slug per layer
  UNIQUE(layer, object_uuid, context_slug)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Find all objects in a context
CREATE INDEX idx_context_slug ON human_os.context(context_slug);

-- Find all context for an object
CREATE INDEX idx_context_object ON human_os.context(object_uuid);

-- Filter by type
CREATE INDEX idx_context_type ON human_os.context(object_type);

-- Active context only
CREATE INDEX idx_context_active ON human_os.context(active) WHERE active = true;

-- Layer scoping
CREATE INDEX idx_context_layer ON human_os.context(layer);

-- Composite for common queries
CREATE INDEX idx_context_slug_active ON human_os.context(context_slug, active);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER context_updated_at
  BEFORE UPDATE ON human_os.context
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE human_os.context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "context_service_all" ON human_os.context
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "context_read_policy" ON human_os.context
  FOR SELECT TO authenticated
  USING (layer = 'public' OR layer LIKE 'founder:%');

CREATE POLICY "context_write_policy" ON human_os.context
  FOR INSERT TO authenticated
  WITH CHECK (layer = 'public' OR layer LIKE 'founder:%');

CREATE POLICY "context_update_policy" ON human_os.context
  FOR UPDATE TO authenticated
  USING (layer = 'public' OR layer LIKE 'founder:%');

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get all context for a specific object
CREATE OR REPLACE FUNCTION human_os.get_object_context(
  p_object_uuid UUID,
  p_layer TEXT DEFAULT 'public',
  p_active_only BOOLEAN DEFAULT true
) RETURNS TABLE (
  id UUID,
  context_slug TEXT,
  notes TEXT,
  status TEXT,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) LANGUAGE sql STABLE AS $$
  SELECT id, context_slug, notes, status, active, created_at, updated_at
  FROM human_os.context
  WHERE object_uuid = p_object_uuid
    AND (layer = 'public' OR layer = p_layer)
    AND (NOT p_active_only OR active = true)
  ORDER BY context_slug;
$$;

-- Get all objects in a context
CREATE OR REPLACE FUNCTION human_os.get_context_members(
  p_context_slug TEXT,
  p_layer TEXT DEFAULT 'public',
  p_object_type TEXT DEFAULT NULL,
  p_active_only BOOLEAN DEFAULT true
) RETURNS TABLE (
  id UUID,
  object_uuid UUID,
  object_type TEXT,
  notes TEXT,
  status TEXT,
  active BOOLEAN
) LANGUAGE sql STABLE AS $$
  SELECT id, object_uuid, object_type, notes, status, active
  FROM human_os.context
  WHERE context_slug = p_context_slug
    AND (layer = 'public' OR layer = p_layer)
    AND (p_object_type IS NULL OR object_type = p_object_type)
    AND (NOT p_active_only OR active = true)
  ORDER BY object_type, created_at;
$$;

-- List all context slugs (distinct contexts)
CREATE OR REPLACE FUNCTION human_os.list_context_slugs(
  p_layer TEXT DEFAULT 'public',
  p_active_only BOOLEAN DEFAULT true
) RETURNS TABLE (
  context_slug TEXT,
  member_count BIGINT,
  object_types TEXT[]
) LANGUAGE sql STABLE AS $$
  SELECT
    context_slug,
    COUNT(*) as member_count,
    ARRAY_AGG(DISTINCT object_type) as object_types
  FROM human_os.context
  WHERE (layer = 'public' OR layer = p_layer)
    AND (NOT p_active_only OR active = true)
  GROUP BY context_slug
  ORDER BY context_slug;
$$;

-- Add or update context for an object (upsert)
CREATE OR REPLACE FUNCTION human_os.set_context(
  p_object_uuid UUID,
  p_object_type TEXT,
  p_context_slug TEXT,
  p_notes TEXT DEFAULT NULL,
  p_layer TEXT DEFAULT 'public',
  p_active BOOLEAN DEFAULT true
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO human_os.context (object_uuid, object_type, context_slug, notes, layer, active, status)
  VALUES (p_object_uuid, p_object_type, p_context_slug, p_notes, p_layer, p_active,
          CASE WHEN p_active THEN 'active' ELSE 'inactive' END)
  ON CONFLICT (layer, object_uuid, context_slug) DO UPDATE SET
    notes = COALESCE(EXCLUDED.notes, human_os.context.notes),
    active = EXCLUDED.active,
    status = CASE WHEN EXCLUDED.active THEN 'active' ELSE 'inactive' END,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Deactivate context (soft delete)
CREATE OR REPLACE FUNCTION human_os.deactivate_context(
  p_object_uuid UUID,
  p_context_slug TEXT,
  p_layer TEXT DEFAULT 'public'
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE human_os.context
  SET active = false, status = 'inactive', updated_at = NOW()
  WHERE object_uuid = p_object_uuid
    AND context_slug = p_context_slug
    AND layer = p_layer;
END;
$$;

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON human_os.context TO authenticated;
GRANT ALL ON human_os.context TO service_role;

GRANT EXECUTE ON FUNCTION human_os.get_object_context TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.get_context_members TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.list_context_slugs TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.set_context TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.deactivate_context TO authenticated, service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE human_os.context IS
  'Knowledge graph context linking - any entity can have context, context_slug groups related entities';

COMMENT ON COLUMN human_os.context.object_uuid IS
  'UUID of the entity being given context (relationship, entity, task, project, etc.)';

COMMENT ON COLUMN human_os.context.context_slug IS
  'Slug grouping related entities (e.g., marriage, renubu, good-hang)';

COMMENT ON FUNCTION human_os.get_object_context IS
  'Get all context entries for a specific object UUID';

COMMENT ON FUNCTION human_os.get_context_members IS
  'Get all objects that share a context_slug';
