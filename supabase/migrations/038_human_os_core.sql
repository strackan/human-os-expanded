-- Human OS Core Schema
-- The Context Engine foundation that other schemas (gft, renubu) reference
-- Handles: canonical entities, context files, knowledge graph, access/sharing

-- =============================================================================
-- CREATE SCHEMA
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS human_os;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Entity types
DO $$ BEGIN
  CREATE TYPE human_os.entity_type AS ENUM ('person', 'company', 'project');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Context file types
DO $$ BEGIN
  CREATE TYPE human_os.file_type AS ENUM (
    'linkedin_posts',
    'voice_profile',
    'frameworks',
    'notes',
    'raw_text'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Resource types for access grants
DO $$ BEGIN
  CREATE TYPE human_os.resource_type AS ENUM (
    'voice_os',
    'founder_os',
    'context_files'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Access levels
DO $$ BEGIN
  CREATE TYPE human_os.access_level AS ENUM ('full', 'limited', 'preview');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- ENTITIES TABLE
-- Canonical storage for people, companies, projects
-- =============================================================================
CREATE TABLE IF NOT EXISTS human_os.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type human_os.entity_type NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  canonical_name TEXT NOT NULL,
  linkedin_url TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_human_os_entities_type ON human_os.entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_human_os_entities_slug ON human_os.entities(slug);
CREATE INDEX IF NOT EXISTS idx_human_os_entities_linkedin ON human_os.entities(linkedin_url) WHERE linkedin_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_human_os_entities_name ON human_os.entities(canonical_name);

-- =============================================================================
-- CONTEXT FILES TABLE
-- Unstructured context attached to entities
-- =============================================================================
CREATE TABLE IF NOT EXISTS human_os.context_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES human_os.entities(id) ON DELETE CASCADE,
  file_type human_os.file_type NOT NULL,
  content TEXT NOT NULL,
  llm_summary TEXT,
  source TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_human_os_context_files_entity ON human_os.context_files(entity_id);
CREATE INDEX IF NOT EXISTS idx_human_os_context_files_type ON human_os.context_files(file_type);
CREATE INDEX IF NOT EXISTS idx_human_os_context_files_entity_type ON human_os.context_files(entity_id, file_type);

-- =============================================================================
-- ENTITY LINKS TABLE
-- Knowledge graph: relationships between entities
-- =============================================================================
CREATE TABLE IF NOT EXISTS human_os.entity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID NOT NULL REFERENCES human_os.entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES human_os.entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate links
  UNIQUE(source_entity_id, target_entity_id, relationship_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_human_os_entity_links_source ON human_os.entity_links(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_human_os_entity_links_target ON human_os.entity_links(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_human_os_entity_links_type ON human_os.entity_links(relationship_type);

-- =============================================================================
-- ACCESS GRANTS TABLE
-- Network layer: sharing and permissions between entities
-- =============================================================================
CREATE TABLE IF NOT EXISTS human_os.access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grantor_entity_id UUID NOT NULL REFERENCES human_os.entities(id) ON DELETE CASCADE,
  grantee_entity_id UUID NOT NULL REFERENCES human_os.entities(id) ON DELETE CASCADE,
  resource_type human_os.resource_type NOT NULL,
  access_level human_os.access_level NOT NULL DEFAULT 'preview',
  promo_code TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate grants for same resource
  UNIQUE(grantor_entity_id, grantee_entity_id, resource_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_human_os_access_grants_grantor ON human_os.access_grants(grantor_entity_id);
CREATE INDEX IF NOT EXISTS idx_human_os_access_grants_grantee ON human_os.access_grants(grantee_entity_id);
CREATE INDEX IF NOT EXISTS idx_human_os_access_grants_resource ON human_os.access_grants(resource_type);
CREATE INDEX IF NOT EXISTS idx_human_os_access_grants_promo ON human_os.access_grants(promo_code) WHERE promo_code IS NOT NULL;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamps
DROP TRIGGER IF EXISTS update_human_os_entities_updated_at ON human_os.entities;
CREATE TRIGGER update_human_os_entities_updated_at BEFORE UPDATE ON human_os.entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_human_os_context_files_updated_at ON human_os.context_files;
CREATE TRIGGER update_human_os_context_files_updated_at BEFORE UPDATE ON human_os.context_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE human_os.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_os.context_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_os.entity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_os.access_grants ENABLE ROW LEVEL SECURITY;

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access" ON human_os.entities;
CREATE POLICY "Service role full access" ON human_os.entities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON human_os.context_files;
CREATE POLICY "Service role full access" ON human_os.context_files
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON human_os.entity_links;
CREATE POLICY "Service role full access" ON human_os.entity_links
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON human_os.access_grants;
CREATE POLICY "Service role full access" ON human_os.access_grants
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read entities (public directory)
DROP POLICY IF EXISTS "Authenticated can read entities" ON human_os.entities;
CREATE POLICY "Authenticated can read entities" ON human_os.entities
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can read entity links (public graph)
DROP POLICY IF EXISTS "Authenticated can read entity links" ON human_os.entity_links;
CREATE POLICY "Authenticated can read entity links" ON human_os.entity_links
  FOR SELECT TO authenticated USING (true);

-- Context files: only accessible via grants or if you own the entity
-- (This is a simplified policy - expand based on your auth model)
DROP POLICY IF EXISTS "Authenticated can read own context files" ON human_os.context_files;
CREATE POLICY "Authenticated can read own context files" ON human_os.context_files
  FOR SELECT TO authenticated USING (true);

-- Access grants: grantors and grantees can see their grants
DROP POLICY IF EXISTS "Authenticated can read grants" ON human_os.access_grants;
CREATE POLICY "Authenticated can read grants" ON human_os.access_grants
  FOR SELECT TO authenticated USING (true);

-- =============================================================================
-- GRANTS
-- =============================================================================

-- Schema usage
GRANT USAGE ON SCHEMA human_os TO anon, authenticated, service_role;

-- Table permissions for service_role (full access)
GRANT ALL ON ALL TABLES IN SCHEMA human_os TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA human_os TO service_role;

-- Table permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA human_os TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA human_os TO authenticated;

-- Table permissions for anon (read-only on entities/links)
GRANT SELECT ON human_os.entities TO anon;
GRANT SELECT ON human_os.entity_links TO anon;

-- Future tables get same grants
ALTER DEFAULT PRIVILEGES IN SCHEMA human_os GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA human_os GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA human_os GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA human_os GRANT USAGE ON SEQUENCES TO authenticated;

-- =============================================================================
-- EXPOSE SCHEMA TO POSTGREST
-- =============================================================================

DO $$
BEGIN
  EXECUTE 'ALTER ROLE authenticator SET pgrst.db_schemas TO ''public,graphql_public,founder_os,gft,human_os''';
  NOTIFY pgrst, 'reload config';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update pgrst.db_schemas: %. Manual configuration may be required.', SQLERRM;
END $$;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to create or get an entity by linkedin_url
CREATE OR REPLACE FUNCTION human_os.get_or_create_entity(
  p_entity_type human_os.entity_type,
  p_canonical_name TEXT,
  p_linkedin_url TEXT DEFAULT NULL,
  p_slug TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_entity_id UUID;
  v_slug TEXT;
BEGIN
  -- Try to find by linkedin_url first
  IF p_linkedin_url IS NOT NULL THEN
    SELECT id INTO v_entity_id
    FROM human_os.entities
    WHERE linkedin_url = p_linkedin_url;

    IF v_entity_id IS NOT NULL THEN
      RETURN v_entity_id;
    END IF;
  END IF;

  -- Generate slug if not provided
  v_slug := COALESCE(p_slug, LOWER(REGEXP_REPLACE(p_canonical_name, '[^a-zA-Z0-9]+', '-', 'g')));

  -- Try to find by slug
  SELECT id INTO v_entity_id
  FROM human_os.entities
  WHERE slug = v_slug;

  IF v_entity_id IS NOT NULL THEN
    RETURN v_entity_id;
  END IF;

  -- Create new entity
  INSERT INTO human_os.entities (entity_type, slug, canonical_name, linkedin_url)
  VALUES (p_entity_type, v_slug, p_canonical_name, p_linkedin_url)
  RETURNING id INTO v_entity_id;

  RETURN v_entity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to link two entities
CREATE OR REPLACE FUNCTION human_os.link_entities(
  p_source_id UUID,
  p_target_id UUID,
  p_relationship_type TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_link_id UUID;
BEGIN
  INSERT INTO human_os.entity_links (source_entity_id, target_entity_id, relationship_type, metadata)
  VALUES (p_source_id, p_target_id, p_relationship_type, p_metadata)
  ON CONFLICT (source_entity_id, target_entity_id, relationship_type) DO UPDATE
    SET metadata = EXCLUDED.metadata
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql;

-- Function to grant access
CREATE OR REPLACE FUNCTION human_os.grant_access(
  p_grantor_id UUID,
  p_grantee_id UUID,
  p_resource_type human_os.resource_type,
  p_access_level human_os.access_level DEFAULT 'preview',
  p_promo_code TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_grant_id UUID;
BEGIN
  INSERT INTO human_os.access_grants (
    grantor_entity_id, grantee_entity_id, resource_type, access_level, promo_code, expires_at
  )
  VALUES (p_grantor_id, p_grantee_id, p_resource_type, p_access_level, p_promo_code, p_expires_at)
  ON CONFLICT (grantor_entity_id, grantee_entity_id, resource_type) DO UPDATE
    SET access_level = EXCLUDED.access_level,
        promo_code = EXCLUDED.promo_code,
        expires_at = EXCLUDED.expires_at
  RETURNING id INTO v_grant_id;

  RETURN v_grant_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION human_os.get_or_create_entity TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.link_entities TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.grant_access TO authenticated, service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON SCHEMA human_os IS 'Context Engine foundation - canonical entities, context files, knowledge graph, access control';

COMMENT ON TABLE human_os.entities IS 'Canonical storage for people, companies, and projects';
COMMENT ON COLUMN human_os.entities.slug IS 'Human-readable unique identifier';
COMMENT ON COLUMN human_os.entities.linkedin_url IS 'LinkedIn profile/company URL for deduplication';

COMMENT ON TABLE human_os.context_files IS 'Unstructured context attached to entities';
COMMENT ON COLUMN human_os.context_files.content IS 'The actual unstructured content';
COMMENT ON COLUMN human_os.context_files.llm_summary IS 'AI-generated synthesis of content';
COMMENT ON COLUMN human_os.context_files.source IS 'Where the content came from';

COMMENT ON TABLE human_os.entity_links IS 'Knowledge graph: relationships between entities';
COMMENT ON COLUMN human_os.entity_links.relationship_type IS 'Type of relationship: works_at, knows, collaborated_with, etc.';

COMMENT ON TABLE human_os.access_grants IS 'Network layer: sharing and permissions between entities';
COMMENT ON COLUMN human_os.access_grants.grantor_entity_id IS 'Entity sharing access';
COMMENT ON COLUMN human_os.access_grants.grantee_entity_id IS 'Entity receiving access';
COMMENT ON COLUMN human_os.access_grants.promo_code IS 'Optional promo code for tracking';

COMMENT ON FUNCTION human_os.get_or_create_entity IS 'Find entity by linkedin_url/slug or create new one';
COMMENT ON FUNCTION human_os.link_entities IS 'Create or update a relationship between entities';
COMMENT ON FUNCTION human_os.grant_access IS 'Grant access to a resource between entities';
