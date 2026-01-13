/**
 * Indexing Pipeline Worker
 *
 * Polls for unprocessed conversation turns and:
 * 1. Extracts entities
 * 2. Generates embeddings
 * 3. Derives signals
 * 4. Links to global entities
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { extractEntities, matchToGlobalEntities } from './extractor.js';
import { generateEmbedding, generateSemanticSummary } from './embeddings.js';
import { deriveSignals, contributeSignals } from './signals.js';
import type { ConversationTurn, IndexerConfig, ProcessingResult } from './types.js';

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_POLL_INTERVAL_MS = 5000;

export class IndexerWorker {
  private config: Required<IndexerConfig>;
  private supabase: SupabaseClient;
  private running = false;

  constructor(config: IndexerConfig) {
    this.config = {
      ...config,
      batchSize: config.batchSize || DEFAULT_BATCH_SIZE,
      pollIntervalMs: config.pollIntervalMs || DEFAULT_POLL_INTERVAL_MS,
    };

    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * Start the worker loop
   */
  async start(): Promise<void> {
    console.log('[worker] Starting indexer worker...');
    console.log(`[worker] Batch size: ${this.config.batchSize}`);
    console.log(`[worker] Poll interval: ${this.config.pollIntervalMs}ms`);

    this.running = true;

    while (this.running) {
      try {
        const processed = await this.processBatch();

        if (processed === 0) {
          // No work to do, wait before polling again
          await this.sleep(this.config.pollIntervalMs);
        } else {
          console.log(`[worker] Processed ${processed} turns`);
          // Small delay between batches
          await this.sleep(100);
        }
      } catch (err) {
        console.error('[worker] Batch processing error:', err);
        await this.sleep(this.config.pollIntervalMs);
      }
    }

    console.log('[worker] Worker stopped');
  }

  /**
   * Stop the worker
   */
  stop(): void {
    console.log('[worker] Stopping...');
    this.running = false;
  }

  /**
   * Process a batch of unprocessed turns
   */
  async processBatch(): Promise<number> {
    // Fetch unprocessed turns (where entities is null or empty)
    const { data: turns, error } = await this.supabase
      .from('conversation_turns')
      .select('id, conversation_id, role, content, metadata, created_at')
      .or('entities.is.null,entities.eq.[]')
      .order('created_at', { ascending: true })
      .limit(this.config.batchSize);

    if (error) {
      console.error('[worker] Failed to fetch turns:', error);
      return 0;
    }

    if (!turns || turns.length === 0) {
      return 0;
    }

    // Process each turn
    const results = await Promise.all(
      turns.map((turn) => this.processTurn(turn as ConversationTurn))
    );

    return results.filter((r) => !r.error).length;
  }

  /**
   * Process a single conversation turn
   */
  async processTurn(turn: ConversationTurn): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      turnId: turn.id,
      entities: [],
      signals: [],
      embeddingGenerated: false,
    };

    try {
      // 1. Extract entities
      result.entities = await extractEntities(
        turn.content,
        this.config.anthropicApiKey
      );

      // 2. Update turn with entities (even if empty, to mark as processed)
      await this.supabase
        .from('conversation_turns')
        .update({ entities: result.entities })
        .eq('id', turn.id);

      if (result.entities.length === 0) {
        return result;
      }

      // 3. Match to global entities
      const entityMatches = await matchToGlobalEntities(
        result.entities,
        this.config.supabaseUrl,
        this.config.supabaseKey
      );

      // 4. Derive and contribute signals
      if (entityMatches.size > 0) {
        const signals = await deriveSignals(
          result.entities,
          turn.content,
          this.config.anthropicApiKey
        );

        const contributed = await contributeSignals(
          signals,
          entityMatches,
          null, // User ID from conversation metadata if available
          this.config.supabaseUrl,
          this.config.supabaseKey
        );

        result.signals = signals.slice(0, contributed);
      }

      // 5. Generate embedding (optional - requires Voyage API key)
      const voyageKey = process.env.VOYAGE_API_KEY;
      if (voyageKey) {
        const embedding = await generateEmbedding(turn.content, voyageKey);
        if (embedding) {
          await this.supabase
            .from('conversation_turns')
            .update({ embedding: embedding.embedding })
            .eq('id', turn.id);
          result.embeddingGenerated = true;
        }
      }

      console.log(
        `[worker] Turn ${turn.id}: ${result.entities.length} entities, ${result.signals.length} signals`
      );

      return result;
    } catch (err) {
      result.error = err instanceof Error ? err.message : String(err);
      console.error(`[worker] Error processing turn ${turn.id}:`, err);
      return result;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const config: IndexerConfig = {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    batchSize: parseInt(process.env.BATCH_SIZE || '10', 10),
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '5000', 10),
  };

  if (!config.supabaseUrl || !config.supabaseKey || !config.anthropicApiKey) {
    console.error('Required environment variables:');
    console.error('  SUPABASE_URL');
    console.error('  SUPABASE_SERVICE_KEY');
    console.error('  ANTHROPIC_API_KEY');
    console.error('Optional:');
    console.error('  VOYAGE_API_KEY (for embeddings)');
    console.error('  BATCH_SIZE (default: 10)');
    console.error('  POLL_INTERVAL_MS (default: 5000)');
    process.exit(1);
  }

  const worker = new IndexerWorker(config);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT');
    worker.stop();
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM');
    worker.stop();
  });

  worker.start().catch(console.error);
}
