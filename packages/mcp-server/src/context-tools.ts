/**
 * MCP Tools for Context Operations
 *
 * Tools for reading, writing, and searching context files.
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ContextEngine, type Layer, type Viewer } from '@human-os/core';

/**
 * Tool definitions for context operations
 */
export const contextTools: Tool[] = [
  {
    name: 'context_read',
    description: 'Read a context file by path. Returns markdown content with parsed frontmatter.',
    inputSchema: {
      type: 'object',
      properties: {
        layer: {
          type: 'string',
          description: 'Privacy layer (e.g., "public", "founder:justin", "renubu:tenant-abc")',
        },
        folder: {
          type: 'string',
          description: 'Folder within the layer (e.g., "people", "goals", "voice")',
        },
        slug: {
          type: 'string',
          description: 'File slug without .md extension (e.g., "scott-leese")',
        },
      },
      required: ['layer', 'folder', 'slug'],
    },
  },
  {
    name: 'context_write',
    description: 'Create or update a context file. Wiki links [[like this]] are automatically parsed and indexed.',
    inputSchema: {
      type: 'object',
      properties: {
        layer: {
          type: 'string',
          description: 'Privacy layer to write to',
        },
        folder: {
          type: 'string',
          description: 'Folder within the layer',
        },
        slug: {
          type: 'string',
          description: 'File slug without .md extension',
        },
        content: {
          type: 'string',
          description: 'Markdown content with optional YAML frontmatter',
        },
      },
      required: ['layer', 'folder', 'slug', 'content'],
    },
  },
  {
    name: 'context_delete',
    description: 'Delete a context file',
    inputSchema: {
      type: 'object',
      properties: {
        layer: {
          type: 'string',
          description: 'Privacy layer',
        },
        folder: {
          type: 'string',
          description: 'Folder within the layer',
        },
        slug: {
          type: 'string',
          description: 'File slug without .md extension',
        },
      },
      required: ['layer', 'folder', 'slug'],
    },
  },
  {
    name: 'context_list',
    description: 'List context files in a folder',
    inputSchema: {
      type: 'object',
      properties: {
        layer: {
          type: 'string',
          description: 'Privacy layer',
        },
        folder: {
          type: 'string',
          description: 'Folder to list',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of files to return (default: 50)',
        },
      },
      required: ['layer', 'folder'],
    },
  },
  {
    name: 'context_search',
    description: 'Search context files by content',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'context_merged',
    description: 'Get merged context from all accessible layers for an entity',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Entity slug to get merged context for',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'context_backlinks',
    description: 'Get all files that link to a given entity via [[wiki links]]',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Entity slug to find backlinks for',
        },
      },
      required: ['slug'],
    },
  },
];

/**
 * Input validation schemas
 */
const ReadInputSchema = z.object({
  layer: z.string(),
  folder: z.string(),
  slug: z.string(),
});

const WriteInputSchema = z.object({
  layer: z.string(),
  folder: z.string(),
  slug: z.string(),
  content: z.string(),
});

const DeleteInputSchema = z.object({
  layer: z.string(),
  folder: z.string(),
  slug: z.string(),
});

const ListInputSchema = z.object({
  layer: z.string(),
  folder: z.string(),
  limit: z.number().optional(),
});

const SearchInputSchema = z.object({
  query: z.string(),
  limit: z.number().optional(),
});

const MergedInputSchema = z.object({
  slug: z.string(),
});

const BacklinksInputSchema = z.object({
  slug: z.string(),
});

/**
 * Handle context tool calls
 */
export async function handleContextTool(
  toolName: string,
  args: Record<string, unknown>,
  contextEngine: ContextEngine
): Promise<unknown> {
  switch (toolName) {
    case 'context_read': {
      const input = ReadInputSchema.parse(args);
      const result = await contextEngine.getContext(
        input.layer as Layer,
        input.folder,
        input.slug
      );
      if (!result) {
        return { error: 'File not found' };
      }
      return {
        filePath: result.filePath,
        frontmatter: result.frontmatter,
        content: result.content,
        entityId: result.entityId,
      };
    }

    case 'context_write': {
      const input = WriteInputSchema.parse(args);
      const result = await contextEngine.saveContext(
        input.layer as Layer,
        input.folder,
        input.slug,
        input.content
      );
      return {
        success: true,
        filePath: result.filePath,
        entityId: result.entityId,
      };
    }

    case 'context_delete': {
      const input = DeleteInputSchema.parse(args);
      await contextEngine.deleteContext(
        input.layer as Layer,
        input.folder,
        input.slug
      );
      return { success: true };
    }

    case 'context_list': {
      const input = ListInputSchema.parse(args);
      const results = await contextEngine.listFiles(
        input.layer as Layer,
        input.folder,
        { limit: input.limit }
      );
      return {
        files: results.map(f => ({
          filePath: f.filePath,
          frontmatter: f.frontmatter,
        })),
      };
    }

    case 'context_search': {
      const input = SearchInputSchema.parse(args);
      const results = await contextEngine.searchContext(input.query, {
        limit: input.limit,
      });
      return {
        results: results.map(f => ({
          filePath: f.filePath,
          frontmatter: f.frontmatter,
          snippet: f.content.slice(0, 200),
        })),
      };
    }

    case 'context_merged': {
      const input = MergedInputSchema.parse(args);
      const result = await contextEngine.getMergedContext(input.slug);
      if (!result) {
        return { error: 'Entity not found' };
      }
      return {
        entity: result.entity,
        layers: result.layers.map(l => ({
          layer: l.layer,
          frontmatter: l.frontmatter,
          contentPreview: l.content.slice(0, 500),
        })),
        connections: {
          incoming: result.connections.incoming.length,
          outgoing: result.connections.outgoing.length,
        },
      };
    }

    case 'context_backlinks': {
      const input = BacklinksInputSchema.parse(args);
      const results = await contextEngine.getBacklinks(input.slug);
      return {
        backlinks: results.map(l => ({
          sourceSlug: l.sourceSlug,
          linkText: l.linkText,
          contextSnippet: l.contextSnippet,
        })),
      };
    }

    default:
      throw new Error(`Unknown context tool: ${toolName}`);
  }
}
