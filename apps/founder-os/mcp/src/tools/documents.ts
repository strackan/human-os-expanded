/**
 * Documents Tool Module
 *
 * Wraps @human-os/documents as a tool module inside founder-os/mcp.
 * Provides PDF, HTML, Slack, and text extraction + metadata scanning.
 *
 * The standalone documents-mcp server remains for direct Renubu usage.
 * Both share the same @human-os/documents core library.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler } from '../lib/context.js';
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

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const documentTools: Tool[] = [
  {
    name: 'extract_pdf',
    description: 'Extract text from a PDF. Returns chunked text with page metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Base64-encoded PDF content',
        },
        fileName: {
          type: 'string',
          description: 'Original filename',
        },
        chunkSize: {
          type: 'number',
          description: 'Target tokens per chunk (default: 256)',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'extract_html',
    description: 'Extract main text content from HTML using cascading selectors.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Raw HTML content',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'extract_slack',
    description: 'Parse a Slack export ZIP and extract messages as chunked text.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Base64-encoded Slack export ZIP',
        },
        chunkSize: {
          type: 'number',
          description: 'Target tokens per chunk (default: 256)',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'extract_text',
    description: 'Split plain text into token-bounded chunks with overlap.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Plain text to split',
        },
        chunkSize: {
          type: 'number',
          description: 'Target tokens per chunk (default: 256)',
        },
        chunkOverlap: {
          type: 'number',
          description: 'Token overlap between chunks (default: 20)',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'scan_metadata',
    description: 'Extract metadata from text using regex patterns defined in a JSON schema.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to scan',
        },
        schema: {
          type: 'object',
          description: 'JSON Schema with aux_data.scan_regex properties',
        },
      },
      required: ['text', 'schema'],
    },
  },
  {
    name: 'parse_prompt',
    description: 'Parse a Handlebars prompt template and extract variable names.',
    inputSchema: {
      type: 'object',
      properties: {
        template: {
          type: 'string',
          description: 'Handlebars template string',
        },
      },
      required: ['template'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export const handleDocumentTools: ToolHandler = async (
  name: string,
  args: Record<string, unknown>,
): Promise<unknown | null> => {
  switch (name) {
    case 'extract_pdf': {
      const content = args.content as string;
      const fileName = (args.fileName as string) ?? 'document.pdf';
      const chunkSize = (args.chunkSize as number) ?? 256;

      const buffer = Buffer.from(content, 'base64');
      const pageChunks = await readPdfChunks(buffer, fileName);
      const merged = [...reduceChunks(pageChunks, pdfCombineStrategy, {
        targetChunkSize: chunkSize,
      })];

      return {
        chunks: merged.map(({ text, metadata }) => ({ text, metadata })),
        pageCount: pageChunks.length,
        title: pageChunks[0]?.metadata.title ?? null,
      };
    }

    case 'extract_html': {
      const content = args.content as string;
      const result = extractHtml(content);
      return {
        text: result.text,
        title: result.metadata.title,
      };
    }

    case 'extract_slack': {
      const content = args.content as string;
      const chunkSize = (args.chunkSize as number) ?? 256;

      const buffer = Buffer.from(content, 'base64');
      const rawChunks = readSlackChunks(buffer);
      const merged = [...reduceChunks(rawChunks, slackCombineStrategy, {
        targetChunkSize: chunkSize,
      })];

      const channels = [...new Set(merged.map((c) => c.metadata.channel))];
      const userCount = new Set(merged.flatMap((c) => c.metadata.users)).size;

      return {
        chunks: merged.map(({ text, metadata }) => ({ text, metadata })),
        channels,
        userCount,
      };
    }

    case 'extract_text': {
      const content = args.content as string;
      const chunkSize = args.chunkSize as number | undefined;
      const chunkOverlap = args.chunkOverlap as number | undefined;

      const chunks = splitText(content, { chunkSize, chunkOverlap });
      return {
        chunks: chunks.map((c: { text: string; metadata: unknown }) => ({ text: c.text, metadata: c.metadata })),
      };
    }

    case 'scan_metadata': {
      const text = args.text as string;
      const schema = args.schema as Record<string, unknown>;
      const extracted = scanMetadata(text, schema);
      return { extracted };
    }

    case 'parse_prompt': {
      const template = args.template as string;
      return parsePromptTemplate(template);
    }

    default:
      return null;
  }
};
