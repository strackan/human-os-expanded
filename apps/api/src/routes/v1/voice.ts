/**
 * Voice Routes
 *
 * REST endpoints for voice pack operations.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { ContextEngine, Layer } from '@human-os/core';
import { type AuthenticatedRequest, requireScope } from '../../middleware/auth.js';

const GenerateSchema = z.object({
  template: z.string(),
  context: z.record(z.unknown()).optional(),
  parameters: z.record(z.unknown()).optional(),
});

const AnalyzeSchema = z.object({
  text: z.string(),
});

/**
 * Create voice routes
 */
export function createVoiceRoutes(contextEngine: ContextEngine): Router {
  const router = Router();

  // Generate content in voice
  router.post('/:pack/generate', async (req: AuthenticatedRequest, res) => {
    try {
      const pack = req.params['pack'] ?? '';
      const requiredScope = `voice:${pack}:generate`;

      // Check scope
      const scopes = req.scopes || [];
      const hasScope = scopes.some(scope =>
        scope === requiredScope ||
        scope === 'voice:*:generate' ||
        scope.startsWith(`voice:${pack}:`)
      );

      if (!hasScope) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredScope,
        });
      }

      const input = GenerateSchema.parse(req.body);

      // Load voice configuration
      const voiceConfig = await contextEngine.getContext(
        `founder:${pack}` as Layer,
        'voice',
        '01_WRITING_ENGINE'
      );

      if (!voiceConfig) {
        return res.status(404).json({ error: `Voice pack '${pack}' not found` });
      }

      // Load template
      const template = await contextEngine.getContext(
        `founder:${pack}` as Layer,
        'voice',
        input.template
      );

      // Return voice context for generation
      // Note: Actual generation happens on client side with LLM
      return res.json({
        voicePack: pack,
        voiceConfig: {
          frontmatter: voiceConfig.frontmatter,
          content: voiceConfig.content,
        },
        template: template ? {
          frontmatter: template.frontmatter,
          content: template.content,
        } : null,
        context: input.context,
        parameters: input.parameters,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Analyze text for voice match
  router.post('/:pack/analyze', async (req: AuthenticatedRequest, res) => {
    try {
      const pack = req.params['pack'] ?? '';
      const requiredScope = `voice:${pack}:analyze`;

      // Check scope
      const scopes = req.scopes || [];
      const hasScope = scopes.some(scope =>
        scope === requiredScope ||
        scope === 'voice:*:analyze' ||
        scope.startsWith(`voice:${pack}:`)
      );

      if (!hasScope) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredScope,
        });
      }

      const input = AnalyzeSchema.parse(req.body);

      // Load voice configuration for comparison
      const voiceConfig = await contextEngine.getContext(
        `founder:${pack}` as Layer,
        'voice',
        '01_WRITING_ENGINE'
      );

      if (!voiceConfig) {
        return res.status(404).json({ error: `Voice pack '${pack}' not found` });
      }

      // Return voice config for analysis
      // Note: Actual analysis happens on client side with LLM
      return res.json({
        voicePack: pack,
        textToAnalyze: input.text,
        voiceConfig: {
          frontmatter: voiceConfig.frontmatter,
          content: voiceConfig.content,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Get available templates for voice pack
  router.get('/:pack/templates', async (req: AuthenticatedRequest, res) => {
    try {
      const pack = req.params['pack'] ?? '';
      const requiredScope = `voice:${pack}:read`;

      // Check scope
      const scopes = req.scopes || [];
      const hasScope = scopes.some(scope =>
        scope === requiredScope ||
        scope === 'voice:*:read' ||
        scope.startsWith(`voice:${pack}:`)
      );

      if (!hasScope) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredScope,
        });
      }

      // List voice folder contents
      const files = await contextEngine.listFiles(`founder:${pack}` as Layer, 'voice');

      return res.json({
        voicePack: pack,
        templates: files.map(f => ({
          filePath: f.filePath,
          frontmatter: f.frontmatter,
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // Get voice pack info
  router.get('/:pack', async (req: AuthenticatedRequest, res) => {
    try {
      const pack = req.params['pack'] ?? '';
      const requiredScope = `voice:${pack}:read`;

      // Check scope
      const scopes = req.scopes || [];
      const hasScope = scopes.some(scope =>
        scope === requiredScope ||
        scope === 'voice:*:read' ||
        scope.startsWith(`voice:${pack}:`)
      );

      if (!hasScope) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredScope,
        });
      }

      // Load main voice configuration
      const voiceConfig = await contextEngine.getContext(
        `founder:${pack}` as Layer,
        'voice',
        '01_WRITING_ENGINE'
      );

      if (!voiceConfig) {
        return res.status(404).json({ error: `Voice pack '${pack}' not found` });
      }

      // List all voice files
      const files = await contextEngine.listFiles(`founder:${pack}` as Layer, 'voice');

      return res.json({
        voicePack: pack,
        config: {
          frontmatter: voiceConfig.frontmatter,
          content: voiceConfig.content,
        },
        files: files.map(f => f.filePath),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  return router;
}
