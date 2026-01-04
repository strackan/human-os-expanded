/**
 * String-Tie API - Get/Delete
 *
 * GET /api/string-ties/[id] - Get specific string tie
 * DELETE /api/string-ties/[id] - Dismiss string tie
 *
 * Phase 1.4: String-Tie Foundation - API Layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { StringTieService } from '@/lib/services/StringTieService';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/string-ties/[id]
 * Get specific string tie by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get string tie ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'String tie ID is required' },
        { status: 400 }
      );
    }

    // Get string tie
    const service = new StringTieService(supabase);
    const stringTie = await service.get(id, user.id);

    if (!stringTie) {
      return NextResponse.json(
        { error: 'String tie not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      stringTie
    });

  } catch (error) {
    console.error('[GET /api/string-ties/[id]] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get string tie' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/string-ties/[id]
 * Dismiss string tie reminder
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get string tie ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'String tie ID is required' },
        { status: 400 }
      );
    }

    // Check if string tie exists
    const service = new StringTieService(supabase);
    const stringTie = await service.get(id, user.id);

    if (!stringTie) {
      return NextResponse.json(
        { error: 'String tie not found' },
        { status: 404 }
      );
    }

    // Dismiss string tie
    await service.dismiss(id, user.id);

    return NextResponse.json({
      success: true,
      message: 'String tie dismissed successfully'
    });

  } catch (error) {
    console.error('[DELETE /api/string-ties/[id]] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to dismiss string tie' },
      { status: 500 }
    );
  }
}
