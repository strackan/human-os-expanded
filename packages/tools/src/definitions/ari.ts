/**
 * ARI (AI Recommendation Index) Tools
 *
 * Score retrieval, scan triggering, comparison, and history tools.
 * Also includes extractable tools for brand mention extraction and
 * competitive intel parsing.
 *
 * Bridge pattern: TypeScript tool handlers call ARI backend (port 4250)
 * via fetch(). ARI backend does the actual work.
 */

import { z } from 'zod';
import { defineTool } from '../registry.js';

const ARI_BASE_URL = process.env.ARI_BACKEND_URL || 'http://localhost:4250';

async function ariGet(path: string): Promise<unknown> {
  const res = await fetch(`${ARI_BASE_URL}/api/v1${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`ARI ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

async function ariPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${ARI_BASE_URL}/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`ARI ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

// =============================================================================
// GET ARI SCORE
// =============================================================================

export const getAriScore = defineTool({
  name: 'get_ari_score',
  description:
    'Get the AI visibility score (ARI) for a company from entity metadata. Returns overall score, mention rate, provider breakdown, and last scored timestamp.',
  platform: 'core',
  category: 'ari',

  input: z.object({
    domain: z.string().describe('Company domain (e.g., "acme.com")'),
  }),

  handler: async (_ctx, input) => {
    // First try entity metadata (fast path — no ARI call needed)
    const entity = (await ariGet(
      `/entities?domain=${encodeURIComponent(input.domain)}`
    )) as { data?: Array<{ id: string; metadata?: Record<string, unknown> }> };

    const ari = entity?.data?.[0]?.metadata?.ari as
      | Record<string, unknown>
      | undefined;

    if (ari) {
      return {
        domain: input.domain,
        source: 'entity_metadata',
        ...ari,
      };
    }

    return {
      domain: input.domain,
      source: 'not_scored',
      overall_score: null,
      message: 'No ARI score found. Run a scan with run_ari_scan first.',
    };
  },

  rest: { method: 'GET', path: '/ari/score' },
});

// =============================================================================
// RUN ARI SCAN
// =============================================================================

export const runAriScan = defineTool({
  name: 'run_ari_scan',
  description:
    'Trigger a full ARI scan for a domain. This runs the 20-prompt matrix against AI models and calculates the AI visibility score. Takes 1-3 minutes.',
  platform: 'core',
  category: 'ari',

  input: z.object({
    domain: z.string().describe('Company domain to scan'),
  }),

  handler: async (_ctx, input) => {
    const result = await ariPost('/lite-report/analyze', {
      domain: input.domain,
    });
    return result;
  },

  rest: { method: 'POST', path: '/ari/scan' },
});

// =============================================================================
// COMPARE ARI SCORES
// =============================================================================

export const compareAri = defineTool({
  name: 'compare_ari',
  description:
    "Compare AI visibility scores between two companies. Shows side-by-side score comparison from entity metadata.",
  platform: 'core',
  category: 'ari',

  input: z.object({
    domain_a: z.string().describe('First company domain'),
    domain_b: z.string().describe('Second company domain'),
  }),

  handler: async (ctx, input) => {
    // Fetch both scores in parallel via the get_ari_score handler
    const [scoreA, scoreB] = await Promise.all([
      getAriScore.handler(ctx, { domain: input.domain_a }),
      getAriScore.handler(ctx, { domain: input.domain_b }),
    ]);

    return {
      comparison: [
        { ...scoreA, domain: input.domain_a },
        { ...scoreB, domain: input.domain_b },
      ],
    };
  },

  rest: { method: 'GET', path: '/ari/compare' },
});

// =============================================================================
// GET ARI HISTORY
// =============================================================================

export const getAriHistory = defineTool({
  name: 'get_ari_history',
  description:
    'Get score change history for a company from the interactions table. Shows score trends over time.',
  platform: 'core',
  category: 'ari',

  input: z.object({
    domain: z.string().describe('Company domain'),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe('Number of history entries to return'),
  }),

  handler: async (ctx, input) => {
    // Query interactions table for score events
    const { data, error } = await ctx.supabase
      .schema('human_os')
      .from('interactions')
      .select('metadata, occurred_at, title, sentiment')
      .eq('source_system', 'fancy_robot')
      .eq('interaction_type', 'engagement')
      .order('occurred_at', { ascending: false })
      .limit(input.limit ?? 10);

    if (error) throw new Error(`Failed to fetch ARI history: ${error.message}`);

    // Filter to matching domain
    const history = (data || [])
      .filter(
        (row: { metadata?: Record<string, unknown> }) =>
          (row.metadata as Record<string, unknown>)?.domain === input.domain
      )
      .map(
        (row: {
          metadata?: Record<string, unknown>;
          occurred_at: string;
          title: string;
          sentiment: string;
        }) => ({
          score: (row.metadata as Record<string, unknown>)?.overall_score,
          mention_rate: (row.metadata as Record<string, unknown>)?.mention_rate,
          delta: (row.metadata as Record<string, unknown>)?.score_delta,
          source: (row.metadata as Record<string, unknown>)?.source,
          occurred_at: row.occurred_at,
          sentiment: row.sentiment,
        })
      );

    return { domain: input.domain, history };
  },

  rest: { method: 'GET', path: '/ari/history' },
});

// =============================================================================
// EXTRACTABLE TOOLS — integrated with extract() auto-discovery
// =============================================================================

export const extractBrandMentions = defineTool({
  name: 'extract_brand_mentions',
  description:
    'Extract structured brand/entity mentions from AI responses or free text. Identifies position, recommendation type, sentiment, and confidence.',
  platform: 'core',
  category: 'ari',

  extractable: true,
  extractCategory: 'brand_mentions',
  extractHint:
    'Brand or company mentions in AI responses — recommendations, rankings, comparisons. Look for named entities with context about their position, recommendation strength, and sentiment.',

  input: z.object({
    text: z.string().describe('Text to extract brand mentions from'),
    entity_type: z
      .string()
      .optional()
      .default('company')
      .describe('Type of entities to look for'),
    known_entities: z
      .array(z.string())
      .optional()
      .describe('Known entity names to help guide extraction'),
  }),

  handler: async (_ctx, input) => {
    // Delegate to ARI's response parser via REST
    const result = await ariPost('/scores/parse', {
      text: input.text,
      entity_type: input.entity_type,
      known_entities: input.known_entities,
    });
    return result;
  },
});

export const parseCompetitiveIntel = defineTool({
  name: 'parse_competitive_intel',
  description:
    'Parse structured competitive landscape from Gumshoe CSV exports or competitive analysis text.',
  platform: 'core',
  category: 'ari',

  extractable: true,
  extractCategory: 'competitive_intel',
  extractHint:
    'Competitive landscape data — competitor names, market positions, binding checklists, visibility gaps, recommendation patterns.',

  input: z.object({
    text: z.string().describe('Competitive analysis text or CSV data'),
    company_name: z
      .string()
      .optional()
      .describe('Target company to focus analysis on'),
  }),

  handler: async (_ctx, input) => {
    // Competitive intel extraction — uses ARI's discovery endpoint
    const result = await ariPost('/discover/competitors', {
      company_name: input.company_name || 'Unknown',
      domain: '',
      industry: '',
    });
    return result;
  },
});

export const extractCompanyProfile = defineTool({
  name: 'extract_company_profile',
  description:
    'Extract structured company profile from website text — competitors, personas, topics, differentiators.',
  platform: 'core',
  category: 'ari',

  extractable: true,
  extractCategory: 'company_profiles',
  extractHint:
    'Company intelligence — industry, competitors, target personas, product categories, differentiators, brand voice from website or marketing content.',

  input: z.object({
    domain: z.string().describe('Company domain to profile'),
  }),

  handler: async (_ctx, input) => {
    const result = await ariPost('/discover/profile', {
      domain: input.domain,
      deep: false,
    });
    return result;
  },
});
