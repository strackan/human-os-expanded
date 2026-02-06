/**
 * POST /api/activation/reset
 *
 * Resets an activation key by clearing its redeemed_at field.
 * This allows the key to be used again for testing/development.
 *
 * Only works in development mode or for specific allowed codes.
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

// CORS headers for desktop client
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Helper to create JSON response with CORS headers
function jsonResponse(data: object, status: number = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

// Allowed codes that can be reset (for dev/testing)
const ALLOWED_RESET_CODES = [
  'B744-DD4D-6D47', // Scott's dev key
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return jsonResponse(
        { success: false, error: 'Activation code is required' },
        400
      );
    }

    const normalizedCode = code.toUpperCase().trim();

    // Only allow reset for specific codes (security measure)
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && !ALLOWED_RESET_CODES.includes(normalizedCode)) {
      return jsonResponse(
        { success: false, error: 'This key cannot be reset' },
        403
      );
    }

    // Reset the activation key
    const { data, error } = await getSupabase()
      .from('activation_keys')
      .update({ redeemed_at: null })
      .eq('code', normalizedCode)
      .select('code, redeemed_at')
      .single();

    if (error) {
      console.error('Error resetting activation key:', error);
      return jsonResponse(
        { success: false, error: 'Failed to reset key' },
        500
      );
    }

    if (!data) {
      return jsonResponse(
        { success: false, error: 'Key not found' },
        404
      );
    }

    console.log('Reset activation key:', normalizedCode);

    return jsonResponse({
      success: true,
      code: normalizedCode,
    });
  } catch (error) {
    console.error('Unexpected error in reset:', error);
    return jsonResponse(
      { success: false, error: 'An unexpected error occurred' },
      500
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
