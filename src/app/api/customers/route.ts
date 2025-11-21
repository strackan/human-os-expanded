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
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';
import { validateQueryParams, validateRequest, CustomerQuerySchema, CreateCustomerSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 === CUSTOMERS API ROUTE START ===');

    // Validate query parameters
    const validation = validateQueryParams(request, CustomerQuerySchema);
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error);
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

    // Check if demo mode or auth bypass is enabled (following renubu.demo pattern)
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';

    console.log('🔧 Environment:', {
      isDemoMode,
      authBypassEnabled,
      nodeEnv: process.env.NODE_ENV
    });

    // Get authenticated user first (always use server client for auth)
    console.log('🔐 Creating server Supabase client for auth...');
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    console.log('👤 Auth result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message
    });

    if (authError || !user) {
      console.log('❌ Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for database queries in demo mode to bypass RLS
    const supabase = (isDemoMode || authBypassEnabled)
      ? createServiceRoleClient()
      : authSupabase;

    console.log('🎮 Using client type:', isDemoMode || authBypassEnabled ? 'SERVICE_ROLE' : 'SERVER');

    // Get user's company_id from profiles (using service role in demo mode bypasses RLS)
    console.log('👤 Fetching profile for user:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, email, role')
      .eq('id', user.id)
      .single();

    console.log('👤 Profile result:', {
      hasProfile: !!profile,
      profile: profile,
      profileError: profileError?.message,
      profileErrorDetails: profileError
    });

    if (!profile?.company_id) {
      console.log('❌ No company_id found for user');
      return NextResponse.json({
        error: 'No company associated with user',
        debug: {
          userId: user.id,
          email: user.email,
          profile: profile,
          profileError: profileError?.message
        }
      }, { status: 403 });
    }

    console.log('✅ User has company_id:', profile.company_id);

    const sortOptions = { field: sort as any, direction: order };

    console.log('🔍 API route calling CustomerService with filters:', filters);
    console.log('🔍 Company ID:', profile.company_id);
    console.log('🎮 Using service role client:', isDemoMode || authBypassEnabled);
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

    // Check if demo mode or auth bypass is enabled (following renubu.demo pattern)
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';

    // Get authenticated user first (always use server client for auth)
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for database queries in demo mode to bypass RLS
    const supabase = (isDemoMode || authBypassEnabled)
      ? createServiceRoleClient()
      : authSupabase;

    // Get user's company_id from profiles (using service role in demo mode bypasses RLS)
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
