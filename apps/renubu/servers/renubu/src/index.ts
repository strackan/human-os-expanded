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
import {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  findNextOpening,
  getUpcomingEvents
} from './operations/calendar.js';
import {
  sendEmail,
  listMessages,
  getMessage,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  getProfile
} from './operations/gmail.js';
import {
  postMessage,
  updateMessage,
  deleteMessage,
  listChannels,
  getChannelInfo,
  sendDirectMessage,
  listUsers,
  getUserInfo,
  addReaction,
  getWorkspaceInfo
} from './operations/slack.js';

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
  },
  // Google Calendar Operations
  {
    name: 'calendar.listEvents',
    description: 'List calendar events for a date range. Returns event details including times, attendees, and descriptions.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        startDate: {
          type: 'string',
          description: 'Start date (ISO 8601 format, optional)'
        },
        endDate: {
          type: 'string',
          description: 'End date (ISO 8601 format, optional)'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of events to return (default: 10)',
          default: 10
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'calendar.createEvent',
    description: 'Create a new calendar event with title, time, and optional attendees.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        event: {
          type: 'object',
          description: 'Event details',
          properties: {
            summary: {
              type: 'string',
              description: 'Event title/summary'
            },
            description: {
              type: 'string',
              description: 'Event description (optional)'
            },
            location: {
              type: 'string',
              description: 'Event location (optional)'
            },
            start: {
              type: 'object',
              description: 'Event start time',
              properties: {
                dateTime: {
                  type: 'string',
                  description: 'Start date/time (ISO 8601)'
                },
                timeZone: {
                  type: 'string',
                  description: 'Timezone (optional, e.g., "America/Los_Angeles")'
                }
              },
              required: ['dateTime']
            },
            end: {
              type: 'object',
              description: 'Event end time',
              properties: {
                dateTime: {
                  type: 'string',
                  description: 'End date/time (ISO 8601)'
                },
                timeZone: {
                  type: 'string',
                  description: 'Timezone (optional)'
                }
              },
              required: ['dateTime']
            },
            attendees: {
              type: 'array',
              description: 'Event attendees (optional)',
              items: {
                type: 'object',
                properties: {
                  email: {
                    type: 'string',
                    description: 'Attendee email'
                  },
                  displayName: {
                    type: 'string',
                    description: 'Attendee name (optional)'
                  }
                },
                required: ['email']
              }
            }
          },
          required: ['summary', 'start', 'end']
        }
      },
      required: ['userId', 'event']
    }
  },
  {
    name: 'calendar.updateEvent',
    description: 'Update an existing calendar event (time, title, attendees, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        eventId: {
          type: 'string',
          description: 'Event ID to update'
        },
        updates: {
          type: 'object',
          description: 'Event updates (same structure as createEvent)'
        }
      },
      required: ['userId', 'eventId', 'updates']
    }
  },
  {
    name: 'calendar.deleteEvent',
    description: 'Delete a calendar event.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        eventId: {
          type: 'string',
          description: 'Event ID to delete'
        }
      },
      required: ['userId', 'eventId']
    }
  },
  {
    name: 'calendar.findNextOpening',
    description: 'Find next available time slot(s) in calendar. Intelligently searches for open slots that fit the requested duration, respecting working hours and existing events. Perfect for scheduling meetings.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        durationMinutes: {
          type: 'number',
          description: 'Duration in minutes (e.g., 30 for 30-minute meeting)'
        },
        afterDate: {
          type: 'string',
          description: 'Start searching after this date/time (ISO 8601)'
        },
        options: {
          type: 'object',
          description: 'Optional search parameters',
          properties: {
            workingHours: {
              type: 'object',
              description: 'Working hours constraint (default: 9am-5pm)',
              properties: {
                start: {
                  type: 'string',
                  description: 'Start time in HH:MM format (e.g., "09:00")'
                },
                end: {
                  type: 'string',
                  description: 'End time in HH:MM format (e.g., "17:00")'
                }
              }
            },
            businessDaysOnly: {
              type: 'boolean',
              description: 'Only search Mon-Fri (default: true)'
            },
            returnMultipleOptions: {
              type: 'number',
              description: 'Number of available slots to return (default: 1)'
            },
            calendarId: {
              type: 'string',
              description: 'Calendar ID (default: "primary")'
            }
          }
        }
      },
      required: ['userId', 'durationMinutes', 'afterDate']
    }
  },
  {
    name: 'calendar.getUpcomingEvents',
    description: 'Get upcoming events starting from now. Quick way to see what\'s on the calendar today/soon.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        count: {
          type: 'number',
          description: 'Number of events to return (default: 5)',
          default: 5
        }
      },
      required: ['userId']
    }
  },
  // Gmail Operations
  {
    name: 'gmail.sendEmail',
    description: 'Send an email via Gmail. Supports TO, CC, BCC, HTML/plain text, and reply-to.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        params: {
          type: 'object',
          description: 'Email parameters',
          properties: {
            to: {
              description: 'Recipient email(s) - single string or array',
              oneOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } }
              ]
            },
            subject: {
              type: 'string',
              description: 'Email subject line'
            },
            body: {
              type: 'string',
              description: 'Email body content'
            },
            cc: {
              description: 'CC recipient(s) - single string or array (optional)',
              oneOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } }
              ]
            },
            bcc: {
              description: 'BCC recipient(s) - single string or array (optional)',
              oneOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } }
              ]
            },
            replyTo: {
              type: 'string',
              description: 'Reply-to email address (optional)'
            },
            html: {
              type: 'boolean',
              description: 'If true, body is HTML; if false, plain text (default: false)'
            }
          },
          required: ['to', 'subject', 'body']
        }
      },
      required: ['userId', 'params']
    }
  },
  {
    name: 'gmail.listMessages',
    description: 'List/search Gmail messages. Use query parameter for advanced search (e.g., "is:unread", "from:example@gmail.com").',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        query: {
          type: 'string',
          description: 'Gmail search query (optional, e.g., "is:unread", "from:user@example.com")'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of messages to return (default: 10)',
          default: 10
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'gmail.getMessage',
    description: 'Get full details of a specific email message by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        messageId: {
          type: 'string',
          description: 'Gmail message ID'
        },
        format: {
          type: 'string',
          enum: ['full', 'metadata', 'minimal', 'raw'],
          description: 'Response format (default: "full")',
          default: 'full'
        }
      },
      required: ['userId', 'messageId']
    }
  },
  {
    name: 'gmail.getUnreadCount',
    description: 'Get count of unread emails in inbox.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'gmail.markAsRead',
    description: 'Mark an email message as read.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        messageId: {
          type: 'string',
          description: 'Gmail message ID'
        }
      },
      required: ['userId', 'messageId']
    }
  },
  {
    name: 'gmail.markAsUnread',
    description: 'Mark an email message as unread.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        messageId: {
          type: 'string',
          description: 'Gmail message ID'
        }
      },
      required: ['userId', 'messageId']
    }
  },
  {
    name: 'gmail.getProfile',
    description: 'Get Gmail account profile information (email address, message/thread counts).',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        }
      },
      required: ['userId']
    }
  },
  // Slack Operations
  {
    name: 'slack.postMessage',
    description: 'Post a message to a Slack channel. Supports plain text, Block Kit blocks, threads, and custom formatting.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        message: {
          type: 'object',
          description: 'Message details',
          properties: {
            channel: {
              type: 'string',
              description: 'Channel ID (e.g., "C123ABC456")'
            },
            text: {
              type: 'string',
              description: 'Message text'
            },
            blocks: {
              type: 'array',
              description: 'Optional Block Kit blocks for rich formatting'
            },
            thread_ts: {
              type: 'string',
              description: 'Optional thread timestamp to reply in thread'
            },
            username: {
              type: 'string',
              description: 'Optional custom username'
            },
            icon_emoji: {
              type: 'string',
              description: 'Optional emoji icon (e.g., ":robot_face:")'
            }
          },
          required: ['channel', 'text']
        }
      },
      required: ['userId', 'message']
    }
  },
  {
    name: 'slack.updateMessage',
    description: 'Update an existing Slack message.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        channel: {
          type: 'string',
          description: 'Channel ID'
        },
        ts: {
          type: 'string',
          description: 'Message timestamp (from postMessage response)'
        },
        text: {
          type: 'string',
          description: 'New message text'
        },
        blocks: {
          type: 'array',
          description: 'Optional new Block Kit blocks'
        }
      },
      required: ['userId', 'channel', 'ts', 'text']
    }
  },
  {
    name: 'slack.deleteMessage',
    description: 'Delete a Slack message.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        channel: {
          type: 'string',
          description: 'Channel ID'
        },
        ts: {
          type: 'string',
          description: 'Message timestamp'
        }
      },
      required: ['userId', 'channel', 'ts']
    }
  },
  {
    name: 'slack.listChannels',
    description: 'List channels in the Slack workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        types: {
          type: 'string',
          description: 'Channel types comma-separated (default: "public_channel,private_channel")',
          default: 'public_channel,private_channel'
        },
        limit: {
          type: 'number',
          description: 'Max channels to return (default: 100)',
          default: 100
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'slack.getChannelInfo',
    description: 'Get detailed information about a specific Slack channel.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        channel: {
          type: 'string',
          description: 'Channel ID'
        }
      },
      required: ['userId', 'channel']
    }
  },
  {
    name: 'slack.sendDirectMessage',
    description: 'Send a direct message (DM) to a Slack user.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        slackUserId: {
          type: 'string',
          description: 'Slack user ID to send DM to'
        },
        text: {
          type: 'string',
          description: 'Message text'
        }
      },
      required: ['userId', 'slackUserId', 'text']
    }
  },
  {
    name: 'slack.listUsers',
    description: 'List users in the Slack workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        limit: {
          type: 'number',
          description: 'Max users to return (default: 100)',
          default: 100
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'slack.getUserInfo',
    description: 'Get detailed information about a specific Slack user.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        slackUserId: {
          type: 'string',
          description: 'Slack user ID'
        }
      },
      required: ['userId', 'slackUserId']
    }
  },
  {
    name: 'slack.addReaction',
    description: 'Add an emoji reaction to a Slack message.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        },
        channel: {
          type: 'string',
          description: 'Channel ID'
        },
        timestamp: {
          type: 'string',
          description: 'Message timestamp'
        },
        emoji: {
          type: 'string',
          description: 'Emoji name without colons (e.g., "thumbsup", "heart", "rocket")'
        }
      },
      required: ['userId', 'channel', 'timestamp', 'emoji']
    }
  },
  {
    name: 'slack.getWorkspaceInfo',
    description: 'Get information about the connected Slack workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        }
      },
      required: ['userId']
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

      // Google Calendar Operations
      case 'calendar.listEvents': {
        const { userId, startDate, endDate, maxResults } = args as any;
        const result = await listCalendarEvents(
          supabase,
          userId,
          startDate,
          endDate,
          maxResults
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'calendar.createEvent': {
        const { userId, event } = args as any;
        const result = await createCalendarEvent(supabase, userId, event);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'calendar.updateEvent': {
        const { userId, eventId, updates } = args as any;
        const result = await updateCalendarEvent(supabase, userId, eventId, updates);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'calendar.deleteEvent': {
        const { userId, eventId } = args as any;
        await deleteCalendarEvent(supabase, userId, eventId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Event deleted successfully' })
            }
          ]
        };
      }

      case 'calendar.findNextOpening': {
        const { userId, durationMinutes, afterDate, options } = args as any;
        const result = await findNextOpening(
          supabase,
          userId,
          durationMinutes,
          afterDate,
          options || {}
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'calendar.getUpcomingEvents': {
        const { userId, count } = args as any;
        const result = await getUpcomingEvents(supabase, userId, count || 5);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      // Gmail Operations
      case 'gmail.sendEmail': {
        const { userId, params } = args as any;
        const result = await sendEmail(supabase, userId, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'gmail.listMessages': {
        const { userId, query, maxResults } = args as any;
        const result = await listMessages(supabase, userId, query, maxResults);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'gmail.getMessage': {
        const { userId, messageId, format } = args as any;
        const result = await getMessage(supabase, userId, messageId, format);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'gmail.getUnreadCount': {
        const { userId } = args as any;
        const result = await getUnreadCount(supabase, userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'gmail.markAsRead': {
        const { userId, messageId } = args as any;
        const result = await markAsRead(supabase, userId, messageId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'gmail.markAsUnread': {
        const { userId, messageId } = args as any;
        const result = await markAsUnread(supabase, userId, messageId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'gmail.getProfile': {
        const { userId } = args as any;
        const result = await getProfile(supabase, userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      // Slack Operations
      case 'slack.postMessage': {
        const { userId, message } = args as any;
        const result = await postMessage(supabase, userId, message);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'slack.updateMessage': {
        const { userId, channel, ts, text, blocks } = args as any;
        await updateMessage(supabase, userId, channel, ts, text, blocks);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Message updated successfully' })
            }
          ]
        };
      }

      case 'slack.deleteMessage': {
        const { userId, channel, ts } = args as any;
        await deleteMessage(supabase, userId, channel, ts);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Message deleted successfully' })
            }
          ]
        };
      }

      case 'slack.listChannels': {
        const { userId, types, limit } = args as any;
        const result = await listChannels(supabase, userId, types, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'slack.getChannelInfo': {
        const { userId, channel } = args as any;
        const result = await getChannelInfo(supabase, userId, channel);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'slack.sendDirectMessage': {
        const { userId, slackUserId, text } = args as any;
        const result = await sendDirectMessage(supabase, userId, slackUserId, text);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'slack.listUsers': {
        const { userId, limit } = args as any;
        const result = await listUsers(supabase, userId, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'slack.getUserInfo': {
        const { userId, slackUserId } = args as any;
        const result = await getUserInfo(supabase, userId, slackUserId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'slack.addReaction': {
        const { userId, channel, timestamp, emoji } = args as any;
        await addReaction(supabase, userId, channel, timestamp, emoji);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Reaction added successfully' })
            }
          ]
        };
      }

      case 'slack.getWorkspaceInfo': {
        const { userId } = args as any;
        const result = await getWorkspaceInfo(supabase, userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
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
