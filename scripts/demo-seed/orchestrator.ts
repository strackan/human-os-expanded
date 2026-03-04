#!/usr/bin/env tsx
/**
 * Demo Seed Orchestrator
 *
 * Seeds the demo Supabase instance with coherent cross-product data.
 * Creates demo auth user first, then entity spine, then per-app modules in parallel.
 *
 * Usage:
 *   tsx scripts/demo-seed/orchestrator.ts              # Seed demo DB
 *   tsx scripts/demo-seed/orchestrator.ts --dry-run    # Preview without writing
 *   tsx scripts/demo-seed/orchestrator.ts --reset full # Full reset (upsert all)
 */
import { createClient } from '@supabase/supabase-js';
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from './constants.js';
import { seedEntitySpine } from './modules/entity-spine.js';
import { seedRenubu } from './modules/renubu.js';
import { seedGoodHang } from './modules/goodhang.js';
import { seedAri } from './modules/ari.js';
import { seedFounderOs } from './modules/founder-os.js';

// ─── CLI Args ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const resetMode = args.includes('--reset') ? args[args.indexOf('--reset') + 1] || 'full' : null;

// ─── Supabase Client ─────────────────────────────────────────────────
const supabaseUrl = process.env.DEMO_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.DEMO_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing DEMO_SUPABASE_URL / DEMO_SUPABASE_SERVICE_KEY (or NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  const start = Date.now();
  const opts = { dryRun };

  console.log('');
  console.log(`=== Demo Seed ${dryRun ? '(DRY RUN)' : resetMode ? `(RESET: ${resetMode})` : ''} ===`);
  console.log(`Target: ${supabaseUrl}`);
  console.log('');

  // Phase 0: Ensure demo auth user exists (needed for fancyrobot FK constraints)
  console.log('[0/5] Demo auth user...');
  let authUserId: string;

  if (!dryRun) {
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: DEMO_USER_EMAIL,
      password: 'DemoSeed2024!',
      email_confirm: true,
      user_metadata: { name: DEMO_USER_NAME, demo: true },
    });

    if (createErr) {
      // User likely already exists — find them
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users?.find((u) => u.email === DEMO_USER_EMAIL);
      if (!existing) {
        throw new Error(`Cannot create or find demo auth user: ${createErr.message}`);
      }
      authUserId = existing.id;
      console.log(`  Found existing auth user: ${authUserId}`);
    } else {
      authUserId = newUser.user.id;
      console.log(`  Created auth user: ${authUserId}`);
    }
  } else {
    authUserId = 'dry-run-user-id';
    console.log(`  [dry-run] Would ensure demo auth user exists`);
  }

  // Phase 1: Entity spine (must run first)
  console.log('[1/5] Entity Spine...');
  const entityResult = await seedEntitySpine(supabase, opts);

  // Phase 2: Per-app modules (parallel)
  console.log('[2-5] App modules (parallel)...');
  const [renubuResult, goodhangResult, ariResult, founderResult] = await Promise.all([
    seedRenubu(supabase, opts).catch((e) => {
      console.error(`  Renubu FAILED: ${e.message}`);
      return { error: e.message };
    }),
    seedGoodHang(supabase, opts).catch((e) => {
      console.error(`  GoodHang FAILED: ${e.message}`);
      return { error: e.message };
    }),
    seedAri(supabase, opts, authUserId).catch((e) => {
      console.error(`  ARI FAILED: ${e.message}`);
      return { error: e.message };
    }),
    seedFounderOs(supabase, opts).catch((e) => {
      console.error(`  FounderOS FAILED: ${e.message}`);
      return { error: e.message };
    }),
  ]);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log('');
  console.log(`=== Done in ${elapsed}s ===`);
  console.log(JSON.stringify({
    dryRun,
    authUserId,
    entities: entityResult,
    renubu: renubuResult,
    goodhang: goodhangResult,
    ari: ariResult,
    founderOs: founderResult,
  }, null, 2));

  // Check for failures
  const results = [renubuResult, goodhangResult, ariResult, founderResult];
  const failures = results.filter((r) => 'error' in r);
  if (failures.length > 0) {
    console.error(`\n${failures.length} module(s) failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
