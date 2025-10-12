/**
 * CREATE WORKFLOW_EXECUTIONS TABLE
 *
 * This table was referenced by other tables but never created.
 * Creating it now with a clean, proper schema.
 *
 * Run this INSTEAD of ALTER_WORKFLOW_EXECUTIONS.sql
 *
 * Date: October 9, 2025
 */

-- Create workflow_executions table from scratch
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id) NOT NULL,
  workflow_name TEXT NOT NULL,

  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  -- Flexible metadata for workflow-specific data
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Optional snooze/pause fields
  snoozed_until TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_workflow_executions_customer
ON workflow_executions(customer_id);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow
ON workflow_executions(workflow_id);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_status
ON workflow_executions(status);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_customer_workflow
ON workflow_executions(customer_id, workflow_id);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_metadata
ON workflow_executions USING gin(metadata);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_execution_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workflow_execution_updated ON workflow_executions;
CREATE TRIGGER workflow_execution_updated
  BEFORE UPDATE ON workflow_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_execution_timestamp();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WORKFLOW_EXECUTIONS TABLE CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table schema:';
  RAISE NOTICE '  - id (UUID, PK)';
  RAISE NOTICE '  - customer_id (FK to customers)';
  RAISE NOTICE '  - workflow_id (FK to workflows) - NOT NULL';
  RAISE NOTICE '  - workflow_name (TEXT) - NOT NULL';
  RAISE NOTICE '  - status (active/completed/snoozed/escalated)';
  RAISE NOTICE '  - started_at, completed_at';
  RAISE NOTICE '  - metadata (JSONB for flexible data)';
  RAISE NOTICE '  - snoozed_until (for snooze action)';
  RAISE NOTICE '';
  RAISE NOTICE 'Created indexes:';
  RAISE NOTICE '  - idx_workflow_executions_customer';
  RAISE NOTICE '  - idx_workflow_executions_workflow';
  RAISE NOTICE '  - idx_workflow_executions_status';
  RAISE NOTICE '  - idx_workflow_executions_customer_workflow';
  RAISE NOTICE '  - idx_workflow_executions_metadata (GIN)';
  RAISE NOTICE '';
  RAISE NOTICE 'Now run: BLUESOFT_WORKFLOWS_SEED.sql';
  RAISE NOTICE '========================================';
END $$;
