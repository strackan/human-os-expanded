/**
 * API Route: Tutorial Review Answers
 *
 * Reviews all work-style assessment answers as a batch.
 * Either accepts them (if C+ quality) or asks clarifying questions.
 * Does NOT probe for depth - only flags genuinely unclear or incomplete responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AnthropicService } from '@/lib/services/AnthropicService';
import { CLAUDE_SONNET_CURRENT } from '@/lib/constants/claude-models';
import { type PersonaFingerprint, buildPersonaAdaptation } from '@/lib/renubu/prompts';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// CORS headers for desktop app access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface ReviewAnswersRequest {
  session_id: string;
  answers: Record<string, string>;
  previous_clarifications?: {
    question: string;
    response: string;
  }[];
}

interface ReviewAnswersResponse {
  accepted: boolean;
  clarification?: {
    context: string;
    question: string;
    relatedQuestionIds: string[];
  };
  message?: string;
}

// Question metadata for context
const QUESTION_METADATA: Record<string, { title: string; category: string }> = {
  'peak-performance': { title: 'Peak Performance', category: 'Performance' },
  'struggle-signals': { title: 'Struggle Signals', category: 'Performance' },
  'recovery-support': { title: 'Recovery & Support', category: 'Support' },
  'decisions-priorities': { title: 'Decisions & Priorities', category: 'Support' },
  'feedback-leadership': { title: 'Feedback & Leadership', category: 'Collaboration' },
  'social-rapport': { title: 'Social & Rapport', category: 'Collaboration' },
  'challenge-style': { title: 'Challenge Style', category: 'Collaboration' },
  'ideal-ai': { title: 'Ideal AI Assistant', category: 'AI Preferences' },
  'ai-role-ranking': { title: 'AI Role Ranking', category: 'AI Preferences' },
  'anything-else': { title: 'Anything Else', category: 'AI Preferences' },
};

function buildReviewPrompt(
  firstName: string,
  answers: Record<string, string>,
  personaFingerprint: PersonaFingerprint | null,
  previousClarifications?: { question: string; response: string }[]
): string {
  const personaAdaptation = buildPersonaAdaptation(personaFingerprint);

  // Format answers for review
  const formattedAnswers = Object.entries(answers)
    .map(([id, answer]) => {
      const meta = QUESTION_METADATA[id] || { title: id, category: 'Unknown' };
      return `**${meta.category} - ${meta.title}:**\n${answer}`;
    })
    .join('\n\n');

  // Include previous clarifications if any
  const clarificationContext = previousClarifications?.length
    ? `\n\n## Previous Clarifications\n${previousClarifications
        .map((c) => `Q: ${c.question}\nA: ${c.response}`)
        .join('\n\n')}`
    : '';

  return `You are reviewing ${firstName}'s work style assessment answers to ensure they're usable for configuring their AI assistant.

## Communication Style
${personaAdaptation}

## Your Task
Review the answers below and decide whether to ACCEPT them or ask ONE clarifying question.

## Critical Rules - READ CAREFULLY
1. **Accept C+ quality answers** - If an answer is "good enough" to work with, accept it
2. **Don't probe for depth** - You are NOT doing discovery or coaching
3. **Only clarify if genuinely unclear** - Missing info that makes the answer unusable
4. **Don't nitpick** - Vague preferences are fine, contradictions or nonsense are not
5. **Maximum ONE clarification** - If multiple issues, pick the most important
6. **Keep it light** - This should feel efficient, not like an interrogation

## What warrants a clarification:
- An answer that's completely empty or just "idk" / "N/A"
- A response that contradicts itself in a confusing way
- An answer that's so vague it provides no usable information
- Something that doesn't make sense / seems like an error

## What does NOT warrant a clarification:
- Short but clear answers
- Answers that could be "more detailed"
- Preferences stated without explanation
- Anything that gives you enough to work with

## ${firstName}'s Answers
${formattedAnswers}
${clarificationContext}

## Your Response
If the answers are acceptable (even if not perfect), respond with:
<!-- ACCEPT -->
Great, I've got what I need!

If you genuinely need ONE clarification, respond with:
<!-- CLARIFY -->
[Brief, friendly question - 1-2 sentences max]

Remember: When in doubt, ACCEPT. Users find excessive clarification annoying.`;
}

function parseReviewResponse(response: string): {
  accepted: boolean;
  message: string;
  relatedQuestionIds: string[];
} {
  const isAccept = response.includes('<!-- ACCEPT -->');
  const isClarify = response.includes('<!-- CLARIFY -->');

  // Extract message (remove markers)
  let message = response
    .replace('<!-- ACCEPT -->', '')
    .replace('<!-- CLARIFY -->', '')
    .trim();

  // Try to identify which question the clarification relates to
  const relatedQuestionIds: string[] = [];
  if (isClarify) {
    const lowerMessage = message.toLowerCase();
    for (const [id, meta] of Object.entries(QUESTION_METADATA)) {
      if (
        lowerMessage.includes(meta.title.toLowerCase()) ||
        lowerMessage.includes(meta.category.toLowerCase()) ||
        lowerMessage.includes(id)
      ) {
        relatedQuestionIds.push(id);
      }
    }
  }

  return {
    accepted: isAccept || !isClarify,
    message,
    relatedQuestionIds,
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body: ReviewAnswersRequest = await request.json();
    const { session_id, answers, previous_clarifications } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'answers are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch session data
    const { data: session, error: sessionError } = await supabase
      .from('sculptor_sessions')
      .select('id, entity_slug, entity_name, metadata')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.error('[tutorial/review-answers] Session not found:', sessionError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Extract data from session
    const personaFingerprint: PersonaFingerprint | null =
      session.metadata?.persona_fingerprint || null;
    const firstName = session.entity_name?.split(' ')[0] || 'there';

    // Build review prompt
    const reviewPrompt = buildReviewPrompt(
      firstName,
      answers,
      personaFingerprint,
      previous_clarifications
    );

    console.log('[tutorial/review-answers] Reviewing answers:', {
      sessionId: session_id,
      answerCount: Object.keys(answers).length,
      hasPreviousClarifications: !!previous_clarifications?.length,
    });

    // Generate LLM response
    const response = await AnthropicService.generateConversation({
      messages: [{ role: 'user', content: 'Please review my assessment answers.' }],
      systemPrompt: reviewPrompt,
      model: CLAUDE_SONNET_CURRENT,
      maxTokens: 300,
      temperature: 0.5,
    });

    // Parse response
    const { accepted, message, relatedQuestionIds } = parseReviewResponse(response.content);

    console.log('[tutorial/review-answers] Review result:', {
      accepted,
      messageLength: message.length,
      relatedQuestionIds,
    });

    const result: ReviewAnswersResponse = {
      accepted,
      message,
    };

    if (!accepted) {
      result.clarification = {
        context: message,
        question: message,
        relatedQuestionIds,
      };
    }

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('[tutorial/review-answers] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
