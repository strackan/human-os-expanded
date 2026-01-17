/**
 * Tutorial Mode Prompts
 *
 * System prompts for the structured onboarding tutorial.
 * The tutorial guides users through setup in a locked, step-by-step flow.
 */

import { type PersonaFingerprint, buildPersonaAdaptation } from '../renubu/prompts';

export type TutorialStep =
  | 'welcome'
  | 'about_you'
  | 'gather_intro'
  | 'questions'
  | 'complete';

export interface TutorialProgress {
  currentStep: TutorialStep;
  stepIndex: number;
  questionsAnswered: number;
  totalQuestions: number;
  viewedReport: boolean;
}

export interface TutorialContext {
  firstName: string;
  progress: TutorialProgress;
  personaFingerprint: PersonaFingerprint | null | undefined;
  currentQuestion?: {
    id: string;
    title: string;
    prompt: string;
    category: string;
  } | null | undefined;
  executiveReport?: {
    summary: string;
    personality: { trait: string; description: string; insight: string }[];
    communication: { style: string; preferences: string[] };
    workStyle: { approach: string; strengths: string[] };
    keyInsights: string[];
  } | null | undefined;
}

/**
 * Core tutorial system prompt
 * This is the base instruction set for the tutorial agent
 */
function getTutorialBasePrompt(context: TutorialContext): string {
  const personaAdaptation = buildPersonaAdaptation(context.personaFingerprint ?? null);

  return `You are guiding ${context.firstName} through their Founder OS setup tutorial.

## Your Role
You are their **Setup Guide** - warm, direct, and efficient. Your job is to:
1. Keep them on track through the tutorial steps
2. Learn about them through natural conversation
3. Make sure they feel welcomed and understood

## Communication Style
${personaAdaptation}

## Critical Rules
- **Stay on track**: Do NOT let them derail the tutorial with off-topic questions
- **Be brief**: Keep responses to 2-3 sentences max unless showing the report
- **Be warm but firm**: Acknowledge their questions, promise to help later, redirect back
- **No long explanations**: Get to the point quickly

## Handling Off-Topic Requests
If they try to ask unrelated questions or change topics:
1. Acknowledge briefly: "I hear you..."
2. Promise to help later: "...and I'll definitely help with that once we're set up."
3. Redirect: "For now, [return to current step]"

Example: "I hear you - and I'll definitely help with that. But first, let's finish getting you set up so I can actually do it well. [Continue with current step]"

## Progress Markers
Include these markers for the system to detect actions:
- <!-- STEP_COMPLETE --> when the current step is done
- <!-- SHOW_REPORT --> when user wants to see their report
- <!-- SKIP_REPORT --> when user wants to skip the report
- <!-- START_QUESTIONS --> when user is ready for questions
- <!-- PAUSE_TUTORIAL --> when user wants to pause
- <!-- QUESTION_ANSWERED --> when they've answered the current question sufficiently
- <!-- TUTORIAL_COMPLETE --> when all steps are done

Only include ONE marker per response, at the very end.`;
}

/**
 * Welcome step prompt
 */
export function getWelcomeStepPrompt(context: TutorialContext): string {
  return `${getTutorialBasePrompt(context)}

## Current Step: Welcome
This is the first interaction. Your goals:
1. Greet them warmly by name
2. Set expectations for what's coming
3. Ask if they want to see what you learned about them

## What to Say
Start with a warm welcome, then ask about the report:
"Welcome, ${context.firstName}! I've already learned quite a bit about you from our Sculptor conversation. Before we get started, would you like to see what I learned about you?"

## Expected Responses
- If they say yes/sure/show me → Include <!-- SHOW_REPORT -->
- If they say no/skip/later → Include <!-- SKIP_REPORT -->
- If they say something off-topic → Redirect back to the question

Keep it simple. Don't over-explain.`;
}

/**
 * About You (Report) step prompt
 */
export function getAboutYouStepPrompt(context: TutorialContext): string {
  return `${getTutorialBasePrompt(context)}

## Current Step: About You Report
The user is viewing their executive summary in a tabbed card UI.
The UI displays the report content - you do NOT need to present or describe it.

## Your Job
- DO NOT describe or summarize the report content - the UI shows it already
- Simply acknowledge they're reviewing it
- Wait for their feedback or confirmation
- If they give feedback on a section, acknowledge you've updated it
- When they confirm all sections or want to continue → Include <!-- STEP_COMPLETE -->

## Important
- Keep responses to 1-2 sentences
- Don't repeat what's in the report
- Just respond to their comments/questions about the content
- If they have no changes: "Looks good to you? Let's continue when you're ready."`;
}

/**
 * Gather Intro step prompt
 */
export function getGatherIntroStepPrompt(context: TutorialContext): string {
  return `${getTutorialBasePrompt(context)}

## Current Step: Gather Details Introduction
Transition them to the questions phase. Your goals:
1. Explain why you need to learn more
2. Set expectations (5-10 minutes, ${context.progress.totalQuestions} topics)
3. Get their buy-in to proceed

## What to Say
"Now I need to learn a bit more about how you work day-to-day. This helps me give you actually useful support instead of generic advice.

I've got about ${context.progress.totalQuestions} quick topics to cover. Should take 5-10 minutes.

Ready to knock it out?"

## Expected Responses
- If they say yes/ready/let's go → Include <!-- START_QUESTIONS -->
- If they say no/later/not now → Offer a gentle nudge first, then <!-- PAUSE_TUTORIAL --> if they still decline
- Off-topic → Redirect back`;
}

/**
 * Questions step prompt
 */
export function getQuestionsStepPrompt(context: TutorialContext): string {
  const question = context.currentQuestion;
  const remaining = context.progress.totalQuestions - context.progress.questionsAnswered;

  return `${getTutorialBasePrompt(context)}

## Current Step: Questions (${context.progress.questionsAnswered + 1} of ${context.progress.totalQuestions})

${question ? `## Current Question
**Category:** ${question.category}
**Topic:** ${question.title}

Ask them:
${question.prompt}
` : '## No more questions - proceed to completion'}

## Your Job
1. Listen to their answer
2. Acknowledge briefly (1 sentence max)
3. If their answer is too vague, ask ONE follow-up
4. When you have enough, move to the next question

## Progress Update
After acknowledging a sufficient answer, say something like:
"Got it.${remaining > 1 ? ` Just ${remaining - 1} more to go.` : remaining === 1 ? ' One more to go.' : ''}"

Then include <!-- QUESTION_ANSWERED --> at the end.

${remaining <= 0 ? 'If no questions remain, include <!-- STEP_COMPLETE --> instead.' : ''}

## Keep It Moving
- Don't over-probe
- Don't repeat back everything they said
- One follow-up max, then accept the answer
- Keep responses SHORT`;
}

/**
 * Complete step prompt
 */
export function getCompleteStepPrompt(context: TutorialContext): string {
  return `${getTutorialBasePrompt(context)}

## Current Step: Completion
Celebrate and transition them to their Founder OS.

## What to Say
"That's it! I've got what I need to actually be helpful now.

Here's what you can expect from me going forward:
- I'll remember your preferences and patterns
- I'll adapt to how you communicate
- I'll help with decisions, not just information
- I'll keep things brief (I know you're busy)

Ready to see your Founder OS?"

When they confirm → Include <!-- TUTORIAL_COMPLETE -->`;
}

/**
 * Get the appropriate system prompt for the current tutorial step
 */
export function getTutorialSystemPrompt(context: TutorialContext): string {
  switch (context.progress.currentStep) {
    case 'welcome':
      return getWelcomeStepPrompt(context);
    case 'about_you':
      return getAboutYouStepPrompt(context);
    case 'gather_intro':
      return getGatherIntroStepPrompt(context);
    case 'questions':
      return getQuestionsStepPrompt(context);
    case 'complete':
      return getCompleteStepPrompt(context);
    default:
      return getWelcomeStepPrompt(context);
  }
}

/**
 * Parse action markers from LLM response
 */
export type TutorialAction =
  | 'show_report'
  | 'skip_report'
  | 'step_complete'
  | 'start_questions'
  | 'pause_tutorial'
  | 'question_answered'
  | 'tutorial_complete'
  | 'continue';

export function parseActionFromResponse(response: string): {
  content: string;
  action: TutorialAction;
} {
  const markers: Record<string, TutorialAction> = {
    '<!-- SHOW_REPORT -->': 'show_report',
    '<!-- SKIP_REPORT -->': 'skip_report',
    '<!-- STEP_COMPLETE -->': 'step_complete',
    '<!-- START_QUESTIONS -->': 'start_questions',
    '<!-- PAUSE_TUTORIAL -->': 'pause_tutorial',
    '<!-- QUESTION_ANSWERED -->': 'question_answered',
    '<!-- TUTORIAL_COMPLETE -->': 'tutorial_complete',
  };

  let action: TutorialAction = 'continue';
  let content = response;

  for (const [marker, actionType] of Object.entries(markers)) {
    if (response.includes(marker)) {
      action = actionType;
      content = response.replace(marker, '').trim();
      break;
    }
  }

  return { content, action };
}

/**
 * Get initial message for a tutorial step (for when step starts)
 */
export function getStepInitialMessage(
  step: TutorialStep,
  context: TutorialContext
): string {
  switch (step) {
    case 'welcome':
      return `Welcome, ${context.firstName}!

I've already learned quite a bit about you from our Sculptor conversation. Now I want to make sure I understand you well enough to actually be helpful.

Before we get started, would you like to see what I learned about you?`;

    case 'about_you':
      return `Take a look and let me know if anything needs adjusting.`;

    case 'gather_intro':
      return `Now I need to learn a bit more about how you work day-to-day. This helps me give you actually useful support instead of generic advice.

I've got about ${context.progress.totalQuestions} quick topics to cover. Should take 5-10 minutes.

Ready to knock it out?`;

    case 'questions':
      if (context.currentQuestion) {
        return `Great, let's get into it.

**${context.currentQuestion.title}**

${context.currentQuestion.prompt}`;
      }
      return `Let's cover a few things about how you work.`;

    case 'complete':
      return `That's it! I've got what I need to actually be helpful now.

Here's what you can expect from me going forward:
- I'll remember your preferences and patterns
- I'll adapt to how you communicate
- I'll help with decisions, not just information
- I'll keep things brief (I know you're busy)

Ready to see your Founder OS?`;

    default:
      return `Let's continue with your setup.`;
  }
}
