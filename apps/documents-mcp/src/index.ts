/**
 * documents-mcp — MCP server for document extraction tools.
 *
 * Wraps @human-os/documents in MCP tools accessible via stdio transport.
 * Each tool maps 1:1 to a package function.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  readPdfChunks,
  pdfCombineStrategy,
  extractHtml,
  readSlackChunks,
  slackCombineStrategy,
  splitText,
  scanMetadata,
  parsePromptTemplate,
  reduceChunks,
} from '@human-os/documents';

const server = new McpServer({
  name: 'documents-mcp',
  version: '0.1.0',
});

// ─── extract_pdf ─────────────────────────────────────────────────────────────

server.tool(
  'extract_pdf',
  'Extract text from a PDF. Returns chunked text with page metadata.',
  {
    content: z.string().describe('Base64-encoded PDF content'),
    fileName: z.string().optional().describe('Original filename'),
    chunkSize: z.number().optional().describe('Target tokens per chunk (default: 256)'),
  },
  async ({ content, fileName, chunkSize }) => {
    const buffer = Buffer.from(content, 'base64');
    const pageChunks = await readPdfChunks(buffer, fileName ?? 'document.pdf');
    const merged = [...reduceChunks(pageChunks, pdfCombineStrategy, {
      targetChunkSize: chunkSize ?? 256,
    })];

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            chunks: merged.map(({ text, metadata }) => ({ text, metadata })),
            pageCount: pageChunks.length,
            title: pageChunks[0]?.metadata.title ?? null,
          }),
        },
      ],
    };
  },
);

// ─── extract_html ────────────────────────────────────────────────────────────

server.tool(
  'extract_html',
  'Extract main text content from HTML using cascading selectors.',
  {
    content: z.string().describe('Raw HTML content'),
  },
  async ({ content }) => {
    const result = extractHtml(content);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            text: result.text,
            title: result.metadata.title,
          }),
        },
      ],
    };
  },
);

// ─── extract_slack ───────────────────────────────────────────────────────────

server.tool(
  'extract_slack',
  'Parse a Slack export ZIP and extract messages as chunked text.',
  {
    content: z.string().describe('Base64-encoded Slack export ZIP'),
    chunkSize: z.number().optional().describe('Target tokens per chunk (default: 256)'),
  },
  async ({ content, chunkSize }) => {
    const buffer = Buffer.from(content, 'base64');
    const rawChunks = readSlackChunks(buffer);
    const merged = [...reduceChunks(rawChunks, slackCombineStrategy, {
      targetChunkSize: chunkSize ?? 256,
    })];

    const channels = [...new Set(merged.map((c) => c.metadata.channel))];
    const userCount = new Set(merged.flatMap((c) => c.metadata.users)).size;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            chunks: merged.map(({ text, metadata }) => ({ text, metadata })),
            channels,
            userCount,
          }),
        },
      ],
    };
  },
);

// ─── extract_text ────────────────────────────────────────────────────────────

server.tool(
  'extract_text',
  'Split plain text into token-bounded chunks with overlap.',
  {
    content: z.string().describe('Plain text to split'),
    chunkSize: z.number().optional().describe('Target tokens per chunk (default: 256)'),
    chunkOverlap: z.number().optional().describe('Token overlap between chunks (default: 20)'),
  },
  async ({ content, chunkSize, chunkOverlap }) => {
    const chunks = splitText(content, { chunkSize, chunkOverlap });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            chunks: chunks.map(({ text, metadata }) => ({ text, metadata })),
          }),
        },
      ],
    };
  },
);

// ─── scan_metadata ───────────────────────────────────────────────────────────

server.tool(
  'scan_metadata',
  'Extract metadata from text using regex patterns defined in a JSON schema.',
  {
    text: z.string().describe('Text to scan'),
    schema: z.record(z.unknown()).describe('JSON Schema with aux_data.scan_regex properties'),
  },
  async ({ text, schema }) => {
    const extracted = scanMetadata(text, schema as Record<string, unknown>);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ extracted }),
        },
      ],
    };
  },
);

// ─── parse_prompt ────────────────────────────────────────────────────────────

server.tool(
  'parse_prompt',
  'Parse a Handlebars prompt template and extract variable names.',
  {
    template: z.string().describe('Handlebars template string'),
  },
  async ({ template }) => {
    const info = parsePromptTemplate(template);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(info),
        },
      ],
    };
  },
);

// ─── Start server ────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
