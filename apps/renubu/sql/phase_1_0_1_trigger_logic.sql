-- =====================================================
-- Phase 1.0.1: Flexible Trigger Logic
-- =====================================================
-- Manual SQL script to add wake_trigger_logic support
-- Run this in Supabase SQL Editor
-- =====================================================

BEGIN;

-- Add wake_trigger_logic column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'workflow_executions'
        AND column_name = 'wake_trigger_logic'
    ) THEN
        ALTER TABLE workflow_executions
        ADD COLUMN wake_trigger_logic TEXT DEFAULT 'OR';

        RAISE NOTICE 'Added wake_trigger_logic column';
    ELSE
        RAISE NOTICE 'wake_trigger_logic column already exists';
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN workflow_executions.wake_trigger_logic IS
'How to combine wake triggers: OR (any trigger fires) or AND (all triggers must fire). Defaults to OR for backward compatibility.';

-- Add check constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'workflow_executions'
        AND constraint_name = 'wake_trigger_logic_valid_values'
    ) THEN
        ALTER TABLE workflow_executions
        ADD CONSTRAINT wake_trigger_logic_valid_values
        CHECK (wake_trigger_logic IN ('OR', 'AND'));

        RAISE NOTICE 'Added wake_trigger_logic constraint';
    ELSE
        RAISE NOTICE 'wake_trigger_logic constraint already exists';
    END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_workflow_executions_trigger_logic
ON workflow_executions(wake_trigger_logic)
WHERE status = 'snoozed';

-- Update existing snoozed workflows to have explicit 'OR' logic
UPDATE workflow_executions
SET wake_trigger_logic = 'OR'
WHERE status = 'snoozed' AND (wake_trigger_logic IS NULL OR wake_trigger_logic = '');

-- Verification
SELECT
    'wake_trigger_logic column' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.columns
WHERE table_name = 'workflow_executions' AND column_name = 'wake_trigger_logic'

UNION ALL

SELECT
    'wake_trigger_logic constraint' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.table_constraints
WHERE table_name = 'workflow_executions' AND constraint_name = 'wake_trigger_logic_valid_values'

UNION ALL

SELECT
    'snoozed workflows with logic' as check_type,
    COUNT(*)::TEXT as status
FROM workflow_executions
WHERE status = 'snoozed' AND wake_trigger_logic IS NOT NULL;

COMMIT;
