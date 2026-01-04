/**
 * Parking Lot Brainstorm API Route
 * POST /api/parking-lot/[id]/brainstorm - Submit brainstorm answers and synthesize
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ParkingLotService } from '@/lib/services/ParkingLotService';
import { ParkingLotLLMService } from '@/lib/services/ParkingLotLLMService';
import type { BrainstormSessionRequest } from '@/types/parking-lot';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Get the item
    const itemResult = await ParkingLotService.getById(user.id, id);
    if (!itemResult.success || !itemResult.item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    const item = itemResult.item;

    // Verify this is a brainstorm item
    if (item.capture_mode !== 'brainstorm') {
      return NextResponse.json(
        { success: false, error: 'Item is not in brainstorm mode' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json() as BrainstormSessionRequest;

    if (!body.answers || body.answers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Answers are required' },
        { status: 400 }
      );
    }

    // Update item with answers
    const { error: updateError } = await supabase
      .from('parking_lot_items')
      .update({
        brainstorm_answers: body.answers,
        brainstorm_completed_at: new Date().toISOString(),
        status: 'brainstorming'
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to save answers' },
        { status: 500 }
      );
    }

    // Fetch updated item
    const updatedItemResult = await ParkingLotService.getById(user.id, id);
    if (!updatedItemResult.success || !updatedItemResult.item) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch updated item' },
        { status: 500 }
      );
    }

    const updatedItem = updatedItemResult.item;

    // Synthesize brainstorm answers with LLM
    const expansion = await ParkingLotLLMService.synthesizeBrainstorm(updatedItem);

    // Update item with expansion
    const { error: expansionError } = await supabase
      .from('parking_lot_items')
      .update({
        expanded_analysis: expansion,
        expanded_at: new Date().toISOString(),
        status: 'expanded',
        readiness_score: 80 // Brainstormed ideas are typically more fleshed out
      })
      .eq('id', id);

    if (expansionError) {
      return NextResponse.json(
        { success: false, error: 'Failed to save expansion' },
        { status: 500 }
      );
    }

    // Determine next action based on expansion
    // If expansion has actionable steps and high confidence → suggest workflow
    // Otherwise → suggest storing or expanding further
    let nextAction: 'convert_to_workflow' | 'expand_further' | 'store_passive' = 'store_passive';

    if (expansion.actionPlan && expansion.actionPlan.length >= 3) {
      // Has substantial action plan → suggest workflow
      nextAction = 'convert_to_workflow';
    } else if (expansion.opportunities && expansion.opportunities.length >= 2) {
      // Has opportunities but needs more detail → suggest expansion
      nextAction = 'expand_further';
    }

    return NextResponse.json({
      success: true,
      expansion,
      nextAction
    });
  } catch (error: any) {
    console.error('[API /parking-lot/[id]/brainstorm POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
