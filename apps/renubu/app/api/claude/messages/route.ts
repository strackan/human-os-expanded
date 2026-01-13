/**
 * Claude Messages API Proxy
 *
 * Proxies requests to Anthropic API while capturing conversations
 * for searchability and cross-org intelligence.
 *
 * Usage from client:
 * ```typescript
 * const response = await fetch('/api/claude/messages', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     model: 'claude-sonnet-4-5-20241022',
 *     max_tokens: 1024,
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   }),
 * });
 * ```
 */

import { createProxy } from '@human-os/proxy';
import { createClient } from '@/lib/supabase/server';
import { kv } from '@vercel/kv';

// Lazy initialization to avoid build-time API key check
let proxyInstance: ReturnType<typeof createProxy> | null = null;

function getProxy() {
  if (!proxyInstance) {
    proxyInstance = createProxy({
      captureEnabled: true,
      kv, // Vercel KV for Redis queue (~1-2ms latency)
      getUserId: async () => {
        try {
          const supabase = await createClient();
          const { data: { user } } = await supabase.auth.getUser();
          return user?.id || null;
        } catch {
          return null;
        }
      },
    });
  }
  return proxyInstance;
}

export async function POST(request: Request) {
  const proxy = getProxy();
  return proxy.handleMessages(request);
}

// Support OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
