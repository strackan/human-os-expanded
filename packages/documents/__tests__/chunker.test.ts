import { describe, it, expect } from 'vitest';
import { reduceChunks } from '../src/chunker.js';
import type { CombineChunksStrategy, TextChunk } from '../src/types.js';

// Simple strategy: concatenate text with newlines, merge metadata
const simpleMerge: CombineChunksStrategy<{ id: number }> = {
  combine(chunk1, chunk2) {
    return [
      {
        text: `${chunk1.text}\n${chunk2.text}`,
        metadata: { id: chunk1.metadata.id },
      },
    ];
  },
};

// Strategy that refuses to combine (always emits separately)
const neverMerge: CombineChunksStrategy<{ id: number }> = {
  combine(chunk1, chunk2) {
    return [chunk1, chunk2];
  },
};

function makeChunks(count: number, textSize = 'small'): TextChunk<{ id: number }>[] {
  const word = textSize === 'small' ? 'hello' : 'hello '.repeat(100);
  return Array.from({ length: count }, (_, i) => ({
    text: `${word} ${i}`,
    metadata: { id: i },
  }));
}

describe('reduceChunks', () => {
  it('merges small chunks into larger ones', () => {
    const chunks = makeChunks(5);
    const result = [...reduceChunks(chunks, simpleMerge, { targetChunkSize: 256 })];
    // All 5 small chunks should merge into 1
    expect(result.length).toBeLessThan(5);
    expect(result[0]!.text).toContain('hello 0');
    expect(result[0]!.text).toContain('hello 4');
  });

  it('emits chunks when they exceed target size', () => {
    const chunks = makeChunks(5, 'small');
    const result = [...reduceChunks(chunks, simpleMerge, { targetChunkSize: 5 })];
    // With tiny target, most chunks should emit individually
    expect(result.length).toBeGreaterThan(1);
  });

  it('handles empty input', () => {
    const result = [...reduceChunks([], simpleMerge)];
    expect(result).toEqual([]);
  });

  it('handles single chunk', () => {
    const chunks = makeChunks(1);
    const result = [...reduceChunks(chunks, simpleMerge)];
    expect(result).toHaveLength(1);
    expect(result[0]!.text).toBe('hello 0');
  });

  it('respects neverMerge strategy', () => {
    const chunks = makeChunks(3);
    const result = [...reduceChunks(chunks, neverMerge, { targetChunkSize: 256 })];
    expect(result).toHaveLength(3);
  });

  it('sets encoded property on all output chunks', () => {
    const chunks = makeChunks(3);
    const result = [...reduceChunks(chunks, simpleMerge, { targetChunkSize: 256 })];
    for (const chunk of result) {
      expect(chunk.encoded).toBeDefined();
      expect(Array.isArray(chunk.encoded)).toBe(true);
    }
  });
});
