/**
 * Experts Routes
 *
 * REST endpoints for expert profile operations.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContextEngine, Layer } from '@human-os/core';
import { TABLES } from '@human-os/core';
import { type AuthenticatedRequest, requireScope } from '../../middleware/auth.js';

const QuerySchema = z.object({
  question: z.string(),
  context: z.record(z.unknown()).optional(),
});

interface ExpertRow {
  id: string;
  slug: string | null;
  name: string;
  email: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Create experts routes
 */
export function createExpertsRoutes(
  supabase: SupabaseClient,
  contextEngine: ContextEngine
): Router {
  const router = Router();

  // Get expert profile
  router.get('/:id', requireScope('experts:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const id = req.params['id'] ?? '';

      // Get entity
      const { data: entity, error } = await supabase
        .from(TABLES.ENTITIES)
        .select('*')
        .eq('slug', id)
        .eq('entity_type', 'expert')
        .single();

      if (error || !entity) {
        return res.status(404).json({ error: 'Expert not found' });
      }

      // Get expert's SKILL.md from powerpak-published layer
      const skillFile = await contextEngine.getContext(
        'powerpak-published' as Layer,
        'experts',
        id
      );

      return res.json({
        expert: {
          id: entity.id,
          slug: entity.slug,
          name: entity.name,
          email: entity.email,
          metadata: entity.metadata,
        },
        skill: skillFile ? {
          frontmatter: skillFile.frontmatter,
          content: skillFile.content,
        } : null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Query expert's knowledge
  router.post('/:id/query', async (req: AuthenticatedRequest, res) => {
    try {
      const id = req.params['id'] ?? '';
      const requiredScope = `experts:${id}:query`;

      // Check scope
      const scopes = req.scopes || [];
      const hasScope = scopes.some(scope =>
        scope === requiredScope ||
        scope === 'experts:*:query' ||
        scope.startsWith(`experts:${id}:`)
      );

      if (!hasScope) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredScope,
        });
      }

      const input = QuerySchema.parse(req.body);

      // Get entity
      const { data: entity, error } = await supabase
        .from(TABLES.ENTITIES)
        .select('*')
        .eq('slug', id)
        .eq('entity_type', 'expert')
        .single();

      if (error || !entity) {
        return res.status(404).json({ error: 'Expert not found' });
      }

      // Get expert's SKILL.md
      const skillFile = await contextEngine.getContext(
        'powerpak-published' as Layer,
        'experts',
        id
      );

      if (!skillFile) {
        return res.status(404).json({ error: 'Expert skill file not found' });
      }

      // Return expert context for query
      // Note: Actual query processing happens on client side with LLM
      return res.json({
        expert: {
          id: entity.id,
          slug: entity.slug,
          name: entity.name,
        },
        skill: {
          frontmatter: skillFile.frontmatter,
          content: skillFile.content,
        },
        query: input.question,
        context: input.context,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Search experts
  router.get('/', requireScope('experts:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const query = req.query['query'] as string | undefined;
      const limit = req.query['limit'] ? Number(req.query['limit']) : 20;

      let dbQuery = supabase
        .from(TABLES.ENTITIES)
        .select('id, slug, name, email, metadata')
        .eq('entity_type', 'expert')
        .limit(limit);

      if (query) {
        dbQuery = dbQuery.ilike('name', `%${query}%`);
      }

      const { data, error } = await dbQuery;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      return res.json({
        experts: (data || []).map((e: ExpertRow) => ({
          id: e.id,
          slug: e.slug,
          name: e.name,
          email: e.email,
          metadata: e.metadata,
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  return router;
}
