/**
 * Transcript Ingestion & Search Tools
 *
 * Tools for ingesting call transcripts, extracting metadata,
 * and searching/retrieving transcript content.
 *
 * Architecture:
 * - Metadata stored in human_os.transcripts table
 * - Raw content stored in Supabase Storage: human-os/transcripts/{layer}/{id}.md
 * - Layer-based scoping (founder:justin, renubu:tenant-x, etc.)
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';

/** Schema where transcripts table lives */
const TRANSCRIPTS_SCHEMA = 'human_os';

/** Storage bucket for transcript content */
const STORAGE_BUCKET = 'human-os';

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
// TYPES
// =============================================================================

export interface Participant {
  name: string;
  company?: string;
  role?: string;
  email?: string;
  linkedin_url?: string;
  is_internal?: boolean;
}

export interface ActionItem {
  description: string;
  owner?: string;
  due_date?: string;
  completed?: boolean;
}

export interface NotableQuote {
  speaker: string;
  quote: string;
  context?: string;
}

interface TranscriptRow {
  id: string;
  layer: string;
  storage_path: string;
  title: string;
  call_date: string | null;
  call_type: string | null;
  duration_minutes: number | null;
  source_url: string | null;
  source: string;
  participants: Participant[];
  summary: string | null;
  key_topics: string[];
  action_items: ActionItem[];
  notable_quotes: NotableQuote[];
  relationship_insights: string | null;
  labels: Record<string, string>;
  entity_ids: string[];
  project_id: string | null;
  opportunity_id: string | null;
  context_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface IngestResult {
  id: string;
  title: string;
  call_date: string | null;
  participants_count: number;
  topics_count: number;
  linked_entities: number;
}

export interface ListResult {
  transcripts: Array<{
    id: string;
    title: string;
    call_date: string | null;
    call_type: string | null;
    duration_minutes: number | null;
    participants: Array<{ name: string; company?: string }>;
    key_topics: string[];
    summary_preview: string | null;
    source_url: string | null;
  }>;
  total_count: number;
  has_more: boolean;
}

export interface SearchResult {
  results: Array<{
    id: string;
    title: string;
    call_date: string | null;
    call_type: string | null;
    participants: Array<{ name: string }>;
    relevance_score: number;
    matching_excerpt: string | null;
    key_topics: string[];
  }>;
}

export interface GetResult {
  id: string;
  title: string;
  call_date: string | null;
  call_type: string | null;
  duration_minutes: number | null;
  source_url: string | null;
  participants: Participant[];
  summary: string | null;
  key_topics: string[];
  action_items: ActionItem[];
  notable_quotes: NotableQuote[];
  relationship_insights: string | null;
  raw_content?: string | null;
  context_tags: string[];
  linked_entities: Array<{ id: string; name: string; type: string }>;
  created_at: string;
  updated_at: string;
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
    case 'ingest_transcript': {
      const data = IngestTranscriptSchema.parse(args);
      return ingestTranscript(ctx, data);
    }

    case 'list_transcripts': {
      const params = ListTranscriptsSchema.parse(args);
      return listTranscripts(ctx, params);
    }

    case 'search_transcripts': {
      const params = SearchTranscriptsSchema.parse(args);
      return searchTranscripts(ctx, params);
    }

    case 'get_transcript': {
      const params = GetTranscriptSchema.parse(args);
      return getTranscript(ctx, params);
    }

    default:
      return null;
  }
}

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

/**
 * Ingest a transcript with metadata
 * - Raw content stored in Supabase Storage
 * - Metadata stored in human_os.transcripts table
 * - Auto-links participants to existing entities by name match
 */
async function ingestTranscript(
  ctx: ToolContext,
  data: z.infer<typeof IngestTranscriptSchema>
): Promise<IngestResult> {
  const supabase = ctx.getClient();
  const schema = supabase.schema(TRANSCRIPTS_SCHEMA);

  // Generate ID upfront for storage path
  const transcriptId = crypto.randomUUID();
  const storagePath = `transcripts/${ctx.layer}/${transcriptId}.md`;

  // Start with provided entity_ids
  const entityIds = new Set<string>(data.entity_ids || []);

  // Try to auto-link participants to existing entities
  if (data.participants && data.participants.length > 0) {
    for (const participant of data.participants) {
      // Skip internal team members for auto-linking
      if (participant.is_internal) continue;

      // Try to find matching entity by name
      const { data: matched } = await supabase
        .from('entities')
        .select('id')
        .eq('entity_type', 'person')
        .ilike('name', participant.name)
        .limit(1)
        .single();

      if (matched) {
        entityIds.add(matched.id);
      }
    }
  }

  // Upload raw content to storage
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, data.raw_content, {
      contentType: 'text/markdown',
      upsert: false,
    });

  if (storageError) {
    throw new Error(`Failed to upload transcript content: ${storageError.message}`);
  }

  // Insert metadata to database
  const { data: inserted, error } = await schema
    .from('transcripts')
    .insert({
      id: transcriptId,
      layer: ctx.layer,
      storage_path: storagePath,
      title: data.title,
      call_date: data.call_date || null,
      call_type: data.call_type || null,
      duration_minutes: data.duration_minutes || null,
      source_url: data.source_url || null,
      source: data.source || 'manual',
      participants: data.participants || [],
      summary: data.summary || null,
      key_topics: data.key_topics || [],
      action_items: data.action_items || [],
      notable_quotes: data.notable_quotes || [],
      relationship_insights: data.relationship_insights || null,
      labels: data.labels || {},
      entity_ids: Array.from(entityIds),
      project_id: data.project_id || null,
      opportunity_id: data.opportunity_id || null,
      context_tags: data.context_tags || [],
    })
    .select('id, title, call_date')
    .single();

  if (error) {
    // Try to clean up storage on DB insert failure
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(`Failed to ingest transcript: ${error.message}`);
  }

  const result = inserted as { id: string; title: string; call_date: string | null };

  return {
    id: result.id,
    title: result.title,
    call_date: result.call_date,
    participants_count: data.participants?.length || 0,
    topics_count: data.key_topics?.length || 0,
    linked_entities: entityIds.size,
  };
}

/**
 * List transcripts with optional filters
 * Uses RPC function or direct query based on filters
 */
async function listTranscripts(
  ctx: ToolContext,
  params: z.infer<typeof ListTranscriptsSchema>
): Promise<ListResult> {
  const supabase = ctx.getClient();
  const schema = supabase.schema(TRANSCRIPTS_SCHEMA);

  // Clamp limit to max 50
  const limit = Math.min(params.limit || 20, 50);
  const offset = params.offset || 0;

  // Build query with layer filtering
  let query = schema
    .from('transcripts')
    .select(
      'id, title, call_date, call_type, duration_minutes, participants, key_topics, summary, source_url, labels, project_id',
      { count: 'exact' }
    )
    .or(`layer.eq.public,layer.eq.${ctx.layer}`)
    .order('call_date', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (params.call_type) {
    query = query.eq('call_type', params.call_type);
  }

  if (params.project_id) {
    query = query.eq('project_id', params.project_id);
  }

  if (params.context_tag) {
    query = query.contains('context_tags', [params.context_tag]);
  }

  if (params.after) {
    query = query.gte('call_date', params.after);
  }

  if (params.before) {
    query = query.lte('call_date', params.before);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list transcripts: ${error.message}`);
  }

  // Cast to expected type
  const rows = (data || []) as Array<{
    id: string;
    title: string;
    call_date: string | null;
    call_type: string | null;
    duration_minutes: number | null;
    participants: Participant[];
    key_topics: string[];
    summary: string | null;
    source_url: string | null;
  }>;

  // Filter by person/company in participants (done in JS since JSONB filtering is complex)
  let filtered = rows;

  if (params.person) {
    const personLower = params.person.toLowerCase();
    filtered = filtered.filter((t) => {
      return t.participants.some((p) => p.name.toLowerCase().includes(personLower));
    });
  }

  if (params.company) {
    const companyLower = params.company.toLowerCase();
    filtered = filtered.filter((t) => {
      return t.participants.some((p) => p.company?.toLowerCase().includes(companyLower));
    });
  }

  return {
    transcripts: filtered.map((t) => ({
      id: t.id,
      title: t.title,
      call_date: t.call_date,
      call_type: t.call_type,
      duration_minutes: t.duration_minutes,
      participants: t.participants.map((p) => ({
        name: p.name,
        company: p.company,
      })),
      key_topics: t.key_topics || [],
      summary_preview: t.summary ? t.summary.substring(0, 200) : null,
      source_url: t.source_url,
    })),
    total_count: count || 0,
    has_more: (count || 0) > offset + limit,
  };
}

/**
 * Full-text search across transcript summaries and titles
 * Uses the FTS index on human_os.transcripts or RPC function
 */
async function searchTranscripts(
  ctx: ToolContext,
  params: z.infer<typeof SearchTranscriptsSchema>
): Promise<SearchResult> {
  const supabase = ctx.getClient();
  const schema = supabase.schema(TRANSCRIPTS_SCHEMA);

  const limit = Math.min(params.limit || 10, 50);

  // Use the RPC function for proper FTS ranking
  const { data, error } = await schema.rpc('search_transcripts', {
    p_query: params.query,
    p_layer: ctx.layer,
    p_limit: limit,
  });

  if (error) {
    throw new Error(`Failed to search transcripts: ${error.message}`);
  }

  // Cast to expected type from RPC
  const rows = (data || []) as Array<{
    id: string;
    title: string;
    call_date: string | null;
    call_type: string | null;
    summary: string | null;
    participants: Participant[];
    labels: Record<string, string>;
    rank: number;
  }>;

  return {
    results: rows.map((r) => {
      // Extract matching excerpt from summary
      let excerpt: string | null = null;
      if (r.summary) {
        const queryLower = params.query.toLowerCase();
        const summaryLower = r.summary.toLowerCase();
        const matchIndex = summaryLower.indexOf(queryLower);

        if (matchIndex >= 0) {
          const start = Math.max(0, matchIndex - 50);
          const end = Math.min(r.summary.length, matchIndex + params.query.length + 50);
          excerpt =
            (start > 0 ? '...' : '') +
            r.summary.substring(start, end) +
            (end < r.summary.length ? '...' : '');
        } else {
          // Just show first 150 chars of summary
          excerpt = r.summary.substring(0, 150) + (r.summary.length > 150 ? '...' : '');
        }
      }

      return {
        id: r.id,
        title: r.title,
        call_date: r.call_date,
        call_type: r.call_type,
        participants: r.participants.map((p) => ({ name: p.name })),
        relevance_score: r.rank,
        matching_excerpt: excerpt,
        key_topics: [], // Not returned by RPC, could add if needed
      };
    }),
  };
}

/**
 * Get full transcript by ID
 * Fetches metadata from DB and optionally raw content from storage
 */
async function getTranscript(
  ctx: ToolContext,
  params: z.infer<typeof GetTranscriptSchema>
): Promise<GetResult> {
  const supabase = ctx.getClient();
  const schema = supabase.schema(TRANSCRIPTS_SCHEMA);

  // Fetch metadata from database
  const { data, error } = await schema
    .from('transcripts')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error(`Transcript not found: ${params.id}`);
    }
    throw new Error(`Failed to get transcript: ${error.message}`);
  }

  // Cast to expected type
  const row = data as TranscriptRow;

  // Fetch raw content from storage if requested
  let rawContent: string | null = null;
  if (params.include_raw && row.storage_path) {
    const { data: storageData, error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(row.storage_path);

    if (!storageError && storageData) {
      rawContent = await storageData.text();
    }
  }

  // Resolve linked entities
  let linkedEntities: Array<{ id: string; name: string; type: string }> = [];

  if (row.entity_ids && row.entity_ids.length > 0) {
    const { data: entities, error: entityError } = await supabase
      .from('entities')
      .select('id, name, entity_type')
      .in('id', row.entity_ids);

    if (!entityError && entities) {
      linkedEntities = (entities as Array<{ id: string; name: string; entity_type: string }>).map(
        (e) => ({
          id: e.id,
          name: e.name,
          type: e.entity_type,
        })
      );
    }
  }

  return {
    id: row.id,
    title: row.title,
    call_date: row.call_date,
    call_type: row.call_type,
    duration_minutes: row.duration_minutes,
    source_url: row.source_url,
    participants: row.participants || [],
    summary: row.summary,
    key_topics: row.key_topics || [],
    action_items: row.action_items || [],
    notable_quotes: row.notable_quotes || [],
    relationship_insights: row.relationship_insights,
    raw_content: rawContent,
    context_tags: row.context_tags || [],
    linked_entities: linkedEntities,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
