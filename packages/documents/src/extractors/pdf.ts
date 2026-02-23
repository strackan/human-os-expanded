/**
 * PDF text extraction and chunking.
 * Ported from fancyrobot-cloud/backend/fancyrobot_backend/scraper/pdf.py
 *
 * Uses pdf-parse to extract per-page text, then yields one TextChunk per page
 * that can be fed into reduceChunks() with PdfCombineStrategy.
 */

import type { CombineChunksStrategy, CombineContext, TextChunk } from '../types.js';

export interface PdfChunkMetadata {
  pageStart: number;
  pageEnd: number;
  fileName: string;
  title: string | null;
  secondaryTitle: string | null;
  pageCount: number;
}

export type PdfChunk = TextChunk<PdfChunkMetadata>;

/**
 * Strategy that merges adjacent PDF page chunks within token budget.
 * When chunks span multiple pages, metadata tracks the page range.
 * If combined tokens exceed target, splits at the boundary.
 */
export const pdfCombineStrategy: CombineChunksStrategy<PdfChunkMetadata> = {
  combine(
    chunk1: PdfChunk,
    chunk2: PdfChunk,
    context: CombineContext,
  ): PdfChunk[] {
    // Don't merge chunks from different files
    if (chunk1.metadata.fileName !== chunk2.metadata.fileName) {
      return [chunk1, chunk2];
    }

    const combined = [...(chunk1.encoded ?? []), ...(chunk2.encoded ?? [])];

    if (combined.length <= context.targetChunkSize) {
      return [
        {
          text: chunk1.text + chunk2.text,
          metadata: {
            pageStart: chunk1.metadata.pageStart,
            pageEnd: chunk2.metadata.pageEnd,
            fileName: chunk1.metadata.fileName,
            title: chunk1.metadata.title,
            secondaryTitle: chunk1.metadata.secondaryTitle,
            pageCount: chunk1.metadata.pageCount,
          },
          encoded: combined,
        },
      ];
    }

    // Split at target boundary
    const firstCodes = combined.slice(0, context.targetChunkSize);
    const secondCodes = combined.slice(context.targetChunkSize);
    return [
      {
        text: context.encoding.decode(firstCodes),
        metadata: {
          pageStart: chunk1.metadata.pageStart,
          pageEnd: chunk1.metadata.pageEnd,
          fileName: chunk1.metadata.fileName,
          title: chunk1.metadata.title,
          secondaryTitle: chunk1.metadata.secondaryTitle,
          pageCount: chunk1.metadata.pageCount,
        },
        encoded: firstCodes,
      },
      {
        text: context.encoding.decode(secondCodes),
        metadata: chunk2.metadata,
        encoded: secondCodes,
      },
    ];
  },
};

/**
 * Extract the secondary title from the first page (second line of text).
 */
function getSecondaryTitle(firstPageText: string): string | null {
  const lines = firstPageText.split('\n');
  return lines.length > 1 ? (lines[1] ?? null) : null;
}

/**
 * Read a PDF buffer and yield one TextChunk per page.
 * Feed the result into reduceChunks(chunks, pdfCombineStrategy) to merge.
 */
export async function readPdfChunks(
  buffer: Buffer,
  fileName = 'document.pdf',
): Promise<PdfChunk[]> {
  // pdf-parse is CJS — dynamic import for ESM compat
  const pdfParse = (await import('pdf-parse')).default;

  const pages: { pageNum: number; text: string }[] = [];

  // Use the pagerender callback to get per-page text
  await pdfParse(buffer, {
    pagerender(pageData: { getTextContent: () => Promise<{ items: Array<{ str: string }> }> }) {
      return pageData.getTextContent().then((content) => {
        const text = content.items.map((item) => item.str).join(' ');
        pages.push({ pageNum: pages.length + 1, text });
        return text;
      });
    },
  });

  const pageCount = pages.length;
  const title = null; // pdf-parse doesn't reliably expose metadata.title
  const secondaryTitle = pages.length > 0 ? getSecondaryTitle(pages[0]!.text) : null;

  return pages.map((page) => ({
    text: page.text,
    metadata: {
      pageStart: page.pageNum,
      pageEnd: page.pageNum,
      fileName,
      title,
      secondaryTitle,
      pageCount,
    },
  }));
}
