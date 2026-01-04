import { SlideTemplate } from '../../types';
import { DynamicChatBranch } from '@/components/artifacts/workflows/config/WorkflowConfig';

/**
 * Initial Contact Slide Template for Renewal Workflow
 *
 * This slide handles the first phase of renewal planning including:
 * - Initial contact and planning kickoff
 * - Contract review
 * - Pricing analysis
 * - Contact confirmation
 * - Email drafting
 */
export const initialContactSlide: SlideTemplate = {
  id: 'initial-contact',
  slideNumber: 1,
  title: 'Renewals',
  description: 'Customer renewal workflow',
  label: 'Renewals',
  stepMapping: 'initial-contact',
  showSideMenu: false,

  // Reference stages to include as artifacts
  artifactStages: [
    { id: 'planningChecklist' },
    { id: 'contractReview' },
    { id: 'pricingAnalysis' },
    { id: 'emailComposer' },
    { id: 'workflowSummary' }
  ],

  chat: {
    initialMessage: {
      text: "Hi {{user.first}}! {{customer.name}}'s renewal is coming up on February 27th, which means we have about a week to decide if we're going to increase their license fees. Shall me make a plan? It should take about <b>7 minutes</b>. ",
      buttons: [
        { label: 'Start Planning', value: 'plan', completeStep: 'start-planning' },
        { label: 'Snooze', value: 'snooze' },
        { label: 'Skip this workflow', value: 'skip' }
      ],
      nextBranches: {
        'plan': 'expansion',
        'snooze': 'snooze',
        'skip': 'skip'
      }
    },
    branches: {
      'expansion': {
        response: "Great! Let's review what we need to accomplish for the renewal planning:",
        actions: ['showArtifact'],
        artifactId: 'planning-checklist-renewal'
      },
      'contract-planning': {
        response: "Perfect! Let's dive into the contract details to inform our renewal strategy.",
        delay: 1,
        actions: ['showArtifact', 'showMenu'],
        artifactId: 'enterprise-contract',
        buttons: [
          { label: 'Review contract terms', value: 'review-terms', completeStep: 'review-contract' },
          { label: 'Continue to email', value: 'email-flow' }
        ],
        nextBranches: {
          'review-terms': 'contract-review',
          'email-flow': 'email-flow'
        }
      },
      'contract-review': {
        response: "The contract shows: 8% price cap, 60-day notice, multi-year discounts available. Ready to review pricing?",
        delay: 1,
        buttons: [
          { label: 'Review pricing', value: 'pricing-analysis', completeStep: 'review-contract' },
          { label: 'Review more', value: 'contract-planning' }
        ],
        nextBranches: {
          'pricing-analysis': 'pricing-analysis',
          'contract-planning': 'contract-planning'
        }
      },
      'pricing-analysis': {
        response: "Let me analyze the optimal pricing strategy for this renewal based on market data and usage patterns.",
        delay: 1,
        actions: ['showArtifact', 'showMenu'],
        artifactId: 'pricing-analysis-renewal',
        buttons: [
          { label: 'Accept recommendation', value: 'confirm-contacts', completeStep: 'set-price' },
          { label: 'Review alternatives', value: 'pricing-analysis' }
        ],
        nextBranches: {
          'confirm-contacts': 'confirm-contacts',
          'pricing-analysis': 'pricing-analysis'
        }
      },
      'confirm-contacts': {
        response: "Great! Now let's confirm the key stakeholders for this renewal. I've identified Michael Roberts (CTO) as the primary contact. Should we proceed with drafting the renewal notice?",
        delay: 1,
        buttons: [
          { label: 'Yes, draft email', value: 'email-flow', completeStep: 'confirm-contacts' },
          { label: 'Review contacts', value: 'confirm-contacts' }
        ],
        nextBranches: {
          'email-flow': 'email-flow',
          'confirm-contacts': 'confirm-contacts'
        }
      },
      'not-ready-concern': {
        response: "No problem. Anything in particular you're concerned about?",
        delay: 1,
        buttons: [
          { label: 'Need more time', value: 'concern-ack' },
          { label: 'Questions about approach', value: 'concern-ack' },
          { label: 'Something else', value: 'concern-ack' }
        ],
        nextBranches: {
          'concern-ack': 'concern-acknowledge'
        }
      },
      'concern-acknowledge': {
        response: "That's a good point. Let's move on to the next customer and we can come back to this a little later. Sound good?",
        delay: 1,
        buttons: [
          { label: 'Next Customer', value: 'next-customer-action' },
          { label: 'Continue Plan', value: 'contract-planning' }
        ],
        nextBranches: {
          'next-customer-action': 'next-customer-action',
          'contract-planning': 'contract-planning'
        }
      },
      'usage': {
        response: "Let me analyze their usage patterns for you. They're currently at 85% of their license capacity with consistent growth.",
        actions: ['showArtifact'],
        artifactId: 'usage-analysis'
      },
      'renewal': {
        response: "I'll help you prepare a compelling renewal offer. Which approach would you prefer?",
        buttons: [
          { label: 'Early renewal discount', value: 'early' },
          { label: 'Multi-year package', value: 'multi-year' },
          { label: 'Standard renewal', value: 'standard' }
        ],
        nextBranches: {
          'early': 'early-renewal',
          'multi-year': 'multi-year-deal',
          'standard': 'standard-renewal'
        }
      },
      'snooze': { subflow: 'common.snooze' } as unknown as DynamicChatBranch,
      'skip': { subflow: 'common.skip' } as unknown as DynamicChatBranch,
      'exit-task-mode': {
        response: "Task mode closed. You can reopen it anytime from the dashboard.",
        actions: ['exitTaskMode']
      },
      'next-customer-action': {
        response: "Moving to the next customer...",
        actions: ['nextCustomer']
      },
      'email-flow': {
        response: "Working On It",
        delay: 3000,
        actions: ['showArtifact', 'nextChat'],
        artifactId: 'email-draft',
        nextBranches: {
          'auto-followup': 'email-complete'
        }
      },
      'email-complete': {
        response: "Okay, I've drafted the email to Michael Roberts with a request to meet. Feel free to edit and send directly in the composer. After you process the email, I'll summarize everything we've done and next steps. Sound good?",
        predelay: 4500,
        buttons: [
          { label: 'Yes', value: 'email-confirmation', completeStep: 'send-renewal-notice' },
          { label: 'Something Else', value: 'alternative-options' }
        ]
      },
      'email-confirmation': {
        response: "Perfect! I've created a comprehensive workflow summary with our progress, action items, and next steps for the Dynamic Corp account.",
        actions: ['showArtifact'],
        artifactId: 'workflow-summary'
      },
      'alternative-options': {
        response: "No problem! What would you like to focus on instead?",
        buttons: [
          { label: 'Review expansion options', value: 'expansion' },
          { label: 'Analyze usage patterns', value: 'usage' },
          { label: 'Prepare renewal offer', value: 'renewal' },
          { label: 'Something else', value: 'free-chat' }
        ]
      },
      'not-ready-flow': {
        response: "No problem! Take your time to review the checklist. When you're ready to proceed, just let me know.",
        buttons: [
          { label: 'I\'m ready now', value: 'proceed-with-plan' },
          { label: 'Go back to start', value: 'back-to-initial' }
        ]
      },
      'back-to-initial': {
        response: "Hi {{user.first}}! {{customer.name}}'s renewal is coming up on February 27th, which means we have about a week to decide if we're going to increase their license fees. Shall me make a plan? It should take about <b>7 minutes</b>.",
        buttons: [
          { label: 'Start Planning', value: 'plan' },
          { label: 'Snooze', value: 'snooze' },
          { label: 'Skip this workflow', value: 'skip' }
        ],
        nextBranches: {
          'plan': 'expansion',
          'snooze': 'snooze',
          'skip': 'skip'
        }
      }
    },
    userTriggers: {
      ".*help.*": "help-flow",
      ".*renewal.*": "renewal",
      ".*expand.*|.*expansion.*": "expansion",
      ".*usage.*|.*analyze.*": "usage",
      ".*email.*|.*draft.*": "email-flow"
    },
    defaultMessage: "I'm sorry, I didn't understand that. Could you try again or select one of the available options?"
  },

  sidePanel: {
    enabled: true,
    title: {
      text: "Renewal Planning",
      subtitle: "Dynamic Corp - 6 Steps",
      icon: "📋"
    },
    steps: [
      {
        id: "start-planning",
        title: "Start Planning",
        description: "Begin renewal planning process",
        status: "pending",
        workflowBranch: "expansion",
        icon: "🚀"
      },
      {
        id: "review-contract",
        title: "Review Contract",
        description: "Analyze current contract terms and conditions",
        status: "pending",
        workflowBranch: "contract-planning",
        icon: "📋"
      },
      {
        id: "set-price",
        title: "Set Price",
        description: "Determine renewal pricing strategy",
        status: "pending",
        workflowBranch: "pricing-analysis",
        icon: "💰"
      },
      {
        id: "confirm-contacts",
        title: "Confirm Contacts",
        description: "Verify decision makers and stakeholders",
        status: "pending",
        workflowBranch: "confirm-contacts",
        icon: "👥"
      },
      {
        id: "send-renewal-notice",
        title: "Send Renewal Notice",
        description: "Initiate formal renewal communication",
        status: "pending",
        workflowBranch: "email-flow",
        icon: "📧"
      },
      {
        id: "review-action-items",
        title: "Review Action Items",
        description: "Finalize and track next steps",
        status: "pending",
        workflowBranch: "email-complete",
        icon: "✅"
      }
    ],
    showSteps: true,
    showProgressMeter: false
  }
};
