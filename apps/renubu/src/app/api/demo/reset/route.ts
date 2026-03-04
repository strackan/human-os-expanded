/**
 * Demo Reset Endpoint
 *
 * POST /api/demo/reset
 * - Resets demo environment to baseline seed data
 * - Protected by DEMO_RESET_SECRET or CRON_SECRET
 * - Called nightly by Vercel Cron (3 AM ET / 7 AM UTC)
 * - Can be triggered manually with bearer token
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const demoSecret = process.env.DEMO_RESET_SECRET;
    const cronSecret = process.env.CRON_SECRET;

    // Require valid secret
    const token = authHeader?.replace('Bearer ', '');
    const isAuthorized =
      (demoSecret && token === demoSecret) ||
      (cronSecret && token === cronSecret);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Dynamic import to avoid bundling seed dependencies in the main app
    // In the Vercel deploy, the seed script runs via the orchestrator
    const supabaseUrl = process.env.DEMO_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.DEMO_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing demo Supabase credentials' },
        { status: 500 }
      );
    }

    // Use dynamic import for the Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Import seed modules
    const { seedEntitySpine } = await import('../../../../../../scripts/demo-seed/modules/entity-spine.js');
    const { seedRenubu } = await import('../../../../../../scripts/demo-seed/modules/renubu.js');
    const { seedGoodHang } = await import('../../../../../../scripts/demo-seed/modules/goodhang.js');
    const { seedAri } = await import('../../../../../../scripts/demo-seed/modules/ari.js');
    const { seedFounderOs } = await import('../../../../../../scripts/demo-seed/modules/founder-os.js');

    const opts = { dryRun: false };

    // Entity spine first
    const entityResult = await seedEntitySpine(supabase, opts);

    // App modules in parallel
    const [renubuResult, goodhangResult, ariResult, founderResult] = await Promise.all([
      seedRenubu(supabase, opts),
      seedGoodHang(supabase, opts),
      seedAri(supabase, opts),
      seedFounderOs(supabase, opts),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        entities: entityResult,
        renubu: renubuResult,
        goodhang: goodhangResult,
        ari: ariResult,
        founderOs: founderResult,
      },
    });
  } catch (error) {
    console.error('[DemoReset] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Demo reset failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow GET for Vercel Cron (sends GET by default)
export async function GET(request: NextRequest) {
  return POST(request);
}
