/**
 * ARI Scores API
 *
 * GET  /api/ari/scores?customerId=X — latest ARI score for customer
 * POST /api/ari/scores — trigger new scan { customerId, entityName?, force? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, getUserCompanyId } from '@/lib/supabase-server';
import { ARIService } from '@/lib/services/ARIService';
import { ARIClient } from '@/lib/mcp/clients/ARIClient';

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

    const customerId = request.nextUrl.searchParams.get('customerId');
    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    const ariService = new ARIService(supabase);
    const score = await ariService.getLatestScore(companyId, customerId);

    return NextResponse.json({ score });
  } catch (error) {
    console.error('[ARI Scores API] GET error:', error);
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
    const { customerId, entityName, entityType, force } = body;

    if (!entityName && !customerId) {
      return NextResponse.json(
        { error: 'Either entityName or customerId is required' },
        { status: 400 }
      );
    }

    const ariClient = new ARIClient();
    const ariService = new ARIService(supabase, ariClient);

    // If customerId provided but no entityName, look up the mapping
    let resolvedEntityName = entityName;
    if (!resolvedEntityName && customerId) {
      const mappings = await ariService.getMappings(companyId, customerId);
      if (mappings.length === 0) {
        return NextResponse.json(
          { error: 'No ARI entity mapped to this customer. Create a mapping first.' },
          { status: 404 }
        );
      }
      resolvedEntityName = mappings[0].entity_name;
    }

    // Check for recent score if not forcing
    if (!force && customerId) {
      const existing = await ariService.getLatestScore(companyId, customerId);
      if (existing) {
        const hoursSinceLast =
          (Date.now() - new Date(existing.scan_completed_at).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLast < 1) {
          return NextResponse.json({
            score: existing,
            cached: true,
            message: 'Recent scan exists. Use force=true to re-scan.',
          });
        }
      }
    }

    const snapshot = await ariService.runScan({
      companyId,
      customerId,
      entityName: resolvedEntityName,
      entityType,
      triggeredBy: 'manual',
    });

    if (!snapshot) {
      return NextResponse.json(
        { error: 'ARI scan failed. Check that ARI backend is running.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ score: snapshot });
  } catch (error) {
    console.error('[ARI Scores API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
