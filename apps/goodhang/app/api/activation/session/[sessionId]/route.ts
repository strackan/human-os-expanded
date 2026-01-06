/**
 * GET /api/activation/session/[sessionId]
 *
 * Gets the activation key for a specific assessment session.
 * Returns existing key if one exists, or generates a new one.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service client for direct DB access
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = getSupabase();

    // First, check if there's already an activation key for this session using RPC
    const { data: existingKeys, error: fetchError } = await supabase
      .rpc('get_activation_key_for_session', { p_session_id: sessionId });

    if (!fetchError && existingKeys && existingKeys.length > 0) {
      const existingKey = existingKeys[0];
      // Return existing key
      return NextResponse.json({
        success: true,
        code: existingKey.code,
        product: existingKey.product,
        expiresAt: existingKey.expires_at,
        deepLink: existingKey.deep_link,
        preview: existingKey.metadata,
      });
    }

    // No existing key, check if session exists and get its data
    const { data: session, error: sessionError } = await supabase
      .from('cs_assessment_sessions')
      .select('id, user_id, status, tier, archetype, overall_score')
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
        { success: false, error: 'Assessment not yet completed' },
        { status: 400 }
      );
    }

    // Generate a new activation key
    const { data: keyData, error: keyError } = await supabase.rpc('create_activation_key', {
      p_product: 'goodhang',
      p_session_id: sessionId,
      p_expires_in_days: 30,
      p_metadata: {
        tier: session.tier,
        archetype_hint: session.archetype,
        overall_score: session.overall_score,
        user_id: session.user_id,
      },
    });

    if (keyError || !keyData || keyData.length === 0) {
      console.error('Error generating activation key:', keyError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate activation key' },
        { status: 500 }
      );
    }

    const result = keyData[0];
    return NextResponse.json({
      success: true,
      code: result.code,
      product: 'goodhang',
      expiresAt: result.expires_at,
      deepLink: result.deep_link,
      preview: {
        tier: session.tier,
        archetype_hint: session.archetype,
      },
    });
  } catch (error) {
    console.error('Error in /api/activation/session/[sessionId]:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
