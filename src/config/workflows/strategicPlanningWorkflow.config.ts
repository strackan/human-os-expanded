/**
 * Strategic Account Planning Workflow Configuration
 *
 * This workflow guides CSMs through annual account planning for strategic customers.
 * It includes assessment, account overview, strategy recommendation, and action planning.
 */

import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';

export const strategicPlanningWorkflowConfig: WorkflowConfig = {
  customer: {
    name: 'Obsidian Black', // Will be overridden at runtime
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

  // These will be populated from database at runtime
  customerOverview: {
    metrics: {
      arr: { label: 'ARR', value: '$185K', status: 'green' },
      licenseUnitPrice: { label: 'Price/Seat', value: '$3,700', status: 'orange' },
      renewalDate: { label: 'Renewal', value: 'Mar 15', sublabel: '125 days', status: 'orange' },
      primaryContact: { label: 'Primary Contact', value: 'Marcus Castellan', role: 'COO' },
      riskScore: { label: 'Risk Score', value: '6/10', status: 'orange' },
      growthScore: { label: 'Growth Score', value: '7/10', status: 'green' },
      yoyGrowth: { label: 'YoY Growth', value: '+23%', status: 'green' },
      lastMonth: { label: 'Last Month', value: '+5%', status: 'green' }
    }
  },

  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'License Capacity',
      data: [50, 52, 55, 58, 60, 62, 65, 68, 70, 72, 75, 78, 80, 82, 85, 87, 87, 87],
      chartContextLabel: 'Steady growth',
      chartContextColor: 'text-green-600',
      dataColors: { threshold: 70, belowColor: 'bg-blue-500', aboveColor: 'bg-green-500' }
    },
    userLicenses: {
      title: 'Active Users',
      showReferenceLine: true,
      referenceLineLabel: 'Licensed Seats',
      data: [42, 43, 44, 45, 45, 46, 47, 48, 48, 49, 50, 50, 50, 50, 50, 50, 50, 50],
      chartContextLabel: 'At capacity',
      chartContextColor: 'text-orange-600',
      dataColors: { threshold: 50, belowColor: 'bg-purple-500', aboveColor: 'bg-red-500' }
    },
    renewalInsights: {
      renewalStage: 'Planning',
      confidence: 75,
      recommendedAction: 'Annual Strategic Review',
      keyReasons: [
        { category: 'Contract', detail: 'Annual renewal approaching' },
        { category: 'Usage', detail: 'Healthy usage at 87% of capacity' },
        { category: 'Risk', detail: 'Medium risk - requires attention' },
        { category: 'Relationship', detail: 'Strong executive relationships' }
      ]
    }
  },

  chat: {
    placeholder: 'Ask me anything about this account...',
    aiGreeting: "Good morning! I noticed Obsidian Black's renewal is coming up. Let's create a strategic account plan together.",
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

  // Slide-based workflow structure
  slides: [
    {
      id: 'greeting',
      slideNumber: 1,
      title: 'Start Planning',
      description: 'Introduction and workflow kickoff',
      label: 'Start Planning',
      stepMapping: 'greeting',
      chat: {
        initialMessage: {
          text: "Good morning! I noticed {{customerName}}'s renewal was a few weeks ago which means it's time for our annual account review. No need to stress, though. I'll guide you through the whole process. Ready to get started?",
          buttons: [
            { label: 'Start Planning', value: 'start', 'label-background': 'bg-purple-600', 'label-text': 'text-white' },
            { label: 'Snooze', value: 'snooze', 'label-background': 'bg-blue-500', 'label-text': 'text-white' },
            { label: 'Skip', value: 'skip', 'label-background': 'bg-gray-500', 'label-text': 'text-white' }
          ],
          nextBranches: {
            'start': 'proceed-to-assessment',
            'snooze': 'handle-snooze',
            'skip': 'handle-skip'
          }
        },
        branches: {
          'proceed-to-assessment': {
            response: "Great! Let's start with a quick assessment.",
            actions: ['nextSlide']
          },
          'handle-snooze': {
            response: "No problem, I'll remind you in a few days.",
            actions: ['exitTaskMode']
          },
          'handle-skip': {
            response: 'Workflow skipped. Moving to next workflow.',
            actions: ['nextCustomer']
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'planning-checklist',
            title: 'Planning Checklist for {{customerName}}',
            type: 'planning-checklist',
            visible: true,
            data: {
              items: [
                { id: '1', label: 'Review customer profile and contract details', completed: false },
                { id: '2', label: 'Identify key stakeholders and decision makers', completed: false },
                { id: '3', label: 'Assess account health and risk factors', completed: false },
                { id: '4', label: 'Document growth and expansion opportunities', completed: false },
                { id: '5', label: 'Gather insights from past year interactions', completed: false }
              ],
              showActions: false
            }
          }
        ]
      }
    },
    {
      id: 'assessment',
      slideNumber: 2,
      title: 'Initial Assessment',
      description: 'Gather CSM insights about the account',
      label: 'Initial Assessment',
      stepMapping: 'assessment',
      chat: {
        initialMessage: {
          text: "Great! Let's start with a quick assessment. First question: What's the opportunity score for {{customerName}}?\n\nRate from 1 (low opportunity) to 10 (high opportunity).",
          component: {
            type: 'slider',
            id: 'opportunity-score',
            min: 1,
            max: 10,
            defaultValue: 5,
            labels: {
              min: 'Low (1)',
              max: 'High (10)'
            },
            accentColor: 'purple',
            showValue: true
          }
        },
        branches: {
          'initial': {
            response: "Thanks! Can you explain your reasoning for that opportunity score?",
            storeAs: 'assessment.opportunityScore',
            nextBranchOnText: 'ask-risk-score'
          },
          'ask-risk-score': {
            response: "Got it. Now, what's the risk score for {{customerName}}?\n\nRate from 0 (no risk) to 10 (high risk).",
            storeAs: 'assessment.opportunityReason',
            component: {
              type: 'slider',
              id: 'risk-score',
              min: 0,
              max: 10,
              defaultValue: 5,
              labels: {
                min: 'None (0)',
                max: 'High (10)'
              },
              accentColor: 'red',
              showValue: true
            },
            nextBranch: 'risk-score-received'
          },
          'risk-score-received': {
            response: "Thanks! What's the reasoning behind that risk score?",
            storeAs: 'assessment.riskScore',
            nextBranchOnText: 'ask-year-overview'
          },
          'ask-year-overview': {
            response: "Perfect. Last question: Can you give me an overview of the past year with {{customerName}}? What's been the journey like?",
            storeAs: 'assessment.riskReason',
            nextBranchOnText: 'complete-assessment'
          },
          'complete-assessment': {
            response: "Perfect! Let me show you a summary of your assessment. Does this look right?",
            storeAs: 'assessment.yearOverview',
            buttons: [
              { label: 'Looks Good', value: 'confirm', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
              { label: 'Edit Answer', value: 'edit', 'label-background': 'bg-blue-500', 'label-text': 'text-white' },
              { label: 'Start Over', value: 'restart', 'label-background': 'bg-gray-500', 'label-text': 'text-white' }
            ],
            nextBranches: {
              'confirm': 'proceed-to-overview',
              'edit': 'handle-edit',
              'restart': 'handle-restart'
            },
            actions: ['showArtifact'],
            artifactId: 'assessment-summary'
          },
          'proceed-to-overview': {
            response: "Great! Let me pull together the account details and we'll review them next.",
            delay: 2,
            actions: ['nextSlide']
          },
          'handle-edit': {
            response: "No problem! Which answer would you like to change?\n\n1. Opportunity Score\n2. Opportunity Reasoning\n3. Risk Score\n4. Risk Reasoning\n5. Year Overview",
            nextBranchOnText: 'confirm-after-edit'
          },
          'confirm-after-edit': {
            response: "Answer updated! Does everything look correct now?",
            buttons: [
              { label: 'Looks Good', value: 'confirm', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
              { label: 'Edit Another', value: 'edit', 'label-background': 'bg-blue-500', 'label-text': 'text-white' }
            ],
            nextBranches: {
              'confirm': 'proceed-to-overview',
              'edit': 'handle-edit'
            }
          },
          'handle-restart': {
            response: "Sure! Let's start the assessment over. What's the opportunity score for {{customerName}}?\n\nRate from 1 (low opportunity) to 10 (high opportunity).",
            component: {
              type: 'slider',
              id: 'opportunity-score-restart',
              min: 1,
              max: 10,
              defaultValue: 5,
              labels: {
                min: 'Low (1)',
                max: 'High (10)'
              },
              accentColor: 'purple',
              showValue: true
            },
            nextBranch: 'initial'
          }
        },
        userTriggers: {
          '.+': 'handle-user-response'
        },
        defaultMessage: "I'm listening..."
      },
      artifacts: {
        sections: [
          {
            id: 'assessment-summary',
            title: 'Assessment Summary',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'AssessmentSummaryArtifact',
              props: {},
              showWhenBranch: 'complete-assessment' // Only show when this branch is active
            }
          }
        ]
      }
    },
    {
      id: 'overview',
      slideNumber: 3,
      title: 'Account Overview',
      description: 'Review contract, contacts, and pricing',
      label: 'Account Overview',
      stepMapping: 'overview',
      chat: {
        initialMessage: {
          text: "Perfect! I've gathered the account details for {{customerName}}. Let's review the key information together.\n\nTake a look at the contract terms, contact engagement levels, and pricing structure on the right. This will help us build the right strategy.\n\nWhen you're ready, we can move forward to create the strategic plan.",
          buttons: [
            { label: 'Back', value: 'back', 'label-background': 'bg-gray-500', 'label-text': 'text-white' },
            { label: 'Continue to Strategy', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
          ],
          nextBranches: {
            'continue': 'proceed-to-strategy',
            'back': 'go-back'
          }
        },
        branches: {
          'proceed-to-strategy': {
            response: "Great! Let me analyze the account data and prepare a strategic recommendation.",
            delay: 2,
            actions: ['nextSlide']
          },
          'go-back': {
            response: "Going back to the assessment.",
            actions: ['goToPreviousSlide']
          },
          'explain-contract': {
            response: "The contract shows key terms including start date, end date, auto-renewal settings, and notice period. This helps us understand the renewal timeline and any contractual obligations."
          },
          'explain-contacts': {
            response: "These contacts represent your key stakeholders. We track their engagement levels to ensure you're maintaining strong relationships across the organization."
          },
          'explain-pricing': {
            response: "The pricing analysis shows your current ARR, seat count, and price per seat compared to market benchmarks. This helps identify expansion or pricing optimization opportunities."
          }
        },
        userTriggers: {
          'contract|terms|clause': 'explain-contract',
          'contact|stakeholder|who': 'explain-contacts',
          'pric(e|ing)|cost|arr': 'explain-pricing'
        },
        defaultMessage: "I'm here to help! You can ask about the contract, contacts, or pricing."
      },
      artifacts: {
        sections: [
          {
            id: 'account-overview',
            title: 'Account Overview',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'AccountOverviewArtifact',
              props: {} // Props will be populated from customer data
            }
          }
        ]
      }
    },
    {
      id: 'strategic-plan',
      slideNumber: 4,
      title: 'Strategic Plan',
      description: 'Strategy recommendation with comprehensive account plan',
      label: 'Strategic Plan',
      stepMapping: 'strategic-plan',
      chat: {
        initialMessage: {
          text: "Based on your assessment, I recommend an **Expand** strategy for {{customerName}}.\n\nReview the strategic plan on the right - use the tabs to explore the recommendation overview, key factors driving this decision, and the detailed timeline.\n\nWhat would you like to do?",
          buttons: [
            { label: 'Agree & Continue', value: 'agree', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
            { label: 'Modify Strategy', value: 'modify', 'label-background': 'bg-blue-500', 'label-text': 'text-white' },
            { label: 'Save for Later', value: 'save', 'label-background': 'bg-gray-500', 'label-text': 'text-white' }
          ],
          nextBranches: {
            'agree': 'proceed-to-action-plan',
            'modify': 'handle-modify',
            'save': 'handle-save'
          }
        },
        branches: {
          'proceed-to-action-plan': {
            response: "Perfect! Let me generate the action plan and next steps for implementing this strategy.",
            delay: 2,
            actions: ['nextSlide']
          },
          'handle-modify': {
            response: "I understand you'd like to modify the strategy. You can go back to adjust your assessment responses, which will update the recommendation. Would you like to do that?",
            buttons: [
              { label: 'Go Back to Assessment', value: 'back', 'label-background': 'bg-blue-600', 'label-text': 'text-white' },
              { label: 'Never Mind', value: 'cancel', 'label-background': 'bg-gray-500', 'label-text': 'text-white' }
            ],
            nextBranches: {
              'back': 'go-back',
              'cancel': 'return-to-plan'
            }
          },
          'go-back': {
            response: "Going back to the assessment.",
            actions: ['goToPreviousSlide']
          },
          'return-to-plan': {
            response: "No problem. Take your time reviewing the strategic plan. Let me know when you're ready to proceed."
          },
          'handle-save': {
            response: "I've saved this plan for later. You can return to it anytime from your dashboard.",
            delay: 2,
            actions: ['exitTaskMode']
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'strategic-recommendation-plan',
            title: 'Strategic Plan',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'StrategicRecommendationWithPlan',
              props: {
                workflowSteps: [
                  {
                    day: 30,
                    title: "Discovery & Opportunity Mapping",
                    description: "Conduct deep-dive sessions with key stakeholders to identify unmet needs, new use cases, and expansion opportunities.",
                    actions: [
                      "Schedule stakeholder interviews",
                      "Analyze product usage analytics",
                      "Identify white space opportunities",
                      "Document expansion hypotheses"
                    ]
                  },
                  {
                    day: 45,
                    title: "Value Alignment Workshop",
                    description: "Present ROI analysis of current investment and showcase additional capabilities that align with their business objectives.",
                    actions: [
                      "Prepare ROI deck",
                      "Schedule executive session",
                      "Demonstrate advanced features",
                      "Gather feedback on priorities"
                    ]
                  },
                  {
                    day: 60,
                    title: "Proposal Development",
                    description: "Create customized expansion proposal with clear business case, pricing, and implementation timeline.",
                    actions: [
                      "Draft proposal document",
                      "Get internal approvals",
                      "Prepare pricing options",
                      "Create implementation roadmap"
                    ]
                  },
                  {
                    day: 75,
                    title: "Executive Presentation",
                    description: "Present expansion proposal to decision-makers with emphasis on business outcomes and strategic value.",
                    actions: [
                      "Schedule C-level meeting",
                      "Deliver presentation",
                      "Address objections",
                      "Document next steps"
                    ]
                  },
                  {
                    day: 90,
                    title: "Negotiation & Refinement",
                    description: "Work through contract terms, pricing adjustments, and finalize expansion scope.",
                    actions: [
                      "Engage procurement",
                      "Negotiate terms",
                      "Finalize scope",
                      "Prepare contracts"
                    ]
                  },
                  {
                    day: 105,
                    title: "Contract Execution",
                    description: "Execute amended contract and kick off expansion implementation.",
                    actions: [
                      "Sign contracts",
                      "Process paperwork",
                      "Assign implementation team",
                      "Schedule kickoff"
                    ]
                  },
                  {
                    day: 120,
                    title: "Implementation Launch",
                    description: "Begin rollout of expanded services with dedicated success resources.",
                    actions: [
                      "Conduct kickoff meeting",
                      "Configure new features",
                      "Train end users",
                      "Establish success metrics"
                    ]
                  },
                  {
                    day: 150,
                    title: "Mid-Implementation Check",
                    description: "Review progress, address challenges, and ensure adoption is on track.",
                    actions: [
                      "Review adoption metrics",
                      "Gather user feedback",
                      "Address blockers",
                      "Adjust training as needed"
                    ]
                  },
                  {
                    day: 180,
                    title: "Expansion Value Realization",
                    description: "Measure outcomes against success criteria and document wins for future reference.",
                    actions: [
                      "Calculate realized ROI",
                      "Document case study",
                      "Plan celebration/recognition",
                      "Identify next expansion opportunities"
                    ]
                  }
                ]
              }
            }
          }
        ]
      }
    },
    {
      id: 'action-plan',
      slideNumber: 5,
      title: 'Next Actions',
      description: 'Summary and next steps',
      label: 'Next Actions',
      stepMapping: 'action-plan',
      chat: {
        initialMessage: {
          text: "**Planning Complete!**\n\nYour strategic plan for {{customerName}} is ready. Review the summary on the right to see what we've accomplished and your next steps.\n\nReady to move on?",
          buttons: [
            { label: 'Next Workflow', value: 'next', 'label-background': 'bg-green-600', 'label-text': 'text-white' }
          ],
          nextBranches: {
            'next': 'complete-workflow'
          }
        },
        branches: {
          'complete-workflow': {
            response: "Great work! Moving to the next workflow...",
            delay: 1,
            actions: ['nextCustomer']
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'plan-summary',
            title: 'Plan Summary & Next Steps',
            type: 'plan-summary',
            visible: true,
            data: {
              componentType: 'PlanSummaryArtifact',
              props: {} // Dynamic based on plan
            }
          }
        ]
      }
    }
  ],

  sidePanel: {
    enabled: false, // Progress already shown in header
    title: {
      text: 'Strategic Planning',
      subtitle: 'Annual Account Review'
    },
    steps: [],
    progressMeter: {
      currentStep: 1,
      totalSteps: 5,
      progressPercentage: Math.round(100 / 5) // 20%
    }
  }
};
