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
  getStepIndex,
  getNextStep,
} from '@/lib/tutorial/prompts';
import { type PersonaFingerprint } from '@/lib/renubu/prompts';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Report type used in feedback regeneration
interface ExecutiveReport {
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
}

// Helper to build prompt for regenerating a report section with feedback
function buildRegenerateSectionPrompt(
  section: string,
  feedback: string,
  currentReport: ExecutiveReport,
  _persona: PersonaFingerprint | null
): string {
  const sectionContent = {
    status: `Summary: ${currentReport.summary}\nCommunication Style: ${currentReport.communication.style}\nPreferences: ${currentReport.communication.preferences.join(', ')}`,
    personality: currentReport.personality.map(p => `${p.trait}: ${p.description} (${p.insight})`).join('\n'),
    voice: currentReport.voice
      ? `Tone: ${currentReport.voice.tone}\nStyle: ${currentReport.voice.style}\nCharacteristics: ${currentReport.voice.characteristics.join(', ')}`
      : 'Voice section not yet generated',
  };

  const current = sectionContent[section as keyof typeof sectionContent] || 'Section not found';

  // Use explicit delimiters for easier parsing
  if (section === 'status') {
    return `The user gave feedback on their profile summary.

CURRENT:
${current}

FEEDBACK: "${feedback}"

Regenerate incorporating the feedback. Output EXACTLY in this format with these exact labels on their own lines:

<<<SUMMARY>>>
[Write 1-2 paragraphs incorporating the feedback]
<<<END_SUMMARY>>>

<<<COMMUNICATION_STYLE>>>
[Write their communication style in 1-2 sentences]
<<<END_COMMUNICATION_STYLE>>>

<<<PREFERENCES>>>
[preference 1], [preference 2], [preference 3]
<<<END_PREFERENCES>>>

Output ONLY the above format, nothing else.`;
  }

  if (section === 'personality') {
    return `The user gave feedback on their personality traits.

CURRENT:
${current}

FEEDBACK: "${feedback}"

Regenerate incorporating the feedback. Output 3-4 traits in EXACTLY this format:

<<<TRAIT>>>
Name: [trait name]
Description: [description]
Insight: [insight]
<<<END_TRAIT>>>

<<<TRAIT>>>
Name: [trait name]
Description: [description]
Insight: [insight]
<<<END_TRAIT>>>

[repeat for 3-4 traits]

Output ONLY the above format, nothing else.`;
  }

  if (section === 'voice') {
    return `The user gave feedback on their voice/communication style.

CURRENT:
${current}

FEEDBACK: "${feedback}"

Regenerate incorporating the feedback. Output EXACTLY in this format:

<<<TONE>>>
[their tone]
<<<END_TONE>>>

<<<STYLE>>>
[their writing style]
<<<END_STYLE>>>

<<<CHARACTERISTICS>>>
[char 1], [char 2], [char 3]
<<<END_CHARACTERISTICS>>>

Output ONLY the above format, nothing else.`;
  }

  return `Update the ${section} section based on feedback: "${feedback}"`;
}

// Helper to parse regenerated section content back into report structure
function parseRegeneratedSection(
  section: string,
  llmResponse: string,
  currentReport: ExecutiveReport
): ExecutiveReport {
  const updated = { ...currentReport };

  console.log('[tutorial/chat] Parsing LLM response for section:', section);
  console.log('[tutorial/chat] LLM response:', llmResponse.substring(0, 500));

  if (section === 'status') {
    // Try new delimiter format first
    const summaryMatch = llmResponse.match(/<<<SUMMARY>>>\s*([\s\S]*?)\s*<<<END_SUMMARY>>>/);
    const styleMatch = llmResponse.match(/<<<COMMUNICATION_STYLE>>>\s*([\s\S]*?)\s*<<<END_COMMUNICATION_STYLE>>>/);
    const prefsMatch = llmResponse.match(/<<<PREFERENCES>>>\s*([\s\S]*?)\s*<<<END_PREFERENCES>>>/);

    if (summaryMatch && summaryMatch[1]) {
      updated.summary = summaryMatch[1].trim();
      console.log('[tutorial/chat] Updated summary:', updated.summary.substring(0, 100));
    }
    if (styleMatch && styleMatch[1]) {
      updated.communication = { ...updated.communication, style: styleMatch[1].trim() };
      console.log('[tutorial/chat] Updated communication style:', updated.communication.style);
    }
    if (prefsMatch && prefsMatch[1]) {
      updated.communication = {
        ...updated.communication,
        preferences: prefsMatch[1].split(',').map(p => p.trim()).filter(Boolean),
      };
      console.log('[tutorial/chat] Updated preferences:', updated.communication.preferences);
    }

    // Log if nothing matched
    if (!summaryMatch && !styleMatch && !prefsMatch) {
      console.error('[tutorial/chat] No matches found in status response. Trying fallback parsing...');
      // Fallback: just use the whole response as summary if it looks reasonable
      if (llmResponse.length > 50 && llmResponse.length < 2000) {
        updated.summary = llmResponse.trim();
        console.log('[tutorial/chat] Using fallback - full response as summary');
      }
    }
  }

  if (section === 'personality') {
    const traits: typeof currentReport.personality = [];

    // Try new delimiter format
    const traitMatches = llmResponse.matchAll(/<<<TRAIT>>>\s*([\s\S]*?)\s*<<<END_TRAIT>>>/g);

    for (const match of traitMatches) {
      const block = match[1] || '';
      const nameMatch = block.match(/Name:\s*(.+?)(?=\n|$)/);
      const descMatch = block.match(/Description:\s*([\s\S]+?)(?=Insight:|$)/);
      const insightMatch = block.match(/Insight:\s*([\s\S]+?)$/);

      const traitName = nameMatch?.[1]?.trim();
      const traitDesc = descMatch?.[1]?.trim();
      const traitInsight = insightMatch?.[1]?.trim();

      if (traitName && traitDesc && traitInsight) {
        traits.push({
          trait: traitName,
          description: traitDesc,
          insight: traitInsight,
        });
      }
    }

    if (traits.length > 0) {
      updated.personality = traits;
      console.log('[tutorial/chat] Updated personality traits:', traits.length);
    } else {
      console.error('[tutorial/chat] No personality traits parsed from response');
    }
  }

  if (section === 'voice') {
    // Initialize voice if not present
    if (!updated.voice) {
      updated.voice = { tone: '', style: '', characteristics: [] };
    }

    const toneMatch = llmResponse.match(/<<<TONE>>>\s*([\s\S]*?)\s*<<<END_TONE>>>/);
    const styleMatch = llmResponse.match(/<<<STYLE>>>\s*([\s\S]*?)\s*<<<END_STYLE>>>/);
    const charsMatch = llmResponse.match(/<<<CHARACTERISTICS>>>\s*([\s\S]*?)\s*<<<END_CHARACTERISTICS>>>/);

    if (toneMatch && toneMatch[1]) {
      updated.voice = { ...updated.voice, tone: toneMatch[1].trim() };
      console.log('[tutorial/chat] Updated tone:', updated.voice.tone);
    }
    if (styleMatch && styleMatch[1]) {
      updated.voice = { ...updated.voice, style: styleMatch[1].trim() };
      console.log('[tutorial/chat] Updated style:', updated.voice.style);
    }
    if (charsMatch && charsMatch[1]) {
      updated.voice = {
        ...updated.voice,
        characteristics: charsMatch[1].split(',').map(c => c.trim()).filter(Boolean),
      };
      console.log('[tutorial/chat] Updated characteristics:', updated.voice.characteristics);
    }
  }

  return updated;
}

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

// Default work-style questions if none exist in session
const DEFAULT_WORK_QUESTIONS: OutstandingQuestion[] = [
  {
    id: 'work-1',
    title: 'Your Work Environment',
    prompt: 'What does your ideal work environment look like? Do you prefer working alone, with others, at home, in an office?',
    category: 'Work Style',
  },
  {
    id: 'work-2',
    title: 'Peak Productivity',
    prompt: 'When are you most productive during the day? Are you an early bird, night owl, or somewhere in between?',
    category: 'Work Style',
  },
  {
    id: 'work-3',
    title: 'Decision Making',
    prompt: 'How do you typically make important decisions? Do you rely more on data and analysis, or intuition and gut feeling?',
    category: 'Work Style',
  },
  {
    id: 'work-4',
    title: 'Handling Stress',
    prompt: 'What does stress look like for you, and what helps you manage it when work gets overwhelming?',
    category: 'Work Style',
  },
  {
    id: 'work-5',
    title: 'Communication Style',
    prompt: 'How do you prefer to communicate with your team? Quick messages, scheduled calls, async updates?',
    category: 'Work Style',
  },
  {
    id: 'work-6',
    title: 'Learning Approach',
    prompt: 'When you need to learn something new, how do you approach it? Reading, videos, hands-on experimentation?',
    category: 'Work Style',
  },
  {
    id: 'work-7',
    title: 'Focus Time',
    prompt: 'How do you protect your focus time? Do you have strategies for avoiding distractions?',
    category: 'Work Style',
  },
  {
    id: 'work-8',
    title: 'Feedback Preferences',
    prompt: 'How do you prefer to receive feedback? Direct and immediate, or more measured and scheduled?',
    category: 'Work Style',
  },
  {
    id: 'work-9',
    title: 'Energy Management',
    prompt: 'What tasks energize you vs. drain you? How do you balance both in your work?',
    category: 'Work Style',
  },
  {
    id: 'work-10',
    title: 'Work-Life Boundaries',
    prompt: 'How do you think about boundaries between work and personal life? What works for you?',
    category: 'Work Style',
  },
];

interface TutorialChatRequest {
  message: string;
  conversation_history: ConversationMessage[];
  session_id: string;
  progress: TutorialProgress;
  action?: 'init' | 'message' | 'persist_report'; // 'init' to get initial message, 'persist_report' to save confirmed report
  pending_report?: ExecutiveReport; // Working copy of report with edits (not yet persisted)
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
      pending_report,
    } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch session data — session_id may be a UUID or an entity slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session_id);
    const lookupColumn = isUuid ? 'id' : 'entity_slug';

    const { data: session, error: sessionError } = await supabase
      .from('sculptor_sessions')
      .select('id, entity_slug, entity_name, metadata')
      .eq(lookupColumn, session_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !session) {
      console.error(`[tutorial/chat] Session not found (${lookupColumn}=${session_id}):`, sessionError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Extract data from session
    const personaFingerprint: PersonaFingerprint | null = session.metadata?.persona_fingerprint || null;
    const sessionQuestions: OutstandingQuestion[] = session.metadata?.outstanding_questions || [];
    // Use default work questions if session has none
    const outstandingQuestions: OutstandingQuestion[] = sessionQuestions.length > 0 ? sessionQuestions : DEFAULT_WORK_QUESTIONS;
    const executiveReport = session.metadata?.executive_report || null;
    const firstName = session.entity_name?.split(' ')[0] || 'there';

    console.log('[tutorial/chat] Questions loaded:', {
      fromSession: sessionQuestions.length,
      using: outstandingQuestions.length,
      step: progress.currentStep,
    });

    // Calculate current question based on progress
    const currentQuestion = progress.currentStep === 'work_questions' && outstandingQuestions.length > progress.questionsAnswered
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

    // Handle 'persist_report' action - save confirmed report to DB
    if (action === 'persist_report' && pending_report) {
      console.log('[tutorial/chat] Persisting confirmed report to DB');

      await supabase
        .from('sculptor_sessions')
        .update({
          metadata: {
            ...session.metadata,
            executive_report: pending_report,
            report_confirmed_at: new Date().toISOString(),
          },
        })
        .eq('id', session_id);

      return NextResponse.json({
        content: "Your profile has been saved.",
        action: 'report_persisted',
        progress: tutorialContext.progress,
        questions: outstandingQuestions,
        report: pending_report,
        currentQuestion,
      }, { headers: corsHeaders });
    }

    // Check if this is feedback on a report section - regenerate and show changes
    const feedbackMatch = message.match(/^Feedback on "(\w+)" section:\s*(.+)$/i);
    if (feedbackMatch && feedbackMatch[1] && feedbackMatch[2] && progress.currentStep === 'about_you' && executiveReport) {
      const section = feedbackMatch[1].toLowerCase();
      const feedbackText = feedbackMatch[2];

      console.log('[tutorial/chat] Processing report feedback:', { section, feedback: feedbackText });

      // Regenerate the affected section using LLM
      const regeneratePrompt = buildRegenerateSectionPrompt(section, feedbackText, executiveReport, personaFingerprint);

      const regenerateResponse = await AnthropicService.generateConversation({
        messages: [{ role: 'user', content: regeneratePrompt }],
        systemPrompt: 'You are helping update an executive personality report based on user feedback. Output ONLY the requested content in the exact format specified.',
        model: CLAUDE_SONNET_CURRENT,
        maxTokens: 1000,
        temperature: 0.5,
      });

      // Parse the regenerated section
      const updatedReport = parseRegeneratedSection(section, regenerateResponse.content, executiveReport);

      // DON'T write to DB yet - just return the updated report for frontend to hold
      // The frontend will send a 'confirm_report' action when all sections are approved
      // At that point we'll persist to DB
      console.log('[tutorial/chat] Report section updated (not persisted yet - waiting for confirmation)');

      // Generate a response acknowledging the change
      const acknowledgmentResponse = await AnthropicService.generateConversation({
        messages: [{ role: 'user', content: `I just gave feedback on the ${section} section: "${feedbackText}"` }],
        systemPrompt: `You are a helpful assistant. The user gave feedback on their personality report and you've incorporated their changes. Respond briefly:
1. Acknowledge the feedback (1 sentence)
2. Describe what you changed (1-2 sentences)
3. Ask if the updated version looks better

Be warm and conversational. Don't be sycophantic. Keep it to 3-4 sentences total.`,
        model: CLAUDE_SONNET_CURRENT,
        maxTokens: 200,
        temperature: 0.7,
      });

      return NextResponse.json({
        content: acknowledgmentResponse.content,
        action: 'report_updated',
        progress: tutorialContext.progress,
        questions: outstandingQuestions,
        report: updatedReport,
        currentQuestion,
        feedbackApplied: true,
        updatedSection: section,
      }, { headers: corsHeaders });
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
    const newProgress = { ...tutorialContext.progress };

    // Use centralized step config from steps.ts
    switch (parsedAction) {
      case 'show_report':
        newProgress.currentStep = 'about_you';
        newProgress.stepIndex = getStepIndex('about_you');
        break;
      case 'skip_report':
        newProgress.currentStep = 'work_questions';
        newProgress.stepIndex = getStepIndex('work_questions');
        break;
      case 'step_complete': {
        // Move to next step using centralized config
        const nextStep = getNextStep(newProgress.currentStep);
        if (nextStep) {
          newProgress.currentStep = nextStep as TutorialStep;
          newProgress.stepIndex = getStepIndex(nextStep);
        }
        break;
      }
      case 'start_voice_testing':
        newProgress.currentStep = 'voice_testing';
        newProgress.stepIndex = getStepIndex('voice_testing');
        break;
      case 'skip_voice_testing':
        newProgress.currentStep = 'tool_testing';
        newProgress.stepIndex = getStepIndex('tool_testing');
        break;
      case 'question_answered':
        newProgress.questionsAnswered += 1;
        // Check if all questions answered - move to next step (voice_testing)
        if (newProgress.questionsAnswered >= newProgress.totalQuestions) {
          const nextStep = getNextStep('work_questions');
          if (nextStep) {
            newProgress.currentStep = nextStep as TutorialStep;
            newProgress.stepIndex = getStepIndex(nextStep);
          }
        }
        break;
      case 'tutorial_complete':
        newProgress.currentStep = 'complete';
        newProgress.stepIndex = getStepIndex('complete');
        break;
      case 'pause_tutorial':
        // Keep current progress, user can resume later
        break;
    }

    // Get next question if we're in work_questions step
    const nextQuestion = newProgress.currentStep === 'work_questions' && outstandingQuestions.length > newProgress.questionsAnswered
      ? outstandingQuestions[newProgress.questionsAnswered]
      : null;

    // Override content for specific actions - don't let LLM ramble
    let finalContent = content;
    if (parsedAction === 'show_report') {
      // Brief message - the UI will show the report card
      finalContent = "Take a look and let me know if anything needs adjusting.";
    }

    const result: TutorialChatResponse = {
      content: finalContent,
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
