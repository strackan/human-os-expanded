#!/usr/bin/env node
/**
 * Renubu Integration MCP Server
 *
 * Provides external enrichment from Human-OS GFT data for Renubu CS workflows.
 *
 * PERMISSION BOUNDARY (ENFORCED):
 * ✅ CAN access:
 *    - gft.contacts (public LinkedIn data)
 *    - gft.companies (public company data)
 *    - gft.li_posts (public LinkedIn posts)
 *    - gft.activities (interaction history)
 *    - relationship_context (layer-scoped opinions)
 *    - context_files (skills files in permitted layers)
 *    - skills_tools / skills_programs (tool/program definitions)
 *    - renubu.transcripts (tenant-scoped call transcripts)
 *
 * ❌ CANNOT access:
 *    - founder_os.* (personal tasks, goals, check-ins)
 *    - powerpak.* (expert configurations)
 *    - founder:* layer files (personal context)
 *    - Private identity information
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { DEFAULTS, OPINION_TYPES, OPINION_SENTIMENTS, CONFIDENCE_LEVELS } from '@human-os/core';
import { createToolContext, type ToolContext, type ToolHandler } from './lib/context.js';
import {
  enrichContact,
  enrichCompany,
  getFullEnrichment,
} from './tools/enrichment.js';
import {
  getContactOpinions,
  upsertOpinion,
  deleteOpinion,
  searchOpinions,
  getOpinionSummary,
} from './tools/relationship.js';
import {
  listSkillsFiles,
  getSkillsFileDetail,
  searchSkillsByTool,
  getEntitySkills,
  listAvailableTools,
} from './tools/skills.js';
import { transcriptTools, handleTranscriptTools } from './tools/transcripts.js';
import { teamIntelTools, handleTeamIntelTools } from './tools/team-intel.js';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

const enrichmentTools: Tool[] = [
  {
    name: 'enrich_contact',
    description: 'Get public/external intelligence about a contact from GFT CRM data.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_name: { type: 'string', description: 'Name of the contact' },
        contact_email: { type: 'string', description: 'Email address' },
        contact_linkedin_url: { type: 'string', description: 'LinkedIn profile URL' },
        company_name: { type: 'string', description: 'Company name for disambiguation' },
      },
      required: [],
    },
  },
  {
    name: 'enrich_company',
    description: 'Get public/external intelligence about a company from GFT CRM data.',
    inputSchema: {
      type: 'object',
      properties: {
        company_name: { type: 'string', description: 'Company name' },
        company_domain: { type: 'string', description: 'Company website domain' },
        company_linkedin_url: { type: 'string', description: 'LinkedIn company page URL' },
      },
      required: [],
    },
  },
  {
    name: 'get_full_enrichment',
    description: 'Get complete external enrichment for a contact and their company.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_name: { type: 'string' },
        contact_email: { type: 'string' },
        contact_linkedin_url: { type: 'string' },
        company_name: { type: 'string' },
        company_domain: { type: 'string' },
      },
      required: [],
    },
  },
];

const relationshipTools: Tool[] = [
  {
    name: 'get_contact_opinions',
    description: 'Get all opinions/notes about a contact.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_entity_id: { type: 'string', description: 'UUID of the contact entity' },
        layer: { type: 'string', description: 'Privacy layer' },
      },
      required: ['contact_entity_id', 'layer'],
    },
  },
  {
    name: 'upsert_opinion',
    description: 'Create or update an opinion about a contact. Defaults to community visibility (team-shared).',
    inputSchema: {
      type: 'object',
      properties: {
        contact_entity_id: { type: 'string' },
        gft_contact_id: { type: 'string' },
        opinion_type: { type: 'string', enum: [...OPINION_TYPES] },
        content: { type: 'string', description: 'The raw opinion content (private)' },
        sentiment: { type: 'string', enum: [...OPINION_SENTIMENTS] },
        confidence: { type: 'string', enum: [...CONFIDENCE_LEVELS] },
        evidence: { type: 'array', items: { type: 'string' } },
        source_context: { type: 'string' },
        layer: { type: 'string' },
        visibility: { type: 'string', enum: ['private', 'community', 'public'], description: 'Who can see this. Default: community' },
        community_content: { type: 'string', description: 'Sanitized version for team sharing. If not provided, uses content.' },
        publish_anonymously: { type: 'boolean', description: 'Hide author identity in team queries' },
      },
      required: ['contact_entity_id', 'opinion_type', 'content', 'layer'],
    },
  },
  {
    name: 'delete_opinion',
    description: 'Delete an opinion about a contact.',
    inputSchema: {
      type: 'object',
      properties: {
        opinion_id: { type: 'string' },
        layer: { type: 'string' },
      },
      required: ['opinion_id', 'layer'],
    },
  },
  {
    name: 'search_opinions',
    description: 'Search opinions by keyword.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        layer: { type: 'string' },
        opinion_type: { type: 'string', enum: [...OPINION_TYPES] },
        limit: { type: 'number' },
      },
      required: ['query', 'layer'],
    },
  },
  {
    name: 'get_opinion_summary',
    description: 'Get a quick summary of opinions about a contact.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_entity_id: { type: 'string' },
        layer: { type: 'string' },
      },
      required: ['contact_entity_id', 'layer'],
    },
  },
];

const skillsTools: Tool[] = [
  {
    name: 'list_skills_files',
    description: 'List skills files by layer and source system.',
    inputSchema: {
      type: 'object',
      properties: {
        layer: { type: 'string' },
        source_system: { type: 'string' },
        limit: { type: 'number' },
      },
      required: [],
    },
  },
  {
    name: 'get_skills_file',
    description: 'Get detailed skills file with all tools and programs.',
    inputSchema: {
      type: 'object',
      properties: {
        file_id: { type: 'string' },
      },
      required: ['file_id'],
    },
  },
  {
    name: 'search_skills_by_tool',
    description: 'Search skills files by tool name.',
    inputSchema: {
      type: 'object',
      properties: {
        tool_name: { type: 'string' },
        layer: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['tool_name'],
    },
  },
  {
    name: 'get_entity_skills',
    description: 'Get skills files linked to an entity.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_id: { type: 'string' },
      },
      required: ['entity_id'],
    },
  },
  {
    name: 'list_available_tools',
    description: 'List all available tools across accessible skills files.',
    inputSchema: {
      type: 'object',
      properties: {
        layer: { type: 'string' },
        limit: { type: 'number' },
      },
      required: [],
    },
  },
];

const allTools: Tool[] = [...enrichmentTools, ...relationshipTools, ...skillsTools, ...transcriptTools, ...teamIntelTools];

// =============================================================================
// TOOL HANDLERS
// =============================================================================

async function handleEnrichmentTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const { supabaseUrl, supabaseKey } = ctx;

  switch (name) {
    case 'enrich_contact': {
      const params = args as {
        contact_name?: string;
        contact_email?: string;
        contact_linkedin_url?: string;
        company_name?: string;
      };
      if (!params.contact_name && !params.contact_email && !params.contact_linkedin_url) {
        throw new Error('At least one of contact_name, contact_email, or contact_linkedin_url is required');
      }
      return enrichContact(supabaseUrl, supabaseKey, params);
    }

    case 'enrich_company': {
      const params = args as {
        company_name?: string;
        company_domain?: string;
        company_linkedin_url?: string;
      };
      if (!params.company_name && !params.company_domain && !params.company_linkedin_url) {
        throw new Error('At least one of company_name, company_domain, or company_linkedin_url is required');
      }
      return enrichCompany(supabaseUrl, supabaseKey, params);
    }

    case 'get_full_enrichment': {
      const params = args as {
        contact_name?: string;
        contact_email?: string;
        contact_linkedin_url?: string;
        company_name?: string;
        company_domain?: string;
      };
      if (!params.contact_name && !params.contact_email && !params.contact_linkedin_url &&
          !params.company_name && !params.company_domain) {
        throw new Error('At least one contact or company identifier is required');
      }
      return getFullEnrichment(supabaseUrl, supabaseKey, params);
    }

    default:
      return null;
  }
}

async function handleRelationshipTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const { supabaseUrl, supabaseKey, ownerId } = ctx;

  switch (name) {
    case 'get_contact_opinions': {
      const { contact_entity_id, layer } = args as { contact_entity_id: string; layer: string };
      return getContactOpinions(supabaseUrl, supabaseKey, ownerId, contact_entity_id, layer);
    }

    case 'upsert_opinion': {
      const params = args as {
        contact_entity_id: string;
        gft_contact_id?: string;
        opinion_type: string;
        content: string;
        sentiment?: string;
        confidence?: string;
        evidence?: string[];
        source_context?: string;
        layer: string;
        visibility?: string;
        community_content?: string;
        publish_anonymously?: boolean;
      };
      return upsertOpinion(supabaseUrl, supabaseKey, ownerId, params.layer, {
        contact_entity_id: params.contact_entity_id,
        gft_contact_id: params.gft_contact_id,
        opinion_type: params.opinion_type as any,
        content: params.content,
        sentiment: params.sentiment as any,
        confidence: params.confidence as any,
        evidence: params.evidence,
        source_context: params.source_context,
        visibility: params.visibility as any,
        community_content: params.community_content,
        publish_anonymously: params.publish_anonymously,
      });
    }

    case 'delete_opinion': {
      const { opinion_id, layer } = args as { opinion_id: string; layer: string };
      return deleteOpinion(supabaseUrl, supabaseKey, ownerId, opinion_id, layer);
    }

    case 'search_opinions': {
      const { query, layer, opinion_type, limit } = args as {
        query: string;
        layer: string;
        opinion_type?: string;
        limit?: number;
      };
      return searchOpinions(supabaseUrl, supabaseKey, query, layer, opinion_type as any, limit);
    }

    case 'get_opinion_summary': {
      const { contact_entity_id, layer } = args as { contact_entity_id: string; layer: string };
      return getOpinionSummary(supabaseUrl, supabaseKey, contact_entity_id, layer);
    }

    default:
      return null;
  }
}

async function handleSkillsTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const { supabaseUrl, supabaseKey } = ctx;

  switch (name) {
    case 'list_skills_files': {
      const { layer, source_system, limit } = args as {
        layer?: string;
        source_system?: string;
        limit?: number;
      };
      return listSkillsFiles(supabaseUrl, supabaseKey, layer, source_system, limit);
    }

    case 'get_skills_file': {
      const { file_id } = args as { file_id: string };
      return getSkillsFileDetail(supabaseUrl, supabaseKey, file_id);
    }

    case 'search_skills_by_tool': {
      const { tool_name, layer, limit } = args as {
        tool_name: string;
        layer?: string;
        limit?: number;
      };
      return searchSkillsByTool(supabaseUrl, supabaseKey, tool_name, layer, limit);
    }

    case 'get_entity_skills': {
      const { entity_id } = args as { entity_id: string };
      return getEntitySkills(supabaseUrl, supabaseKey, entity_id);
    }

    case 'list_available_tools': {
      const { layer, limit } = args as { layer?: string; limit?: number };
      return listAvailableTools(supabaseUrl, supabaseKey, layer, limit);
    }

    default:
      return null;
  }
}

// =============================================================================
// TOOL REGISTRY
// =============================================================================

const toolHandlers: ToolHandler[] = [
  handleEnrichmentTools,
  handleRelationshipTools,
  handleSkillsTools,
  handleTranscriptTools,
  handleTeamIntelTools,
];

// =============================================================================
// MAIN SERVER
// =============================================================================

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const OWNER_ID = process.env.DEFAULT_OWNER_ID || DEFAULTS.OWNER_ID;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    process.exit(1);
  }

  // Build shared context
  const ctx = createToolContext({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
    ownerId: OWNER_ID,
  });

  const server = new Server(
    { name: 'renubu-integration', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      for (const handler of toolHandlers) {
        const result = await handler(name, args || {}, ctx);
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

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Renubu Integration MCP Server running on stdio');
  console.error('Permission boundary: GFT data only (contacts, companies, posts)');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
