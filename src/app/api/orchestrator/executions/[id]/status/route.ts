/**
 * PATCH /api/orchestrator/executions/[id]/status
 *
 * Update workflow execution status (start, complete, etc.)
 *
 * Body:
 * - status: 'not_started' | 'underway' | 'completed' (required)
 * - execution_data: object (optional, stores workflow progress)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_STATUSES = ['not_started', 'underway', 'completed', 'snoozed', 'skipped'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const executionId = params.id;

    // Parse body
    const body = await request.json();
    const status = body.status;
    const executionData = body.execution_data;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Build update object
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Set lifecycle timestamps
    if (status === 'underway' && !updates.started_at) {
      updates.started_at = new Date().toISOString();
    }

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    // Merge execution_data if provided
    if (executionData) {
      // Get current execution_data first
      const { data: current } = await supabase
        .from('workflow_executions')
        .select('execution_data')
        .eq('id', executionId)
        .single();

      updates.execution_data = {
        ...(current?.execution_data || {}),
        ...executionData
      };
    }

    // Update workflow execution
    const { data: execution, error: updateError } = await supabase
      .from('workflow_executions')
      .update(updates)
      .eq('id', executionId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      execution
    });
  } catch (error) {
    console.error('Error updating workflow status:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow status' },
      { status: 500 }
    );
  }
}
