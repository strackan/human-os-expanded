# Database Schema Extensions for Action Plan System

## Overview

These extensions support the Action Plan system with AI-executable tasks, CSM tasks, sub-tasks, and auto-execution tracking.

---

## Table: `workflow_tasks` (Extensions)

Add the following columns to the existing `workflow_tasks` table from Checkpoint 3:

```sql
-- Auto-execution support for AI tasks
ALTER TABLE workflow_tasks
  ADD COLUMN auto_execute BOOLEAN DEFAULT false,
  ADD COLUMN processor VARCHAR(255),  -- Path to processor script (e.g., 'salesforce-contact-updater.js')
  ADD COLUMN execution_status VARCHAR(50) CHECK (execution_status IN ('queued', 'running', 'success', 'failed')),
  ADD COLUMN execution_result JSONB,  -- Store execution output or error details
  ADD COLUMN executed_at TIMESTAMP;   -- When AI task completed execution

-- Sub-task support
ALTER TABLE workflow_tasks
  ADD COLUMN parent_task_id UUID REFERENCES workflow_tasks(id) ON DELETE CASCADE;

-- Task metadata
ALTER TABLE workflow_tasks
  ADD COLUMN estimated_completion_time VARCHAR(50),  -- e.g., "Within 15 minutes", "2 hours"
  ADD COLUMN complexity VARCHAR(50) CHECK (complexity IN ('simple', 'moderate', 'complex'));

-- Indexes for performance
CREATE INDEX idx_tasks_parent ON workflow_tasks(parent_task_id)
  WHERE parent_task_id IS NOT NULL;

CREATE INDEX idx_tasks_auto_execute ON workflow_tasks(auto_execute, execution_status)
  WHERE auto_execute = true;

CREATE INDEX idx_tasks_execution_status ON workflow_tasks(execution_status)
  WHERE execution_status IN ('queued', 'running');
```

---

## Extended `workflow_tasks` Schema

Full schema after extensions:

```sql
CREATE TABLE workflow_tasks (
  -- Core fields (from Checkpoint 3)
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_execution_id UUID REFERENCES workflow_step_executions(id),
  customer_id UUID NOT NULL REFERENCES customers(id),

  -- Task type and ownership
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('AI_TASK', 'CSM_TASK')),
  owner VARCHAR(50) NOT NULL CHECK (owner IN ('AI', 'CSM')),

  -- Task details
  action VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  recommendation_id UUID REFERENCES recommendations(id),

  -- Status tracking
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_progress', 'snoozed', 'completed', 'skipped', 'cancelled')),
  priority INT NOT NULL CHECK (priority BETWEEN 1 AND 5),

  -- Snooze system (from Checkpoint 3)
  requires_decision BOOLEAN DEFAULT false,
  snooze_count INT DEFAULT 0,
  first_snoozed_at TIMESTAMP,
  snooze_deadline TIMESTAMP,
  snoozed_until TIMESTAMP,

  -- Completion tracking
  completed_at TIMESTAMP,
  skipped_at TIMESTAMP,
  skip_reason TEXT,

  -- Cross-workflow task continuity
  original_workflow_execution_id UUID REFERENCES workflow_executions(id),
  surfaced_in_workflow_ids UUID[],  -- Array of workflow execution IDs where task appeared

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- NEW: Auto-execution support for AI tasks
  auto_execute BOOLEAN DEFAULT false,
  processor VARCHAR(255),
  execution_status VARCHAR(50) CHECK (execution_status IN ('queued', 'running', 'success', 'failed')),
  execution_result JSONB,
  executed_at TIMESTAMP,

  -- NEW: Sub-task support
  parent_task_id UUID REFERENCES workflow_tasks(id) ON DELETE CASCADE,

  -- NEW: Task metadata
  estimated_completion_time VARCHAR(50),
  complexity VARCHAR(50) CHECK (complexity IN ('simple', 'moderate', 'complex'))
);
```

---

## Sample Data

### AI Task Example

```sql
INSERT INTO workflow_tasks (
  workflow_execution_id,
  customer_id,
  task_type,
  owner,
  action,
  description,
  status,
  priority,
  auto_execute,
  processor,
  execution_status,
  estimated_completion_time,
  metadata
) VALUES (
  'exec_123',
  'customer_acme',
  'AI_TASK',
  'AI',
  'Update Salesforce Contact',
  'Change primary contact from Sarah Chen to Eric Estrada in Salesforce opportunity',
  'pending',
  1,
  true,
  'salesforce-contact-updater.js',
  'queued',
  'Within 15 minutes',
  '{
    "oldContact": {
      "name": "Sarah Chen",
      "salesforceId": "003ABC123"
    },
    "newContact": {
      "name": "Eric Estrada",
      "salesforceId": "003ABC456"
    }
  }'::jsonb
);
```

### CSM Task with Sub-Tasks Example

```sql
-- Parent task (complex)
INSERT INTO workflow_tasks (
  id,
  workflow_execution_id,
  customer_id,
  task_type,
  owner,
  action,
  description,
  status,
  priority,
  complexity,
  estimated_completion_time,
  metadata
) VALUES (
  'task_parent_cfo',
  'exec_123',
  'customer_acme',
  'CSM_TASK',
  'CSM',
  'Schedule and Conduct CFO Engagement Meeting',
  'Set up 30-minute intro call with new CFO to discuss value, build relationship, and address budget concerns',
  'pending',
  1,
  'complex',
  '2 hours total',
  '{
    "hasSubTasks": true,
    "subTaskCount": 4,
    "dueDate": "2025-10-15"
  }'::jsonb
);

-- Sub-task 1
INSERT INTO workflow_tasks (
  workflow_execution_id,
  customer_id,
  task_type,
  owner,
  parent_task_id,
  action,
  description,
  status,
  priority,
  complexity,
  estimated_completion_time
) VALUES (
  'exec_123',
  'customer_acme',
  'CSM_TASK',
  'CSM',
  'task_parent_cfo',
  'Research CFO background and priorities',
  'Review LinkedIn, company announcements, and past communications',
  'pending',
  1,
  'simple',
  '30 minutes'
);

-- Sub-task 2
INSERT INTO workflow_tasks (
  workflow_execution_id,
  customer_id,
  task_type,
  owner,
  parent_task_id,
  action,
  description,
  status,
  priority,
  complexity,
  estimated_completion_time
) VALUES (
  'exec_123',
  'customer_acme',
  'CSM_TASK',
  'CSM',
  'task_parent_cfo',
  'Prepare value-focused slide deck',
  'Create 5-slide deck showing ROI, usage stats, and strategic value',
  'pending',
  1,
  'simple',
  '45 minutes'
);

-- Sub-task 3
INSERT INTO workflow_tasks (
  workflow_execution_id,
  customer_id,
  task_type,
  owner,
  parent_task_id,
  action,
  description,
  status,
  priority,
  complexity,
  estimated_completion_time
) VALUES (
  'exec_123',
  'customer_acme',
  'CSM_TASK',
  'CSM',
  'task_parent_cfo',
  'Send meeting invitation',
  'Email CFO with calendar invite for 30-min call',
  'pending',
  1,
  'simple',
  '15 minutes'
);

-- Sub-task 4
INSERT INTO workflow_tasks (
  workflow_execution_id,
  customer_id,
  task_type,
  owner,
  parent_task_id,
  action,
  description,
  status,
  priority,
  complexity,
  estimated_completion_time
) VALUES (
  'exec_123',
  'customer_acme',
  'CSM_TASK',
  'CSM',
  'task_parent_cfo',
  'Conduct meeting',
  'Run 30-minute CFO engagement meeting',
  'pending',
  1,
  'simple',
  '30 minutes'
);
```

---

## Query Examples

### Get All Sub-Tasks for a Parent Task

```sql
SELECT
  t.*,
  parent.action as parent_action
FROM workflow_tasks t
LEFT JOIN workflow_tasks parent ON t.parent_task_id = parent.id
WHERE t.parent_task_id = 'task_parent_cfo'
ORDER BY t.created_at;
```

### Get Queued AI Tasks for Execution

```sql
SELECT *
FROM workflow_tasks
WHERE auto_execute = true
  AND execution_status = 'queued'
  AND status = 'pending'
ORDER BY priority ASC, created_at ASC;
```

### Get All Tasks for a Workflow (Including Sub-Tasks)

```sql
WITH RECURSIVE task_hierarchy AS (
  -- Parent tasks
  SELECT
    t.*,
    0 as depth,
    t.id as root_id,
    ARRAY[t.id] as path
  FROM workflow_tasks t
  WHERE workflow_execution_id = 'exec_123'
    AND parent_task_id IS NULL

  UNION ALL

  -- Sub-tasks
  SELECT
    t.*,
    th.depth + 1,
    th.root_id,
    th.path || t.id
  FROM workflow_tasks t
  INNER JOIN task_hierarchy th ON t.parent_task_id = th.id
)
SELECT * FROM task_hierarchy
ORDER BY root_id, depth, created_at;
```

### Update Task Execution Status

```sql
-- Mark AI task as running
UPDATE workflow_tasks
SET
  execution_status = 'running',
  updated_at = NOW()
WHERE id = 'task_123';

-- Mark AI task as successful
UPDATE workflow_tasks
SET
  status = 'completed',
  execution_status = 'success',
  executed_at = NOW(),
  completed_at = NOW(),
  execution_result = '{
    "success": true,
    "updatedFields": ["primary_contact_id"],
    "affectedRecords": 1
  }'::jsonb,
  updated_at = NOW()
WHERE id = 'task_123';

-- Mark AI task as failed
UPDATE workflow_tasks
SET
  execution_status = 'failed',
  execution_result = '{
    "error": "Salesforce API timeout",
    "retryable": true
  }'::jsonb,
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{retryCount}',
    to_jsonb(COALESCE((metadata->>'retryCount')::int, 0) + 1)
  ),
  updated_at = NOW()
WHERE id = 'task_123';
```

### Complete Parent Task When All Sub-Tasks Done

```sql
-- Check if all sub-tasks are completed
UPDATE workflow_tasks parent
SET
  status = 'completed',
  completed_at = NOW(),
  updated_at = NOW()
WHERE id = 'task_parent_cfo'
  AND NOT EXISTS (
    SELECT 1
    FROM workflow_tasks sub
    WHERE sub.parent_task_id = parent.id
      AND sub.status NOT IN ('completed', 'skipped', 'cancelled')
  );
```

---

## API Endpoint Updates

### POST `/api/workflows/tasks` (Create Task)

Updated request body to support new fields:

```typescript
{
  workflow_execution_id: string;
  customer_id: string;
  task_type: 'AI_TASK' | 'CSM_TASK';
  owner: 'AI' | 'CSM';
  action: string;
  description: string;
  priority: 1-5;
  status?: string;

  // NEW: Auto-execution fields
  auto_execute?: boolean;
  processor?: string;
  execution_status?: 'queued' | 'running' | 'success' | 'failed';

  // NEW: Sub-task field
  parent_task_id?: string;

  // NEW: Metadata fields
  estimated_completion_time?: string;
  complexity?: 'simple' | 'moderate' | 'complex';

  metadata?: object;
}
```

### GET `/api/workflows/tasks?auto_execute=true&execution_status=queued`

Get AI tasks ready for execution.

### POST `/api/workflows/tasks/:id/execute`

Trigger manual execution of an AI task (for testing or retry).

---

## Background Jobs

### AI Task Executor Cron Job

**Schedule**: Every 5 minutes

**Purpose**: Execute queued AI tasks

```sql
-- Pseudocode
SELECT * FROM workflow_tasks
WHERE auto_execute = true
  AND execution_status = 'queued'
  AND status = 'pending'
ORDER BY priority ASC, created_at ASC;

FOR EACH task:
  -- Update to running
  UPDATE status = 'running'

  -- Execute processor
  result = executeProcessor(task.processor, task)

  -- Update result
  IF result.success:
    UPDATE status = 'completed', execution_status = 'success'
  ELSE:
    UPDATE execution_status = 'failed', increment retry count
```

---

## Migration Script

```sql
-- Migration: Add Action Plan task system support
-- Version: 2025-01-XX
-- Description: Extends workflow_tasks table for AI execution and sub-tasks

BEGIN;

-- Add auto-execution columns
ALTER TABLE workflow_tasks
  ADD COLUMN IF NOT EXISTS auto_execute BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS processor VARCHAR(255),
  ADD COLUMN IF NOT EXISTS execution_status VARCHAR(50) CHECK (execution_status IN ('queued', 'running', 'success', 'failed')),
  ADD COLUMN IF NOT EXISTS execution_result JSONB,
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP;

-- Add sub-task column
ALTER TABLE workflow_tasks
  ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES workflow_tasks(id) ON DELETE CASCADE;

-- Add metadata columns
ALTER TABLE workflow_tasks
  ADD COLUMN IF NOT EXISTS estimated_completion_time VARCHAR(50),
  ADD COLUMN IF NOT EXISTS complexity VARCHAR(50) CHECK (complexity IN ('simple', 'moderate', 'complex'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_parent
  ON workflow_tasks(parent_task_id)
  WHERE parent_task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_auto_execute
  ON workflow_tasks(auto_execute, execution_status)
  WHERE auto_execute = true;

CREATE INDEX IF NOT EXISTS idx_tasks_execution_status
  ON workflow_tasks(execution_status)
  WHERE execution_status IN ('queued', 'running');

COMMIT;
```

---

## Summary

**New Columns**: 7
- `auto_execute` - Flag for AI-executable tasks
- `processor` - Script path for execution
- `execution_status` - Execution state tracking
- `execution_result` - Execution output/error
- `executed_at` - Execution timestamp
- `parent_task_id` - For sub-task hierarchies
- `estimated_completion_time` - Time estimate
- `complexity` - Task complexity level

**New Indexes**: 3
- Parent task lookups
- Auto-execute queue queries
- Execution status filtering

**Backward Compatible**: Yes (all columns nullable or with defaults)
