-- Feature Tracking System: Database Registry for Product Features
-- Phase 0.1: Foundation for feature management and roadmap tracking
-- Supports: Active features, planned features, backlog, deferrals

-- ============================================================================
-- FEATURES TABLE
-- ============================================================================

CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  slug TEXT UNIQUE NOT NULL,              -- e.g., "workflow-snoozing", "custom-mcp-servers"
  title TEXT NOT NULL,
  description TEXT,

  -- Status tracking
  status TEXT NOT NULL,                   -- "active", "planned", "backlog", "deferred", "shipped"
  category TEXT,                          -- "workflow", "integration", "ai", "ux", "infrastructure"
  phase TEXT,                             -- "0.1", "0.2", "1", "2", "3", etc.

  -- Priority and effort
  priority INTEGER,                       -- 1 = highest, 5 = lowest
  effort_hours INTEGER,                   -- Estimated effort

  -- Details
  business_case TEXT,                     -- Why we're building this
  technical_approach TEXT,                -- How we'll build it
  success_criteria TEXT[],                -- How we'll know it's successful
  dependencies TEXT[],                    -- Feature slugs this depends on

  -- Decision tracking
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  deferred_reason TEXT,                   -- Why deferred (if status = deferred)
  deferred_conditions TEXT,               -- Conditions to revisit (e.g., "2+ customers request")

  -- Related content
  doc_slug TEXT,                          -- Link to documentation.slug
  related_features TEXT[],                -- Other related feature slugs

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  shipped_at TIMESTAMPTZ                  -- When feature went to production
);

-- Indexes
CREATE INDEX idx_features_slug ON features(slug);
CREATE INDEX idx_features_status ON features(status);
CREATE INDEX idx_features_category ON features(category);
CREATE INDEX idx_features_phase ON features(phase);
CREATE INDEX idx_features_priority ON features(priority);
CREATE INDEX idx_features_tags ON features USING gin(tags);

-- Trigger to update updated_at
CREATE TRIGGER features_updated_at
  BEFORE UPDATE ON features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FEATURE UPDATES TABLE (Change Log)
-- ============================================================================

CREATE TABLE feature_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,

  -- Update type
  update_type TEXT NOT NULL,              -- "status_change", "scope_change", "deferral", "approval"
  old_value JSONB,
  new_value JSONB,

  -- Context
  notes TEXT,
  updated_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feature_updates_feature_id ON feature_updates(feature_id);
CREATE INDEX idx_feature_updates_type ON feature_updates(update_type);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_updates ENABLE ROW LEVEL SECURITY;

-- Features: Authenticated users can read all features
CREATE POLICY "Users can read features"
  ON features FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Features: Admins and PMs can manage features
CREATE POLICY "Admins and PMs can manage features"
  ON features FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'pm')
    )
  );

-- Feature updates: Authenticated users can read
CREATE POLICY "Users can read feature updates"
  ON feature_updates FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Feature updates: Auto-logged (no direct writes)
CREATE POLICY "System can log feature updates"
  ON feature_updates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Log feature status change
CREATE OR REPLACE FUNCTION log_feature_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO feature_updates (
      feature_id,
      update_type,
      old_value,
      new_value,
      updated_by
    ) VALUES (
      NEW.id,
      'status_change',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log status changes
CREATE TRIGGER feature_status_change_log
  AFTER UPDATE ON features
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_feature_status_change();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE features IS 'Product feature registry with status tracking and roadmap management';
COMMENT ON TABLE feature_updates IS 'Change log for feature updates and status changes';
COMMENT ON COLUMN features.status IS 'active: in development, planned: approved for future, backlog: not prioritized, deferred: postponed with conditions, shipped: in production';
COMMENT ON COLUMN features.deferred_conditions IS 'Conditions to bring feature back from deferred status (e.g., "2+ customer requests", "post-Q1 2026")';
