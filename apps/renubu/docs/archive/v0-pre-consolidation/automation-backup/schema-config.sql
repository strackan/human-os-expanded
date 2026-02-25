-- ============================================================================
-- Workflow Configuration Schema
-- ============================================================================
-- Purpose: Database schema for workflow system configuration
-- Version: 1.0
-- Created: October 2025
--
-- Architecture:
--   Plans → Workflows → Steps → Executions (4-level hierarchy)
--   This file defines configuration tables only (plans, workflows, settings)
--   Operational tables (instances, executions) will be added in future phases
-- ============================================================================

-- ============================================================================
-- Table 1: plans
-- ============================================================================
-- Purpose: Defines the 4 plan types in the system
-- Examples: Renewal, Strategic Account Plan, Risk Mitigation, Expansion Opportunity
-- ============================================================================

CREATE TABLE IF NOT EXISTS plans (
  -- Identity
  id TEXT PRIMARY KEY,
  plan_key TEXT NOT NULL UNIQUE,     -- 'renewal' | 'strategic' | 'risk' | 'opportunity'
  plan_name TEXT NOT NULL,            -- 'Renewal Planning' | 'Strategic Account Plan'
  plan_description TEXT,              -- Human-readable description for UI

  -- Behavior configuration
  auto_assign BOOLEAN DEFAULT 0,      -- Auto-create plan for all customers? (renewal=1, others=0)
  requires_approval BOOLEAN DEFAULT 0, -- Needs rep approval before activation? (strategic=1)

  -- Display properties
  icon TEXT,                          -- Emoji: '🔄' | '🎯' | '⚠️' | '💡'
  color TEXT,                         -- UI color: 'blue' | 'purple' | 'red' | 'green'
  display_order INTEGER,              -- Sort order in UI (1, 2, 3, 4)

  -- Status
  active BOOLEAN DEFAULT 1,           -- Can be disabled without deleting

  -- Audit
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plans_active_order ON plans(active, display_order);

-- ============================================================================
-- Table 2: workflows
-- ============================================================================
-- Purpose: Defines workflows within each plan type
-- Examples:
--   - Renewal plan has 9 workflows (Monitor, Prepare, Negotiate, etc.)
--   - Strategic plan might have 3 workflows (QBR, Health Check, Executive Meeting)
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflows (
  -- Identity
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,             -- FK to plans table (which plan does this belong to?)

  workflow_key TEXT NOT NULL,        -- Unique identifier: 'monitor' | 'prepare' | 'qbr'
  workflow_name TEXT NOT NULL,       -- Display name: 'Monitor Stage' | 'Quarterly Business Review'
  workflow_description TEXT,         -- Human-readable description

  -- Activation conditions (when does this workflow become active?)
  trigger_type TEXT NOT NULL,        -- 'days_based' | 'manual' | 'schedule' | 'event'
  trigger_config TEXT,               -- JSON configuration for trigger
                                     -- days_based: {"days_min": 180, "days_max": null}
                                     -- schedule: {"frequency": "quarterly", "month": 3}
                                     -- manual: {}

  -- Template reference (points to TypeScript file)
  template_file TEXT NOT NULL,       -- 'RenewalMonitorWorkflow.ts' | 'StrategicQBRWorkflow.ts'
                                     -- Template file contains: chat flows, artifacts, UI config

  -- Scoring configuration (for priority calculation)
  base_score INTEGER DEFAULT 50,     -- Base priority score for this workflow type
  urgency_score INTEGER,             -- For time-based workflows: 100 (critical) → 20 (low)
                                     -- Used in priority calculation algorithm

  -- Display properties
  icon TEXT,                         -- Emoji: '👀' | '📋' | '🤝' | '📊'
  sequence_order INTEGER,            -- Order within plan (1, 2, 3...)

  -- Status
  active BOOLEAN DEFAULT 1,          -- Can be disabled without deleting

  -- Audit
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  UNIQUE(plan_id, workflow_key)      -- Workflow key must be unique within plan
);

CREATE INDEX idx_workflows_plan ON workflows(plan_id, sequence_order);
CREATE INDEX idx_workflows_active ON workflows(active);

-- ============================================================================
-- Table 3: scoring_properties
-- ============================================================================
-- Purpose: Configuration for priority scoring algorithm
-- Examples: ARR breakpoints, account plan multipliers, CSM workload penalties
-- ============================================================================

CREATE TABLE IF NOT EXISTS scoring_properties (
  -- Identity
  property_key TEXT PRIMARY KEY,     -- Unique identifier: 'arr_breakpoints' | 'experience_multipliers'

  -- Value storage (JSON-encoded)
  property_value TEXT NOT NULL,      -- JSON string: '{"high":150000,"medium":100000}'
  property_type TEXT NOT NULL,       -- 'object' | 'number' | 'array' | 'string'

  -- Categorization
  property_scope TEXT NOT NULL,      -- 'arr' | 'account_plan' | 'csm' | 'general'
                                     -- Helps organize settings in UI

  -- Documentation
  description TEXT,                  -- Human-readable explanation
  default_value TEXT,                -- Original default (for reset functionality)

  -- Audit
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scoring_scope ON scoring_properties(property_scope);

-- ============================================================================
-- Table 4: workflow_properties
-- ============================================================================
-- Purpose: General workflow system settings (not scoring-specific)
-- Examples: Opportunity score thresholds, risk score thresholds
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_properties (
  -- Identity
  property_key TEXT PRIMARY KEY,     -- Unique identifier: 'opportunity_score_min'

  -- Value storage
  property_value TEXT NOT NULL,      -- Simple value or JSON: '70' | '{"enabled": true}'
  property_type TEXT NOT NULL,       -- 'number' | 'string' | 'boolean' | 'object'

  -- Documentation
  description TEXT,                  -- Human-readable explanation
  default_value TEXT,                -- Original default (for reset functionality)

  -- Audit
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Table 5: admin_log
-- ============================================================================
-- Purpose: Universal audit trail for all system events
-- Tracks: Configuration changes, workflow completions, user actions, page views
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_log (
  -- Identity
  id TEXT PRIMARY KEY,

  -- Event classification
  event_type TEXT NOT NULL,          -- 'config_change' | 'workflow' | 'page_view' | 'crud' | 'auth'
  event_category TEXT NOT NULL,      -- More specific: 'scoring_config' | 'workflow_completed' | 'dashboard'
  action TEXT NOT NULL,              -- 'view' | 'edit' | 'create' | 'delete' | 'complete' | 'approve'

  -- Page tracking (for page view events)
  page_name TEXT,                    -- '/dashboard' | '/config/scoring' | '/customers/123'
  page_url TEXT,                     -- Full URL if needed

  -- Entity tracking (for CRUD and config events)
  table_name TEXT,                   -- 'scoring_properties' | 'workflows' | 'customers'
  record_key TEXT,                   -- Property key, workflow ID, or record ID
  old_value TEXT,                    -- JSON snapshot before change
  new_value TEXT,                    -- JSON snapshot after change

  -- Additional context
  metadata TEXT,                     -- Additional JSON data (varies by event type)

  -- Session tracking
  user_id TEXT,                      -- User who performed action (or 'system')
  session_id TEXT,                   -- Session identifier for grouping related actions
  ip_address TEXT,                   -- IP address (for security auditing)
  user_agent TEXT,                   -- Browser/client information

  -- Timing
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration_ms INTEGER                -- For page views: time on page
);

-- Indexes for common query patterns
CREATE INDEX idx_admin_log_event_type ON admin_log(event_type, created_at DESC);
CREATE INDEX idx_admin_log_user_action ON admin_log(user_id, action, created_at DESC);
CREATE INDEX idx_admin_log_page ON admin_log(page_name, created_at DESC);
CREATE INDEX idx_admin_log_entity ON admin_log(table_name, record_key, created_at DESC);
CREATE INDEX idx_admin_log_session ON admin_log(session_id, created_at ASC);

-- ============================================================================
-- Schema Notes
-- ============================================================================
--
-- Design Principles:
-- 1. Configuration vs Operational Data
--    - This schema contains CONFIGURATION only (what plans/workflows exist)
--    - Operational data (active plans, executions) will be added in future phases
--
-- 2. Template Files Stay in Code
--    - Workflow templates (chat flows, artifacts, UI) remain in TypeScript files
--    - Database stores reference to template file (template_file column)
--    - This follows engineer's recommendation for version control and flexibility
--
-- 3. Renewal Stages = Workflows
--    - Renewal "stages" are just workflows with days_based triggers
--    - No special case logic needed - unified architecture
--
-- 4. JSON Storage Strategy
--    - Complex configuration stored as JSON strings
--    - Allows flexibility without schema changes
--    - Can be parsed and validated in application code
--
-- 5. Audit Trail
--    - admin_log table tracks all changes
--    - Can reconstruct configuration history
--    - Supports compliance and debugging
--
-- Future Phases:
-- - Phase 2: Add plan_instances (operational - which customers have which plans)
-- - Phase 3: Add workflow_executions (operational - CSM working workflows)
-- - Phase 4: Add workflow_steps (operational - progress tracking)
--
-- ============================================================================
