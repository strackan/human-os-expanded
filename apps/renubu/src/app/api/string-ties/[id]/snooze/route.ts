/**
 * String-Tie API - Snooze
 *
 * POST /api/string-ties/[id]/snooze - Snooze string tie for additional time
 *
 * Phase 1.4: String-Tie Foundation - API Layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { StringTieService } from '@/lib/services/StringTieService';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * POST /api/string-ties/[id]/snooze
 * Snooze string tie reminder by extending remind_at
 */
export async function POST(
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

    // Parse request body
    const body = await request.json();
    const { additionalMinutes } = body;

    // Validate inputs
    if (typeof additionalMinutes !== 'number' || additionalMinutes <= 0) {
      return NextResponse.json(
        { error: 'additionalMinutes is required and must be a positive number' },
        { status: 400 }
      );
    }

    // Snooze string tie
    const service = new StringTieService(supabase);
    const stringTie = await service.snooze(id, user.id, additionalMinutes);

    // Calculate human-readable snooze duration
    let snoozeDuration: string;
    if (additionalMinutes < 60) {
      snoozeDuration = `${additionalMinutes} minute${additionalMinutes !== 1 ? 's' : ''}`;
    } else if (additionalMinutes < 1440) {
      const hours = Math.floor(additionalMinutes / 60);
      snoozeDuration = `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(additionalMinutes / 1440);
      snoozeDuration = `${days} day${days !== 1 ? 's' : ''}`;
    }

    return NextResponse.json({
      success: true,
      message: `String tie snoozed for ${snoozeDuration}`,
      stringTie,
      snoozedUntil: stringTie.remind_at,
      additionalMinutes
    });

  } catch (error) {
    console.error('[POST /api/string-ties/[id]/snooze] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to snooze string tie' },
      { status: 500 }
    );
  }
}
