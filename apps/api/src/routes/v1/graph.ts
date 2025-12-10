/**
 * Graph Routes
 *
 * REST endpoints for knowledge graph operations.
 */

import { Router } from 'express';
import type { KnowledgeGraph, LinkType, EntityType } from '@human-os/core';
import { type AuthenticatedRequest, requireScope } from '../../middleware/auth.js';

/**
 * Create graph routes
 */
export function createGraphRoutes(knowledgeGraph: KnowledgeGraph): Router {
  const router = Router();

  // Get entity connections
  router.get('/connections/:slug', requireScope('graph:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const slug = req.params['slug'] ?? '';
      const direction = req.query['direction'] as 'outgoing' | 'incoming' | 'both' | undefined;
      const linkTypes = req.query['linkTypes']
        ? (req.query['linkTypes'] as string).split(',') as LinkType[]
        : undefined;

      const result = await knowledgeGraph.getConnections(slug, {
        direction,
        linkTypes,
      });

      return res.json({
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
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Find path between entities
  router.get('/path', requireScope('graph:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const startSlug = req.query['start'] as string | undefined;
      const endSlug = req.query['end'] as string | undefined;
      const maxDepth = req.query['maxDepth'] ? Number(req.query['maxDepth']) : undefined;

      if (!startSlug || !endSlug) {
        return res.status(400).json({ error: 'start and end query parameters are required' });
      }

      const path = await knowledgeGraph.findPath(startSlug, endSlug, { maxDepth });

      return res.json({
        found: path !== null,
        path,
        length: path ? path.length : null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Get backlinks to entity
  router.get('/backlinks/:slug', requireScope('graph:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const slug = req.params['slug'] ?? '';

      const links = await knowledgeGraph.getBacklinks(slug);

      return res.json({
        backlinks: links.map(l => ({
          sourceSlug: l.sourceSlug,
          linkType: l.linkType,
          linkText: l.linkText,
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Get outgoing links from entity
  router.get('/outgoing/:slug', requireScope('graph:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const slug = req.params['slug'] ?? '';

      const links = await knowledgeGraph.getOutgoingLinks(slug);

      return res.json({
        outgoing: links.map(l => ({
          targetSlug: l.targetSlug,
          linkType: l.linkType,
          linkText: l.linkText,
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Traverse graph from entity
  router.get('/traverse/:slug', requireScope('graph:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const slug = req.params['slug'] ?? '';
      const maxDepth = req.query['maxDepth'] ? Number(req.query['maxDepth']) : undefined;
      const linkTypes = req.query['linkTypes']
        ? (req.query['linkTypes'] as string).split(',') as LinkType[]
        : undefined;
      const entityTypes = req.query['entityTypes']
        ? (req.query['entityTypes'] as string).split(',') as EntityType[]
        : undefined;

      const result = await knowledgeGraph.traverse({
        startSlug: slug,
        maxDepth,
        linkTypes,
        entityTypes,
      });

      return res.json({
        nodes: result.nodes.map(n => ({
          slug: n.slug,
          name: n.name,
          entityType: n.entityType,
        })),
        edges: result.edges.length,
        paths: result.paths,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Get related entities
  router.get('/related', requireScope('graph:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const slugs = req.query['slugs']
        ? (req.query['slugs'] as string).split(',')
        : [];
      const limit = req.query['limit'] ? Number(req.query['limit']) : undefined;
      const excludeTypes = req.query['excludeTypes']
        ? (req.query['excludeTypes'] as string).split(',') as EntityType[]
        : undefined;

      if (slugs.length === 0) {
        return res.status(400).json({ error: 'slugs query parameter is required' });
      }

      const related = await knowledgeGraph.getRelatedEntities(slugs, {
        limit,
        excludeTypes,
      });

      return res.json({
        related: related.map(n => ({
          slug: n.slug,
          name: n.name,
          entityType: n.entityType,
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  return router;
}
