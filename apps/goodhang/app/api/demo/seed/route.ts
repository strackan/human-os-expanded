/**
 * Demo Seed API
 *
 * POST /api/demo/seed
 *
 * Triggers seeding of synthetic profiles for the demo.
 * This is an admin endpoint - should be protected in production.
 */

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// TYPES
// =============================================================================

interface SeedRequestBody {
  count?: number;
  seed?: number;
  clearExisting?: boolean;
  generateEmbeddings?: boolean;
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SeedRequestBody;

    // Check for admin authorization (simplified for demo)
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.DEMO_ADMIN_SECRET;

    if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide valid admin secret.' },
        { status: 401 }
      );
    }

    const config = {
      count: body.count || 100,
      seed: body.seed || 42,
      clearExisting: body.clearExisting || false,
      generateEmbeddings: body.generateEmbeddings !== false,
    };

    // For now, return instructions to run CLI
    // In a full implementation, this would trigger the seeding process
    return NextResponse.json({
      message: 'Demo seeding initiated',
      config,
      instructions: [
        'Run the following commands to seed the demo:',
        '',
        `cd apps/goodhang`,
        `npx tsx scripts/demo/generate-profiles.ts --count ${config.count} --seed ${config.seed}${config.clearExisting ? ' --clear' : ''}`,
        `npx tsx scripts/demo/generate-network.ts --seed ${config.seed}`,
        config.generateEmbeddings ? `npx tsx scripts/demo/generate-embeddings.ts --all` : '',
      ].filter(Boolean),
      note: 'API-triggered seeding is not yet implemented. Use CLI commands above.',
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seeding failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Return status and documentation
// =============================================================================

export async function GET() {
  return NextResponse.json({
    name: 'Good Hang Demo Seed API',
    version: '1.0.0',
    description: 'Seed synthetic profiles for the Good Hang network demo',
    endpoints: {
      'POST /api/demo/seed': {
        description: 'Trigger profile seeding (admin only)',
        headers: {
          Authorization: 'Bearer <DEMO_ADMIN_SECRET>',
        },
        body: {
          count: 'number (optional, default 100) - Number of profiles to generate',
          seed: 'number (optional, default 42) - Random seed for reproducibility',
          clearExisting: 'boolean (optional, default false) - Clear existing demo data',
          generateEmbeddings: 'boolean (optional, default true) - Generate embeddings after seeding',
        },
      },
    },
    cliCommands: {
      profiles: 'npx tsx scripts/demo/generate-profiles.ts --count 100 --seed 42',
      network: 'npx tsx scripts/demo/generate-network.ts --seed 42',
      embeddings: 'npx tsx scripts/demo/generate-embeddings.ts --all',
    },
    requiredEnvVars: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ANTHROPIC_API_KEY (for profile enhancement)',
      'OPENAI_API_KEY (for embeddings)',
    ],
  });
}
