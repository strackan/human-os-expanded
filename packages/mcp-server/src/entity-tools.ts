/**
 * MCP Tools for Entity Operations
 *
 * Tools for creating, reading, updating, and searching entities.
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  TABLES,
  type Entity,
  type EntityType,
  type PrivacyScope,
  type SourceSystem,
  type DatabaseEntity,
} from '@human-os/core';

/**
 * Partial type for search/list results that only select certain columns
 */
interface EntityPartial {
  id: string;
  slug: string | null;
  name: string;
  entity_type: string;
  email: string | null;
  created_at?: string;
}

/**
 * Tool definitions for entity operations
 */
export const entityTools: Tool[] = [
  {
    name: 'entity_create',
    description: 'Create a new entity (person, company, project, goal, task)',
    inputSchema: {
      type: 'object',
      properties: {
        entityType: {
          type: 'string',
          enum: ['person', 'company', 'project', 'goal', 'task', 'expert'],
          description: 'Type of entity',
        },
        name: {
          type: 'string',
          description: 'Name of the entity',
        },
        slug: {
          type: 'string',
          description: 'URL-friendly identifier (auto-generated if not provided)',
        },
        email: {
          type: 'string',
          description: 'Email address (for person entities)',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata as key-value pairs',
        },
        privacyScope: {
          type: 'string',
          enum: ['public', 'powerpak_published', 'tenant', 'user', 'private'],
          description: 'Privacy scope (default: private)',
        },
      },
      required: ['entityType', 'name'],
    },
  },
  {
    name: 'entity_get',
    description: 'Get an entity by ID or slug',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Entity UUID',
        },
        slug: {
          type: 'string',
          description: 'Entity slug (alternative to ID)',
        },
      },
    },
  },
  {
    name: 'entity_update',
    description: 'Update an entity',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Entity UUID to update',
        },
        name: {
          type: 'string',
          description: 'New name',
        },
        email: {
          type: 'string',
          description: 'New email',
        },
        metadata: {
          type: 'object',
          description: 'Metadata to merge (not replace)',
        },
        privacyScope: {
          type: 'string',
          enum: ['public', 'powerpak_published', 'tenant', 'user', 'private'],
          description: 'New privacy scope',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'entity_delete',
    description: 'Delete an entity',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Entity UUID to delete',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'entity_search',
    description: 'Search entities by name, type, or metadata',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (searches name)',
        },
        entityType: {
          type: 'string',
          enum: ['person', 'company', 'project', 'goal', 'task', 'expert'],
          description: 'Filter by entity type',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)',
        },
      },
    },
  },
  {
    name: 'entity_list_by_type',
    description: 'List all entities of a specific type',
    inputSchema: {
      type: 'object',
      properties: {
        entityType: {
          type: 'string',
          enum: ['person', 'company', 'project', 'goal', 'task', 'expert'],
          description: 'Entity type to list',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination',
        },
      },
      required: ['entityType'],
    },
  },
];

/**
 * Input validation schemas
 */
const CreateInputSchema = z.object({
  entityType: z.enum(['person', 'company', 'project', 'goal', 'task', 'expert']),
  name: z.string(),
  slug: z.string().optional(),
  email: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  privacyScope: z.enum(['public', 'powerpak_published', 'tenant', 'user', 'private']).optional(),
});

const GetInputSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
}).refine(data => data.id || data.slug, {
  message: 'Either id or slug must be provided',
});

const UpdateInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  privacyScope: z.enum(['public', 'powerpak_published', 'tenant', 'user', 'private']).optional(),
});

const DeleteInputSchema = z.object({
  id: z.string(),
});

const SearchInputSchema = z.object({
  query: z.string().optional(),
  entityType: z.enum(['person', 'company', 'project', 'goal', 'task', 'expert']).optional(),
  limit: z.number().optional(),
});

const ListByTypeInputSchema = z.object({
  entityType: z.enum(['person', 'company', 'project', 'goal', 'task', 'expert']),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

/**
 * Generate a slug from a name
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Handle entity tool calls
 */
export async function handleEntityTool(
  toolName: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient,
  userId?: string,
  tenantId?: string
): Promise<unknown> {
  switch (toolName) {
    case 'entity_create': {
      const input = CreateInputSchema.parse(args);
      const slug = input.slug || slugify(input.name);

      const { data, error } = await supabase
        .from(TABLES.ENTITIES)
        .insert({
          slug,
          entity_type: input.entityType,
          name: input.name,
          email: input.email,
          metadata: input.metadata || {},
          owner_id: userId,
          tenant_id: tenantId,
          privacy_scope: input.privacyScope || 'private',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create entity: ${error.message}`);
      }

      return {
        success: true,
        entity: {
          id: data.id,
          slug: data.slug,
          name: data.name,
          entityType: data.entity_type,
        },
      };
    }

    case 'entity_get': {
      const input = GetInputSchema.parse(args);

      let query = supabase.from(TABLES.ENTITIES).select('*');

      if (input.id) {
        query = query.eq('id', input.id);
      } else if (input.slug) {
        query = query.eq('slug', input.slug);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        return { error: 'Entity not found' };
      }

      return {
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
      };
    }

    case 'entity_update': {
      const input = UpdateInputSchema.parse(args);

      const updates: Record<string, unknown> = {};
      if (input.name) updates.name = input.name;
      if (input.email) updates.email = input.email;
      if (input.privacyScope) updates.privacy_scope = input.privacyScope;

      // Merge metadata if provided
      if (input.metadata) {
        const { data: existing } = await supabase
          .from(TABLES.ENTITIES)
          .select('metadata')
          .eq('id', input.id)
          .single();

        updates.metadata = {
          ...(existing?.metadata || {}),
          ...input.metadata,
        };
      }

      const { data, error } = await supabase
        .from(TABLES.ENTITIES)
        .update(updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update entity: ${error.message}`);
      }

      return {
        success: true,
        entity: {
          id: data.id,
          slug: data.slug,
          name: data.name,
        },
      };
    }

    case 'entity_delete': {
      const input = DeleteInputSchema.parse(args);

      const { error } = await supabase
        .from(TABLES.ENTITIES)
        .delete()
        .eq('id', input.id);

      if (error) {
        throw new Error(`Failed to delete entity: ${error.message}`);
      }

      return { success: true };
    }

    case 'entity_search': {
      const input = SearchInputSchema.parse(args);
      const limit = input.limit || 20;

      let query = supabase
        .from(TABLES.ENTITIES)
        .select('id, slug, name, entity_type, email, privacy_scope')
        .limit(limit);

      if (input.query) {
        query = query.ilike('name', `%${input.query}%`);
      }

      if (input.entityType) {
        query = query.eq('entity_type', input.entityType);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      return {
        results: (data || []).map((e: EntityPartial) => ({
          id: e.id,
          slug: e.slug,
          name: e.name,
          entityType: e.entity_type,
          email: e.email,
        })),
      };
    }

    case 'entity_list_by_type': {
      const input = ListByTypeInputSchema.parse(args);
      const limit = input.limit || 50;
      const offset = input.offset || 0;

      const { data, error } = await supabase
        .from(TABLES.ENTITIES)
        .select('id, slug, name, entity_type, email, created_at')
        .eq('entity_type', input.entityType)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`List failed: ${error.message}`);
      }

      return {
        entities: (data || []).map((e: EntityPartial) => ({
          id: e.id,
          slug: e.slug,
          name: e.name,
          entityType: e.entity_type,
          email: e.email,
          createdAt: e.created_at,
        })),
      };
    }

    default:
      throw new Error(`Unknown entity tool: ${toolName}`);
  }
}
