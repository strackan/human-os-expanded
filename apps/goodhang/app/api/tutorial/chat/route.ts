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

      if (nameMatch && descMatch && insightMatch) {
        traits.push({
          trait: nameMatch[1].trim(),
          description: descMatch[1].trim(),
          insight: insightMatch[1].trim(),
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
