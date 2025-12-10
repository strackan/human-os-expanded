/**
 * MCP Tools for Knowledge Graph Operations
 *
 * Tools for traversing and querying the entity relationship graph.
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { KnowledgeGraph, type Layer, type LinkType, type EntityType } from '@human-os/core';

/**
 * Tool definitions for graph operations
 */
export const graphTools: Tool[] = [
  {
    name: 'graph_connections',
    description: 'Get all entities connected to a given entity',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Entity slug to get connections for',
        },
        direction: {
          type: 'string',
          enum: ['outgoing', 'incoming', 'both'],
          description: 'Direction of connections (default: both)',
        },
        linkTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by link types (e.g., ["wiki_link", "works_at"])',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'graph_traverse',
    description: 'Traverse the knowledge graph from a starting entity',
    inputSchema: {
      type: 'object',
      properties: {
        startSlug: {
          type: 'string',
          description: 'Starting entity slug',
        },
        maxDepth: {
          type: 'number',
          description: 'Maximum traversal depth (default: 2)',
        },
        linkTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by link types',
        },
        entityTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by entity types',
        },
      },
      required: ['startSlug'],
    },
  },
  {
    name: 'graph_find_path',
    description: 'Find the shortest path between two entities',
    inputSchema: {
      type: 'object',
      properties: {
        startSlug: {
          type: 'string',
          description: 'Starting entity slug',
        },
        endSlug: {
          type: 'string',
          description: 'Target entity slug',
        },
        maxDepth: {
          type: 'number',
          description: 'Maximum path length (default: 5)',
        },
      },
      required: ['startSlug', 'endSlug'],
    },
  },
  {
    name: 'graph_backlinks',
    description: 'Get all entities that link TO a given entity',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Target entity slug',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'graph_outgoing',
    description: 'Get all entities that a given entity links TO',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Source entity slug',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'graph_create_link',
    description: 'Create a relationship between two entities',
    inputSchema: {
      type: 'object',
      properties: {
        sourceSlug: {
          type: 'string',
          description: 'Source entity slug',
        },
        targetSlug: {
          type: 'string',
          description: 'Target entity slug',
        },
        linkType: {
          type: 'string',
          enum: ['wiki_link', 'mentions', 'child_of', 'related_to', 'works_at', 'contacts', 'owns', 'assigned_to', 'part_of'],
          description: 'Type of relationship',
        },
        layer: {
          type: 'string',
          description: 'Privacy layer for the link (default: public)',
        },
        strength: {
          type: 'number',
          description: 'Link strength 0.0-1.0 (default: 1.0)',
        },
      },
      required: ['sourceSlug', 'targetSlug', 'linkType'],
    },
  },
  {
    name: 'graph_related',
    description: 'Get entities related to a set of entities (for recommendations)',
    inputSchema: {
      type: 'object',
      properties: {
        slugs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Entity slugs to find related entities for',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)',
        },
        excludeTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Entity types to exclude from results',
        },
      },
      required: ['slugs'],
    },
  },
];

/**
 * Input validation schemas
 */
const ConnectionsInputSchema = z.object({
  slug: z.string(),
  direction: z.enum(['outgoing', 'incoming', 'both']).optional(),
  linkTypes: z.array(z.string()).optional(),
});

const TraverseInputSchema = z.object({
  startSlug: z.string(),
  maxDepth: z.number().optional(),
  linkTypes: z.array(z.string()).optional(),
  entityTypes: z.array(z.string()).optional(),
});

const FindPathInputSchema = z.object({
  startSlug: z.string(),
  endSlug: z.string(),
  maxDepth: z.number().optional(),
});

const BacklinksInputSchema = z.object({
  slug: z.string(),
});

const OutgoingInputSchema = z.object({
  slug: z.string(),
});

const CreateLinkInputSchema = z.object({
  sourceSlug: z.string(),
  targetSlug: z.string(),
  linkType: z.string(),
  layer: z.string().optional(),
  strength: z.number().optional(),
});

const RelatedInputSchema = z.object({
  slugs: z.array(z.string()),
  limit: z.number().optional(),
  excludeTypes: z.array(z.string()).optional(),
});

/**
 * Handle graph tool calls
 */
export async function handleGraphTool(
  toolName: string,
  args: Record<string, unknown>,
  knowledgeGraph: KnowledgeGraph
): Promise<unknown> {
  switch (toolName) {
    case 'graph_connections': {
      const input = ConnectionsInputSchema.parse(args);
      const result = await knowledgeGraph.getConnections(input.slug, {
        direction: input.direction,
        linkTypes: input.linkTypes as LinkType[],
      });
      return {
        edges: result.edges.map(e => ({
          sourceSlug: e.sourceSlug,
          targetSlug: e.targetSlug,
          linkType: e.linkType,
          strength: e.strength,
        })),
        nodes: result.nodes.map(n => ({
          slug: n.slug,
          name: n.name,
          entityType: n.entityType,
        })),
      };
    }

    case 'graph_traverse': {
      const input = TraverseInputSchema.parse(args);
      const result = await knowledgeGraph.traverse({
        startSlug: input.startSlug,
        maxDepth: input.maxDepth,
        linkTypes: input.linkTypes as LinkType[],
        entityTypes: input.entityTypes as EntityType[],
      });
      return {
        nodes: result.nodes.map(n => ({
          slug: n.slug,
          name: n.name,
          entityType: n.entityType,
        })),
        edges: result.edges.length,
        paths: result.paths,
      };
    }

    case 'graph_find_path': {
      const input = FindPathInputSchema.parse(args);
      const path = await knowledgeGraph.findPath(
        input.startSlug,
        input.endSlug,
        { maxDepth: input.maxDepth }
      );
      return {
        found: path !== null,
        path: path,
        length: path ? path.length : null,
      };
    }

    case 'graph_backlinks': {
      const input = BacklinksInputSchema.parse(args);
      const links = await knowledgeGraph.getBacklinks(input.slug);
      return {
        backlinks: links.map(l => ({
          sourceSlug: l.sourceSlug,
          linkType: l.linkType,
          linkText: l.linkText,
        })),
      };
    }

    case 'graph_outgoing': {
      const input = OutgoingInputSchema.parse(args);
      const links = await knowledgeGraph.getOutgoingLinks(input.slug);
      return {
        outgoing: links.map(l => ({
          targetSlug: l.targetSlug,
          linkType: l.linkType,
          linkText: l.linkText,
        })),
      };
    }

    case 'graph_create_link': {
      const input = CreateLinkInputSchema.parse(args);
      await knowledgeGraph.createLink(
        input.sourceSlug,
        input.targetSlug,
        input.linkType as LinkType,
        {
          layer: input.layer as Layer,
          strength: input.strength,
        }
      );
      return { success: true };
    }

    case 'graph_related': {
      const input = RelatedInputSchema.parse(args);
      const related = await knowledgeGraph.getRelatedEntities(input.slugs, {
        limit: input.limit,
        excludeTypes: input.excludeTypes as EntityType[],
      });
      return {
        related: related.map(n => ({
          slug: n.slug,
          name: n.name,
          entityType: n.entityType,
        })),
      };
    }

    default:
      throw new Error(`Unknown graph tool: ${toolName}`);
  }
}
