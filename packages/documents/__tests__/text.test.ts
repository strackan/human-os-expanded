import { describe, it, expect } from 'vitest';
import { splitText } from '../src/extractors/text.js';

describe('splitText', () => {
  it('returns single chunk for short text', () => {
    const result = splitText('Hello world');
    expect(result).toHaveLength(1);
    expect(result[0]!.text).toBe('Hello world');
    expect(result[0]!.metadata.chunkIndex).toBe(0);
    expect(result[0]!.metadata.totalChunks).toBe(1);
  });

  it('splits long text into multiple chunks', () => {
    const longText = 'word '.repeat(500);
    const result = splitText(longText, { chunkSize: 50 });
    expect(result.length).toBeGreaterThan(1);
    // Each chunk should have encoded tokens
    for (const chunk of result) {
      expect(chunk.encoded).toBeDefined();
      expect(chunk.encoded!.length).toBeLessThanOrEqual(50);
    }
  });

  it('sets correct totalChunks on all chunks', () => {
    const longText = 'word '.repeat(500);
    const result = splitText(longText, { chunkSize: 50 });
    for (const chunk of result) {
      expect(chunk.metadata.totalChunks).toBe(result.length);
    }
  });

  it('sets sequential chunkIndex', () => {
    const longText = 'word '.repeat(500);
    const result = splitText(longText, { chunkSize: 50 });
    result.forEach((chunk, i) => {
      expect(chunk.metadata.chunkIndex).toBe(i);
    });
  });

  it('respects chunkOverlap', () => {
    const longText = 'word '.repeat(200);
    const withOverlap = splitText(longText, { chunkSize: 50, chunkOverlap: 20 });
    const withoutOverlap = splitText(longText, { chunkSize: 50, chunkOverlap: 0 });
    // More chunks with overlap since step is smaller
    expect(withOverlap.length).toBeGreaterThan(withoutOverlap.length);
  });
});
