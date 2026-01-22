/**
 * Tutorial Mode Prompts
 *
 * Re-exports from modular prompt structure.
 *
 * To change step order: edit packages/tutorial/src/steps.ts
 * To edit a step's prompt: edit apps/goodhang/lib/tutorial/prompts/<step-name>.ts
 */

// Re-export types
export type { TutorialStep, TutorialProgress, TutorialContext, TutorialAction } from './types';

// Re-export step utilities from shared package
export { STEP_ORDER, getStepIndex, getNextStep } from '@human-os/tutorial';
export type { TutorialStepId } from '@human-os/tutorial';

// Re-export prompt functions
export { getTutorialSystemPrompt, getStepInitialMessage, parseActionFromResponse } from './prompts/index';
