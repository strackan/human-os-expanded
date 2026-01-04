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
import type { CapturePayload } from './types.js';
type KVClient = {
    lpush: (key: string, ...values: string[]) => Promise<number>;
};
export interface CaptureConfig {
    supabaseUrl?: string;
    supabaseKey?: string;
    /** Vercel KV client instance from @vercel/kv */
    kv?: KVClient;
    enabled?: boolean;
}
/** Queue name for capture payloads */
export declare const CAPTURE_QUEUE_KEY = "claude_capture_queue";
/**
 * Queue capture payload for async processing
 * Fire-and-forget - does not await result
 */
export declare function queueCapture(payload: CapturePayload, config: CaptureConfig): void;
/**
 * Generate a unique conversation ID
 */
export declare function generateConversationId(): string;
export {};
//# sourceMappingURL=capture.d.ts.map