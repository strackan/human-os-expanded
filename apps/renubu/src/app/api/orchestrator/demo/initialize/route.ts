/**
 * POST /api/orchestrator/demo/initialize
 *
 * Initialize demo workflow sequence for a CSM and customer
 * Creates workflow executions for all 3 demo workflows
 *
 * Body:
 * - csm_id: string (optional, defaults to current user)
 * - customer_id: string (required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDemoWorkflowSequence } from '@/lib/workflows/orchestrator-db';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    const csmId = body.csm_id || user.id;
    const customerId = body.customer_id;

    if (!customerId) {
      return NextResponse.json(
        { error: 'customer_id is required' },
        { status: 400 }
      );
    }

    // Create demo sequence
    const executionIds = await createDemoWorkflowSequence(csmId, customerId);

    return NextResponse.json({
      success: true,
      execution_ids: executionIds,
      count: executionIds.length
    });
  } catch (error) {
    console.error('Error initializing demo sequence:', error);
    return NextResponse.json(
      { error: 'Failed to initialize demo sequence' },
      { status: 500 }
    );
  }
}
