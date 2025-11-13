import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

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

    // Get authenticated user and company_id
    const supabase = createServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 403 });
    }

    // First verify customer belongs to user's company
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', resolvedParams.id)
      .eq('company_id', profile.company_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

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
