/**
 * Tasks Routes
 *
 * REST endpoints for founder-os task management.
 * ADHD-friendly task system with urgency escalation.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TaskService, type TaskInput, type TaskUpdateInput } from '@human-os/services';
import { type AuthenticatedRequest, requireScope } from '../../middleware/auth.js';

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  context_tags: z.array(z.string()).optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'done', 'archived']).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  context_tags: z.array(z.string()).optional(),
  due_date: z.string().nullable().optional(),
  notes: z.string().optional(),
});

/**
 * Create tasks routes
 */
export function createTasksRoutes(supabase: SupabaseClient): Router {
  const router = Router();

  /**
   * POST /v1/tasks
   * Create a new task
   */
  router.post('/', requireScope('founder-os:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const input = CreateTaskSchema.parse(req.body) as TaskInput;
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await TaskService.add(ctx, input);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json({ task: result.task });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * GET /v1/tasks
   * List tasks with optional filters
   */
  router.get('/', requireScope('founder-os:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.apiKey?.ownerId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const status = req.query['status'] as string | undefined;
      const priority = req.query['priority'] as string | undefined;
      const context_tag = req.query['context_tag'] as string | undefined;
      const limit = req.query['limit'] ? Number(req.query['limit']) : 50;
      const offset = req.query['offset'] ? Number(req.query['offset']) : 0;

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await TaskService.list(ctx, {
        status: status as TaskUpdateInput['status'],
        priority: priority as TaskInput['priority'],
        context_tag,
        limit,
        offset,
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.json({ tasks: result.tasks, count: result.tasks.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * GET /v1/tasks/urgent
   * Get urgent tasks (high priority, critical, or due soon)
   */
  router.get('/urgent', requireScope('founder-os:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.apiKey?.ownerId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const limit = req.query['limit'] ? Number(req.query['limit']) : 10;

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await TaskService.getUrgent(ctx, limit);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.json({ tasks: result.tasks, count: result.tasks.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * GET /v1/tasks/:id
   * Get a single task
   */
  router.get('/:id', requireScope('founder-os:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const taskId = req.params['id'] ?? '';
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await TaskService.getById(ctx, taskId);

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      return res.json({ task: result.task });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * PUT /v1/tasks/:id
   * Update a task
   */
  router.put('/:id', requireScope('founder-os:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const taskId = req.params['id'] ?? '';
      const updates = UpdateTaskSchema.parse(req.body) as TaskUpdateInput;
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await TaskService.update(ctx, taskId, updates);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json({ task: result.task });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * POST /v1/tasks/:id/complete
   * Mark a task as complete
   */
  router.post('/:id/complete', requireScope('founder-os:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const taskId = req.params['id'] ?? '';
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await TaskService.complete(ctx, taskId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json({ task: result.task, message: 'Task completed' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * DELETE /v1/tasks/:id
   * Delete a task
   */
  router.delete('/:id', requireScope('founder-os:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const taskId = req.params['id'] ?? '';
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await TaskService.delete(ctx, taskId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json({ success: true, message: 'Task deleted' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  return router;
}
