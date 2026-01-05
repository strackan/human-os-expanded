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
    const { sessionId, expiresInDays = 7 } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Verify the session exists and is completed
    const { data: session, error: sessionError } = await getSupabase()
      .from('cs_assessment_sessions')
      .select('id, status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Assessment is not completed' },
        { status: 400 }
      );
    }

    // Generate the activation key
    const { data, error } = await getSupabase().rpc('create_activation_key', {
      p_session_id: sessionId,
      p_expires_in_days: expiresInDays,
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
