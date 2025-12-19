/**
 * Renubu Transcript Tools - Multi-Tenant
 *
 * Tools for ingesting call transcripts with hybrid storage:
 * - Metadata in renubu.transcripts table
 * - Full content in context_files at layer renubu:tenant-{tenant_id}
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import type { Layer } from '@human-os/core';
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
// TYPES
// =============================================================================

interface Participant {
  name: string;
  company?: string;
  role?: string;
  email?: string;
  linkedin_url?: string;
  is_internal?: boolean;
}

interface ActionItem {
  description: string;
  owner?: string;
  due_date?: string;
  status?: 'pending' | 'done';
}

interface NotableQuote {
  speaker: string;
  quote: string;
  context?: string;
  timestamp?: string;
}

interface TranscriptRow {
  id: string;
  tenant_id: string;
  uploaded_by: string | null;
  title: string;
  slug: string;
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
  context_file_id: string | null;
  entity_ids: string[];
  context_tags: string[];
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
    case 'ingest_org_transcript': {
      const data = IngestSchema.parse(args);
      return ingestOrgTranscript(ctx, data);
    }

    case 'list_org_transcripts': {
      const params = ListSchema.parse(args);
      return listOrgTranscripts(ctx, params);
    }

    case 'search_org_transcripts': {
      const params = SearchSchema.parse(args);
      return searchOrgTranscripts(ctx, params);
    }

    case 'get_org_transcript': {
      const params = GetSchema.parse(args);
      return getOrgTranscript(ctx, params);
    }

    default:
      return null;
  }
}

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

/**
 * Generate URL-safe slug from title
 */
function slugify(title: string, date?: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);

  const suffix = date || new Date().toISOString().split('T')[0];
  return `${base}-${suffix}`;
}

/**
 * Generate markdown content for context file
 */
function generateTranscriptMarkdown(
  data: z.infer<typeof IngestSchema>,
  slug: string
): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`title: "${data.title.replace(/"/g, '\\"')}"`);
  lines.push('type: transcript');
  if (data.call_date) lines.push(`call_date: ${data.call_date}`);
  if (data.call_type) lines.push(`call_type: ${data.call_type}`);
  if (data.duration_minutes) lines.push(`duration_minutes: ${data.duration_minutes}`);
  if (data.source) lines.push(`source: ${data.source}`);
  if (data.source_url) lines.push(`source_url: ${data.source_url}`);
  if (data.key_topics?.length) lines.push(`topics: [${data.key_topics.join(', ')}]`);
  if (data.context_tags?.length) lines.push(`tags: [${data.context_tags.join(', ')}]`);
  lines.push('---');
  lines.push('');

  // Title
  lines.push(`# ${data.title}`);
  lines.push('');

  // Participants
  if (data.participants?.length) {
    lines.push('## Participants');
    lines.push('');
    for (const p of data.participants) {
      const parts = [p.name];
      if (p.role) parts.push(`(${p.role})`);
      if (p.company) parts.push(`@ ${p.company}`);
      if (p.is_internal) parts.push('[Internal]');
      lines.push(`- ${parts.join(' ')}`);
    }
    lines.push('');
  }

  // Summary
  if (data.summary) {
    lines.push('## Summary');
    lines.push('');
    lines.push(data.summary);
    lines.push('');
  }

  // Action Items
  if (data.action_items?.length) {
    lines.push('## Action Items');
    lines.push('');
    for (const item of data.action_items) {
      const checkbox = item.status === 'done' ? '[x]' : '[ ]';
      const owner = item.owner ? ` (@${item.owner})` : '';
      const due = item.due_date ? ` - Due: ${item.due_date}` : '';
      lines.push(`- ${checkbox} ${item.description}${owner}${due}`);
    }
    lines.push('');
  }

  // Notable Quotes
  if (data.notable_quotes?.length) {
    lines.push('## Notable Quotes');
    lines.push('');
    for (const q of data.notable_quotes) {
      lines.push(`> "${q.quote}"`);
      lines.push(`> — ${q.speaker}${q.context ? ` (${q.context})` : ''}`);
      lines.push('');
    }
  }

  // Relationship Insights
  if (data.relationship_insights) {
    lines.push('## Relationship Insights');
    lines.push('');
    lines.push(data.relationship_insights);
    lines.push('');
  }

  // Full Transcript
  lines.push('## Full Transcript');
  lines.push('');
  lines.push(data.raw_content);

  return lines.join('\n');
}

/**
 * Ingest a transcript with hybrid storage
 */
async function ingestOrgTranscript(
  ctx: ToolContext,
  data: z.infer<typeof IngestSchema>
): Promise<{
  id: string;
  title: string;
  slug: string;
  call_date: string | null;
  participants_count: number;
  topics_count: number;
  context_file_id: string | null;
}> {
  const supabase = ctx.getClient();
  const contextEngine = ctx.getContextEngine();

  // Generate slug
  const slug = slugify(data.title, data.call_date);

  // Build layer for this tenant
  const layer: Layer = `renubu:tenant-${data.tenant_id}`;

  // Generate markdown content
  const markdownContent = generateTranscriptMarkdown(data, slug);

  // Save to context_files via ContextEngine
  let contextFileId: string | null = null;
  try {
    const savedFile = await contextEngine.saveContext(layer, 'transcripts', slug, markdownContent);
    contextFileId = savedFile.id;
  } catch (err) {
    console.error('Failed to save context file:', err);
    // Continue without context file - metadata will still be saved
  }

  // Auto-link participants to existing entities
  const entityIds = new Set<string>(data.entity_ids || []);
  if (data.participants?.length) {
    for (const participant of data.participants) {
      if (participant.is_internal) continue;

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

  // Insert metadata into renubu.transcripts
  const { data: inserted, error } = await supabase
    .from('renubu.transcripts')
    .insert({
      tenant_id: data.tenant_id,
      uploaded_by: ctx.ownerId || null,
      title: data.title,
      slug,
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
      context_file_id: contextFileId,
      entity_ids: Array.from(entityIds),
      context_tags: data.context_tags || [],
    })
    .select('id, title, slug, call_date, context_file_id')
    .single();

  if (error) {
    throw new Error(`Failed to ingest transcript: ${error.message}`);
  }

  const result = inserted as {
    id: string;
    title: string;
    slug: string;
    call_date: string | null;
    context_file_id: string | null;
  };

  return {
    id: result.id,
    title: result.title,
    slug: result.slug,
    call_date: result.call_date,
    participants_count: data.participants?.length || 0,
    topics_count: data.key_topics?.length || 0,
    context_file_id: result.context_file_id,
  };
}

/**
 * List transcripts for a tenant
 */
async function listOrgTranscripts(
  ctx: ToolContext,
  params: z.infer<typeof ListSchema>
): Promise<{
  transcripts: Array<{
    id: string;
    title: string;
    slug: string;
    call_date: string | null;
    call_type: string | null;
    duration_minutes: number | null;
    participants: Array<{ name: string; company?: string }>;
    key_topics: string[];
    summary_preview: string | null;
    source: string;
  }>;
  total_count: number;
  has_more: boolean;
}> {
  const supabase = ctx.getClient();

  const limit = Math.min(params.limit || 20, 50);
  const offset = params.offset || 0;

  let query = supabase
    .from('renubu.transcripts')
    .select(
      'id, title, slug, call_date, call_type, duration_minutes, participants, key_topics, summary, source',
      { count: 'exact' }
    )
    .eq('tenant_id', params.tenant_id)
    .order('call_date', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (params.call_type) {
    query = query.eq('call_type', params.call_type);
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

  const rows = (data || []) as Array<{
    id: string;
    title: string;
    slug: string;
    call_date: string | null;
    call_type: string | null;
    duration_minutes: number | null;
    participants: Participant[];
    key_topics: string[];
    summary: string | null;
    source: string;
  }>;

  // Filter by person/company in JS
  let filtered = rows;

  if (params.person) {
    const personLower = params.person.toLowerCase();
    filtered = filtered.filter((t) =>
      t.participants.some((p) => p.name.toLowerCase().includes(personLower))
    );
  }

  if (params.company) {
    const companyLower = params.company.toLowerCase();
    filtered = filtered.filter((t) =>
      t.participants.some((p) => p.company?.toLowerCase().includes(companyLower))
    );
  }

  return {
    transcripts: filtered.map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      call_date: t.call_date,
      call_type: t.call_type,
      duration_minutes: t.duration_minutes,
      participants: t.participants.map((p) => ({ name: p.name, company: p.company })),
      key_topics: t.key_topics || [],
      summary_preview: t.summary ? t.summary.substring(0, 200) : null,
      source: t.source,
    })),
    total_count: count || 0,
    has_more: (count || 0) > offset + limit,
  };
}

/**
 * Search transcripts for a tenant
 */
async function searchOrgTranscripts(
  ctx: ToolContext,
  params: z.infer<typeof SearchSchema>
): Promise<{
  results: Array<{
    id: string;
    title: string;
    slug: string;
    call_date: string | null;
    call_type: string | null;
    participants: Array<{ name: string }>;
    relevance_score: number;
    matching_excerpt: string | null;
    key_topics: string[];
  }>;
}> {
  const supabase = ctx.getClient();

  const limit = Math.min(params.limit || 10, 50);

  let query = supabase
    .from('renubu.transcripts')
    .select('id, title, slug, call_date, call_type, participants, key_topics, summary')
    .eq('tenant_id', params.tenant_id)
    .or(`summary.ilike.%${params.query}%,title.ilike.%${params.query}%`)
    .limit(limit);

  if (params.call_type) {
    query = query.eq('call_type', params.call_type);
  }

  if (params.context_tag) {
    query = query.contains('context_tags', [params.context_tag]);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to search transcripts: ${error.message}`);
  }

  const rows = (data || []) as Array<{
    id: string;
    title: string;
    slug: string;
    call_date: string | null;
    call_type: string | null;
    participants: Participant[];
    key_topics: string[];
    summary: string | null;
  }>;

  return {
    results: rows.map((r) => {
      const content = r.summary || r.title || '';
      const queryLower = params.query.toLowerCase();
      const contentLower = content.toLowerCase();
      const matchIndex = contentLower.indexOf(queryLower);

      let excerpt: string | null = null;
      if (matchIndex >= 0) {
        const start = Math.max(0, matchIndex - 40);
        const end = Math.min(content.length, matchIndex + params.query.length + 40);
        excerpt =
          (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
      }

      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        call_date: r.call_date,
        call_type: r.call_type,
        participants: r.participants.map((p) => ({ name: p.name })),
        relevance_score: matchIndex >= 0 ? 1 : 0.5,
        matching_excerpt: excerpt,
        key_topics: r.key_topics || [],
      };
    }),
  };
}

/**
 * Get full transcript by ID
 */
async function getOrgTranscript(
  ctx: ToolContext,
  params: z.infer<typeof GetSchema>
): Promise<{
  id: string;
  title: string;
  slug: string;
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
  raw_content?: string | null;
  context_tags: string[];
  linked_entities: Array<{ id: string; name: string; type: string }>;
  created_at: string;
  updated_at: string;
}> {
  const supabase = ctx.getClient();

  const { data, error } = await supabase
    .from('renubu.transcripts')
    .select('*')
    .eq('id', params.id)
    .eq('tenant_id', params.tenant_id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error(`Transcript not found: ${params.id}`);
    }
    throw new Error(`Failed to get transcript: ${error.message}`);
  }

  const row = data as TranscriptRow;

  // Resolve linked entities
  let linkedEntities: Array<{ id: string; name: string; type: string }> = [];
  if (row.entity_ids?.length) {
    const { data: entities } = await supabase
      .from('entities')
      .select('id, name, entity_type')
      .in('id', row.entity_ids);

    if (entities) {
      linkedEntities = (entities as Array<{ id: string; name: string; entity_type: string }>).map(
        (e) => ({ id: e.id, name: e.name, type: e.entity_type })
      );
    }
  }

  // Fetch raw content from context_file if requested
  let rawContent: string | null = null;
  if (params.include_raw && row.context_file_id) {
    try {
      const { data: fileData } = await supabase
        .from('context_files')
        .select('file_path, storage_bucket')
        .eq('id', row.context_file_id)
        .single();

      if (fileData) {
        const { data: content } = await supabase.storage
          .from(fileData.storage_bucket || 'contexts')
          .download(fileData.file_path);

        if (content) {
          rawContent = await content.text();
        }
      }
    } catch (err) {
      console.error('Failed to fetch raw content:', err);
    }
  }

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    call_date: row.call_date,
    call_type: row.call_type,
    duration_minutes: row.duration_minutes,
    source_url: row.source_url,
    source: row.source,
    participants: row.participants || [],
    summary: row.summary,
    key_topics: row.key_topics || [],
    action_items: row.action_items || [],
    notable_quotes: row.notable_quotes || [],
    relationship_insights: row.relationship_insights,
    raw_content: params.include_raw ? rawContent : undefined,
    context_tags: row.context_tags || [],
    linked_entities: linkedEntities,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
