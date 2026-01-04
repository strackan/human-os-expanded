/**
 * Renubu Transcript Tools - Multi-Tenant
 *
 * Tools for ingesting call transcripts with hybrid storage.
 * Uses shared TranscriptService from @human-os/services.
 *
 * Layer format: renubu:tenant-{tenant_id}
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import type { Layer } from '@human-os/core';
import { TranscriptService } from '@human-os/services';
import { z } from 'zod';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const transcriptTools: Tool[] = [
  {
    name: 'ingest_org_transcript',
    description:
      'Store a call transcript with metadata for the organization. Saves full content to context files and metadata to database for search.',
    inputSchema: {
      type: 'object',
      properties: {
        tenant_id: {
          type: 'string',
          description: 'Tenant/organization UUID (required)',
        },
        title: {
          type: 'string',
          description: 'Descriptive title for the transcript',
        },
        raw_content: {
          type: 'string',
          description: 'Full transcript text',
        },
        call_date: {
          type: 'string',
          description: 'Date of call in YYYY-MM-DD format',
        },
        call_type: {
          type: 'string',
          enum: ['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'other'],
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
          enum: ['manual', 'zoom', 'fathom', 'gong'],
          description: 'Source of transcript (default: manual)',
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
          description: 'Executive summary of the call',
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
              status: { type: 'string', enum: ['pending', 'done'] },
            },
            required: ['description'],
          },
        },
        notable_quotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              speaker: { type: 'string' },
              quote: { type: 'string' },
              context: { type: 'string' },
              timestamp: { type: 'string' },
            },
            required: ['speaker', 'quote'],
          },
        },
        relationship_insights: {
          type: 'string',
          description: 'Notes about the relationship dynamic',
        },
        entity_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'UUIDs of linked customers/contacts',
        },
        context_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Context tags for filtering',
        },
      },
      required: ['tenant_id', 'title', 'raw_content'],
    },
  },
  {
    name: 'list_org_transcripts',
    description: "Browse the organization's stored transcripts with optional filters.",
    inputSchema: {
      type: 'object',
      properties: {
        tenant_id: {
          type: 'string',
          description: 'Tenant/organization UUID (required)',
        },
        call_type: {
          type: 'string',
          enum: ['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'other'],
        },
        person: {
          type: 'string',
          description: 'Search participant names',
        },
        company: {
          type: 'string',
          description: 'Search participant companies',
        },
        context_tag: {
          type: 'string',
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
        },
      },
      required: ['tenant_id'],
    },
  },
  {
    name: 'search_org_transcripts',
    description: 'Full-text search across organization transcript content.',
    inputSchema: {
      type: 'object',
      properties: {
        tenant_id: {
          type: 'string',
          description: 'Tenant/organization UUID (required)',
        },
        query: {
          type: 'string',
          description: 'Search terms',
        },
        call_type: {
          type: 'string',
          enum: ['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'other'],
        },
        context_tag: {
          type: 'string',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 10)',
        },
      },
      required: ['tenant_id', 'query'],
    },
  },
  {
    name: 'get_org_transcript',
    description: 'Get full transcript content by ID for deep analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        tenant_id: {
          type: 'string',
          description: 'Tenant/organization UUID (required)',
        },
        id: {
          type: 'string',
          description: 'Transcript UUID',
        },
        include_raw: {
          type: 'boolean',
          description: 'Include full raw content (default true)',
        },
      },
      required: ['tenant_id', 'id'],
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
  status: z.enum(['pending', 'done']).optional().default('pending'),
});

const NotableQuoteSchema = z.object({
  speaker: z.string(),
  quote: z.string(),
  context: z.string().optional(),
  timestamp: z.string().optional(),
});

const IngestSchema = z.object({
  tenant_id: z.string().uuid(),
  title: z.string(),
  raw_content: z.string(),
  call_date: z.string().optional(),
  call_type: z
    .enum(['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'other'])
    .optional(),
  duration_minutes: z.number().optional(),
  source_url: z.string().optional(),
  source: z.enum(['manual', 'zoom', 'fathom', 'gong']).optional().default('manual'),
  participants: z.array(ParticipantSchema).optional(),
  summary: z.string().optional(),
  key_topics: z.array(z.string()).optional(),
  action_items: z.array(ActionItemSchema).optional(),
  notable_quotes: z.array(NotableQuoteSchema).optional(),
  relationship_insights: z.string().optional(),
  entity_ids: z.array(z.string()).optional(),
  context_tags: z.array(z.string()).optional(),
});

const ListSchema = z.object({
  tenant_id: z.string().uuid(),
  call_type: z
    .enum(['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'other'])
    .optional(),
  person: z.string().optional(),
  company: z.string().optional(),
  context_tag: z.string().optional(),
  after: z.string().optional(),
  before: z.string().optional(),
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
});

const SearchSchema = z.object({
  tenant_id: z.string().uuid(),
  query: z.string(),
  call_type: z
    .enum(['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'other'])
    .optional(),
  context_tag: z.string().optional(),
  limit: z.number().optional().default(10),
});

const GetSchema = z.object({
  tenant_id: z.string().uuid(),
  id: z.string().uuid(),
  include_raw: z.boolean().optional().default(true),
});

// =============================================================================
// HELPER: CREATE SERVICE FOR TENANT
// =============================================================================

function createServiceForTenant(ctx: ToolContext, tenantId: string): TranscriptService {
  const layer: Layer = `renubu:tenant-${tenantId}`;
  return new TranscriptService(ctx.getClient(), layer, ctx.ownerId);
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
  switch (name) {
    case 'ingest_org_transcript': {
      const data = IngestSchema.parse(args);
      const service = createServiceForTenant(ctx, data.tenant_id);
      const result = await service.ingest({
        title: data.title,
        raw_content: data.raw_content,
        call_date: data.call_date,
        call_type: data.call_type,
        duration_minutes: data.duration_minutes,
        source_url: data.source_url,
        source: data.source,
        participants: data.participants,
        summary: data.summary,
        key_topics: data.key_topics,
        action_items: data.action_items?.map((a) => ({
          ...a,
          completed: a.status === 'done',
        })),
        notable_quotes: data.notable_quotes,
        relationship_insights: data.relationship_insights,
        entity_ids: data.entity_ids,
        context_tags: data.context_tags,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    }

    case 'list_org_transcripts': {
      const params = ListSchema.parse(args);
      const service = createServiceForTenant(ctx, params.tenant_id);
      const result = await service.list({
        call_type: params.call_type,
        person: params.person,
        company: params.company,
        context_tag: params.context_tag,
        after: params.after,
        before: params.before,
        limit: params.limit,
        offset: params.offset,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    }

    case 'search_org_transcripts': {
      const params = SearchSchema.parse(args);
      const service = createServiceForTenant(ctx, params.tenant_id);
      const result = await service.search({
        query: params.query,
        call_type: params.call_type,
        context_tag: params.context_tag,
        limit: params.limit,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    }

    case 'get_org_transcript': {
      const params = GetSchema.parse(args);
      const service = createServiceForTenant(ctx, params.tenant_id);
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
