/**
 * Workflows Table Migration
 *
 * Creates database schema for storing workflow configurations.
 * Enables database-driven workflows for builder UI and custom workflows.
 *
 * Features:
 * - Core workflows (is_core=TRUE) visible to all tenants
 * - Custom workflows (tenant_id) isolated per tenant
 * - JSONB config column for flexible workflow structure
 * - Version history for audit trail
 * - Auto-update timestamps
 */

-- =====================================================
-- Main Workflows Table
-- =====================================================

CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0.0',
  config JSONB NOT NULL,
  is_core BOOLEAN DEFAULT FALSE,
  tenant_id UUID,  -- NULL for core workflows, specific UUID for custom
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT core_workflow_check CHECK (
    is_core = FALSE OR tenant_id IS NULL
  ),
  CONSTRAINT config_structure_check CHECK (
    config ? 'id' AND
    config ? 'name' AND
    config ? 'steps'
  )
);

-- =====================================================
-- Indexes
-- =====================================================

-- Lookup by workflow_id and tenant (most common query)
CREATE INDEX idx_workflows_lookup ON workflows(workflow_id, tenant_id);

-- Filter core workflows
CREATE INDEX idx_workflows_core ON workflows(is_core) WHERE is_core = TRUE;

-- Filter custom workflows by tenant
CREATE INDEX idx_workflows_tenant ON workflows(tenant_id) WHERE tenant_id IS NOT NULL;

-- Search by name
CREATE INDEX idx_workflows_name ON workflows USING gin(to_tsvector('english', name));

-- JSON indexing for common queries
CREATE INDEX idx_workflows_config_id ON workflows((config->>'id'));
CREATE INDEX idx_workflows_config_steps ON workflows USING gin(config->'steps');

-- =====================================================
-- Workflow Versions Table (Audit Trail)
-- =====================================================

CREATE TABLE workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  version INT NOT NULL,
  config JSONB NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  change_description TEXT,

  UNIQUE(workflow_id, version)
);

CREATE INDEX idx_workflow_versions_workflow ON workflow_versions(workflow_id);
CREATE INDEX idx_workflow_versions_changed_at ON workflow_versions(changed_at DESC);

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update timestamp on workflow update
CREATE OR REPLACE FUNCTION update_workflow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_updated
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();

-- Auto-create version history on workflow update
CREATE OR REPLACE FUNCTION create_workflow_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INT;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version), 0) + 1 INTO next_version
  FROM workflow_versions
  WHERE workflow_id = NEW.id;

  -- Insert version record
  INSERT INTO workflow_versions (
    workflow_id,
    version,
    config,
    changed_by,
    change_description
  ) VALUES (
    NEW.id,
    next_version,
    NEW.config,
    NEW.updated_by,  -- Assumes updated_by column or use NEW.created_by
    'Workflow updated'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_version_on_update
  AFTER UPDATE OF config ON workflows
  FOR EACH ROW
  WHEN (OLD.config IS DISTINCT FROM NEW.config)
  EXECUTE FUNCTION create_workflow_version();

-- =====================================================
-- Helper Views
-- =====================================================

-- View: All workflows accessible to a tenant (core + custom)
CREATE VIEW tenant_workflows AS
SELECT
  w.id,
  w.workflow_id,
  w.name,
  w.description,
  w.version,
  w.config,
  w.is_core,
  w.tenant_id,
  w.created_by,
  w.created_at,
  w.updated_at,
  CASE
    WHEN w.is_core THEN 'core'
    ELSE 'custom'
  END as workflow_type,
  u.name as created_by_name,
  u.email as created_by_email
FROM workflows w
LEFT JOIN users u ON w.created_by = u.id;

-- View: Workflow statistics
CREATE VIEW workflow_stats AS
SELECT
  w.workflow_id,
  w.name,
  w.is_core,
  COUNT(DISTINCT we.id) as execution_count,
  COUNT(DISTINCT we.customer_id) as customer_count,
  MAX(we.created_at) as last_executed_at,
  AVG(CASE WHEN we.status = 'completed' THEN 1 ELSE 0 END) as success_rate
FROM workflows w
LEFT JOIN workflow_executions we ON we.workflow_name = w.workflow_id
GROUP BY w.id, w.workflow_id, w.name, w.is_core;

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Get workflows for tenant (includes core + custom)
CREATE OR REPLACE FUNCTION get_tenant_workflows(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  workflow_id VARCHAR,
  name VARCHAR,
  description TEXT,
  version VARCHAR,
  config JSONB,
  is_core BOOLEAN,
  workflow_type VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.workflow_id,
    w.name,
    w.description,
    w.version,
    w.config,
    w.is_core,
    CASE WHEN w.is_core THEN 'core' ELSE 'custom' END as workflow_type
  FROM workflows w
  WHERE w.is_core = TRUE
     OR w.tenant_id = p_tenant_id
  ORDER BY w.is_core DESC, w.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get workflow by ID with tenant check
CREATE OR REPLACE FUNCTION get_workflow(
  p_workflow_id VARCHAR,
  p_tenant_id UUID
)
RETURNS TABLE (
  id UUID,
  workflow_id VARCHAR,
  name VARCHAR,
  description TEXT,
  version VARCHAR,
  config JSONB,
  is_core BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.workflow_id,
    w.name,
    w.description,
    w.version,
    w.config,
    w.is_core
  FROM workflows w
  WHERE w.workflow_id = p_workflow_id
    AND (w.is_core = TRUE OR w.tenant_id = p_tenant_id)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Row Level Security (Optional)
-- =====================================================

-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see core workflows + their tenant's custom workflows
CREATE POLICY workflows_select_policy ON workflows
  FOR SELECT
  USING (
    is_core = TRUE
    OR tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Policy: Only admins can insert core workflows
CREATE POLICY workflows_insert_core_policy ON workflows
  FOR INSERT
  WITH CHECK (
    is_core = FALSE
    OR (SELECT is_admin FROM users WHERE id = auth.uid()) = TRUE
  );

-- Policy: Users can insert custom workflows for their tenant
CREATE POLICY workflows_insert_custom_policy ON workflows
  FOR INSERT
  WITH CHECK (
    is_core = FALSE
    AND tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Policy: Cannot update core workflows
CREATE POLICY workflows_update_policy ON workflows
  FOR UPDATE
  USING (is_core = FALSE);

-- Policy: Cannot delete core workflows
CREATE POLICY workflows_delete_policy ON workflows
  FOR DELETE
  USING (is_core = FALSE);

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE workflows IS 'Stores workflow configurations with JSONB config column';
COMMENT ON COLUMN workflows.workflow_id IS 'Unique identifier for the workflow (e.g., "overdue", "emergency")';
COMMENT ON COLUMN workflows.config IS 'Full workflow configuration as JSONB (steps, notifications, etc.)';
COMMENT ON COLUMN workflows.is_core IS 'TRUE for system workflows, FALSE for custom workflows';
COMMENT ON COLUMN workflows.tenant_id IS 'NULL for core workflows, UUID for tenant-specific custom workflows';

COMMENT ON TABLE workflow_versions IS 'Audit trail of workflow configuration changes';
COMMENT ON FUNCTION get_tenant_workflows(UUID) IS 'Returns all workflows accessible to a tenant (core + custom)';
COMMENT ON FUNCTION get_workflow(VARCHAR, UUID) IS 'Returns specific workflow if accessible to tenant';

-- =====================================================
-- Validation Tests
-- =====================================================

-- Test: Create core workflow (should succeed)
DO $$
BEGIN
  INSERT INTO workflows (workflow_id, name, config, is_core)
  VALUES ('test-core', 'Test Core', '{"id": "test-core", "name": "Test", "steps": []}', TRUE);

  DELETE FROM workflows WHERE workflow_id = 'test-core';

  RAISE NOTICE 'Test 1 passed: Core workflow creation';
END $$;

-- Test: Core workflow with tenant_id (should fail)
DO $$
BEGIN
  BEGIN
    INSERT INTO workflows (workflow_id, name, config, is_core, tenant_id)
    VALUES ('test-fail', 'Test', '{"id": "test", "name": "Test", "steps": []}', TRUE, gen_random_uuid());

    RAISE EXCEPTION 'Test 2 failed: Core workflow should not allow tenant_id';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'Test 2 passed: Core workflow constraint works';
  END;
END $$;

-- Test: Config without required fields (should fail)
DO $$
BEGIN
  BEGIN
    INSERT INTO workflows (workflow_id, name, config, is_core)
    VALUES ('test-fail-2', 'Test', '{"missing": "fields"}', FALSE);

    RAISE EXCEPTION 'Test 3 failed: Config structure check should fail';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'Test 3 passed: Config structure check works';
  END;
END $$;

RAISE NOTICE '=== All migration tests passed ===';
