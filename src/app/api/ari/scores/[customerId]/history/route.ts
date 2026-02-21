/**
 * ARI Score History API
 *
 * GET /api/ari/scores/{customerId}/history?limit=12 — score history for trending
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, getUserCompanyId } from '@/lib/supabase-server';
import { ARIService } from '@/lib/services/ARIService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { user, supabase, error: authError } = await getAuthenticatedClient();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = await getUserCompanyId(user.id, supabase);
    if (!companyId) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 403 });
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '12', 10);
    const ariService = new ARIService(supabase);

    const history = await ariService.getScoreHistory(
      companyId,
      resolvedParams.customerId,
      limit
    );

    return NextResponse.json({ history });
  } catch (error) {
    console.error('[ARI History API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
