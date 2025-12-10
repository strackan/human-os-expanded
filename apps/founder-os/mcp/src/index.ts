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
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
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

  const server = new Server(
    { name: 'founder-os-gft', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: gftTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleGFTTool(
        name,
        args || {},
        contextEngine,
        knowledgeGraph,
        USER_ID
      );

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
