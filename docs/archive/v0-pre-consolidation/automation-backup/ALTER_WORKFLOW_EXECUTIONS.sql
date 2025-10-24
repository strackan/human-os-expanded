/**
 * ALTER WORKFLOW_EXECUTIONS - Add workflow_id Column
 *
 * Adds workflow_id as a proper foreign key column instead of storing
 * it in JSONB metadata. This enables proper joins and query performance.
 *
 * Run this BEFORE BLUESOFT_WORKFLOWS_SEED.sql
 *
 * Date: October 9, 2025
 */

-- Remove NOT NULL constraint from workflow_config_id (if it exists)
ALTER TABLE workflow_executions
ALTER COLUMN workflow_config_id DROP NOT NULL;

-- Add workflow_id column to workflow_executions
ALTER TABLE workflow_executions
ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES workflows(id);

-- Add workflow_name column for denormalized workflow name
ALTER TABLE workflow_executions
ADD COLUMN IF NOT EXISTS workflow_name TEXT;

-- Add metadata column for flexible workflow-specific data
ALTER TABLE workflow_executions
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add title column to workflow_tasks if it doesn't exist
ALTER TABLE workflow_tasks
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add due_date column to workflow_tasks if it doesn't exist
ALTER TABLE workflow_tasks
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Make customer_id nullable in workflow_tasks (can be derived from workflow_execution)
ALTER TABLE workflow_tasks
ALTER COLUMN customer_id DROP NOT NULL;

-- Make assigned_to nullable in workflow_tasks (tasks can exist before assignment)
ALTER TABLE workflow_tasks
ALTER COLUMN assigned_to DROP NOT NULL;

-- Make created_by nullable in workflow_tasks (system-generated tasks may not have a creator)
ALTER TABLE workflow_tasks
ALTER COLUMN created_by DROP NOT NULL;

-- Make action nullable in workflow_tasks (can use title or description instead)
ALTER TABLE workflow_tasks
ALTER COLUMN action DROP NOT NULL;

-- Add 'critical' to priority check constraint
ALTER TABLE workflow_tasks
DROP CONSTRAINT IF EXISTS workflow_tasks_priority_check;

ALTER TABLE workflow_tasks
ADD CONSTRAINT workflow_tasks_priority_check
CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'critical'));

-- Add workflow task types to task_type check constraint
ALTER TABLE workflow_tasks
DROP CONSTRAINT IF EXISTS workflow_tasks_task_type_check;

ALTER TABLE workflow_tasks
ADD CONSTRAINT workflow_tasks_task_type_check
CHECK (task_type IN (
    'review_contract',
    'draft_email',
    'schedule_meeting',
    'analyze_usage',
    'prepare_proposal',
    'follow_up',
    'escalate',
    'update_crm',
    'get_transcript',
    'review_recommendation',
    'custom',
    'assessment',
    'escalation',
    'action',
    'completion'
));

-- Add columns to workflow_task_artifacts
ALTER TABLE workflow_task_artifacts
ADD COLUMN IF NOT EXISTS generated_by_ai BOOLEAN DEFAULT false;

ALTER TABLE workflow_task_artifacts
ADD COLUMN IF NOT EXISTS ai_model TEXT;

ALTER TABLE workflow_task_artifacts
ADD COLUMN IF NOT EXISTS ai_prompt TEXT;

ALTER TABLE workflow_task_artifacts
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Add artifact types to artifact_type check constraint
ALTER TABLE workflow_task_artifacts
DROP CONSTRAINT IF EXISTS workflow_task_artifacts_artifact_type_check;

ALTER TABLE workflow_task_artifacts
ADD CONSTRAINT workflow_task_artifacts_artifact_type_check
CHECK (artifact_type IN (
    'email_draft',
    'contract_analysis',
    'meeting_notes',
    'proposal_draft',
    'recommendation',
    'custom',
    'action_plan',
    'assessment'
));

-- Create index for efficient joins
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow
ON workflow_executions(workflow_id);

-- Create composite index for common queries (customer + workflow)
CREATE INDEX IF NOT EXISTS idx_workflow_executions_customer_workflow
ON workflow_executions(customer_id, workflow_id);

-- Create GIN index for metadata queries
CREATE INDEX IF NOT EXISTS idx_workflow_executions_metadata
ON workflow_executions USING gin(metadata);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WORKFLOW_EXECUTIONS TABLE ALTERED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Schema changes:';
  RAISE NOTICE '  - Removed NOT NULL constraint from workflow_config_id';
  RAISE NOTICE '  - Added workflow_id UUID (FK to workflows.id)';
  RAISE NOTICE '  - Added workflow_name TEXT (denormalized workflow name)';
  RAISE NOTICE '  - Added metadata JSONB (for flexible workflow data)';
  RAISE NOTICE '  - Added title TEXT to workflow_tasks';
  RAISE NOTICE '  - Added due_date TIMESTAMPTZ to workflow_tasks';
  RAISE NOTICE '  - Made customer_id nullable in workflow_tasks (derived from workflow_execution)';
  RAISE NOTICE '  - Made assigned_to nullable in workflow_tasks (tasks can exist before assignment)';
  RAISE NOTICE '  - Made created_by nullable in workflow_tasks (system-generated tasks)';
  RAISE NOTICE '  - Made action nullable in workflow_tasks (can use title/description)';
  RAISE NOTICE '  - Added ''critical'' to priority check constraint';
  RAISE NOTICE '  - Added workflow task types (assessment, escalation, action, completion) to task_type check constraint';
  RAISE NOTICE '  - Added generated_by_ai, ai_model, ai_prompt, is_approved to workflow_task_artifacts';
  RAISE NOTICE '  - Added artifact types (action_plan, assessment) to artifact_type check constraint';
  RAISE NOTICE '';
  RAISE NOTICE 'Created indexes:';
  RAISE NOTICE '  - idx_workflow_executions_workflow';
  RAISE NOTICE '  - idx_workflow_executions_customer_workflow';
  RAISE NOTICE '  - idx_workflow_executions_metadata (GIN)';
  RAISE NOTICE '';
  RAISE NOTICE 'Now you can JOIN efficiently:';
  RAISE NOTICE '  SELECT * FROM workflow_executions we';
  RAISE NOTICE '  JOIN workflows w ON we.workflow_id = w.id';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run BLUESOFT_WORKFLOWS_SEED.sql';
  RAISE NOTICE '========================================';
END $$;
