/**
 * Planning Checklist Stage Configuration
 *
 * Generates a reusable planning checklist artifact
 */

export interface PlanningChecklistConfig {
  description: string;
  items: Array<{
    id: string;
    label: string;
    completed: boolean;
  }>;
  showActions?: boolean;
}

/**
 * Creates a planning checklist artifact section
 *
 * @param config - Planning checklist configuration
 * @returns Artifact section for planning checklist
 */
export function createPlanningChecklistStage(config: PlanningChecklistConfig) {
  return {
    id: 'planning-checklist-renewal',
    title: 'Renewal Planning Checklist',
    type: 'planning-checklist' as const,
    visible: false,
    content: {
      description: config.description,
      items: config.items,
      showActions: config.showActions !== false
    }
  };
}

/**
 * Default planning checklist configuration for Dynamic Corp renewal
 */
export const dynamicCorpChecklistConfig: PlanningChecklistConfig = {
  description: "Let's systematically prepare for Dynamic Corp's renewal:",
  items: [
    { id: 'start-planning', label: 'Start planning', completed: false },
    { id: 'review-contract', label: 'Review contract', completed: false },
    { id: 'set-price', label: 'Set price', completed: false },
    { id: 'confirm-contacts', label: 'Confirm contacts', completed: false },
    { id: 'send-renewal-notice', label: 'Send renewal notice', completed: false },
    { id: 'review-action-items', label: 'Review action items', completed: false }
  ],
  showActions: true
};
