/**
 * POST /api/activation/validate
 *
 * Validates an activation key and returns session preview.
 * Called by desktop client before account creation.
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
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Activation code is required' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase().trim();

    // Query activation_keys table directly (avoids schema mismatch with x_human)
    const { data: keyData, error } = await getSupabase()
      .from('activation_keys')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (error || !keyData) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid activation code',
      });
    }

    // Check if already redeemed
    if (keyData.redeemed_at) {
      return NextResponse.json({
        valid: false,
        error: 'This activation code has already been used',
      });
    }

    // Check if expired
    if (new Date(keyData.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'This activation code has expired',
      });
    }

    // Preview data comes from metadata JSONB column
    const metadata = keyData.metadata || {};

    // Check if there's an existing user linked to this key
    // Need to return auth_id (auth.users.id) for desktop client comparison
    let authUserId: string | null = null;
    if (keyData.human_os_user_id) {
      // Look up the human_os.users record to get auth_id
      const { data: humanOsUser } = await getSupabase()
        .schema('human_os')
        .from('users')
        .select('auth_id')
        .eq('id', keyData.human_os_user_id)
        .single();
      authUserId = humanOsUser?.auth_id || null;
    }
    // Fallback to user_id column (legacy auth.users reference)
    if (!authUserId && keyData.user_id) {
      authUserId = keyData.user_id;
    }

    const hasExistingUser = !!authUserId;

    return NextResponse.json({
      valid: true,
      product: keyData.product,
      sessionId: keyData.session_id,
      hasExistingUser,
      userId: authUserId, // Return auth.users.id for client comparison
      preview: {
        tier: metadata.tier || 'unknown',
        archetypeHint: metadata.archetype_hint || metadata.character_class || 'Your character awaits...',
        overallScoreRange: metadata.score_range || '70-100',
      },
    });
  } catch (error) {
    console.error('Unexpected error in validate:', error);
    return NextResponse.json(
      { valid: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Allow CORS for desktop client
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
