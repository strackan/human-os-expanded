/**
 * MCP Query Service
 *
 * Runtime query service for MCP providers. Allows on-demand queries
 * to external data sources (transcripts, emails, docs) via MCP.
 *
 * Key Principles:
 * - Data stays in provider's system
 * - Query at runtime for fresh data
 * - Cache summaries only (not raw data)
 * - Respect provider rate limits
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export interface MCPQueryConfig {
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  /** Enable verbose logging */
  debug?: boolean;
}

export interface MCPProvider {
  id: string;
  providerSlug: string;
  category: 'transcripts' | 'email' | 'calendar' | 'docs' | 'comms' | 'crm' | 'other';
  displayName?: string;
  mcpServerUrl?: string;
  mcpConfig: Record<string, unknown>;
  status: 'pending' | 'active' | 'error' | 'paused' | 'revoked';
  supportsSearch: boolean;
  supportsIncremental: boolean;
}

export interface MCPQuery {
  /** Type of query */
  type: 'search' | 'list' | 'get' | 'summary';
  /** Query string for search queries */
  query?: string;
  /** Filters to apply */
  filters?: {
    /** Filter by date range */
    dateRange?: {
      start?: string;
      end?: string;
    };
    /** Filter by entity name (e.g., company name, person) */
    entity?: string;
    /** Filter by source type */
    sourceType?: string;
    /** Maximum results */
    limit?: number;
  };
  /** Specific item ID for 'get' type */
  itemId?: string;
}

export interface MCPResult {
  /** Provider that returned this result */
  providerSlug: string;
  /** Type of content */
  contentType: string;
  /** Items returned */
  items: MCPResultItem[];
  /** Summary if requested */
  summary?: string;
  /** Query metadata */
  metadata: {
    totalResults: number;
    hasMore: boolean;
    executionTime: number;
    cached: boolean;
  };
}

export interface MCPResultItem {
  id: string;
  title: string;
  content?: string;
  date: string;
  source: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// SUMMARY CACHE
// =============================================================================

interface CachedSummary {
  key: string;
  summary: string;
  createdAt: string;
  expiresAt: string;
}

class SummaryCache {
  private cache = new Map<string, CachedSummary>();
  private ttlMs: number;

  constructor(ttlMinutes: number = 30) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (new Date(entry.expiresAt) < new Date()) {
      this.cache.delete(key);
      return null;
    }

    return entry.summary;
  }

  set(key: string, summary: string): void {
    const now = new Date();
    this.cache.set(key, {
      key,
      summary,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + this.ttlMs).toISOString(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// =============================================================================
// MCP QUERY SERVICE
// =============================================================================

export class MCPQueryService {
  private supabase: SupabaseClient;
  private summaryCache: SummaryCache;

  constructor(private config: MCPQueryConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.summaryCache = new SummaryCache(30); // 30 minute TTL
  }

  /**
   * Get all configured providers for the user
   */
  async getConfiguredProviders(): Promise<MCPProvider[]> {
    const { data, error } = await this.supabase
      .schema('human_os')
      .from('user_mcp_providers')
      .select('*')
      .eq('user_id', this.config.userId)
      .eq('status', 'active')
      .is('deleted_at', null);

    if (error) {
      throw new Error(`Failed to fetch MCP providers: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      providerSlug: row.provider_slug,
      category: row.category,
      displayName: row.display_name,
      mcpServerUrl: row.mcp_server_url,
      mcpConfig: row.mcp_config || {},
      status: row.status,
      supportsSearch: row.supports_search || false,
      supportsIncremental: row.supports_incremental || true,
    }));
  }

  /**
   * Query a specific provider
   */
  async query(providerSlug: string, query: MCPQuery): Promise<MCPResult> {
    const startTime = Date.now();

    // Find the provider
    const providers = await this.getConfiguredProviders();
    const provider = providers.find((p) => p.providerSlug === providerSlug);

    if (!provider) {
      throw new Error(`Provider '${providerSlug}' not configured or not active`);
    }

    // Check cache for summary queries
    if (query.type === 'summary') {
      const cacheKey = this.buildCacheKey(providerSlug, query);
      const cached = this.summaryCache.get(cacheKey);
      if (cached) {
        return {
          providerSlug,
          contentType: provider.category,
          items: [],
          summary: cached,
          metadata: {
            totalResults: 0,
            hasMore: false,
            executionTime: Date.now() - startTime,
            cached: true,
          },
        };
      }
    }

    // Execute query against MCP server
    const result = await this.executeMCPQuery(provider, query);

    // Cache summary if applicable
    if (query.type === 'summary' && result.summary) {
      const cacheKey = this.buildCacheKey(providerSlug, query);
      this.summaryCache.set(cacheKey, result.summary);
    }

    // Update last_queried_at
    await this.updateLastQueried(provider.id);

    return {
      ...result,
      metadata: {
        ...result.metadata,
        executionTime: Date.now() - startTime,
        cached: false,
      },
    };
  }

  /**
   * Query all providers in a category
   */
  async queryCategory(
    category: 'transcripts' | 'email' | 'calendar' | 'docs' | 'comms' | 'crm',
    query: MCPQuery
  ): Promise<MCPResult[]> {
    const providers = await this.getConfiguredProviders();
    const categoryProviders = providers.filter((p) => p.category === category);

    const results: MCPResult[] = [];

    for (const provider of categoryProviders) {
      try {
        const result = await this.query(provider.providerSlug, query);
        results.push(result);
      } catch (error) {
        if (this.config.debug) {
          console.error(`Error querying ${provider.providerSlug}:`, error);
        }
        // Continue with other providers
      }
    }

    return results;
  }

  /**
   * Get extracted summary for an entity/topic
   * First checks cached summaries, then queries live if needed
   */
  async getExtractedSummary(
    entityOrTopic: string,
    timeRange?: 'today' | 'this-week' | 'this-month' | 'last-week'
  ): Promise<string | null> {
    const cacheKey = `summary:${entityOrTopic}:${timeRange || 'all'}`;

    // Check cache first
    const cached = this.summaryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Check database for stored summaries
    const { data } = await this.supabase
      .schema('human_os')
      .from('mcp_extraction_log')
      .select('*')
      .eq('user_id', this.config.userId)
      .eq('summary_generated', true)
      .order('created_at', { ascending: false })
      .limit(10);

    // If we have recent extractions mentioning this entity, we could return that
    // For now, return null to trigger live query
    return null;
  }

  /**
   * Search across all configured providers
   */
  async searchAll(queryText: string, filters?: MCPQuery['filters']): Promise<MCPResult[]> {
    const providers = await this.getConfiguredProviders();
    const searchableProviders = providers.filter((p) => p.supportsSearch);

    const results: MCPResult[] = [];

    for (const provider of searchableProviders) {
      try {
        const result = await this.query(provider.providerSlug, {
          type: 'search',
          query: queryText,
          filters,
        });
        results.push(result);
      } catch (error) {
        if (this.config.debug) {
          console.error(`Error searching ${provider.providerSlug}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Execute query against MCP server
   */
  private async executeMCPQuery(provider: MCPProvider, query: MCPQuery): Promise<MCPResult> {
    // In production, this would call the actual MCP server
    // For now, return placeholder response

    if (!provider.mcpServerUrl) {
      return {
        providerSlug: provider.providerSlug,
        contentType: provider.category,
        items: [],
        metadata: {
          totalResults: 0,
          hasMore: false,
          executionTime: 0,
          cached: false,
        },
      };
    }

    // Placeholder: Make actual MCP call
    // const response = await fetch(`${provider.mcpServerUrl}/query`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     type: query.type,
    //     query: query.query,
    //     filters: query.filters,
    //     itemId: query.itemId,
    //   }),
    // });
    // return response.json();

    return {
      providerSlug: provider.providerSlug,
      contentType: provider.category,
      items: [],
      metadata: {
        totalResults: 0,
        hasMore: false,
        executionTime: 0,
        cached: false,
      },
    };
  }

  /**
   * Build cache key for a query
   */
  private buildCacheKey(providerSlug: string, query: MCPQuery): string {
    return `${providerSlug}:${query.type}:${query.query || ''}:${JSON.stringify(query.filters || {})}`;
  }

  /**
   * Update last_queried_at for a provider
   */
  private async updateLastQueried(providerId: string): Promise<void> {
    await this.supabase
      .schema('human_os')
      .from('user_mcp_providers')
      .update({ last_queried_at: new Date().toISOString() })
      .eq('id', providerId);
  }

  /**
   * Clear the summary cache
   */
  clearCache(): void {
    this.summaryCache.clear();
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createMCPQueryService(config: MCPQueryConfig): MCPQueryService {
  return new MCPQueryService(config);
}
