-- Update features schema with proper lookups and relations
-- Phase 0.1: Feature tracking improvements

-- ============================================================================
-- LOOKUP TABLES
-- ============================================================================

-- Feature Statuses
CREATE TABLE IF NOT EXISTS feature_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO feature_statuses (slug, name, description, sort_order) VALUES
  ('underway', 'Underway', 'Currently in active development', 1),
  ('planned', 'Planned', 'Approved and scheduled for a specific release', 2),
  ('backlog', 'Backlog', 'Not yet prioritized or scheduled', 3),
  ('deferred', 'Deferred', 'Postponed with specific conditions to revisit', 4),
  ('complete', 'Complete', 'Shipped and available in production', 5),
  ('rejected', 'Rejected', 'Declined or decided not to pursue', 6),
  ('deprecated', 'Deprecated', 'Previously shipped but removed from product', 7)
ON CONFLICT (slug) DO NOTHING;

-- Feature Categories
CREATE TABLE IF NOT EXISTS feature_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO feature_categories (slug, name, description) VALUES
  ('workflow', 'Workflow', 'Core workflow functionality'),
  ('integration', 'Integration', 'External system integrations'),
  ('ai', 'AI', 'AI-powered features and intelligence'),
  ('ux', 'UX', 'User experience improvements'),
  ('infrastructure', 'Infrastructure', 'Platform and backend capabilities'),
  ('artifacts', 'Artifacts', 'Reusable UI components and templates'),
  ('views_dashboards', 'Views & Dashboards', 'New pages, layouts, and dashboard features')
ON CONFLICT (slug) DO NOTHING;

-- Release Statuses
CREATE TABLE IF NOT EXISTS release_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO release_statuses (slug, name, description, sort_order) VALUES
  ('planning', 'Planning', 'Release is being planned', 1),
  ('in_progress', 'In Progress', 'Release work is underway', 2),
  ('complete', 'Complete', 'Release has shipped to production', 3),
  ('cancelled', 'Cancelled', 'Release was cancelled', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- RELEASES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status_id UUID REFERENCES release_statuses(id),

  -- Internal phase tracking (lightweight grouping)
  phase_number INTEGER,

  -- Timeline
  planned_start DATE,
  planned_end DATE,
  actual_shipped TIMESTAMPTZ,

  -- Description
  description TEXT,
  release_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing releases table from documentation_system.sql)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'releases' AND column_name = 'name') THEN
    ALTER TABLE releases ADD COLUMN name TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'releases' AND column_name = 'status_id') THEN
    ALTER TABLE releases ADD COLUMN status_id UUID REFERENCES release_statuses(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'releases' AND column_name = 'phase_number') THEN
    ALTER TABLE releases ADD COLUMN phase_number INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'releases' AND column_name = 'planned_start') THEN
    ALTER TABLE releases ADD COLUMN planned_start DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'releases' AND column_name = 'planned_end') THEN
    ALTER TABLE releases ADD COLUMN planned_end DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'releases' AND column_name = 'actual_shipped') THEN
    ALTER TABLE releases ADD COLUMN actual_shipped TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'releases' AND column_name = 'description') THEN
    ALTER TABLE releases ADD COLUMN description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'releases' AND column_name = 'release_notes') THEN
    ALTER TABLE releases ADD COLUMN release_notes TEXT;
  END IF;
END $$;

-- Create trigger for updated_at (if not exists)
DROP TRIGGER IF EXISTS update_releases_updated_at ON releases;
CREATE TRIGGER update_releases_updated_at
  BEFORE UPDATE ON releases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update release_date constraint to allow NULL
ALTER TABLE releases ALTER COLUMN release_date DROP NOT NULL;

-- Initial releases
INSERT INTO releases (version, name, status_id, phase_number, planned_start, actual_shipped, description, release_date) VALUES
  (
    '0.0',
    'Sprint 0: Auth & Infrastructure',
    (SELECT id FROM release_statuses WHERE slug = 'complete'),
    0,
    '2025-11-01',
    '2025-11-05',
    'Force-enable demo mode, auth debugging, timeout detection, signin redirect fixes',
    '2025-11-05'
  ),
  (
    '0.1',
    'MCP Foundation & Documentation',
    (SELECT id FROM release_statuses WHERE slug = 'complete'),
    0,
    '2025-11-06',
    '2025-11-08',
    'MCP server with 8 core operations, documentation system, feature tracking, 11 living documents',
    '2025-11-08'
  ),
  (
    '0.2',
    'MCP Registry & Integrations',
    (SELECT id FROM release_statuses WHERE slug = 'planning'),
    0,
    '2026-01-01',
    NULL,
    'Google Calendar, Slack, Gmail integrations via MCP marketplace',
    NULL
  ),
  (
    '1.0',
    'Workflow Snoozing',
    (SELECT id FROM release_statuses WHERE slug = 'planning'),
    1,
    '2025-11-25',
    NULL,
    'Core product promise: condition-based workflow snoozing with smart wake logic',
    NULL
  ),
  (
    '2.0',
    'Parking Lot',
    (SELECT id FROM release_statuses WHERE slug = 'planning'),
    2,
    '2026-01-06',
    NULL,
    'Quick capture for non-time-sensitive ideas without cluttering active workflows',
    NULL
  ),
  (
    '3.0',
    'Human OS Check-Ins',
    (SELECT id FROM release_statuses WHERE slug = 'planning'),
    3,
    '2026-02-03',
    NULL,
    'Learning loop: system discovers what works for each user. Premium pricing justification.',
    NULL
  )
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- UPDATE FEATURES TABLE
-- ============================================================================

-- Drop existing features table if it exists
DROP TABLE IF EXISTS feature_updates CASCADE;
DROP TABLE IF EXISTS features CASCADE;

-- Create updated features table
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,

  -- Foreign keys to lookups
  status_id UUID NOT NULL REFERENCES feature_statuses(id),
  category_id UUID REFERENCES feature_categories(id),
  release_id UUID REFERENCES releases(id),

  -- Numeric fields
  priority INTEGER,
  effort_hrs INTEGER,

  -- Dependencies (array of feature IDs)
  depends_on UUID[] DEFAULT ARRAY[]::UUID[],

  -- Text fields
  business_case TEXT,
  technical_approach TEXT,
  success_criteria TEXT[],
  deferred_reason TEXT,
  deferred_conditions TEXT,

  -- Customer tracking
  requested_by_customers UUID[],

  -- Approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Shipping
  shipped_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE TRIGGER update_features_updated_at
  BEFORE UPDATE ON features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index on status for common queries
CREATE INDEX idx_features_status ON features(status_id);
CREATE INDEX idx_features_release ON features(release_id);
CREATE INDEX idx_features_category ON features(category_id);

-- ============================================================================
-- FEATURE UPDATES LOG
-- ============================================================================

CREATE TABLE feature_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,

  -- Track what changed
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,

  -- Who made the change
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for querying feature history
CREATE INDEX idx_feature_updates_feature ON feature_updates(feature_id);
CREATE INDEX idx_feature_updates_created ON feature_updates(created_at DESC);

-- ============================================================================
-- VALIDATION FUNCTION
-- ============================================================================

-- Ensure planned/underway/complete features have a release
CREATE OR REPLACE FUNCTION validate_feature_release()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if status requires release
  IF NEW.status_id IN (
    SELECT id FROM feature_statuses
    WHERE slug IN ('planned', 'underway', 'complete')
  ) AND NEW.release_id IS NULL THEN
    RAISE EXCEPTION 'Features with status planned/underway/complete must have a release_id';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_feature_release_trigger
  BEFORE INSERT OR UPDATE ON features
  FOR EACH ROW
  EXECUTE FUNCTION validate_feature_release();

-- ============================================================================
-- AUTO-LOG STATUS CHANGES
-- ============================================================================

CREATE OR REPLACE FUNCTION log_feature_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
    INSERT INTO feature_updates (
      feature_id,
      field_changed,
      old_value,
      new_value
    ) VALUES (
      NEW.id,
      'status_id',
      (SELECT name FROM feature_statuses WHERE id = OLD.status_id),
      (SELECT name FROM feature_statuses WHERE id = NEW.status_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_feature_status_change_trigger
  AFTER UPDATE ON features
  FOR EACH ROW
  EXECUTE FUNCTION log_feature_status_change();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE feature_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_updates ENABLE ROW LEVEL SECURITY;

-- Lookup tables: everyone can read
CREATE POLICY "Feature statuses are viewable by authenticated users"
  ON feature_statuses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Feature categories are viewable by authenticated users"
  ON feature_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Release statuses are viewable by authenticated users"
  ON release_statuses FOR SELECT
  TO authenticated
  USING (true);

-- Releases: authenticated can read
CREATE POLICY "Releases are viewable by authenticated users"
  ON releases FOR SELECT
  TO authenticated
  USING (true);

-- Features: authenticated can read
CREATE POLICY "Features are viewable by authenticated users"
  ON features FOR SELECT
  TO authenticated
  USING (true);

-- Feature updates: authenticated can read
CREATE POLICY "Feature updates are viewable by authenticated users"
  ON feature_updates FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get feature status slug by ID
CREATE OR REPLACE FUNCTION get_feature_status_slug(status_id UUID)
RETURNS TEXT AS $$
  SELECT slug FROM feature_statuses WHERE id = status_id;
$$ LANGUAGE SQL STABLE;

-- Get release version by ID
CREATE OR REPLACE FUNCTION get_release_version(release_id UUID)
RETURNS TEXT AS $$
  SELECT version FROM releases WHERE id = release_id;
$$ LANGUAGE SQL STABLE;

-- Get category slug by ID
CREATE OR REPLACE FUNCTION get_category_slug(category_id UUID)
RETURNS TEXT AS $$
  SELECT slug FROM feature_categories WHERE id = category_id;
$$ LANGUAGE SQL STABLE;
