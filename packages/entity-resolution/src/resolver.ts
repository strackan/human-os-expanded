/**
 * Entity Resolver
 *
 * Multi-tier entity resolution with early return:
 * - Tier 1: Exact glossary match (fastest, free)
 * - Tier 2: Exact entity slug/name match (fast, free)
 * - Tier 3: Fuzzy trigram match (fast, free, requires confidence > 0.7)
 * - Tier 4: Semantic embedding match (expensive API call, only if tiers 1-3 fail)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  EntityMention,
  ResolvedEntity,
  EntityResolution,
  ResolvedContext,
  EntityResolverConfig,
  MatchSource,
} from './types.js';
import { EntityMentionExtractor } from './extractor.js';

const HUMAN_OS_SCHEMA = 'human_os';

// =============================================================================
// DATABASE RESULT TYPES
// =============================================================================

interface DbResolutionResult {
  entity_id: string;
  entity_slug: string;
  entity_name: string;
  entity_type: string;
  match_source: MatchSource;
  confidence: number;
  metadata?: Record<string, unknown>;
}

interface DbBatchResult {
  mention: string;
  entity_id: string;
  entity_slug: string;
  entity_name: string;
  entity_type: string;
  match_source: MatchSource;
  confidence: number;
}

// =============================================================================
// ENTITY RESOLVER
// =============================================================================

export class EntityResolver {
  private supabase: SupabaseClient;
  private config: Required<Omit<EntityResolverConfig, 'generateEmbedding'>> & {
    generateEmbedding?: EntityResolverConfig['generateEmbedding'];
  };
  private extractor: EntityMentionExtractor;

  constructor(config: EntityResolverConfig) {
    this.config = {
      fuzzyThreshold: 0.3,
      semanticThreshold: 0.7,
      maxCandidates: 3,
      ...config,
    };
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.extractor = new EntityMentionExtractor();
  }

  /**
   * Main entry point: extract and resolve all entity mentions in input
   */
  async resolve(input: string): Promise<ResolvedContext> {
    // Step 1: Extract potential mentions
    const mentions = this.extractor.extract(input);

    if (mentions.length === 0) {
      return {
        originalInput: input,
        mentions: [],
        resolutions: new Map(),
        groundedEntities: [],
        ambiguousEntities: [],
        unresolvedMentions: [],
        embeddingsUsed: 0,
      };
    }

    // Step 2: Batch resolve using tiers 1-3 (fast, no API calls)
    const mentionTexts = mentions.map((m) => m.text);
    const batchResults = await this.batchResolve(mentionTexts);

    // Step 3: For unresolved mentions, try tier 4 (semantic) if embedding available
    let embeddingsUsed = 0;
    if (this.config.generateEmbedding) {
      for (const mention of mentions) {
        const key = mention.text.toLowerCase();
        const existing = batchResults.get(key);

        // Only use semantic if tiers 1-3 failed
        if (!existing || existing.length === 0) {
          const semantic = await this.resolveWithSemantic(mention.text);
          if (semantic) {
            batchResults.set(key, [semantic]);
            embeddingsUsed++;
          }
        }
      }
    }

    // Step 4: Build resolved context
    return this.buildContext(input, mentions, batchResults, embeddingsUsed);
  }

  /**
   * Resolve a single mention using tiered approach
   * Returns immediately when a tier matches with sufficient confidence
   */
  async resolveSingle(
    mention: string,
    entityTypes?: string[]
  ): Promise<ResolvedEntity | null> {
    // Tiers 1-3: Database-side resolution
    const { data, error } = await this.supabase
      .schema(HUMAN_OS_SCHEMA)
      .rpc('resolve_entity_mention', {
        p_mention: mention,
        p_layer: this.config.layer,
        p_entity_types: entityTypes || null,
        p_fuzzy_threshold: this.config.fuzzyThreshold,
        p_embedding: null, // No embedding for tiers 1-3
      });

    if (error) {
      console.error(`Entity resolution error: ${error.message}`);
      return null;
    }

    const results = data as DbResolutionResult[] | null;
    if (results && results.length > 0) {
      return this.mapDbResult(results[0]!);
    }

    // Tier 4: Semantic (only if enabled and tiers 1-3 failed)
    if (this.config.generateEmbedding) {
      return this.resolveWithSemantic(mention, entityTypes);
    }

    return null;
  }

  /**
   * Tier 4: Semantic resolution using embeddings
   * Only called when tiers 1-3 fail
   */
  private async resolveWithSemantic(
    mention: string,
    entityTypes?: string[]
  ): Promise<ResolvedEntity | null> {
    if (!this.config.generateEmbedding) {
      return null;
    }

    try {
      // Generate embedding for the mention
      const embedding = await this.config.generateEmbedding(mention);

      // Query database with embedding
      const { data, error } = await this.supabase
        .schema(HUMAN_OS_SCHEMA)
        .rpc('resolve_entity_semantic', {
          p_mention: mention,
          p_embedding: embedding,
          p_layer: this.config.layer,
          p_entity_types: entityTypes || null,
          p_threshold: this.config.semanticThreshold,
        });

      if (error) {
        console.error(`Semantic resolution error: ${error.message}`);
        return null;
      }

      const results = data as DbResolutionResult[] | null;
      if (results && results.length > 0) {
        return this.mapDbResult(results[0]!);
      }
    } catch (err) {
      console.error(`Embedding generation error:`, err);
    }

    return null;
  }

  /**
   * Batch resolve multiple mentions (tiers 1-3 only for performance)
   */
  private async batchResolve(
    mentions: string[]
  ): Promise<Map<string, ResolvedEntity[]>> {
    const results = new Map<string, ResolvedEntity[]>();

    const { data, error } = await this.supabase
      .schema(HUMAN_OS_SCHEMA)
      .rpc('resolve_entity_mentions_batch', {
        p_mentions: mentions,
        p_layer: this.config.layer,
        p_entity_types: null,
      });

    if (error) {
      console.error(`Batch resolution error: ${error.message}`);
      return results;
    }

    // Group results by mention
    for (const row of (data as DbBatchResult[] | null) || []) {
      const key = row.mention.toLowerCase();
      const existing = results.get(key) || [];
      existing.push({
        entityId: row.entity_id,
        slug: row.entity_slug,
        name: row.entity_name,
        type: row.entity_type,
        matchSource: row.match_source,
        confidence: row.confidence,
      });
      results.set(key, existing);
    }

    return results;
  }

  /**
   * Build the resolved context object
   */
  private buildContext(
    input: string,
    mentions: EntityMention[],
    resolutions: Map<string, ResolvedEntity[]>,
    embeddingsUsed: number
  ): ResolvedContext {
    const entityResolutions = new Map<string, EntityResolution>();
    const groundedEntities: ResolvedEntity[] = [];
    const ambiguousEntities: Array<{
      mention: string;
      candidates: ResolvedEntity[];
    }> = [];
    const unresolvedMentions: string[] = [];

    for (const mention of mentions) {
      const key = mention.text.toLowerCase();
      const candidates = resolutions.get(key) || [];

      const resolution: EntityResolution = {
        mention,
        resolved: candidates.length > 0,
        candidates,
        ambiguous: false,
      };

      if (candidates.length === 0) {
        unresolvedMentions.push(mention.text);
      } else if (candidates.length === 1 || candidates[0]!.confidence > 0.9) {
        // Single match or very high-confidence top match
        resolution.selectedEntity = candidates[0];
        groundedEntities.push(candidates[0]!);
      } else {
        // Multiple candidates - check for ambiguity
        const topConfidence = candidates[0]!.confidence;
        const similarCandidates = candidates.filter(
          (c) => c.confidence >= topConfidence * 0.9
        );

        if (similarCandidates.length > 1) {
          // Ambiguous: multiple candidates with similar confidence
          resolution.ambiguous = true;
          ambiguousEntities.push({
            mention: mention.text,
            candidates: similarCandidates,
          });
        } else {
          // Clear winner
          resolution.selectedEntity = candidates[0];
          groundedEntities.push(candidates[0]!);
        }
      }

      entityResolutions.set(key, resolution);
    }

    return {
      originalInput: input,
      mentions,
      resolutions: entityResolutions,
      groundedEntities,
      ambiguousEntities,
      unresolvedMentions,
      embeddingsUsed,
    };
  }

  /**
   * Map database result to ResolvedEntity
   */
  private mapDbResult(row: DbResolutionResult): ResolvedEntity {
    return {
      entityId: row.entity_id,
      slug: row.entity_slug,
      name: row.entity_name,
      type: row.entity_type,
      matchSource: row.match_source,
      confidence: row.confidence,
      metadata: row.metadata,
    };
  }
}

/**
 * Create a resolver instance
 */
export function createResolver(config: EntityResolverConfig): EntityResolver {
  return new EntityResolver(config);
}
