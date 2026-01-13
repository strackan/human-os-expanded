/**
 * Queue Consumer
 *
 * Reads from Vercel KV (Redis) queue and persists to Supabase.
 * Designed to be called by Inngest or a cron job.
 */
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
export declare function consumeQueue(config: QueueConsumerConfig): Promise<ConsumeResult>;
export {};
//# sourceMappingURL=queue-consumer.d.ts.map