-- ============================================================================
-- Fix Workflow Name Nullable
-- ============================================================================
-- Purpose: Make workflow_name nullable for orchestrator compatibility
-- The orchestrator uses workflow_definition.name instead of direct workflow_name
-- ============================================================================

ALTER TABLE public.workflow_executions
ALTER COLUMN workflow_name DROP NOT NULL;

-- Also make workflow_config_id nullable for orchestrator (uses workflow_definition_id)
ALTER TABLE public.workflow_executions
ALTER COLUMN workflow_config_id DROP NOT NULL;

-- Make total_steps nullable (orchestrator doesn't track steps the same way)
ALTER TABLE public.workflow_executions
ALTER COLUMN total_steps DROP NOT NULL;

DO $$
BEGIN
  RAISE NOTICE 'Workflow executions table columns made nullable for orchestrator compatibility';
END $$;
