/**
 * OKR Goals Tools
 *
 * MCP tools for managing OKR-style goals (Objectives and Key Results).
 * This is an ALTERNATIVE framework to MCII priorities.
 *
 * NOTE: These tools are NOT registered in the default Founder OS MCP server.
 * They exist for products that prefer OKR methodology over MCII.
 * To use, import and add to toolModules in index.ts.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';

/** Schema where okr_goals lives */
const FOUNDER_SCHEMA = 'founder_os';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const okrGoalTools: Tool[] = [
  {
    name: 'create_okr_goal',
    description: `Create an OKR goal (Objective or Key Result).
Objectives are qualitative aspirations. Key Results are measurable outcomes.
Key Results should have a parent_id pointing to their Objective.`,
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Goal title (e.g., "Launch MVP" for objective, "100 beta users" for key result)',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the goal',
        },
        type: {
          type: 'string',
          enum: ['objective', 'key_result'],
          description: 'Whether this is an Objective (qualitative) or Key Result (measurable)',
        },
        parent_id: {
          type: 'string',
          description: 'Parent objective UUID (required for key_result type)',
        },
        timeframe: {
          type: 'string',
          enum: ['yearly', 'quarterly', 'monthly', 'weekly'],
          description: 'Time horizon for this goal',
        },
        target_value: {
          type: 'number',
          description: 'Target metric value (for key results)',
        },
        unit: {
          type: 'string',
          description: 'Unit of measurement (e.g., "$", "users", "%")',
        },
        start_date: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        end_date: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
      },
      required: ['title', 'type'],
    },
  },
  {
    name: 'list_okr_goals',
    description: 'List OKR goals with optional filtering by timeframe or type.',
    inputSchema: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['yearly', 'quarterly', 'monthly', 'weekly'],
          description: 'Filter by timeframe',
        },
        type: {
          type: 'string',
          enum: ['objective', 'key_result'],
          description: 'Filter by goal type',
        },
        include_children: {
          type: 'boolean',
          description: 'Include child key results for objectives (default: true)',
        },
      },
    },
  },
  {
    name: 'get_okr_goal',
    description: 'Get a specific OKR goal by ID with its key results.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Goal UUID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_okr_goal',
    description: 'Update an OKR goal. Can update progress, dates, or details.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Goal UUID',
        },
        title: { type: 'string' },
        description: { type: 'string' },
        current_value: {
          type: 'number',
          description: 'Update progress toward target',
        },
        target_value: { type: 'number' },
        start_date: { type: 'string' },
        end_date: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_okr_goal',
    description: 'Delete an OKR goal. Child key results will have parent_id set to null.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Goal UUID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'link_task_to_okr_goal',
    description: 'Link a task to an OKR goal for progress tracking.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'Task UUID',
        },
        goal_id: {
          type: 'string',
          description: 'OKR Goal UUID',
        },
      },
      required: ['task_id', 'goal_id'],
    },
  },
  {
    name: 'unlink_task_from_okr_goal',
    description: 'Remove link between a task and an OKR goal.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'Task UUID',
        },
        goal_id: {
          type: 'string',
          description: 'OKR Goal UUID',
        },
      },
      required: ['task_id', 'goal_id'],
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CreateOKRGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['objective', 'key_result']),
  parent_id: z.string().uuid().optional(),
  timeframe: z.enum(['yearly', 'quarterly', 'monthly', 'weekly']).optional(),
  target_value: z.number().optional(),
  unit: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

const ListOKRGoalsSchema = z.object({
  timeframe: z.enum(['yearly', 'quarterly', 'monthly', 'weekly']).optional(),
  type: z.enum(['objective', 'key_result']).optional(),
  include_children: z.boolean().optional().default(true),
});

const UpdateOKRGoalSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  description: z.string().optional(),
  current_value: z.number().optional(),
  target_value: z.number().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

const TaskGoalLinkSchema = z.object({
  task_id: z.string().uuid(),
  goal_id: z.string().uuid(),
});

// =============================================================================
// HANDLER
// =============================================================================

export async function handleOKRGoalTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const supabase = ctx.getClient();
  const schema = supabase.schema(FOUNDER_SCHEMA);

  switch (name) {
    case 'create_okr_goal': {
      const input = CreateOKRGoalSchema.parse(args);

      // Validate key_result has parent
      if (input.type === 'key_result' && !input.parent_id) {
        return {
          success: false,
          error: 'Key results must have a parent_id pointing to their objective.',
        };
      }

      const { data, error } = await schema
        .from('okr_goals')
        .insert({
          user_id: ctx.userUUID,
          title: input.title,
          description: input.description || null,
          type: input.type,
          parent_id: input.parent_id || null,
          timeframe: input.timeframe || null,
          target_value: input.target_value || null,
          current_value: 0,
          unit: input.unit || null,
          start_date: input.start_date || null,
          end_date: input.end_date || null,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create OKR goal: ${error.message}`);
      }

      return {
        success: true,
        goal: {
          id: data.id,
          title: data.title,
          type: data.type,
          timeframe: data.timeframe,
          parentId: data.parent_id,
        },
      };
    }

    case 'list_okr_goals': {
      const input = ListOKRGoalsSchema.parse(args);

      let query = schema
        .from('okr_goals')
        .select('*')
        .eq('user_id', ctx.userUUID)
        .order('created_at', { ascending: false });

      if (input.timeframe) {
        query = query.eq('timeframe', input.timeframe);
      }

      if (input.type) {
        query = query.eq('type', input.type);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to list OKR goals: ${error.message}`);
      }

      // Group key results under objectives if requested
      if (input.include_children && (!input.type || input.type === 'objective')) {
        const objectives = (data || []).filter((g) => g.type === 'objective');
        const keyResults = (data || []).filter((g) => g.type === 'key_result');

        const grouped = objectives.map((obj) => ({
          id: obj.id,
          title: obj.title,
          description: obj.description,
          type: obj.type,
          timeframe: obj.timeframe,
          startDate: obj.start_date,
          endDate: obj.end_date,
          keyResults: keyResults
            .filter((kr) => kr.parent_id === obj.id)
            .map((kr) => ({
              id: kr.id,
              title: kr.title,
              targetValue: kr.target_value,
              currentValue: kr.current_value,
              unit: kr.unit,
              progress: kr.target_value
                ? Math.round((kr.current_value / kr.target_value) * 100)
                : null,
            })),
        }));

        return {
          count: grouped.length,
          objectives: grouped,
        };
      }

      return {
        count: data?.length || 0,
        goals: (data || []).map((g) => ({
          id: g.id,
          title: g.title,
          type: g.type,
          timeframe: g.timeframe,
          parentId: g.parent_id,
          targetValue: g.target_value,
          currentValue: g.current_value,
          unit: g.unit,
          progress: g.target_value
            ? Math.round((g.current_value / g.target_value) * 100)
            : null,
        })),
      };
    }

    case 'get_okr_goal': {
      const { id } = z.object({ id: z.string().uuid() }).parse(args);

      const { data, error } = await schema
        .from('okr_goals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to get OKR goal: ${error.message}`);
      }

      // Fetch key results if this is an objective
      let keyResults: Record<string, unknown>[] = [];
      if (data.type === 'objective') {
        const { data: krData } = await schema
          .from('okr_goals')
          .select('*')
          .eq('parent_id', id);
        keyResults = krData || [];
      }

      // Fetch linked tasks
      const { data: taskLinks } = await schema
        .from('task_okr_goal_links')
        .select('task_id')
        .eq('goal_id', id);

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        type: data.type,
        timeframe: data.timeframe,
        parentId: data.parent_id,
        targetValue: data.target_value,
        currentValue: data.current_value,
        unit: data.unit,
        progress: data.target_value
          ? Math.round((data.current_value / data.target_value) * 100)
          : null,
        startDate: data.start_date,
        endDate: data.end_date,
        keyResults: keyResults.map((kr) => ({
          id: kr.id,
          title: kr.title,
          targetValue: kr.target_value,
          currentValue: kr.current_value,
          unit: kr.unit,
          progress: kr.target_value
            ? Math.round(((kr.current_value as number) / (kr.target_value as number)) * 100)
            : null,
        })),
        linkedTaskIds: (taskLinks || []).map((l) => l.task_id),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    case 'update_okr_goal': {
      const input = UpdateOKRGoalSchema.parse(args);

      const updates: Record<string, unknown> = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.current_value !== undefined) updates.current_value = input.current_value;
      if (input.target_value !== undefined) updates.target_value = input.target_value;
      if (input.start_date !== undefined) updates.start_date = input.start_date;
      if (input.end_date !== undefined) updates.end_date = input.end_date;

      const { data, error } = await schema
        .from('okr_goals')
        .update(updates)
        .eq('id', input.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update OKR goal: ${error.message}`);
      }

      return {
        success: true,
        goal: {
          id: data.id,
          title: data.title,
          currentValue: data.current_value,
          targetValue: data.target_value,
          progress: data.target_value
            ? Math.round((data.current_value / data.target_value) * 100)
            : null,
          updatedAt: data.updated_at,
        },
      };
    }

    case 'delete_okr_goal': {
      const { id } = z.object({ id: z.string().uuid() }).parse(args);

      const { error } = await schema.from('okr_goals').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete OKR goal: ${error.message}`);
      }

      return {
        success: true,
        message: 'OKR goal deleted.',
      };
    }

    case 'link_task_to_okr_goal': {
      const input = TaskGoalLinkSchema.parse(args);

      const { error } = await schema.from('task_okr_goal_links').insert({
        task_id: input.task_id,
        goal_id: input.goal_id,
      });

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Task already linked to this goal' };
        }
        throw new Error(`Failed to link task: ${error.message}`);
      }

      return {
        success: true,
        message: 'Task linked to OKR goal.',
        taskId: input.task_id,
        goalId: input.goal_id,
      };
    }

    case 'unlink_task_from_okr_goal': {
      const input = TaskGoalLinkSchema.parse(args);

      const { error } = await schema
        .from('task_okr_goal_links')
        .delete()
        .eq('task_id', input.task_id)
        .eq('goal_id', input.goal_id);

      if (error) {
        throw new Error(`Failed to unlink task: ${error.message}`);
      }

      return {
        success: true,
        message: 'Task unlinked from OKR goal.',
      };
    }

    default:
      return null;
  }
}
