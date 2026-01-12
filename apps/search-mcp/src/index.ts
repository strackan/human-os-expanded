#!/usr/bin/env node
/**
 * Search MCP Server
 *
 * Unified search and information retrieval:
 * - arxiv_*: Scientific papers and preprints
 * - doc_*: Library documentation via Context7
 * - recall_*: Entity and memory retrieval from Human OS
 *
 * Sibling to do-mcp (sync mutations) and code-mcp (async orchestration).
 * search-mcp handles all query/retrieval operations.
 *
 * Tools:
 * - arxiv_search, arxiv_paper, arxiv_categories: arXiv papers
 * - doc_resolve, doc_search, doc_quick: Library docs
 * - recall_person, recall_company, recall_project, etc: Entity retrieval
 * - recall_journal: Journal entries/interactions
 * - recall_search: Semantic search across entities
 * - recall_connections: Relationship traversal
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

import { arxivTools, handleArxivTools } from './tools/arxiv.js';
import { docTools, handleDocTools } from './tools/docs.js';
import { recallTools, handleRecallTools } from './tools/recall.js';
import { searchTools, handleSearchTools } from './tools/semantic.js';

// Load .env from script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Handle --version flag
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log('search-mcp v0.1.0');
  process.exit(0);
}

// =============================================================================
// MAIN SERVER
// =============================================================================

async function main() {
  // Environment setup
  const SUPABASE_URL = process.env['SUPABASE_URL'] || '';
  const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] || '';
  const USER_ID = process.env['HUMAN_OS_USER_ID'] || '';
  const LAYER = process.env['HUMAN_OS_LAYER'] || `founder:${USER_ID}`;
  const CONTEXT7_API_KEY = process.env['CONTEXT7_API_KEY'] || '';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Warning: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set - recall_* tools will not work');
  }

  if (!CONTEXT7_API_KEY) {
    console.error('Warning: CONTEXT7_API_KEY not set - doc_* tools will not work');
  }

  // Lazy-load Supabase client
  let supabaseClient: SupabaseClient | null = null;
  const getSupabase = (): SupabaseClient => {
    if (!supabaseClient) {
      if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        throw new Error('Supabase not configured - recall_* tools unavailable');
      }
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }
    return supabaseClient;
  };

  // Create server
  const server = new Server(
    { name: 'search-mcp', version: '0.1.0' },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ---------------------------------------------------------------------------
  // TOOLS
  // ---------------------------------------------------------------------------

  // Combine all tools: external search, docs, recall (structured), search (semantic)
  const allTools = [...arxivTools, ...docTools, ...recallTools, ...searchTools];

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Try arxiv tools
      let result = await handleArxivTools(name, args || {});

      // Try doc tools (Context7)
      if (result === null) {
        if (name.startsWith('doc_')) {
          if (!CONTEXT7_API_KEY) {
            throw new Error('CONTEXT7_API_KEY not configured - doc_* tools unavailable');
          }
        }
        result = await handleDocTools(name, args || {}, CONTEXT7_API_KEY);
      }

      // Try recall tools (Supabase - structured)
      if (result === null) {
        result = await handleRecallTools(name, args || {}, {
          supabase: getSupabase(),
          userId: USER_ID,
          layer: LAYER,
        });
      }

      // Try search tools (Supabase - semantic)
      if (result === null) {
        result = await handleSearchTools(name, args || {}, {
          supabase: getSupabase(),
          userId: USER_ID,
          layer: LAYER,
        });
      }

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

  console.error('Search MCP Server v0.1.0 running on stdio');
  console.error('Available: arXiv papers, Context7 docs, Human OS recall');
  console.error(`Recall (Supabase): ${SUPABASE_URL ? 'enabled' : 'disabled (no credentials)'}`);
  console.error(`Context7 docs: ${CONTEXT7_API_KEY ? 'enabled' : 'disabled (no API key)'}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
