/**
 * Customers API Route
 *
 * 🤖 AGENT REMINDER: This route demonstrates best practices:
 * ✅ Input validation with Zod schemas
 * ✅ Type-safe validated data
 * ✅ Error handling with proper status codes
 * ✅ See src/lib/validation/TEMPLATES.md for more patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/services/CustomerService';
import { createServiceRoleClient } from '@/lib/supabase-server';
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

    const sortOptions = { field: sort as any, direction: order };

    console.log('🔍 API route calling CustomerService with filters:', filters);
    console.log('🔍 Company ID:', profile.company_id);
    const result = await CustomerService.getCustomers(profile.company_id, filters, sortOptions, page, pageSize, supabase);

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

    const newCustomer = await CustomerService.createCustomer({
      name,
      domain: domain || '',
      industry: industry || '',
      health_score: healthScore || 50,
      renewal_date: renewalDate || new Date().toISOString().split('T')[0],
      current_arr: currentArr || 0,
      assigned_to: assignedTo || undefined
    }, profile.company_id, supabase);

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