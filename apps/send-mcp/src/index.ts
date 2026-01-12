#!/usr/bin/env node
/**
 * Send MCP Server
 *
 * Outbound communication tools for messaging and notifications.
 * Sibling to do-mcp (sync actions) and code-mcp (async orchestration).
 *
 * send-mcp provides tools for sending messages via Slack, email, SMS, etc.
 *
 * Tools:
 * - slack_send: Send message to Slack channel or user
 * - slack_channels: List available Slack channels
 * - slack_thread: Reply to a Slack thread
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
import { WebClient } from '@slack/web-api';

import { slackTools, handleSlackTools } from './tools/slack.js';

// Load .env from script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Handle --version flag
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log('send-mcp v0.1.0');
  process.exit(0);
}

// =============================================================================
// MAIN SERVER
// =============================================================================

async function main() {
  // Environment setup
  const SLACK_BOT_TOKEN = process.env['SLACK_BOT_TOKEN'] || '';

  if (!SLACK_BOT_TOKEN) {
    console.error('Warning: SLACK_BOT_TOKEN not set - slack_* tools will not work');
  }

  // Initialize Slack client (lazy - only used if token exists)
  let slackClient: WebClient | null = null;
  const getSlackClient = (): WebClient => {
    if (!slackClient) {
      if (!SLACK_BOT_TOKEN) {
        throw new Error('SLACK_BOT_TOKEN not configured');
      }
      slackClient = new WebClient(SLACK_BOT_TOKEN);
    }
    return slackClient;
  };

  // Create server
  const server = new Server(
    { name: 'send-mcp', version: '0.1.0' },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ---------------------------------------------------------------------------
  // TOOLS
  // ---------------------------------------------------------------------------

  const allTools = [...slackTools];

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Handle Slack tools
      if (name.startsWith('slack_')) {
        const result = await handleSlackTools(name, args || {}, getSlackClient());
        if (result !== null) {
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        }
      }

      throw new Error(`Unknown tool: ${name}`);
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

  console.error('Send MCP Server v0.1.0 running on stdio');
  console.error(`Slack: ${SLACK_BOT_TOKEN ? 'enabled' : 'disabled (no token)'}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
