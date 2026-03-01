/**
 * Content Analysis Tools
 *
 * AI-readiness scoring, non-destructive enhancement, and anti-pattern
 * detection powered by ARI's article optimization engine.
 *
 * These tools let any HumanOS product check content quality:
 * - Renubu can score renewal communications
 * - PowerPak can evaluate knowledge base articles
 * - FounderOS can optimize outreach content
 */

import { z } from 'zod';
import { defineTool } from '../registry.js';

const ARI_BASE_URL = process.env.ARI_BACKEND_URL || 'http://localhost:4250';

async function ariPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${ARI_BASE_URL}/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`ARI content ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

// =============================================================================
// SCORE CONTENT
// =============================================================================

export const scoreContent = defineTool({
  name: 'score_content',
  description:
    'Deterministic AI-readiness scoring — no LLM calls, instant results. Checks heading structure, FAQ presence, entity density, data blocks, and structured metadata. Returns a 0-100 score with detailed breakdown.',
  platform: 'core',
  category: 'content_analysis',

  input: z.object({
    content: z
      .string()
      .describe('Article content (HTML or markdown) to score'),
    url: z
      .string()
      .optional()
      .describe('URL to fetch content from (alternative to content)'),
    format: z
      .enum(['html', 'markdown', 'auto'])
      .optional()
      .default('auto')
      .describe('Content format'),
  }),

  handler: async (_ctx, input) => {
    return ariPost('/content/score', {
      content: input.content || '',
      url: input.url,
      format: input.format,
    });
  },

  rest: { method: 'POST', path: '/content/score' },
});

// =============================================================================
// ENHANCE CONTENT
// =============================================================================

export const enhanceContent = defineTool({
  name: 'enhance_content',
  description:
    'Non-destructive content enhancement — generates AI summary, key findings, FAQ, and JSON-LD schema without rewriting the original. Returns paste-ready enhancement blocks.',
  platform: 'core',
  category: 'content_analysis',

  input: z.object({
    content: z.string().describe('Article content to enhance'),
    url: z
      .string()
      .optional()
      .describe('URL to fetch content from (alternative to content)'),
    format: z
      .enum(['html', 'markdown', 'auto'])
      .optional()
      .default('auto')
      .describe('Content format'),
  }),

  handler: async (_ctx, input) => {
    return ariPost('/content/enhance', {
      content: input.content || '',
      url: input.url,
      format: input.format,
    });
  },

  rest: { method: 'POST', path: '/content/enhance' },
});

// =============================================================================
// DETECT ANTI-PATTERNS
// =============================================================================

export const detectAntiPatterns = defineTool({
  name: 'detect_anti_patterns',
  description:
    'Detect AI visibility anti-patterns in a brand\'s online presence. Identifies issues like the Kleenex Effect, Premium Tax, Messy Middle, and 7 other named patterns with gap analysis scoring.',
  platform: 'core',
  category: 'content_analysis',

  input: z.object({
    domain: z.string().describe('Company domain to analyze'),
  }),

  handler: async (_ctx, input) => {
    // Anti-pattern detection runs through the full audit pipeline
    // For a quick check, we query cached audit data
    const res = await fetch(
      `${ARI_BASE_URL}/api/v1/audit/list?domain=${encodeURIComponent(input.domain)}`
    );
    if (!res.ok) {
      throw new Error(`Failed to query audits: ${res.status}`);
    }
    const audits = (await res.json()) as Array<Record<string, unknown>>;
    if (!audits.length) {
      return {
        domain: input.domain,
        anti_patterns: [],
        message:
          'No audit data found. Run a full audit via the ARI dashboard for anti-pattern detection.',
      };
    }

    // Fetch the most recent audit for full anti-pattern data
    const latestId = audits[0].id;
    const auditRes = await fetch(
      `${ARI_BASE_URL}/api/v1/audit/${latestId}`
    );
    if (!auditRes.ok) {
      throw new Error(`Failed to fetch audit: ${auditRes.status}`);
    }
    const audit = (await auditRes.json()) as Record<string, unknown>;
    return {
      domain: input.domain,
      anti_patterns: audit.anti_patterns || [],
      gap_analysis: audit.gap_analysis || [],
      overall_score: audit.overall_score,
      severity_band: audit.severity_band,
    };
  },

  rest: { method: 'GET', path: '/content/anti-patterns' },
});
