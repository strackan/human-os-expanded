#!/usr/bin/env node
/**
 * Founder OS MCP Server
 *
 * Slim orchestrator that wires together modular tool handlers.
 * Each tool module (tasks, queue, glossary, etc.) exports its own
 * tool definitions and handler function.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  ContextEngine,
  KnowledgeGraph,
  createSupabaseClient,
  type Layer,
} from '@human-os/core';

// Import tool modules
import { taskTools, handleTaskTools } from './tools/tasks.js';
import { queueTools, handleQueueTools } from './tools/queue.js';
import { glossaryTools, handleGlossaryTools } from './tools/glossary.js';
import { searchTools, handleSearchTools } from './tools/search.js';
import { sessionTools, handleSessionTools, getSessionContext, loadMode } from './tools/session.js';
import { gftTools, handleGFTTools } from './tools/gft-ingestion.js';
import { demoTools, handleDemoTools } from './tools/demo.js';
import { transcriptTools, handleTranscriptTools } from './tools/transcripts.js';
import { communityIntelTools, handleCommunityIntelTools } from './tools/community-intel.js';
import { projectTools, handleProjectTools } from './tools/projects/index.js';
import { journalTools, handleJournalTools } from './tools/journal.js';
import { emotionTools, handleEmotionTools } from './tools/emotions.js';
import { voiceTools, handleVoiceTools } from './tools/voice.js';
import { skillsTools, handleSkillsTools } from './tools/skills.js';
import { contextTools, handleContextTools } from './tools/context.js';

// Alias system tools (natural language routing)
import { doTools, handleDoTools } from './tools/do.js';
import { recallTools, handleRecallTools } from './tools/recall.js';
import { learnAliasTools, handleLearnAliasTools } from './tools/learn-alias.js';

import { createToolContext, withModeProperties, resolveUserUUID, type ToolHandler } from './lib/context.js';

// Declare globals for embedded data (set by bundle script for standalone exe)
declare global {
  var __EMBEDDED_INSTRUCTIONS__: string | undefined;
  var __BUILD_INFO__: {
    version: string;
    gitHash: string;
    gitBranch: string;
    buildTime: string;
  } | undefined;
}

// Handle --version flag
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  const info = globalThis.__BUILD_INFO__;
  if (info) {
    console.log(`founder-os-mcp v${info.version} (${info.gitHash})`);
    console.log(`Branch: ${info.gitBranch}`);
    console.log(`Built: ${info.buildTime}`);
  } else {
    // Development mode - version from package.json at runtime
    console.log('founder-os-mcp v0.2.0 (development)');
  }
  process.exit(0);
}

// =============================================================================
// TOOL REGISTRY
// =============================================================================

/**
 * All tool modules with their handlers
 * Order matters - first matching handler wins
 *
 * NOTE: Alias tools (do, recall, learn_alias) are placed FIRST
 * so the natural language router is tried before direct tools.
 * This enables the "user vocabulary as API" pattern.
 */
const toolModules: Array<{ tools: typeof taskTools; handler: ToolHandler }> = [
  // Alias system - natural language routing (try first)
  { tools: doTools, handler: handleDoTools },
  { tools: recallTools, handler: handleRecallTools },
  { tools: learnAliasTools, handler: handleLearnAliasTools },

  // Direct tools (fallback when aliases don't match)
  { tools: sessionTools, handler: handleSessionTools },
  { tools: queueTools, handler: handleQueueTools },
  { tools: taskTools, handler: handleTaskTools },
  { tools: projectTools, handler: handleProjectTools },
  { tools: glossaryTools, handler: handleGlossaryTools },
  { tools: searchTools, handler: handleSearchTools },
  { tools: gftTools, handler: handleGFTTools },
  { tools: demoTools, handler: handleDemoTools },
  { tools: transcriptTools, handler: handleTranscriptTools },
  { tools: communityIntelTools, handler: handleCommunityIntelTools },
  { tools: journalTools, handler: handleJournalTools },
  { tools: emotionTools, handler: handleEmotionTools },
  { tools: voiceTools, handler: handleVoiceTools },
  { tools: skillsTools, handler: handleSkillsTools },
  { tools: contextTools, handler: handleContextTools },
];

/** Flat list of all tools for MCP registration, with mode property added */
const allTools = withModeProperties(toolModules.flatMap(m => m.tools));

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get INSTRUCTIONS.md content - uses embedded version for standalone exe,
 * falls back to file read for development
 */
async function getInstructions(instructionsPath: string): Promise<string> {
  if (globalThis.__EMBEDDED_INSTRUCTIONS__) {
    return globalThis.__EMBEDDED_INSTRUCTIONS__;
  }
  return readFile(instructionsPath, 'utf-8');
}

// =============================================================================
// MAIN SERVER
// =============================================================================

async function main() {
  // Environment setup
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const USER_ID = process.env.HUMAN_OS_USER_ID || '';
  const LAYER = (process.env.HUMAN_OS_LAYER || `founder:${USER_ID}`) as Layer;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    process.exit(1);
  }

  // Resolve user UUID from slug (for database operations)
  const USER_UUID = await resolveUserUUID(SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_ID);
  console.error(`Resolved user "${USER_ID}" to UUID: ${USER_UUID}`);

  // Initialize services
  const supabase = createSupabaseClient({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
  });

  const contextEngine = new ContextEngine({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
    viewer: { userId: USER_ID },
  });

  const knowledgeGraph = new KnowledgeGraph({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
  });

  // Build shared context for all tool handlers
  const ctx = createToolContext({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
    userId: USER_ID,
    userUUID: USER_UUID,
    layer: LAYER,
    contextEngine,
    knowledgeGraph,
  });

  // Get instructions path
  let instructionsPath = '';
  try {
    if (typeof import.meta?.url === 'string') {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      instructionsPath = join(__dirname, '..', 'INSTRUCTIONS.md');
    }
  } catch {
    // Standalone exe - instructions are embedded
  }

  // Get version info
  const buildInfo = globalThis.__BUILD_INFO__;
  const version = buildInfo?.version || '0.2.0';

  // Create server
  const server = new Server(
    { name: 'founder-os-mcp', version },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    }
  );

  // ---------------------------------------------------------------------------
  // TOOLS
  // ---------------------------------------------------------------------------

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Try each handler until one returns a non-null result
      for (const { handler } of toolModules) {
        const result = await handler(name, args || {}, ctx);
        if (result !== null) {
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        }
      }

      // No handler matched
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
  // PROMPTS
  // ---------------------------------------------------------------------------

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'session_context',
          description: 'Initialize session with identity, current state, and instructions.',
        },
        {
          name: 'crisis_mode',
          description: 'Load crisis support protocols.',
        },
        {
          name: 'voice_mode',
          description: 'Load writing engine and templates.',
        },
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;

    if (name === 'session_context') {
      const instructions = await getInstructions(instructionsPath);
      const sessionContext = await getSessionContext(SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_ID);

      return {
        description: 'Session initialization with instructions and current context',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `${instructions}\n\n---\n\n## Current Session Context\n\n\`\`\`json\n${JSON.stringify(sessionContext, null, 2)}\n\`\`\``,
            },
          },
        ],
      };
    }

    if (name === 'crisis_mode') {
      const modeContent = await loadMode(SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_ID, 'crisis');
      return {
        description: 'Crisis support protocols loaded',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `## Crisis Mode Activated\n\n${JSON.stringify(modeContent, null, 2)}`,
            },
          },
        ],
      };
    }

    if (name === 'voice_mode') {
      const modeContent = await loadMode(SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_ID, 'voice');
      return {
        description: 'Writing engine and templates loaded',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `## Voice Mode Activated\n\n${JSON.stringify(modeContent, null, 2)}`,
            },
          },
        ],
      };
    }

    throw new Error(`Unknown prompt: ${name}`);
  });

  // ---------------------------------------------------------------------------
  // RESOURCES
  // ---------------------------------------------------------------------------

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'founder-os://instructions',
          name: 'Session Instructions',
          description: 'Instructions for how Claude should interact with Justin',
          mimeType: 'text/markdown',
        },
        {
          uri: 'founder-os://identity',
          name: "Justin's Identity",
          description: 'Core identity information, cognitive profile, and preferences',
          mimeType: 'text/markdown',
        },
        {
          uri: 'founder-os://state',
          name: 'Current State',
          description: "Justin's current energy level, priorities, and what to avoid",
          mimeType: 'application/json',
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === 'founder-os://instructions') {
      const content = await getInstructions(instructionsPath);
      return {
        contents: [{ uri, mimeType: 'text/markdown', text: content }],
      };
    }

    if (uri === 'founder-os://identity') {
      const sessionContext = await getSessionContext(SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_ID);
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: sessionContext.startHereContent || 'Identity not loaded',
          },
        ],
      };
    }

    if (uri === 'founder-os://state') {
      const sessionContext = await getSessionContext(SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_ID);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(sessionContext.currentState, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  });

  // ---------------------------------------------------------------------------
  // START SERVER
  // ---------------------------------------------------------------------------

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const versionStr = buildInfo ? `v${buildInfo.version} (${buildInfo.gitHash})` : `v${version}`;
  console.error(`Founder OS MCP Server ${versionStr} running on stdio`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
