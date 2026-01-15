/**
 * POST /api/sculptor/sessions/[sessionId]/finalize
 *
 * Triggered when a Sculptor session completes (SESSION_COMPLETE marker detected).
 * Calls the sculptor-gap-final edge function to:
 * 1. Generate GAP_ANALYSIS_FINAL.md
 * 2. Score persona dimensions
 * 3. Return outstanding questions for the Renubu workflow
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Create service client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the session exists and is completed
    const { data: session, error: sessionError } = await supabase
      .from('sculptor_sessions')
      .select('id, status, entity_slug, entity_name, metadata')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: `Session not found: ${sessionError?.message}` },
        { status: 404 }
      );
    }

    if (session.status !== 'completed') {
      return NextResponse.json(
        { error: `Session is not completed (status: ${session.status})` },
        { status: 400 }
      );
    }

    // Check if already finalized
    if (session.metadata?.gap_analysis_generated) {
      // Return cached results
      return NextResponse.json({
        status: 'already_finalized',
        entity_slug: session.entity_slug,
        session_id: sessionId,
        persona_fingerprint: session.metadata.persona_fingerprint || null,
        outstanding_questions: session.metadata.outstanding_questions || [],
        gap_analysis_path: `${session.entity_slug}/GAP_ANALYSIS_FINAL.md`,
        finalized_at: session.metadata.gap_analysis_generated,
      });
    }

    // Call the sculptor-gap-final edge function
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/sculptor-gap-final`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[finalize] Edge function error:', errorText);
      return NextResponse.json(
        { error: `Edge function error: ${errorText}` },
        { status: 500 }
      );
    }

    const result = await response.json();

    // Cache the outstanding questions in session metadata for future calls
    await supabase
      .from('sculptor_sessions')
      .update({
        metadata: {
          ...session.metadata,
          outstanding_questions: result.outstanding_questions,
        },
      })
      .eq('id', sessionId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[finalize] Error:', error);
    return NextResponse.json(
      { error: `Internal error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sculptor/sessions/[sessionId]/finalize
 *
 * Get the finalization status and results for a session
 */
// CORS headers for desktop app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: session, error: sessionError } = await supabase
      .from('sculptor_sessions')
      .select('id, status, entity_slug, entity_name, metadata')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: `Session not found: ${sessionError?.message}` },
        { status: 404 }
      );
    }

    const isFinalized = !!session.metadata?.gap_analysis_generated;

    return NextResponse.json({
      session_id: sessionId,
      status: session.status,
      entity_slug: session.entity_slug,
      finalized: isFinalized,
      finalized_at: session.metadata?.gap_analysis_generated || null,
      persona_fingerprint: session.metadata?.persona_fingerprint || null,
      outstanding_questions: session.metadata?.outstanding_questions || [],
      gap_analysis_path: isFinalized ? `${session.entity_slug}/GAP_ANALYSIS_FINAL.md` : null,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('[finalize] GET Error:', error);
    return NextResponse.json(
      { error: `Internal error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500, headers: corsHeaders }
    );
  }
}
