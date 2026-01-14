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

    // Check if already redeemed - but allow the same user to re-authenticate
    // This handles the case where user reinstalls app or clears data
    if (keyData.redeemed_at) {
      // Get the auth_id of the user who redeemed this key
      let redeemedByAuthId: string | null = keyData.user_id; // Legacy auth.users reference
      if (keyData.human_os_user_id) {
        const { data: humanOsUser } = await getSupabase()
          .schema('human_os')
          .from('users')
          .select('auth_id')
          .eq('id', keyData.human_os_user_id)
          .single();
        if (humanOsUser?.auth_id) {
          redeemedByAuthId = humanOsUser.auth_id;
        }
      }

      // Return as valid but mark as already redeemed with user info
      // Desktop client can then prompt user to sign in with the same account
      return NextResponse.json({
        valid: true,
        alreadyRedeemed: true,
        product: keyData.product,
        sessionId: keyData.session_id,
        hasExistingUser: true,
        userId: redeemedByAuthId,
        preview: {
          tier: (keyData.metadata as Record<string, string>)?.tier || 'unknown',
          archetypeHint: (keyData.metadata as Record<string, string>)?.archetype_hint || 'Your character awaits...',
          overallScoreRange: (keyData.metadata as Record<string, string>)?.score_range || '70-100',
        },
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
