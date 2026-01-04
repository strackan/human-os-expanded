/**
 * Fire-and-forget capture logging
 *
 * Logs conversation data to queue/database without blocking the response.
 * Target latency: <2ms for fire-and-forget operations.
 */

import type { CapturePayload } from './types.js';

export interface CaptureConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  kvUrl?: string;
  enabled?: boolean;
}

/**
 * Queue capture payload for async processing
 * Fire-and-forget - does not await result
 */
export function queueCapture(payload: CapturePayload, config: CaptureConfig): void {
  if (!config.enabled) return;

  // Fire and forget - don't await
  captureAsync(payload, config).catch((err) => {
    console.error('[proxy/capture] Failed to queue:', err);
  });
}

/**
 * Async capture implementation
 * Tries KV first (fastest), falls back to direct Supabase insert
 */
async function captureAsync(payload: CapturePayload, config: CaptureConfig): Promise<void> {
  // Option 1: Push to Redis/KV queue (preferred - ~1-2ms)
  if (config.kvUrl) {
    try {
      await pushToKv(payload, config.kvUrl);
      return;
    } catch (err) {
      console.warn('[proxy/capture] KV push failed, falling back to Supabase:', err);
    }
  }

  // Option 2: Direct Supabase insert (~5-15ms)
  if (config.supabaseUrl && config.supabaseKey) {
    await insertToSupabase(payload, config.supabaseUrl, config.supabaseKey);
  }
}

/**
 * Push to Vercel KV (Redis) queue
 */
async function pushToKv(payload: CapturePayload, kvUrl: string): Promise<void> {
  // Using raw Redis protocol for minimal latency
  // Vercel KV exposes REST API at the URL
  const response = await fetch(`${kvUrl}/lpush/claude_capture_queue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`KV push failed: ${response.status}`);
  }
}

/**
 * Direct insert to Supabase
 */
async function insertToSupabase(
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
    console.warn('[proxy/capture] Conversation insert warning:', conversationResponse.status);
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
    // Build metadata with streaming metrics
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

/**
 * Generate a unique conversation ID
 */
export function generateConversationId(): string {
  // Use crypto.randomUUID if available (Edge runtime), fallback to timestamp-based
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
