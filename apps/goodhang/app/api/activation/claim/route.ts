/**
 * POST /api/activation/claim
 *
 * Claims an activation key for a human_os user.
 * Links the activation key and creates product membership.
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
    const { code, userId } = body; // userId is now human_os.users.id

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
    const supabase = getSupabase();

    // Get the activation key
    const { data: keyData, error: keyError } = await supabase
      .from('activation_keys')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (keyError || !keyData) {
      return NextResponse.json({
        success: false,
        error: 'Invalid activation code',
      });
    }

    // Check if already redeemed
    if (keyData.redeemed_at) {
      return NextResponse.json({
        success: false,
        error: 'This activation code has already been used',
      });
    }

    // Check if expired
    if (new Date(keyData.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'This activation code has expired',
      });
    }

    // Claim the key - update with human_os_user_id
    const { error: updateError } = await supabase
      .from('activation_keys')
      .update({
        human_os_user_id: userId,
        redeemed_at: new Date().toISOString(),
      })
      .eq('id', keyData.id);

    if (updateError) {
      console.error('Claim update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to claim activation code' },
        { status: 500 }
      );
    }

    // Create user_product entry in human_os schema
    const { error: productError } = await supabase
      .schema('human_os')
      .from('user_products')
      .upsert({
        user_id: userId,
        product: keyData.product,
        activation_key_id: keyData.id,
        metadata: keyData.metadata || {},
      }, { onConflict: 'user_id,product' });

    if (productError) {
      console.error('Product entry error:', productError);
      // Non-fatal - key is still claimed
    }

    return NextResponse.json({
      success: true,
      userId,
      product: keyData.product,
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
