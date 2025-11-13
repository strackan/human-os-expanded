import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/services/CustomerService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';
import { validateQueryParams, validateRequest, CustomerQuerySchema, CreateCustomerSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const validation = validateQueryParams(request, CustomerQuerySchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const {
      search = '',
      industry = '',
      healthScoreMin,
      healthScoreMax,
      minARR,
      sort = 'name',
      order = 'asc',
      page = 1,
      pageSize = 25,
    } = validation.data;

    // Build comprehensive filters object
    const filters: any = {};
    if (search) filters.search = search;
    if (industry) filters.industry = industry;
    if (healthScoreMin) filters.health_score_min = healthScoreMin;
    if (healthScoreMax) filters.health_score_max = healthScoreMax;
    if (minARR) filters.current_arr_min = minARR;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();
    const sortOptions = { field: sort as any, direction: order };
    
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
    // Validate request body
    const validation = await validateRequest(request, CreateCustomerSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { name, domain, industry, healthScore, renewalDate, currentArr, assignedTo } = validation.data;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();
    const newCustomer = await CustomerService.createCustomer({
      name,
      domain: domain || '',
      industry: industry || '',
      health_score: healthScore || 50,
      renewal_date: renewalDate || new Date().toISOString().split('T')[0],
      current_arr: currentArr || 0,
      assigned_to: assignedTo || undefined
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