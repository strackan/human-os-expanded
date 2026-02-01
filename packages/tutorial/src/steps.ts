/**
 * Tutorial Steps Configuration
 *
 * Single source of truth for tutorial step order, labels, and metadata.
 * Both frontend and backend apps import from this shared package.
 *
 * IMPORTANT: This file must remain dependency-free (no React, no lucide-react)
 * so it can be used in both browser and Node.js environments.
 */

export interface TutorialStepConfig {
  id: string;
  label: string;
  description: string;
  /** Icon name for frontend to resolve (e.g., 'User', 'Sparkles') */
  iconName: string;
  /** localStorage key that marks this step as complete (if any) */
  completionKey?: string;
}

/**
 * Ordered list of tutorial steps.
 * The array index determines the stepIndex.
 *
 * To change the order: just reorder this array.
 * To add a step: add it here and create corresponding prompts.
 * To add a completion marker: set completionKey to the localStorage key.
 */
export const TUTORIAL_STEPS: TutorialStepConfig[] = [
  { id: 'interview', label: 'Interview', description: '12 questions', iconName: 'ClipboardList', completionKey: 'founder-os-interview-completed' },
  { id: 'voice_testing', label: 'Voice-OS', description: 'Test your voice', iconName: 'Mic', completionKey: 'founder-os-voice-test-completed' },
  { id: 'tool_testing', label: 'Tools', description: 'Test your tools', iconName: 'Wrench', completionKey: 'founder-os-tool-testing-completed' },
  { id: 'complete', label: 'Complete', description: 'Ready to go', iconName: 'CheckCircle2', completionKey: 'founder-os-tutorial-completed' },
];

/**
 * Get step IDs in order
 */
export const STEP_ORDER = TUTORIAL_STEPS.map(s => s.id);

/**
 * Total number of steps
 */
export const STEP_COUNT = TUTORIAL_STEPS.length;

/**
 * Get step index by ID
 */
export function getStepIndex(stepId: string): number {
  return STEP_ORDER.indexOf(stepId);
}

/**
 * Get next step ID
 */
export function getNextStep(currentStepId: string): string | null {
  const currentIndex = getStepIndex(currentStepId);
  if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
    return null;
  }
  return STEP_ORDER[currentIndex + 1] ?? null;
}

/**
 * Get previous step ID
 */
export function getPreviousStep(currentStepId: string): string | null {
  const currentIndex = getStepIndex(currentStepId);
  if (currentIndex <= 0) {
    return null;
  }
  return STEP_ORDER[currentIndex - 1] ?? null;
}

/**
 * Get step config by ID
 */
export function getStepConfig(stepId: string): TutorialStepConfig | null {
  return TUTORIAL_STEPS.find(s => s.id === stepId) ?? null;
}

/**
 * Get all completion keys for reset functionality
 */
export function getAllCompletionKeys(): string[] {
  return TUTORIAL_STEPS
    .map(s => s.completionKey)
    .filter((key): key is string => !!key);
}

/**
 * Type for valid step IDs (derived from config)
 */
export type TutorialStepId = typeof STEP_ORDER[number];
