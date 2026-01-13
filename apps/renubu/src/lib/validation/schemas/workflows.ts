/**
 * Workflow Validation Schemas
 *
 * Zod schemas for workflow-related API endpoints.
 */

import { z } from 'zod';
import { CommonValidators } from '../helpers';

/**
 * Schema for creating a new workflow execution
 * POST /api/workflows/executions
 */
export const CreateWorkflowExecutionSchema = z.object({
  workflowConfigId: CommonValidators.uuid(),
  customerId: CommonValidators.uuid(),
  assignedCsmId: CommonValidators.uuid().optional(),
  triggerType: z.enum(['manual', 'scheduled', 'event', 'api']).optional(),
  context: z.record(z.string(), z.any()).optional(),
});

/**
 * Schema for updating workflow execution status
 * PATCH /api/workflows/executions/[id]
 */
export const UpdateWorkflowExecutionSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']).optional(),
  currentStepIndex: z.number().int().min(0).optional(),
  context: z.record(z.string(), z.any()).optional(),
  completedAt: CommonValidators.isoDate().optional(),
});

/**
 * Schema for creating a workflow task
 * POST /api/workflows/tasks
 */
export const CreateWorkflowTaskSchema = z.object({
  workflowExecutionId: CommonValidators.uuid(),
  customerId: CommonValidators.uuid(),
  taskType: z.enum(['manual', 'automated', 'approval', 'notification']),
  action: CommonValidators.nonEmptyString(),
  description: CommonValidators.nonEmptyString(),
  assignedTo: CommonValidators.uuid().optional(),
  dueDate: CommonValidators.isoDate().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  context: z.record(z.string(), z.any()).optional(),
});

/**
 * Schema for updating a workflow task
 * PATCH /api/workflows/tasks/[id]
 */
export const UpdateWorkflowTaskSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  assignedTo: CommonValidators.uuid().optional(),
  dueDate: CommonValidators.isoDate().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  completedAt: CommonValidators.isoDate().optional(),
  notes: z.string().optional(),
});

/**
 * Schema for workflow execution query parameters
 * GET /api/workflows/executions
 */
export const WorkflowExecutionQuerySchema = z.object({
  customerId: CommonValidators.uuid().optional(),
  status: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  pageSize: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/**
 * Schema for snoozing a workflow
 * POST /api/workflows/[id]/snooze
 */
export const SnoozeWorkflowSchema = z.object({
  snoozeUntil: CommonValidators.isoDate(),
  reason: CommonValidators.nonEmptyString().optional(),
  triggerType: z.enum(['date', 'event', 'manual']).optional(),
  triggerConfig: z.record(z.string(), z.any()).optional(),
});
