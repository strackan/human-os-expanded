/**
 * Queue Consumer
 *
 * Reads from Vercel KV (Redis) queue and persists to Supabase.
 * Designed to be called by Inngest or a cron job.
 */

import type { CapturePayload } from './types.js';
import { CAPTURE_QUEUE_KEY } from './capture.js';

// Vercel KV client type
type KVClient = {
  lpop: (key: string) => Promise<string | null>;
  llen: (key: string) => Promise<number>;
};

export interface QueueConsumerConfig {
  kv: KVClient;
  supabaseUrl: string;
  supabaseKey: string;
  batchSize?: number;
}

export interface ConsumeResult {
  processed: number;
  failed: number;
  remaining: number;
}

/**
 * Process a batch of items from the capture queue
 */
export async function consumeQueue(config: QueueConsumerConfig): Promise<ConsumeResult> {
  const { kv, supabaseUrl, supabaseKey, batchSize = 10 } = config;

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < batchSize; i++) {
    const item = await kv.lpop(CAPTURE_QUEUE_KEY);
    if (!item) break;

    try {
      const payload: CapturePayload = JSON.parse(item);
      await persistToSupabase(payload, supabaseUrl, supabaseKey);
      processed++;
    } catch (err) {
      console.error('[queue-consumer] Failed to process item:', err);
      failed++;
    }
  }

  const remaining = await kv.llen(CAPTURE_QUEUE_KEY);

  return { processed, failed, remaining };
}

/**
 * Persist a capture payload to Supabase
 */
async function persistToSupabase(
  payload: CapturePayload,
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  // Insert conversation record
  const conversationResponse = await fetch(
    `${supabaseUrl}/rest/v1/claude_conversations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        id: payload.conversation_id,
        user_id: payload.user_id,
        model: payload.model,
        started_at: payload.timestamp,
        metadata: {},
      }),
    }
  );

  // Upsert is fine - conversation may already exist
  if (!conversationResponse.ok && conversationResponse.status !== 409) {
    console.warn('[queue-consumer] Conversation insert warning:', conversationResponse.status);
  }

  // Extract text content from messages
  const userContent = extractTextContent(payload.messages);
  const assistantContent = payload.response?.content || '';

  // Insert user turn
  await fetch(`${supabaseUrl}/rest/v1/conversation_turns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      conversation_id: payload.conversation_id,
      role: 'user',
      content: userContent,
      created_at: payload.timestamp,
    }),
  });

  // Insert assistant turn (if response exists)
  if (payload.response) {
    const metadata: Record<string, unknown> = {};
    if (payload.ttft_ms !== undefined) {
      metadata.ttft_ms = payload.ttft_ms;
    }
    if (payload.streaming !== undefined) {
      metadata.streaming = payload.streaming;
    }

    await fetch(`${supabaseUrl}/rest/v1/conversation_turns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        conversation_id: payload.conversation_id,
        role: 'assistant',
        content: assistantContent,
        tokens_input: payload.response.usage?.input_tokens,
        tokens_output: payload.response.usage?.output_tokens,
        latency_ms: payload.latency_ms,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        created_at: new Date().toISOString(),
      }),
    });
  }
}

/**
 * Extract text content from Anthropic message format
 */
function extractTextContent(messages: CapturePayload['messages']): string {
  return messages
    .filter((m) => m.role === 'user')
    .map((m) => {
      if (typeof m.content === 'string') return m.content;
      if (Array.isArray(m.content)) {
        return m.content
          .filter((block): block is { type: 'text'; text: string } =>
            typeof block === 'object' && block !== null && block.type === 'text'
          )
          .map((block) => block.text)
          .join('\n');
      }
      return '';
    })
    .join('\n\n');
}
