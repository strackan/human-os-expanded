import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/services/CustomerService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract all possible filter parameters
    const search = searchParams.get('search') || '';
    const industry = searchParams.get('industry') || '';
    const healthScoreMin = searchParams.get('healthScoreMin');
    const healthScoreMax = searchParams.get('healthScoreMax');
    const minARR = searchParams.get('minARR');
    
    const sort = searchParams.get('sort') || 'name';
    const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);

    // Build comprehensive filters object
    const filters: any = {};
    if (search) filters.search = search;
    if (industry) filters.industry = industry;
    if (healthScoreMin) filters.health_score_min = Number(healthScoreMin);
    if (healthScoreMax) filters.health_score_max = Number(healthScoreMax);
    if (minARR) filters.current_arr_min = Number(minARR);

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();
    const sortOptions = { field: sort as any, direction: order as 'asc' | 'desc' };
    
    console.log('🔍 API route calling CustomerService with filters:', filters);
    console.log('🔍 Demo mode:', demoMode, '| Auth bypass:', authBypassEnabled);
    const result = await CustomerService.getCustomers(filters, sortOptions, page, pageSize, supabase);

    return NextResponse.json({
      customers: result.customers,
      page,
      pageSize,
      count: result.total,
      totalPages: Math.ceil(result.total / pageSize)
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch customers', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();
    const newCustomer = await CustomerService.createCustomer({
      name: body.name,
      domain: body.domain || '',
      industry: body.industry || '',
      health_score: body.health_score || 50,
      renewal_date: body.renewal_date || new Date().toISOString().split('T')[0],
      current_arr: body.current_arr ? parseFloat(body.current_arr) : 0,
      assigned_to: body.assigned_to || null
    }, supabase);

    return NextResponse.json(
      { customer: newCustomer, message: 'Customer created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}