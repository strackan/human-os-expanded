/**
 * Task Validation Schemas
 *
 * Zod schemas for task-related API endpoints.
 */

import { z } from 'zod';
import { CommonValidators } from '../helpers';

/**
 * Schema for creating a new task
 * POST /api/tasks
 */
export const CreateTaskSchema = z.object({
  customerId: CommonValidators.uuid(),
  title: CommonValidators.nonEmptyString(),
  description: z.string().optional(),
  assignedTo: CommonValidators.uuid().optional(),
  dueDate: CommonValidators.isoDate().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  type: z.enum(['follow_up', 'outreach', 'onboarding', 'support', 'renewal', 'other']).optional(),
});

/**
 * Schema for updating a task
 * PATCH /api/tasks/[id]
 */
export const UpdateTaskSchema = z.object({
  title: CommonValidators.nonEmptyString().optional(),
  description: z.string().optional(),
  assignedTo: CommonValidators.uuid().optional(),
  dueDate: CommonValidators.isoDate().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  completedAt: CommonValidators.isoDate().optional(),
});

/**
 * Schema for task query parameters
 * GET /api/tasks
 */
export const TaskQuerySchema = z.object({
  customerId: CommonValidators.uuid().optional(),
  assignedTo: CommonValidators.uuid().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  overdue: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  pageSize: z.string().regex(/^\d+$/).transform(Number).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
