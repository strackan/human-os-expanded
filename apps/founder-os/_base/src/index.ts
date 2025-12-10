/**
 * Founder OS Base MCP Server
 *
 * Shared foundation for executive management systems.
 * Provides tools for:
 * - Task and goal management
 * - Network/relationship tracking
 * - Daily briefings
 * - Delegation support
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  ContextEngine,
  KnowledgeGraph,
  createSupabaseClient,
  type Viewer,
  type Layer,
  type ContextEngineConfig,
  TABLES,
  type DatabaseEntity,
} from '@human-os/core';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Founder OS specific tool definitions
 */
export const founderTools: Tool[] = [
  {
    name: 'founder_daily_briefing',
    description: 'Generate daily briefing with tasks, goals, and key relationships',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date for briefing (ISO format, default: today)',
        },
      },
    },
  },
  {
    name: 'founder_task_create',
    description: 'Create a new task',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Task title',
        },
        description: {
          type: 'string',
          description: 'Task description',
        },
        priority: {
          type: 'string',
          enum: ['urgent', 'high', 'medium', 'low'],
          description: 'Task priority',
        },
        dueDate: {
          type: 'string',
          description: 'Due date (ISO format)',
        },
        assignedTo: {
          type: 'string',
          description: 'Person slug to assign task to',
        },
        parentGoal: {
          type: 'string',
          description: 'Parent goal slug',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'founder_task_list',
    description: 'List tasks with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed', 'delegated'],
          description: 'Filter by status',
        },
        priority: {
          type: 'string',
          enum: ['urgent', 'high', 'medium', 'low'],
          description: 'Filter by priority',
        },
        assignedTo: {
          type: 'string',
          description: 'Filter by assigned person slug',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 20)',
        },
      },
    },
  },
  {
    name: 'founder_goal_create',
    description: 'Create a new goal',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Goal title',
        },
        description: {
          type: 'string',
          description: 'Goal description with success criteria',
        },
        timeframe: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
          description: 'Goal timeframe',
        },
        parentGoal: {
          type: 'string',
          description: 'Parent goal slug (for sub-goals)',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'founder_goal_list',
    description: 'List goals with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
          description: 'Filter by timeframe',
        },
        status: {
          type: 'string',
          enum: ['active', 'completed', 'archived'],
          description: 'Filter by status',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 20)',
        },
      },
    },
  },
  {
    name: 'founder_network_search',
    description: 'Search network/relationships',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (name, company, notes)',
        },
        relationship: {
          type: 'string',
          description: 'Filter by relationship type',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 20)',
        },
      },
    },
  },
  {
    name: 'founder_delegate',
    description: 'Delegate a task to a team member or assistant',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID to delegate',
        },
        delegateTo: {
          type: 'string',
          description: 'Person slug to delegate to',
        },
        instructions: {
          type: 'string',
          description: 'Additional instructions for the delegate',
        },
      },
      required: ['taskId', 'delegateTo'],
    },
  },
];

/**
 * Input validation schemas
 */
const DailyBriefingSchema = z.object({
  date: z.string().optional(),
});

const TaskCreateSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  parentGoal: z.string().optional(),
});

const TaskListSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'delegated']).optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
  assignedTo: z.string().optional(),
  limit: z.number().optional(),
});

const GoalCreateSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  timeframe: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  parentGoal: z.string().optional(),
});

const GoalListSchema = z.object({
  timeframe: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  limit: z.number().optional(),
});

const NetworkSearchSchema = z.object({
  query: z.string().optional(),
  relationship: z.string().optional(),
  limit: z.number().optional(),
});

const DelegateSchema = z.object({
  taskId: z.string(),
  delegateTo: z.string(),
  instructions: z.string().optional(),
});

/**
 * Generate slug from title
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Handle founder-specific tool calls
 */
export async function handleFounderTool(
  toolName: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient,
  contextEngine: ContextEngine,
  knowledgeGraph: KnowledgeGraph,
  userId: string,
  layer: Layer
): Promise<unknown> {
  switch (toolName) {
    case 'founder_daily_briefing': {
      const input = DailyBriefingSchema.parse(args);
      const date = input.date || new Date().toISOString().split('T')[0];

      // Get tasks due today or overdue
      const { data: tasks } = await supabase
        .from(TABLES.ENTITIES)
        .select('*')
        .eq('entity_type', 'task')
        .eq('owner_id', userId)
        .or(`metadata->due_date.eq.${date},metadata->due_date.lt.${date}`)
        .eq('metadata->status', 'pending')
        .limit(10);

      // Get active goals
      const { data: goals } = await supabase
        .from(TABLES.ENTITIES)
        .select('*')
        .eq('entity_type', 'goal')
        .eq('owner_id', userId)
        .eq('metadata->status', 'active')
        .limit(5);

      // Get recent interactions
      const { data: interactions } = await supabase
        .from(TABLES.INTERACTIONS)
        .select('*')
        .eq('layer', layer)
        .gte('occurred_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('occurred_at', { ascending: false })
        .limit(10);

      return {
        date,
        tasks: (tasks || []).map((t: DatabaseEntity) => ({
          id: t.id,
          title: t.name,
          priority: t.metadata?.priority,
          dueDate: t.metadata?.due_date,
        })),
        goals: (goals || []).map((g: DatabaseEntity) => ({
          id: g.id,
          title: g.name,
          timeframe: g.metadata?.timeframe,
        })),
        recentInteractions: (interactions || []).length,
      };
    }

    case 'founder_task_create': {
      const input = TaskCreateSchema.parse(args);
      const slug = slugify(input.title);

      const { data, error } = await supabase
        .from(TABLES.ENTITIES)
        .insert({
          slug,
          entity_type: 'task',
          name: input.title,
          owner_id: userId,
          privacy_scope: 'user',
          metadata: {
            description: input.description,
            priority: input.priority || 'medium',
            due_date: input.dueDate,
            assigned_to: input.assignedTo,
            parent_goal: input.parentGoal,
            status: 'pending',
          },
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create task: ${error.message}`);
      }

      // Create link to goal if specified
      if (input.parentGoal) {
        await knowledgeGraph.createLink(slug, input.parentGoal, 'child_of', { layer });
      }

      // Create link to assignee if specified
      if (input.assignedTo) {
        await knowledgeGraph.createLink(slug, input.assignedTo, 'assigned_to', { layer });
      }

      return {
        success: true,
        task: {
          id: data.id,
          slug: data.slug,
          title: data.name,
        },
      };
    }

    case 'founder_task_list': {
      const input = TaskListSchema.parse(args);
      const limit = input.limit || 20;

      let query = supabase
        .from(TABLES.ENTITIES)
        .select('*')
        .eq('entity_type', 'task')
        .eq('owner_id', userId)
        .limit(limit);

      if (input.status) {
        query = query.eq('metadata->status', input.status);
      }
      if (input.priority) {
        query = query.eq('metadata->priority', input.priority);
      }
      if (input.assignedTo) {
        query = query.eq('metadata->assigned_to', input.assignedTo);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list tasks: ${error.message}`);
      }

      return {
        tasks: (data || []).map((t: DatabaseEntity) => ({
          id: t.id,
          slug: t.slug,
          title: t.name,
          status: t.metadata?.status,
          priority: t.metadata?.priority,
          dueDate: t.metadata?.due_date,
          assignedTo: t.metadata?.assigned_to,
        })),
      };
    }

    case 'founder_goal_create': {
      const input = GoalCreateSchema.parse(args);
      const slug = slugify(input.title);

      const { data, error } = await supabase
        .from(TABLES.ENTITIES)
        .insert({
          slug,
          entity_type: 'goal',
          name: input.title,
          owner_id: userId,
          privacy_scope: 'user',
          metadata: {
            description: input.description,
            timeframe: input.timeframe || 'quarterly',
            parent_goal: input.parentGoal,
            status: 'active',
          },
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create goal: ${error.message}`);
      }

      // Create link to parent goal if specified
      if (input.parentGoal) {
        await knowledgeGraph.createLink(slug, input.parentGoal, 'child_of', { layer });
      }

      return {
        success: true,
        goal: {
          id: data.id,
          slug: data.slug,
          title: data.name,
        },
      };
    }

    case 'founder_goal_list': {
      const input = GoalListSchema.parse(args);
      const limit = input.limit || 20;

      let query = supabase
        .from(TABLES.ENTITIES)
        .select('*')
        .eq('entity_type', 'goal')
        .eq('owner_id', userId)
        .limit(limit);

      if (input.timeframe) {
        query = query.eq('metadata->timeframe', input.timeframe);
      }
      if (input.status) {
        query = query.eq('metadata->status', input.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list goals: ${error.message}`);
      }

      return {
        goals: (data || []).map((g: DatabaseEntity) => ({
          id: g.id,
          slug: g.slug,
          title: g.name,
          status: g.metadata?.status,
          timeframe: g.metadata?.timeframe,
        })),
      };
    }

    case 'founder_network_search': {
      const input = NetworkSearchSchema.parse(args);
      const limit = input.limit || 20;

      let query = supabase
        .from(TABLES.ENTITIES)
        .select('*')
        .eq('entity_type', 'person')
        .eq('owner_id', userId)
        .limit(limit);

      if (input.query) {
        query = query.ilike('name', `%${input.query}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      return {
        contacts: (data || []).map((c: DatabaseEntity) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          email: c.email,
          metadata: c.metadata,
        })),
      };
    }

    case 'founder_delegate': {
      const input = DelegateSchema.parse(args);

      // Update task status and assignment
      const { data: task, error } = await supabase
        .from(TABLES.ENTITIES)
        .update({
          metadata: {
            status: 'delegated',
            assigned_to: input.delegateTo,
            delegation_instructions: input.instructions,
            delegated_at: new Date().toISOString(),
          },
        })
        .eq('id', input.taskId)
        .eq('owner_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to delegate task: ${error.message}`);
      }

      // Create assignment link
      await knowledgeGraph.createLink(task.slug, input.delegateTo, 'assigned_to', { layer });

      return {
        success: true,
        task: {
          id: task.id,
          slug: task.slug,
          title: task.name,
          delegatedTo: input.delegateTo,
        },
      };
    }

    default:
      throw new Error(`Unknown founder tool: ${toolName}`);
  }
}

/**
 * Server configuration interface
 */
export interface FounderOSConfig {
  userId: string;
  layer: Layer;
  additionalTools?: Tool[];
}

/**
 * Create and start Founder OS MCP server
 */
export async function createFounderOSServer(config: FounderOSConfig) {
  const SUPABASE_URL = process.env['SUPABASE_URL'];
  const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    process.exit(1);
  }

  const baseConfig = {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
  };

  const supabase = createSupabaseClient(baseConfig);

  const viewer: Viewer = {
    userId: config.userId,
  };

  const contextEngine = new ContextEngine({ ...baseConfig, viewer });
  const knowledgeGraph = new KnowledgeGraph({ ...baseConfig, defaultLayers: [config.layer] });

  const allTools = [...founderTools, ...(config.additionalTools || [])];

  const server = new Server(
    {
      name: 'founder-os',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleFounderTool(
        name,
        args || {},
        supabase,
        contextEngine,
        knowledgeGraph,
        config.userId,
        config.layer
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: message }),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Start server with stdio transport
 */
export async function startFounderOSServer(config: FounderOSConfig) {
  const server = await createFounderOSServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Founder OS server running for ${config.userId}`);
}
