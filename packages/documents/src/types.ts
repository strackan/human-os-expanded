/**
 * Core types for document extraction and chunking.
 * Ported from fancyrobot-cloud/backend/fancyrobot_backend/scraper/text_stream.py
 */

import type { Tiktoken } from 'js-tiktoken';

/**
 * A chunk of text with associated metadata of type T.
 * Generic over metadata so each extractor can define its own shape.
 */
export interface TextChunk<T = Record<string, unknown>> {
  text: string;
  metadata: T;
  encoded?: number[];
}

/**
 * Context passed to combine strategies during chunk reduction.
 */
export interface CombineContext {
  tokenizerModel: string;
  targetChunkSize: number;
  encoding: Tiktoken;
}

/**
 * Abstract strategy for combining adjacent chunks into larger ones.
 *
 * Return semantics from combine():
 *   length 0: Delete the first chunk
 *   length 1: Chunks were merged; keep reducing with next
 *   length 2: No merge possible; emit first, continue with second
 *   length 3+: Emit all but last, continue with last
 */
export interface CombineChunksStrategy<T = Record<string, unknown>> {
  combine(
    chunk1: TextChunk<T>,
    chunk2: TextChunk<T>,
    context: CombineContext,
  ): TextChunk<T>[];

  /**
   * Called when the stream ends. Flush any remaining state.
   * Default: emit the last chunk if present.
   */
  end?(chunk: TextChunk<T> | null, context: CombineContext): TextChunk<T>[];
}

/**
 * Serialize chunk metadata to a flat record (for storage / vector DB).
 */
export function chunkToRecord<T extends Record<string, unknown>>(
  chunk: TextChunk<T>,
): { text: string; metadata: Record<string, unknown> } {
  return { text: chunk.text, metadata: { ...chunk.metadata } };
}
