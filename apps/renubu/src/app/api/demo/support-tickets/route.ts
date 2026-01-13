import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

/**
 * GET /api/demo/support-tickets
 * Fetch demo support tickets for a customer
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
      .from('demo_support_tickets')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching demo support tickets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch demo support tickets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tickets: data || [] });
  } catch (error) {
    console.error('Error in demo support tickets API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
