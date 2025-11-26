/**
 * Review Account Slide - Common across all workflows
 *
 * Purpose: Display account health metrics and get CSM assessment
 *
 * Reusable across:
 * - Risk workflows (check if departure increases risk)
 * - Opportunity workflows (confirm health before expansion)
 * - Strategic workflows (annual review baseline)
 * - Renewal workflows (assess renewal likelihood)
 *
 * Context Variables:
 * - focus: 'health', 'risk', 'opportunity', 'renewal'
 * - ask_for_assessment: true/false (whether to ask CSM for input)
 */

import {
  SlideBuilder,
  SlideContext,
  createSlideBuilder,
  applyContextVariables,
  COMMON_PLACEHOLDERS,
} from '../baseSlide';

const FOCUS_MESSAGES = {
  health: "Let's review {{customer.name}}'s overall account health. Take a look at the metrics on the right.",
  risk: "Given the situation, let's check {{customer.name}}'s health metrics. Any red flags we should address?",
  opportunity: "Before we proceed, let's confirm {{customer.name}} is in good health for an expansion discussion.",
  renewal: "Here's {{customer.name}}'s current state heading into renewal. How do things look?",
  default: "Let's review {{customer.name}}'s account metrics.",
};

export const reviewAccountSlide: SlideBuilder = createSlideBuilder(
  {
    id: 'review-account',
    name: 'Account Health Review',
    category: 'common',
    description: 'Review customer account health metrics and status',
    estimatedMinutes: 2,
    requiredFields: [
      'customer.name',
      'customer.current_arr',
      'customer.health_score',
    ],
    optionalFields: [
      'customer.renewal_date',
      'customer.churn_risk_score',
      'customer.utilization',
      'customer.yoy_growth',
      'primary_contact.name',
      'primary_contact.title',
    ],
    tags: ['account', 'health', 'metrics', 'review'],
    checklistTitle: 'Review account health and contract details',
    version: '1.0.0',
  },
  (context?: SlideContext) => {
    const focus = context?.purpose || 'default';
    const askForAssessment = context?.variables?.ask_for_assessment !== false;

    // Use custom text if provided, otherwise use default messages
    let messageText = context?.variables?.insightText
      || FOCUS_MESSAGES[focus as keyof typeof FOCUS_MESSAGES]
      || FOCUS_MESSAGES.default;
    messageText = applyContextVariables(messageText, context);

    // Use custom button label if provided
    const buttonLabel = context?.variables?.buttonLabel || 'Continue';

    const initialMessage: {
      text: string;
      buttons: Array<{ label: string; value: string; 'label-background': string; 'label-text': string }>;
      nextBranches: { [key: string]: string };
    } = askForAssessment ? {
      text: messageText,
      buttons: [
        { label: 'Looks Healthy', value: 'healthy', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
        { label: 'Some Concerns', value: 'concerns', 'label-background': 'bg-orange-600', 'label-text': 'text-white' },
        { label: 'At Risk', value: 'at-risk', 'label-background': 'bg-red-600', 'label-text': 'text-white' },
      ],
      nextBranches: {
        'healthy': 'health-good',
        'concerns': 'health-concerns',
        'at-risk': 'health-at-risk',
      }
    } : {
      text: messageText,
      buttons: [
        { label: buttonLabel, value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
      ],
      nextBranches: {
        'continue': 'proceed'
      }
    };

    return {
      id: 'review-account',
      title: 'Account Health Review',
      description: 'Review overall account status and metrics',
      label: 'Review Health',
      stepMapping: 'account-health',

      chat: {
        initialMessage,
        branches: {
          'health-good': {
            response: "Great! With healthy metrics, we're in a good position to proceed confidently.",
            storeAs: 'account.health_assessment',
            actions: ['nextSlide']
          },
          'health-concerns': {
            response: "What concerns you most? This will help us prioritize.",
            storeAs: 'account.health_assessment',
            nextBranchOnText: 'concerns-documented',
          },
          'health-at-risk': {
            response: "Let's document the risk factors. What specific issues are you seeing?",
            storeAs: 'account.health_assessment',
            nextBranchOnText: 'risk-documented',
          },
          'concerns-documented': {
            response: "Thanks. I've noted those concerns. We'll address them in our plan.",
            storeAs: 'account.concerns',
            actions: ['nextSlide']
          },
          'risk-documented': {
            response: "Understood. We'll make this a high-priority action item. Let's create a mitigation plan.",
            storeAs: 'account.risk_factors',
            actions: ['nextSlide']
          },
          'proceed': {
            response: "Moving forward...",
            actions: ['nextSlide']
          }
        }
      },

      artifacts: {
        sections: [
          {
            id: 'account-overview',
            title: `${COMMON_PLACEHOLDERS.CUSTOMER_NAME} - Account Overview`,
            type: 'custom',
            visible: true,
            data: {
              componentType: 'AccountOverviewArtifact',
              props: {
                // Will be populated at runtime with customer metrics
              }
            }
          }
        ]
      }
    };
  }
);
