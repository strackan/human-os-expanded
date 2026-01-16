/**
 * POST /api/tutorial/feedback
 *
 * Store user feedback on report sections for later synthesis.
 * This feedback is queued for processing by dream() or similar process.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface FeedbackRequest {
  session_id: string;
  section: 'status' | 'personality' | 'voice' | 'general';
  feedback: string;
  context?: Record<string, unknown>;
}

interface PendingFeedback {
  id: string;
  session_id: string;
  section: string;
  feedback: string;
  context: Record<string, unknown> | undefined;
  status: 'pending' | 'processing' | 'applied' | 'dismissed';
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();
    const { session_id, section, feedback, context } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!section || !feedback) {
      return NextResponse.json(
        { error: 'section and feedback are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get session to verify it exists and get current metadata
    const { data: session, error: sessionError } = await supabase
      .from('sculptor_sessions')
      .select('id, metadata')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Create feedback entry
    const feedbackEntry: PendingFeedback = {
      id: crypto.randomUUID(),
      session_id,
      section,
      feedback,
      context,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Get existing feedback queue or create new one
    const existingFeedback: PendingFeedback[] = session.metadata?.pending_feedback || [];
    const updatedFeedback = [...existingFeedback, feedbackEntry];

    // Store in session metadata for dream() to process
    await supabase
      .from('sculptor_sessions')
      .update({
        metadata: {
          ...session.metadata,
          pending_feedback: updatedFeedback,
          last_feedback_at: new Date().toISOString(),
        },
      })
      .eq('id', session_id);

    console.log('[tutorial/feedback] Stored feedback:', {
      session_id,
      section,
      feedback_id: feedbackEntry.id,
      queue_length: updatedFeedback.length,
    });

    return NextResponse.json({
      status: 'queued',
      feedback_id: feedbackEntry.id,
      message: 'Feedback queued for processing',
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[tutorial/feedback] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * GET /api/tutorial/feedback?session_id=xxx
 *
 * Get pending feedback for a session (for dream() or admin tools)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    const status_filter = searchParams.get('status') || 'pending';

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: session, error: sessionError } = await supabase
      .from('sculptor_sessions')
      .select('metadata')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const allFeedback: PendingFeedback[] = session.metadata?.pending_feedback || [];
    const filteredFeedback = status_filter === 'all'
      ? allFeedback
      : allFeedback.filter(f => f.status === status_filter);

    return NextResponse.json({
      feedback: filteredFeedback,
      total: allFeedback.length,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[tutorial/feedback] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
