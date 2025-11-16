/**
 * String-Tie API - Parse Preview
 *
 * POST /api/string-ties/parse - Preview LLM parsing without creating
 *
 * Phase 1.4: String-Tie Foundation - API Layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { StringTieParser } from '@/lib/services/StringTieParser';
import { StringTieService } from '@/lib/services/StringTieService';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * POST /api/string-ties/parse
 * Preview how the LLM will parse a reminder (without creating it)
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
      console.log('[String-Tie Parse] Demo mode enabled, using demo user:', demoUserId);
      userId = demoUserId;
    } else if (authError || !user) {
      console.error('[String-Tie Parse] Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    } else {
      userId = user.id;
    }

    // Parse request body
    const body = await request.json();
    const { content, defaultOffsetMinutes } = body;

    // Validate inputs
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required and must be a string' },
        { status: 400 }
      );
    }

    // Get user's default offset or use provided one
    let offset = defaultOffsetMinutes;
    if (!offset || typeof offset !== 'number') {
      const service = new StringTieService(supabase);
      offset = await service.getUserDefaultOffset(userId!);
    }

    console.log('[String-Tie Parse] Parsing with LLM:', { content, offset });

    // Parse with LLM
    const parsed = await StringTieParser.parse(content, offset);

    console.log('[String-Tie Parse] Parse result:', parsed);

    // Convert to ParsedReminder format
    const parsedReminder = StringTieParser.toParsedReminder(parsed);

    return NextResponse.json({
      success: true,
      parsedReminder,
      preview: {
        originalInput: content,
        reminderText: parsed.reminderText,
        offsetMinutes: parsed.offsetMinutes,
        remindAt: parsedReminder.remindAt,
        detectedTime: parsedReminder.detectedTime
      }
    });

  } catch (error) {
    console.error('[POST /api/string-ties/parse] Error:', error);

    // Check if it's an Anthropic API error
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        console.error('[String-Tie Parse] ANTHROPIC_API_KEY issue:', error.message);
        return NextResponse.json(
          { error: 'Invalid or missing Anthropic API key. Check server logs.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse reminder' },
      { status: 500 }
    );
  }
}
