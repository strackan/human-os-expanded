/**
 * Competitive Intelligence Tools for Renubu
 *
 * Gives Renubu CS workflows access to competitive landscape data:
 * - Competitor discovery for customer companies
 * - AI recommendation landscape (who AI recommends instead)
 *
 * Calls ARI backend for competitive analysis.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';

const ARI_BASE_URL = process.env.ARI_BACKEND_URL || 'http://localhost:4250';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const competitiveIntelTools: Tool[] = [
  {
    name: 'get_competitive_landscape',
    description:
      'For a Renubu customer\'s company, map the competitive landscape using ARI\'s ' +
      'multi-source intelligence. Shows who AI models recommend instead of the customer\'s brand. ' +
      'Useful for renewal strategy and competitive positioning.',
    inputSchema: {
      type: 'object',
      properties: {
        company_name: {
          type: 'string',
          description: 'Customer company name',
        },
        domain: {
          type: 'string',
          description: 'Customer company domain',
        },
        industry: {
          type: 'string',
          description: 'Industry for better competitor matching',
        },
      },
      required: ['company_name', 'domain'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleCompetitiveIntelTools(
  name: string,
  args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'get_competitive_landscape': {
      const { company_name, domain, industry } = args as {
        company_name: string;
        domain: string;
        industry?: string;
      };

      try {
        const res = await fetch(`${ARI_BASE_URL}/api/v1/discover/competitors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name,
            domain,
            industry: industry || '',
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => res.statusText);
          throw new Error(`ARI competitor discovery failed: ${res.status} ${text}`);
        }

        const result = await res.json();

        return {
          company_name,
          domain,
          competitors: result.competitors || [],
          competitor_count: (result.competitors || []).length,
          source: 'ari_multi_source',
          note: 'Competitors discovered via Brave Search + LLM + Sonnet validation',
        };
      } catch (error) {
        // ARI backend unavailable — return graceful empty response
        return {
          company_name,
          domain,
          competitors: [],
          competitor_count: 0,
          error: error instanceof Error ? error.message : 'ARI backend unavailable',
          note: 'ARI backend must be running for competitive intelligence',
        };
      }
    }

    default:
      return null;
  }
}
