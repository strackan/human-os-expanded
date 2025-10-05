/**
 * Branch Templates for Renubu Workflows
 *
 * Reusable conversation branch patterns for dynamic chat workflows.
 * These templates reduce duplication and standardize common conversation flows.
 */

import { DynamicChatBranch, DynamicChatButton } from './WorkflowConfig';

/**
 * Snooze and Skip Branch Templates
 *
 * Standard pattern for snooze/skip actions that exit the workflow
 * Uses common subflows for consistent behavior
 */
export const createSnoozeSkipBranches = () => ({
  'snooze': {
    subflow: 'common.snooze'
  } as DynamicChatBranch,
  'skip': {
    subflow: 'common.skip'
  } as DynamicChatBranch
});

/**
 * Exit Task Mode Branch
 *
 * Closes the task mode modal completely
 */
export const createExitTaskModeBranch = (message?: string): DynamicChatBranch => ({
  response: message || "Task mode closed. You can reopen it anytime from the dashboard.",
  actions: ['exitTaskMode']
});

/**
 * Next Customer Branch
 *
 * Navigates to the next customer in the workflow
 */
export const createNextCustomerBranch = (message?: string): DynamicChatBranch => ({
  response: message || "Moving to the next customer...",
  actions: ['nextCustomer']
});

/**
 * Email Flow Branch Template
 *
 * Standard pattern for email drafting with:
 * - Working message during composition
 * - Artifact display after delay
 * - Auto-continuation to next branch
 */
export interface EmailFlowConfig {
  artifactId: string;
  workingDelay?: number;
  nextBranch?: string;
  workingMessage?: string;
}

export const createEmailFlowBranch = (config: EmailFlowConfig): DynamicChatBranch => ({
  response: config.workingMessage || "Working On It",
  delay: config.workingDelay || 3000,
  actions: ['showArtifact', 'nextChat'],
  artifactId: config.artifactId,
  nextBranches: config.nextBranch ? {
    'auto-followup': config.nextBranch
  } : undefined
});

/**
 * Email Complete Branch Template
 *
 * Follow-up message after email is drafted
 */
export interface EmailCompleteConfig {
  recipientName: string;
  emailPurpose?: string;
  predelay?: number;
  confirmBranch?: string;
  alternativeBranch?: string;
}

export const createEmailCompleteBranch = (config: EmailCompleteConfig): DynamicChatBranch => ({
  response: `Okay, I've drafted the email to ${config.recipientName}${config.emailPurpose ? ` ${config.emailPurpose}` : ''}. Feel free to edit and send directly in the composer. After you process the email, I'll summarize everything we've done and next steps. Sound good?`,
  predelay: config.predelay || 4500,
  buttons: [
    { label: 'Yes', value: 'email-confirmation' },
    { label: 'Something Else', value: 'alternative-options' }
  ],
  nextBranches: {
    'email-confirmation': config.confirmBranch || 'email-confirmation',
    'alternative-options': config.alternativeBranch || 'alternative-options'
  }
});

/**
 * Contract Review Branch Template
 *
 * Shows contract artifact and prompts for next action
 */
export interface ContractReviewConfig {
  artifactId: string;
  showMenu?: boolean;
  continueLabel?: string;
  continueBranch?: string;
  reviewLabel?: string;
  reviewBranch?: string;
}

export const createContractReviewBranch = (config: ContractReviewConfig): DynamicChatBranch => ({
  response: "Perfect! Let's dive into the contract details to inform our renewal strategy.",
  delay: 1,
  actions: config.showMenu ? ['showArtifact', 'showMenu'] : ['showArtifact'],
  artifactId: config.artifactId,
  buttons: [
    {
      label: config.reviewLabel || 'Review contract terms',
      value: 'review-contract',
      'label-background': 'bg-blue-100',
      'label-text': 'text-blue-800'
    },
    {
      label: config.continueLabel || 'Continue to email',
      value: 'continue-flow',
      'label-background': 'bg-green-100',
      'label-text': 'text-green-800'
    }
  ],
  nextBranches: {
    'review-contract': config.reviewBranch || 'contract-details',
    'continue-flow': config.continueBranch || 'email-flow'
  }
});

/**
 * Contract Details Branch Template
 *
 * Displays contract highlights and prompts for action
 */
export interface ContractDetailsConfig {
  highlights?: string[];
  proceedBranch?: string;
  reviewMoreBranch?: string;
}

export const createContractDetailsBranch = (config: ContractDetailsConfig): DynamicChatBranch => {
  const defaultHighlights = [
    'Annual price increases capped at 8%',
    '90-day notice required for non-renewal',
    'Multi-year discount options available',
    'Custom renewal cycle terms'
  ];

  const highlights = config.highlights || defaultHighlights;
  const highlightText = highlights.map(h => `• ${h}`).join('\n');

  return {
    response: `The contract shows important considerations:\n\n${highlightText}\n\nReady to proceed with the renewal email?`,
    delay: 1,
    buttons: [
      {
        label: 'Yes, draft the email',
        value: 'proceed',
        'label-background': 'bg-green-100',
        'label-text': 'text-green-800'
      },
      {
        label: 'Review more details',
        value: 'review-more',
        'label-background': 'bg-blue-100',
        'label-text': 'text-blue-800'
      }
    ],
    nextBranches: {
      'proceed': config.proceedBranch || 'email-flow',
      'review-more': config.reviewMoreBranch || 'contract-review'
    }
  };
};

/**
 * Planning Checklist Branch Template
 *
 * Shows planning checklist artifact and offers action options
 */
export interface PlanningChecklistConfig {
  artifactId: string;
  readyBranch?: string;
  notReadyBranch?: string;
  backBranch?: string;
}

export const createPlanningChecklistBranch = (config: PlanningChecklistConfig): DynamicChatBranch => ({
  response: "Great! Let's review what we need to accomplish for the renewal planning:",
  actions: ['showArtifact'],
  artifactId: config.artifactId,
  buttons: [
    { label: 'Let\'s Do It!', value: 'ready' },
    { label: 'Not Yet', value: 'not-ready' },
    { label: 'Go Back', value: 'back' }
  ],
  nextBranches: {
    'ready': config.readyBranch || 'continue-planning',
    'not-ready': config.notReadyBranch || 'not-ready-flow',
    'back': config.backBranch || 'back-to-start'
  }
});

/**
 * Pricing Analysis Branch Template
 *
 * Shows pricing analysis artifact and prompts for decision
 */
export interface PricingAnalysisConfig {
  artifactId: string;
  acceptBranch?: string;
  adjustBranch?: string;
  reviewBranch?: string;
}

export const createPricingAnalysisBranch = (config: PricingAnalysisConfig): DynamicChatBranch => ({
  response: "I've analyzed the pricing strategy based on current market data and customer metrics. Here's my recommendation:",
  delay: 1,
  actions: ['showArtifact'],
  artifactId: config.artifactId,
  buttons: [
    { label: 'Accept Recommendation', value: 'accept' },
    { label: 'Adjust Pricing', value: 'adjust' },
    { label: 'Review More Data', value: 'review' }
  ],
  nextBranches: {
    'accept': config.acceptBranch || 'pricing-accepted',
    'adjust': config.adjustBranch || 'pricing-adjustment',
    'review': config.reviewBranch || 'pricing-details'
  }
});

/**
 * Contact Strategy Branch Template
 *
 * Shows contact strategy artifact and next steps
 */
export interface ContactStrategyConfig {
  artifactId: string;
  proceedBranch?: string;
  modifyBranch?: string;
}

export const createContactStrategyBranch = (config: ContactStrategyConfig): DynamicChatBranch => ({
  response: "Based on the stakeholder analysis, I've developed a contact strategy for this renewal. Let's review the approach:",
  delay: 1,
  actions: ['showArtifact'],
  artifactId: config.artifactId,
  buttons: [
    { label: 'Proceed with Strategy', value: 'proceed' },
    { label: 'Modify Approach', value: 'modify' }
  ],
  nextBranches: {
    'proceed': config.proceedBranch || 'execute-strategy',
    'modify': config.modifyBranch || 'adjust-strategy'
  }
});

/**
 * Plan Summary Branch Template
 *
 * Shows final plan summary artifact
 */
export interface PlanSummaryConfig {
  artifactId: string;
  completeBranch?: string;
  reviseBranch?: string;
}

export const createPlanSummaryBranch = (config: PlanSummaryConfig): DynamicChatBranch => ({
  response: "Here's a comprehensive summary of our renewal plan with all action items and next steps:",
  delay: 1,
  actions: ['showArtifact'],
  artifactId: config.artifactId,
  buttons: [
    { label: 'Complete Planning', value: 'complete' },
    { label: 'Revise Plan', value: 'revise' }
  ],
  nextBranches: {
    'complete': config.completeBranch || 'plan-complete',
    'revise': config.reviseBranch || 'revise-plan'
  }
});

/**
 * Workflow Summary Branch Template
 *
 * Shows workflow summary artifact with completed actions and next steps
 */
export interface WorkflowSummaryConfig {
  artifactId: string;
  nextActionBranch?: string;
}

export const createWorkflowSummaryBranch = (config: WorkflowSummaryConfig): DynamicChatBranch => ({
  response: "Perfect! I've created a comprehensive workflow summary with our progress, action items, and next steps for the account.",
  actions: ['showArtifact'],
  artifactId: config.artifactId
});

/**
 * Not Ready / Concern Acknowledgment Pattern
 *
 * Handles user hesitation with empathy and options
 */
export interface NotReadyConcernConfig {
  nextCustomerBranch?: string;
  continueBranch?: string;
}

export const createNotReadyConcernBranches = (config: NotReadyConcernConfig = {}) => ({
  'not-ready-flow': {
    response: "No problem. Anything in particular you're concerned about?",
    delay: 1,
    buttons: [
      { label: 'Just need more time', value: 'need-time' },
      { label: 'Have questions about approach', value: 'questions' },
      { label: 'Something else', value: 'other' }
    ],
    nextBranches: {
      'need-time': 'acknowledge-concern',
      'questions': 'acknowledge-concern',
      'other': 'acknowledge-concern'
    }
  } as DynamicChatBranch,

  'acknowledge-concern': {
    response: "That's a good point. Let's move on to the next customer and we can come back to this a little later. Sound good?",
    delay: 1,
    buttons: [
      {
        label: 'Next Customer',
        value: 'next-customer',
        'label-background': 'bg-blue-100',
        'label-text': 'text-blue-800'
      },
      {
        label: 'Continue Plan',
        value: 'continue',
        'label-background': 'bg-green-100',
        'label-text': 'text-green-800'
      }
    ],
    nextBranches: {
      'next-customer': config.nextCustomerBranch || 'next-customer-action',
      'continue': config.continueBranch || 'continue-planning'
    }
  } as DynamicChatBranch
});

/**
 * Alternative Options Branch Template
 *
 * Provides alternative paths when user wants something different
 */
export const createAlternativeOptionsBranch = (): DynamicChatBranch => ({
  response: "No problem! What would you like to focus on instead?",
  buttons: [
    { label: 'Review expansion options', value: 'expansion' },
    { label: 'Analyze usage patterns', value: 'usage' },
    { label: 'Prepare renewal offer', value: 'renewal' },
    { label: 'Something else', value: 'free-chat' }
  ]
});
