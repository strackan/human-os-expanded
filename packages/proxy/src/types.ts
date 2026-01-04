/**
 * Types for Claude API Proxy
 */

/** Vercel KV client interface (from @vercel/kv) */
export interface KVClient {
  lpush: (key: string, ...values: string[]) => Promise<number>;
  lpop: (key: string) => Promise<string | null>;
  llen: (key: string) => Promise<number>;
}

export interface ProxyConfig {
  /** Anthropic API key (defaults to ANTHROPIC_API_KEY env var) */
  apiKey?: string;
  /** Base URL for Anthropic API (defaults to https://api.anthropic.com) */
  baseUrl?: string;
  /** Supabase URL for logging (optional) */
  supabaseUrl?: string;
  /** Supabase service key for logging (optional) */
  supabaseKey?: string;
  /** Vercel KV client for Redis queue (preferred, ~1-2ms latency) */
  kv?: KVClient;
  /** Enable capture logging (defaults to true) */
  captureEnabled?: boolean;
  /** User ID resolver function */
  getUserId?: (request: Request) => string | null | Promise<string | null>;
}

export interface ConversationRecord {
  id: string;
  user_id: string | null;
  model: string;
  started_at: string;
  metadata?: Record<string, unknown>;
}

export interface TurnRecord {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens_input?: number;
  tokens_output?: number;
  latency_ms?: number;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface CapturePayload {
  conversation_id: string;
  user_id: string | null;
  model: string;
  messages: Array<{
    role: string;
    content: unknown;
  }>;
  response?: {
    content: string;
    stop_reason?: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
    };
  };
  /** Total latency from request to complete response */
  latency_ms: number;
  /** Time to first token (streaming only) */
  ttft_ms?: number;
  /** Whether this was a streaming request */
  streaming?: boolean;
  timestamp: string;
}

export interface ProxyResult {
  response: Response;
  conversationId: string;
}

// Anthropic API types (subset)
export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; [key: string]: unknown }>;
}

export interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  stream?: boolean;
  system?: string;
  metadata?: {
    user_id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{ type: 'text'; text: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
