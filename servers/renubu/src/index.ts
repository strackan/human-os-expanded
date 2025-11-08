#!/usr/bin/env node

/**
 * Renubu MCP Server
 * Model Context Protocol server for Renubu workflow operations
 *
 * Provides 8 core operations:
 * - Workflow management (list, get, snooze, wake)
 * - Task management (list, update status)
 * - Check-ins (create workflow, log check-in)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';

// Import operations
import {
  listSnoozedWorkflows,
  getWorkflowDetails,
  snoozeWorkflow,
  wakeWorkflow
} from './operations/workflows.js';
import {
  listTasks,
  updateTaskStatus
} from './operations/tasks.js';
import {
  createWorkflowExecution,
  logCheckIn
} from './operations/checkins.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define MCP tools
const TOOLS: Tool[] = [
  {
    name: 'listSnoozedWorkflows',
    description: 'List all snoozed workflows for a user. Returns minimal info (id, type, status, snooze date) for token efficiency.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to filter workflows'
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'getWorkflowDetails',
    description: 'Get full workflow details including tasks and actions. Use sparingly - returns verbose data.',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow execution ID'
        }
      },
      required: ['workflowId']
    }
  },
  {
    name: 'snoozeWorkflow',
    description: 'Snooze a workflow until a specific date/time. Optionally include wake condition for smart re-surfacing.',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'Workflow execution ID to snooze'
        },
        snoozed_until: {
          type: 'string',
          description: 'ISO date string for when to wake workflow'
        },
        condition: {
          type: 'string',
          description: 'Optional wake condition (e.g., "customer responds to email")'
        },
        snooze_reason: {
          type: 'string',
          description: 'Optional reason for snoozing'
        }
      },
      required: ['workflow_id', 'snoozed_until']
    }
  },
  {
    name: 'wakeWorkflow',
    description: 'Wake a snoozed workflow (move back to active status).',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow execution ID to wake'
        }
      },
      required: ['workflowId']
    }
  },
  {
    name: 'listTasks',
    description: 'List tasks with optional filtering by status, customer, or due date. Returns minimal task info.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to filter tasks'
        },
        filters: {
          type: 'object',
          description: 'Optional filters',
          properties: {
            status: {
              type: 'string',
              description: 'Filter by task status (todo, in_progress, blocked, completed)'
            },
            customer_id: {
              type: 'string',
              description: 'Filter by customer ID'
            },
            due_before: {
              type: 'string',
              description: 'ISO date string - only tasks due before this date'
            }
          }
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'updateTaskStatus',
    description: 'Update task status with optional notes. Common statuses: todo, in_progress, blocked, completed.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'Task ID to update'
        },
        status: {
          type: 'string',
          description: 'New status (todo, in_progress, blocked, completed)'
        },
        notes: {
          type: 'string',
          description: 'Optional notes about the status change'
        }
      },
      required: ['task_id', 'status']
    }
  },
  {
    name: 'createWorkflowExecution',
    description: 'Create a new workflow execution. Used to start workflows that will later have check-ins.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID who owns the workflow'
        },
        workflow_type: {
          type: 'string',
          description: 'Type of workflow (e.g., renewal, account_planning)'
        },
        customer_id: {
          type: 'string',
          description: 'Optional customer ID'
        },
        workflow_data: {
          type: 'object',
          description: 'Optional workflow-specific data'
        }
      },
      required: ['userId', 'workflow_type']
    }
  },
  {
    name: 'logCheckIn',
    description: 'Log a check-in for a completed workflow. Core of Human OS learning loop. Records what worked, what didn\'t, and notes for next time.',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow execution ID'
        },
        outcome: {
          type: 'string',
          enum: ['success', 'partial', 'failed'],
          description: 'Workflow outcome'
        },
        effectiveness_rating: {
          type: 'number',
          minimum: 1,
          maximum: 5,
          description: 'Optional effectiveness rating (1-5)'
        },
        what_worked: {
          type: 'string',
          description: 'What worked well in this workflow'
        },
        what_didnt: {
          type: 'string',
          description: 'What didn\'t work or could be improved'
        },
        next_time_notes: {
          type: 'string',
          description: 'Notes for next time this workflow runs'
        }
      },
      required: ['workflowId', 'outcome']
    }
  }
];

// Create MCP server
const server = new Server(
  {
    name: 'renubu',
    version: '0.1.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS
  };
});

// Handle tool call requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'Missing arguments' })
        }
      ],
      isError: true
    };
  }

  try {
    switch (name) {
      case 'listSnoozedWorkflows': {
        const result = await listSnoozedWorkflows(supabase, args.userId as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'getWorkflowDetails': {
        const result = await getWorkflowDetails(supabase, args.workflowId as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'snoozeWorkflow': {
        const result = await snoozeWorkflow(supabase, args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'wakeWorkflow': {
        const result = await wakeWorkflow(supabase, args.workflowId as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'listTasks': {
        const result = await listTasks(supabase, args.userId as string, args.filters as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'updateTaskStatus': {
        const result = await updateTaskStatus(supabase, args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'createWorkflowExecution': {
        const { userId, ...input } = args as any;
        const result = await createWorkflowExecution(supabase, userId, input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'logCheckIn': {
        const { workflowId, ...checkInData } = args as any;
        await logCheckIn(supabase, workflowId, checkInData);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Check-in logged successfully' })
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage })
        }
      ],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Renubu MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
