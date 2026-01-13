/**
 * String-Tie API - User Settings
 *
 * GET /api/string-ties/settings - Get user's string tie settings
 * PATCH /api/string-ties/settings - Update user's string tie settings
 *
 * Phase 1.4: String-Tie Foundation - API Layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { StringTieService } from '@/lib/services/StringTieService';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/string-ties/settings
 * Get user's string tie settings (e.g., default offset)
 */
export async function GET() {
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

    // Get user's settings
    const service = new StringTieService(supabase);
    const defaultOffsetMinutes = await service.getUserDefaultOffset(user.id);

    return NextResponse.json({
      success: true,
      settings: {
        defaultOffsetMinutes
      }
    });

  } catch (error) {
    console.error('[GET /api/string-ties/settings] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/string-ties/settings
 * Update user's string tie settings
 */
export async function PATCH(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { defaultOffsetMinutes } = body;

    // Validate inputs
    if (typeof defaultOffsetMinutes !== 'number' || defaultOffsetMinutes <= 0) {
      return NextResponse.json(
        { error: 'defaultOffsetMinutes is required and must be a positive number' },
        { status: 400 }
      );
    }

    // Validate reasonable range (1 minute to 30 days)
    if (defaultOffsetMinutes < 1 || defaultOffsetMinutes > 43200) {
      return NextResponse.json(
        { error: 'defaultOffsetMinutes must be between 1 and 43200 (30 days)' },
        { status: 400 }
      );
    }

    // Update settings
    const service = new StringTieService(supabase);
    await service.setUserDefaultOffset(user.id, defaultOffsetMinutes);

    // Format human-readable duration
    let duration: string;
    if (defaultOffsetMinutes < 60) {
      duration = `${defaultOffsetMinutes} minute${defaultOffsetMinutes !== 1 ? 's' : ''}`;
    } else if (defaultOffsetMinutes < 1440) {
      const hours = Math.floor(defaultOffsetMinutes / 60);
      duration = `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(defaultOffsetMinutes / 1440);
      duration = `${days} day${days !== 1 ? 's' : ''}`;
    }

    return NextResponse.json({
      success: true,
      message: `Default reminder time set to ${duration}`,
      settings: {
        defaultOffsetMinutes
      }
    });

  } catch (error) {
    console.error('[PATCH /api/string-ties/settings] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}
