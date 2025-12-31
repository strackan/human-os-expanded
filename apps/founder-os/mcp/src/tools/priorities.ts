/**
 * MCII Priorities Tools
 *
 * MCP tools for managing quarterly priorities using the MCII framework
 * (Mental Contrasting with Implementation Intentions).
 *
 * MCII Format:
 * - WISH: What I want
 * - OUTCOME: What changes / how I'll feel
 * - OBSTACLE: What's realistically blocking me (CRITICAL)
 * - IF-THEN: When [cue], I will [action]
 *
 * Research shows max 3 active priorities per quarter for ADHD brains.
 * This is enforced in the app layer (user can override with acknowledgment).
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';

/** Schema where priorities lives */
const FOUNDER_SCHEMA = 'founder_os';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const priorityTools: Tool[] = [
  {
    name: 'create_priority',
    description: `Create a new MCII priority for a quarter. Research recommends MAX 3 active priorities per quarter.
The tool will warn if exceeding 3, but allows override.

MCII Format:
- WISH: What I want
- OUTCOME: What changes / how I'll feel when this succeeds
- OBSTACLE: What's realistically blocking me (CRITICAL for ADHD)
- IF-THEN: When [cue], I will [action] (implementation intention)`,
    inputSchema: {
      type: 'object',
      properties: {
        wish: {
          type: 'string',
          description: 'What I want - the aspiration (e.g., "Ship Renubu MVP without burnout")',
        },
        outcome_vision: {
          type: 'string',
          description: 'What changes when this succeeds - how I\'ll feel (e.g., "Product live, still energized, relationships intact")',
        },
        obstacle: {
          type: 'string',
          description: 'What\'s realistically blocking me (e.g., "I hyperfocus and neglect Ruth, sleep, exercise")',
        },
        if_then_plan: {
          type: 'string',
          description: 'Implementation intention: "When [cue], I will [action]" (e.g., "When it\'s 6pm, I close laptop and go upstairs")',
        },
        quarter: {
          type: 'string',
          description: 'Quarter in format Q1_2026, Q2_2026, etc. Defaults to current quarter.',
        },
        year: {
          type: 'number',
          description: 'Year. Defaults to current year.',
        },
        override_max: {
          type: 'boolean',
          description: 'Set to true to acknowledge exceeding the recommended 3 priority max',
        },
      },
      required: ['wish'],
    },
  },
  {
    name: 'list_priorities',
    description: 'List priorities for a quarter. Defaults to current quarter.',
    inputSchema: {
      type: 'object',
      properties: {
        quarter: {
          type: 'string',
          description: 'Quarter (e.g., Q1_2026). Defaults to current quarter.',
        },
        year: {
          type: 'number',
          description: 'Year. Defaults to current year.',
        },
        status: {
          type: 'string',
          enum: ['active', 'completed', 'deferred', 'abandoned', 'all'],
          description: 'Filter by status. Defaults to active.',
        },
      },
    },
  },
  {
    name: 'get_priority',
    description: 'Get a specific priority by ID with linked projects.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Priority UUID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_priority',
    description: 'Update a priority. Can update any MCII field or status.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Priority UUID',
        },
        wish: { type: 'string' },
        outcome_vision: { type: 'string' },
        obstacle: { type: 'string' },
        if_then_plan: { type: 'string' },
        status: {
          type: 'string',
          enum: ['active', 'completed', 'deferred', 'abandoned'],
        },
        reflection: {
          type: 'string',
          description: 'Reflection on completion - what did I learn?',
        },
        order_index: {
          type: 'number',
          description: 'Priority order within quarter',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'complete_priority',
    description: 'Mark a priority as completed with reflection.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Priority UUID',
        },
        reflection: {
          type: 'string',
          description: 'What did I learn? What would I do differently?',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'link_project_to_priority',
    description: 'Link an existing project to a priority. The project serves the priority.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'Project UUID',
        },
        priority_id: {
          type: 'string',
          description: 'Priority UUID',
        },
      },
      required: ['project_id', 'priority_id'],
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CreatePrioritySchema = z.object({
  wish: z.string().min(1),
  outcome_vision: z.string().optional(),
  obstacle: z.string().optional(),
  if_then_plan: z.string().optional(),
  quarter: z.string().optional(),
  year: z.number().optional(),
  override_max: z.boolean().optional(),
});

const ListPrioritiesSchema = z.object({
  quarter: z.string().optional(),
  year: z.number().optional(),
  status: z.enum(['active', 'completed', 'deferred', 'abandoned', 'all']).optional(),
});

const UpdatePrioritySchema = z.object({
  id: z.string().uuid(),
  wish: z.string().optional(),
  outcome_vision: z.string().optional(),
  obstacle: z.string().optional(),
  if_then_plan: z.string().optional(),
  status: z.enum(['active', 'completed', 'deferred', 'abandoned']).optional(),
  reflection: z.string().optional(),
  order_index: z.number().optional(),
});

const CompletePrioritySchema = z.object({
  id: z.string().uuid(),
  reflection: z.string().optional(),
});

const LinkProjectSchema = z.object({
  project_id: z.string().uuid(),
  priority_id: z.string().uuid(),
});

// =============================================================================
// HELPERS
// =============================================================================

function getCurrentQuarter(): { quarter: string; year: number } {
  const now = new Date();
  const year = now.getFullYear();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return { quarter: `Q${q}_${year}`, year };
}

// =============================================================================
// HANDLER
// =============================================================================

export async function handlePriorityTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const supabase = ctx.getClient();
  const schema = supabase.schema(FOUNDER_SCHEMA);

  switch (name) {
    case 'create_priority': {
      const input = CreatePrioritySchema.parse(args);
      const current = getCurrentQuarter();
      const quarter = input.quarter || current.quarter;
      const year = input.year || current.year;

      // Check existing active priorities for this quarter
      const { data: existing, error: countError } = await schema
        .from('priorities')
        .select('id')
        .eq('user_id', ctx.userUUID)
        .eq('quarter', quarter)
        .eq('year', year)
        .eq('status', 'active');

      if (countError) {
        throw new Error(`Failed to check existing priorities: ${countError.message}`);
      }

      const activeCount = existing?.length || 0;
      const exceedsMax = activeCount >= 3;

      if (exceedsMax && !input.override_max) {
        return {
          success: false,
          error: 'MAX_PRIORITIES_EXCEEDED',
          message: `You already have ${activeCount} active priorities for ${quarter}. Research shows ADHD brains work best with max 3 priorities per quarter. Set override_max=true to add anyway.`,
          activeCount,
          activePriorities: existing,
        };
      }

      // Get identity profile for linking
      const { data: identity } = await supabase
        .schema('human_os')
        .from('identity_profiles')
        .select('id')
        .eq('user_id', ctx.userUUID)
        .single();

      // Create priority
      const { data, error } = await schema
        .from('priorities')
        .insert({
          user_id: ctx.userUUID,
          wish: input.wish,
          outcome_vision: input.outcome_vision || null,
          obstacle: input.obstacle || null,
          if_then_plan: input.if_then_plan || null,
          quarter,
          year,
          status: 'active',
          order_index: activeCount,
          identity_profile_id: identity?.id || null,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create priority: ${error.message}`);
      }

      const warnings: string[] = [];
      if (exceedsMax) {
        warnings.push(`You now have ${activeCount + 1} active priorities. Consider if this aligns with your capacity.`);
      }
      if (!input.obstacle) {
        warnings.push('Consider adding an OBSTACLE - this is critical for MCII effectiveness.');
      }
      if (!input.if_then_plan) {
        warnings.push('Consider adding an IF-THEN plan - implementation intentions drive execution.');
      }

      return {
        success: true,
        priority: {
          id: data.id,
          wish: data.wish,
          outcomeVision: data.outcome_vision,
          obstacle: data.obstacle,
          ifThenPlan: data.if_then_plan,
          quarter: data.quarter,
          year: data.year,
          status: data.status,
        },
        activeCount: activeCount + 1,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    case 'list_priorities': {
      const input = ListPrioritiesSchema.parse(args);
      const current = getCurrentQuarter();
      const quarter = input.quarter || current.quarter;
      const year = input.year || current.year;

      let query = schema
        .from('priorities')
        .select('*')
        .eq('user_id', ctx.userUUID)
        .eq('quarter', quarter)
        .eq('year', year)
        .order('order_index');

      if (input.status && input.status !== 'all') {
        query = query.eq('status', input.status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to list priorities: ${error.message}`);
      }

      // Fetch linked projects separately
      const priorityIds = (data || []).map((p) => p.id);
      let projects: Record<string, unknown>[] = [];
      if (priorityIds.length > 0) {
        const { data: projectData } = await schema
          .from('projects')
          .select('id, name, slug, status, priority_id')
          .in('priority_id', priorityIds);
        projects = projectData || [];
      }

      // Group projects by priority_id
      const projectsByPriority: Record<string, typeof projects> = {};
      for (const proj of projects) {
        const pid = proj.priority_id as string;
        if (!projectsByPriority[pid]) projectsByPriority[pid] = [];
        projectsByPriority[pid].push(proj);
      }

      return {
        quarter,
        year,
        priorities: (data || []).map((p) => ({
          id: p.id,
          wish: p.wish,
          outcomeVision: p.outcome_vision,
          obstacle: p.obstacle,
          ifThenPlan: p.if_then_plan,
          status: p.status,
          orderIndex: p.order_index,
          projects: projectsByPriority[p.id] || [],
        })),
        count: data?.length || 0,
        activeCount: data?.filter((p) => p.status === 'active').length || 0,
      };
    }

    case 'get_priority': {
      const { id } = z.object({ id: z.string().uuid() }).parse(args);

      const { data, error } = await schema
        .from('priorities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to get priority: ${error.message}`);
      }

      // Fetch linked projects
      const { data: projects } = await schema
        .from('projects')
        .select('id, name, slug, status, priority')
        .eq('priority_id', id);

      return {
        id: data.id,
        wish: data.wish,
        outcomeVision: data.outcome_vision,
        obstacle: data.obstacle,
        ifThenPlan: data.if_then_plan,
        quarter: data.quarter,
        year: data.year,
        status: data.status,
        reflection: data.reflection,
        completedAt: data.completed_at,
        projects: projects || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    case 'update_priority': {
      const input = UpdatePrioritySchema.parse(args);

      const updates: Record<string, unknown> = {};
      if (input.wish !== undefined) updates.wish = input.wish;
      if (input.outcome_vision !== undefined) updates.outcome_vision = input.outcome_vision;
      if (input.obstacle !== undefined) updates.obstacle = input.obstacle;
      if (input.if_then_plan !== undefined) updates.if_then_plan = input.if_then_plan;
      if (input.status !== undefined) updates.status = input.status;
      if (input.reflection !== undefined) updates.reflection = input.reflection;
      if (input.order_index !== undefined) updates.order_index = input.order_index;

      if (input.status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await schema
        .from('priorities')
        .update(updates)
        .eq('id', input.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update priority: ${error.message}`);
      }

      return {
        success: true,
        priority: {
          id: data.id,
          wish: data.wish,
          status: data.status,
          updatedAt: data.updated_at,
        },
      };
    }

    case 'complete_priority': {
      const input = CompletePrioritySchema.parse(args);

      const { data, error } = await schema
        .from('priorities')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          reflection: input.reflection || null,
        })
        .eq('id', input.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to complete priority: ${error.message}`);
      }

      return {
        success: true,
        message: 'Priority marked as completed.',
        priority: {
          id: data.id,
          wish: data.wish,
          reflection: data.reflection,
          completedAt: data.completed_at,
        },
      };
    }

    case 'link_project_to_priority': {
      const input = LinkProjectSchema.parse(args);

      const { error } = await schema
        .from('projects')
        .update({ priority_id: input.priority_id })
        .eq('id', input.project_id);

      if (error) {
        throw new Error(`Failed to link project: ${error.message}`);
      }

      return {
        success: true,
        message: 'Project linked to priority.',
        projectId: input.project_id,
        priorityId: input.priority_id,
      };
    }

    default:
      return null;
  }
}
