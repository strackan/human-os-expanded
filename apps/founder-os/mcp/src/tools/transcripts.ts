/**
 * Transcript Ingestion & Search Tools
 *
 * Tools for ingesting call transcripts, extracting metadata,
 * and searching/retrieving transcript content.
 *
 * Uses shared TranscriptService from @human-os/services.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { TranscriptService } from '@human-os/services';
import { z } from 'zod';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const transcriptTools: Tool[] = [
  {
    name: 'ingest_transcript',
    description:
      'Store a call transcript with extracted metadata. Raw content goes to storage, metadata to DB for search.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Descriptive title for the transcript (e.g., "Jonathan Ward - Data Enhancement Discovery")',
        },
        raw_content: {
          type: 'string',
          description: 'Full transcript text (will be stored in Supabase Storage)',
        },
        call_date: {
          type: 'string',
          description: 'Date of call in YYYY-MM-DD format',
        },
        call_type: {
          type: 'string',
          enum: ['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'sales', 'support', 'other'],
          description: 'Type of call',
        },
        duration_minutes: {
          type: 'number',
          description: 'Length of call in minutes',
        },
        source_url: {
          type: 'string',
          description: 'Link to recording (Fathom, Zoom, etc.)',
        },
        source: {
          type: 'string',
          enum: ['manual', 'zoom', 'fathom', 'gong', 'fireflies'],
          description: 'Source of the transcript (default: manual)',
        },
        participants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              company: { type: 'string' },
              role: { type: 'string' },
              email: { type: 'string' },
              linkedin_url: { type: 'string' },
              is_internal: { type: 'boolean' },
            },
            required: ['name'],
          },
          description: 'People on the call',
        },
        summary: {
          type: 'string',
          description: 'Executive summary of the call (2-3 paragraphs)',
        },
        key_topics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Main topics discussed',
        },
        action_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              owner: { type: 'string' },
              due_date: { type: 'string' },
              completed: { type: 'boolean' },
            },
            required: ['description'],
          },
          description: 'Action items from the call',
        },
        notable_quotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              speaker: { type: 'string' },
              quote: { type: 'string' },
              context: { type: 'string' },
            },
            required: ['speaker', 'quote'],
          },
          description: 'Notable quotes worth remembering',
        },
        relationship_insights: {
          type: 'string',
          description: 'Notes about the person/relationship dynamic',
        },
        labels: {
          type: 'object',
          description: 'Flexible labels for search (e.g., {industry: "saas", stage: "discovery"})',
        },
        entity_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'UUIDs of linked entities (people, companies)',
        },
        project_id: {
          type: 'string',
          description: 'Optional link to founder_os.projects',
        },
        opportunity_id: {
          type: 'string',
          description: 'Optional link to gft.opportunities for sales calls',
        },
        context_tags: {
          type: 'array',
          items: { type: 'string' },
          description: "Context tags like 'renubu', 'powerpak', 'good-hang'",
        },
      },
      required: ['title', 'raw_content'],
    },
  },
  {
    name: 'list_transcripts',
    description:
      'Browse stored transcripts with optional filters by type, person, company, date, project, or labels.',
    inputSchema: {
      type: 'object',
      properties: {
        call_type: {
          type: 'string',
          enum: ['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'sales', 'support', 'other'],
          description: 'Filter by call type',
        },
        person: {
          type: 'string',
          description: 'Search participant names (fuzzy match)',
        },
        company: {
          type: 'string',
          description: 'Search participant companies (fuzzy match)',
        },
        project_id: {
          type: 'string',
          description: 'Filter by linked project UUID',
        },
        context_tag: {
          type: 'string',
          description: 'Filter by context tag',
        },
        after: {
          type: 'string',
          description: 'Transcripts after this date (YYYY-MM-DD)',
        },
        before: {
          type: 'string',
          description: 'Transcripts before this date (YYYY-MM-DD)',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 20, max 50)',
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination',
        },
      },
    },
  },
  {
    name: 'search_transcripts',
    description:
      'Full-text search across transcript summaries and titles. Use to find specific conversations or topics discussed.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search terms',
        },
        call_type: {
          type: 'string',
          enum: ['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'sales', 'support', 'other'],
          description: 'Optional type filter',
        },
        context_tag: {
          type: 'string',
          description: 'Optional tag filter',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_transcript',
    description: 'Get full transcript content by ID for deep analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Transcript UUID',
        },
        include_raw: {
          type: 'boolean',
          description: 'Include full raw content (default true)',
        },
      },
      required: ['id'],
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ParticipantSchema = z.object({
  name: z.string(),
  company: z.string().optional(),
  role: z.string().optional(),
  email: z.string().optional(),
  linkedin_url: z.string().optional(),
  is_internal: z.boolean().optional(),
});

const ActionItemSchema = z.object({
  description: z.string(),
  owner: z.string().optional(),
  due_date: z.string().optional(),
  completed: z.boolean().optional().default(false),
});

const NotableQuoteSchema = z.object({
  speaker: z.string(),
  quote: z.string(),
  context: z.string().optional(),
});

const IngestTranscriptSchema = z.object({
  title: z.string(),
  raw_content: z.string(),
  call_date: z.string().optional(),
  call_type: z
    .enum(['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'sales', 'support', 'other'])
    .optional(),
  duration_minutes: z.number().optional(),
  source_url: z.string().optional(),
  source: z.enum(['manual', 'zoom', 'fathom', 'gong', 'fireflies']).optional().default('manual'),
  participants: z.array(ParticipantSchema).optional(),
  summary: z.string().optional(),
  key_topics: z.array(z.string()).optional(),
  action_items: z.array(ActionItemSchema).optional(),
  notable_quotes: z.array(NotableQuoteSchema).optional(),
  relationship_insights: z.string().optional(),
  labels: z.record(z.string()).optional(),
  entity_ids: z.array(z.string()).optional(),
  project_id: z.string().optional(),
  opportunity_id: z.string().optional(),
  context_tags: z.array(z.string()).optional(),
});

const ListTranscriptsSchema = z.object({
  call_type: z
    .enum(['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'sales', 'support', 'other'])
    .optional(),
  person: z.string().optional(),
  company: z.string().optional(),
  project_id: z.string().optional(),
  context_tag: z.string().optional(),
  after: z.string().optional(),
  before: z.string().optional(),
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
});

const SearchTranscriptsSchema = z.object({
  query: z.string(),
  call_type: z
    .enum(['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'sales', 'support', 'other'])
    .optional(),
  context_tag: z.string().optional(),
  limit: z.number().optional().default(10),
});

const GetTranscriptSchema = z.object({
  id: z.string(),
  include_raw: z.boolean().optional().default(true),
});

// =============================================================================
// HELPER: CREATE SERVICE FROM MCP CONTEXT
// =============================================================================

function createService(ctx: ToolContext): TranscriptService {
  return new TranscriptService(ctx.getClient(), ctx.layer, ctx.userUUID);
}

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle transcript tool calls
 * Returns result if handled, null if not a transcript tool
 */
export async function handleTranscriptTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const service = createService(ctx);

  switch (name) {
    case 'ingest_transcript': {
      const data = IngestTranscriptSchema.parse(args);
      const result = await service.ingest(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    }

    case 'list_transcripts': {
      const params = ListTranscriptsSchema.parse(args);
      const result = await service.list(params);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    }

    case 'search_transcripts': {
      const params = SearchTranscriptsSchema.parse(args);
      const result = await service.search(params);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    }

    case 'get_transcript': {
      const params = GetTranscriptSchema.parse(args);
      const result = await service.get(params.id, params.include_raw);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    }

    default:
      return null;
  }
}
