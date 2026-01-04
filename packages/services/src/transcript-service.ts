/**
 * Transcript Service
 *
 * Shared service for transcript ingestion, storage, and retrieval.
 * Used by both founder-os and renubu MCP servers.
 *
 * Storage architecture:
 * - Metadata stored in human_os.transcripts table
 * - Raw content stored in Supabase Storage: human-os/transcripts/{layer}/{id}.md
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Layer } from '@human-os/core';
import type { ServiceContext, ServiceResult } from './types.js';

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
  status?: 'pending' | 'done';
}

export interface NotableQuote {
  speaker: string;
  quote: string;
  context?: string;
  timestamp?: string;
}

export type CallType =
  | 'demo'
  | 'customer'
  | 'coaching'
  | 'internal'
  | 'investor'
  | 'partnership'
  | 'sales'
  | 'support'
  | 'other';

export type TranscriptSource = 'manual' | 'zoom' | 'fathom' | 'gong' | 'fireflies';

export interface TranscriptInput {
  title: string;
  raw_content: string;
  call_date?: string;
  call_type?: CallType;
  duration_minutes?: number;
  source_url?: string;
  source?: TranscriptSource;
  participants?: Participant[];
  summary?: string;
  key_topics?: string[];
  action_items?: ActionItem[];
  notable_quotes?: NotableQuote[];
  relationship_insights?: string;
  labels?: Record<string, string>;
  entity_ids?: string[];
  project_id?: string;
  opportunity_id?: string;
  context_tags?: string[];
}

export interface TranscriptRow {
  id: string;
  layer: string;
  user_id: string | null;
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

export interface TranscriptSummary {
  id: string;
  title: string;
  storage_path?: string;
  call_date: string | null;
  call_type: string | null;
  duration_minutes: number | null;
  participants: Array<{ name: string; company?: string }>;
  key_topics: string[];
  summary_preview: string | null;
  source_url?: string | null;
  source?: string;
}

export interface TranscriptSearchResult {
  id: string;
  title: string;
  storage_path?: string;
  call_date: string | null;
  call_type: string | null;
  participants: Array<{ name: string }>;
  relevance_score: number;
  matching_excerpt: string | null;
  key_topics: string[];
}

export interface TranscriptDetail {
  id: string;
  title: string;
  storage_path?: string;
  call_date: string | null;
  call_type: string | null;
  duration_minutes: number | null;
  source_url: string | null;
  source?: string;
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

export interface IngestResult {
  id: string;
  title: string;
  storage_path: string;
  call_date: string | null;
  participants_count: number;
  topics_count: number;
  linked_entities: number;
}

export interface ListResult {
  transcripts: TranscriptSummary[];
  total_count: number;
  has_more: boolean;
}

export interface SearchResult {
  results: TranscriptSearchResult[];
}

export interface ListParams {
  call_type?: CallType;
  person?: string;
  company?: string;
  project_id?: string;
  context_tag?: string;
  after?: string;
  before?: string;
  limit?: number;
  offset?: number;
}

export interface SearchParams {
  query: string;
  call_type?: CallType;
  context_tag?: string;
  limit?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TRANSCRIPTS_SCHEMA = 'human_os';
const STORAGE_BUCKET = 'human-os';

// =============================================================================
// TRANSCRIPT SERVICE
// =============================================================================

export class TranscriptService {
  private supabase: SupabaseClient;
  private layer: Layer;
  private userId?: string;

  constructor(supabase: SupabaseClient, layer: Layer, userId?: string) {
    this.supabase = supabase;
    this.layer = layer;
    this.userId = userId;
  }

  /**
   * Create a TranscriptService from ServiceContext
   */
  static fromContext(ctx: ServiceContext): TranscriptService {
    return new TranscriptService(ctx.supabase, ctx.layer as Layer, ctx.userId);
  }

  /**
   * Ingest a transcript with metadata
   * - Raw content stored in Supabase Storage
   * - Metadata stored in human_os.transcripts table
   * - Auto-links participants to existing entities by name match
   */
  async ingest(data: TranscriptInput): Promise<ServiceResult<IngestResult>> {
    const schema = this.supabase.schema(TRANSCRIPTS_SCHEMA);

    // Generate ID upfront for storage path
    const transcriptId = crypto.randomUUID();
    const storagePath = `transcripts/${this.layer}/${transcriptId}.md`;

    // Start with provided entity_ids
    const entityIds = new Set<string>(data.entity_ids || []);

    // Try to auto-link participants to existing entities
    if (data.participants && data.participants.length > 0) {
      for (const participant of data.participants) {
        // Skip internal team members for auto-linking
        if (participant.is_internal) continue;

        // Try to find matching entity by name
        const { data: matched } = await this.supabase
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
    const { error: storageError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, data.raw_content, {
        contentType: 'text/markdown',
        upsert: false,
      });

    if (storageError) {
      return {
        success: false,
        error: `Failed to upload transcript content: ${storageError.message}`,
      };
    }

    // Insert metadata to database
    const { data: inserted, error } = await schema
      .from('transcripts')
      .insert({
        id: transcriptId,
        layer: this.layer,
        user_id: this.userId || null,
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
      await this.supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      return {
        success: false,
        error: `Failed to ingest transcript: ${error.message}`,
      };
    }

    const result = inserted as { id: string; title: string; call_date: string | null };

    return {
      success: true,
      data: {
        id: result.id,
        title: result.title,
        storage_path: storagePath,
        call_date: result.call_date,
        participants_count: data.participants?.length || 0,
        topics_count: data.key_topics?.length || 0,
        linked_entities: entityIds.size,
      },
    };
  }

  /**
   * List transcripts with optional filters
   */
  async list(params: ListParams = {}): Promise<ServiceResult<ListResult>> {
    const schema = this.supabase.schema(TRANSCRIPTS_SCHEMA);

    // Clamp limit to max 50
    const limit = Math.min(params.limit || 20, 50);
    const offset = params.offset || 0;

    // Build query with layer filtering
    let query = schema
      .from('transcripts')
      .select(
        'id, title, storage_path, call_date, call_type, duration_minutes, participants, key_topics, summary, source_url, source, labels, project_id',
        { count: 'exact' }
      )
      .or(`layer.eq.public,layer.eq.${this.layer}`)
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
      return {
        success: false,
        error: `Failed to list transcripts: ${error.message}`,
      };
    }

    // Cast to expected type
    const rows = (data || []) as Array<{
      id: string;
      title: string;
      storage_path: string;
      call_date: string | null;
      call_type: string | null;
      duration_minutes: number | null;
      participants: Participant[];
      key_topics: string[];
      summary: string | null;
      source_url: string | null;
      source: string;
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
      success: true,
      data: {
        transcripts: filtered.map((t) => ({
          id: t.id,
          title: t.title,
          storage_path: t.storage_path,
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
          source: t.source,
        })),
        total_count: count || 0,
        has_more: (count || 0) > offset + limit,
      },
    };
  }

  /**
   * Full-text search across transcript summaries and titles
   */
  async search(params: SearchParams): Promise<ServiceResult<SearchResult>> {
    const schema = this.supabase.schema(TRANSCRIPTS_SCHEMA);

    const limit = Math.min(params.limit || 10, 50);

    // Try to use RPC function for proper FTS ranking
    const { data, error } = await schema.rpc('search_transcripts', {
      p_query: params.query,
      p_layer: this.layer,
      p_limit: limit,
    });

    if (error) {
      // Fallback to ilike search if RPC not available
      return this.searchFallback(params);
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
      success: true,
      data: {
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
            key_topics: [],
          };
        }),
      },
    };
  }

  /**
   * Fallback search using ilike when RPC is not available
   */
  private async searchFallback(params: SearchParams): Promise<ServiceResult<SearchResult>> {
    const schema = this.supabase.schema(TRANSCRIPTS_SCHEMA);
    const limit = Math.min(params.limit || 10, 50);

    let query = schema
      .from('transcripts')
      .select('id, title, storage_path, call_date, call_type, participants, key_topics, summary')
      .or(`layer.eq.public,layer.eq.${this.layer}`)
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
      return {
        success: false,
        error: `Failed to search transcripts: ${error.message}`,
      };
    }

    const rows = (data || []) as Array<{
      id: string;
      title: string;
      storage_path: string;
      call_date: string | null;
      call_type: string | null;
      participants: Participant[];
      key_topics: string[];
      summary: string | null;
    }>;

    return {
      success: true,
      data: {
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
              (start > 0 ? '...' : '') +
              content.substring(start, end) +
              (end < content.length ? '...' : '');
          }

          return {
            id: r.id,
            title: r.title,
            storage_path: r.storage_path,
            call_date: r.call_date,
            call_type: r.call_type,
            participants: r.participants.map((p) => ({ name: p.name })),
            relevance_score: matchIndex >= 0 ? 1 : 0.5,
            matching_excerpt: excerpt,
            key_topics: r.key_topics || [],
          };
        }),
      },
    };
  }

  /**
   * Get full transcript by ID
   */
  async get(id: string, includeRaw = true): Promise<ServiceResult<TranscriptDetail>> {
    const schema = this.supabase.schema(TRANSCRIPTS_SCHEMA);

    // Fetch metadata from database
    const { data, error } = await schema
      .from('transcripts')
      .select('*')
      .eq('id', id)
      .or(`layer.eq.public,layer.eq.${this.layer}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: `Transcript not found: ${id}`,
        };
      }
      return {
        success: false,
        error: `Failed to get transcript: ${error.message}`,
      };
    }

    // Cast to expected type
    const row = data as TranscriptRow;

    // Fetch raw content from storage if requested
    let rawContent: string | null = null;
    if (includeRaw && row.storage_path) {
      const { data: storageData, error: storageError } = await this.supabase.storage
        .from(STORAGE_BUCKET)
        .download(row.storage_path);

      if (!storageError && storageData) {
        rawContent = await storageData.text();
      }
    }

    // Resolve linked entities
    let linkedEntities: Array<{ id: string; name: string; type: string }> = [];

    if (row.entity_ids && row.entity_ids.length > 0) {
      const { data: entities, error: entityError } = await this.supabase
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
      success: true,
      data: {
        id: row.id,
        title: row.title,
        storage_path: row.storage_path,
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
        raw_content: rawContent,
        context_tags: row.context_tags || [],
        linked_entities: linkedEntities,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    };
  }
}
