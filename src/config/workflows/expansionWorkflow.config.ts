/**
 * Expansion Opportunity Workflow Configuration
 *
 * Proactive expansion workflow for customers exceeding capacity and showing strong growth.
 * Guides CSMs through growth assessment, scenario planning, and outreach.
 */

import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';

export const expansionWorkflowConfig: WorkflowConfig = {
  customer: {
    name: 'Obsidian Black',
  },

  layout: {
    modalDimensions: {
      width: 90,
      height: 90,
      top: 5,
      left: 5
    },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: true,
  },

  customerOverview: {
    metrics: {
      arr: { label: 'ARR', value: '$185K', status: 'green' },
      licenseUnitPrice: { label: 'Price/Seat', value: '$3,700', status: 'red', sublabel: '18th percentile' },
      renewalDate: { label: 'Renewal', value: 'Apr 15', sublabel: '6 months out', status: 'green' },
      primaryContact: { label: 'Primary Contact', value: 'Sarah Chen', role: 'VP Operations' },
      riskScore: { label: 'Risk Score', value: '2/10', status: 'green' },
      growthScore: { label: 'Growth Score', value: '9/10', status: 'green' },
      yoyGrowth: { label: 'YoY Growth', value: '+47%', status: 'green' },
      lastMonth: { label: 'Last Month', value: '+12%', status: 'green' }
    }
  },

  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'License Capacity',
      referenceLineHeight: 100,
      data: [60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 140],
      chartContextLabel: '↗ 40% over capacity',
      chartContextColor: 'text-red-600',
      dataColors: { threshold: 100, belowColor: 'bg-blue-500', aboveColor: 'bg-red-500' }
    },
    userLicenses: {
      title: 'Active Users',
      showReferenceLine: true,
      referenceLineLabel: 'Licensed Seats',
      data: [42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 70, 70, 70],
      chartContextLabel: '↗ +67% growth',
      chartContextColor: 'text-purple-600',
      dataColors: { threshold: 50, belowColor: 'bg-purple-500', aboveColor: 'bg-green-500' }
    },
    renewalInsights: {
      renewalStage: 'Expansion',
      confidence: 95,
      recommendedAction: 'Proactive Expansion Outreach',
      keyReasons: [
        { category: 'Capacity', detail: '40% over licensed capacity' },
        { category: 'Growth', detail: '47% YoY growth trajectory' },
        { category: 'Pricing', detail: 'Significantly underpriced (18th percentile)' },
        { category: 'Timing', detail: '6 months before renewal - perfect timing' }
      ]
    }
  },

  chat: {
    placeholder: 'Ask me anything about this expansion opportunity...',
    aiGreeting: "I noticed {{customerName}} is growing rapidly and significantly exceeding their current capacity. This is a perfect opportunity to proactively reach out about expanding their partnership before renewal.",
    features: {
      attachments: false,
      voiceRecording: false,
      designMode: false,
      editMode: false,
      artifactsToggle: true
    }
  },

  artifacts: {
    sections: []
  },

  slides: [
    {
      id: 'greeting',
      slideNumber: 1,
      title: 'Opportunity Check',
      description: 'Expansion opportunity overview',
      label: 'Opportunity Check',
      stepMapping: 'greeting',
      chat: {
        initialMessage: {
          text: "I noticed {{customerName}} is growing rapidly and significantly exceeding their current capacity. This is a perfect opportunity to proactively reach out about expanding their partnership before renewal. Ready to explore this opportunity?",
          buttons: [
            { label: "Let's Do It", value: 'start', 'label-background': 'bg-purple-600', 'label-text': 'text-white' },
            { label: 'Snooze', value: 'snooze', 'label-background': 'bg-blue-500', 'label-text': 'text-white' },
            { label: 'Skip', value: 'skip', 'label-background': 'bg-gray-500', 'label-text': 'text-white' }
          ]
        },
        branches: {}
      },
      artifacts: {
        sections: [
          {
            id: 'opportunity-checklist',
            title: 'Expansion Opportunity for {{customerName}}',
            type: 'planning-checklist',
            visible: true,
            data: {
              items: [
                { id: '1', label: 'Customer is 40% over licensed capacity', completed: false },
                { id: '2', label: 'Strong product adoption (94% adoption rate)', completed: false },
                { id: '3', label: 'Rapid growth trajectory (47% YoY)', completed: false },
                { id: '4', label: 'Significantly underpriced (18th percentile)', completed: false },
                { id: '5', label: 'Renewal 6+ months away - perfect timing', completed: false }
              ],
              showActions: false
            }
          }
        ]
      }
    },
    {
      id: 'growth-assessment',
      slideNumber: 2,
      title: 'Growth Context',
      description: 'Understanding growth dynamics',
      label: 'Growth Context',
      stepMapping: 'growth-assessment',
      chat: {
        initialMessage: {
          text: "Perfect! Before we dive into the numbers, I need to understand the growth context for {{customerName}}.\n\nFirst question: How would you describe their usage trajectory?\n\nRate from 1 (declining) to 10 (rapid growth).",
          component: {
            type: 'slider',
            id: 'usage-trajectory',
            min: 1,
            max: 10,
            defaultValue: 7,
            labels: {
              min: 'Declining (1)',
              max: 'Rapid Growth (10)'
            },
            accentColor: 'blue',
            showValue: true
          }
        },
        branches: {
          'initial': {
            response: "Thanks! What signals indicate this trajectory?",
            storeAs: 'growth-assessment.usageTrajectory',
            nextBranchOnText: 'ask-price-sensitivity'
          },
          'ask-price-sensitivity': {
            response: "Got it. Now, how price-sensitive is this customer?\n\nBased on past conversations and their market position.",
            storeAs: 'growth-assessment.usageReason',
            component: {
              type: 'radio',
              id: 'price-sensitivity',
              options: [
                { value: 'low', label: 'Low - Value-focused, willing to pay for quality' },
                { value: 'medium', label: 'Medium - Balanced approach to pricing' },
                { value: 'high', label: 'High - Very cost-conscious, price-driven decisions' }
              ],
              required: true
            }
          },
          'price-sensitivity-received': {
            response: "Thanks! What evidence supports this assessment?",
            storeAs: 'growth-assessment.priceSensitivity',
            nextBranchOnText: 'ask-competitive-risk'
          },
          'ask-competitive-risk': {
            response: "Perfect. Last question: What's the competitive risk level?\n\nLikelihood of losing them to a competitor.",
            storeAs: 'growth-assessment.priceSensitivityReason',
            component: {
              type: 'radio',
              id: 'competitive-risk',
              options: [
                { value: 'low', label: 'Low - Strong relationship, no active evaluation' },
                { value: 'medium', label: 'Medium - Some competitive interest' },
                { value: 'high', label: 'High - Actively evaluating alternatives' }
              ],
              required: true
            }
          },
          'competitive-risk-received': {
            response: "Excellent! What competitive dynamics are at play?",
            storeAs: 'growth-assessment.competitiveRisk',
            nextBranchOnText: 'complete-assessment'
          },
          'complete-assessment': {
            response: "Perfect! I have everything I need. Let me analyze {{customerName}}'s current state and we'll review it next.",
            storeAs: 'growth-assessment.competitiveReason',
            delay: 2,
            actions: ['nextSlide']
          }
        },
        userTriggers: {
          '.+': 'handle-user-response'
        },
        defaultMessage: "I'm listening..."
      },
      artifacts: {
        sections: []
      }
    },
    {
      id: 'expansion-overview',
      slideNumber: 3,
      title: 'Current State',
      description: 'Contract, usage, and market positioning',
      label: 'Current State',
      stepMapping: 'expansion-overview',
      chat: {
        initialMessage: {
          text: "Excellent! I've analyzed {{customerName}}'s current state. The numbers tell a compelling story.\n\nReview the three tabs on the right - their contract details, usage growth, and market positioning. Notice they're 40% over capacity and significantly underpriced."
        },
        branches: {}
      },
      artifacts: {
        sections: [
          {
            id: 'expansion-overview',
            title: 'Expansion Overview',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'ExpansionOverviewArtifact'
            }
          }
        ]
      }
    },
    {
      id: 'expansion-recommendation',
      slideNumber: 4,
      title: 'Recommendation',
      description: 'Proactive expansion strategy',
      label: 'Recommendation',
      stepMapping: 'expansion-recommendation',
      chat: {
        initialMessage: {
          text: "Based on their rapid growth and underpriced position, I recommend a **PROACTIVE EXPANSION** approach.\n\nThis is the perfect time to reach out - they need more capacity, we have pricing leverage, and it's better to act now than wait for renewal pressure."
        },
        branches: {}
      },
      artifacts: {
        sections: [
          {
            id: 'recommendation-slide',
            title: 'Expansion Recommendation',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'RecommendationSlide'
            }
          }
        ]
      }
    },
    {
      id: 'expansion-proposal',
      slideNumber: 5,
      title: 'Scenarios',
      description: 'Expansion pricing scenarios',
      label: 'Scenarios',
      stepMapping: 'expansion-proposal',
      chat: {
        initialMessage: {
          text: "I've prepared three expansion scenarios for {{customerName}} - conservative, balanced, and aggressive.\n\nReview each scenario on the right, including financial impact and ROI justification. The balanced scenario is recommended, but choose what fits your relationship best."
        },
        branches: {}
      },
      artifacts: {
        sections: [
          {
            id: 'expansion-proposal',
            title: 'Expansion Scenarios',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'ExpansionProposalArtifact'
            }
          }
        ]
      }
    },
    {
      id: 'compose-email',
      slideNumber: 6,
      title: 'Compose Email',
      description: 'Draft outreach email',
      label: 'Compose Email',
      stepMapping: 'compose-email',
      chat: {
        initialMessage: {
          text: "Great choice! Now let's craft the initial outreach email to schedule a conversation about their expansion.\n\nI've drafted an email on the right. You can edit it inline if needed, then send it when you're ready."
        },
        branches: {}
      },
      artifacts: {
        sections: [
          {
            id: 'email-draft',
            title: 'Outreach Email',
            type: 'email-draft',
            visible: true,
            data: {
              to: 'sarah.chen@techflow.com',
              subject: 'Quick Chat - Capacity Planning for Q3',
              body: "Hi Sarah,\n\nI hope you're doing well! I wanted to reach out proactively as I've been reviewing TechFlow's growth trajectory with our platform..."
            }
          }
        ]
      }
    },
    {
      id: 'expansion-actions',
      slideNumber: 7,
      title: 'Next Steps',
      description: 'Summary and follow-up actions',
      label: 'Next Steps',
      stepMapping: 'expansion-actions',
      chat: {
        initialMessage: {
          text: "**Expansion Plan Complete!**\n\nYour expansion outreach for {{customerName}} is ready. Review the summary on the right to see what we've accomplished and your next steps."
        },
        branches: {}
      },
      artifacts: {
        sections: [
          {
            id: 'plan-summary',
            title: 'Expansion Summary',
            type: 'plan-summary',
            visible: true,
            data: {
              componentType: 'PlanSummaryArtifact'
            }
          }
        ]
      }
    }
  ],

  sidePanel: {
    enabled: false,
    title: {
      text: 'Expansion Opportunity',
      subtitle: 'Proactive Growth'
    },
    steps: [],
    progressMeter: {
      currentStep: 1,
      totalSteps: 7,
      progressPercentage: 14
    }
  }
};
