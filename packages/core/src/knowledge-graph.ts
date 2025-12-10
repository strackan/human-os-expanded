/**
 * Knowledge Graph
 *
 * Manages entity relationships and graph traversal operations.
 * Provides backlinks, connections, and path finding between entities.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Layer,
  EntityLink,
  GraphNode,
  GraphEdge,
  GraphQuery,
  GraphTraversalResult,
  LinkType,
  EntityType,
  KnowledgeGraphConfig,
} from './types.js';
import {
  createSupabaseClient,
  TABLES,
  type DatabaseEntity,
  type DatabaseEntityLink,
} from './supabase-client.js';

export class KnowledgeGraph {
  private supabase: SupabaseClient;
  private defaultLayers: Layer[];

  constructor(config: KnowledgeGraphConfig) {
    this.supabase = createSupabaseClient(config);
    this.defaultLayers = config.defaultLayers || ['public'];
  }

  /**
   * Get an entity node by ID
   */
  async getNode(id: string): Promise<GraphNode | null> {
    const { data } = await this.supabase
      .from(TABLES.ENTITIES)
      .select('id, entity_type, name, slug, metadata')
      .eq('id', id)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      entityType: data.entity_type as EntityType,
      name: data.name,
      slug: data.slug || '',
      metadata: data.metadata as Record<string, unknown>,
    };
  }

  /**
   * Get an entity node by slug
   */
  async getNodeBySlug(slug: string): Promise<GraphNode | null> {
    const { data } = await this.supabase
      .from(TABLES.ENTITIES)
      .select('id, entity_type, name, slug, metadata')
      .eq('slug', slug)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      entityType: data.entity_type as EntityType,
      name: data.name,
      slug: data.slug || '',
      metadata: data.metadata as Record<string, unknown>,
    };
  }

  /**
   * Get all connections from a node
   */
  async getConnections(
    nodeSlug: string,
    options?: {
      direction?: 'outgoing' | 'incoming' | 'both';
      linkTypes?: LinkType[];
      layers?: Layer[];
    }
  ): Promise<{ edges: GraphEdge[]; nodes: GraphNode[] }> {
    const direction = options?.direction || 'both';
    const layers = options?.layers || this.defaultLayers;
    const edges: GraphEdge[] = [];
    const nodeIds = new Set<string>();

    // Get outgoing links
    if (direction === 'outgoing' || direction === 'both') {
      let query = this.supabase
        .from(TABLES.ENTITY_LINKS)
        .select('*')
        .eq('source_slug', nodeSlug)
        .in('layer', layers);

      if (options?.linkTypes?.length) {
        query = query.in('link_type', options.linkTypes);
      }

      const { data: outgoing } = await query;
      if (outgoing) {
        for (const link of outgoing) {
          edges.push(this.mapDatabaseLinkToEdge(link));
          // We'll resolve target slug to ID below
        }
      }
    }

    // Get incoming links
    if (direction === 'incoming' || direction === 'both') {
      let query = this.supabase
        .from(TABLES.ENTITY_LINKS)
        .select('*')
        .eq('target_slug', nodeSlug)
        .in('layer', layers);

      if (options?.linkTypes?.length) {
        query = query.in('link_type', options.linkTypes);
      }

      const { data: incoming } = await query;
      if (incoming) {
        for (const link of incoming) {
          edges.push(this.mapDatabaseLinkToEdge(link));
        }
      }
    }

    // Get all connected slugs
    const connectedSlugs = new Set<string>();
    for (const edge of edges) {
      if (edge.sourceSlug !== nodeSlug) connectedSlugs.add(edge.sourceSlug);
      if (edge.targetSlug !== nodeSlug) connectedSlugs.add(edge.targetSlug);
    }

    // Fetch connected nodes
    const nodes: GraphNode[] = [];
    if (connectedSlugs.size > 0) {
      const { data: nodesData } = await this.supabase
        .from(TABLES.ENTITIES)
        .select('id, entity_type, name, slug, metadata')
        .in('slug', Array.from(connectedSlugs));

      if (nodesData) {
        for (const n of nodesData) {
          nodes.push({
            id: n.id,
            entityType: n.entity_type as EntityType,
            name: n.name,
            slug: n.slug || '',
            metadata: n.metadata as Record<string, unknown>,
          });
        }
      }
    }

    return { edges, nodes };
  }

  /**
   * Get backlinks to an entity (what links TO this)
   */
  async getBacklinks(slug: string, layers?: Layer[]): Promise<EntityLink[]> {
    const { data } = await this.supabase
      .from(TABLES.ENTITY_LINKS)
      .select('*')
      .eq('target_slug', slug)
      .in('layer', layers || this.defaultLayers);

    return (data || []).map(this.mapDatabaseLinkToEntityLink);
  }

  /**
   * Get outgoing links from an entity (what this links TO)
   */
  async getOutgoingLinks(slug: string, layers?: Layer[]): Promise<EntityLink[]> {
    const { data } = await this.supabase
      .from(TABLES.ENTITY_LINKS)
      .select('*')
      .eq('source_slug', slug)
      .in('layer', layers || this.defaultLayers);

    return (data || []).map(this.mapDatabaseLinkToEntityLink);
  }

  /**
   * Traverse the graph from a starting node using BFS
   */
  async traverse(query: GraphQuery): Promise<GraphTraversalResult> {
    const maxDepth = query.maxDepth || 2;
    const visited = new Set<string>();
    const allNodes: Map<string, GraphNode> = new Map();
    const allEdges: GraphEdge[] = [];
    const paths: string[][] = [];

    // Determine starting slug
    let startSlug: string;
    if (query.startSlug) {
      startSlug = query.startSlug;
    } else if (query.startNodeId) {
      const node = await this.getNode(query.startNodeId);
      if (!node) {
        return { nodes: [], edges: [], paths: [] };
      }
      startSlug = node.slug;
    } else {
      return { nodes: [], edges: [], paths: [] };
    }

    // BFS queue: [slug, currentPath, depth]
    const queue: [string, string[], number][] = [[startSlug, [startSlug], 0]];

    while (queue.length > 0) {
      const [currentSlug, path, depth] = queue.shift()!;

      if (visited.has(currentSlug)) continue;
      visited.add(currentSlug);

      // Get node
      const node = await this.getNodeBySlug(currentSlug);
      if (node) {
        // Filter by entity type if specified
        if (!query.entityTypes || query.entityTypes.includes(node.entityType)) {
          allNodes.set(currentSlug, node);
          paths.push(path);
        }
      }

      // Get connections if not at max depth
      if (depth < maxDepth) {
        const { edges } = await this.getConnections(currentSlug, {
          linkTypes: query.linkTypes,
        });

        for (const edge of edges) {
          allEdges.push(edge);
          const nextSlug = edge.sourceSlug === currentSlug ? edge.targetSlug : edge.sourceSlug;
          if (!visited.has(nextSlug)) {
            queue.push([nextSlug, [...path, nextSlug], depth + 1]);
          }
        }
      }
    }

    return {
      nodes: Array.from(allNodes.values()),
      edges: allEdges,
      paths,
    };
  }

  /**
   * Find shortest path between two entities
   */
  async findPath(
    startSlug: string,
    endSlug: string,
    options?: { maxDepth?: number; layers?: Layer[] }
  ): Promise<string[] | null> {
    const maxDepth = options?.maxDepth || 5;
    const visited = new Set<string>();
    const queue: [string, string[]][] = [[startSlug, [startSlug]]];

    while (queue.length > 0) {
      const [current, path] = queue.shift()!;

      if (current === endSlug) {
        return path;
      }

      if (path.length > maxDepth) continue;
      if (visited.has(current)) continue;
      visited.add(current);

      const { edges } = await this.getConnections(current, { layers: options?.layers });
      for (const edge of edges) {
        const next = edge.sourceSlug === current ? edge.targetSlug : edge.sourceSlug;
        if (!visited.has(next)) {
          queue.push([next, [...path, next]]);
        }
      }
    }

    return null;
  }

  /**
   * Create a link between two entities
   */
  async createLink(
    sourceSlug: string,
    targetSlug: string,
    linkType: LinkType,
    options?: {
      layer?: Layer;
      strength?: number;
      linkText?: string;
      contextSnippet?: string;
    }
  ): Promise<void> {
    const layer = options?.layer || 'public';

    await this.supabase
      .from(TABLES.ENTITY_LINKS)
      .upsert(
        {
          layer,
          source_slug: sourceSlug,
          target_slug: targetSlug,
          link_type: linkType,
          strength: options?.strength || 1.0,
          link_text: options?.linkText,
          context_snippet: options?.contextSnippet,
        },
        { onConflict: 'layer,source_slug,target_slug,link_type' }
      );
  }

  /**
   * Delete a link between two entities
   */
  async deleteLink(
    sourceSlug: string,
    targetSlug: string,
    linkType: LinkType,
    layer?: Layer
  ): Promise<void> {
    let query = this.supabase
      .from(TABLES.ENTITY_LINKS)
      .delete()
      .eq('source_slug', sourceSlug)
      .eq('target_slug', targetSlug)
      .eq('link_type', linkType);

    if (layer) {
      query = query.eq('layer', layer);
    }

    await query;
  }

  /**
   * Get entities related to a set of entities (for recommendations)
   */
  async getRelatedEntities(
    slugs: string[],
    options?: {
      limit?: number;
      excludeTypes?: EntityType[];
      layers?: Layer[];
    }
  ): Promise<GraphNode[]> {
    const limit = options?.limit || 10;
    const layers = options?.layers || this.defaultLayers;

    // Get all links from the given entities
    const { data: links } = await this.supabase
      .from(TABLES.ENTITY_LINKS)
      .select('target_slug')
      .in('source_slug', slugs)
      .in('layer', layers)
      .limit(limit * 2); // Get more to account for filtering

    if (!links || links.length === 0) return [];

    // Get unique target slugs, excluding the input slugs
    const targetSlugs = [...new Set(links.map(l => l.target_slug))]
      .filter(slug => !slugs.includes(slug))
      .slice(0, limit);

    // Fetch entities
    let query = this.supabase
      .from(TABLES.ENTITIES)
      .select('id, entity_type, name, slug, metadata')
      .in('slug', targetSlugs);

    if (options?.excludeTypes?.length) {
      query = query.not('entity_type', 'in', `(${options.excludeTypes.join(',')})`);
    }

    const { data: entities } = await query.limit(limit);

    return (entities || []).map(e => ({
      id: e.id,
      entityType: e.entity_type as EntityType,
      name: e.name,
      slug: e.slug || '',
      metadata: e.metadata as Record<string, unknown>,
    }));
  }

  /**
   * Map database link to GraphEdge
   */
  private mapDatabaseLinkToEdge(data: DatabaseEntityLink): GraphEdge {
    return {
      sourceId: '', // We don't have IDs in the link table, only slugs
      targetId: '',
      sourceSlug: data.source_slug,
      targetSlug: data.target_slug,
      linkType: data.link_type as LinkType,
      strength: data.strength,
    };
  }

  /**
   * Map database link to EntityLink
   */
  private mapDatabaseLinkToEntityLink(data: DatabaseEntityLink): EntityLink {
    return {
      id: data.id,
      layer: data.layer as Layer,
      sourceSlug: data.source_slug,
      targetSlug: data.target_slug,
      linkType: data.link_type as LinkType,
      linkText: data.link_text || undefined,
      contextSnippet: data.context_snippet || undefined,
      strength: data.strength,
      createdAt: new Date(data.created_at),
    };
  }
}
