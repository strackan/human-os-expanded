/**
 * API Route: Tutorial Chat
 *
 * Handles conversational AI for the structured onboarding tutorial.
 * The agent follows the TUTORIAL.md context and guides users through setup.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AnthropicService, type ConversationMessage } from '@/lib/services/AnthropicService';
import { CLAUDE_SONNET_CURRENT } from '@/lib/constants/claude-models';
import {
  type TutorialStep,
  type TutorialProgress,
  type TutorialContext,
  getTutorialSystemPrompt,
  parseActionFromResponse,
  getStepInitialMessage,
} from '@/lib/tutorial/prompts';
import { type PersonaFingerprint } from '@/lib/renubu/prompts';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// CORS headers for desktop app access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface OutstandingQuestion {
  id: string;
  title: string;
  prompt: string;
  category: string;
  covers?: string[];
}

interface TutorialChatRequest {
  message: string;
  conversation_history: ConversationMessage[];
  session_id: string;
  progress: TutorialProgress;
  action?: 'init' | 'message'; // 'init' to get initial message for a step
}

interface TutorialChatResponse {
  content: string;
  action: string;
  progress: TutorialProgress;
  questions?: OutstandingQuestion[] | undefined;
  report?: {
    summary: string;
    personality: { trait: string; description: string; insight: string }[];
    communication: { style: string; preferences: string[] };
    workStyle: { approach: string; strengths: string[] };
    keyInsights: string[];
    voice?: {
      tone: string;
      style: string;
      characteristics: string[];
      examples?: string[];
    };
  } | null | undefined;
  currentQuestion?: OutstandingQuestion | null | undefined;
  feedbackQueued?: boolean;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body: TutorialChatRequest = await request.json();
    const {
      message,
      conversation_history = [],
      session_id,
      progress,
      action = 'message',
    } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
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
      console.error('[tutorial/chat] Session not found:', sessionError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Extract data from session
    const personaFingerprint: PersonaFingerprint | null = session.metadata?.persona_fingerprint || null;
    const outstandingQuestions: OutstandingQuestion[] = session.metadata?.outstanding_questions || [];
    const executiveReport = session.metadata?.executive_report || null;
    const firstName = session.entity_name?.split(' ')[0] || 'there';

    // Calculate current question based on progress
    const currentQuestion = progress.currentStep === 'questions' && outstandingQuestions.length > progress.questionsAnswered
      ? outstandingQuestions[progress.questionsAnswered]
      : null;

    // Build tutorial context
    const tutorialContext: TutorialContext = {
      firstName,
      progress: {
        ...progress,
        totalQuestions: outstandingQuestions.length || 5,
      },
      personaFingerprint,
      currentQuestion,
      executiveReport,
    };

    // Handle 'init' action - return initial message for the step
    if (action === 'init') {
      const initialMessage = getStepInitialMessage(progress.currentStep, tutorialContext);

      return NextResponse.json({
        content: initialMessage,
        action: 'continue',
        progress: tutorialContext.progress,
        questions: outstandingQuestions,
        report: executiveReport,
        currentQuestion,
      }, { headers: corsHeaders });
    }

    // Check if this is feedback on a report section - store for later synthesis
    const feedbackMatch = message.match(/^Feedback on "(\w+)" section:\s*(.+)$/i);
    if (feedbackMatch && feedbackMatch[1] && feedbackMatch[2] && progress.currentStep === 'about_you') {
      const section = feedbackMatch[1];
      const feedbackText = feedbackMatch[2];

      // Store feedback in session metadata for dream() to process later
      const pendingFeedback = session.metadata?.pending_feedback || [];
      const newFeedback = {
        id: crypto.randomUUID(),
        session_id,
        section: section.toLowerCase(),
        feedback: feedbackText,
        context: { step: progress.currentStep, report_viewed: true },
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      await supabase
        .from('sculptor_sessions')
        .update({
          metadata: {
            ...session.metadata,
            pending_feedback: [...pendingFeedback, newFeedback],
            last_feedback_at: new Date().toISOString(),
          },
        })
        .eq('id', session_id);

      console.log('[tutorial/chat] Stored feedback:', {
        section,
        feedback_id: newFeedback.id,
      });
    }

    // Build system prompt for current step
    const systemPrompt = getTutorialSystemPrompt(tutorialContext);

    // Build messages array
    const messages: ConversationMessage[] = [
      ...conversation_history,
      { role: 'user', content: message },
    ];

    console.log('[API /tutorial/chat] Generating response:', {
      step: progress.currentStep,
      questionsAnswered: progress.questionsAnswered,
      totalQuestions: tutorialContext.progress.totalQuestions,
      messageCount: messages.length,
      hasPersona: !!personaFingerprint,
    });

    // Generate LLM response
    const response = await AnthropicService.generateConversation({
      messages,
      systemPrompt,
      model: CLAUDE_SONNET_CURRENT,
      maxTokens: 800,
      temperature: 0.7,
    });

    // Parse action from response
    const { content, action: parsedAction } = parseActionFromResponse(response.content);

    console.log('[API /tutorial/chat] Response:', {
      contentLength: content.length,
      action: parsedAction,
      tokensUsed: response.tokensUsed.total,
    });

    // Calculate new progress based on action
    let newProgress = { ...tutorialContext.progress };

    switch (parsedAction) {
      case 'show_report':
        newProgress.currentStep = 'about_you';
        newProgress.stepIndex = 1;
        break;
      case 'skip_report':
        newProgress.currentStep = 'gather_intro';
        newProgress.stepIndex = 2;
        break;
      case 'step_complete': {
        // Move to next step
        const stepOrder: TutorialStep[] = ['welcome', 'about_you', 'gather_intro', 'questions', 'complete'];
        const currentIndex = stepOrder.indexOf(newProgress.currentStep);
        const nextStep = stepOrder[currentIndex + 1];
        if (currentIndex < stepOrder.length - 1 && nextStep) {
          newProgress.currentStep = nextStep;
          newProgress.stepIndex = currentIndex + 1;
        }
        break;
      }
      case 'start_questions':
        newProgress.currentStep = 'questions';
        newProgress.stepIndex = 3;
        break;
      case 'question_answered':
        newProgress.questionsAnswered += 1;
        // Check if all questions answered
        if (newProgress.questionsAnswered >= newProgress.totalQuestions) {
          newProgress.currentStep = 'complete';
          newProgress.stepIndex = 4;
        }
        break;
      case 'tutorial_complete':
        newProgress.currentStep = 'complete';
        newProgress.stepIndex = 4;
        break;
      case 'pause_tutorial':
        // Keep current progress, user can resume later
        break;
    }

    // Get next question if we're in questions step
    const nextQuestion = newProgress.currentStep === 'questions' && outstandingQuestions.length > newProgress.questionsAnswered
      ? outstandingQuestions[newProgress.questionsAnswered]
      : null;

    const result: TutorialChatResponse = {
      content,
      action: parsedAction,
      progress: newProgress,
      questions: outstandingQuestions,
      report: executiveReport,
      currentQuestion: nextQuestion,
    };

    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error) {
    console.error('[API /tutorial/chat] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
