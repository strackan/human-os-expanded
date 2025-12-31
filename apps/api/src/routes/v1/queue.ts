/**
 * Queue Routes
 *
 * REST endpoints for claude_queue operations.
 * Mobile to Desktop sync - items logged on mobile are processed on desktop.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { QueueService, type QueueItemInput, type QueueItemUpdate } from '@human-os/services';
import { type AuthenticatedRequest, requireScope } from '../../middleware/auth.js';

const AddQueueItemSchema = z.object({
  intent_type: z.enum(['task', 'event', 'decision', 'note', 'memory_edit']),
  payload: z.record(z.unknown()),
  target_table: z.string().optional(),
  notes: z.string().optional(),
  session_id: z.string().optional(),
});

const UpdateQueueItemSchema = z.object({
  payload: z.record(z.unknown()).optional(),
  status: z.enum(['pending', 'skipped']).optional(),
  notes: z.string().optional(),
});

/**
 * Create queue routes
 */
export function createQueueRoutes(supabase: SupabaseClient): Router {
  const router = Router();

  /**
   * POST /v1/queue
   * Add an item to the queue
   */
  router.post('/', requireScope('founder-os:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const input = AddQueueItemSchema.parse(req.body) as QueueItemInput;
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await QueueService.add(ctx, input);

      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * GET /v1/queue
   * Get pending queue items
   */
  router.get('/', requireScope('founder-os:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.apiKey?.ownerId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await QueueService.getPending(ctx);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.json({ items: result.data, count: result.data?.length || 0 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * GET /v1/queue/:id
   * Get a single queue item
   */
  router.get('/:id', requireScope('founder-os:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const itemId = req.params['id'] ?? '';
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await QueueService.getById(ctx, itemId);

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      return res.json({ item: result.data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * PUT /v1/queue/:id
   * Update a pending queue item
   */
  router.put('/:id', requireScope('founder-os:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const itemId = req.params['id'] ?? '';
      const updates = UpdateQueueItemSchema.parse(req.body) as QueueItemUpdate;
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await QueueService.update(ctx, itemId, updates);

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * POST /v1/queue/process
   * Process all pending queue items
   */
  router.post('/process', requireScope('founder-os:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.apiKey?.ownerId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await QueueService.processAll(ctx);

      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * POST /v1/queue/:id/process
   * Process a single queue item
   */
  router.post('/:id/process', requireScope('founder-os:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const itemId = req.params['id'] ?? '';
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await QueueService.processOne(ctx, itemId);

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  return router;
}
