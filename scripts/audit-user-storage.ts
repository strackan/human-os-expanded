/**
 * Audit a user's files across both Supabase storage buckets
 * against the canonical file manifest.
 *
 * Usage: npx tsx scripts/audit-user-storage.ts <entity-slug>
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function audit(slug: string) {
  console.log(`\n=== STORAGE AUDIT: ${slug} ===\n`);

  // List files in human-os bucket
  console.log('--- human-os bucket ---');
  const { data: root } = await supabase.storage.from('human-os').list(`contexts/${slug}`);
  if (root && root.length > 0) {
    console.log(`  contexts/${slug}/`);
    root.forEach(f => console.log(`    ${f.name}`));
  } else {
    console.log(`  contexts/${slug}/ — EMPTY`);
  }

  const { data: voice } = await supabase.storage.from('human-os').list(`contexts/${slug}/voice`);
  if (voice && voice.length > 0) {
    console.log(`  contexts/${slug}/voice/`);
    voice.forEach(f => console.log(`    ${f.name}`));
  } else {
    console.log(`  contexts/${slug}/voice/ — EMPTY`);
  }

  // List files in contexts bucket
  console.log('\n--- contexts bucket ---');
  const { data: ctxRoot } = await supabase.storage.from('contexts').list(slug);
  if (ctxRoot && ctxRoot.length > 0) {
    console.log(`  ${slug}/`);
    ctxRoot.forEach(f => console.log(`    ${f.name}`));
  } else {
    console.log(`  ${slug}/ — EMPTY`);
  }

  const { data: ctxVoice } = await supabase.storage.from('contexts').list(`${slug}/voice`);
  if (ctxVoice && ctxVoice.length > 0) {
    console.log(`  ${slug}/voice/`);
    ctxVoice.forEach(f => console.log(`    ${f.name}`));
  }

  // Canonical file manifest check against human-os bucket
  console.log('\n--- Canonical File Manifest (human-os bucket) ---');
  const files = [
    { path: `contexts/${slug}/corpus_raw.md`, label: 'corpus_raw', tier: 'pre' },
    { path: `contexts/${slug}/CORPUS_SUMMARY.md`, label: 'CORPUS_SUMMARY', tier: 'pre' },
    { path: `contexts/${slug}/CHARACTER.md`, label: 'CHARACTER', tier: 'pre' },
    { path: `contexts/${slug}/DIGEST.md`, label: 'DIGEST', tier: 'T1' },
    { path: `contexts/${slug}/GAP_ANALYSIS.md`, label: 'GAP_ANALYSIS', tier: 'pre' },
    { path: `contexts/${slug}/GAP_ANALYSIS_FINAL.md`, label: 'GAP_ANALYSIS_FINAL', tier: 'post-sculptor' },
    { path: `contexts/${slug}/SCULPTOR_TRANSCRIPT.md`, label: 'SCULPTOR_TRANSCRIPT', tier: 'post-sculptor' },
    { path: `contexts/${slug}/E_QUESTIONS_OUTSTANDING.json`, label: 'E_QUESTIONS_OUTSTANDING', tier: 'post-sculptor' },
    { path: `contexts/${slug}/voice/01_WRITING_ENGINE.md`, label: '01_WRITING_ENGINE', tier: 'T1' },
    { path: `contexts/${slug}/voice/06_OPENINGS.md`, label: '06_OPENINGS', tier: 'T1' },
    { path: `contexts/${slug}/voice/07_MIDDLES.md`, label: '07_MIDDLES', tier: 'T1' },
    { path: `contexts/${slug}/voice/08_ENDINGS.md`, label: '08_ENDINGS', tier: 'T1' },
    { path: `contexts/${slug}/voice/10_EXAMPLES.md`, label: '10_EXAMPLES', tier: 'T1' },
    { path: `contexts/${slug}/voice/02_THEMES.md`, label: '02_THEMES', tier: 'T2' },
    { path: `contexts/${slug}/voice/03_GUARDRAILS.md`, label: '03_GUARDRAILS', tier: 'T2' },
    { path: `contexts/${slug}/voice/04_STORIES.md`, label: '04_STORIES', tier: 'T2' },
    { path: `contexts/${slug}/voice/05_ANECDOTES.md`, label: '05_ANECDOTES', tier: 'T2' },
    { path: `contexts/${slug}/voice/CONTEXT.md`, label: 'CONTEXT', tier: 'T2' },
    { path: `contexts/${slug}/voice/09_BLENDS.md`, label: '09_BLENDS', tier: 'T3' },
    { path: `contexts/${slug}/voice/00_START_HERE.md`, label: '00_START_HERE', tier: 'T3' },
  ];

  let found = 0;
  let missing = 0;

  for (const f of files) {
    const { data, error } = await supabase.storage.from('human-os').download(f.path);
    if (error || !data) {
      console.log(`  ❌ ${f.label} [${f.tier}]`);
      missing++;
    } else {
      const text = await data.text();
      console.log(`  ✅ ${f.label} [${f.tier}] (${text.length} chars)`);
      found++;
    }
  }

  console.log(`\n  Score: ${found}/${found + missing} files present`);

  // Summary by tier
  const tiers: Record<string, { found: number; total: number }> = {};
  for (const f of files) {
    if (!tiers[f.tier]) tiers[f.tier] = { found: 0, total: 0 };
    tiers[f.tier].total++;
  }
  for (const f of files) {
    const { data } = await supabase.storage.from('human-os').download(f.path);
    if (data) tiers[f.tier].found++;
  }
  console.log('\n  By tier:');
  for (const [tier, counts] of Object.entries(tiers)) {
    const status = counts.found === counts.total ? '✅' : '⚠️';
    console.log(`    ${status} ${tier}: ${counts.found}/${counts.total}`);
  }
}

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: npx tsx scripts/audit-user-storage.ts <entity-slug>');
  process.exit(1);
}

audit(slug).catch(console.error);
