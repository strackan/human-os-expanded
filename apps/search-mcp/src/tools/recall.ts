/**
 * Recall tools - Deterministic, structured entity retrieval
 *
 * Convention:
 * - recall_* = deterministic, structured, parameter-based (exact filters, IDs)
 * - search_* = dynamic, semantic, query-based (full-text, vector similarity)
 *
 * Query-only operations for retrieving entities, interactions, and relationships.
 * Part of search-mcp (information retrieval), separate from do-mcp (mutations).
 *
 * Recall Tools (structured):
 * - recall_person: Find people by name, company, role
 * - recall_company: Find organizations by name, industry
 * - recall_project: Find projects by name, status
 * - recall_goal: Find goals by name, timeframe
 * - recall_task: Find tasks by status, assignee
 * - recall_journal: Find journal entries by date, type, sentiment
 * - recall_expert: Find experts by domain, slug
 * - recall_transcript: Find transcripts by ID, type, person, date
 * - recall_connections: Find entity relationships by slug
 *
 * Search Tools (semantic) - see semantic.ts:
 * - search_entities, search_journal, search_transcript
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

interface RecallContext {
  supabase: SupabaseClient;
  userId: string;
  layer: string;
}

interface Entity {
  id: string;
  slug: string;
  entity_type: string;
  name: string;
  email?: string;
  metadata: Record<string, unknown>;
  owner_id?: string;
  tenant_id?: string;
  privacy_scope: string;
  created_at: string;
  updated_at: string;
}

interface Interaction {
  id: string;
  entity_id?: string;
  layer: string;
  interaction_type: string;
  title?: string;
  content?: string;
  sentiment?: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

interface EntityLink {
  id: string;
  source_slug: string;
  target_slug: string;
  link_type: string;
  link_text?: string;
  strength: number;
}

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const recallTools: Tool[] = [
  {
    name: 'recall_person',
    description: `Find people/contacts in your network.

Example: recall_person({ name: "Justin" })
Example: recall_person({ company: "Anthropic", role: "engineer" })`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name to search for (partial match)' },
        email: { type: 'string', description: 'Email address' },
        company: { type: 'string', description: 'Company they work at' },
        role: { type: 'string', description: 'Job title or role' },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
    },
  },
  {
    name: 'recall_company',
    description: `Find companies/organizations.

Example: recall_company({ name: "Anthropic" })
Example: recall_company({ industry: "AI" })`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Company name (partial match)' },
        industry: { type: 'string', description: 'Industry or sector' },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
    },
  },
  {
    name: 'recall_project',
    description: `Find projects.

Example: recall_project({ name: "Human OS" })
Example: recall_project({ status: "active" })`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name (partial match)' },
        status: { type: 'string', description: 'Project status' },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
    },
  },
  {
    name: 'recall_goal',
    description: `Find goals and objectives.

Example: recall_goal({ name: "launch" })
Example: recall_goal({ timeframe: "Q1" })`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Goal name (partial match)' },
        timeframe: { type: 'string', description: 'Time period' },
        status: { type: 'string', description: 'Goal status' },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
    },
  },
  {
    name: 'recall_task',
    description: `Find tasks.

Example: recall_task({ status: "pending" })
Example: recall_task({ assignee: "justin" })`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Task name (partial match)' },
        status: { type: 'string', description: 'Task status (pending, in_progress, done)' },
        assignee: { type: 'string', description: 'Person assigned to' },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
    },
  },
  {
    name: 'recall_journal',
    description: `Find journal entries by structured filters (date, type, sentiment).

For full-text content search, use search_journal instead.

Example: recall_journal({ dateFrom: "2025-01-01" })
Example: recall_journal({ type: "meeting", sentiment: "positive" })`,
    inputSchema: {
      type: 'object',
      properties: {
        dateFrom: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        dateTo: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        type: {
          type: 'string',
          enum: ['meeting', 'email', 'call', 'message', 'note', 'check_in', 'engagement'],
          description: 'Interaction type',
        },
        sentiment: {
          type: 'string',
          enum: ['positive', 'neutral', 'concerned', 'urgent'],
          description: 'Sentiment filter',
        },
        entityId: { type: 'string', description: 'Related entity ID' },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
    },
  },
  {
    name: 'recall_expert',
    description: `Find experts by domain or slug.

Example: recall_expert({ domain: "machine learning" })
Example: recall_expert({ slug: "dan-shipper" })`,
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Expert slug' },
        domain: { type: 'string', description: 'Area of expertise' },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
    },
  },
  {
    name: 'recall_transcript',
    description: `Find transcripts by structured filters (ID, type, person, date).

For full-text content search, use search_transcript instead.

Example: recall_transcript({ id: "abc-123" })
Example: recall_transcript({ callType: "demo", person: "Justin" })
Example: recall_transcript({ dateFrom: "2025-01-01", dateTo: "2025-01-31" })`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Transcript ID (returns single transcript with full content)' },
        callType: {
          type: 'string',
          enum: ['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'sales', 'support', 'other'],
          description: 'Filter by call type',
        },
        person: { type: 'string', description: 'Filter by participant name' },
        company: { type: 'string', description: 'Filter by participant company' },
        dateFrom: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        dateTo: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        contextTag: { type: 'string', description: 'Filter by context tag' },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
    },
  },
  {
    name: 'recall_connections',
    description: `Find relationships and connections for an entity.

Example: recall_connections({ slug: "justin-strachman" })
Example: recall_connections({ slug: "anthropic", depth: 2, linkTypes: ["works_at"] })`,
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Entity slug to find connections for' },
        entityId: { type: 'string', description: 'Or entity ID' },
        depth: { type: 'number', description: 'Traversal depth (default: 1, max: 3)' },
        linkTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by link types (works_at, contacts, related_to, etc.)',
        },
        limit: { type: 'number', description: 'Max results (default: 50)' },
      },
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleRecallTools(
  name: string,
  args: Record<string, unknown>,
  ctx: RecallContext
): Promise<unknown | null> {
  switch (name) {
    case 'recall_person':
      return recallEntity(ctx, 'person', args);

    case 'recall_company':
      return recallEntity(ctx, 'company', args);

    case 'recall_project':
      return recallEntity(ctx, 'project', args);

    case 'recall_goal':
      return recallEntity(ctx, 'goal', args);

    case 'recall_task':
      return recallEntity(ctx, 'task', args);

    case 'recall_expert':
      return recallEntity(ctx, 'expert', args);

    case 'recall_journal':
      return recallJournal(ctx, args);

    case 'recall_transcript':
      return recallTranscript(ctx, args);

    case 'recall_connections':
      return recallConnections(ctx, args);

    default:
      return null;
  }
}

// =============================================================================
// IMPLEMENTATIONS
// =============================================================================

async function recallEntity(
  ctx: RecallContext,
  entityType: string,
  filters: Record<string, unknown>
): Promise<{
  success: boolean;
  entities?: Entity[];
  count?: number;
  message: string;
  error?: string;
}> {
  try {
    const limit = Math.min(Number(filters.limit) || 20, 100);

    let query = ctx.supabase
      .from('entities')
      .select('*')
      .eq('entity_type', entityType)
      .limit(limit);

    // Apply name filter (case-insensitive partial match)
    if (filters.name) {
      query = query.ilike('name', `%${filters.name}%`);
    }

    // Apply email filter
    if (filters.email) {
      query = query.ilike('email', `%${filters.email}%`);
    }

    // Apply metadata filters based on entity type
    if (entityType === 'person') {
      if (filters.company) {
        query = query.ilike('metadata->>company', `%${filters.company}%`);
      }
      if (filters.role) {
        query = query.ilike('metadata->>role', `%${filters.role}%`);
      }
    }

    if (entityType === 'company' && filters.industry) {
      query = query.ilike('metadata->>industry', `%${filters.industry}%`);
    }

    if (entityType === 'project' && filters.status) {
      query = query.eq('metadata->>status', filters.status);
    }

    if (entityType === 'goal') {
      if (filters.timeframe) {
        query = query.ilike('metadata->>timeframe', `%${filters.timeframe}%`);
      }
      if (filters.status) {
        query = query.eq('metadata->>status', filters.status);
      }
    }

    if (entityType === 'task') {
      if (filters.status) {
        query = query.eq('metadata->>status', filters.status);
      }
      if (filters.assignee) {
        query = query.ilike('metadata->>assignee', `%${filters.assignee}%`);
      }
    }

    if (entityType === 'expert') {
      if (filters.slug) {
        query = query.eq('slug', filters.slug);
      }
      if (filters.domain) {
        query = query.ilike('metadata->>domain', `%${filters.domain}%`);
      }
    }

    // Order by most recently updated
    query = query.order('updated_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      entities: data || [],
      count: data?.length || 0,
      message: data?.length
        ? `Found ${data.length} ${entityType}(s)`
        : `No ${entityType}s found matching criteria`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function recallJournal(
  ctx: RecallContext,
  filters: Record<string, unknown>
): Promise<{
  success: boolean;
  entries?: Interaction[];
  count?: number;
  message: string;
  error?: string;
}> {
  try {
    const limit = Math.min(Number(filters.limit) || 20, 100);

    let query = ctx.supabase
      .from('interactions')
      .select('*')
      .limit(limit);

    // Date filters
    if (filters.dateFrom) {
      query = query.gte('occurred_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('occurred_at', filters.dateTo);
    }

    // Type filter
    if (filters.type) {
      query = query.eq('interaction_type', filters.type);
    }

    // Sentiment filter
    if (filters.sentiment) {
      query = query.eq('sentiment', filters.sentiment);
    }

    // Entity filter
    if (filters.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }

    // Order by occurrence date descending
    query = query.order('occurred_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      entries: data || [],
      count: data?.length || 0,
      message: data?.length
        ? `Found ${data.length} journal entries`
        : 'No journal entries found matching criteria',
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function recallTranscript(
  ctx: RecallContext,
  filters: Record<string, unknown>
): Promise<{
  success: boolean;
  transcript?: unknown;
  transcripts?: unknown[];
  count?: number;
  message: string;
  error?: string;
}> {
  try {
    const schema = ctx.supabase.schema('human_os');

    // If ID provided, get single transcript with full content
    if (filters.id) {
      const { data, error } = await schema
        .from('transcripts')
        .select('*')
        .eq('id', filters.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, message: '', error: `Transcript not found: ${filters.id}` };
        }
        throw error;
      }

      // Fetch raw content from storage
      let rawContent: string | null = null;
      if (data.storage_path) {
        const { data: storageData } = await ctx.supabase.storage
          .from('human-os')
          .download(data.storage_path);
        if (storageData) {
          rawContent = await storageData.text();
        }
      }

      return {
        success: true,
        transcript: { ...data, raw_content: rawContent },
        message: `Retrieved transcript: ${data.title}`,
      };
    }

    // List with filters
    const limit = Math.min(Number(filters.limit) || 20, 50);

    let query = schema
      .from('transcripts')
      .select('id, title, storage_path, call_date, call_type, duration_minutes, participants, key_topics, summary, source')
      .or(`layer.eq.public,layer.eq.${ctx.layer}`)
      .order('call_date', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (filters.callType) {
      query = query.eq('call_type', filters.callType);
    }

    if (filters.contextTag) {
      query = query.contains('context_tags', [filters.contextTag]);
    }

    if (filters.dateFrom) {
      query = query.gte('call_date', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('call_date', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter by person/company in JS (JSONB filtering is complex)
    let filtered = data || [];

    if (filters.person) {
      const personLower = (filters.person as string).toLowerCase();
      filtered = filtered.filter((t: { participants: Array<{ name: string }> }) =>
        t.participants?.some(p => p.name?.toLowerCase().includes(personLower))
      );
    }

    if (filters.company) {
      const companyLower = (filters.company as string).toLowerCase();
      filtered = filtered.filter((t: { participants: Array<{ company?: string }> }) =>
        t.participants?.some(p => p.company?.toLowerCase().includes(companyLower))
      );
    }

    return {
      success: true,
      transcripts: filtered,
      count: filtered.length,
      message: filtered.length
        ? `Found ${filtered.length} transcripts`
        : 'No transcripts found matching criteria',
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function recallConnections(
  ctx: RecallContext,
  filters: Record<string, unknown>
): Promise<{
  success: boolean;
  connections?: {
    entity?: Entity;
    outgoing: Array<{ link: EntityLink; target: Entity }>;
    incoming: Array<{ link: EntityLink; source: Entity }>;
  };
  message: string;
  error?: string;
}> {
  try {
    const slug = filters.slug as string | undefined;
    const entityId = filters.entityId as string | undefined;
    const depth = Math.min(Number(filters.depth) || 1, 3);
    const linkTypes = filters.linkTypes as string[] | undefined;
    const limit = Math.min(Number(filters.limit) || 50, 100);

    if (!slug && !entityId) {
      return {
        success: false,
        message: '',
        error: 'Either slug or entityId is required',
      };
    }

    // Get the entity first
    let entityQuery = ctx.supabase.from('entities').select('*');
    if (slug) {
      entityQuery = entityQuery.eq('slug', slug);
    } else {
      entityQuery = entityQuery.eq('id', entityId);
    }

    const { data: entityData, error: entityError } = await entityQuery.single();
    if (entityError) throw entityError;

    const entity = entityData as Entity;
    const entitySlug = entity.slug;

    // Get outgoing links
    let outgoingQuery = ctx.supabase
      .from('entity_links')
      .select('*')
      .eq('source_slug', entitySlug)
      .limit(limit);

    if (linkTypes?.length) {
      outgoingQuery = outgoingQuery.in('link_type', linkTypes);
    }

    const { data: outgoingLinks, error: outError } = await outgoingQuery;
    if (outError) throw outError;

    // Get incoming links
    let incomingQuery = ctx.supabase
      .from('entity_links')
      .select('*')
      .eq('target_slug', entitySlug)
      .limit(limit);

    if (linkTypes?.length) {
      incomingQuery = incomingQuery.in('link_type', linkTypes);
    }

    const { data: incomingLinks, error: inError } = await incomingQuery;
    if (inError) throw inError;

    // Fetch connected entities
    const targetSlugs = (outgoingLinks || []).map(l => l.target_slug);
    const sourceSlugs = (incomingLinks || []).map(l => l.source_slug);
    const allSlugs = [...new Set([...targetSlugs, ...sourceSlugs])];

    let connectedEntities: Entity[] = [];
    if (allSlugs.length > 0) {
      const { data: entitiesData } = await ctx.supabase
        .from('entities')
        .select('*')
        .in('slug', allSlugs);
      connectedEntities = entitiesData || [];
    }

    const entityMap = new Map(connectedEntities.map(e => [e.slug, e]));

    const outgoing = (outgoingLinks || []).map(link => ({
      link: link as EntityLink,
      target: entityMap.get(link.target_slug) as Entity,
    })).filter(r => r.target);

    const incoming = (incomingLinks || []).map(link => ({
      link: link as EntityLink,
      source: entityMap.get(link.source_slug) as Entity,
    })).filter(r => r.source);

    return {
      success: true,
      connections: {
        entity,
        outgoing,
        incoming,
      },
      message: `Found ${outgoing.length} outgoing and ${incoming.length} incoming connections`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
