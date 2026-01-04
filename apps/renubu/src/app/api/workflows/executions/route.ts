/**
 * Workflow Executions API
 *
 * POST /api/workflows/executions
 * - Create a new workflow execution
 *
 * Phase 3.2: Backend Workflow Execution & State Tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowExecutionService } from '@/lib/services/WorkflowExecutionService';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { validateRequest, CreateWorkflowExecutionSchema, z } from '@/lib/validation';

// Extended schema for this endpoint (includes additional fields)
const ExtendedWorkflowExecutionSchema = CreateWorkflowExecutionSchema.extend({
  workflowName: z.string().min(1),
  workflowType: z.string().optional(),
  totalSteps: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, ExtendedWorkflowExecutionSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const {
      workflowConfigId,
      workflowName,
      workflowType,
      customerId,
      totalSteps
    } = validation.data;

    // Authenticate user
    const supabase = createServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's company_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'No company associated with user' },
        { status: 403 }
      );
    }

    // Verify customer ownership
    const { data: customer } = await supabase
      .from('customers')
      .select('id, company_id')
      .eq('id', customerId)
      .single();

    if (!customer || customer.company_id !== profile.company_id) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Create workflow execution
    const execution = await WorkflowExecutionService.createExecution({
      workflowConfigId,
      workflowName,
      workflowType,
      customerId,
      userId: user.id,
      totalSteps
    }, supabase);

    return NextResponse.json({
      execution,
      message: 'Workflow execution created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating workflow execution:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create workflow execution' },
      { status: 500 }
    );
  }
}
