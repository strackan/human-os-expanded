/**
 * Context Routes
 *
 * REST endpoints for context file operations.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { ContextEngine, Layer } from '@human-os/core';
import { type AuthenticatedRequest, requireScope } from '../../middleware/auth.js';

const CreateContextSchema = z.object({
  layer: z.string(),
  folder: z.string(),
  slug: z.string(),
  content: z.string(),
});

const SearchSchema = z.object({
  query: z.string(),
  limit: z.number().optional(),
});

/**
 * Create context routes
 */
export function createContextRoutes(contextEngine: ContextEngine): Router {
  const router = Router();

  // Create context file
  router.post('/', requireScope('context:*:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const input = CreateContextSchema.parse(req.body);

      const result = await contextEngine.saveContext(
        input.layer as Layer,
        input.folder,
        input.slug,
        input.content
      );

      return res.status(201).json({
        success: true,
        filePath: result.filePath,
        entityId: result.entityId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Read context file (path format: /:layer/:folder/:slug)
  router.get('/:layer/:folder/:slug', requireScope('context:*:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const layer = req.params['layer'] ?? '';
      const folder = req.params['folder'] ?? '';
      const slug = req.params['slug'] ?? '';

      const result = await contextEngine.getContext(layer as Layer, folder, slug);

      if (!result) {
        return res.status(404).json({ error: 'Context file not found' });
      }

      return res.json({
        filePath: result.filePath,
        frontmatter: result.frontmatter,
        content: result.content,
        entityId: result.entityId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Update context file
  router.put('/:layer/:folder/:slug', requireScope('context:*:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const layer = req.params['layer'] ?? '';
      const folder = req.params['folder'] ?? '';
      const slug = req.params['slug'] ?? '';
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Content is required' });
      }

      const result = await contextEngine.saveContext(layer as Layer, folder, slug, content);

      return res.json({
        success: true,
        filePath: result.filePath,
        entityId: result.entityId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Delete context file
  router.delete('/:layer/:folder/:slug', requireScope('context:*:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const layer = req.params['layer'] ?? '';
      const folder = req.params['folder'] ?? '';
      const slug = req.params['slug'] ?? '';

      await contextEngine.deleteContext(layer as Layer, folder, slug);

      return res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Search context files
  router.get('/search', requireScope('context:*:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const input = SearchSchema.parse({
        query: req.query['query'],
        limit: req.query['limit'] ? Number(req.query['limit']) : undefined,
      });

      const results = await contextEngine.searchContext(input.query, {
        limit: input.limit,
      });

      return res.json({
        results: results.map(f => ({
          filePath: f.filePath,
          frontmatter: f.frontmatter,
          snippet: f.content.slice(0, 200),
        })),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Get merged context for an entity
  router.get('/merged/:slug', requireScope('context:*:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const slug = req.params['slug'] ?? '';

      const result = await contextEngine.getMergedContext(slug);

      if (!result) {
        return res.status(404).json({ error: 'Entity not found' });
      }

      return res.json({
        entity: result.entity,
        layers: result.layers.map(l => ({
          layer: l.layer,
          frontmatter: l.frontmatter,
          content: l.content,
        })),
        connections: {
          incoming: result.connections.incoming.length,
          outgoing: result.connections.outgoing.length,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  return router;
}
