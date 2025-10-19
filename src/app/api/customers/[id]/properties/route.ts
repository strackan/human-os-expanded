import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

/**
 * GET /api/customers/[id]/properties
 * Fetch customer properties (advanced scoring data)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled)
      ? createServiceRoleClient()
      : await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('customer_properties')
      .select('*')
      .eq('customer_id', resolvedParams.id)
      .single();

    if (error) {
      // If no properties found, return empty object (not an error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ properties: null });
      }

      console.error('Error fetching customer properties:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customer properties' },
        { status: 500 }
      );
    }

    return NextResponse.json({ properties: data });
  } catch (error) {
    console.error('Error in customer properties API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
