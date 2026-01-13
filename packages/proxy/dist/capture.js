/**
 * Fire-and-forget capture logging
 *
 * Logs conversation data to queue/database without blocking the response.
 * Target latency: <2ms for fire-and-forget operations.
 *
 * Priority:
 * 1. Vercel KV (Redis) - ~1-2ms, recommended for production
 * 2. Direct Supabase - ~5-15ms, fallback
 */
/** Queue name for capture payloads */
export const CAPTURE_QUEUE_KEY = 'claude_capture_queue';
/**
 * Queue capture payload for async processing
 * Fire-and-forget - does not await result
 */
export function queueCapture(payload, config) {
    if (!config.enabled)
        return;
    // Fire and forget - don't await
    captureAsync(payload, config).catch((err) => {
        console.error('[proxy/capture] Failed to queue:', err);
    });
}
/**
 * Async capture implementation
 * Tries KV first (fastest), falls back to direct Supabase insert
 */
async function captureAsync(payload, config) {
    // Option 1: Push to Vercel KV queue (preferred - ~1-2ms)
    if (config.kv) {
        try {
            await config.kv.lpush(CAPTURE_QUEUE_KEY, JSON.stringify(payload));
            return;
        }
        catch (err) {
            console.warn('[proxy/capture] KV push failed, falling back to Supabase:', err);
        }
    }
    // Option 2: Direct Supabase insert (~5-15ms)
    if (config.supabaseUrl && config.supabaseKey) {
        await insertToSupabase(payload, config.supabaseUrl, config.supabaseKey);
    }
}
/**
 * Direct insert to Supabase
 */
async function insertToSupabase(payload, supabaseUrl, supabaseKey) {
    // Insert conversation record
    const conversationResponse = await fetch(`${supabaseUrl}/rest/v1/claude_conversations`, {
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
    });
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
        const metadata = {};
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
function extractTextContent(messages) {
    return messages
        .filter((m) => m.role === 'user')
        .map((m) => {
        if (typeof m.content === 'string')
            return m.content;
        if (Array.isArray(m.content)) {
            return m.content
                .filter((block) => typeof block === 'object' && block !== null && block.type === 'text')
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
export function generateConversationId() {
    // Use crypto.randomUUID if available (Edge runtime), fallback to timestamp-based
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
//# sourceMappingURL=capture.js.map