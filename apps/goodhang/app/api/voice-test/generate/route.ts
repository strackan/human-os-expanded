/**
 * POST /api/voice-test/generate
 *
 * Generate content using user's voice profile and feedback from previous attempts.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';
import {
  getGenerationSystemPrompt,
  getGenerationUserPrompt,
  type VoiceContext,
  type PreviousAttempt,
} from '@/lib/voice-test/prompts';
import type { GenerateContentRequest, GenerateContentResponse } from '@/lib/voice-test/types';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// CORS headers for desktop app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateContentRequest = await request.json();
    const { session_id, content_type, style, user_prompt, previous_attempts } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!content_type || !style || !user_prompt) {
      return NextResponse.json(
        { error: 'content_type, style, and user_prompt are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get admin client for database operations
    const supabase = getHumanOSAdminClient();

    // Fetch session data for voice context
    const { data: session, error: sessionError } = await supabase
      .from('sculptor_sessions')
      .select('id, entity_slug, metadata')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.error('[voice-test/generate] Session not found:', sessionError?.message);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Build voice context from session metadata
    const voiceContext: VoiceContext = {};

    // Get persona fingerprint from session metadata
    if (session.metadata?.persona_fingerprint) {
      voiceContext.personaFingerprint = session.metadata.persona_fingerprint;
    }

    // Try to get voice data from executive report if cached
    if (session.metadata?.executive_report?.voice) {
      const voice = session.metadata.executive_report.voice;
      voiceContext.tone = voice.tone;
      voiceContext.style = voice.style;
      voiceContext.characteristics = voice.characteristics;
      voiceContext.examples = voice.examples;
    }

    // Map previous attempts to the format expected by prompts
    const mappedAttempts: PreviousAttempt[] = (previous_attempts || []).map(a => ({
      content: a.content,
      rating: a.rating,
      feedback: a.feedback,
    }));

    // Generate content using Claude
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const systemPrompt = getGenerationSystemPrompt(content_type, style, voiceContext);
    const userPrompt = getGenerationUserPrompt(user_prompt, mappedAttempts);

    console.log('[voice-test/generate] Generating content for:', {
      session_id,
      content_type,
      style,
      previousAttemptsCount: mappedAttempts.length,
      hasVoiceContext: !!voiceContext.tone || !!voiceContext.personaFingerprint,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    });

    // Extract content from response
    const firstBlock = response.content[0];
    const generatedContent = firstBlock && firstBlock.type === 'text'
      ? firstBlock.text.trim()
      : '';

    if (!generatedContent) {
      console.error('[voice-test/generate] Empty response from LLM');
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Calculate a simple voice score based on context availability
    // In a more sophisticated version, this could use embedding similarity
    let voiceScore = 50; // Base score
    if (voiceContext.tone) voiceScore += 10;
    if (voiceContext.style) voiceScore += 10;
    if (voiceContext.characteristics?.length) voiceScore += 10;
    if (voiceContext.examples?.length) voiceScore += 10;
    if (voiceContext.personaFingerprint) voiceScore += 10;

    const result: GenerateContentResponse = {
      content: generatedContent,
      voice_score: Math.min(voiceScore, 100),
    };

    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error) {
    console.error('[voice-test/generate] Error:', error);
    return NextResponse.json(
      { error: `Internal error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500, headers: corsHeaders }
    );
  }
}
