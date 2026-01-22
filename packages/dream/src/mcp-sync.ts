/**
 * MCP Sync Module
 *
 * Phase 0 of dream sequence: Query configured MCP providers for new content.
 * Extracts entities/patterns and stores THOSE (not raw data).
 *
 * Key Principles:
 * - Raw data stays in provider's system
 * - We only extract and store context (entities, patterns, summaries)
 * - Incremental sync via extraction_cursor
 * - Respects provider rate limits
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { DreamConfig, DayTranscript, TranscriptMessage } from './types.js';

// =============================================================================
// TYPES
// =============================================================================

export interface MCPProvider {
  id: string;
  userId: string;
  providerSlug: string;
  category: 'transcripts' | 'email' | 'calendar' | 'docs' | 'comms' | 'crm' | 'other';
  displayName?: string;
  mcpServerUrl?: string;
  mcpConfig: Record<string, unknown>;
  status: 'pending' | 'active' | 'error' | 'paused' | 'revoked';
  lastQueriedAt?: string;
  lastExtractionAt?: string;
  extractionCursor: Record<string, unknown>;
  supportsSearch: boolean;
  supportsIncremental: boolean;
}

export interface MCPContent {
  sourceId: string;
  sourceType: string;
  sourceDate: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface MCPSyncResult {
  providerId: string;
  providerSlug: string;
  itemsProcessed: number;
  entitiesExtracted: number;
  transcriptsGenerated: number;
  errors: string[];
  newCursor: Record<string, unknown>;
}

export interface MCPSyncConfig extends DreamConfig {
  /** Maximum items to process per provider */
  maxItemsPerProvider?: number;
  /** Skip providers with recent extractions (hours) */
  skipIfExtractedWithin?: number;
}

// =============================================================================
// MCP PROVIDER CLIENTS
// =============================================================================

/**
 * Base interface for MCP provider clients
 */
interface MCPProviderClient {
  /**
   * Fetch new content since last sync
   */
  fetchContent(cursor: Record<string, unknown>): Promise<{
    items: MCPContent[];
    newCursor: Record<string, unknown>;
    hasMore: boolean;
  }>;

  /**
   * Query specific content (for runtime queries)
   */
  query?(query: string, filters?: Record<string, unknown>): Promise<MCPContent[]>;
}

/**
 * Fireflies.ai MCP Client
 * Queries Fireflies GraphQL API via MCP wrapper
 */
class FirefliesMCPClient implements MCPProviderClient {
  constructor(
    private config: MCPProvider,
    private supabase: SupabaseClient
  ) {}

  async fetchContent(cursor: Record<string, unknown>): Promise<{
    items: MCPContent[];
    newCursor: Record<string, unknown>;
    hasMore: boolean;
  }> {
    // In real implementation, this would call the Fireflies MCP server
    // For now, return empty - actual implementation depends on MCP server setup
    const lastSyncDate = cursor.lastSyncDate as string | undefined;

    // Placeholder: In production, call MCP server endpoint
    // const response = await fetch(`${this.config.mcpServerUrl}/transcripts`, {
    //   method: 'POST',
    //   body: JSON.stringify({ since: lastSyncDate }),
    //   headers: { 'Content-Type': 'application/json' }
    // });

    return {
      items: [],
      newCursor: { lastSyncDate: new Date().toISOString() },
      hasMore: false,
    };
  }

  async query(query: string): Promise<MCPContent[]> {
    // Search transcripts via MCP
    return [];
  }
}

/**
 * Gmail MCP Client
 */
class GmailMCPClient implements MCPProviderClient {
  constructor(
    private config: MCPProvider,
    private supabase: SupabaseClient
  ) {}

  async fetchContent(cursor: Record<string, unknown>): Promise<{
    items: MCPContent[];
    newCursor: Record<string, unknown>;
    hasMore: boolean;
  }> {
    // Gmail implementation would go here
    return {
      items: [],
      newCursor: { historyId: cursor.historyId },
      hasMore: false,
    };
  }
}

/**
 * Generic MCP Client for providers without specific implementations
 */
class GenericMCPClient implements MCPProviderClient {
  constructor(
    private config: MCPProvider,
    private supabase: SupabaseClient
  ) {}

  async fetchContent(cursor: Record<string, unknown>): Promise<{
    items: MCPContent[];
    newCursor: Record<string, unknown>;
    hasMore: boolean;
  }> {
    // Generic implementation - call MCP server endpoint directly
    if (!this.config.mcpServerUrl) {
      return { items: [], newCursor: cursor, hasMore: false };
    }

    // Placeholder for generic MCP call
    return {
      items: [],
      newCursor: { ...cursor, lastSync: new Date().toISOString() },
      hasMore: false,
    };
  }
}

// =============================================================================
// MCP SYNC SERVICE
// =============================================================================

export class MCPSync {
  private supabase: SupabaseClient;

  constructor(private config: MCPSyncConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * Get all active MCP providers for user
   */
  async getActiveProviders(): Promise<MCPProvider[]> {
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
      userId: row.user_id,
      providerSlug: row.provider_slug,
      category: row.category,
      displayName: row.display_name,
      mcpServerUrl: row.mcp_server_url,
      mcpConfig: row.mcp_config || {},
      status: row.status,
      lastQueriedAt: row.last_queried_at,
      lastExtractionAt: row.last_extraction_at,
      extractionCursor: row.extraction_cursor || {},
      supportsSearch: row.supports_search || false,
      supportsIncremental: row.supports_incremental || true,
    }));
  }

  /**
   * Create MCP client for a provider
   */
  private createClient(provider: MCPProvider): MCPProviderClient {
    switch (provider.providerSlug) {
      case 'fireflies':
        return new FirefliesMCPClient(provider, this.supabase);
      case 'gmail':
        return new GmailMCPClient(provider, this.supabase);
      default:
        return new GenericMCPClient(provider, this.supabase);
    }
  }

  /**
   * Convert MCP content to transcript format for parser
   */
  private contentToTranscript(items: MCPContent[], provider: MCPProvider): DayTranscript | null {
    if (items.length === 0) return null;

    const messages: TranscriptMessage[] = [];
    const today = new Date().toISOString().split('T')[0] ?? '';

    for (const item of items) {
      // Convert content to transcript messages
      // For transcripts, split by speaker turns
      // For emails, create single message
      // For other types, adapt accordingly

      if (provider.category === 'transcripts') {
        // Parse transcript content - typically has speaker labels
        const lines = item.content.split('\n').filter((l) => l.trim());
        for (const line of lines) {
          // Common format: "Speaker Name: content"
          const match = line.match(/^([^:]+):\s*(.+)$/);
          if (match && match[1] && match[2]) {
            const speaker = match[1];
            const content = match[2];
            // Determine role based on speaker
            const role: 'user' | 'assistant' = speaker.toLowerCase().includes('you') ||
              speaker.toLowerCase() === this.config.userId
              ? 'user'
              : 'assistant';
            messages.push({
              role,
              content: `[${speaker}] ${content}`,
              timestamp: item.sourceDate,
            });
          } else {
            messages.push({
              role: 'user',
              content: line,
              timestamp: item.sourceDate,
            });
          }
        }
      } else if (provider.category === 'email') {
        // Email as user content
        messages.push({
          role: 'user',
          content: `[Email] ${item.content}`,
          timestamp: item.sourceDate,
        });
      } else {
        // Generic handling
        messages.push({
          role: 'user',
          content: `[${provider.providerSlug}] ${item.content}`,
          timestamp: item.sourceDate,
        });
      }
    }

    if (messages.length === 0) return null;

    return {
      date: today,
      messages,
      sessionIds: items.map((i) => i.sourceId),
    };
  }

  /**
   * Sync a single provider
   */
  async syncProvider(provider: MCPProvider): Promise<MCPSyncResult> {
    const result: MCPSyncResult = {
      providerId: provider.id,
      providerSlug: provider.providerSlug,
      itemsProcessed: 0,
      entitiesExtracted: 0,
      transcriptsGenerated: 0,
      errors: [],
      newCursor: provider.extractionCursor,
    };

    // Check if we should skip (recently extracted)
    const skipHours = this.config.skipIfExtractedWithin || 6;
    if (provider.lastExtractionAt) {
      const lastExtraction = new Date(provider.lastExtractionAt);
      const hoursSince = (Date.now() - lastExtraction.getTime()) / (1000 * 60 * 60);
      if (hoursSince < skipHours) {
        if (this.config.debug) {
          console.log(`[mcp-sync] Skipping ${provider.providerSlug} - extracted ${hoursSince.toFixed(1)}h ago`);
        }
        return result;
      }
    }

    try {
      const client = this.createClient(provider);
      const maxItems = this.config.maxItemsPerProvider || 50;

      // Fetch content
      const { items, newCursor, hasMore } = await client.fetchContent(provider.extractionCursor);

      result.itemsProcessed = Math.min(items.length, maxItems);
      result.newCursor = newCursor;

      if (items.length > 0) {
        // Store items for processing (will be picked up by parser)
        const processItems = items.slice(0, maxItems);

        // Log extraction
        for (const item of processItems) {
          await this.logExtraction(provider, item, true);
        }

        result.transcriptsGenerated = processItems.length;
      }

      // Update provider cursor and timestamp
      await this.updateProviderCursor(provider.id, newCursor);

      if (this.config.debug) {
        console.log(`[mcp-sync] ${provider.providerSlug}: ${result.itemsProcessed} items processed`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);

      // Update provider error state
      await this.updateProviderError(provider.id, errorMessage);

      if (this.config.debug) {
        console.error(`[mcp-sync] Error syncing ${provider.providerSlug}:`, errorMessage);
      }
    }

    return result;
  }

  /**
   * Sync all active providers
   */
  async syncAll(): Promise<MCPSyncResult[]> {
    const providers = await this.getActiveProviders();
    const results: MCPSyncResult[] = [];

    if (this.config.debug) {
      console.log(`[mcp-sync] Found ${providers.length} active providers`);
    }

    for (const provider of providers) {
      const result = await this.syncProvider(provider);
      results.push(result);
    }

    return results;
  }

  /**
   * Get combined transcript from all provider content
   * This merges content from multiple providers into a single transcript
   * for the parser to process
   */
  async getCombinedTranscript(): Promise<DayTranscript | null> {
    const providers = await this.getActiveProviders();
    const allMessages: TranscriptMessage[] = [];
    const today = new Date().toISOString().split('T')[0] ?? '';

    for (const provider of providers) {
      try {
        const client = this.createClient(provider);
        const { items } = await client.fetchContent(provider.extractionCursor);

        const transcript = this.contentToTranscript(items, provider);
        if (transcript) {
          allMessages.push(...transcript.messages);
        }
      } catch (error) {
        if (this.config.debug) {
          console.error(`[mcp-sync] Error getting content from ${provider.providerSlug}:`, error);
        }
      }
    }

    if (allMessages.length === 0) {
      return null;
    }

    // Sort by timestamp
    allMessages.sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    return {
      date: today,
      messages: allMessages,
    };
  }

  /**
   * Log extraction to database
   */
  private async logExtraction(
    provider: MCPProvider,
    item: MCPContent,
    success: boolean,
    error?: string
  ): Promise<void> {
    await this.supabase.schema('human_os').from('mcp_extraction_log').insert({
      user_id: this.config.userId,
      provider_id: provider.id,
      extraction_type: 'dream_sync',
      source_id: item.sourceId,
      source_type: item.sourceType,
      source_date: item.sourceDate,
      success,
      error_message: error,
      processing_completed_at: new Date().toISOString(),
    });
  }

  /**
   * Update provider cursor after sync
   */
  private async updateProviderCursor(
    providerId: string,
    newCursor: Record<string, unknown>
  ): Promise<void> {
    await this.supabase
      .schema('human_os')
      .from('user_mcp_providers')
      .update({
        extraction_cursor: newCursor,
        last_extraction_at: new Date().toISOString(),
        error_message: null,
        error_count: 0,
      })
      .eq('id', providerId);
  }

  /**
   * Update provider error state
   */
  private async updateProviderError(providerId: string, errorMessage: string): Promise<void> {
    await this.supabase.rpc('increment_provider_error', {
      p_provider_id: providerId,
      p_error_message: errorMessage,
    });

    // Fallback if RPC doesn't exist
    await this.supabase
      .schema('human_os')
      .from('user_mcp_providers')
      .update({
        error_message: errorMessage,
        last_error_at: new Date().toISOString(),
      })
      .eq('id', providerId);
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createMCPSync(config: MCPSyncConfig): MCPSync {
  return new MCPSync(config);
}
