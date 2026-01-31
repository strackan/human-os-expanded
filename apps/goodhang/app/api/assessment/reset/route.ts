// POST /api/assessment/reset
// Resets assessment completion status for a user (used by desktop app reset)

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Clear assessment_completed_at from profiles
    await supabase
      .from('profiles')
      .update({ assessment_completed_at: null })
      .eq('id', user_id);

    // Clear assessment from user_status
    const { data: existingStatus } = await supabase
      .from('user_status')
      .select('products')
      .eq('user_id', user_id)
      .single();

    if (existingStatus) {
      const products = existingStatus.products || {};
      const goodhang = products.goodhang || {};

      await supabase
        .from('user_status')
        .update({
          products: {
            ...products,
            goodhang: {
              ...goodhang,
              assessment: null,
            },
          },
        })
        .eq('user_id', user_id);
    }

    console.log(`Reset assessment status for user ${user_id}`);

    return NextResponse.json({
      success: true,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in /api/assessment/reset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
