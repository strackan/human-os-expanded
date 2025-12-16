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
 *
 * ❌ CANNOT access:
 *    - founder_os.* (personal tasks, goals, check-ins)
 *    - powerpak.* (expert configurations)
 *    - founder:* layer files (personal context)
 *    - Private identity information
 *
 * This boundary is enforced at the code level - the server only has
 * tools that query the permitted schemas.
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
  type OpinionType,
} from './tools/relationship.js';
import {
  listSkillsFiles,
  getSkillsFileDetail,
  searchSkillsByTool,
  getEntitySkills,
  listAvailableTools,
} from './tools/skills.js';

/**
 * Enrichment tool definitions
 */
const enrichmentTools: Tool[] = [
  {
    name: 'enrich_contact',
    description: 'Get public/external intelligence about a contact from GFT CRM data. Returns LinkedIn profile info, recent posts, and activity signals. Use for enriching Renubu contact records with external data.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_name: {
          type: 'string',
          description: 'Name of the contact to look up',
        },
        contact_email: {
          type: 'string',
          description: 'Email address (more precise matching)',
        },
        contact_linkedin_url: {
          type: 'string',
          description: 'LinkedIn profile URL (most precise matching)',
        },
        company_name: {
          type: 'string',
          description: 'Company name to help disambiguate common names',
        },
      },
      required: [],
    },
  },
  {
    name: 'enrich_company',
    description: 'Get public/external intelligence about a company from GFT CRM data. Returns company info, industry, size, and known contacts at the company.',
    inputSchema: {
      type: 'object',
      properties: {
        company_name: {
          type: 'string',
          description: 'Name of the company to look up',
        },
        company_domain: {
          type: 'string',
          description: 'Company website domain (e.g., "acme.com")',
        },
        company_linkedin_url: {
          type: 'string',
          description: 'LinkedIn company page URL',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_full_enrichment',
    description: 'Get complete external enrichment for a contact and their company, including triangulation hints for CS workflows. Use this for renewal/expansion prep.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_name: {
          type: 'string',
          description: 'Name of the contact',
        },
        contact_email: {
          type: 'string',
          description: 'Contact email address',
        },
        contact_linkedin_url: {
          type: 'string',
          description: 'Contact LinkedIn URL',
        },
        company_name: {
          type: 'string',
          description: 'Company name',
        },
        company_domain: {
          type: 'string',
          description: 'Company website domain',
        },
      },
      required: [],
    },
  },
];

/**
 * Relationship context tool definitions
 */
const relationshipTools: Tool[] = [
  {
    name: 'get_contact_opinions',
    description: 'Get all opinions/notes about a contact. Returns subjective assessments like work style, communication preferences, trust level, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_entity_id: {
          type: 'string',
          description: 'UUID of the contact entity',
        },
        layer: {
          type: 'string',
          description: 'Privacy layer (e.g., "renubu:tenant-acme")',
        },
      },
      required: ['contact_entity_id', 'layer'],
    },
  },
  {
    name: 'upsert_opinion',
    description: 'Create or update an opinion about a contact. Use to store subjective assessments from user feedback or agent analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_entity_id: {
          type: 'string',
          description: 'UUID of the contact entity',
        },
        gft_contact_id: {
          type: 'string',
          description: 'Optional: UUID of the GFT contact (for direct linking)',
        },
        opinion_type: {
          type: 'string',
          enum: ['general', 'work_style', 'communication', 'trust', 'negotiation', 'decision_making', 'responsiveness', 'relationship_history'],
          description: 'Category of opinion',
        },
        content: {
          type: 'string',
          description: 'The opinion/note content',
        },
        sentiment: {
          type: 'string',
          enum: ['positive', 'neutral', 'negative', 'mixed'],
          description: 'Overall sentiment of this opinion',
        },
        confidence: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Confidence level in this opinion',
        },
        evidence: {
          type: 'array',
          items: { type: 'string' },
          description: 'Supporting observations',
        },
        source_context: {
          type: 'string',
          description: 'Where this opinion came from (e.g., "coffee check-in 2024-01-15")',
        },
        layer: {
          type: 'string',
          description: 'Privacy layer (e.g., "renubu:tenant-acme")',
        },
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
        opinion_id: {
          type: 'string',
          description: 'UUID of the opinion to delete',
        },
        layer: {
          type: 'string',
          description: 'Privacy layer',
        },
      },
      required: ['opinion_id', 'layer'],
    },
  },
  {
    name: 'search_opinions',
    description: 'Search opinions by keyword. Useful for finding all mentions of a topic across contacts.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        layer: {
          type: 'string',
          description: 'Privacy layer',
        },
        opinion_type: {
          type: 'string',
          enum: ['general', 'work_style', 'communication', 'trust', 'negotiation', 'decision_making', 'responsiveness', 'relationship_history'],
          description: 'Filter by opinion type',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 20)',
        },
      },
      required: ['query', 'layer'],
    },
  },
  {
    name: 'get_opinion_summary',
    description: 'Get a quick summary of opinions about a contact. Useful for context before a call.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_entity_id: {
          type: 'string',
          description: 'UUID of the contact entity',
        },
        layer: {
          type: 'string',
          description: 'Privacy layer',
        },
      },
      required: ['contact_entity_id', 'layer'],
    },
  },
];

/**
 * Skills file tool definitions
 */
const skillsTools: Tool[] = [
  {
    name: 'list_skills_files',
    description: 'List skills files by layer and source system. Skills files define tools and programs in Anthropic\'s preferred format.',
    inputSchema: {
      type: 'object',
      properties: {
        layer: {
          type: 'string',
          description: 'Privacy layer to filter by (e.g., "public", "renubu:tenant-acme")',
        },
        source_system: {
          type: 'string',
          description: 'Source system filter (e.g., "renubu", "gft")',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 100)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_skills_file',
    description: 'Get detailed skills file with all tools and programs defined.',
    inputSchema: {
      type: 'object',
      properties: {
        file_id: {
          type: 'string',
          description: 'UUID of the skills file',
        },
      },
      required: ['file_id'],
    },
  },
  {
    name: 'search_skills_by_tool',
    description: 'Search skills files by tool name. Find which skills files define a particular tool.',
    inputSchema: {
      type: 'object',
      properties: {
        tool_name: {
          type: 'string',
          description: 'Tool name to search for (partial match)',
        },
        layer: {
          type: 'string',
          description: 'Privacy layer to filter by',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 20)',
        },
      },
      required: ['tool_name'],
    },
  },
  {
    name: 'get_entity_skills',
    description: 'Get skills files linked to an entity (person/expert). Useful for finding what tools/programs a person has.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_id: {
          type: 'string',
          description: 'UUID of the entity',
        },
      },
      required: ['entity_id'],
    },
  },
  {
    name: 'list_available_tools',
    description: 'List all available tools across accessible skills files. Good for discovery.',
    inputSchema: {
      type: 'object',
      properties: {
        layer: {
          type: 'string',
          description: 'Privacy layer to filter by',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 50)',
        },
      },
      required: [],
    },
  },
];

/**
 * All tools combined
 */
const tools: Tool[] = [...enrichmentTools, ...relationshipTools, ...skillsTools];

/**
 * Validation schemas
 */
const EnrichContactSchema = z.object({
  contact_name: z.string().optional(),
  contact_email: z.string().optional(),
  contact_linkedin_url: z.string().optional(),
  company_name: z.string().optional(),
});

const EnrichCompanySchema = z.object({
  company_name: z.string().optional(),
  company_domain: z.string().optional(),
  company_linkedin_url: z.string().optional(),
});

const FullEnrichmentSchema = z.object({
  contact_name: z.string().optional(),
  contact_email: z.string().optional(),
  contact_linkedin_url: z.string().optional(),
  company_name: z.string().optional(),
  company_domain: z.string().optional(),
});

const GetContactOpinionsSchema = z.object({
  contact_entity_id: z.string(),
  layer: z.string(),
});

const UpsertOpinionSchema = z.object({
  contact_entity_id: z.string(),
  gft_contact_id: z.string().optional(),
  opinion_type: z.enum(['general', 'work_style', 'communication', 'trust', 'negotiation', 'decision_making', 'responsiveness', 'relationship_history']),
  content: z.string(),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'mixed']).optional(),
  confidence: z.enum(['low', 'medium', 'high']).optional(),
  evidence: z.array(z.string()).optional(),
  source_context: z.string().optional(),
  layer: z.string(),
});

const DeleteOpinionSchema = z.object({
  opinion_id: z.string(),
  layer: z.string(),
});

const SearchOpinionsSchema = z.object({
  query: z.string(),
  layer: z.string(),
  opinion_type: z.enum(['general', 'work_style', 'communication', 'trust', 'negotiation', 'decision_making', 'responsiveness', 'relationship_history']).optional(),
  limit: z.number().optional(),
});

const GetOpinionSummarySchema = z.object({
  contact_entity_id: z.string(),
  layer: z.string(),
});

// Skills validation schemas
const ListSkillsFilesSchema = z.object({
  layer: z.string().optional(),
  source_system: z.string().optional(),
  limit: z.number().optional(),
});

const GetSkillsFileSchema = z.object({
  file_id: z.string(),
});

const SearchSkillsByToolSchema = z.object({
  tool_name: z.string(),
  layer: z.string().optional(),
  limit: z.number().optional(),
});

const GetEntitySkillsSchema = z.object({
  entity_id: z.string(),
});

const ListAvailableToolsSchema = z.object({
  layer: z.string().optional(),
  limit: z.number().optional(),
});

/**
 * Main server function
 */
async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    process.exit(1);
  }

  const server = new Server(
    { name: 'renubu-integration', version: '0.1.0' },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      switch (name) {
        case 'enrich_contact': {
          const params = EnrichContactSchema.parse(args);

          // Validate at least one search param provided
          if (!params.contact_name && !params.contact_email && !params.contact_linkedin_url) {
            throw new Error('At least one of contact_name, contact_email, or contact_linkedin_url is required');
          }

          result = await enrichContact(SUPABASE_URL, SUPABASE_SERVICE_KEY, params);
          break;
        }

        case 'enrich_company': {
          const params = EnrichCompanySchema.parse(args);

          if (!params.company_name && !params.company_domain && !params.company_linkedin_url) {
            throw new Error('At least one of company_name, company_domain, or company_linkedin_url is required');
          }

          result = await enrichCompany(SUPABASE_URL, SUPABASE_SERVICE_KEY, params);
          break;
        }

        case 'get_full_enrichment': {
          const params = FullEnrichmentSchema.parse(args);

          if (!params.contact_name && !params.contact_email && !params.contact_linkedin_url &&
              !params.company_name && !params.company_domain) {
            throw new Error('At least one contact or company identifier is required');
          }

          result = await getFullEnrichment(SUPABASE_URL, SUPABASE_SERVICE_KEY, params);
          break;
        }

        // Relationship context tools
        case 'get_contact_opinions': {
          const params = GetContactOpinionsSchema.parse(args);
          // TODO: Get owner_id from auth context - for now use a placeholder
          const ownerId = process.env.DEFAULT_OWNER_ID || '00000000-0000-0000-0000-000000000000';
          result = await getContactOpinions(
            SUPABASE_URL,
            SUPABASE_SERVICE_KEY,
            ownerId,
            params.contact_entity_id,
            params.layer
          );
          break;
        }

        case 'upsert_opinion': {
          const params = UpsertOpinionSchema.parse(args);
          const ownerId = process.env.DEFAULT_OWNER_ID || '00000000-0000-0000-0000-000000000000';
          result = await upsertOpinion(
            SUPABASE_URL,
            SUPABASE_SERVICE_KEY,
            ownerId,
            params.layer,
            {
              contact_entity_id: params.contact_entity_id,
              gft_contact_id: params.gft_contact_id,
              opinion_type: params.opinion_type,
              content: params.content,
              sentiment: params.sentiment,
              confidence: params.confidence,
              evidence: params.evidence,
              source_context: params.source_context,
            }
          );
          break;
        }

        case 'delete_opinion': {
          const params = DeleteOpinionSchema.parse(args);
          const ownerId = process.env.DEFAULT_OWNER_ID || '00000000-0000-0000-0000-000000000000';
          result = await deleteOpinion(
            SUPABASE_URL,
            SUPABASE_SERVICE_KEY,
            ownerId,
            params.opinion_id,
            params.layer
          );
          break;
        }

        case 'search_opinions': {
          const params = SearchOpinionsSchema.parse(args);
          result = await searchOpinions(
            SUPABASE_URL,
            SUPABASE_SERVICE_KEY,
            params.query,
            params.layer,
            params.opinion_type,
            params.limit
          );
          break;
        }

        case 'get_opinion_summary': {
          const params = GetOpinionSummarySchema.parse(args);
          result = await getOpinionSummary(
            SUPABASE_URL,
            SUPABASE_SERVICE_KEY,
            params.contact_entity_id,
            params.layer
          );
          break;
        }

        // Skills file tools
        case 'list_skills_files': {
          const params = ListSkillsFilesSchema.parse(args);
          result = await listSkillsFiles(
            SUPABASE_URL,
            SUPABASE_SERVICE_KEY,
            params.layer,
            params.source_system,
            params.limit
          );
          break;
        }

        case 'get_skills_file': {
          const params = GetSkillsFileSchema.parse(args);
          result = await getSkillsFileDetail(
            SUPABASE_URL,
            SUPABASE_SERVICE_KEY,
            params.file_id
          );
          break;
        }

        case 'search_skills_by_tool': {
          const params = SearchSkillsByToolSchema.parse(args);
          result = await searchSkillsByTool(
            SUPABASE_URL,
            SUPABASE_SERVICE_KEY,
            params.tool_name,
            params.layer,
            params.limit
          );
          break;
        }

        case 'get_entity_skills': {
          const params = GetEntitySkillsSchema.parse(args);
          result = await getEntitySkills(
            SUPABASE_URL,
            SUPABASE_SERVICE_KEY,
            params.entity_id
          );
          break;
        }

        case 'list_available_tools': {
          const params = ListAvailableToolsSchema.parse(args);
          result = await listAvailableTools(
            SUPABASE_URL,
            SUPABASE_SERVICE_KEY,
            params.layer,
            params.limit
          );
          break;
        }

        default:
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

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Renubu Integration MCP Server running on stdio');
  console.error('Permission boundary: GFT data only (contacts, companies, posts)');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
