/**
 * Inngest Client
 *
 * Event-driven async workers for Renubu.
 * Handles queue consumption, entity extraction, and indexing.
 */

import { Inngest } from 'inngest';

// Create the Inngest client
export const inngest = new Inngest({
  id: 'renubu',
  name: 'Renubu',
});

// Event types
export interface CaptureQueueEvent {
  name: 'capture/queue.process';
  data: {
    batchSize?: number;
  };
}

export interface IndexTurnEvent {
  name: 'indexer/turn.process';
  data: {
    turnId: string;
    conversationId: string;
    content: string;
  };
}

export interface RefreshIntelligenceEvent {
  name: 'intelligence/refresh';
  data: {
    entityId?: string; // Optional - refresh specific entity or all
  };
}

// Union type for all events
export type RenubuEvents = CaptureQueueEvent | IndexTurnEvent | RefreshIntelligenceEvent;
