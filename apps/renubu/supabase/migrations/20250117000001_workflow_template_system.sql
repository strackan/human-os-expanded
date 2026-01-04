-- ============================================================================
-- Workflow Template System
-- Part of InHerSight 0.1.9 Release
-- ============================================================================
--
-- This migration creates the workflow template system with inheritance and
-- modification support. Replaces hardcoded TypeScript workflow configs with
-- database-driven templates.
--
-- Architecture:
-- - Base templates for core journeys (renewal, contact recovery, etc.)
-- - Modifications with scope (global, company, customer, industry, segment)
-- - Priority-based application (global: 100, company: 200, customer: 300)
-- - Runtime compilation that merges template + mods + customer data
--
-- ============================================================================

-- ============================================================================
-- 1. WORKFLOW TEMPLATES (Base journeys)
-- ============================================================================
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,              -- "renewal_base"
  display_name TEXT NOT NULL,             -- "Renewal Planning"
  description TEXT,
  category TEXT,                          -- "renewal", "expansion", "contact"

  -- Base configuration (JSONB)
  base_steps JSONB NOT NULL,              -- Array of step definitions
  base_artifacts JSONB NOT NULL,          -- Artifact templates
  default_triggers JSONB,                 -- When to auto-trigger

  -- Metadata
  estimated_time_minutes INTEGER,
  pain_score INTEGER,                     -- From user feedback (1-10)
  impact_score INTEGER,                   -- Business impact (1-10)

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. WORKFLOW MODIFICATIONS (Inheritance & overrides)
-- ============================================================================
CREATE TABLE workflow_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_template_id UUID REFERENCES workflow_templates(id) ON DELETE CASCADE,

  -- Scope: Who/what gets this modification?
  scope_type TEXT NOT NULL CHECK (scope_type IN (
    'global',        -- System-wide default (e.g., all at-risk get freebie)
    'company',       -- All customers for a company (e.g., InHerSight)
    'customer',      -- Specific customer override
    'industry',      -- All in industry (e.g., Healthcare)
    'segment'        -- Custom criteria (e.g., ARR > $100K)
  )),
  scope_id UUID,                          -- customer_id, company_id, etc.
  scope_criteria JSONB,                   -- For segment/global conditions

  -- Modification type
  modification_type TEXT NOT NULL CHECK (modification_type IN (
    'add_step',                           -- Insert new step
    'remove_step',                        -- Skip step
    'replace_step',                       -- Swap step entirely
    'modify_step',                        -- Change step properties
    'add_artifact',                       -- Add artifact to step
    'remove_artifact',                    -- Remove artifact
    'change_branch_logic',                -- Alter decision tree
    'add_task_template'                   -- Link additional task
  )),

  -- What to modify
  target_step_id TEXT,                    -- Which step (if applicable)
  target_position INTEGER,                -- For add_step: insertion index

  -- The actual modification (JSONB)
  modification_data JSONB NOT NULL,

  -- Priority (application order)
  priority INTEGER DEFAULT 100,           -- Global: 100, Company: 200, Customer: 300

  -- Metadata
  reason TEXT,                            -- Why this modification exists
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_mods_template ON workflow_modifications(workflow_template_id);
CREATE INDEX idx_workflow_mods_scope ON workflow_modifications(scope_type, scope_id);
CREATE INDEX idx_workflow_mods_priority ON workflow_modifications(priority);

-- ============================================================================
-- 3. ENHANCE WORKFLOW_EXECUTIONS (Link to templates)
-- ============================================================================
ALTER TABLE workflow_executions
  ADD COLUMN IF NOT EXISTS workflow_template_id UUID REFERENCES workflow_templates(id);

ALTER TABLE workflow_executions
  ADD COLUMN IF NOT EXISTS applied_modifications UUID[];  -- Track which mods applied

ALTER TABLE workflow_executions
  ADD COLUMN IF NOT EXISTS compiled_config JSONB;         -- Cache final config

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_modifications ENABLE ROW LEVEL SECURITY;

-- Templates: Read-only for authenticated users
CREATE POLICY "workflow_templates_select_policy"
  ON workflow_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Modifications: Read-only for authenticated users
CREATE POLICY "workflow_modifications_select_policy"
  ON workflow_modifications
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE workflow_templates IS 'Base workflow templates for core customer journeys (renewal, contact recovery, expansion, etc.)';
COMMENT ON COLUMN workflow_templates.name IS 'Unique template identifier (e.g., renewal_base, contact_recovery)';
COMMENT ON COLUMN workflow_templates.base_steps IS 'Array of step definitions that can be modified at runtime';
COMMENT ON COLUMN workflow_templates.base_artifacts IS 'Array of artifact definitions used in workflow steps';
COMMENT ON COLUMN workflow_templates.default_triggers IS 'Default conditions for auto-triggering this workflow';

COMMENT ON TABLE workflow_modifications IS 'Modifications applied to workflow templates based on scope (global, company, customer, industry, segment)';
COMMENT ON COLUMN workflow_modifications.scope_type IS 'Who gets this modification: global (all), company (all customers of company), customer (specific), industry, segment';
COMMENT ON COLUMN workflow_modifications.scope_criteria IS 'JSONB criteria for conditional application (e.g., {"risk_score": {"$gt": 60}})';
COMMENT ON COLUMN workflow_modifications.priority IS 'Application order: global (100), company (200), customer (300). Lower priority applied first.';
COMMENT ON COLUMN workflow_modifications.modification_data IS 'JSONB containing the modification payload (step definition, artifact, etc.)';

COMMENT ON COLUMN workflow_executions.workflow_template_id IS 'Reference to the base template used for this execution';
COMMENT ON COLUMN workflow_executions.applied_modifications IS 'Array of modification IDs that were applied during compilation';
COMMENT ON COLUMN workflow_executions.compiled_config IS 'Cached compiled workflow configuration (template + modifications + hydration)';
