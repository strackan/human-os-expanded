/**
 * Tutorial Prompts Index
 *
 * Orchestrates step prompts using the centralized step configuration.
 * To change step order: edit packages/tutorial/src/steps.ts
 * To edit a step's prompt: edit the corresponding file in this directory
 */

import { STEP_ORDER } from '@human-os/tutorial';
import type { TutorialContext, TutorialStep, TutorialAction } from '../types';

// Import individual step prompts
import { getWelcomeStepPrompt, getWelcomeInitialMessage } from './welcome';
import { getAboutYouStepPrompt, getAboutYouInitialMessage } from './about-you';
import { getWorkQuestionsStepPrompt, getWorkQuestionsInitialMessage } from './work-questions';
import { getVoiceTestingStepPrompt, getVoiceTestingInitialMessage } from './voice-testing';
import { getToolTestingStepPrompt, getToolTestingInitialMessage } from './tool-testing';
import { getCompleteStepPrompt, getCompleteInitialMessage } from './complete';

/**
 * Map of step ID to prompt function
 * Add new steps here when creating them
 */
const STEP_PROMPTS: Record<string, (context: TutorialContext) => string> = {
  welcome: getWelcomeStepPrompt,
  about_you: getAboutYouStepPrompt,
  work_questions: getWorkQuestionsStepPrompt,
  voice_testing: getVoiceTestingStepPrompt,
  tool_testing: getToolTestingStepPrompt,
  complete: getCompleteStepPrompt,
};

/**
 * Map of step ID to initial message function
 */
const STEP_INITIAL_MESSAGES: Record<string, (context: TutorialContext) => string> = {
  welcome: getWelcomeInitialMessage,
  about_you: getAboutYouInitialMessage,
  work_questions: getWorkQuestionsInitialMessage,
  voice_testing: getVoiceTestingInitialMessage,
  tool_testing: getToolTestingInitialMessage,
  complete: getCompleteInitialMessage,
};

/**
 * Get the system prompt for the current tutorial step
 */
export function getTutorialSystemPrompt(context: TutorialContext): string {
  const promptFn = STEP_PROMPTS[context.progress.currentStep];
  if (promptFn) {
    return promptFn(context);
  }
  // Fallback to welcome if step not found
  return getWelcomeStepPrompt(context);
}

/**
 * Get the initial message for a tutorial step
 */
export function getStepInitialMessage(step: TutorialStep, context: TutorialContext): string {
  const messageFn = STEP_INITIAL_MESSAGES[step];
  if (messageFn) {
    return messageFn(context);
  }
  return `Let's continue with your setup.`;
}

/**
 * Parse action markers from LLM response
 */
export function parseActionFromResponse(response: string): {
  content: string;
  action: TutorialAction;
} {
  const markers: Record<string, TutorialAction> = {
    '<!-- SHOW_REPORT -->': 'show_report',
    '<!-- SKIP_REPORT -->': 'skip_report',
    '<!-- STEP_COMPLETE -->': 'step_complete',
    '<!-- START_VOICE_TESTING -->': 'start_voice_testing',
    '<!-- SKIP_VOICE_TESTING -->': 'skip_voice_testing',
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

// Re-export for convenience
export { STEP_ORDER };
