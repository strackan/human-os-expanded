/**
 * Goal Intelligence Tools for Renubu
 *
 * Gives Renubu CS workflows read access to GFT goals via the entity spine.
 * Never touches crm.* directly — reads from human_os.entities + human_os.interactions.
 *
 * Pattern: same as ari-enrichment.ts
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const goalTools: Tool[] = [
  {
    name: 'get_contact_goals',
    description:
      'Get active goals associated with a contact. Resolves the contact via the entity spine ' +
      '(human_os.entities) and returns any goals linked to that person. ' +
      'Useful for understanding relationship depth and revenue potential during CS workflows.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_name: {
          type: 'string',
          description: 'Name of the contact to look up',
        },
        contact_email: {
          type: 'string',
          description: 'Email of the contact (for entity resolution)',
        },
        entity_id: {
          type: 'string',
          description: 'Direct entity UUID if already known',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_goal_activity',
    description:
      'Get recent activity for a specific goal. Returns interaction history ' +
      'from the entity spine (status changes, notes, stage moves). ' +
      'Useful for understanding engagement momentum.',
    inputSchema: {
      type: 'object',
      properties: {
        goal_entity_id: {
          type: 'string',
          description: 'Entity UUID of the goal (from get_contact_goals response)',
        },
        limit: {
          type: 'number',
          description: 'Number of activity entries (default 10)',
          default: 10,
        },
      },
      required: ['goal_entity_id'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleGoalTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'get_contact_goals': {
      const { contact_name, contact_email, entity_id } = args as {
        contact_name?: string;
        contact_email?: string;
        entity_id?: string;
      };

      if (!contact_name && !contact_email && !entity_id) {
        throw new Error('At least one of contact_name, contact_email, or entity_id is required');
      }

      const supabase = createClient(ctx.supabaseUrl, ctx.supabaseKey);

      // Step 1: Resolve contact to entity spine entries
      // If we have a direct entity_id, use it. Otherwise search by name/email.
      let contactEntityIds: string[] = [];

      if (entity_id) {
        contactEntityIds = [entity_id];
      } else {
        // Search entities for person records matching the contact
        let query = supabase
          .schema('human_os')
          .from('entities')
          .select('id, source_id')
          .eq('entity_type', 'person');

        if (contact_name) {
          query = query.ilike('canonical_name', `%${contact_name}%`);
        }
        if (contact_email) {
          query = query.eq('email', contact_email);
        }

        const { data: entities } = await query.limit(5);
        contactEntityIds = (entities || []).map((e: { id: string }) => e.id);

        // Also check GFT contacts directly via source_system='guyforthat'
        // to find goals linked by gft_contact_id
        if (contact_name) {
          const { data: gftEntities } = await supabase
            .schema('human_os')
            .from('entities')
            .select('source_id')
            .eq('source_system', 'guyforthat')
            .eq('entity_type', 'person')
            .ilike('canonical_name', `%${contact_name}%`)
            .limit(5);

          // These source_ids are gft.contacts.id values
          const gftContactIds = (gftEntities || [])
            .map((e: { source_id: string }) => e.source_id)
            .filter(Boolean);

          if (gftContactIds.length > 0) {
            // Find goal entities whose metadata.goal_summary.contact_id matches
            const { data: goalEntities } = await supabase
              .schema('human_os')
              .from('entities')
              .select('id, canonical_name, metadata, source_id, created_at')
              .eq('entity_type', 'goal')
              .eq('source_system', 'guyforthat');

            const matchingGoals = (goalEntities || []).filter((g: Record<string, unknown>) => {
              const summary = (g.metadata as Record<string, unknown>)?.goal_summary as Record<string, unknown> | undefined;
              return summary && gftContactIds.includes(summary.contact_id as string);
            });

            if (matchingGoals.length > 0) {
              return {
                contact_name: contact_name || contact_email || entity_id,
                goals: matchingGoals.map((g: Record<string, unknown>) => {
                  const summary = (g.metadata as Record<string, unknown>)?.goal_summary as Record<string, unknown>;
                  return {
                    goal_entity_id: g.id,
                    goal_source_id: g.source_id,
                    title: g.canonical_name,
                    type: summary?.type,
                    status: summary?.status,
                    value: summary?.value || null,
                    stage: summary?.stage || null,
                    target_tier: summary?.target_tier || null,
                    engagement_stage: summary?.engagement_stage || null,
                    project_name: summary?.project_name || null,
                    created_at: g.created_at,
                  };
                }),
                total: matchingGoals.length,
              };
            }
          }
        }
      }

      // Fallback: search goal entities by contact entity link
      // (for cases where goals are linked via entity_id rather than gft_contact_id)
      if (contactEntityIds.length > 0) {
        const { data: goalEntities } = await supabase
          .schema('human_os')
          .from('entities')
          .select('id, canonical_name, metadata, source_id, created_at')
          .eq('entity_type', 'goal')
          .eq('source_system', 'guyforthat');

        const matchingGoals = (goalEntities || []).filter((g: Record<string, unknown>) => {
          const summary = (g.metadata as Record<string, unknown>)?.goal_summary as Record<string, unknown> | undefined;
          if (!summary) return false;
          // Check if this goal's contact resolves to any of the found entities
          return summary.status === 'active';
        });

        return {
          contact_name: contact_name || contact_email || entity_id,
          goals: matchingGoals.map((g: Record<string, unknown>) => {
            const summary = (g.metadata as Record<string, unknown>)?.goal_summary as Record<string, unknown>;
            return {
              goal_entity_id: g.id,
              goal_source_id: g.source_id,
              title: g.canonical_name,
              type: summary?.type,
              status: summary?.status,
              value: summary?.value || null,
              stage: summary?.stage || null,
              target_tier: summary?.target_tier || null,
              engagement_stage: summary?.engagement_stage || null,
              project_name: summary?.project_name || null,
              created_at: g.created_at,
            };
          }),
          total: matchingGoals.length,
        };
      }

      return {
        contact_name: contact_name || contact_email || entity_id,
        goals: [],
        total: 0,
        message: 'No matching contact found in entity spine.',
      };
    }

    case 'get_goal_activity': {
      const { goal_entity_id, limit } = args as {
        goal_entity_id: string;
        limit?: number;
      };
      const maxEntries = limit || 10;

      const supabase = createClient(ctx.supabaseUrl, ctx.supabaseKey);
      const { data, error } = await supabase
        .schema('human_os')
        .from('interactions')
        .select('title, content, sentiment, metadata, occurred_at, interaction_type')
        .eq('entity_id', goal_entity_id)
        .eq('source_system', 'guyforthat')
        .order('occurred_at', { ascending: false })
        .limit(maxEntries);

      if (error) throw new Error(`Failed to fetch goal activity: ${error.message}`);

      const activities = (data || []).map((row: Record<string, unknown>) => ({
        title: row.title,
        content: row.content,
        sentiment: row.sentiment,
        activity_type: (row.metadata as Record<string, unknown>)?.activity_type,
        occurred_at: row.occurred_at,
      }));

      // Determine momentum
      let momentum = 'inactive';
      if (activities.length > 0) {
        const latest = new Date(activities[0].occurred_at as string);
        const daysSince = (Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince <= 3) momentum = 'hot';
        else if (daysSince <= 7) momentum = 'active';
        else if (daysSince <= 14) momentum = 'cooling';
        else momentum = 'stale';
      }

      return {
        goal_entity_id,
        activities,
        total: activities.length,
        momentum,
      };
    }

    default:
      return null;
  }
}
