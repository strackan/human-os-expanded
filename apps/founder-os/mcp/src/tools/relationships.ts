/**
 * Relationship Tools
 *
 * MCP tools for managing personal and professional relationships.
 * Tracks key contacts, communication cadence, and relationship context.
 *
 * Claude should be PROACTIVE about:
 * - Adding new relationships when people are mentioned
 * - Asking "who is X?" when encountering unknown names
 * - Suggesting relationship types based on context
 * - Tracking last contact from email/meeting mentions
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';

/** Schema where relationships lives */
const FOUNDER_SCHEMA = 'founder_os';

/** Valid relationship types */
const RELATIONSHIP_TYPES = [
  'family',
  'friend',
  'colleague',
  'investor',
  'advisor',
  'mentor',
  'mentee',
  'client',
  'vendor',
  'partner',
  'acquaintance',
  'other',
] as const;

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const relationshipTools: Tool[] = [
  {
    name: 'add_relationship',
    description: `Add a new relationship to track. Use this proactively when:
- User mentions someone new ("I talked to Sarah today")
- User describes a relationship ("my co-founder Mike")
- User asks to remember someone

Always ask for clarification if you can't infer the relationship type.`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Person\'s name (will also search/create entity)',
        },
        relationship: {
          type: 'string',
          description: 'How the user describes them (e.g., "my wife", "Renubu investor")',
        },
        relationship_type: {
          type: 'string',
          enum: RELATIONSHIP_TYPES,
          description: 'Category for filtering',
        },
        notes: {
          type: 'string',
          description: 'Any context to remember about this person',
        },
        contact_frequency_days: {
          type: 'number',
          description: 'How often to stay in touch (e.g., 7 for weekly, 30 for monthly)',
        },
        email: {
          type: 'string',
          description: 'Email address if known (stored on entity)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_relationship',
    description: `Get information about a relationship by name. Use when:
- User asks "who is X?"
- User mentions someone and you need context
- Preparing for a meeting or call`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Person\'s name to look up',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_relationships',
    description: 'List all relationships, optionally filtered by type.',
    inputSchema: {
      type: 'object',
      properties: {
        relationship_type: {
          type: 'string',
          enum: RELATIONSHIP_TYPES,
          description: 'Filter by type',
        },
        query: {
          type: 'string',
          description: 'Search by name',
        },
      },
    },
  },
  {
    name: 'update_relationship',
    description: `Update relationship details. Use when:
- User provides new info about someone
- Recording a recent interaction
- Changing contact frequency`,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Relationship UUID',
        },
        name: {
          type: 'string',
          description: 'Look up by name instead of ID',
        },
        relationship: {
          type: 'string',
          description: 'Updated description',
        },
        relationship_type: {
          type: 'string',
          enum: RELATIONSHIP_TYPES,
        },
        notes: {
          type: 'string',
          description: 'Updated notes (appends, does not replace)',
        },
        replace_notes: {
          type: 'boolean',
          description: 'Set to true to replace notes instead of append',
        },
        last_contact: {
          type: 'string',
          description: 'Date of last contact (YYYY-MM-DD). Use when user mentions talking to someone.',
        },
        contact_frequency_days: {
          type: 'number',
        },
        sentiment: {
          type: 'string',
          enum: ['positive', 'neutral', 'concerned', 'urgent'],
          description: 'How the relationship feels right now',
        },
      },
    },
  },
  {
    name: 'log_contact',
    description: `Log that user contacted someone. Use when:
- User says "I talked to X"
- User mentions a meeting or call
- After sending an email via prepare_email`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Person\'s name',
        },
        notes: {
          type: 'string',
          description: 'What was discussed (optional)',
        },
        contact_date: {
          type: 'string',
          description: 'Date of contact (YYYY-MM-DD). Defaults to today.',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_overdue_contacts',
    description: 'Get relationships where contact is overdue based on frequency settings.',
    inputSchema: {
      type: 'object',
      properties: {
        days_overdue: {
          type: 'number',
          description: 'Minimum days overdue. Default 0 (any overdue).',
        },
      },
    },
  },
  {
    name: 'who_is',
    description: `Quick lookup: "who is X?" Returns relationship info if found, or offers to add them.`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Person\'s name',
        },
      },
      required: ['name'],
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const AddRelationshipSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().optional(),
  relationship_type: z.enum(RELATIONSHIP_TYPES).optional(),
  notes: z.string().optional(),
  contact_frequency_days: z.number().optional(),
  email: z.string().email().optional(),
});

const UpdateRelationshipSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().optional(),
  relationship: z.string().optional(),
  relationship_type: z.enum(RELATIONSHIP_TYPES).optional(),
  notes: z.string().optional(),
  replace_notes: z.boolean().optional(),
  last_contact: z.string().optional(),
  contact_frequency_days: z.number().optional(),
  sentiment: z.enum(['positive', 'neutral', 'concerned', 'urgent']).optional(),
});

const LogContactSchema = z.object({
  name: z.string().min(1),
  notes: z.string().optional(),
  contact_date: z.string().optional(),
});

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Find or create an entity for a person
 */
async function findOrCreateEntity(
  ctx: ToolContext,
  name: string,
  email?: string
): Promise<{ id: string; name: string; email: string | null; created: boolean }> {
  const supabase = ctx.getClient();

  // Try to find existing entity
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const { data: existing } = await supabase
    .from('entities')
    .select('id, name, email')
    .eq('entity_type', 'person')
    .or(`slug.eq.${slug},name.ilike.${name}`)
    .limit(1)
    .single();

  if (existing) {
    // Update email if provided and missing
    if (email && !existing.email) {
      await supabase
        .from('entities')
        .update({ email })
        .eq('id', existing.id);
      existing.email = email;
    }
    return { ...existing, created: false };
  }

  // Create new entity
  const { data: created, error } = await supabase
    .from('entities')
    .insert({
      slug,
      entity_type: 'person',
      name,
      email: email || null,
      owner_id: ctx.userUUID,
      source_system: 'founder_os',
      privacy_scope: 'private',
    })
    .select('id, name, email')
    .single();

  if (error) {
    throw new Error(`Failed to create entity: ${error.message}`);
  }

  return { ...created, created: true };
}

/**
 * Find relationship by name
 */
async function findRelationshipByName(
  ctx: ToolContext,
  name: string
): Promise<Record<string, unknown> | null> {
  const supabase = ctx.getClient();

  // First try via entity join
  const { data: viaEntity } = await supabase
    .schema(FOUNDER_SCHEMA)
    .from('relationships')
    .select(`
      id, name, entity_id, relationship, relationship_type,
      last_contact, next_contact_due, contact_frequency_days,
      notes, sentiment, created_at
    `)
    .eq('user_id', ctx.userUUID)
    .not('entity_id', 'is', null)
    .limit(10);

  // Check if any entity matches
  if (viaEntity && viaEntity.length > 0) {
    const entityIds = viaEntity.map(r => r.entity_id).filter(Boolean);
    const { data: entities } = await supabase
      .from('entities')
      .select('id, name, email')
      .in('id', entityIds);

    const entityMap = new Map((entities || []).map(e => [e.id, e]));
    const match = viaEntity.find(r => {
      const entity = entityMap.get(r.entity_id);
      return entity?.name?.toLowerCase().includes(name.toLowerCase());
    });

    if (match) {
      const entity = entityMap.get(match.entity_id);
      return { ...match, entityName: entity?.name, entityEmail: entity?.email };
    }
  }

  // Fall back to name field
  const { data: byName } = await supabase
    .schema(FOUNDER_SCHEMA)
    .from('relationships')
    .select('*')
    .eq('user_id', ctx.userUUID)
    .ilike('name', `%${name}%`)
    .limit(1)
    .single();

  return byName;
}

// =============================================================================
// HANDLER
// =============================================================================

export async function handleRelationshipTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const supabase = ctx.getClient();
  const schema = supabase.schema(FOUNDER_SCHEMA);

  switch (name) {
    case 'add_relationship': {
      const input = AddRelationshipSchema.parse(args);

      // Find or create entity
      const entity = await findOrCreateEntity(ctx, input.name, input.email);

      // Check if relationship already exists
      const { data: existing } = await schema
        .from('relationships')
        .select('id')
        .eq('user_id', ctx.userUUID)
        .eq('entity_id', entity.id)
        .single();

      if (existing) {
        return {
          success: false,
          error: 'RELATIONSHIP_EXISTS',
          message: `Relationship with ${input.name} already exists.`,
          relationshipId: existing.id,
          suggestion: 'Use update_relationship to modify it.',
        };
      }

      // Create relationship
      const { data, error } = await schema
        .from('relationships')
        .insert({
          user_id: ctx.userUUID,
          name: input.name,
          entity_id: entity.id,
          relationship: input.relationship || null,
          relationship_type: input.relationship_type || 'other',
          notes: input.notes || null,
          contact_frequency_days: input.contact_frequency_days || null,
          sentiment: 'neutral',
        })
        .select('id, name, relationship, relationship_type')
        .single();

      if (error) {
        throw new Error(`Failed to add relationship: ${error.message}`);
      }

      return {
        success: true,
        relationship: {
          id: data.id,
          name: data.name,
          relationship: data.relationship,
          type: data.relationship_type,
        },
        entity: {
          id: entity.id,
          created: entity.created,
          email: entity.email,
        },
        message: entity.created
          ? `Added ${input.name} as a new contact and relationship.`
          : `Added relationship with existing contact ${input.name}.`,
      };
    }

    case 'get_relationship':
    case 'who_is': {
      const { name: personName } = z.object({ name: z.string() }).parse(args);

      const relationship = await findRelationshipByName(ctx, personName);

      if (!relationship) {
        return {
          found: false,
          message: `I don't have "${personName}" in your relationships yet.`,
          suggestion: `Would you like me to add them? Just tell me who they are (e.g., "they're my advisor" or "friend from college").`,
        };
      }

      const daysSinceContact = relationship.last_contact
        ? Math.floor(
            (Date.now() - new Date(relationship.last_contact as string).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

      return {
        found: true,
        id: relationship.id,
        name: relationship.entityName || relationship.name,
        email: relationship.entityEmail,
        relationship: relationship.relationship,
        type: relationship.relationship_type,
        lastContact: relationship.last_contact,
        daysSinceContact,
        nextContactDue: relationship.next_contact_due,
        contactFrequency: relationship.contact_frequency_days
          ? `every ${relationship.contact_frequency_days} days`
          : null,
        notes: relationship.notes,
        sentiment: relationship.sentiment,
      };
    }

    case 'list_relationships': {
      const input = z
        .object({
          relationship_type: z.enum(RELATIONSHIP_TYPES).optional(),
          query: z.string().optional(),
        })
        .parse(args);

      // Use helper function
      const { data, error } = await supabase.rpc('search_relationships', {
        p_user_id: ctx.userUUID,
        p_query: input.query || null,
        p_relationship_type: input.relationship_type || null,
      });

      if (error) {
        throw new Error(`Failed to list relationships: ${error.message}`);
      }

      return {
        relationships: (data || []).map((r: Record<string, unknown>) => ({
          id: r.id,
          name: r.name,
          email: r.entity_email,
          relationship: r.relationship,
          type: r.relationship_type,
          lastContact: r.last_contact,
          nextDue: r.next_contact_due,
          sentiment: r.sentiment,
        })),
        count: data?.length || 0,
        filters: {
          type: input.relationship_type,
          query: input.query,
        },
      };
    }

    case 'update_relationship': {
      const input = UpdateRelationshipSchema.parse(args);

      // Find relationship
      let relationshipId = input.id;
      if (!relationshipId && input.name) {
        const found = await findRelationshipByName(ctx, input.name);
        if (!found) {
          return {
            success: false,
            error: 'NOT_FOUND',
            message: `No relationship found for "${input.name}".`,
            suggestion: 'Use add_relationship to create it first.',
          };
        }
        relationshipId = found.id as string;
      }

      if (!relationshipId) {
        return {
          success: false,
          error: 'MISSING_ID',
          message: 'Provide either id or name to identify the relationship.',
        };
      }

      // Build update
      const updates: Record<string, unknown> = {};
      if (input.relationship) updates.relationship = input.relationship;
      if (input.relationship_type) updates.relationship_type = input.relationship_type;
      if (input.last_contact) updates.last_contact = input.last_contact;
      if (input.contact_frequency_days) updates.contact_frequency_days = input.contact_frequency_days;
      if (input.sentiment) updates.sentiment = input.sentiment;

      // Handle notes
      if (input.notes) {
        if (input.replace_notes) {
          updates.notes = input.notes;
        } else {
          // Append to existing notes
          const { data: current } = await schema
            .from('relationships')
            .select('notes')
            .eq('id', relationshipId)
            .single();

          const existingNotes = current?.notes || '';
          const timestamp = new Date().toISOString().split('T')[0];
          updates.notes = existingNotes
            ? `${existingNotes}\n\n[${timestamp}] ${input.notes}`
            : `[${timestamp}] ${input.notes}`;
        }
      }

      const { data, error } = await schema
        .from('relationships')
        .update(updates)
        .eq('id', relationshipId)
        .select('id, name, relationship, last_contact')
        .single();

      if (error) {
        throw new Error(`Failed to update relationship: ${error.message}`);
      }

      return {
        success: true,
        relationship: data,
        updated: Object.keys(updates),
      };
    }

    case 'log_contact': {
      const input = LogContactSchema.parse(args);
      const contactDate = input.contact_date || new Date().toISOString().split('T')[0];

      // Find relationship
      const found = await findRelationshipByName(ctx, input.name);

      if (!found) {
        // Create new relationship with just the contact logged
        const entity = await findOrCreateEntity(ctx, input.name);

        const { data, error } = await schema
          .from('relationships')
          .insert({
            user_id: ctx.userUUID,
            name: input.name,
            entity_id: entity.id,
            relationship_type: 'other',
            last_contact: contactDate,
            notes: input.notes ? `[${contactDate}] ${input.notes}` : null,
            sentiment: 'neutral',
          })
          .select('id')
          .single();

        if (error) {
          throw new Error(`Failed to create relationship: ${error.message}`);
        }

        return {
          success: true,
          created: true,
          message: `Logged contact with ${input.name} and added them as a new relationship.`,
          relationshipId: data.id,
          lastContact: contactDate,
          suggestion: `I've added ${input.name} to your relationships. Would you like to add more details about who they are?`,
        };
      }

      // Update existing
      const updates: Record<string, unknown> = { last_contact: contactDate };

      if (input.notes) {
        const existingNotes = (found.notes as string) || '';
        updates.notes = existingNotes
          ? `${existingNotes}\n\n[${contactDate}] ${input.notes}`
          : `[${contactDate}] ${input.notes}`;
      }

      await schema
        .from('relationships')
        .update(updates)
        .eq('id', found.id);

      return {
        success: true,
        message: `Logged contact with ${found.entityName || found.name} on ${contactDate}.`,
        relationshipId: found.id,
        lastContact: contactDate,
      };
    }

    case 'get_overdue_contacts': {
      const { days_overdue } = z
        .object({ days_overdue: z.number().optional() })
        .parse(args);

      const { data, error } = await supabase.rpc('get_overdue_relationships', {
        p_user_id: ctx.userUUID,
        p_days_overdue: days_overdue || 0,
      });

      if (error) {
        throw new Error(`Failed to get overdue contacts: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return {
          overdue: [],
          count: 0,
          message: 'No overdue contacts. You\'re staying in touch with everyone!',
        };
      }

      return {
        overdue: (data || []).map((r: Record<string, unknown>) => ({
          name: r.name,
          relationship: r.relationship,
          type: r.relationship_type,
          lastContact: r.last_contact,
          daysOverdue: r.days_overdue,
          frequency: `every ${r.contact_frequency_days} days`,
          notes: r.notes,
        })),
        count: data.length,
        message: `${data.length} relationship(s) need attention.`,
      };
    }

    default:
      return null;
  }
}
