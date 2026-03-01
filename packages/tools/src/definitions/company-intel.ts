/**
 * Company Intelligence Tools
 *
 * Company profiling, competitor discovery, and web scraping
 * powered by ARI's external intelligence capabilities.
 *
 * These tools expose ARI's discovery pipeline to the entire platform:
 * - GFT CRM can auto-enrich company records
 * - Renubu can profile customer vendors
 * - FounderOS can research any company on demand
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
    throw new Error(`ARI discover ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

// =============================================================================
// PROFILE COMPANY
// =============================================================================

export const profileCompany = defineTool({
  name: 'profile_company',
  description:
    'Extract structured company intelligence from a domain. Returns industry, competitors, personas, products, founders, brand voice, use cases, and more. Optionally includes deep brand profiling.',
  platform: 'core',
  category: 'company_intel',

  input: z.object({
    domain: z.string().describe('Company domain (e.g., "acme.com")'),
    deep: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'If true, run deep brand profiling (slower but returns products, founders, awards, etc.)'
      ),
  }),

  handler: async (_ctx, input) => {
    return ariPost('/discover/profile', {
      domain: input.domain,
      deep: input.deep,
    });
  },

  rest: { method: 'POST', path: '/company/profile' },
});

// =============================================================================
// FIND COMPETITORS
// =============================================================================

export const findCompetitors = defineTool({
  name: 'find_competitors',
  description:
    'Discover competitors for a company using multi-source intelligence: Brave Answers + LLM extraction + Sonnet validation + domain resolution. Returns validated competitor list with domains.',
  platform: 'core',
  category: 'company_intel',

  input: z.object({
    company_name: z.string().describe('Company name'),
    domain: z.string().describe('Company domain'),
    industry: z
      .string()
      .optional()
      .default('')
      .describe('Industry for better competitor matching'),
  }),

  handler: async (_ctx, input) => {
    return ariPost('/discover/competitors', {
      company_name: input.company_name,
      domain: input.domain,
      industry: input.industry,
    });
  },

  rest: { method: 'POST', path: '/company/competitors' },
});

// =============================================================================
// SCRAPE WEBSITE
// =============================================================================

export const scrapeWebsite = defineTool({
  name: 'scrape_website',
  description:
    'Smart web scraping with content extraction. Fetches homepage + key subpages, strips boilerplate, handles bot detection with Brave Search fallback. Returns clean text content.',
  platform: 'core',
  category: 'company_intel',

  input: z.object({
    domain: z.string().describe('Domain to scrape (e.g., "acme.com")'),
  }),

  handler: async (_ctx, input) => {
    return ariPost('/discover/scrape', { domain: input.domain });
  },

  rest: { method: 'POST', path: '/company/scrape' },
});
