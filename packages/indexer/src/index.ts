/**
 * @human-os/indexer
 *
 * Async indexing pipeline for conversation processing
 *
 * Components:
 * - Entity extraction from conversation text
 * - Embedding generation for semantic search
 * - Signal derivation for global entity intelligence
 * - Worker for processing unindexed turns
 */

export * from './types.js';
export * from './embeddings.js';
export * from './extractor.js';
export * from './signals.js';
export { IndexerWorker } from './worker.js';
