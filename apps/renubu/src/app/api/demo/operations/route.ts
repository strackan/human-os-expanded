import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

/**
 * GET /api/demo/operations
 * Fetch demo operations for a customer
 * Query params: customer_id (required)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customer_id query parameter is required' },
        { status: 400 }
      );
    }

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled)
      ? createServiceRoleClient()
      : await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('demo_operations')
      .select('*')
      .eq('customer_id', customerId)
      .order('operation_date', { ascending: false });

    if (error) {
      console.error('Error fetching demo operations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch demo operations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ operations: data || [] });
  } catch (error) {
    console.error('Error in demo operations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
