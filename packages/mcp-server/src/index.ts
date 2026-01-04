#!/usr/bin/env node
/**
 * Human OS MCP Server
 *
 * Model Context Protocol server providing tools for:
 * - Context operations (read, write, search context files)
 * - Knowledge graph operations (connections, traversal, paths)
 * - Entity operations (CRUD for people, companies, projects, etc.)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  ContextEngine,
  KnowledgeGraph,
  createSupabaseClient,
  type Viewer,
} from '@human-os/core';

import { contextTools, handleContextTool } from './context-tools.js';
import { graphTools, handleGraphTool } from './graph-tools.js';
import { entityTools, handleEntityTool } from './entity-tools.js';
import { logToolCall, summarizeResult } from './capture.js';

/**
 * Environment configuration
 */
const SUPABASE_URL = process.env['SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];
const USER_ID = process.env['HUMAN_OS_USER_ID'];
const TENANT_ID = process.env['HUMAN_OS_TENANT_ID'];

/**
 * Create and configure the MCP server
 */
async function main() {
  // Validate required environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    process.exit(1);
  }

  // Base config for core classes
  const baseConfig = {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
  };

  // Initialize Supabase client
  const supabase = createSupabaseClient(baseConfig);

  // Create viewer context for privacy model
  const viewer: Viewer = {
    userId: USER_ID,
    tenantId: TENANT_ID,
  };

  // Initialize core services
  const contextEngine = new ContextEngine({ ...baseConfig, viewer });
  const knowledgeGraph = new KnowledgeGraph({ ...baseConfig });

  // Create MCP server
  const server = new Server(
    {
      name: 'human-os',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool listing handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [...contextTools, ...graphTools, ...entityTools],
    };
  });

  // Register tool call handler with capture
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const startTime = Date.now();

    try {
      let result: unknown;

      // Route to appropriate tool handler
      if (name.startsWith('context_')) {
        result = await handleContextTool(name, args || {}, contextEngine);
      } else if (name.startsWith('graph_')) {
        result = await handleGraphTool(name, args || {}, knowledgeGraph);
      } else if (name.startsWith('entity_')) {
        result = await handleEntityTool(name, args || {}, supabase, USER_ID, TENANT_ID);
      } else {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Fire-and-forget capture
      logToolCall({
        tool: name,
        params: args || {},
        result: summarizeResult(result),
        latencyMs: Date.now() - startTime,
        userId: USER_ID,
        timestamp: new Date().toISOString(),
      });

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

      // Log failed calls too
      logToolCall({
        tool: name,
        params: args || {},
        result: `Error: ${message}`,
        latencyMs: Date.now() - startTime,
        userId: USER_ID,
        timestamp: new Date().toISOString(),
      });

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

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Human OS MCP Server running on stdio');
}

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
