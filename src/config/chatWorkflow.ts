import { ChatWorkflowConfig } from '../types/chat';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';

export const defaultChecklistItems = [
  "Review account data",
  "Confirm renewal strategy",
  "Confirm contacts",
  "Address risk (if any)",
  "Send renewal notice",
];

export const defaultProgressSteps = [
  { id: 1, name: "Review account data", status: "upcoming" as const },
  { id: 2, name: "Confirm renewal strategy", status: "upcoming" as const },
  { id: 3, name: "Confirm contacts", status: "upcoming" as const },
  { id: 4, name: "Address risk", status: "upcoming" as const },
  { id: 5, name: "Send renewal notice", status: "upcoming" as const },
];

export const defaultRecommendedAction = {
  label: "Prepare for Renewal",
  icon: RocketLaunchIcon,
};

export const createChatWorkflowConfig = (
  steps: ChatWorkflowConfig['steps'],
  customConfig?: Partial<ChatWorkflowConfig>
): ChatWorkflowConfig => ({
  steps,
  progressSteps: customConfig?.progressSteps || defaultProgressSteps,
  checklistItems: customConfig?.checklistItems || defaultChecklistItems,
  recommendedAction: customConfig?.recommendedAction || defaultRecommendedAction,
}); 