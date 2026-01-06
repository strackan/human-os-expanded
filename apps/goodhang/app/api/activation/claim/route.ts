/**
 * POST /api/activation/claim
 *
 * Claims an activation key for a user after account creation.
 * Links the assessment session to the user.
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
    const { code, userId } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Activation code is required' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase().trim();

    // Call the database function
    const { data, error } = await getSupabase().rpc('claim_activation_key', {
      p_code: normalizedCode,
      p_user_id: userId,
    });

    if (error) {
      console.error('Claim error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to claim activation code' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to claim activation code' },
        { status: 500 }
      );
    }

    const result = data[0];

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to claim activation code',
      });
    }

    return NextResponse.json({
      success: true,
      userId,
      product: result.product,
    });
  } catch (error) {
    console.error('Unexpected error in claim:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
