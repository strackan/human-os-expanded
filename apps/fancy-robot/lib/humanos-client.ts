/**
 * HumanOS API Client — lightweight fetch wrapper for Fancy Robot
 *
 * Calls the HumanOS API gateway (port 4401) to access entity context,
 * knowledge graph connections, and ARI score history.
 *
 * Graceful degradation: all methods return null on failure so UI
 * can render without HumanOS context.
 */

const HUMANOS_API_BASE =
  process.env.HUMANOS_API_URL || 'http://localhost:4401';
const HUMANOS_API_KEY = process.env.HUMANOS_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export interface EntityContext {
  id: string;
  slug: string | null;
  name: string;
  entity_type: string;
  metadata: Record<string, unknown>;
  ari?: {
    overall_score: number;
    mention_rate: number;
    scored_at: string;
    previous_score?: number;
    score_delta?: number;
    provider_scores?: Record<string, number>;
    run_id?: string;
  };
}

export interface EntityConnection {
  sourceSlug: string;
  targetSlug: string;
  linkType: string;
  strength: number;
  linkText?: string;
}

export interface AriHistoryEntry {
  score: number;
  mention_rate: number;
  delta: number | null;
  source: string;
  occurred_at: string;
  sentiment: string;
}

// =============================================================================
// Fetch helper
// =============================================================================

async function humanosGet<T>(path: string): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (HUMANOS_API_KEY) {
      headers['Authorization'] = `Bearer ${HUMANOS_API_KEY}`;
    }

    const res = await fetch(`${HUMANOS_API_BASE}/v1${path}`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    // HumanOS API unavailable — graceful degradation
    return null;
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Get entity context by domain.
 * Returns entity with metadata (including ARI score if available).
 */
export async function getEntityContext(
  domain: string
): Promise<EntityContext | null> {
  const result = await humanosGet<{ entities: EntityContext[] }>(
    `/entities?domain=${encodeURIComponent(domain)}&limit=1`
  );
  const entity = result?.entities?.[0] ?? null;
  if (entity) {
    // Lift ari from metadata for convenience
    entity.ari = entity.metadata?.ari as EntityContext['ari'];
  }
  return entity;
}

/**
 * Get knowledge graph connections for an entity.
 */
export async function getEntityConnections(
  slug: string
): Promise<EntityConnection[]> {
  const result = await humanosGet<{
    edges: EntityConnection[];
  }>(`/graph/connections/${encodeURIComponent(slug)}`);
  return result?.edges ?? [];
}

/**
 * Get ARI score change history for a domain.
 */
export async function getAriHistory(
  domain: string,
  limit = 10
): Promise<AriHistoryEntry[]> {
  const result = await humanosGet<{
    history: AriHistoryEntry[];
  }>(`/ari/history?domain=${encodeURIComponent(domain)}&limit=${limit}`);
  return result?.history ?? [];
}
