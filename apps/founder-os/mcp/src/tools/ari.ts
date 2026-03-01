/**
 * ARI (External Intelligence) Tools
 *
 * Gives FounderOS access to ARI's capabilities:
 * - AI visibility scores
 * - Web search (Brave Search)
 * - Company profiling + competitor discovery
 * - Content scoring + enhancement
 *
 * Bridge: calls ARI backend (port 4250) via fetch().
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';

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
// TOOL DEFINITIONS
// =============================================================================

export const ariTools: Tool[] = [
  // --- ARI Scoring ---
  {
    name: 'get_ari_score',
    description:
      'Get the AI visibility score (ARI) for a company. Returns overall score (0-100), mention rate, provider breakdown, and when it was last scored.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Company domain (e.g., "acme.com")',
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'compare_ari',
    description:
      'Compare AI visibility scores between two companies side-by-side.',
    inputSchema: {
      type: 'object',
      properties: {
        domain_a: { type: 'string', description: 'First company domain' },
        domain_b: { type: 'string', description: 'Second company domain' },
      },
      required: ['domain_a', 'domain_b'],
    },
  },

  // --- Web Search ---
  {
    name: 'web_search',
    description:
      'Search the web via Brave Search. Returns URLs, titles, snippets. Use for current events, fact-checking, market research.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        count: {
          type: 'number',
          description: 'Number of results (1-20)',
          default: 5,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_domain',
    description:
      'Given a brand or company name, find its official website domain.',
    inputSchema: {
      type: 'object',
      properties: {
        brand: { type: 'string', description: 'Brand or company name' },
      },
      required: ['brand'],
    },
  },

  // --- Company Intelligence ---
  {
    name: 'profile_company',
    description:
      'Extract structured company intelligence from a domain — industry, competitors, personas, products, brand voice. Optionally includes deep profiling.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Company domain' },
        deep: {
          type: 'boolean',
          description:
            'Deep profiling (slower but includes products, founders, awards)',
          default: false,
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'find_competitors',
    description:
      'Discover competitors for a company using multi-source intelligence: Brave Answers + LLM + Sonnet validation.',
    inputSchema: {
      type: 'object',
      properties: {
        company_name: { type: 'string', description: 'Company name' },
        domain: { type: 'string', description: 'Company domain' },
        industry: { type: 'string', description: 'Industry for context' },
      },
      required: ['company_name', 'domain'],
    },
  },

  // --- Content Analysis ---
  {
    name: 'score_content',
    description:
      'Deterministic AI-readiness scoring for articles/content. No LLM calls, instant. Returns 0-100 score with breakdown.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Article content (HTML or markdown)' },
        url: { type: 'string', description: 'URL to fetch content from (alt to content)' },
      },
      required: [],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleAriTools(
  name: string,
  args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'get_ari_score': {
      const { domain } = args as { domain: string };
      // Check entity metadata for cached score
      try {
        const entity = await ariGet(
          `/entities?domain=${encodeURIComponent(domain)}`
        ) as { data?: Array<{ metadata?: Record<string, unknown> }> };
        const ari = entity?.data?.[0]?.metadata?.ari;
        if (ari) return { domain, source: 'entity_metadata', ...ari as object };
      } catch {
        // Entity lookup failed, that's OK
      }
      return {
        domain,
        source: 'not_scored',
        overall_score: null,
        message: 'No ARI score found. Use the ARI dashboard to run a scan.',
      };
    }

    case 'compare_ari': {
      const { domain_a, domain_b } = args as {
        domain_a: string;
        domain_b: string;
      };
      const [a, b] = await Promise.all([
        ariGet(`/entities?domain=${encodeURIComponent(domain_a)}`).catch(
          () => null
        ),
        ariGet(`/entities?domain=${encodeURIComponent(domain_b)}`).catch(
          () => null
        ),
      ]);
      const scoreA =
        (a as { data?: Array<{ metadata?: Record<string, unknown> }> })
          ?.data?.[0]?.metadata?.ari ?? null;
      const scoreB =
        (b as { data?: Array<{ metadata?: Record<string, unknown> }> })
          ?.data?.[0]?.metadata?.ari ?? null;
      return {
        comparison: [
          { domain: domain_a, ...(scoreA as object ?? { overall_score: null }) },
          { domain: domain_b, ...(scoreB as object ?? { overall_score: null }) },
        ],
      };
    }

    case 'web_search': {
      const { query, count } = args as { query: string; count?: number };
      return ariGet(
        `/search/web?q=${encodeURIComponent(query)}&count=${count || 5}`
      );
    }

    case 'find_domain': {
      const { brand } = args as { brand: string };
      return ariGet(
        `/search/domain?brand=${encodeURIComponent(brand)}`
      );
    }

    case 'profile_company': {
      const { domain, deep } = args as { domain: string; deep?: boolean };
      return ariPost('/discover/profile', { domain, deep: deep || false });
    }

    case 'find_competitors': {
      const { company_name, domain, industry } = args as {
        company_name: string;
        domain: string;
        industry?: string;
      };
      return ariPost('/discover/competitors', {
        company_name,
        domain,
        industry: industry || '',
      });
    }

    case 'score_content': {
      const { content, url } = args as { content?: string; url?: string };
      return ariPost('/content/score', {
        content: content || '',
        url,
        format: 'auto',
      });
    }

    default:
      return null;
  }
}
