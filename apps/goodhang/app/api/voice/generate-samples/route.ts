/**
 * POST /api/voice/generate-samples
 *
 * Generate 3 voice content samples based on interview data.
 * Uses the interview answers to create personalized content for:
 * 1. Thought Leadership - expertise/opinion post
 * 2. Personal Story - reflective/vulnerable post
 * 3. Connection Request - professional outreach
 *
 * These samples are used for voice calibration - user edits them
 * and provides feedback to refine Voice OS commandments.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';

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

interface VoiceSample {
  id: string;
  type: 'thought_leadership' | 'personal_story' | 'connection_request';
  label: string;
  description: string;
  content: string;
  topic: string;
}

interface GenerateSamplesRequest {
  session_id: string;
  interview_answers?: Record<string, string>;
}

interface GenerateSamplesResponse {
  samples: VoiceSample[];
}

// System prompt for generating voice samples
function getSystemPrompt(voiceContext: {
  tone?: string;
  style?: string;
  characteristics?: string[];
  summary?: string;
}) {
  const voiceDescription = voiceContext.tone
    ? `VOICE PROFILE:
Tone: ${voiceContext.tone}
Style: ${voiceContext.style || 'Natural'}
Characteristics: ${voiceContext.characteristics?.join(', ') || 'Authentic, clear'}
Summary: ${voiceContext.summary || 'Write naturally.'}`
    : 'VOICE PROFILE: Write in a natural, authentic professional voice.';

  return `You are generating content samples for voice calibration. Your job is to write 3 different pieces of content that capture this person's authentic voice based on their interview answers.

${voiceDescription}

You will generate:
1. THOUGHT LEADERSHIP - A LinkedIn post sharing expertise or a contrarian opinion
2. PERSONAL STORY - A LinkedIn post reflecting on a personal experience or lesson
3. CONNECTION REQUEST - A short LinkedIn connection request message

CRITICAL RULES:
- Write as this specific person would write, based on their interview answers
- Match their vocabulary, formality level, and communication style
- Use specific details from their stories where appropriate
- Keep thought leadership posts to 150-300 words
- Keep personal story posts to 150-300 words
- Keep connection requests to 50-100 words
- Do NOT use generic corporate language
- Do NOT sanitize their voice

OUTPUT FORMAT (JSON):
{
  "samples": [
    {
      "id": "thought_leadership",
      "type": "thought_leadership",
      "label": "Thought Leadership Post",
      "description": "A LinkedIn post sharing your expertise",
      "content": "The actual post content...",
      "topic": "Brief topic description"
    },
    {
      "id": "personal_story",
      "type": "personal_story",
      "label": "Personal Story Post",
      "description": "A reflective LinkedIn post",
      "content": "The actual post content...",
      "topic": "Brief topic description"
    },
    {
      "id": "connection_request",
      "type": "connection_request",
      "label": "Connection Request",
      "description": "A LinkedIn connection message",
      "content": "The actual message...",
      "topic": "Brief context for connection"
    }
  ]
}`;
}

function getUserPrompt(interviewAnswers: Record<string, string>) {
  // Build context from interview answers
  const answerEntries = Object.entries(interviewAnswers);

  if (answerEntries.length === 0) {
    return `Generate 3 voice samples for a professional. Use a natural, authentic voice.

Return valid JSON matching the format specified.`;
  }

  let prompt = `Based on these interview answers, generate 3 voice samples that capture this person's authentic voice:

INTERVIEW ANSWERS:
`;

  answerEntries.forEach(([questionId, answer]) => {
    if (answer && answer.trim()) {
      // Clean up question ID for display
      const cleanId = questionId.replace('fos-interview-', '').replace(/-/g, ' ');
      prompt += `\n[${cleanId}]: ${answer}\n`;
    }
  });

  prompt += `
GENERATION INSTRUCTIONS:

1. THOUGHT LEADERSHIP POST:
   - Draw from their work style, AI preferences, or feedback preferences (c1-c5 answers)
   - Create a post that shares an opinion or insight they likely hold
   - Make it feel like something they would naturally post

2. PERSONAL STORY POST:
   - Draw from their story answers (a1-a4: turning point, happiest memory, difficult time, redemption)
   - Create a reflective post that shares a lesson or insight
   - Match their emotional tone and vulnerability level

3. CONNECTION REQUEST:
   - Draw from their relationship and social preferences (b3, c4)
   - Create a warm but professional connection request
   - Make it feel like how they would naturally reach out

Return valid JSON matching the format specified.`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateSamplesRequest = await request.json();
    const { session_id, interview_answers } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
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
      console.error('[voice/generate-samples] Session not found:', sessionError?.message);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // First, try to read cached samples from storage
    if (session.entity_slug) {
      const cachedPath = `contexts/${session.entity_slug}/VOICE_SAMPLES.json`;
      const { data: cachedData, error: cacheError } = await supabase.storage
        .from('human-os')
        .download(cachedPath);

      if (!cacheError && cachedData) {
        try {
          const cachedText = await cachedData.text();
          const cachedSamples: VoiceSample[] = JSON.parse(cachedText);
          console.log('[voice/generate-samples] Using cached samples from storage');
          return NextResponse.json({ samples: cachedSamples }, { headers: corsHeaders });
        } catch (parseErr) {
          console.warn('[voice/generate-samples] Failed to parse cached samples, generating fresh');
        }
      } else {
        console.log('[voice/generate-samples] No cached samples found, generating fresh');
      }
    }

    // Build voice context from session metadata
    const voiceContext: {
      tone?: string;
      style?: string;
      characteristics?: string[];
      summary?: string;
    } = {};

    // Get voice data from executive report if available
    if (session.metadata?.executive_report?.voice) {
      const voice = session.metadata.executive_report.voice;
      voiceContext.tone = voice.tone;
      voiceContext.style = voice.style;
      voiceContext.characteristics = voice.characteristics;
    }

    if (session.metadata?.executive_report?.summary) {
      voiceContext.summary = session.metadata.executive_report.summary;
    }

    // Use interview answers from request or try to get from session
    const answers = interview_answers || session.metadata?.interview_answers || {};

    console.log('[voice/generate-samples] Generating samples for:', {
      session_id,
      hasVoiceContext: !!voiceContext.tone,
      answerCount: Object.keys(answers).length,
    });

    // Generate content using Claude
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        { role: 'user', content: getUserPrompt(answers) }
      ],
      system: getSystemPrompt(voiceContext),
    });

    // Extract content from response
    const firstBlock = response.content[0];
    const responseText = firstBlock && firstBlock.type === 'text'
      ? firstBlock.text.trim()
      : '';

    if (!responseText) {
      console.error('[voice/generate-samples] Empty response from LLM');
      return NextResponse.json(
        { error: 'Failed to generate samples' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Parse JSON response
    let result: GenerateSamplesResponse;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[voice/generate-samples] Failed to parse response:', parseError);
      console.error('[voice/generate-samples] Raw response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse generated samples' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error) {
    console.error('[voice/generate-samples] Error:', error);
    return NextResponse.json(
      { error: `Internal error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500, headers: corsHeaders }
    );
  }
}
