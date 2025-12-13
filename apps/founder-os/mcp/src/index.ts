#!/usr/bin/env node
/**
 * Founder OS MCP Server with GFT Integration
 *
 * Extended MCP server for Founder OS that includes:
 * - Base Founder OS tools (tasks, goals, network)
 * - GFT LinkedIn ingestion tools
 * - Enhanced relationship management
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
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { z } from 'zod';
import {
  ContextEngine,
  KnowledgeGraph,
  createSupabaseClient,
  type Viewer,
  type Layer,
} from '@human-os/core';
import {
  ingestLinkedInProfile,
  batchIngestLinkedInProfiles,
  updateLinkedInProfile,
  type LinkedInProfileData,
} from './tools/gft-ingestion.js';
import {
  getSessionContext,
  loadMode,
} from './tools/session.js';
import {
  defineTerm,
  lookupTerm,
  listGlossary,
  getFrequentTerms,
  searchGlossary,
  deleteTerm,
} from './tools/glossary.js';
import {
  packSearch,
  findConnectionPoints,
  quickSearch,
  findSimilarPeople,
} from './tools/search.js';

/**
 * Session management tool definitions
 */
const sessionTools: Tool[] = [
  {
    name: 'get_session_context',
    description: 'Load identity, current state, and available modes at session start. Call this at the beginning of every conversation.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'load_mode',
    description: 'Load protocol files for a specific mode (crisis, voice, decision, conversation, identity)',
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          description: 'Mode to load: crisis, voice, decision, conversation, identity',
          enum: ['crisis', 'voice', 'decision', 'conversation', 'identity'],
        },
      },
      required: ['mode'],
    },
  },
];

/**
 * GFT-specific tool definitions
 */
const gftTools: Tool[] = [
  {
    name: 'gft_ingest_linkedin',
    description: 'Ingest a LinkedIn profile from GFT scraper data',
    inputSchema: {
      type: 'object',
      properties: {
        linkedinUrl: { type: 'string', description: 'LinkedIn profile URL' },
        name: { type: 'string', description: 'Full name of the person' },
        headline: { type: 'string', description: 'LinkedIn headline' },
        company: { type: 'string', description: 'Current company' },
        about: { type: 'string', description: 'About/bio section' },
        experience: { type: 'string', description: 'Experience section' },
        education: { type: 'string', description: 'Education section' },
        skills: { type: 'array', items: { type: 'string' }, description: 'List of skills' },
        location: { type: 'string', description: 'Location' },
        scrapedAt: { type: 'string', description: 'Timestamp when scraped (ISO)' },
      },
      required: ['linkedinUrl', 'name', 'scrapedAt'],
    },
  },
  {
    name: 'gft_batch_ingest',
    description: 'Batch ingest multiple LinkedIn profiles',
    inputSchema: {
      type: 'object',
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              linkedinUrl: { type: 'string' },
              name: { type: 'string' },
              headline: { type: 'string' },
              company: { type: 'string' },
              about: { type: 'string' },
              experience: { type: 'string' },
              education: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } },
              location: { type: 'string' },
              scrapedAt: { type: 'string' },
            },
            required: ['linkedinUrl', 'name', 'scrapedAt'],
          },
          description: 'Array of LinkedIn profile data',
        },
      },
      required: ['profiles'],
    },
  },
  {
    name: 'gft_update_profile',
    description: 'Update an existing LinkedIn profile with new data',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Entity slug to update' },
        linkedinUrl: { type: 'string', description: 'LinkedIn profile URL' },
        name: { type: 'string', description: 'Full name of the person' },
        headline: { type: 'string' },
        company: { type: 'string' },
        about: { type: 'string' },
        experience: { type: 'string' },
        education: { type: 'string' },
        skills: { type: 'array', items: { type: 'string' } },
        location: { type: 'string' },
        scrapedAt: { type: 'string', description: 'Timestamp when scraped (ISO)' },
      },
      required: ['slug', 'linkedinUrl', 'name', 'scrapedAt'],
    },
  },
];

/**
 * Glossary tool definitions
 */
const glossaryTools: Tool[] = [
  {
    name: 'define_term',
    description: 'Define or update a term in the glossary. Use for shorthand, nicknames, slang, acronyms. Example: "Ruth = Justin\'s wife, Clinical Psychologist"',
    inputSchema: {
      type: 'object',
      properties: {
        term: { type: 'string', description: 'The term to define (case-insensitive matching)' },
        definition: { type: 'string', description: 'Full definition/explanation of the term' },
        term_type: {
          type: 'string',
          description: 'Classification of the term',
          enum: ['person', 'group', 'acronym', 'slang', 'project', 'shorthand'],
          default: 'shorthand',
        },
        short_definition: { type: 'string', description: 'One-liner for inline expansion (auto-generated if not provided)' },
        entity_id: { type: 'string', description: 'UUID of linked entity (if this term refers to an entity)' },
        context_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Context tags like "personal", "work", "social"',
        },
        always_expand: { type: 'boolean', description: 'Always show definition when term is used', default: false },
      },
      required: ['term', 'definition'],
    },
  },
  {
    name: 'lookup_term',
    description: 'Look up a term in the glossary. Returns definition and increments usage count. Use when user uses unfamiliar shorthand.',
    inputSchema: {
      type: 'object',
      properties: {
        term: { type: 'string', description: 'The term to look up' },
      },
      required: ['term'],
    },
  },
  {
    name: 'list_glossary',
    description: 'List all terms in the glossary, optionally filtered by type or tag',
    inputSchema: {
      type: 'object',
      properties: {
        term_type: {
          type: 'string',
          description: 'Filter by term type',
          enum: ['person', 'group', 'acronym', 'slang', 'project', 'shorthand'],
        },
        context_tag: { type: 'string', description: 'Filter by context tag (e.g., "personal", "work")' },
        search: { type: 'string', description: 'Search in term and definition' },
        limit: { type: 'number', description: 'Max results to return', default: 50 },
      },
      required: [],
    },
  },
  {
    name: 'search_glossary',
    description: 'Full-text search across glossary terms and definitions',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'delete_term',
    description: 'Remove a term from the glossary',
    inputSchema: {
      type: 'object',
      properties: {
        term: { type: 'string', description: 'The term to delete' },
      },
      required: ['term'],
    },
  },
];

/**
 * Search tool definitions
 */
const searchTools: Tool[] = [
  {
    name: 'pack_search',
    description: 'Multi-dimensional identity discovery. Search across entities, identity packs, and context files. Use for finding people by skills, interests, location, or keywords.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Search keyword (matches name, headline, tags, content)' },
        entity_type: {
          type: 'string',
          description: 'Filter by entity type',
          enum: ['person', 'company', 'project'],
        },
        pack_type: {
          type: 'string',
          description: 'Filter by identity pack type',
          enum: ['professional', 'interests', 'social', 'dating', 'expertise', 'founder'],
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags (any match)',
        },
        location: { type: 'string', description: 'Filter by location (fuzzy match)' },
        limit: { type: 'number', description: 'Max results to return', default: 20 },
      },
      required: [],
    },
  },
  {
    name: 'find_connection_points',
    description: 'Serendipity engine: Discover shared interests, mutual connections, and conversation openers between two people. Use before meeting someone or preparing for outreach.',
    inputSchema: {
      type: 'object',
      properties: {
        viewer_slug: { type: 'string', description: 'Slug of the person looking (usually the user)' },
        target_slug: { type: 'string', description: 'Slug of the person they want to connect with' },
      },
      required: ['viewer_slug', 'target_slug'],
    },
  },
  {
    name: 'quick_search',
    description: 'Simple entity lookup by name or keyword. Faster than pack_search for basic queries.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (name or keyword)' },
        type: {
          type: 'string',
          description: 'Entity type filter',
          enum: ['person', 'company', 'project'],
        },
        limit: { type: 'number', description: 'Max results', default: 10 },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_similar_people',
    description: 'Find people with similar interests and background to a given person. Useful for networking recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        person_slug: { type: 'string', description: 'Slug of the person to find similar people to' },
        limit: { type: 'number', description: 'Max results', default: 10 },
      },
      required: ['person_slug'],
    },
  },
];

/**
 * Validation schemas
 */
const LinkedInProfileSchema = z.object({
  linkedinUrl: z.string(),
  name: z.string(),
  headline: z.string().optional(),
  company: z.string().optional(),
  about: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  scrapedAt: z.string(),
});

const BatchIngestSchema = z.object({
  profiles: z.array(LinkedInProfileSchema),
});

const UpdateProfileSchema = LinkedInProfileSchema.extend({
  slug: z.string(),
});

/**
 * Handle GFT tool calls
 */
async function handleGFTTool(
  toolName: string,
  args: Record<string, unknown>,
  contextEngine: ContextEngine,
  knowledgeGraph: KnowledgeGraph,
  userId: string
): Promise<unknown> {
  switch (toolName) {
    case 'gft_ingest_linkedin': {
      const data = LinkedInProfileSchema.parse(args);
      return await ingestLinkedInProfile(data, contextEngine, knowledgeGraph, userId);
    }

    case 'gft_batch_ingest': {
      const { profiles } = BatchIngestSchema.parse(args);
      return await batchIngestLinkedInProfiles(profiles, contextEngine, knowledgeGraph, userId);
    }

    case 'gft_update_profile': {
      const { slug, ...data } = UpdateProfileSchema.parse(args);
      return await updateLinkedInProfile(slug, data, contextEngine, knowledgeGraph, userId);
    }

    default:
      throw new Error(`Unknown GFT tool: ${toolName}`);
  }
}

/**
 * Main server function
 */
async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const USER_ID = process.env.HUMAN_OS_USER_ID || '';
  const LAYER = (process.env.HUMAN_OS_LAYER || `founder:${USER_ID}`) as Layer;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    process.exit(1);
  }

  const supabase = createSupabaseClient({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
  });

  const viewer: Viewer = { userId: USER_ID };

  const contextEngine = new ContextEngine({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
    viewer,
  });

  const knowledgeGraph = new KnowledgeGraph({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
  });

  // Get the directory of this file for loading INSTRUCTIONS.md
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const instructionsPath = join(__dirname, '..', 'INSTRUCTIONS.md');

  const server = new Server(
    { name: 'founder-os-gft', version: '0.1.0' },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: [...sessionTools, ...gftTools, ...glossaryTools, ...searchTools] };
  });

  // ==========================================================================
  // MCP PROMPTS - Discoverable as slash commands (e.g., /founder-os__session_context)
  // ==========================================================================

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'session_context',
          description: 'Initialize session with identity, current state, and instructions for working with Justin. Call this at the start of every conversation.',
        },
        {
          name: 'crisis_mode',
          description: 'Load crisis support protocols for when Justin is overwhelmed, stuck, or drowning.',
        },
        {
          name: 'voice_mode',
          description: 'Load writing engine and templates for drafting posts, content, and communications.',
        },
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;

    if (name === 'session_context') {
      // Load INSTRUCTIONS.md and also call get_session_context for dynamic state
      const instructions = await readFile(instructionsPath, 'utf-8');
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

  // ==========================================================================
  // MCP RESOURCES - Referenceable with @ notation (e.g., @founder-os://instructions)
  // ==========================================================================

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
          name: 'Justin\'s Identity',
          description: 'Core identity information, cognitive profile, and preferences',
          mimeType: 'text/markdown',
        },
        {
          uri: 'founder-os://state',
          name: 'Current State',
          description: 'Justin\'s current energy level, priorities, and what to avoid',
          mimeType: 'application/json',
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === 'founder-os://instructions') {
      const content = await readFile(instructionsPath, 'utf-8');
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: content,
          },
        ],
      };
    }

    if (uri === 'founder-os://identity') {
      const sessionContext = await getSessionContext(SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_ID);
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: sessionContext.identity || 'Identity not loaded',
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

  // ==========================================================================
  // TOOL HANDLERS
  // ==========================================================================

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      // Handle session tools
      if (name === 'get_session_context') {
        result = await getSessionContext(SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_ID);
      } else if (name === 'load_mode') {
        const mode = (args as { mode: string })?.mode;
        if (!mode) throw new Error('mode parameter is required');
        result = await loadMode(SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_ID, mode);
      }
      // Handle glossary tools
      else if (name === 'define_term') {
        const params = args as {
          term: string;
          definition: string;
          term_type?: string;
          short_definition?: string;
          entity_id?: string;
          context_tags?: string[];
          always_expand?: boolean;
        };
        result = await defineTerm(SUPABASE_URL, SUPABASE_SERVICE_KEY, LAYER, params);
      } else if (name === 'lookup_term') {
        const { term } = args as { term: string };
        result = await lookupTerm(SUPABASE_URL, SUPABASE_SERVICE_KEY, LAYER, term);
      } else if (name === 'list_glossary') {
        const params = args as {
          term_type?: string;
          context_tag?: string;
          search?: string;
          limit?: number;
        };
        result = await listGlossary(SUPABASE_URL, SUPABASE_SERVICE_KEY, LAYER, params);
      } else if (name === 'search_glossary') {
        const { query } = args as { query: string };
        result = await searchGlossary(SUPABASE_URL, SUPABASE_SERVICE_KEY, LAYER, query);
      } else if (name === 'delete_term') {
        const { term } = args as { term: string };
        result = await deleteTerm(SUPABASE_URL, SUPABASE_SERVICE_KEY, LAYER, term);
      }
      // Handle search tools
      else if (name === 'pack_search') {
        const params = args as {
          keyword?: string;
          entity_type?: string;
          pack_type?: string;
          tags?: string[];
          location?: string;
          limit?: number;
        };
        result = await packSearch(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
          ...params,
          layer: LAYER,
        });
      } else if (name === 'find_connection_points') {
        const { viewer_slug, target_slug } = args as { viewer_slug: string; target_slug: string };
        result = await findConnectionPoints(SUPABASE_URL, SUPABASE_SERVICE_KEY, viewer_slug, target_slug);
      } else if (name === 'quick_search') {
        const { query, type, limit } = args as { query: string; type?: 'person' | 'company' | 'project'; limit?: number };
        result = await quickSearch(SUPABASE_URL, SUPABASE_SERVICE_KEY, query, { type, limit });
      } else if (name === 'find_similar_people') {
        const { person_slug, limit } = args as { person_slug: string; limit?: number };
        result = await findSimilarPeople(SUPABASE_URL, SUPABASE_SERVICE_KEY, person_slug, limit);
      } else {
        // Handle GFT tools
        result = await handleGFTTool(
          name,
          args || {},
          contextEngine,
          knowledgeGraph,
          USER_ID
        );
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

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Founder OS GFT MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
