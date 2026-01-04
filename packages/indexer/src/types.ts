/**
 * Indexer type definitions
 */

export interface ConversationTurn {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_input?: number;
  tokens_output?: number;
  latency_ms?: number;
  entities?: ExtractedEntity[];
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ExtractedEntity {
  type: 'person' | 'company' | 'topic' | 'skill' | 'interest';
  value: string;
  confidence: number;
  context?: string;
}

export interface EntityMention {
  entity_id: string;
  mention_type: 'direct' | 'indirect' | 'inferred';
  sentiment?: number; // -1 to 1
  context: string;
}

export interface DerivedSignal {
  entity_id: string;
  signal_type: 'sentiment' | 'responsiveness' | 'deal_outcome' | 'interest' | 'skill' | 'engagement_level' | 'champion' | 'blocker';
  value: string;
  score?: number;
}

export interface IndexerConfig {
  supabaseUrl: string;
  supabaseKey: string;
  anthropicApiKey: string;
  batchSize?: number;
  pollIntervalMs?: number;
}

export interface ProcessingResult {
  turnId: string;
  entities: ExtractedEntity[];
  signals: DerivedSignal[];
  embeddingGenerated: boolean;
  error?: string;
}
