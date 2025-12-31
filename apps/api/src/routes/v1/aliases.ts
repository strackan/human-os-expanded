/**
 * Aliases Routes
 *
 * REST endpoints for managing natural language command patterns.
 * CRUD for the "user vocabulary as API" system.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AliasService, type AliasInput, type AliasUpdateInput } from '@human-os/services';
import { type AuthenticatedRequest, requireScope } from '../../middleware/auth.js';

const AliasActionSchema = z.object({
  tool: z.string(),
  params: z.record(z.unknown()),
  output: z.string().optional(),
  condition: z.string().optional(),
});

const CreateAliasSchema = z.object({
  pattern: z.string().min(1),
  description: z.string().min(1),
  tools_required: z.array(z.string()),
  actions: z.array(AliasActionSchema),
  mode: z.enum(['tactical', 'strategic']).optional(),
  context: z.array(z.string()).optional(),
  priority: z.number().optional(),
});

const UpdateAliasSchema = z.object({
  description: z.string().optional(),
  tools_required: z.array(z.string()).optional(),
  actions: z.array(AliasActionSchema).optional(),
  mode: z.enum(['tactical', 'strategic']).optional(),
  context: z.array(z.string()).optional(),
  priority: z.number().optional(),
  enabled: z.boolean().optional(),
});

/**
 * Create aliases routes
 */
export function createAliasesRoutes(supabase: SupabaseClient): Router {
  const router = Router();

  /**
   * POST /v1/aliases
   * Create a new alias
   */
  router.post('/', requireScope('founder-os:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const input = CreateAliasSchema.parse(req.body) as AliasInput;
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await AliasService.create(ctx, input);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json({
        alias: result.alias,
        hint: `Alias created! You can now use: "${result.alias?.pattern}"`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * GET /v1/aliases
   * List all aliases
   */
  router.get('/', requireScope('founder-os:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.apiKey?.ownerId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const includeDisabled = req.query['includeDisabled'] === 'true';
      const limit = req.query['limit'] ? Number(req.query['limit']) : 100;
      const offset = req.query['offset'] ? Number(req.query['offset']) : 0;

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await AliasService.list(ctx, { includeDisabled, limit, offset });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.json({
        aliases: result.aliases,
        count: result.aliases.length,
        hint: 'Use POST /v1/do with any pattern. Variables in {braces} are extracted from your request.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * GET /v1/aliases/search
   * Search aliases by pattern or description
   */
  router.get('/search', requireScope('founder-os:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.apiKey?.ownerId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const query = req.query['q'] as string;
      if (!query || query.length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
      }

      const limit = req.query['limit'] ? Number(req.query['limit']) : 10;

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await AliasService.search(ctx, query, limit);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.json({ aliases: result.aliases, count: result.aliases.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * GET /v1/aliases/:id
   * Get a single alias
   */
  router.get('/:id', requireScope('founder-os:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const aliasId = req.params['id'] ?? '';
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await AliasService.getById(ctx, aliasId);

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      return res.json({ alias: result.alias });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * PUT /v1/aliases/:id
   * Update an alias
   */
  router.put('/:id', requireScope('founder-os:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const aliasId = req.params['id'] ?? '';
      const updates = UpdateAliasSchema.parse(req.body) as AliasUpdateInput;
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await AliasService.update(ctx, aliasId, updates);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json({ alias: result.alias, message: 'Alias updated' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * POST /v1/aliases/:id/disable
   * Disable an alias
   */
  router.post('/:id/disable', requireScope('founder-os:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const aliasId = req.params['id'] ?? '';
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await AliasService.disable(ctx, aliasId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json({ alias: result.alias, message: 'Alias disabled' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * POST /v1/aliases/:id/enable
   * Enable a disabled alias
   */
  router.post('/:id/enable', requireScope('founder-os:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const aliasId = req.params['id'] ?? '';
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await AliasService.enable(ctx, aliasId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json({ alias: result.alias, message: 'Alias enabled' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * DELETE /v1/aliases/:id
   * Delete an alias
   */
  router.delete('/:id', requireScope('founder-os:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const aliasId = req.params['id'] ?? '';
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }

      const ctx = { supabase, userId, layer: `founder:${userId}` };
      const result = await AliasService.delete(ctx, aliasId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json({ success: true, message: 'Alias deleted' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  return router;
}
