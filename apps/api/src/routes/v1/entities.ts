/**
 * Entities Routes
 *
 * REST endpoints for entity CRUD operations.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TABLES, type EntityType, type PrivacyScope } from '@human-os/core';
import { type AuthenticatedRequest, requireScope } from '../../middleware/auth.js';

const CreateEntitySchema = z.object({
  entityType: z.enum(['person', 'company', 'project', 'goal', 'task', 'expert']),
  name: z.string(),
  slug: z.string().optional(),
  email: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  privacyScope: z.enum(['public', 'powerpak_published', 'tenant', 'user', 'private']).optional(),
});

const UpdateEntitySchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  privacyScope: z.enum(['public', 'powerpak_published', 'tenant', 'user', 'private']).optional(),
});

interface EntityRow {
  id: string;
  slug: string | null;
  name: string;
  entity_type: string;
  email: string | null;
  metadata: Record<string, unknown>;
  privacy_scope: string;
  created_at: string;
  updated_at: string;
}

interface EntitySearchRow {
  id: string;
  slug: string | null;
  name: string;
  entity_type: string;
  email: string | null;
  privacy_scope: string;
}

interface EntityListRow {
  id: string;
  slug: string | null;
  name: string;
  entity_type: string;
  email: string | null;
  created_at: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Create entities routes
 */
export function createEntitiesRoutes(supabase: SupabaseClient): Router {
  const router = Router();

  // Create entity
  router.post('/', requireScope('entities:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const input = CreateEntitySchema.parse(req.body);
      const slug = input.slug || slugify(input.name);
      const userId = req.apiKey?.ownerId;

      const { data, error } = await supabase
        .from(TABLES.ENTITIES)
        .insert({
          slug,
          entity_type: input.entityType,
          name: input.name,
          email: input.email,
          metadata: input.metadata || {},
          owner_id: userId,
          privacy_scope: input.privacyScope || 'private',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create entity: ${error.message}`);
      }

      return res.status(201).json({
        entity: {
          id: data.id,
          slug: data.slug,
          name: data.name,
          entityType: data.entity_type,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Get entity by ID
  router.get('/:id', requireScope('entities:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const id = req.params['id'] ?? '';

      const { data, error } = await supabase
        .from(TABLES.ENTITIES)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Entity not found' });
      }

      return res.json({
        entity: {
          id: data.id,
          slug: data.slug,
          name: data.name,
          entityType: data.entity_type,
          email: data.email,
          metadata: data.metadata,
          privacyScope: data.privacy_scope,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Update entity
  router.put('/:id', requireScope('entities:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const id = req.params['id'] ?? '';
      const input = UpdateEntitySchema.parse(req.body);

      const updates: Record<string, unknown> = {};
      if (input.name) updates.name = input.name;
      if (input.email) updates.email = input.email;
      if (input.privacyScope) updates.privacy_scope = input.privacyScope;

      // Merge metadata if provided
      if (input.metadata) {
        const { data: existing } = await supabase
          .from(TABLES.ENTITIES)
          .select('metadata')
          .eq('id', id)
          .single();

        updates.metadata = {
          ...(existing?.metadata || {}),
          ...input.metadata,
        };
      }

      const { data, error } = await supabase
        .from(TABLES.ENTITIES)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update entity: ${error.message}`);
      }

      return res.json({
        entity: {
          id: data.id,
          slug: data.slug,
          name: data.name,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Delete entity
  router.delete('/:id', requireScope('entities:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const id = req.params['id'] ?? '';

      const { error } = await supabase
        .from(TABLES.ENTITIES)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete entity: ${error.message}`);
      }

      return res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Search entities
  router.get('/search', requireScope('entities:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const query = req.query['query'] as string | undefined;
      const entityType = req.query['entityType'] as EntityType | undefined;
      const limit = req.query['limit'] ? Number(req.query['limit']) : 20;

      let dbQuery = supabase
        .from(TABLES.ENTITIES)
        .select('id, slug, name, entity_type, email, privacy_scope')
        .limit(limit);

      if (query) {
        dbQuery = dbQuery.ilike('name', `%${query}%`);
      }

      if (entityType) {
        dbQuery = dbQuery.eq('entity_type', entityType);
      }

      const { data, error } = await dbQuery;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      return res.json({
        results: (data || []).map((e: EntitySearchRow) => ({
          id: e.id,
          slug: e.slug,
          name: e.name,
          entityType: e.entity_type,
          email: e.email,
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // List entities by type
  router.get('/type/:entityType', requireScope('entities:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const entityType = req.params['entityType'] ?? '';
      const limit = req.query['limit'] ? Number(req.query['limit']) : 50;
      const offset = req.query['offset'] ? Number(req.query['offset']) : 0;

      const { data, error } = await supabase
        .from(TABLES.ENTITIES)
        .select('id, slug, name, entity_type, email, created_at')
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`List failed: ${error.message}`);
      }

      return res.json({
        entities: (data || []).map((e: EntityListRow) => ({
          id: e.id,
          slug: e.slug,
          name: e.name,
          entityType: e.entity_type,
          email: e.email,
          createdAt: e.created_at,
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  return router;
}
