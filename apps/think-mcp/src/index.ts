#!/usr/bin/env node
/**
 * Think MCP Server
 *
 * Structured reasoning and analysis tools for multi-step problem solving.
 * Sibling to do-mcp (sync actions) and code-mcp (async orchestration).
 *
 * think-mcp provides tools for explicit reasoning chains, branching
 * hypotheses, side-by-side comparisons, and synthesized conclusions.
 *
 * Tools:
 * - think_step: Add a reasoning step with explicit logic
 * - think_branch: Explore alternative reasoning paths
 * - think_compare: Side-by-side evaluation of options
 * - think_conclude: Synthesize steps into conclusion
 * - think_status: Get current reasoning chain state
 * - think_reset: Clear chain for new problem
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

import { reasonTools, handleReasonTools } from './tools/reason.js';

// Load .env from script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Handle --version flag
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log('think-mcp v0.1.0');
  process.exit(0);
}

// =============================================================================
// MAIN SERVER
// =============================================================================

async function main() {
  // Create server
  const server = new Server(
    { name: 'think-mcp', version: '0.1.0' },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ---------------------------------------------------------------------------
  // TOOLS
  // ---------------------------------------------------------------------------

  const allTools = [...reasonTools];

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleReasonTools(name, args || {});

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

  console.error('Think MCP Server v0.1.0 running on stdio');
  console.error('Structured reasoning and analysis tools.');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
