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

    // Call the database function
    const { data, error } = await getSupabase().rpc('validate_activation_key', {
      p_code: normalizedCode,
    });

    if (error) {
      console.error('Validation error:', error);
      return NextResponse.json(
        { valid: false, error: 'Failed to validate activation code' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'Invalid activation code' },
        { status: 200 }
      );
    }

    const result = data[0];

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        error: result.error || 'Invalid activation code',
      });
    }

    // Preview data comes from metadata JSONB column
    const preview = result.preview || {};

    // Check if there's an existing user linked to this key
    const hasExistingUser = !!preview.user_id;

    return NextResponse.json({
      valid: true,
      product: result.product,
      sessionId: result.session_id,
      hasExistingUser,
      userId: preview.user_id || null,
      preview: {
        tier: preview.tier || 'unknown',
        archetypeHint: preview.archetype_hint || 'Your character awaits...',
        overallScoreRange: preview.score_range || '70-100',
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
