/**
 * Token-based text splitting.
 * Ported from fancyrobot-cloud/backend/fancyrobot_backend/scraper/txt.py
 *
 * Replaces LangChain's TokenTextSplitter with a pure js-tiktoken implementation.
 */

import { encodingForModel, type TiktokenModel } from 'js-tiktoken';
import type { TextChunk } from '../types.js';

export interface TextChunkMetadata {
  chunkIndex: number;
  totalChunks: number;
}

export interface SplitTextOptions {
  /** Target tokens per chunk. Default: 256 */
  chunkSize?: number;
  /** Token overlap between chunks. Default: 20 */
  chunkOverlap?: number;
  /** Tiktoken model for tokenization. Default: "gpt-4o" */
  tokenizerModel?: TiktokenModel;
}

/**
 * Split text into token-bounded chunks with overlap.
 * Each chunk contains approximately `chunkSize` tokens with `chunkOverlap`
 * tokens shared between consecutive chunks.
 */
export function splitText(
  text: string,
  options: SplitTextOptions = {},
): TextChunk<TextChunkMetadata>[] {
  const chunkSize = options.chunkSize ?? 256;
  const chunkOverlap = options.chunkOverlap ?? 20;
  const model = (options.tokenizerModel ?? 'gpt-4o') as TiktokenModel;

  const encoding = encodingForModel(model);
  const tokens = encoding.encode(text);

  if (tokens.length <= chunkSize) {
    return [
      {
        text,
        metadata: { chunkIndex: 0, totalChunks: 1 },
        encoded: tokens,
      },
    ];
  }

  const chunks: TextChunk<TextChunkMetadata>[] = [];
  const step = Math.max(1, chunkSize - chunkOverlap);
  let i = 0;

  while (i < tokens.length) {
    const end = Math.min(i + chunkSize, tokens.length);
    const slice = tokens.slice(i, end);
    chunks.push({
      text: encoding.decode(slice),
      metadata: { chunkIndex: chunks.length, totalChunks: 0 }, // filled below
      encoded: slice,
    });
    if (end >= tokens.length) break;
    i += step;
  }

  // Backfill totalChunks
  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length;
  }

  return chunks;
}
