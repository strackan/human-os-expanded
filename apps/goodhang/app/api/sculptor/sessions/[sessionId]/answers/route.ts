/**
 * API Route: Save answers to outstanding questions / consolidated prompts
 *
 * POST: Save an answer to a question or prompt
 * GET: Get all saved answers for a session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';

interface AnswerRequestBody {
  question_id: string;      // Slug or consolidated prompt id
  answer: string;           // User's answer
  covers?: string[];        // For consolidated prompts: question slugs this covers
  maps_to?: string[];       // For consolidated prompts: categories this maps to
}

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const body: AnswerRequestBody = await request.json();
    const { question_id, answer, covers, maps_to } = body;

    if (!question_id || !answer) {
      return NextResponse.json(
        { error: 'question_id and answer are required' },
        { status: 400 }
      );
    }

    const supabase = getHumanOSAdminClient();

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('sculptor_sessions')
      .select('id, user_id, entity_slug, metadata')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get current answers from metadata
    const metadata = (session.metadata as Record<string, unknown>) || {};
    const existingAnswers = (metadata.question_answers as Record<string, unknown>[]) || [];

    // Add new answer
    const newAnswer = {
      question_id,
      answer,
      covers,
      maps_to,
      answered_at: new Date().toISOString(),
    };

    const updatedAnswers = [...existingAnswers, newAnswer];

    // Update session metadata
    const { error: updateError } = await supabase
      .from('sculptor_sessions')
      .update({
        metadata: {
          ...metadata,
          question_answers: updatedAnswers,
        }
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[answers/POST] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save answer' },
        { status: 500 }
      );
    }

    // Also save to question_answers table if user_id exists
    if (session.user_id && covers?.length) {
      // For consolidated prompts, mark all covered questions as answered
      for (const slug of covers) {
        await supabase
          .from('question_answers')
          .upsert({
            user_id: session.user_id,
            question_slug: slug,
            value_text: answer,
            source: 'renubu-chat',
            session_id: sessionId,
            answered_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,question_slug'
          });
      }
    } else if (session.user_id) {
      // Single question answer
      await supabase
        .from('question_answers')
        .upsert({
          user_id: session.user_id,
          question_slug: question_id,
          value_text: answer,
          source: 'renubu-chat',
          session_id: sessionId,
          answered_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,question_slug'
        });
    }

    console.log('[answers/POST] Saved answer for:', question_id, 'covers:', covers?.length || 0);

    return NextResponse.json({
      success: true,
      answer_count: updatedAnswers.length,
      covers_count: covers?.length || 0,
    });
  } catch (error) {
    console.error('[answers/POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    const supabase = getHumanOSAdminClient();

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('sculptor_sessions')
      .select('id, metadata')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const metadata = (session.metadata as Record<string, unknown>) || {};
    const answers = (metadata.question_answers as Record<string, unknown>[]) || [];

    return NextResponse.json({
      session_id: sessionId,
      answers,
      answer_count: answers.length,
    });
  } catch (error) {
    console.error('[answers/GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
