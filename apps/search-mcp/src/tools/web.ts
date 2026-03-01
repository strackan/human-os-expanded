/**
 * Web Search Tools — Brave Search via ARI backend
 *
 * Adds real-time web search and grounded Q&A to search-mcp.
 * Previously search-mcp had zero web search capability.
 *
 * Bridge: calls ARI backend (port 4250) for Brave Search access.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

const ARI_BASE_URL = process.env.ARI_BACKEND_URL || 'http://localhost:4250';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const webTools: Tool[] = [
  {
    name: 'web_search',
    description:
      'Search the web via Brave Search. Returns URLs, titles, and snippets. ' +
      'Use for current events, fact-checking, market research, or any query ' +
      'needing real-time web data.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        count: {
          type: 'number',
          description: 'Number of results to return (1-20)',
          default: 5,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'web_answers',
    description:
      'Grounded Q&A via Brave Answers — get factual answers with real-time ' +
      'web context. Better than web_search for specific questions. Good for ' +
      'competitive intelligence, market research, and current information.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Question to answer',
        },
        company_name: {
          type: 'string',
          description: 'Company name for competitive context (optional)',
        },
        domain: {
          type: 'string',
          description: 'Company domain for context (optional)',
        },
        industry: {
          type: 'string',
          description: 'Industry for context (optional)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_domain',
    description:
      'Given a brand or company name, find its official website domain. ' +
      'Uses Brave Search with brand-domain extraction and caching.',
    inputSchema: {
      type: 'object',
      properties: {
        brand: {
          type: 'string',
          description: 'Brand or company name to look up',
        },
      },
      required: ['brand'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleWebTools(
  name: string,
  args: Record<string, unknown>
): Promise<unknown | null> {
  switch (name) {
    case 'web_search': {
      const { query, count } = args as { query: string; count?: number };
      const res = await fetch(
        `${ARI_BASE_URL}/api/v1/search/web?q=${encodeURIComponent(query)}&count=${count || 5}`
      );
      if (!res.ok) {
        throw new Error(`Web search failed: ${res.status} ${res.statusText}`);
      }
      return res.json();
    }

    case 'web_answers': {
      const { query, company_name, domain, industry } = args as {
        query: string;
        company_name?: string;
        domain?: string;
        industry?: string;
      };
      const res = await fetch(`${ARI_BASE_URL}/api/v1/search/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, company_name, domain, industry }),
      });
      if (!res.ok) {
        throw new Error(`Web answers failed: ${res.status} ${res.statusText}`);
      }
      return res.json();
    }

    case 'find_domain': {
      const { brand } = args as { brand: string };
      const res = await fetch(
        `${ARI_BASE_URL}/api/v1/search/domain?brand=${encodeURIComponent(brand)}`
      );
      if (!res.ok) {
        throw new Error(`Domain lookup failed: ${res.status} ${res.statusText}`);
      }
      return res.json();
    }

    default:
      return null;
  }
}
