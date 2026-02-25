/**
 * ARI Entity Mappings API
 *
 * GET  /api/ari/mappings?customerId=X — entity mappings
 * POST /api/ari/mappings — create mapping { customerId, entityName, entityType, competitors? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, getUserCompanyId } from '@/lib/supabase-server';
import { ARIService } from '@/lib/services/ARIService';

export async function GET(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthenticatedClient();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = await getUserCompanyId(user.id, supabase);
    if (!companyId) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 403 });
    }

    const customerId = request.nextUrl.searchParams.get('customerId') || undefined;
    const ariService = new ARIService(supabase);
    const mappings = await ariService.getMappings(companyId, customerId);

    return NextResponse.json({ mappings });
  } catch (error) {
    console.error('[ARI Mappings API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthenticatedClient();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = await getUserCompanyId(user.id, supabase);
    if (!companyId) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 403 });
    }

    const body = await request.json();
    const { customerId, entityName, entityType, category, competitors } = body;

    if (!customerId || !entityName) {
      return NextResponse.json(
        { error: 'customerId and entityName are required' },
        { status: 400 }
      );
    }

    const ariService = new ARIService(supabase);
    const mapping = await ariService.mapEntity({
      companyId,
      customerId,
      entityName,
      entityType,
      category,
      competitors,
    });

    if (!mapping) {
      return NextResponse.json({ error: 'Failed to create mapping' }, { status: 500 });
    }

    return NextResponse.json({ mapping }, { status: 201 });
  } catch (error) {
    console.error('[ARI Mappings API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
