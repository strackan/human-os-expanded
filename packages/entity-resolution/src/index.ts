/**
 * @human-os/entity-resolution
 *
 * Semantic entity resolution with tiered matching for Human OS.
 *
 * Resolution tiers (early return on match):
 * - Tier 1: Exact glossary match (fastest, free)
 * - Tier 2: Exact entity slug/name match (fast, free)
 * - Tier 3: Fuzzy trigram match (fast, free, confidence > 0.7)
 * - Tier 4: Semantic embedding match (expensive API, only if tiers 1-3 fail)
 *
 * @example
 * ```typescript
 * import {
 *   EntityResolver,
 *   buildInjectedContext,
 *   createOpenAIProvider,
 * } from '@human-os/entity-resolution';
 *
 * // Create embedding provider (optional, for Tier 4)
 * const embeddingProvider = createOpenAIProvider(process.env.OPENAI_API_KEY!);
 *
 * // Create resolver
 * const resolver = new EntityResolver({
 *   supabaseUrl: process.env.SUPABASE_URL!,
 *   supabaseKey: process.env.SUPABASE_KEY!,
 *   layer: 'founder:justin',
 *   generateEmbedding: (text) => embeddingProvider.generate(text),
 * });
 *
 * // Resolve entities in input
 * const resolved = await resolver.resolve('remind me to call Scott lease about hanging');
 *
 * // Build context for Claude
 * const context = buildInjectedContext(resolved);
 *
 * console.log(context.entityMap);
 * // { "scott lease": { id: "...", slug: "scott-leese", name: "Scott Leese" } }
 *
 * console.log(context.canTraverseNetwork);
 * // false (entities found, stay in HumanOS network)
 * ```
 */

// Types
export type {
  EntityMention,
  ResolvedEntity,
  EntityResolution,
  ResolvedContext,
  EntityResolverConfig,
  InjectedContext,
  EmbeddingProvider,
  MatchSource,
} from './types.js';

// Extractor
export { EntityMentionExtractor, createExtractor } from './extractor.js';

// Resolver
export { EntityResolver, createResolver } from './resolver.js';

// Context Builder
export {
  buildInjectedContext,
  substituteEntityReferences,
  formatResolutionDebug,
} from './context-builder.js';

// Embedding Providers
export {
  OpenAIEmbeddingProvider,
  SupabaseAIEmbeddingProvider,
  CachedEmbeddingProvider,
  createOpenAIProvider,
  createCachedOpenAIProvider,
  createSupabaseAIProvider,
} from './embeddings.js';
