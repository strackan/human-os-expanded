/**
 * Claude API Proxy
 *
 * Transparent proxy for Anthropic API that captures conversations
 * for searchability and cross-org intelligence.
 *
 * Latency budget:
 * - Hot path (passthrough): +3-5ms
 * - Warm path (with context): +5-10ms
 *
 * Usage:
 * ```typescript
 * import { createProxy } from '@human-os/proxy';
 *
 * const proxy = createProxy({
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 *   supabaseUrl: process.env.SUPABASE_URL,
 *   supabaseKey: process.env.SUPABASE_SERVICE_KEY,
 * });
 *
 * // In your API route handler:
 * export async function POST(request: Request) {
 *   return proxy.handleMessages(request);
 * }
 * ```
 */
import type { ProxyConfig } from './types.js';
export interface ClaudeProxy {
    /**
     * Handle /v1/messages endpoint
     * Supports both streaming and non-streaming requests
     */
    handleMessages(request: Request): Promise<Response>;
    /**
     * Handle any Anthropic API endpoint (passthrough)
     */
    handleRequest(request: Request, path: string): Promise<Response>;
}
/**
 * Create a Claude API proxy instance
 */
export declare function createProxy(config?: ProxyConfig): ClaudeProxy;
export * from './types.js';
export { generateConversationId, queueCapture, CAPTURE_QUEUE_KEY } from './capture.js';
export type { CaptureConfig } from './capture.js';
export { consumeQueue } from './queue-consumer.js';
export type { QueueConsumerConfig, ConsumeResult } from './queue-consumer.js';
//# sourceMappingURL=index.d.ts.map