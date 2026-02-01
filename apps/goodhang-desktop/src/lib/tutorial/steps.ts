/**
 * Tutorial Steps Configuration (Frontend)
 *
 * Re-exports from shared @human-os/tutorial package with icon resolution.
 */

import {
  ClipboardList,
  Mic,
  Wrench,
  CheckCircle2,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import {
  TUTORIAL_STEPS as BASE_STEPS,
  STEP_ORDER,
  STEP_COUNT,
  getStepIndex,
  getNextStep,
  getPreviousStep,
  getAllCompletionKeys,
  type TutorialStepConfig as BaseTutorialStepConfig,
  type TutorialStepId,
} from '@human-os/tutorial';

// Re-export everything from shared package
export {
  STEP_ORDER,
  STEP_COUNT,
  getStepIndex,
  getNextStep,
  getPreviousStep,
  getAllCompletionKeys,
  type TutorialStepId,
};

/**
 * Icon name to component mapping
 */
const ICON_MAP: Record<string, LucideIcon> = {
  ClipboardList,
  Mic,
  Wrench,
  CheckCircle2,
};

/**
 * Frontend step config with resolved icon component
 */
export interface TutorialStepConfig extends BaseTutorialStepConfig {
  icon: LucideIcon;
}

/**
 * Tutorial steps with resolved icons for frontend use
 */
export const TUTORIAL_STEPS: TutorialStepConfig[] = BASE_STEPS.map(step => ({
  ...step,
  icon: ICON_MAP[step.iconName] ?? HelpCircle,
}));

/**
 * Get step config by ID (with resolved icon)
 */
export function getStepConfig(stepId: string): TutorialStepConfig | null {
  return TUTORIAL_STEPS.find(s => s.id === stepId) ?? null;
}

/**
 * Find the step to resume from based on localStorage completion markers.
 * Returns the first incomplete step (or the step after the last completed one).
 */
export function getResumeStep(): { stepId: string; stepIndex: number } {
  // Walk through steps in reverse to find the furthest completed step
  for (let i = TUTORIAL_STEPS.length - 1; i >= 0; i--) {
    const step = TUTORIAL_STEPS[i];
    if (step?.completionKey && localStorage.getItem(step.completionKey)) {
      // This step is complete, resume at the NEXT step
      const nextIndex = Math.min(i + 1, TUTORIAL_STEPS.length - 1);
      const nextStep = TUTORIAL_STEPS[nextIndex];
      return { stepId: nextStep?.id ?? 'welcome', stepIndex: nextIndex };
    }
  }
  // No completion markers found, start from beginning
  return { stepId: 'welcome', stepIndex: 0 };
}
