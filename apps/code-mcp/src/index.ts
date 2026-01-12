#!/usr/bin/env node
/**
 * Code MCP Server
 *
 * Async code orchestration with Claude Code in isolated git worktrees.
 * Sibling to do-mcp - while do() handles synchronous routing,
 * code() handles async task spawning with GitHub-based tracking.
 *
 * Tools:
 * - code_start: Start a Claude Code task in isolated worktree
 * - code_status: Check task progress via GitHub issue
 * - code_list: List all running code tasks
 * - code_merge: Merge completed worktree to main
 * - code_discard: Discard worktree without merging
 */

import { config } from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Layer } from '@human-os/core';

import { codeTools, handleCodeTools } from './tools/code.js';

// Load .env from script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Handle --version flag
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log('code-mcp v0.1.0');
  process.exit(0);
}

/**
 * Minimal context for code tools
 */
export interface CodeContext {
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  userUUID: string;
  layer: Layer;
  getClient: () => SupabaseClient;
}

// =============================================================================
// MAIN SERVER
// =============================================================================

async function main() {
  // Environment setup
  const SUPABASE_URL = process.env['SUPABASE_URL'];
  const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  const USER_ID = process.env['HUMAN_OS_USER_ID'] || '';
  const LAYER = (process.env['HUMAN_OS_LAYER'] || `founder:${USER_ID}`) as Layer;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    process.exit(1);
  }

  // Lazy-load Supabase client
  let client: SupabaseClient | null = null;

  // Build tool context
  const ctx: CodeContext = {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
    userId: USER_ID,
    userUUID: USER_ID, // Simplified - in production would resolve UUID
    layer: LAYER,
    getClient: () => {
      if (!client) {
        client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      }
      return client;
    },
  };

  // Create server
  const server = new Server(
    { name: 'code-mcp', version: '0.1.0' },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ---------------------------------------------------------------------------
  // TOOLS
  // ---------------------------------------------------------------------------

  // Code orchestration tools only (doc_* moved to search-mcp)
  const allTools = [...codeTools];

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Handle code orchestration tools
      const result = await handleCodeTools(name, args || {}, ctx);

      if (result === null) {
        throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  });

  // ---------------------------------------------------------------------------
  // START SERVER
  // ---------------------------------------------------------------------------

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Code MCP Server v0.1.0 running on stdio');
  console.error(`Layer: ${LAYER}`);
  console.error('Async code orchestration with GitHub tracking.');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
