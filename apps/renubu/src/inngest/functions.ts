/**
 * Inngest Functions
 *
 * Async workers for:
 * - Queue consumption (Redis → Supabase)
 * - Entity extraction and indexing
 * - Intelligence refresh
 */

import { inngest } from './client';
import { consumeQueue } from '@human-os/proxy';
import { kv } from '@vercel/kv';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY!;

/**
 * Process capture queue - runs every minute
 * Pulls from Redis and persists to Supabase
 */
export const processQueue = inngest.createFunction(
  {
    id: 'process-capture-queue',
    name: 'Process Capture Queue',
  },
  { cron: '* * * * *' }, // Every minute
  async ({ step }) => {
    const result = await step.run('consume-queue', async () => {
      return consumeQueue({
        kv,
        supabaseUrl,
        supabaseKey,
        batchSize: 50,
      });
    });

    // If there's more to process, trigger again
    if (result.remaining > 0) {
      await step.sleep('backoff', '5s');
      await step.invoke('process-more', {
        function: processQueue,
        data: {},
      });
    }

    return result;
  }
);

/**
 * Process a conversation turn for indexing
 * Extracts entities, generates embeddings, derives signals
 */
export const indexTurn = inngest.createFunction(
  {
    id: 'index-conversation-turn',
    name: 'Index Conversation Turn',
    retries: 3,
  },
  { event: 'indexer/turn.process' },
  async ({ event, step }) => {
    const { turnId, content } = event.data;

    // Step 1: Extract entities
    const entities = await step.run('extract-entities', async () => {
      const { extractEntities } = await import('@human-os/indexer');
      return extractEntities(content, anthropicApiKey);
    });

    // Step 2: Update turn with entities
    await step.run('save-entities', async () => {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase
        .from('conversation_turns')
        .update({ entities })
        .eq('id', turnId);
    });

    // Step 3: Match to global entities
    const matches = await step.run('match-entities', async () => {
      const { matchToGlobalEntities } = await import('@human-os/indexer');
      return matchToGlobalEntities(entities, supabaseUrl, supabaseKey);
    });

    // Step 4: Derive and contribute signals
    if (matches.size > 0) {
      await step.run('contribute-signals', async () => {
        const { deriveSignals, contributeSignals } = await import('@human-os/indexer');
        const signals = await deriveSignals(entities, content, anthropicApiKey);
        await contributeSignals(signals, matches, null, supabaseUrl, supabaseKey);
      });
    }

    return {
      turnId,
      entitiesFound: entities.length,
      matchesFound: matches.size,
    };
  }
);

/**
 * Refresh entity intelligence materialized view
 * Runs every 15 minutes per the plan
 */
export const refreshIntelligence = inngest.createFunction(
  {
    id: 'refresh-entity-intelligence',
    name: 'Refresh Entity Intelligence',
  },
  { cron: '*/15 * * * *' }, // Every 15 minutes
  async ({ step }) => {
    await step.run('refresh-view', async () => {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Refresh the materialized view
      const { error } = await supabase.rpc('refresh_entity_intelligence');

      if (error) {
        console.error('Failed to refresh entity_intelligence:', error);
        throw error;
      }
    });

    return { refreshed: true, timestamp: new Date().toISOString() };
  }
);

// Export all functions
export const functions = [processQueue, indexTurn, refreshIntelligence];
