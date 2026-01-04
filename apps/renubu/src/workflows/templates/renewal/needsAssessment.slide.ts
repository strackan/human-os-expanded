import { SlideTemplate } from '../../types';

/**
 * Needs Assessment Slide Template for Renewal Workflow
 *
 * This slide handles the needs assessment phase including:
 * - Email drafting
 * - Workflow summary
 * - Alternative options exploration
 */
export const needsAssessmentSlide: SlideTemplate = {
  id: 'needs-assessment',
  slideNumber: 2,
  title: 'Needs Assessment',
  description: 'Analyze customer requirements and growth opportunities',
  label: 'Needs Assessment',
  stepMapping: 'needs-assessment',
  showSideMenu: false,

  // Reference stages to include as artifacts
  artifactStages: [
    { id: 'emailComposer' },
    { id: 'workflowSummary' }
  ],

  chat: {
    initialMessage: {
      text: "Great! I've prepared an analysis of {{customer.name}}'s expansion opportunities. Based on their 65% growth and Series C funding, they're prime candidates for a multi-year expansion deal.",
      buttons: [
        { label: 'Draft email', value: 'draft-email', completeStep: 'needs-assessment' },
        { label: 'Schedule meeting', value: 'schedule' },
        { label: 'View detailed analysis', value: 'analysis' }
      ]
    },
    branches: {
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
          { label: 'Yes', value: 'email-confirmation' },
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
      'free-chat': {
        response: "I'm here to help! Feel free to ask me anything about Dynamic Corp's account, renewal strategy, or any other questions you might have. What would you like to know?"
      }
    },
    userTriggers: {
      ".*email.*|.*draft.*": "email-flow",
      ".*auto-followup.*": "email-complete",
      ".*something.*else.*": "free-chat"
    },
    defaultMessage: "I'm sorry, I didn't understand that. Could you try again or select one of the available options?"
  },

  sidePanel: {
    enabled: true,
    title: {
      text: "Customer Engagement Workflow",
      subtitle: "Dynamic Corp Account",
      icon: "📋"
    },
    steps: [
      {
        id: "initial-contact",
        title: "Initial Contact",
        description: "Establish communication with customer",
        status: "completed",
        workflowBranch: "initial",
        icon: "📞"
      },
      {
        id: "needs-assessment",
        title: "Needs Assessment",
        description: "Analyze customer requirements and growth opportunities",
        status: "in-progress",
        workflowBranch: "expansion",
        icon: "🔍"
      },
      {
        id: "proposal-draft",
        title: "Proposal Draft",
        description: "Create tailored proposal based on analysis",
        status: "pending",
        workflowBranch: "email-flow",
        icon: "📝"
      },
      {
        id: "follow-up",
        title: "Follow-up",
        description: "Schedule meeting and next steps",
        status: "pending",
        workflowBranch: "email-complete",
        icon: "📅"
      }
    ]
  }
};
