/**
 * Executive Engagement Workflow Configuration
 *
 * Critical executive engagement workflow for handling escalations and rebuilding trust.
 * Guides CSMs through strategy, stakeholder review, email drafting, and talking points.
 */

import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';

export const executiveEngagementWorkflowConfig: WorkflowConfig = {
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
      arr: { label: 'ARR', value: '$185K', status: 'orange' },
      licenseUnitPrice: { label: 'Price/Seat', value: '$3,700', status: 'orange' },
      renewalDate: { label: 'Renewal', value: 'Apr 15', sublabel: '125 days', status: 'orange' },
      primaryContact: { label: 'Primary Contact', value: 'Marcus Castellan', role: 'COO' },
      riskScore: { label: 'Risk Score', value: '8/10', status: 'red' },
      growthScore: { label: 'Growth Score', value: '6/10', status: 'orange' },
      yoyGrowth: { label: 'YoY Growth', value: '+23%', status: 'green' },
      lastMonth: { label: 'Last Month', value: '-5%', status: 'red' }
    }
  },

  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'License Capacity',
      data: [87, 85, 82, 80, 78, 75, 73, 70, 68, 65, 63, 60, 58, 55, 53, 50, 48, 45],
      chartContextLabel: '↘ Declining usage',
      chartContextColor: 'text-red-600',
      dataColors: { threshold: 70, belowColor: 'bg-red-500', aboveColor: 'bg-blue-500' }
    },
    userLicenses: {
      title: 'Active Users',
      showReferenceLine: true,
      referenceLineLabel: 'Licensed Seats',
      data: [50, 50, 49, 48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 35],
      chartContextLabel: '↘ User churn',
      chartContextColor: 'text-red-600',
      dataColors: { threshold: 50, belowColor: 'bg-red-500', aboveColor: 'bg-purple-500' }
    },
    renewalInsights: {
      renewalStage: 'Crisis',
      confidence: 45,
      recommendedAction: 'Immediate Executive Engagement',
      keyReasons: [
        { category: 'Escalation', detail: 'Executive escalation email received' },
        { category: 'Sentiment', detail: 'Relationship strength currently weak' },
        { category: 'Usage', detail: 'Declining usage and user churn' },
        { category: 'Urgency', detail: 'Immediate response required' }
      ]
    }
  },

  chat: {
    placeholder: 'Ask me anything about this engagement...',
    aiGreeting: "Marcus from {{customerName}} sent an escalation email expressing serious concerns about recent service issues. This requires immediate attention and a thoughtful response.",
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
      title: 'Situation',
      description: 'Executive escalation overview',
      label: 'Situation',
      stepMapping: 'greeting',
      chat: {
        initialMessage: {
          text: "Marcus from {{customerName}} sent an escalation email expressing serious concerns about recent service issues. This requires immediate attention and a thoughtful response. I'll help you prepare for this critical engagement. Ready to get started?",
          buttons: [
            { label: 'Start Planning', value: 'start', 'label-background': 'bg-purple-600', 'label-text': 'text-white' },
            { label: 'Snooze', value: 'snooze', 'label-background': 'bg-blue-500', 'label-text': 'text-white' },
            { label: 'Skip', value: 'skip', 'label-background': 'bg-gray-500', 'label-text': 'text-white' }
          ]
        },
        branches: {}
      },
      artifacts: {
        sections: [
          {
            id: 'situation-checklist',
            title: 'Executive Engagement - {{customerName}}',
            type: 'planning-checklist',
            visible: true,
            data: {
              items: [
                { id: '1', label: 'Marcus sent escalation email about service issues', completed: false },
                { id: '2', label: 'Relationship strength currently weak', completed: false },
                { id: '3', label: 'Critical engagement required to rebuild trust', completed: false },
                { id: '4', label: 'Marcus expects accountability and concrete actions', completed: false },
                { id: '5', label: 'Timeline pressure - immediate response needed', completed: false }
              ],
              showActions: false
            }
          }
        ]
      }
    },
    {
      id: 'strategy',
      slideNumber: 2,
      title: 'Strategy',
      description: 'Define engagement approach',
      label: 'Strategy',
      stepMapping: 'strategy',
      chat: {
        initialMessage: {
          text: "Great! Let's define your engagement strategy. This will guide how you approach this critical conversation with Marcus.\n\nFirst question: What's your primary objective for this engagement?\n\nChoose the most important goal for this interaction.",
          component: {
            type: 'radio',
            id: 'primary-objective',
            options: [
              {
                value: 'rebuild-trust',
                label: 'Rebuild Trust',
                description: 'Acknowledge issues and demonstrate commitment to improvement'
              },
              {
                value: 'acknowledge-issue',
                label: 'Acknowledge & Address Issue',
                description: 'Take accountability for specific problems'
              },
              {
                value: 'set-expectations',
                label: 'Set Clear Expectations',
                description: 'Define what success looks like going forward'
              }
            ],
            required: true
          }
        },
        branches: {
          'initial': {
            response: "Excellent choice. Now, what tone should this engagement take?\n\nRate from 1 (formal/apologetic) to 10 (casual/forward-looking).",
            storeAs: 'strategy.primaryObjective',
            component: {
              type: 'slider',
              id: 'tone',
              min: 1,
              max: 10,
              defaultValue: 4,
              labels: {
                min: 'Formal (1)',
                max: 'Casual (10)'
              },
              accentColor: 'purple',
              showValue: true
            }
          },
          'tone-received': {
            response: "Thanks! Why is this the right tone for this executive?",
            storeAs: 'strategy.tone',
            nextBranchOnText: 'ask-urgency'
          },
          'ask-urgency': {
            response: "Got it. Next question: What's the response timeline?\n\nWhen should you reach out?",
            storeAs: 'strategy.toneReason',
            component: {
              type: 'dropdown',
              id: 'urgency',
              options: [
                { value: 'immediate', label: 'Immediate - Today or tomorrow' },
                { value: 'this-week', label: 'This Week - Within 5 business days' },
                { value: 'flexible', label: 'Flexible - When appropriate' }
              ],
              placeholder: 'Select timeline...',
              required: true
            }
          },
          'urgency-received': {
            response: "Perfect. Last question: What's the key message you want to convey?\n\nIn one or two sentences, what do you want them to remember?",
            storeAs: 'strategy.urgency',
            nextBranchOnText: 'complete-strategy'
          },
          'complete-strategy': {
            response: "Excellent! I have your complete strategy. Let me prepare the stakeholder profiles and we'll review them next.",
            storeAs: 'strategy.keyMessage',
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
      id: 'stakeholders',
      slideNumber: 3,
      title: 'Stakeholders',
      description: 'Review key contacts',
      label: 'Stakeholders',
      stepMapping: 'stakeholders',
      chat: {
        initialMessage: {
          text: "Perfect! Let's review the key stakeholders at {{customerName}}. Understanding their perspectives will help you navigate this engagement effectively.\n\nReview Marcus and Elena's profiles on the right - their concerns, leverage points, and recent interactions. You can add notes as needed."
        },
        branches: {}
      },
      artifacts: {
        sections: [
          {
            id: 'stakeholder-profiles',
            title: 'Key Stakeholders',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'StakeholderProfileArtifact'
            }
          }
        ]
      }
    },
    {
      id: 'draft-email',
      slideNumber: 4,
      title: 'Draft Email',
      description: 'Compose response email',
      label: 'Draft Email',
      stepMapping: 'draft-email',
      chat: {
        initialMessage: {
          text: "Excellent! Now let's draft your response email to Marcus. This is your chance to take accountability and propose a path forward.\n\nI've drafted an email on the right based on your strategy. Review and edit as needed, then proceed to prepare talking points."
        },
        branches: {}
      },
      artifacts: {
        sections: [
          {
            id: 'email-draft',
            title: 'Response Email',
            type: 'email',
            visible: true,
            data: {
              to: 'marcus.castellan@obsidianblack.ops',
              subject: 'Re: Year Two is your proving ground',
              body: "Hi Marcus,\n\nThank you for your direct email. I take full accountability for the recent service disruptions and their impact on Obsidian Black's operations..."
            }
          }
        ]
      }
    },
    {
      id: 'talking-points',
      slideNumber: 5,
      title: 'Talking Points',
      description: 'Prepare for the call',
      label: 'Talking Points',
      stepMapping: 'talking-points',
      chat: {
        initialMessage: {
          text: "Great! Now let's prepare structured talking points for your call with Marcus. This will help you stay focused and deliver your message effectively.\n\nReview the talking points on the right - organized into opening, middle, and close sections. You can edit them if needed."
        },
        branches: {}
      },
      artifacts: {
        sections: [
          {
            id: 'talking-points',
            title: 'Call Talking Points',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'TalkingPointsArtifact'
            }
          }
        ]
      }
    },
    {
      id: 'send-schedule',
      slideNumber: 6,
      title: 'Send & Schedule',
      description: 'Send email and schedule meeting',
      label: 'Send & Schedule',
      stepMapping: 'send-schedule',
      chat: {
        initialMessage: {
          text: "Perfect! You're ready to send the email and schedule the accountability call with Marcus.\n\nReview the final email on the right. When you send it, I'll automatically schedule the meeting and set up AI monitoring for prep and follow-up."
        },
        branches: {}
      },
      artifacts: {
        sections: [
          {
            id: 'final-email',
            title: 'Send Email & Schedule',
            type: 'email',
            visible: true,
            data: {
              to: 'marcus.castellan@obsidianblack.ops',
              subject: 'Re: Year Two is your proving ground',
              sendButtonLabel: 'Send & Schedule Meeting'
            }
          }
        ]
      }
    },
    {
      id: 'engagement-actions',
      slideNumber: 7,
      title: 'Next Actions',
      description: 'Summary and follow-up',
      label: 'Next Actions',
      stepMapping: 'engagement-actions',
      chat: {
        initialMessage: {
          text: "**Executive Engagement Ready!**\n\nYour executive engagement plan for {{customerName}} is complete. Review the summary on the right to see what's been accomplished and your next steps."
        },
        branches: {}
      },
      artifacts: {
        sections: [
          {
            id: 'engagement-summary',
            title: 'Engagement Summary',
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
      text: 'Executive Engagement',
      subtitle: 'Critical Response'
    },
    steps: [],
    progressMeter: {
      currentStep: 1,
      totalSteps: 7,
      progressPercentage: 14
    }
  }
};
