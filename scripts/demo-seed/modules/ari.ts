/**
 * ARI seeder — monitored brands + score history in fancyrobot schema.
 * Seeds 8 monitored brands and 24 score snapshots (3 per company over 90 days).
 *
 * Schema: fancyrobot.monitored_brands (id, user_id FK auth.users, domain, company_name, created_at)
 *         fancyrobot.score_history (id, user_id FK auth.users, domain, overall_score, mention_rate, provider_scores, scored_at)
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { COMPANIES, ARI_SCORES } from '../constants.js';

interface SeedOptions {
  dryRun: boolean;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function seedAri(supabase: SupabaseClient, opts: SeedOptions, authUserId: string) {
  const now = new Date().toISOString();

  // Monitored brands — one per company, keyed by (user_id, domain)
  const brands = Object.values(COMPANIES).map((c) => ({
    user_id: authUserId,
    domain: c.domain,
    company_name: c.name,
    created_at: now,
  }));

  // Score history — 3 snapshots per company (90 days ago, 45 days ago, today)
  const snapshotOffsets = [90, 45, 0];
  const scoreHistory: Array<{
    user_id: string;
    domain: string;
    overall_score: number;
    mention_rate: number;
    provider_scores: Record<string, unknown>;
    scored_at: string;
  }> = [];

  for (const [entityId, scores] of Object.entries(ARI_SCORES)) {
    const company = Object.values(COMPANIES).find((c) => c.id === entityId);
    if (!company) continue;

    scores.history.forEach((score, idx) => {
      const offset = snapshotOffsets[idx];
      scoreHistory.push({
        user_id: authUserId,
        domain: company.domain,
        overall_score: score,
        mention_rate: Math.round(score * 0.8),
        provider_scores: {
          chatgpt: Math.min(100, score + 3),
          gemini: Math.max(0, score - 2),
          perplexity: Math.min(100, score + 1),
        },
        scored_at: daysAgo(offset),
      });
    });
  }

  if (opts.dryRun) {
    console.log(`  [dry-run] ARI: ${brands.length} monitored brands, ${scoreHistory.length} score snapshots`);
    return { brands: brands.length, scores: scoreHistory.length };
  }

  const frDb = supabase.schema('fancyrobot');

  // Monitored brands — upsert on unique(user_id, domain)
  const { error: brandErr } = await frDb
    .from('monitored_brands')
    .upsert(brands, { onConflict: 'user_id,domain' });
  if (brandErr) throw new Error(`ARI monitored_brands: ${brandErr.message}`);

  // Score history — delete existing for this user, then insert fresh
  await frDb.from('score_history').delete().eq('user_id', authUserId);
  const { error: scoreErr } = await frDb.from('score_history').insert(scoreHistory);
  if (scoreErr) throw new Error(`ARI score_history: ${scoreErr.message}`);

  console.log(`  ARI: ${brands.length} monitored brands, ${scoreHistory.length} score snapshots`);
  return { brands: brands.length, scores: scoreHistory.length };
}
