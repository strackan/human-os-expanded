/**
 * Parking Lot API Routes
 * GET /api/parking-lot - List items
 * POST /api/parking-lot - Create new item
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ParkingLotService } from '@/lib/services/ParkingLotService';
import type { CreateParkingLotItemRequest, ListParkingLotItemsRequest } from '@/types/parking-lot';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const requestData: ListParkingLotItemsRequest = {
      mode: searchParams.get('mode') as any,
      categories: searchParams.get('categories')?.split(',').filter(Boolean),
      status: searchParams.get('status') as any,
      minReadiness: searchParams.get('minReadiness') ? parseInt(searchParams.get('minReadiness')!) : undefined,
      sortBy: searchParams.get('sortBy') as any || 'readiness',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    const result = await ParkingLotService.list(user.id, requestData);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /parking-lot GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as CreateParkingLotItemRequest;

    // Validate required fields
    if (!body.raw_input) {
      return NextResponse.json(
        { success: false, error: 'raw_input is required' },
        { status: 400 }
      );
    }

    // Fetch context for LLM enhancement
    const context = await fetchContextForParsing(supabase, user.id);

    const result = await ParkingLotService.create(user.id, body, context);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('[API /parking-lot POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper: Fetch context for LLM parsing
 */
async function fetchContextForParsing(supabase: any, userId: string) {
  try {
    // Fetch recent workflows
    const { data: workflows } = await supabase
      .from('workflow_executions')
      .select('workflow_type, customer_name, status')
      .eq('assigned_csm_id', userId)
      .in('status', ['in_progress', 'pending'])
      .limit(10);

    // Fetch recent customers
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name')
      .limit(20);

    // Fetch user's categories
    const { data: categories } = await supabase
      .from('parking_lot_categories')
      .select('name')
      .eq('user_id', userId);

    return {
      currentWorkflows: workflows || [],
      recentCustomers: customers || [],
      userCategories: categories?.map((c: any) => c.name) || []
    };
  } catch (error) {
    console.error('[fetchContextForParsing] Error:', error);
    return {};
  }
}
