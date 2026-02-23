/**
 * Token-aware chunk reduction algorithm.
 * Ported from fancyrobot-cloud/backend/fancyrobot_backend/scraper/text_stream.py
 *
 * Takes a stream of TextChunks and merges adjacent ones using a pluggable
 * CombineChunksStrategy, respecting a target token budget per chunk.
 */

import { encodingForModel, type TiktokenModel } from 'js-tiktoken';
import type { CombineChunksStrategy, CombineContext, TextChunk } from './types.js';

export interface ReduceChunksOptions {
  /** Tiktoken model name for tokenization. Default: "gpt-4o" */
  tokenizerModel?: TiktokenModel;
  /** Target token count per merged chunk. Default: 256 */
  targetChunkSize?: number;
}

/**
 * Reduces an iterable of small chunks into larger, token-bounded chunks.
 *
 * This is the core algorithm from TextIngest.reduce_chunks() — iterate chunks,
 * encode with tiktoken, call strategy.combine(), emit when full.
 */
export function* reduceChunks<T>(
  chunks: Iterable<TextChunk<T>>,
  strategy: CombineChunksStrategy<T>,
  options: ReduceChunksOptions = {},
): Generator<TextChunk<T>> {
  const tokenizerModel = (options.tokenizerModel ?? 'gpt-4o') as TiktokenModel;
  const targetChunkSize = options.targetChunkSize ?? 256;

  const encoding = encodingForModel(tokenizerModel);
  const context: CombineContext = { tokenizerModel, targetChunkSize, encoding };

  let currentChunk: TextChunk<T> | null = null;

  for (const chunk of chunks) {
    chunk.encoded = encoding.encode(chunk.text);

    if (currentChunk === null) {
      currentChunk = chunk;
      continue;
    }

    if ((currentChunk.encoded?.length ?? 0) + chunk.encoded.length <= targetChunkSize) {
      const combined = strategy.combine(currentChunk, chunk, context);

      // Emit all but the last
      for (let i = 0; i < combined.length - 1; i++) {
        const emitChunk = combined[i]!;
        if (emitChunk.encoded == null) {
          emitChunk.encoded = encoding.encode(emitChunk.text);
        }
        yield emitChunk;
      }

      if (combined.length > 0) {
        currentChunk = combined[combined.length - 1]!;
        if (currentChunk.encoded == null) {
          currentChunk.encoded = encoding.encode(currentChunk.text);
        }
      } else {
        currentChunk = null;
      }
    } else {
      // Current chunk is full — emit it, start fresh
      yield currentChunk;
      currentChunk = chunk;
    }
  }

  // Flush remaining
  const endFn = strategy.end ?? defaultEnd;
  yield* endFn(currentChunk, context);
}

function defaultEnd<T>(
  chunk: TextChunk<T> | null,
  _context: CombineContext,
): TextChunk<T>[] {
  return chunk ? [chunk] : [];
}
