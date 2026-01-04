/**
 * API Route: Sculptor Session
 *
 * GET: Retrieve session details
 * PATCH: Update session status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SculptorService } from '@/lib/sculptor';

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    const supabase = await createClient();
    const sculptorService = new SculptorService(supabase);

    const session = await sculptorService.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Return session without full system prompt
    return NextResponse.json({
      id: session.id,
      access_code: session.access_code,
      entity_name: session.entity_name,
      output_path: session.output_path,
      status: session.status,
      thread_id: session.thread_id,
      created_at: session.created_at,
      last_accessed_at: session.last_accessed_at,
      template: session.template ? {
        id: session.template.id,
        slug: session.template.slug,
        name: session.template.name,
        description: session.template.description,
      } : null,
    });
  } catch (error) {
    console.error('[API /sculptor/sessions] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Reset session (clear conversation history, start fresh)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const body = await request.json();

    // Check for reset action
    if (body.action !== 'reset') {
      return NextResponse.json(
        { error: 'Invalid action. Use { action: "reset" }' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Delete captured responses
    await supabase
      .from('sculptor_responses')
      .delete()
      .eq('session_id', sessionId);

    // Reset session state
    const { error: updateError } = await supabase
      .from('sculptor_sessions')
      .update({
        status: 'active',
        thread_id: null,
        last_accessed_at: null,
        metadata: { conversation_history: [] },
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[API /sculptor/sessions] Reset Error:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session reset successfully',
    });
  } catch (error) {
    console.error('[API /sculptor/sessions] POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface PatchRequestBody {
  status?: 'active' | 'revoked' | 'completed';
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const body: PatchRequestBody = await request.json();
    const { status } = body;

    if (!status || !['active', 'revoked', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status required: active, revoked, or completed' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const sculptorService = new SculptorService(supabase);

    const success = await sculptorService.updateSessionStatus(sessionId, status);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    // Return updated session
    const session = await sculptorService.getSession(sessionId);
    return NextResponse.json({
      success: true,
      session: {
        id: session?.id,
        status: session?.status,
      },
    });
  } catch (error) {
    console.error('[API /sculptor/sessions] PATCH Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
