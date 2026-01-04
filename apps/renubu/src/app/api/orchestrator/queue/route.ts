/**
 * GET /api/orchestrator/queue
 *
 * Get prioritized workflow queue for the current CSM
 * Supports both demo mode and production mode
 *
 * Query params:
 * - limit: number (default 10)
 * - demo: boolean (default false)
 * - csm_id: string (optional, defaults to current user)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkflowQueueForCSM } from '@/lib/workflows/orchestrator-db';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const demoMode = searchParams.get('demo') === 'true';
    const csmId = searchParams.get('csm_id') || user.id;

    // Get workflow queue
    const queue = await getWorkflowQueueForCSM(csmId, limit, demoMode);

    return NextResponse.json({
      queue,
      total: queue.length,
      demo_mode: demoMode
    });
  } catch (error) {
    console.error('Error fetching workflow queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow queue' },
      { status: 500 }
    );
  }
}
