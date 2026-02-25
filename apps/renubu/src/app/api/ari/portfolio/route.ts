/**
 * ARI Portfolio API
 *
 * GET /api/ari/portfolio — all latest scores across company's book
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedClient, getUserCompanyId } from '@/lib/supabase-server';
import { ARIService } from '@/lib/services/ARIService';

export async function GET() {
  try {
    const { user, supabase, error: authError } = await getAuthenticatedClient();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = await getUserCompanyId(user.id, supabase);
    if (!companyId) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 403 });
    }

    const ariService = new ARIService(supabase);
    const scores = await ariService.getPortfolioScores(companyId);

    return NextResponse.json({ scores });
  } catch (error) {
    console.error('[ARI Portfolio API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
