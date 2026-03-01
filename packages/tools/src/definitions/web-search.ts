/**
 * Web Search Tools
 *
 * General-purpose web search, domain finding, and grounded Q&A
 * powered by ARI's Brave Search integration.
 *
 * This fills a critical gap: search-mcp had zero web search,
 * FounderOS had zero external intelligence. These tools make the
 * platform aware of the outside world.
 */

import { z } from 'zod';
import { defineTool } from '../registry.js';

const ARI_BASE_URL = process.env.ARI_BACKEND_URL || 'http://localhost:4250';

async function ariGet(path: string): Promise<unknown> {
  const res = await fetch(`${ARI_BASE_URL}/api/v1${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`ARI search ${path}: ${res.status} ${text}`);
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
    throw new Error(`ARI search ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

// =============================================================================
// WEB SEARCH
// =============================================================================

export const webSearch = defineTool({
  name: 'web_search',
  description:
    'Search the web via Brave Search API. Returns URLs, titles, and snippets. Use for current events, fact-checking, market research, or any query needing real-time web data.',
  platform: 'core',
  category: 'web_search',

  input: z.object({
    query: z.string().describe('Search query'),
    count: z
      .number()
      .optional()
      .default(5)
      .describe('Number of results (1-20)'),
  }),

  handler: async (_ctx, input) => {
    return ariGet(
      `/search/web?q=${encodeURIComponent(input.query)}&count=${input.count}`
    );
  },

  rest: { method: 'GET', path: '/search/web' },
});

// =============================================================================
// FIND DOMAIN
// =============================================================================

export const findDomain = defineTool({
  name: 'find_domain',
  description:
    'Given a brand or company name, find its official website domain. Uses Brave Search with brand-domain extraction and caching. Useful for CRM enrichment and vendor lookup.',
  platform: 'core',
  category: 'web_search',

  input: z.object({
    brand: z.string().describe('Brand or company name'),
    num_results: z
      .number()
      .optional()
      .default(3)
      .describe('Max domain suggestions'),
  }),

  handler: async (_ctx, input) => {
    return ariGet(
      `/search/domain?brand=${encodeURIComponent(input.brand)}&num_results=${input.num_results}`
    );
  },

  rest: { method: 'GET', path: '/search/domain' },
});

// =============================================================================
// WEB ANSWERS
// =============================================================================

export const webAnswers = defineTool({
  name: 'web_answers',
  description:
    'Grounded Q&A via Brave Answers — get factual answers with real-time web context. Especially useful for competitive intelligence, market research, and current information.',
  platform: 'core',
  category: 'web_search',

  input: z.object({
    query: z.string().describe('Question to answer'),
    company_name: z
      .string()
      .optional()
      .describe('Company name for competitive context'),
    domain: z.string().optional().describe('Company domain for context'),
    industry: z.string().optional().describe('Industry for context'),
  }),

  handler: async (_ctx, input) => {
    return ariPost('/search/answers', input);
  },

  rest: { method: 'POST', path: '/search/answers' },
});
