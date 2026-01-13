/**
 * GET /api/orchestrator/demo/status
 *
 * Get demo workflow sequence status for the current CSM
 *
 * Query params:
 * - csm_id: string (optional, defaults to current user)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDemoSequenceStatus } from '@/lib/workflows/orchestrator-db';

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
    const csmId = searchParams.get('csm_id') || user.id;

    // Get demo sequence status
    const status = await getDemoSequenceStatus(csmId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching demo sequence status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demo sequence status' },
      { status: 500 }
    );
  }
}
