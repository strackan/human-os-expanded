-- Human OS Migration: Entities
-- Core entity table for people, companies, projects, goals, tasks, etc.

-- =============================================================================
-- ENTITIES TABLE
-- Universal entity table - the "who/what" of the system
-- =============================================================================
CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  slug TEXT UNIQUE,                    -- URL-friendly identifier (e.g., 'scott-leese')
  entity_type TEXT NOT NULL,           -- 'person', 'company', 'project', 'goal', 'task', 'expert'
  name TEXT NOT NULL,
  email TEXT,

  -- Flexible metadata
  metadata JSONB DEFAULT '{}',

  -- Ownership and access
  owner_id UUID,                       -- User who owns this entity
  tenant_id UUID,                      -- For multi-tenant (Renubu)
  privacy_scope TEXT NOT NULL DEFAULT 'private' CHECK (privacy_scope IN (
    'public',           -- Anyone can read
    'powerpak_published', -- Subscribers only
    'tenant',           -- Tenant members only
    'user',             -- Owner only
    'private'           -- Same as user
  )),

  -- Source system tracking (for synced entities)
  source_system TEXT,                  -- 'renubu', 'founder_os', 'guyforthat', 'powerpak', 'manual'
  source_id TEXT,                      -- Original ID in source system

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique source mapping
  CONSTRAINT entity_unique_source UNIQUE (source_system, source_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_entities_slug ON entities(slug);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_owner ON entities(owner_id);
CREATE INDEX IF NOT EXISTS idx_entities_tenant ON entities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entities_privacy ON entities(privacy_scope);
CREATE INDEX IF NOT EXISTS idx_entities_source ON entities(source_system, source_id);

-- GIN index for JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_entities_metadata ON entities USING GIN (metadata);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for entities
DROP TRIGGER IF EXISTS update_entities_updated_at ON entities;
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE entities IS 'Universal entity table for people, companies, projects, goals, tasks';
COMMENT ON COLUMN entities.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN entities.entity_type IS 'Type: person, company, project, goal, task, expert';
COMMENT ON COLUMN entities.privacy_scope IS 'Access level: public, powerpak_published, tenant, user, private';
COMMENT ON COLUMN entities.source_system IS 'Origin system for synced entities';
