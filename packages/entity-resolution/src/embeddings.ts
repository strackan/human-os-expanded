/**
 * Embedding Providers
 *
 * Abstraction for generating embeddings from various providers.
 * Used only for Tier 4 semantic resolution when tiers 1-3 fail.
 */

import type { EmbeddingProvider } from './types.js';

// =============================================================================
// OPENAI EMBEDDING PROVIDER
// =============================================================================

/**
 * OpenAI embedding provider using text-embedding-3-small
 * Generates 1536-dimensional vectors
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private apiKey: string;
  private model: string;
  private dimensions: number;

  constructor(options: {
    apiKey: string;
    model?: string;
    dimensions?: number;
  }) {
    this.apiKey = options.apiKey;
    this.model = options.model || 'text-embedding-3-small';
    this.dimensions = options.dimensions || 1536;
  }

  /**
   * Generate embedding for text
   */
  async generate(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
        dimensions: this.dimensions,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI embedding error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
    };

    if (!data.data?.[0]?.embedding) {
      throw new Error('No embedding returned from OpenAI');
    }

    return data.data[0].embedding;
  }
}

// =============================================================================
// SUPABASE AI EMBEDDING PROVIDER (Edge Function)
// =============================================================================

/**
 * Supabase AI embedding provider
 * Uses a Supabase Edge Function to generate embeddings
 * Useful when you want to centralize embedding generation
 */
export class SupabaseAIEmbeddingProvider implements EmbeddingProvider {
  private supabaseUrl: string;
  private supabaseKey: string;
  private functionName: string;

  constructor(options: {
    supabaseUrl: string;
    supabaseKey: string;
    functionName?: string;
  }) {
    this.supabaseUrl = options.supabaseUrl;
    this.supabaseKey = options.supabaseKey;
    this.functionName = options.functionName || 'embedding';
  }

  /**
   * Generate embedding via Supabase Edge Function
   */
  async generate(text: string): Promise<number[]> {
    const response = await fetch(
      `${this.supabaseUrl}/functions/v1/${this.functionName}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase embedding error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as { embedding: number[] };

    if (!data.embedding) {
      throw new Error('No embedding returned from Supabase');
    }

    return data.embedding;
  }
}

// =============================================================================
// CACHED EMBEDDING PROVIDER
// =============================================================================

/**
 * Wrapper that caches embeddings to reduce API calls
 */
export class CachedEmbeddingProvider implements EmbeddingProvider {
  private provider: EmbeddingProvider;
  private cache: Map<string, number[]>;
  private maxCacheSize: number;

  constructor(
    provider: EmbeddingProvider,
    options?: { maxCacheSize?: number }
  ) {
    this.provider = provider;
    this.cache = new Map();
    this.maxCacheSize = options?.maxCacheSize || 1000;
  }

  /**
   * Generate embedding with caching
   */
  async generate(text: string): Promise<number[]> {
    // Normalize cache key
    const key = text.toLowerCase().trim();

    // Check cache
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    // Generate new embedding
    const embedding = await this.provider.generate(text);

    // Cache result (with LRU eviction if needed)
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry (first key in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, embedding);

    return embedding;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
    };
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create an OpenAI embedding provider
 */
export function createOpenAIProvider(apiKey: string): EmbeddingProvider {
  return new OpenAIEmbeddingProvider({ apiKey });
}

/**
 * Create a cached OpenAI embedding provider
 */
export function createCachedOpenAIProvider(
  apiKey: string,
  maxCacheSize?: number
): CachedEmbeddingProvider {
  const provider = new OpenAIEmbeddingProvider({ apiKey });
  return new CachedEmbeddingProvider(provider, { maxCacheSize });
}

/**
 * Create a Supabase AI embedding provider
 */
export function createSupabaseAIProvider(
  supabaseUrl: string,
  supabaseKey: string
): EmbeddingProvider {
  return new SupabaseAIEmbeddingProvider({ supabaseUrl, supabaseKey });
}
