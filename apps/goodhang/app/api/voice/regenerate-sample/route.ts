/**
 * POST /api/voice/regenerate-sample
 *
 * Regenerate a single voice sample using user feedback.
 * Takes the original content plus whatDidntWork / whatWouldHelp
 * and returns a rewritten version that applies the feedback.
 *
 * Uses Claude Haiku for fast, cheap single-sample rewrites.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

interface RegenerateSampleRequest {
  session_id: string;
  sample: {
    id: string;
    type: string;
    label: string;
    content: string;
    topic: string;
  };
  feedback: {
    whatDidntWork: string;
    whatWouldHelp: string;
    editedContent?: string;
  };
  attempt_number: number;
}

interface RegenerateSampleResponse {
  regenerated_content: string;
  changes_made: string[];
}

const SYSTEM_PROMPT = `You are rewriting a piece of LinkedIn content based on the user's specific feedback. Your job is to apply their instructions precisely while keeping the same topic, format, and approximate length.

RULES:
- Apply the feedback instructions literally and precisely
- Keep the same topic and general structure
- Maintain approximately the same length (within 20%)
- Do NOT add generic corporate language
- Do NOT ignore any part of the feedback
- If the user provided a manual rewrite as a reference, use it as a guide for the tone and style they want — but still produce a fresh version that incorporates ALL their feedback instructions

OUTPUT FORMAT (JSON):
{
  "regenerated_content": "The rewritten content...",
  "changes_made": ["Brief description of change 1", "Brief description of change 2"]
}`;

function buildUserPrompt(request: RegenerateSampleRequest): string {
  const { sample, feedback, attempt_number } = request;

  let prompt = `Rewrite this ${sample.label} (${sample.topic}).

ORIGINAL CONTENT:
${sample.content}

USER FEEDBACK:`;

  if (feedback.whatDidntWork) {
    prompt += `\nWhat didn't work: ${feedback.whatDidntWork}`;
  }

  if (feedback.whatWouldHelp) {
    prompt += `\nWhat would help: ${feedback.whatWouldHelp}`;
  }

  if (feedback.editedContent && feedback.editedContent !== sample.content) {
    prompt += `\n\nREFERENCE REWRITE (use as a style/voice guide):
${feedback.editedContent}`;
  }

  if (attempt_number > 1) {
    prompt += `\n\nThis is attempt #${attempt_number}. The previous regeneration didn't fully satisfy the user. Pay extra attention to applying their feedback precisely.`;
  }

  prompt += '\n\nReturn valid JSON matching the format specified.';

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegenerateSampleRequest = await request.json();
    const { session_id, sample, feedback, attempt_number } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!sample?.content) {
      return NextResponse.json(
        { error: 'sample with content is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!feedback?.whatDidntWork && !feedback?.whatWouldHelp) {
      return NextResponse.json(
        { error: 'At least one feedback field (whatDidntWork or whatWouldHelp) is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('[voice/regenerate-sample] Regenerating sample:', {
      session_id,
      sample_id: sample.id,
      sample_type: sample.type,
      attempt_number: attempt_number || 1,
      hasEditedContent: !!feedback.editedContent,
    });

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250414',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserPrompt(body) },
      ],
    });

    const firstBlock = response.content[0];
    const responseText = firstBlock && firstBlock.type === 'text'
      ? firstBlock.text.trim()
      : '';

    if (!responseText) {
      console.error('[voice/regenerate-sample] Empty response from LLM');
      return NextResponse.json(
        { error: 'Failed to regenerate sample' },
        { status: 500, headers: corsHeaders }
      );
    }

    let result: RegenerateSampleResponse;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[voice/regenerate-sample] Failed to parse response:', parseError);
      console.error('[voice/regenerate-sample] Raw response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse regenerated sample' },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!result.regenerated_content) {
      return NextResponse.json(
        { error: 'No regenerated content in response' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error) {
    console.error('[voice/regenerate-sample] Error:', error);
    return NextResponse.json(
      { error: `Internal error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500, headers: corsHeaders }
    );
  }
}
