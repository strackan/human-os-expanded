/**
 * Parking Lot Expansion API Route
 * POST /api/parking-lot/[id]/expand - Expand idea with LLM
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ParkingLotService } from '@/lib/services/ParkingLotService';
import { ParkingLotLLMService } from '@/lib/services/ParkingLotLLMService';
import type { ExpandParkingLotItemRequest, UpdateParkingLotItemRequest } from '@/types/parking-lot';

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

    // Parse request body for context
    const body = await request.json().catch(() => ({})) as ExpandParkingLotItemRequest;

    // Expand with LLM
    const { expansion, artifact } = await ParkingLotLLMService.expandWithObjectives({
      idea: item,
      context: body.context ? {
        customerData: body.context.customer_data,
        workflowData: body.context.workflow_data
      } : undefined
    });

    // Update item with expansion
    const updateResult = await ParkingLotService.update(user.id, params.id, {
      status: 'expanded'
    } as UpdateParkingLotItemRequest);

    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expansion,
      artifact
    });
  } catch (error: any) {
    console.error('[API /parking-lot/[id]/expand POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
