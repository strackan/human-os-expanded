/**
 * ARI Enrichment Tools for Renubu
 *
 * Gives Renubu CS workflows access to ARI intelligence:
 * - AI visibility scores for customer companies
 * - Score trends and risk flags
 * - Provider-level breakdown
 *
 * Uses entity metadata (fast path) and ARI backend (deep path).
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { createClient } from '@supabase/supabase-js';

const ARI_BASE_URL = process.env.ARI_BACKEND_URL || 'http://localhost:4250';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const ariEnrichmentTools: Tool[] = [
  {
    name: 'get_customer_ari_score',
    description:
      'Get the AI visibility score (ARI) for a Renubu customer\'s company. ' +
      'Returns overall score (0-100), mention rate, provider breakdown, and risk flag. ' +
      'Score < 40 = "AI visibility declining" risk.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Customer company domain (e.g., "acme.com")',
        },
        company_name: {
          type: 'string',
          description: 'Company name (for display)',
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'get_customer_ari_trend',
    description:
      'Get ARI score trend for a customer — shows score changes over time ' +
      'and highlights declining visibility. Useful for renewal risk assessment.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Customer company domain',
        },
        limit: {
          type: 'number',
          description: 'Number of history entries (default 5)',
          default: 5,
        },
      },
      required: ['domain'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleAriEnrichmentTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'get_customer_ari_score': {
      const { domain, company_name } = args as {
        domain: string;
        company_name?: string;
      };

      // Fast path: read from entity metadata
      const supabase = createClient(ctx.supabaseUrl, ctx.supabaseKey);
      const { data } = await supabase
        .schema('human_os')
        .from('entities')
        .select('id, canonical_name, metadata')
        .ilike('domain', `%${domain}%`)
        .limit(1);

      const entity = data?.[0];
      const ari = entity?.metadata?.ari as Record<string, unknown> | undefined;

      if (ari) {
        const score = ari.overall_score as number;
        return {
          domain,
          company_name: company_name || entity?.canonical_name || domain,
          entity_id: entity?.id,
          overall_score: score,
          mention_rate: ari.mention_rate,
          provider_scores: ari.provider_scores || null,
          scored_at: ari.scored_at,
          previous_score: ari.previous_score || null,
          score_delta: ari.score_delta || null,
          risk_flag: score < 40 ? 'AI visibility declining' : null,
          risk_level:
            score < 20 ? 'critical' :
            score < 40 ? 'warning' :
            score < 60 ? 'moderate' : 'healthy',
        };
      }

      return {
        domain,
        company_name: company_name || domain,
        overall_score: null,
        risk_flag: null,
        message: 'No ARI score available. Customer has not been scanned.',
      };
    }

    case 'get_customer_ari_trend': {
      const { domain, limit } = args as { domain: string; limit?: number };
      const maxEntries = limit || 5;

      const supabase = createClient(ctx.supabaseUrl, ctx.supabaseKey);
      const { data, error } = await supabase
        .schema('human_os')
        .from('interactions')
        .select('metadata, occurred_at, sentiment')
        .eq('source_system', 'fancy_robot')
        .eq('interaction_type', 'engagement')
        .order('occurred_at', { ascending: false })
        .limit(maxEntries * 3); // over-fetch, filter below

      if (error) throw new Error(`Failed to fetch ARI trend: ${error.message}`);

      const trend = (data || [])
        .filter(
          (row: Record<string, unknown>) =>
            (row.metadata as Record<string, unknown>)?.domain === domain
        )
        .slice(0, maxEntries)
        .map((row: Record<string, unknown>) => ({
          score: (row.metadata as Record<string, unknown>)?.overall_score,
          delta: (row.metadata as Record<string, unknown>)?.score_delta,
          source: (row.metadata as Record<string, unknown>)?.source,
          occurred_at: row.occurred_at,
          sentiment: row.sentiment,
        }));

      // Determine trend direction
      let trend_direction = 'stable';
      if (trend.length >= 2) {
        const latest = trend[0]?.score as number;
        const previous = trend[1]?.score as number;
        if (latest && previous) {
          if (latest - previous > 5) trend_direction = 'improving';
          else if (previous - latest > 5) trend_direction = 'declining';
        }
      }

      return {
        domain,
        trend,
        trend_direction,
        entries: trend.length,
      };
    }

    default:
      return null;
  }
}
