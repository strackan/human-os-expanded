/**
 * ARI Routes — AI Visibility Intelligence
 *
 * Gateway routes for ARI capabilities. Proxies requests to the ARI backend
 * (port 4250) and adds HumanOS auth + rate limiting.
 *
 * Endpoints:
 *   GET  /v1/ari/score?domain=        — Get ARI score from entity metadata
 *   POST /v1/ari/scan                 — Trigger ARI scan
 *   GET  /v1/ari/compare?a=&b=        — Compare two companies
 *   GET  /v1/ari/history?domain=       — Score change history
 *   GET  /v1/ari/search?q=            — Web search (Brave)
 *   POST /v1/ari/profile              — Company profiling
 *   POST /v1/ari/competitors          — Competitor discovery
 *   POST /v1/ari/content/score        — Content AI-readiness scoring
 *   POST /v1/ari/content/enhance      — Content enhancement
 */

import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type AuthenticatedRequest, requireScope } from '../../middleware/auth.js';

const ARI_BASE_URL = process.env.ARI_BACKEND_URL || 'http://localhost:4250';

async function proxyGet(path: string): Promise<unknown> {
  const res = await fetch(`${ARI_BASE_URL}/api/v1${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`ARI ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

async function proxyPost(path: string, body: unknown): Promise<unknown> {
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

export function createAriRoutes(supabase: SupabaseClient): Router {
  const router = Router();

  // ---------------------------------------------------------------------------
  // ARI Scoring
  // ---------------------------------------------------------------------------

  // GET /v1/ari/score?domain=acme.com
  router.get('/score', requireScope('entities:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const domain = req.query['domain'] as string;
      if (!domain) return res.status(400).json({ error: 'domain query parameter required' });

      // Read from entity metadata (fast path)
      const { data } = await supabase
        .schema('human_os')
        .from('entities')
        .select('id, metadata')
        .ilike('domain', `%${domain}%`)
        .limit(1);

      const ari = data?.[0]?.metadata?.ari;
      if (ari) {
        return res.json({ domain, source: 'entity_metadata', ...ari });
      }

      return res.json({
        domain,
        source: 'not_scored',
        overall_score: null,
        message: 'No ARI score found. Run a scan first.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // POST /v1/ari/scan — trigger ARI scan
  router.post('/scan', requireScope('entities:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const { domain } = req.body;
      if (!domain) return res.status(400).json({ error: 'domain required in body' });

      const result = await proxyPost('/lite-report/analyze', { domain });
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(502).json({ error: message });
    }
  });

  // GET /v1/ari/compare?a=domain1&b=domain2
  router.get('/compare', requireScope('entities:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const domainA = req.query['a'] as string;
      const domainB = req.query['b'] as string;
      if (!domainA || !domainB) {
        return res.status(400).json({ error: 'Both "a" and "b" domain query parameters required' });
      }

      const [entityA, entityB] = await Promise.all([
        supabase
          .schema('human_os')
          .from('entities')
          .select('metadata')
          .ilike('domain', `%${domainA}%`)
          .limit(1),
        supabase
          .schema('human_os')
          .from('entities')
          .select('metadata')
          .ilike('domain', `%${domainB}%`)
          .limit(1),
      ]);

      return res.json({
        comparison: [
          { domain: domainA, ...(entityA.data?.[0]?.metadata?.ari ?? { overall_score: null }) },
          { domain: domainB, ...(entityB.data?.[0]?.metadata?.ari ?? { overall_score: null }) },
        ],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // GET /v1/ari/history?domain=acme.com&limit=10
  router.get('/history', requireScope('entities:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const domain = req.query['domain'] as string;
      const limit = parseInt(req.query['limit'] as string || '10', 10);
      if (!domain) return res.status(400).json({ error: 'domain query parameter required' });

      const { data, error } = await supabase
        .schema('human_os')
        .from('interactions')
        .select('metadata, occurred_at, title, sentiment')
        .eq('source_system', 'fancy_robot')
        .eq('interaction_type', 'engagement')
        .order('occurred_at', { ascending: false })
        .limit(limit * 2); // fetch extra, filter by domain below

      if (error) throw new Error(error.message);

      const history = (data || [])
        .filter((row: Record<string, unknown>) =>
          (row.metadata as Record<string, unknown>)?.domain === domain
        )
        .slice(0, limit)
        .map((row: Record<string, unknown>) => ({
          score: (row.metadata as Record<string, unknown>)?.overall_score,
          mention_rate: (row.metadata as Record<string, unknown>)?.mention_rate,
          delta: (row.metadata as Record<string, unknown>)?.score_delta,
          source: (row.metadata as Record<string, unknown>)?.source,
          occurred_at: row.occurred_at,
          sentiment: row.sentiment,
        }));

      return res.json({ domain, history });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  // ---------------------------------------------------------------------------
  // Web Search (proxied to ARI)
  // ---------------------------------------------------------------------------

  // GET /v1/ari/search?q=query&count=5
  router.get('/search', requireScope('entities:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const q = req.query['q'] as string;
      const count = req.query['count'] || '5';
      if (!q) return res.status(400).json({ error: 'q query parameter required' });

      const result = await proxyGet(`/search/web?q=${encodeURIComponent(q)}&count=${count}`);
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(502).json({ error: message });
    }
  });

  // ---------------------------------------------------------------------------
  // Company Intelligence (proxied to ARI)
  // ---------------------------------------------------------------------------

  // POST /v1/ari/profile
  router.post('/profile', requireScope('entities:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const { domain, deep } = req.body;
      if (!domain) return res.status(400).json({ error: 'domain required in body' });

      const result = await proxyPost('/discover/profile', { domain, deep: deep || false });
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(502).json({ error: message });
    }
  });

  // POST /v1/ari/competitors
  router.post('/competitors', requireScope('entities:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const { company_name, domain, industry } = req.body;
      if (!company_name || !domain) {
        return res.status(400).json({ error: 'company_name and domain required in body' });
      }

      const result = await proxyPost('/discover/competitors', {
        company_name,
        domain,
        industry: industry || '',
      });
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(502).json({ error: message });
    }
  });

  // ---------------------------------------------------------------------------
  // Content Analysis (proxied to ARI)
  // ---------------------------------------------------------------------------

  // POST /v1/ari/content/score
  router.post('/content/score', requireScope('entities:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const result = await proxyPost('/content/score', req.body);
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(502).json({ error: message });
    }
  });

  // POST /v1/ari/content/enhance
  router.post('/content/enhance', requireScope('entities:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const result = await proxyPost('/content/enhance', req.body);
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(502).json({ error: message });
    }
  });

  return router;
}
