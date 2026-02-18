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
  Brain,
  FileCheck,
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

export {
  STEP_ORDER,
  STEP_COUNT,
  getStepIndex,
  getNextStep,
  getPreviousStep,
  getAllCompletionKeys,
  type TutorialStepId,
};

const ICON_MAP: Record<string, LucideIcon> = {
  ClipboardList,
  Mic,
  Wrench,
  CheckCircle2,
  Brain,
  FileCheck,
};

export interface TutorialStepConfig extends BaseTutorialStepConfig {
  icon: LucideIcon;
}

export const TUTORIAL_STEPS: TutorialStepConfig[] = BASE_STEPS.map(step => ({
  ...step,
  icon: ICON_MAP[step.iconName] ?? HelpCircle,
}));

export function getStepConfig(stepId: string): TutorialStepConfig | null {
  return TUTORIAL_STEPS.find(s => s.id === stepId) ?? null;
}

export function getResumeStep(): { stepId: string; stepIndex: number } {
  for (let i = TUTORIAL_STEPS.length - 1; i >= 0; i--) {
    const step = TUTORIAL_STEPS[i];
    if (step?.completionKey && localStorage.getItem(step.completionKey)) {
      const nextIndex = Math.min(i + 1, TUTORIAL_STEPS.length - 1);
      const nextStep = TUTORIAL_STEPS[nextIndex];
      return { stepId: nextStep?.id ?? 'welcome', stepIndex: nextIndex };
    }
  }
  return { stepId: 'welcome', stepIndex: 0 };
}
