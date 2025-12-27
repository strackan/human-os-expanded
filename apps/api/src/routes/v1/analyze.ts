/**
 * Text Analysis Routes
 *
 * REST endpoints for semantic text analysis:
 * - Emotion analysis (Plutchik 8-dimension + VAD)
 * - Text comparison
 * - Batch analysis
 *
 * This exposes Human-OS semantic capabilities to external customers.
 */

import { Router } from 'express';
import { z } from 'zod';
import {
  EmotionAnalyzer,
  analyzeTextEmotion,
  compareTextEmotions,
} from '@human-os/journal';
import { type AuthenticatedRequest, requireScope } from '../../middleware/auth.js';

// =============================================================================
// SCHEMAS
// =============================================================================

const AnalyzeTextSchema = z.object({
  text: z.string().min(1).max(50000),
  context: z.string().optional(),
});

const AnalyzeTextsSchema = z.object({
  texts: z.array(z.string().min(1).max(50000)).min(1).max(100),
});

const CompareTextsSchema = z.object({
  text1: z.string().min(1).max(50000),
  text2: z.string().min(1).max(50000),
});

// =============================================================================
// ROUTE FACTORY
// =============================================================================

/**
 * Create analyze routes
 */
export function createAnalyzeRoutes(): Router {
  const router = Router();
  const analyzer = new EmotionAnalyzer();

  /**
   * POST /v1/analyze
   *
   * Analyze a single text for emotional content.
   *
   * Request:
   *   { text: string, context?: string }
   *
   * Response:
   *   {
   *     valence: number,      // -1 (negative) to +1 (positive)
   *     arousal: number,      // 0 (calm) to 1 (excited)
   *     dominance: number,    // 0 (submissive) to 1 (dominant)
   *     plutchikVector: {     // 8-dimension emotion vector (0-1 each)
   *       joy, trust, fear, surprise, sadness, anticipation, anger, disgust
   *     },
   *     dominantEmotion: string,
   *     emotionConfidence: number,
   *     detectedKeywords: Array<{ word, emotion, confidence, intensity }>,
   *     wordCount: number,
   *     emotionDensity: number
   *   }
   */
  router.post('/', requireScope('analyze:*:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const input = AnalyzeTextSchema.parse(req.body);

      const analysis = analyzer.analyzeText(input.text);

      return res.json({
        success: true,
        analysis,
        // Include context echo for debugging/logging
        meta: {
          textLength: input.text.length,
          hasContext: !!input.context,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid input',
          details: error.errors,
        });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * POST /v1/analyze/batch
   *
   * Analyze multiple texts and optionally aggregate results.
   *
   * Request:
   *   { texts: string[] }
   *
   * Response:
   *   {
   *     analyses: TextEmotionAnalysis[],
   *     aggregate: TextEmotionAnalysis | null  // Averaged across all texts
   *   }
   */
  router.post('/batch', requireScope('analyze:*:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const input = AnalyzeTextsSchema.parse(req.body);

      const analyses = analyzer.analyzeTexts(input.texts);
      const aggregate = analyzer.aggregateAnalyses(analyses);

      return res.json({
        success: true,
        count: analyses.length,
        analyses,
        aggregate,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid input',
          details: error.errors,
        });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * POST /v1/analyze/compare
   *
   * Compare two texts emotionally.
   * Useful for tracking emotional shifts (before/after, draft/final, etc.)
   *
   * Request:
   *   { text1: string, text2: string }
   *
   * Response:
   *   {
   *     distance: number,       // Euclidean distance (0 = identical)
   *     similarity: number,     // Cosine similarity (1 = identical)
   *     valenceChange: number,  // Change in valence
   *     arousalChange: number,  // Change in arousal
   *     shift: PlutchikVector,  // Per-emotion shift (text2 - text1)
   *     dominantShift: { from: string, to: string }
   *   }
   */
  router.post('/compare', requireScope('analyze:*:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const input = CompareTextsSchema.parse(req.body);

      const comparison = analyzer.compareEmotions(input.text1, input.text2);

      // Also return individual analyses for context
      const analysis1 = analyzer.analyzeText(input.text1);
      const analysis2 = analyzer.analyzeText(input.text2);

      return res.json({
        success: true,
        comparison,
        text1Analysis: analysis1,
        text2Analysis: analysis2,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid input',
          details: error.errors,
        });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  /**
   * GET /v1/analyze/emotions
   *
   * Get list of recognized emotions and their properties.
   * Useful for UI dropdowns, documentation, etc.
   */
  router.get('/emotions', requireScope('analyze:*:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const emotions = [
        { name: 'joy', opposite: 'sadness', valence: 'positive', arousal: 'medium' },
        { name: 'trust', opposite: 'disgust', valence: 'positive', arousal: 'low' },
        { name: 'fear', opposite: 'anger', valence: 'negative', arousal: 'high' },
        { name: 'surprise', opposite: 'anticipation', valence: 'neutral', arousal: 'high' },
        { name: 'sadness', opposite: 'joy', valence: 'negative', arousal: 'low' },
        { name: 'anticipation', opposite: 'surprise', valence: 'positive', arousal: 'medium' },
        { name: 'anger', opposite: 'fear', valence: 'negative', arousal: 'high' },
        { name: 'disgust', opposite: 'trust', valence: 'negative', arousal: 'medium' },
      ];

      return res.json({
        model: 'plutchik',
        version: '1.0',
        dimensions: 8,
        emotions,
        vadDescription: {
          valence: 'Positive/negative polarity (-1 to +1)',
          arousal: 'Calm/excited intensity (0 to 1)',
          dominance: 'Submissive/dominant control (0 to 1)',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  return router;
}
