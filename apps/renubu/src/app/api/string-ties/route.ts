/**
 * String-Tie API - List/Create
 *
 * GET /api/string-ties - List user's string ties
 * POST /api/string-ties - Create new string tie
 *
 * Phase 1.4: String-Tie Foundation - API Layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { StringTieService } from '@/lib/services/StringTieService';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { isValidStringTieSource } from '@/types/string-ties';

/**
 * GET /api/string-ties
 * List user's string ties with optional filters
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeReminded = searchParams.get('includeReminded') === 'true';
    const includeDismissed = searchParams.get('includeDismissed') === 'true';
    const source = searchParams.get('source');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Build filters
    const filters: any = {};

    if (!includeReminded) {
      filters.reminded = false;
    }

    if (!includeDismissed) {
      filters.dismissed = false;
    }

    if (source && isValidStringTieSource(source)) {
      filters.source = source;
    }

    if (limit) {
      filters.limit = limit;
    }

    // Get string ties
    const service = new StringTieService(supabase);
    const stringTies = await service.list(user.id, filters);

    // Calculate active count (not reminded and not dismissed)
    const activeCount = stringTies.filter(st =>
      !st.reminded && st.dismissed_at === null
    ).length;

    return NextResponse.json({
      success: true,
      stringTies,
      count: stringTies.length,
      activeCount
    });

  } catch (error) {
    console.error('[GET /api/string-ties] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list string ties' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/string-ties
 * Create new string tie reminder
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Demo mode support
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const demoUserId = process.env.NEXT_PUBLIC_DEMO_USER_ID;

    let userId: string | null = null;

    if (isDemoMode && demoUserId) {
      console.log('[String-Tie Create] Demo mode enabled, using demo user:', demoUserId);
      userId = demoUserId;
    } else if (authError || !user) {
      console.error('[String-Tie Create] Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    } else {
      userId = user.id;
    }

    // Parse request body
    const body = await request.json();
    const { content, source, reminderText, offsetMinutes, priority } = body;

    // Handle two formats: old (content/source) and new (reminderText/offsetMinutes)
    let stringTie;
    const service = new StringTieService(supabase);

    if (reminderText && offsetMinutes !== undefined) {
      // New format from test page
      console.log('[String-Tie Create] Creating reminder:', { reminderText, offsetMinutes, priority });
      stringTie = await service.createFromParsed(userId!, {
        reminderText,
        offsetMinutes,
        priority: priority || 'medium'
      });
    } else if (content) {
      // Old format
      if (!source || !isValidStringTieSource(source)) {
        return NextResponse.json(
          { error: 'source is required and must be one of: manual, chat_magic_snippet, voice' },
          { status: 400 }
        );
      }
      stringTie = await service.create(userId!, {
        content,
        source
      });
    } else {
      return NextResponse.json(
        { error: 'Either content or reminderText is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'String tie created successfully',
      stringTie
    });

  } catch (error) {
    console.error('[POST /api/string-ties] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create string tie' },
      { status: 500 }
    );
  }
}
