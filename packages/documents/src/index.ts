/**
 * @human-os/documents — Document extraction and chunking
 *
 * Pure-TypeScript library for extracting text from PDFs, HTML, Slack exports,
 * and plain text. Provides token-aware chunking and regex metadata scanning.
 */

// Core types
export type {
  TextChunk,
  CombineContext,
  CombineChunksStrategy,
} from './types.js';
export { chunkToRecord } from './types.js';

// Chunker
export { reduceChunks } from './chunker.js';
export type { ReduceChunksOptions } from './chunker.js';

// Extractors
export { readPdfChunks, pdfCombineStrategy } from './extractors/pdf.js';
export type { PdfChunkMetadata, PdfChunk } from './extractors/pdf.js';

export { extractHtml } from './extractors/html.js';
export type { HtmlChunkMetadata, HtmlChunk } from './extractors/html.js';

export { readSlackChunks, slackCombineStrategy } from './extractors/slack.js';
export type { SlackChunkMetadata, SlackChunk } from './extractors/slack.js';

export { splitText } from './extractors/text.js';
export type { TextChunkMetadata, SplitTextOptions } from './extractors/text.js';

// Metadata
export { scanMetadata } from './metadata.js';
export type { MetadataSchema, SchemaProperty, AuxData } from './metadata.js';

// Prompts
export { parsePromptTemplate } from './prompts.js';
export type { PromptInfo } from './prompts.js';
