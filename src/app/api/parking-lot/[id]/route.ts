/**
 * Parking Lot Item API Routes
 * GET /api/parking-lot/[id] - Get specific item
 * PATCH /api/parking-lot/[id] - Update item
 * DELETE /api/parking-lot/[id] - Delete item
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ParkingLotService } from '@/lib/services/ParkingLotService';
import type { UpdateParkingLotItemRequest } from '@/types/parking-lot';

export async function GET(
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
    const result = await ParkingLotService.getById(user.id, id);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /parking-lot/[id] GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await request.json() as UpdateParkingLotItemRequest;

    const result = await ParkingLotService.update(user.id, id, body);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /parking-lot/[id] PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const result = await ParkingLotService.delete(user.id, id);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /parking-lot/[id] DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
