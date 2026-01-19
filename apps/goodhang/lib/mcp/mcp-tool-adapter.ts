/**
 * MCP Tool Adapter
 *
 * Converts MCP providers to Anthropic tool format and executes
 * MCP queries when Claude calls tools.
 *
 * Provides a ToolExecutor interface that integrates with the agent loop.
 */

import type {
  AnthropicTool,
} from '@/lib/services/AnthropicService';
import type { ToolExecutor, ToolResult } from '@/lib/services/anthropic-agent';

// =============================================================================
// TYPES
// =============================================================================

export type MCPProviderSlug =
  | 'fireflies'
  | 'gong'
  | 'gmail'
  | 'google-calendar'
  | 'slack'
  | 'notion'
  | 'linear'
  | 'hubspot';

export interface MCPProviderConfig {
  slug: MCPProviderSlug;
  displayName: string;
  accessToken?: string;
  refreshToken?: string;
  metadata?: Record<string, unknown>;
}

export interface MCPQueryParams {
  provider: MCPProviderSlug;
  action: string;
  params: Record<string, unknown>;
}

export interface MCPQueryResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    provider: MCPProviderSlug;
    action: string;
    timestamp: string;
  };
}

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

/**
 * Generate Anthropic tool definitions for MCP providers
 */
export function generateMCPTools(providers: MCPProviderConfig[]): AnthropicTool[] {
  const tools: AnthropicTool[] = [];

  for (const provider of providers) {
    const providerTools = getProviderTools(provider.slug);
    tools.push(...providerTools);
  }

  return tools;
}

/**
 * Get tool definitions for a specific provider
 */
function getProviderTools(providerSlug: MCPProviderSlug): AnthropicTool[] {
  switch (providerSlug) {
    case 'gmail':
      return [
        {
          name: 'gmail_search_emails',
          description: 'Search emails in Gmail. Returns email subjects, senders, and snippets.',
          input_schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Gmail search query (e.g., "from:john subject:meeting")',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of emails to return (default: 10)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'gmail_get_email',
          description: 'Get full content of a specific email by ID.',
          input_schema: {
            type: 'object',
            properties: {
              emailId: {
                type: 'string',
                description: 'The email ID to retrieve',
              },
            },
            required: ['emailId'],
          },
        },
      ];

    case 'google-calendar':
      return [
        {
          name: 'calendar_get_events',
          description: 'Get calendar events within a time range.',
          input_schema: {
            type: 'object',
            properties: {
              startDate: {
                type: 'string',
                description: 'Start date in ISO format (e.g., "2024-01-01")',
              },
              endDate: {
                type: 'string',
                description: 'End date in ISO format (e.g., "2024-01-31")',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of events to return (default: 20)',
              },
            },
            required: ['startDate', 'endDate'],
          },
        },
        {
          name: 'calendar_search_events',
          description: 'Search calendar events by keyword.',
          input_schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for event titles/descriptions',
              },
              daysAhead: {
                type: 'number',
                description: 'Number of days ahead to search (default: 30)',
              },
            },
            required: ['query'],
          },
        },
      ];

    case 'slack':
      return [
        {
          name: 'slack_search_messages',
          description: 'Search Slack messages across channels.',
          input_schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
              channel: {
                type: 'string',
                description: 'Optional channel name to limit search',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum results (default: 20)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'slack_get_channel_history',
          description: 'Get recent messages from a Slack channel.',
          input_schema: {
            type: 'object',
            properties: {
              channel: {
                type: 'string',
                description: 'Channel name or ID',
              },
              limit: {
                type: 'number',
                description: 'Number of messages to retrieve (default: 50)',
              },
            },
            required: ['channel'],
          },
        },
      ];

    case 'fireflies':
      return [
        {
          name: 'fireflies_search_transcripts',
          description: 'Search meeting transcripts in Fireflies.',
          input_schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for transcript content',
              },
              dateFrom: {
                type: 'string',
                description: 'Start date filter (ISO format)',
              },
              dateTo: {
                type: 'string',
                description: 'End date filter (ISO format)',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum results (default: 10)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'fireflies_get_transcript',
          description: 'Get full transcript for a specific meeting.',
          input_schema: {
            type: 'object',
            properties: {
              transcriptId: {
                type: 'string',
                description: 'Transcript ID to retrieve',
              },
            },
            required: ['transcriptId'],
          },
        },
      ];

    case 'gong':
      return [
        {
          name: 'gong_search_calls',
          description: 'Search sales call recordings in Gong.',
          input_schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for call content',
              },
              dateFrom: {
                type: 'string',
                description: 'Start date filter (ISO format)',
              },
              dateTo: {
                type: 'string',
                description: 'End date filter (ISO format)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'gong_get_call_summary',
          description: 'Get summary and key moments from a Gong call.',
          input_schema: {
            type: 'object',
            properties: {
              callId: {
                type: 'string',
                description: 'Gong call ID',
              },
            },
            required: ['callId'],
          },
        },
      ];

    case 'notion':
      return [
        {
          name: 'notion_search_pages',
          description: 'Search Notion pages and databases.',
          input_schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
              filter: {
                type: 'string',
                enum: ['page', 'database'],
                description: 'Filter by type (optional)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'notion_get_page',
          description: 'Get content of a Notion page.',
          input_schema: {
            type: 'object',
            properties: {
              pageId: {
                type: 'string',
                description: 'Notion page ID',
              },
            },
            required: ['pageId'],
          },
        },
      ];

    case 'linear':
      return [
        {
          name: 'linear_search_issues',
          description: 'Search Linear issues.',
          input_schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
              state: {
                type: 'string',
                description: 'Filter by state (e.g., "in_progress", "done")',
              },
              assignee: {
                type: 'string',
                description: 'Filter by assignee email',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'linear_get_issue',
          description: 'Get details of a Linear issue.',
          input_schema: {
            type: 'object',
            properties: {
              issueId: {
                type: 'string',
                description: 'Linear issue ID or identifier',
              },
            },
            required: ['issueId'],
          },
        },
      ];

    case 'hubspot':
      return [
        {
          name: 'hubspot_search_contacts',
          description: 'Search HubSpot contacts.',
          input_schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (name, email, company)',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum results (default: 20)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'hubspot_get_contact',
          description: 'Get full details of a HubSpot contact.',
          input_schema: {
            type: 'object',
            properties: {
              contactId: {
                type: 'string',
                description: 'HubSpot contact ID',
              },
            },
            required: ['contactId'],
          },
        },
        {
          name: 'hubspot_search_deals',
          description: 'Search HubSpot deals.',
          input_schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for deal name',
              },
              stage: {
                type: 'string',
                description: 'Filter by deal stage',
              },
            },
            required: ['query'],
          },
        },
      ];

    default:
      return [];
  }
}

// =============================================================================
// MCP TOOL EXECUTOR
// =============================================================================

/**
 * Create an MCP tool executor that can execute tool calls against configured providers
 */
export function createMCPToolExecutor(
  providers: MCPProviderConfig[],
  queryHandler?: (params: MCPQueryParams) => Promise<MCPQueryResult>
): ToolExecutor {
  const tools = generateMCPTools(providers);
  const providerMap = new Map(providers.map((p) => [p.slug, p]));

  // Default query handler (placeholder - actual implementation would call provider APIs)
  const defaultQueryHandler = async (params: MCPQueryParams): Promise<MCPQueryResult> => {
    console.log('[MCP] Executing query:', params);

    // Check if provider is configured
    const provider = providerMap.get(params.provider);
    if (!provider) {
      return {
        success: false,
        error: `Provider ${params.provider} not configured`,
        metadata: {
          provider: params.provider,
          action: params.action,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Placeholder response - actual implementation would call the provider's API
    return {
      success: true,
      data: {
        message: `Mock result for ${params.provider}.${params.action}`,
        params: params.params,
      },
      metadata: {
        provider: params.provider,
        action: params.action,
        timestamp: new Date().toISOString(),
      },
    };
  };

  const handler = queryHandler || defaultQueryHandler;

  return {
    getTools: () => tools,
    hasToolDefinition: (name: string) => tools.some((t) => t.name === name),
    execute: async (toolName: string, input: Record<string, unknown>): Promise<ToolResult> => {
      // Parse tool name to get provider and action
      const { provider, action } = parseToolName(toolName);

      if (!provider || !action) {
        return {
          success: false,
          error: `Invalid tool name format: ${toolName}`,
        };
      }

      try {
        const result = await handler({
          provider,
          action,
          params: input,
        });

        const toolResult: ToolResult = {
          success: result.success,
          result: result.data,
        };
        if (result.error) {
          toolResult.error = result.error;
        }
        return toolResult;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}

/**
 * Parse tool name to extract provider and action
 * Format: {provider}_{action} (e.g., "gmail_search_emails")
 */
function parseToolName(toolName: string): { provider: MCPProviderSlug | null; action: string | null } {
  const providerPrefixes: MCPProviderSlug[] = [
    'fireflies',
    'gong',
    'gmail',
    'google-calendar',
    'slack',
    'notion',
    'linear',
    'hubspot',
  ];

  // Handle google-calendar special case
  if (toolName.startsWith('calendar_')) {
    return {
      provider: 'google-calendar',
      action: toolName.replace('calendar_', ''),
    };
  }

  for (const prefix of providerPrefixes) {
    const normalizedPrefix = prefix.replace('-', '_');
    if (toolName.startsWith(`${normalizedPrefix}_`)) {
      return {
        provider: prefix,
        action: toolName.replace(`${normalizedPrefix}_`, ''),
      };
    }
  }

  return { provider: null, action: null };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all available tool names for configured providers
 */
export function getAvailableToolNames(providers: MCPProviderConfig[]): string[] {
  const tools = generateMCPTools(providers);
  return tools.map((t) => t.name);
}

/**
 * Check if a tool is available for the given providers
 */
export function isToolAvailable(toolName: string, providers: MCPProviderConfig[]): boolean {
  const tools = generateMCPTools(providers);
  return tools.some((t) => t.name === toolName);
}

/**
 * Get provider slug from tool name
 */
export function getToolProvider(toolName: string): MCPProviderSlug | null {
  const { provider } = parseToolName(toolName);
  return provider;
}
