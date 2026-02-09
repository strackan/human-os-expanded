/**
 * POST /api/voice-test/generate
 *
 * Generate content using user's voice profile and feedback from previous attempts.
 * Now loads the full voice pack (DIGEST, WRITING_ENGINE, OPENINGS, etc.) via
 * discovery-based loading so the LLM has the complete voice OS to work with.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';
import { loadVoicePack } from '@/lib/voice-pack';
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
      .select('id, entity_slug, metadata, persona_fingerprint')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.error('[voice-test/generate] Session not found:', sessionError?.message);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Load voice pack (all voice files from storage)
    const pack = session.entity_slug
      ? await loadVoicePack(supabase, session.entity_slug)
      : undefined;

    // Build voice context from session metadata (fallback for users without voice files)
    const voiceContext: VoiceContext = {};

    // Get persona fingerprint
    const personaFingerprint =
      session.persona_fingerprint || session.metadata?.persona_fingerprint || null;
    if (personaFingerprint) {
      voiceContext.personaFingerprint = personaFingerprint;
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

    const systemPrompt = getGenerationSystemPrompt(content_type, style, voiceContext, pack);
    const userPromptText = getGenerationUserPrompt(user_prompt, mappedAttempts);

    console.log('[voice-test/generate] Generating content for:', {
      session_id,
      content_type,
      style,
      previousAttemptsCount: mappedAttempts.length,
      hasVoicePack: !!(pack && pack.files.length > 0),
      voicePackFiles: pack?.files.length ?? 0,
      voicePackRoles: pack ? Object.keys(pack.byRole) : [],
      hasDigest: !!pack?.digest,
      hasPersonaFingerprint: !!personaFingerprint,
      hasMetadataFallback: !!voiceContext.tone,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        { role: 'user', content: userPromptText }
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

    // Voice score reflects how much context was available
    let voiceScore = 50; // Base score
    if (pack?.digest) voiceScore += 15;
    if (pack?.byRole.writing_engine) voiceScore += 15;
    if (pack?.byRole.openings) voiceScore += 5;
    if (pack?.byRole.blends) voiceScore += 5;
    if (personaFingerprint) voiceScore += 10;
    // Fallback metadata contributes less
    if (!pack?.digest && voiceContext.tone) voiceScore += 5;
    if (!pack?.digest && voiceContext.characteristics?.length) voiceScore += 5;

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
