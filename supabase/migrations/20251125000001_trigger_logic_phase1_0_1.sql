-- =====================================================
-- Phase 1.0.1: Flexible Trigger Logic
-- =====================================================
--
-- Adds support for:
-- 1. Event-only triggers (no date required)
-- 2. AND/OR logic for combining triggers
--
-- Changes:
-- - Add wake_trigger_logic column to workflow_executions
-- - Default to 'OR' for backward compatibility
-- - Add constraint to ensure valid logic values
--
-- Migration: 20251125000001
-- =====================================================

-- Add wake_trigger_logic column to workflow_executions table
ALTER TABLE workflow_executions
ADD COLUMN IF NOT EXISTS wake_trigger_logic TEXT DEFAULT 'OR';

-- Add comment to column
COMMENT ON COLUMN workflow_executions.wake_trigger_logic IS
'How to combine wake triggers: OR (any trigger fires) or AND (all triggers must fire). Defaults to OR for backward compatibility.';

-- Add check constraint to ensure valid values
ALTER TABLE workflow_executions
ADD CONSTRAINT wake_trigger_logic_valid_values
CHECK (wake_trigger_logic IN ('OR', 'AND'));

-- Create index for efficient querying by logic type
CREATE INDEX IF NOT EXISTS idx_workflow_executions_trigger_logic
ON workflow_executions(wake_trigger_logic)
WHERE status = 'snoozed';

-- Update existing snoozed workflows to have explicit 'OR' logic
UPDATE workflow_executions
SET wake_trigger_logic = 'OR'
WHERE status = 'snoozed' AND wake_trigger_logic IS NULL;

-- =====================================================
-- Verification Queries (commented out - for testing)
-- =====================================================

-- Verify column was added
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'workflow_executions' AND column_name = 'wake_trigger_logic';

-- Verify constraint was added
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'workflow_executions' AND constraint_name = 'wake_trigger_logic_valid_values';

-- Check all snoozed workflows have logic set
-- SELECT COUNT(*) as snoozed_workflows_with_logic
-- FROM workflow_executions
-- WHERE status = 'snoozed' AND wake_trigger_logic IS NOT NULL;
