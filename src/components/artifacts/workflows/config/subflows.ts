import { DynamicChatBranch } from './WorkflowConfig';

export interface SubflowDefinition {
  id: string;
  name: string;
  description: string;
  branch: DynamicChatBranch; // The main branch logic
  followUpBranches?: { [branchName: string]: DynamicChatBranch }; // Additional branches this subflow needs
}

export interface SubflowReference {
  subflow: string; // Reference to subflow ID
  parameters?: { [key: string]: any }; // Optional customization parameters
}

// Global registry of reusable subflows
export const subflows: { [subflowId: string]: SubflowDefinition } = {
  'common.snooze': {
    id: 'common.snooze',
    name: 'Snooze Workflow',
    description: 'Standard snooze behavior - reminds user in a couple days and offers to continue or exit',
    branch: {
      response: "No problem! I'll remind you about this in a couple of days. Would you like to move on to the next customer or shall I let you get back to your day?",
      buttons: [
        { label: 'Continue', value: 'continue' },
        { label: "That's all for now", value: 'exit' }
      ],
      nextBranches: {
        'continue': 'snooze-continue',
        'exit': 'snooze-exit'
      }
    },
    followUpBranches: {
      'snooze-continue': {
        response: "Moving to the next workflow...",
        actions: ['advanceWithoutComplete']
      },
      'snooze-exit': {
        response: "Task mode closed. You can reopen it anytime from the dashboard.",
        actions: ['exitTaskMode']
      }
    }
  },

  'common.skip': {
    id: 'common.skip',
    name: 'Skip Workflow',
    description: 'Standard skip behavior - acknowledges skip and offers to continue or exit',
    branch: {
      response: "No problem, I won't worry about this for now. I'll get back in touch if anything new comes up. Would you like to look at the next task or shall I let you get back to your day?",
      buttons: [
        { label: 'Yes', value: 'yes' },
        { label: 'No thanks', value: 'no-thanks' }
      ],
      nextBranches: {
        'yes': 'skip-yes',
        'no-thanks': 'skip-no-thanks'
      }
    },
    followUpBranches: {
      'skip-yes': {
        response: "Moving to the next workflow...",
        actions: ['advanceWithoutComplete']
      },
      'skip-no-thanks': {
        response: "Task mode closed. You can reopen it anytime from the dashboard.",
        actions: ['exitTaskMode']
      }
    }
  },

  'common.notYet': {
    id: 'common.notYet',
    name: 'Not Yet Workflow',
    description: 'Standard "Not Yet" behavior - asks for concerns, acknowledges, then offers next customer or continue',
    branch: {
      response: "No problem. Anything in particular you're concerned about?",
      delay: 1,
      buttons: [
        { label: 'Just need more time', value: 'need-more-time' },
        { label: 'Have questions about approach', value: 'questions-approach' },
        { label: 'Something else', value: 'something-else' }
      ],
      nextBranches: {
        'need-more-time': 'not-yet-acknowledge',
        'questions-approach': 'not-yet-acknowledge',
        'something-else': 'not-yet-acknowledge'
      }
    },
    followUpBranches: {
      'not-yet-acknowledge': {
        response: "That's a good point. Let's move on to the next customer and we can come back to this a little later. Sound good?",
        delay: 1,
        buttons: [
          { label: 'Next Customer', value: 'next-customer-action', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
          { label: 'Continue Plan', value: 'continue-plan', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
        ],
        nextBranches: {
          'next-customer-action': 'not-yet-next-customer',
          'continue-plan': 'not-yet-continue'
        }
      },
      'not-yet-next-customer': {
        response: "Moving to the next workflow...",
        actions: ['advanceWithoutComplete']
      },
      'not-yet-continue': {
        response: "Great! Let's proceed with the plan.",
        delay: 1,
        actions: ['nextSlide']
      }
    }
  },

  'common.letsDoIt': {
    id: 'common.letsDoIt',
    name: 'Let\'s Do It Workflow',
    description: 'Standard "Let\'s Do It" behavior - proceeds to next slide/phase with side menu expansion',
    branch: {
      response: "Perfect! Let's get started.",
      delay: 1,
      actions: ['nextSlide', 'showMenu']
    }
  },

  'common.help': {
    id: 'common.help',
    name: 'Help Menu',
    description: 'Standard help menu with common options',
    branch: {
      response: "I can help you with:\n• Renewal strategy and pricing\n• Usage analysis and trends\n• Drafting emails to contacts\n• Account health assessment\n\nWhat would you like to focus on?",
      buttons: [
        { label: 'Renewal strategy', value: 'renewal' },
        { label: 'Usage analysis', value: 'usage' },
        { label: 'Draft email', value: 'email' },
        { label: 'Account health', value: 'health' }
      ],
      nextBranches: {
        'renewal': 'help-renewal',
        'usage': 'help-usage',
        'email': 'help-email',
        'health': 'help-health'
      }
    },
    followUpBranches: {
      'help-renewal': {
        response: "I can help you create a renewal strategy based on the customer's growth patterns, risk factors, and engagement levels. Would you like me to analyze this customer's renewal potential?",
        buttons: [
          { label: 'Yes, analyze', value: 'analyze-renewal' },
          { label: 'Something else', value: 'help-menu' }
        ]
      },
      'help-usage': {
        response: "I can analyze usage patterns, growth trends, and capacity utilization to help with expansion opportunities. Would you like me to show the usage analysis?",
        buttons: [
          { label: 'Show analysis', value: 'show-usage' },
          { label: 'Something else', value: 'help-menu' }
        ]
      },
      'help-email': {
        response: "I can draft emails for various scenarios: renewal outreach, expansion proposals, check-ins, or issue resolution. What type of email would you like to draft?",
        buttons: [
          { label: 'Renewal email', value: 'email-renewal' },
          { label: 'Expansion email', value: 'email-expansion' },
          { label: 'Check-in email', value: 'email-checkin' },
          { label: 'Something else', value: 'help-menu' }
        ]
      },
      'help-health': {
        response: "I can assess account health based on usage trends, support tickets, engagement levels, and payment history. Would you like me to generate a health report?",
        buttons: [
          { label: 'Generate report', value: 'health-report' },
          { label: 'Something else', value: 'help-menu' }
        ]
      }
    }
  }
};

// Helper functions for subflow management
export const getSubflow = (subflowId: string): SubflowDefinition | null => {
  return subflows[subflowId] || null;
};

export const getAllSubflows = (): SubflowDefinition[] => {
  return Object.values(subflows);
};

export const isSubflowReference = (obj: any): obj is SubflowReference => {
  return obj && typeof obj === 'object' && 'subflow' in obj;
};

// Function to resolve subflow references into actual branch definitions
export const resolveSubflow = (reference: SubflowReference): { branch: DynamicChatBranch; additionalBranches: { [key: string]: DynamicChatBranch } } | null => {
  const subflow = getSubflow(reference.subflow);
  if (!subflow) {
    console.error(`Subflow not found: ${reference.subflow}`);
    return null;
  }

  // TODO: Apply parameters if provided
  const resolvedBranch = { ...subflow.branch };
  const additionalBranches = subflow.followUpBranches ? { ...subflow.followUpBranches } : {};

  // Apply any parameter customizations here in the future
  if (reference.parameters) {
    // Example: replace placeholders in response text, customize button labels, etc.
    // This could be expanded based on needs
  }

  return {
    branch: resolvedBranch,
    additionalBranches
  };
};