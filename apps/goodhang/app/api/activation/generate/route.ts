/**
 * POST /api/activation/generate
 *
 * Generates an activation key for a completed assessment session.
 * Called internally after assessment completion.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy client creation to avoid build-time errors
let _supabase: SupabaseClient | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, product = 'goodhang', expiresInDays = 7, metadata = {} } = body;

    // Validate product
    if (!['goodhang', 'renubu'].includes(product)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product. Must be "goodhang" or "renubu"' },
        { status: 400 }
      );
    }

    // Session ID is optional - keys can be generated without a session
    // (e.g., for invite codes, promotional keys)

    // If session provided, verify it exists
    if (sessionId) {
      const { data: session, error: sessionError } = await getSupabase()
        .from('cs_assessment_sessions')
        .select('id, status, tier, archetype')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        return NextResponse.json(
          { success: false, error: 'Session not found' },
          { status: 404 }
        );
      }

      // Add session info to metadata for preview
      metadata.tier = session.tier;
      metadata.archetype_hint = session.archetype;
      metadata.session_status = session.status;
    }

    // Generate the activation key
    const { data, error } = await getSupabase().rpc('create_activation_key', {
      p_product: product,
      p_session_id: sessionId || null,
      p_expires_in_days: expiresInDays,
      p_metadata: metadata,
    });

    if (error) {
      console.error('Generate key error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to generate activation key' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate activation key' },
        { status: 500 }
      );
    }

    const result = data[0];

    return NextResponse.json({
      success: true,
      code: result.code,
      product,
      expiresAt: result.expires_at,
      deepLink: result.deep_link,
    });
  } catch (error) {
    console.error('Unexpected error in generate:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// This endpoint should be authenticated/internal only
// For now, just prevent CORS access
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
