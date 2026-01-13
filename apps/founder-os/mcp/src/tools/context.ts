/**
 * Context Tools
 *
 * MCP tools for managing the knowledge graph context system.
 * Context links objects (entities, relationships, projects) to context slugs.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';

/** Schema where context table lives */
const CONTEXT_SCHEMA = 'human_os';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const contextTools: Tool[] = [
  {
    name: 'add_context',
    description: `Add context to an object (entity, relationship, project, etc.).
Creates a knowledge graph link between the object and a context slug.
Example: Add Ruth to 'marriage' context with notes about weekly planning.`,
    inputSchema: {
      type: 'object',
      properties: {
        object_uuid: {
          type: 'string',
          description: 'UUID of the object to add context to',
        },
        object_type: {
          type: 'string',
          description: 'Type of object: relationship, entity, task, project, goal, etc.',
        },
        context_slug: {
          type: 'string',
          description: 'Context slug (e.g., marriage, renubu, good-hang)',
        },
        notes: {
          type: 'string',
          description: 'Context notes - what role does this object play in this context?',
        },
        product_id: {
          type: 'string',
          enum: ['human_os', 'founder_os', 'renubu', 'gft', 'voice_os', 'goodhang'],
          description: 'Which product this context belongs to (default: founder_os)',
        },
      },
      required: ['object_uuid', 'object_type', 'context_slug'],
    },
  },
  {
    name: 'update_context',
    description: 'Update existing context notes or status for an object.',
    inputSchema: {
      type: 'object',
      properties: {
        object_uuid: {
          type: 'string',
          description: 'UUID of the object',
        },
        context_slug: {
          type: 'string',
          description: 'Context slug to update',
        },
        notes: {
          type: 'string',
          description: 'Updated notes',
        },
        active: {
          type: 'boolean',
          description: 'Set active status (false to deactivate)',
        },
      },
      required: ['object_uuid', 'context_slug'],
    },
  },
  {
    name: 'archive_context',
    description: 'Archive/deactivate context for an object (soft delete).',
    inputSchema: {
      type: 'object',
      properties: {
        object_uuid: {
          type: 'string',
          description: 'UUID of the object',
        },
        context_slug: {
          type: 'string',
          description: 'Context slug to archive',
        },
      },
      required: ['object_uuid', 'context_slug'],
    },
  },
  {
    name: 'get_object_context',
    description: 'Get all context entries for a specific object UUID. Shows what contexts an entity/relationship/project belongs to.',
    inputSchema: {
      type: 'object',
      properties: {
        object_uuid: {
          type: 'string',
          description: 'UUID of the object to get context for',
        },
        product_id: {
          type: 'string',
          description: 'Optional: filter by product',
        },
        include_inactive: {
          type: 'boolean',
          description: 'Include inactive/archived context (default: false)',
        },
      },
      required: ['object_uuid'],
    },
  },
  {
    name: 'get_context_members',
    description: 'Get all objects that belong to a context slug. Shows who/what is part of a context like "marriage" or "renubu".',
    inputSchema: {
      type: 'object',
      properties: {
        context_slug: {
          type: 'string',
          description: 'Context slug to get members for',
        },
        object_type: {
          type: 'string',
          description: 'Optional: filter by object type (relationship, entity, etc.)',
        },
        product_id: {
          type: 'string',
          description: 'Optional: filter by product',
        },
        include_inactive: {
          type: 'boolean',
          description: 'Include inactive members (default: false)',
        },
      },
      required: ['context_slug'],
    },
  },
  {
    name: 'list_contexts',
    description: 'List all context slugs with member counts. Shows available contexts.',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: {
          type: 'string',
          description: 'Optional: filter by product',
        },
        include_inactive: {
          type: 'boolean',
          description: 'Include inactive contexts (default: false)',
        },
      },
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const AddContextSchema = z.object({
  object_uuid: z.string().uuid(),
  object_type: z.string(),
  context_slug: z.string().min(1).transform(s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
  notes: z.string().optional(),
  product_id: z.enum(['human_os', 'founder_os', 'renubu', 'gft', 'voice_os', 'goodhang']).optional().default('founder_os'),
});

const UpdateContextSchema = z.object({
  object_uuid: z.string().uuid(),
  context_slug: z.string(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
});

const ArchiveContextSchema = z.object({
  object_uuid: z.string().uuid(),
  context_slug: z.string(),
});

const GetObjectContextSchema = z.object({
  object_uuid: z.string().uuid(),
  product_id: z.string().optional(),
  include_inactive: z.boolean().optional().default(false),
});

const GetContextMembersSchema = z.object({
  context_slug: z.string(),
  object_type: z.string().optional(),
  product_id: z.string().optional(),
  include_inactive: z.boolean().optional().default(false),
});

const ListContextsSchema = z.object({
  product_id: z.string().optional(),
  include_inactive: z.boolean().optional().default(false),
});

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleContextTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const supabase = ctx.getClient();
  const schema = supabase.schema(CONTEXT_SCHEMA);

  switch (name) {
    case 'add_context': {
      const data = AddContextSchema.parse(args);

      const { data: result, error } = await schema.rpc('set_context', {
        p_object_uuid: data.object_uuid,
        p_object_type: data.object_type,
        p_context_slug: data.context_slug,
        p_notes: data.notes || null,
        p_layer: ctx.layer,
        p_product_id: data.product_id,
        p_active: true,
      });

      if (error) {
        throw new Error(`Failed to add context: ${error.message}`);
      }

      return {
        success: true,
        context_id: result,
        message: `Added ${data.object_type} to context '${data.context_slug}'`,
      };
    }

    case 'update_context': {
      const data = UpdateContextSchema.parse(args);

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (data.notes !== undefined) updates.notes = data.notes;
      if (data.active !== undefined) {
        updates.active = data.active;
        updates.status = data.active ? 'active' : 'inactive';
      }

      const { error } = await schema
        .from('context')
        .update(updates)
        .eq('object_uuid', data.object_uuid)
        .eq('context_slug', data.context_slug)
        .eq('layer', ctx.layer);

      if (error) {
        throw new Error(`Failed to update context: ${error.message}`);
      }

      return {
        success: true,
        message: `Updated context '${data.context_slug}' for object`,
      };
    }

    case 'archive_context': {
      const data = ArchiveContextSchema.parse(args);

      const { error } = await schema.rpc('deactivate_context', {
        p_object_uuid: data.object_uuid,
        p_context_slug: data.context_slug,
        p_layer: ctx.layer,
      });

      if (error) {
        throw new Error(`Failed to archive context: ${error.message}`);
      }

      return {
        success: true,
        message: `Archived context '${data.context_slug}' for object`,
      };
    }

    case 'get_object_context': {
      const data = GetObjectContextSchema.parse(args);

      const { data: results, error } = await schema.rpc('get_object_context', {
        p_object_uuid: data.object_uuid,
        p_layer: ctx.layer,
        p_product_id: data.product_id || null,
        p_active_only: !data.include_inactive,
      });

      if (error) {
        throw new Error(`Failed to get context: ${error.message}`);
      }

      return {
        object_uuid: data.object_uuid,
        contexts: results || [],
        count: results?.length || 0,
      };
    }

    case 'get_context_members': {
      const data = GetContextMembersSchema.parse(args);

      const { data: results, error } = await schema.rpc('get_context_members', {
        p_context_slug: data.context_slug,
        p_layer: ctx.layer,
        p_product_id: data.product_id || null,
        p_object_type: data.object_type || null,
        p_active_only: !data.include_inactive,
      });

      if (error) {
        throw new Error(`Failed to get context members: ${error.message}`);
      }

      return {
        context_slug: data.context_slug,
        members: results || [],
        count: results?.length || 0,
      };
    }

    case 'list_contexts': {
      const data = ListContextsSchema.parse(args);

      const { data: results, error } = await schema.rpc('list_context_slugs', {
        p_layer: ctx.layer,
        p_product_id: data.product_id || null,
        p_active_only: !data.include_inactive,
      });

      if (error) {
        throw new Error(`Failed to list contexts: ${error.message}`);
      }

      return {
        contexts: results || [],
        count: results?.length || 0,
      };
    }

    default:
      return null;
  }
}
