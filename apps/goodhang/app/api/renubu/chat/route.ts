/**
 * API Route: Renubu Chat
 *
 * Handles conversational AI for Renubu's post-Sculptor workflow.
 * Supports two modes:
 * - questions: Conversational coverage of remaining assessment questions
 * - context: Free-form conversation to build user's Founder OS context
 */

import { NextRequest, NextResponse } from 'next/server';
import { AnthropicService, type ConversationMessage } from '@/lib/services/AnthropicService';
import { CLAUDE_SONNET_CURRENT } from '@/lib/constants/claude-models';
import {
  getQuestionsSystemPrompt,
  getContextSystemPrompt,
  type PersonaFingerprint,
} from '@/lib/renubu/prompts';

interface CurrentQuestion {
  id?: string;
  title?: string;
  prompt?: string;
  text?: string;
  slug?: string;
}

interface RenubuChatRequest {
  message: string;
  conversation_history: ConversationMessage[];
  mode: 'questions' | 'context';
  current_question?: CurrentQuestion;
  persona_fingerprint?: PersonaFingerprint;
  session_id?: string;
}

interface RenubuChatResponse {
  content: string;
  next_action: 'continue' | 'next_question' | 'transition_to_context';
  tokens_used?: {
    input: number;
    output: number;
    total: number;
  };
}

// CORS headers for desktop app access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body: RenubuChatRequest = await request.json();
    const {
      message,
      conversation_history = [],
      mode,
      current_question,
      persona_fingerprint,
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!mode || !['questions', 'context'].includes(mode)) {
      return NextResponse.json(
        { error: 'Mode must be "questions" or "context"' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Build system prompt based on mode
    let systemPrompt: string;

    if (mode === 'questions') {
      if (!current_question) {
        return NextResponse.json(
          { error: 'current_question is required in questions mode' },
          { status: 400, headers: corsHeaders }
        );
      }
      systemPrompt = getQuestionsSystemPrompt(
        persona_fingerprint || null,
        current_question
      );
    } else {
      systemPrompt = getContextSystemPrompt(persona_fingerprint || null);
    }

    // Build messages array
    const messages: ConversationMessage[] = [
      ...conversation_history,
      { role: 'user', content: message },
    ];

    console.log('[API /renubu/chat] Generating response:', {
      mode,
      messageCount: messages.length,
      hasPersona: !!persona_fingerprint,
      questionTitle: current_question?.title || current_question?.slug || 'none',
    });

    // Generate LLM response
    const response = await AnthropicService.generateConversation({
      messages,
      systemPrompt,
      model: CLAUDE_SONNET_CURRENT,
      maxTokens: 500, // Keep responses concise
      temperature: 0.7,
    });

    console.log('[API /renubu/chat] Response generated:', {
      contentLength: response.content.length,
      tokensUsed: response.tokensUsed.total,
    });

    // Detect next action based on response content
    const NEXT_QUESTION_MARKER = '<!-- NEXT_QUESTION -->';
    const hasNextQuestionMarker = response.content.includes(NEXT_QUESTION_MARKER);

    let nextAction: 'continue' | 'next_question' | 'transition_to_context' = 'continue';

    if (mode === 'questions' && hasNextQuestionMarker) {
      nextAction = 'next_question';
    }

    // Strip marker from response
    const cleanedContent = response.content.replace(NEXT_QUESTION_MARKER, '').trim();

    const result: RenubuChatResponse = {
      content: cleanedContent,
      next_action: nextAction,
      tokens_used: response.tokensUsed,
    };

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('[API /renubu/chat] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
