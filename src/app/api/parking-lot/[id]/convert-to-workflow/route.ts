/**
 * Parking Lot → Workflow Conversion API Route
 * POST /api/parking-lot/[id]/convert-to-workflow - Convert idea to workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ParkingLotService } from '@/lib/services/ParkingLotService';
import { createWorkflowExecution } from '@/lib/workflows/actions';
import type { ConvertToWorkflowRequest } from '@/types/parking-lot';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the item
    const itemResult = await ParkingLotService.getById(user.id, params.id);
    if (!itemResult.success || !itemResult.item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    const item = itemResult.item;

    // Parse request body
    const body = await request.json() as ConvertToWorkflowRequest;

    if (!body.workflow_config_id) {
      return NextResponse.json(
        { success: false, error: 'workflow_config_id is required' },
        { status: 400 }
      );
    }

    // Extract customer info from entities
    const customerName = item.extracted_entities.customers?.[0] || 'Unknown Customer';
    const customerId = item.related_customers?.[0] || null;

    // If no customer ID, try to find by name
    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && customerName !== 'Unknown Customer') {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .ilike('name', customerName)
        .single();

      if (customer) {
        resolvedCustomerId = customer.id;
      }
    }

    if (!resolvedCustomerId) {
      return NextResponse.json(
        { success: false, error: 'No customer associated with this idea. Please specify a customer.' },
        { status: 400 }
      );
    }

    // Create workflow execution
    const workflowResult = await createWorkflowExecution({
      userId: user.id,
      workflowConfigId: body.workflow_config_id,
      workflowName: item.cleaned_text,
      workflowType: body.workflow_config_id, // Use config ID as type for now
      customerId: resolvedCustomerId,
      assignedCsmId: user.id,
      totalSteps: 5, // Default, will be updated by workflow config
      metadata: {
        sourceType: 'parking_lot',
        sourceId: params.id,
        extractedEntities: item.extracted_entities,
        expandedAnalysis: item.expanded_analysis,
        ...body.pre_fill_data
      }
    });

    if (!workflowResult.success || !workflowResult.executionId) {
      return NextResponse.json(
        { success: false, error: workflowResult.error || 'Failed to create workflow' },
        { status: 500 }
      );
    }

    // Mark parking lot item as converted
    const updateResult = await ParkingLotService.update(user.id, params.id, {
      status: 'converted',
      converted_to: {
        type: 'workflow',
        id: workflowResult.executionId,
        convertedAt: new Date().toISOString(),
        metadata: {
          workflow_config_id: body.workflow_config_id,
          customer_id: resolvedCustomerId
        }
      } as any
    });

    if (!updateResult.success) {
      console.error('[ConvertToWorkflow] Failed to update item:', updateResult.error);
      // Don't fail the request - workflow was created successfully
    }

    return NextResponse.json({
      success: true,
      workflow_id: workflowResult.executionId
    });
  } catch (error: any) {
    console.error('[API /parking-lot/[id]/convert-to-workflow POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
