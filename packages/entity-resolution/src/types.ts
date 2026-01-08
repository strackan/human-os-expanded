/**
 * Human OS Entity Resolution - Type Definitions
 *
 * Semantic entity resolution with tiered matching:
 * Tier 1: Glossary → Tier 2: Exact → Tier 3: Fuzzy → Tier 4: Semantic
 */

import type { Layer } from '@human-os/core';

// =============================================================================
// ENTITY MENTION
// =============================================================================

/**
 * A potential entity mention extracted from input text
 */
export interface EntityMention {
  /** The extracted text */
  text: string;

  /** Start position in original input */
  startIndex: number;

  /** End position in original input */
  endIndex: number;

  /** Surrounding text for context */
  context: string;

  /** Inferred entity type based on context */
  inferredType?: 'person' | 'company' | 'project' | 'unknown';
}

// =============================================================================
// RESOLVED ENTITY
// =============================================================================

/**
 * Match source indicating which tier resolved the entity
 */
export type MatchSource =
  | 'glossary'         // Tier 1: Exact glossary term match
  | 'entity_exact'     // Tier 2: Exact entity slug/name match
  | 'entity_fuzzy'     // Tier 3: Fuzzy trigram match
  | 'entity_semantic'; // Tier 4: Semantic embedding match

/**
 * A successfully resolved entity
 */
export interface ResolvedEntity {
  /** Entity UUID */
  entityId: string;

  /** URL-friendly slug */
  slug: string;

  /** Display name */
  name: string;

  /** Entity type (person, company, project, etc.) */
  type: string;

  /** Which resolution tier matched */
  matchSource: MatchSource;

  /** Confidence score (0-1) */
  confidence: number;

  /** Additional entity metadata */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// ENTITY RESOLUTION
// =============================================================================

/**
 * Result of resolving a single mention
 */
export interface EntityResolution {
  /** The original mention */
  mention: EntityMention;

  /** Whether resolution succeeded */
  resolved: boolean;

  /** All candidate matches (may be multiple for ambiguous cases) */
  candidates: ResolvedEntity[];

  /** The selected entity (highest confidence, if resolved) */
  selectedEntity?: ResolvedEntity;

  /** True if multiple high-confidence candidates exist */
  ambiguous: boolean;
}

// =============================================================================
// RESOLVED CONTEXT
// =============================================================================

/**
 * Complete resolution context for an input
 */
export interface ResolvedContext {
  /** Original input text */
  originalInput: string;

  /** All extracted mentions */
  mentions: EntityMention[];

  /** Resolution results keyed by mention text (lowercase) */
  resolutions: Map<string, EntityResolution>;

  /** All successfully resolved entities */
  groundedEntities: ResolvedEntity[];

  /** Mentions with multiple high-confidence candidates */
  ambiguousEntities: Array<{
    mention: string;
    candidates: ResolvedEntity[];
  }>;

  /** Mentions that couldn't be resolved */
  unresolvedMentions: string[];

  /** Number of embedding API calls made (Tier 4) */
  embeddingsUsed: number;
}

// =============================================================================
// RESOLVER CONFIG
// =============================================================================

/**
 * Configuration for the entity resolver
 */
export interface EntityResolverConfig {
  /** Supabase URL */
  supabaseUrl: string;

  /** Supabase service role key */
  supabaseKey: string;

  /** Privacy layer for resolution */
  layer: Layer;

  /** Fuzzy match threshold (default: 0.3, high-confidence: 0.7) */
  fuzzyThreshold?: number;

  /** Semantic match threshold (default: 0.7) */
  semanticThreshold?: number;

  /** Maximum candidates per mention (default: 3) */
  maxCandidates?: number;

  /**
   * Embedding generation function (Tier 4)
   * Only called when tiers 1-3 fail
   */
  generateEmbedding?: (text: string) => Promise<number[]>;
}

// =============================================================================
// INJECTED CONTEXT
// =============================================================================

/**
 * Context prepared for injection into Claude/execution
 */
export interface InjectedContext {
  /** Formatted string for system prompt injection */
  systemContext: string;

  /** Entity lookup map for tool parameter substitution */
  entityMap: Record<
    string,
    {
      id: string;
      slug: string;
      name: string;
      type: string;
    }
  >;

  /** Whether clarification is needed for ambiguous entities */
  clarificationNeeded: boolean;

  /** Prompt to ask for clarification (if needed) */
  clarificationPrompt?: string;

  /**
   * Whether the query can traverse outside the HumanOS network
   * True for general knowledge queries with no entity matches
   */
  canTraverseNetwork: boolean;
}

// =============================================================================
// EMBEDDING PROVIDER
// =============================================================================

/**
 * Interface for embedding generation providers
 */
export interface EmbeddingProvider {
  /** Generate embedding for text */
  generate(text: string): Promise<number[]>;
}
