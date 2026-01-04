-- Parking Lot System: Intelligent Multi-Modal Idea Capture
-- Phase 0.1.7: Personal productivity feature with LLM enhancement and event triggers
--
-- Parking lot items are special "workflows" that use the same event-based trigger
-- system as corporate workflows, but for personal productivity and idea management.

-- ============================================================================
-- PARKING LOT CATEGORIES TABLE
-- ============================================================================
-- User-defined categories for organizing ideas
-- Includes default categories (business-ideas, customer-opportunities, etc.)

CREATE TABLE parking_lot_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Category details
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,                              -- Hex color for UI (e.g., '#3B82F6')
  icon TEXT,                               -- Emoji or icon name

  -- Metadata
  is_default BOOLEAN DEFAULT false,        -- System-provided defaults
  usage_count INTEGER DEFAULT 0,           -- Track popularity

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, name)
);

-- Indexes
CREATE INDEX idx_parking_lot_categories_user ON parking_lot_categories(user_id);
CREATE INDEX idx_parking_lot_categories_usage ON parking_lot_categories(usage_count DESC);

-- ============================================================================
-- PARKING LOT ITEMS TABLE
-- ============================================================================
-- Core table for idea capture with LLM enhancement and event triggers
-- These are "special workflows" that leverage the same trigger system

CREATE TABLE parking_lot_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- =========================================================================
  -- CONTENT
  -- =========================================================================
  raw_input TEXT NOT NULL,                 -- Original user input
  cleaned_text TEXT NOT NULL,              -- LLM-parsed/cleaned version

  -- =========================================================================
  -- MODE DETECTION (NEW: Core feature)
  -- =========================================================================
  -- Modes: project, expand, brainstorm, passive
  -- Determined by magic keywords: "Renubu", "Project eyes", "Brainstorm", "Expand"
  capture_mode TEXT NOT NULL DEFAULT 'passive'
    CHECK (capture_mode IN ('project', 'expand', 'brainstorm', 'passive')),

  -- =========================================================================
  -- INTELLIGENCE LAYER (LLM Enhancement)
  -- =========================================================================
  extracted_entities JSONB DEFAULT '{}'::jsonb,  -- {customers, contacts, workflows, dates, topics}
  suggested_categories TEXT[] DEFAULT '{}',      -- LLM-suggested categories
  user_categories TEXT[] DEFAULT '{}',           -- User-confirmed categories

  -- =========================================================================
  -- READINESS SCORING (Smart Prioritization)
  -- =========================================================================
  -- 0-100: How ready is this idea to act on?
  readiness_score INTEGER DEFAULT 0
    CHECK (readiness_score >= 0 AND readiness_score <= 100),

  -- Breakdown: informationCompleteness, urgency, potentialImpact, effortEstimate
  readiness_factors JSONB DEFAULT '{}'::jsonb,

  -- =========================================================================
  -- WORKFLOW MAPPING (Project Mode)
  -- =========================================================================
  -- Maps idea to potential Renubu workflows
  -- [{workflow_config_id, confidence, requiredData}]
  potential_workflows JSONB DEFAULT '[]'::jsonb,

  -- =========================================================================
  -- WAKE TRIGGERS (Event-Based Surfacing)
  -- =========================================================================
  -- CRITICAL: Reuses workflow trigger infrastructure!
  -- Event types: risk_score_threshold, opportunity_score_threshold,
  --              days_to_renewal, workflow_milestone, lighter_day
  wake_triggers JSONB DEFAULT '[]'::jsonb,
  last_evaluated_at TIMESTAMPTZ,
  trigger_fired_at TIMESTAMPTZ,
  fired_trigger_type TEXT,                 -- Which trigger fired

  -- =========================================================================
  -- BRAINSTORM MODE (Interactive Q&A)
  -- =========================================================================
  brainstorm_questions JSONB,              -- Pre-generated questions from LLM
  brainstorm_answers JSONB,                -- User answers collected during interaction
  brainstorm_completed_at TIMESTAMPTZ,

  -- Smart timing for brainstorm
  brainstorm_prefer_lighter_day BOOLEAN DEFAULT false,  -- Wait for low workflow load
  brainstorm_urgency FLOAT DEFAULT 0.0,    -- Escalates if delayed (0.0-1.0)

  -- =========================================================================
  -- EXPANSION (Expand Mode)
  -- =========================================================================
  -- LLM-generated deep analysis with objectives
  expanded_analysis JSONB,                 -- {background, opportunities, risks, actionPlan}
  expanded_at TIMESTAMPTZ,

  -- Shareable artifact generation
  artifact_generated BOOLEAN DEFAULT false,
  artifact_data JSONB,                     -- Generated document/proposal

  -- =========================================================================
  -- RELATIONSHIPS
  -- =========================================================================
  related_ideas UUID[],                    -- Related parking lot items
  related_workflows UUID[],                -- Linked to actual workflow executions
  related_customers UUID[],                -- Associated customers

  -- =========================================================================
  -- STATUS TRACKING
  -- =========================================================================
  source TEXT NOT NULL
    CHECK (source IN ('manual', 'voice', 'chat_snippet', 'email_snippet', 'api')),

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expanded', 'brainstorming', 'converted', 'archived')),

  -- Track what it became when converted
  converted_to JSONB,                      -- {type: 'workflow'|'task'|'reminder', id, convertedAt}

  -- =========================================================================
  -- TIMESTAMPS
  -- =========================================================================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Core queries
CREATE INDEX idx_parking_lot_user_status ON parking_lot_items(user_id, status);
CREATE INDEX idx_parking_lot_mode ON parking_lot_items(capture_mode) WHERE status = 'active';

-- Readiness-based sorting
CREATE INDEX idx_parking_lot_readiness ON parking_lot_items(readiness_score DESC)
  WHERE status = 'active';

-- Category filtering (GIN for array containment)
CREATE INDEX idx_parking_lot_categories ON parking_lot_items USING gin(user_categories);
CREATE INDEX idx_parking_lot_suggested_categories ON parking_lot_items USING gin(suggested_categories);

-- Entity search (GIN for JSONB)
CREATE INDEX idx_parking_lot_entities ON parking_lot_items USING gin(extracted_entities);

-- Trigger evaluation (for daily cron)
CREATE INDEX idx_parking_lot_triggers ON parking_lot_items(last_evaluated_at)
  WHERE wake_triggers IS NOT NULL
    AND wake_triggers != '[]'::jsonb
    AND status = 'active';

-- Brainstorm queue (find items ready for Q&A)
CREATE INDEX idx_parking_lot_brainstorm ON parking_lot_items(created_at)
  WHERE capture_mode = 'brainstorm'
    AND brainstorm_completed_at IS NULL
    AND status = 'active';

-- Relationships
CREATE INDEX idx_parking_lot_related_workflows ON parking_lot_items USING gin(related_workflows);
CREATE INDEX idx_parking_lot_related_customers ON parking_lot_items USING gin(related_customers);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE parking_lot_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_lot_items ENABLE ROW LEVEL SECURITY;

-- Categories: Users manage their own categories
CREATE POLICY "Users can manage own categories"
  ON parking_lot_categories
  FOR ALL
  USING (auth.uid() = user_id);

-- Parking lot items: Users manage their own ideas
CREATE POLICY "Users can manage own parking lot items"
  ON parking_lot_items
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE TRIGGER parking_lot_items_updated_at
  BEFORE UPDATE ON parking_lot_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER parking_lot_categories_updated_at
  BEFORE UPDATE ON parking_lot_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Get items ready for trigger evaluation
-- ============================================================================
-- Used by daily cron job to find parking lot items with wake triggers

CREATE OR REPLACE FUNCTION get_parking_lot_items_for_evaluation(
  p_evaluation_interval_minutes INTEGER DEFAULT 1440  -- 24 hours
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  cleaned_text TEXT,
  capture_mode TEXT,
  wake_triggers JSONB,
  last_evaluated_at TIMESTAMPTZ,
  readiness_score INTEGER,
  brainstorm_prefer_lighter_day BOOLEAN,
  extracted_entities JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pli.id,
    pli.user_id,
    pli.cleaned_text,
    pli.capture_mode,
    pli.wake_triggers,
    pli.last_evaluated_at,
    pli.readiness_score,
    pli.brainstorm_prefer_lighter_day,
    pli.extracted_entities
  FROM parking_lot_items pli
  WHERE pli.status = 'active'
    AND pli.wake_triggers IS NOT NULL
    AND pli.wake_triggers != '[]'::jsonb
    AND (
      pli.last_evaluated_at IS NULL
      OR pli.last_evaluated_at < NOW() - (p_evaluation_interval_minutes || ' minutes')::INTERVAL
    )
  ORDER BY pli.last_evaluated_at NULLS FIRST
  LIMIT 100;
END;
$$;

-- ============================================================================
-- FUNCTION: Increment category usage count
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_category_usage(
  p_user_id UUID,
  p_category_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE parking_lot_categories
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND name = p_category_name;
END;
$$;

-- ============================================================================
-- FUNCTION: Seed default categories for new user
-- ============================================================================

CREATE OR REPLACE FUNCTION seed_default_parking_lot_categories(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO parking_lot_categories (user_id, name, description, color, icon, is_default)
  VALUES
    (p_user_id, 'business-ideas', 'New business opportunities and ideas', '#8B5CF6', '💡', true),
    (p_user_id, 'customer-opportunities', 'Upsell, expansion, and engagement ideas', '#10B981', '📈', true),
    (p_user_id, 'product-feedback', 'Feature requests and product improvements', '#3B82F6', '🎯', true),
    (p_user_id, 'personal-projects', 'Side projects and learning goals', '#F59E0B', '🚀', true),
    (p_user_id, 'team-ideas', 'Process improvements and team initiatives', '#EF4444', '👥', true)
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE parking_lot_items IS 'Intelligent idea capture system with LLM enhancement, mode detection, and event-based wake triggers. Parking lot items are "special workflows" for personal productivity.';
COMMENT ON TABLE parking_lot_categories IS 'User-defined categories for organizing parking lot ideas';

COMMENT ON COLUMN parking_lot_items.capture_mode IS 'project=convert to workflow, expand=LLM analysis, brainstorm=interactive Q&A, passive=indefinite storage';
COMMENT ON COLUMN parking_lot_items.wake_triggers IS 'Event-based triggers (risk scores, renewal proximity, workflow milestones, lighter days) that surface ideas at the right time';
COMMENT ON COLUMN parking_lot_items.readiness_score IS '0-100 score indicating how ready this idea is to act on (information completeness, urgency, impact, effort)';
COMMENT ON COLUMN parking_lot_items.brainstorm_prefer_lighter_day IS 'Wait for days with lower workflow load before surfacing brainstorm Q&A';
