-- Documentation System: Database-First Knowledge Management
-- Phase 0.1: Foundation for versioned, searchable documentation
-- Supports: Internal docs, customer help articles, release tracking

-- ============================================================================
-- CORE DOCUMENTATION TABLE
-- ============================================================================

CREATE TABLE documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  slug TEXT UNIQUE NOT NULL,              -- e.g., "workflow-snoozing-overview"
  title TEXT NOT NULL,
  content TEXT NOT NULL,                  -- Markdown content
  category TEXT NOT NULL,                 -- "feature", "guide", "api", "architecture"

  -- Visibility
  audience TEXT[] NOT NULL DEFAULT ARRAY['internal'],  -- ["internal", "customer", "admin"]
  publish_status TEXT DEFAULT 'draft',   -- "draft", "published", "archived"

  -- Versioning
  release_date DATE,                      -- e.g., "2025-11-15" (when it shipped)
  version TEXT,                           -- e.g., "0.1", "0.2", "1.0"
  supersedes_id UUID REFERENCES documentation(id), -- Links to previous version

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],    -- ["mcp", "workflow", "phase-0.1"]
  related_features TEXT[],                -- Links to feature slugs
  author_id UUID REFERENCES auth.users(id),

  -- Search
  search_vector tsvector,                 -- Full-text search

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documentation_slug ON documentation(slug);
CREATE INDEX idx_documentation_category ON documentation(category);
CREATE INDEX idx_documentation_publish_status ON documentation(publish_status);
CREATE INDEX idx_documentation_tags ON documentation USING gin(tags);
CREATE INDEX idx_documentation_version ON documentation(version);
CREATE INDEX idx_documentation_search ON documentation USING gin(search_vector);

-- Trigger to update search_vector
CREATE OR REPLACE FUNCTION documentation_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documentation_search_update
  BEFORE INSERT OR UPDATE ON documentation
  FOR EACH ROW EXECUTE FUNCTION documentation_search_trigger();

-- Trigger to update updated_at
CREATE TRIGGER documentation_updated_at
  BEFORE UPDATE ON documentation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERSION HISTORY TABLE
-- ============================================================================

CREATE TABLE documentation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES documentation(id) ON DELETE CASCADE,

  -- Version snapshot
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,        -- Sequential version number (1, 2, 3...)
  version_label TEXT,                     -- e.g., "0.1", "1.0", "2.0"

  -- Change tracking
  changed_by UUID REFERENCES auth.users(id),
  change_summary TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documentation_versions_doc_id ON documentation_versions(doc_id);
CREATE INDEX idx_documentation_versions_version_label ON documentation_versions(version_label);

-- ============================================================================
-- CUSTOMER HELP ARTICLES (Phase 1)
-- ============================================================================

CREATE TABLE help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID REFERENCES documentation(id), -- Links to internal doc

  -- Customer-friendly metadata
  category TEXT NOT NULL,                 -- "Getting Started", "Workflows", "Integrations"
  subcategory TEXT,
  difficulty TEXT,                        -- "beginner", "intermediate", "advanced"
  estimated_read_time INTEGER,            -- Minutes

  -- SEO
  meta_description TEXT,
  keywords TEXT[],

  -- Support
  related_articles UUID[],
  faqs JSONB,                             -- Common questions

  -- Analytics
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Timestamps
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_help_articles_category ON help_articles(category);
CREATE INDEX idx_help_articles_doc_id ON help_articles(doc_id);
CREATE INDEX idx_help_articles_published_at ON help_articles(published_at);

-- ============================================================================
-- RELEASES TABLE
-- ============================================================================

CREATE TABLE releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Release identity
  version TEXT UNIQUE NOT NULL,           -- "0.1", "0.2", "1.0", "2.0"
  release_date DATE NOT NULL,

  -- Status
  is_current BOOLEAN DEFAULT false,       -- Only one current release

  -- Metadata
  release_notes TEXT,                     -- Markdown summary
  features_shipped TEXT[],                -- Feature slugs
  docs_updated TEXT[],                    -- Doc slugs

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one current release
CREATE UNIQUE INDEX idx_releases_current ON releases(is_current) WHERE is_current = true;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

-- Documentation: Authenticated users can read all internal docs
CREATE POLICY "Users can read documentation"
  ON documentation FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Documentation: Only admins can write
CREATE POLICY "Admins can manage documentation"
  ON documentation FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Documentation versions: Authenticated users can read
CREATE POLICY "Users can read documentation versions"
  ON documentation_versions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Documentation versions: Admins can write
CREATE POLICY "Admins can manage documentation versions"
  ON documentation_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Help articles: Public read (no auth required)
CREATE POLICY "Public can read published help articles"
  ON help_articles FOR SELECT
  USING (published_at IS NOT NULL);

-- Help articles: Admins can manage
CREATE POLICY "Admins can manage help articles"
  ON help_articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Releases: Public read
CREATE POLICY "Public can read releases"
  ON releases FOR SELECT
  USING (true);

-- Releases: Admins can manage
CREATE POLICY "Admins can manage releases"
  ON releases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Create a new release snapshot
CREATE OR REPLACE FUNCTION create_release_snapshot(
  p_version TEXT,
  p_release_date DATE,
  p_doc_slugs TEXT[]
) RETURNS UUID AS $$
DECLARE
  v_release_id UUID;
  v_doc RECORD;
  v_version_number INTEGER;
BEGIN
  -- Mark all previous releases as not current
  UPDATE releases SET is_current = false WHERE is_current = true;

  -- Create new release
  INSERT INTO releases (version, release_date, is_current)
  VALUES (p_version, p_release_date, true)
  RETURNING id INTO v_release_id;

  -- Snapshot all specified documents
  FOR v_doc IN
    SELECT id, content FROM documentation
    WHERE slug = ANY(p_doc_slugs)
  LOOP
    -- Get next version number for this doc
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM documentation_versions
    WHERE doc_id = v_doc.id;

    -- Insert version snapshot
    INSERT INTO documentation_versions (
      doc_id,
      content,
      version_number,
      version_label,
      changed_by,
      change_summary
    ) VALUES (
      v_doc.id,
      v_doc.content,
      v_version_number,
      p_version,
      auth.uid(),
      'Release ' || p_version || ' snapshot'
    );

    -- Update documentation with version info
    UPDATE documentation
    SET version = p_version, release_date = p_release_date
    WHERE id = v_doc.id;
  END LOOP;

  RETURN v_release_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE documentation IS 'Core documentation table with versioning and search';
COMMENT ON TABLE documentation_versions IS 'Historical snapshots of documentation at each release';
COMMENT ON TABLE help_articles IS 'Customer-facing help articles (Phase 1+)';
COMMENT ON TABLE releases IS 'Release tracking with version snapshots';
COMMENT ON FUNCTION create_release_snapshot IS 'Create a versioned snapshot of docs for a release';
