/**
 * LLM Response Cache Service
 *
 * Provides database-backed caching for LLM responses.
 * Caches are shared across users for efficiency (greetings are customer-specific).
 *
 * Cache Key Strategy:
 * - For greetings: `greeting:{customerId}:{workflowType}`
 * - TTL: 24 hours (customer context doesn't change frequently)
 */

import { createClient } from '@/lib/supabase/client';
import crypto from 'crypto';

const DEFAULT_TTL_HOURS = 24;

export interface CachedLLMResponse {
  content: string;
  metadata?: {
    toolsUsed?: string[];
    tokensUsed?: number;
    cachedAt?: string;
  };
}

export interface CacheOptions {
  ttlHours?: number;
  customerId?: string;
  workflowType?: string;
  slideId?: string;
}

/**
 * Generate a cache key for LLM responses
 */
function generateCacheKey(
  type: 'greeting' | 'response',
  identifier: string,
  context?: string
): string {
  const parts = [type, identifier];
  if (context) parts.push(context);
  return parts.join(':');
}

/**
 * Generate a hash of the prompt for cache invalidation
 */
function hashPrompt(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16);
}

export class LLMCacheService {
  /**
   * Get a cached response if available and not expired
   */
  static async get(cacheKey: string): Promise<CachedLLMResponse | null> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('llm_response_cache')
        .select('response_content, response_metadata, hit_count')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      // Increment hit count (fire and forget)
      supabase
        .from('llm_response_cache')
        .update({ hit_count: (data.hit_count || 0) + 1 })
        .eq('cache_key', cacheKey)
        .then(() => {}); // Don't await

      console.log('[LLMCache] Cache HIT for:', cacheKey);

      return {
        content: data.response_content,
        metadata: data.response_metadata,
      };
    } catch (error) {
      console.error('[LLMCache] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Store a response in the cache
   */
  static async set(
    cacheKey: string,
    content: string,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const supabase = createClient();
      const ttlHours = options.ttlHours || DEFAULT_TTL_HOURS;
      const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from('llm_response_cache').upsert(
        {
          cache_key: cacheKey,
          prompt_hash: hashPrompt(cacheKey), // Simple hash for now
          customer_id: options.customerId || null,
          workflow_type: options.workflowType || null,
          slide_id: options.slideId || 'greeting',
          response_content: content,
          response_metadata: {
            cachedAt: new Date().toISOString(),
          },
          hit_count: 0,
          expires_at: expiresAt,
        },
        {
          onConflict: 'cache_key',
        }
      );

      if (error) {
        console.error('[LLMCache] Error writing cache:', error);
      } else {
        console.log('[LLMCache] Cached response for:', cacheKey, 'expires:', expiresAt);
      }
    } catch (error) {
      console.error('[LLMCache] Error writing cache:', error);
    }
  }

  /**
   * Get or generate a greeting with caching
   */
  static async getGreeting(
    customerId: string,
    customerName: string,
    workflowType: string,
    generateFn: () => Promise<{ text: string; toolsUsed: string[]; tokensUsed: number }>
  ): Promise<{ text: string; toolsUsed: string[]; tokensUsed: number; cached: boolean }> {
    const cacheKey = generateCacheKey('greeting', customerId, workflowType);

    // Try cache first
    const cached = await this.get(cacheKey);
    if (cached) {
      return {
        text: cached.content,
        toolsUsed: cached.metadata?.toolsUsed || [],
        tokensUsed: 0, // No tokens used for cached response
        cached: true,
      };
    }

    // Generate new greeting
    console.log('[LLMCache] Cache MISS for:', cacheKey, '- generating new greeting');
    const result = await generateFn();

    // Cache the result (fire and forget)
    this.set(cacheKey, result.text, {
      customerId,
      workflowType,
      slideId: 'greeting',
      ttlHours: DEFAULT_TTL_HOURS,
    }).catch(() => {}); // Don't let cache errors affect the response

    return {
      ...result,
      cached: false,
    };
  }

  /**
   * Invalidate cache for a specific customer (e.g., when INTEL data changes)
   */
  static async invalidateForCustomer(customerId: string): Promise<void> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('llm_response_cache')
        .delete()
        .eq('customer_id', customerId);

      if (error) {
        console.error('[LLMCache] Error invalidating cache:', error);
      } else {
        console.log('[LLMCache] Invalidated cache for customer:', customerId);
      }
    } catch (error) {
      console.error('[LLMCache] Error invalidating cache:', error);
    }
  }

  /**
   * Prune expired cache entries (called periodically)
   */
  static async pruneExpired(): Promise<number> {
    try {
      const supabase = createClient();

      // Call the database function
      const { data, error } = await supabase.rpc('prune_expired_llm_cache');

      if (error) {
        console.error('[LLMCache] Error pruning cache:', error);
        return 0;
      }

      console.log('[LLMCache] Pruned expired entries:', data);
      return data || 0;
    } catch (error) {
      console.error('[LLMCache] Error pruning cache:', error);
      return 0;
    }
  }
}

export default LLMCacheService;
