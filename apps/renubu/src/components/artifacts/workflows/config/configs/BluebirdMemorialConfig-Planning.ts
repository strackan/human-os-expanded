import { WorkflowConfig } from '../WorkflowConfig';

export const bluebirdMemorialPlanningConfig: WorkflowConfig = {
  customer: {
    name: 'Bluebird Memorial Hospital',
    nextCustomer: 'Medifarm'
  },
  layout: {
    modalDimensions: { width: 80, height: 80, top: 10, left: 10 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: false,
    statsHeight: 50
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$124,500',
        trend: 'flat',
        trendValue: '+1.2%',
      },
      licenseUnitPrice: {
        label: 'Cost Per License',
        value: '$150',
        sublabel: '(88% value)',
        status: 'orange',
        trend: 'Pays comparably less per unit than 88% of customers'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Jan 18, 2026',
        sublabel: '95 days',
        status: 'green'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Joe Devine',
        role: 'CTO'
      },
      riskScore: {
        label: 'Risk Score',
        value: '6.2/10',
        status: 'orange',
        sublabel: 'Stagnant usage in first year; No executive contact in 90+ days'
      },
      growthScore: {
        label: 'Opportunity Score',
        value: '5.8/10',
        status: 'orange',
        sublabel: '24 open roles on LinkedIn; Strong champion engagement'
      },
      yoyGrowth: '{{chart.yoyGrowth.flat}}',
      lastMonth: '{{chart.lastMonth.flat}}'
    }
  },
  analytics: {
    usageTrend: '{{chart.usageTrend.falling}}',
    userLicenses: '{{chart.userLicenses.falling}}',
    renewalInsights: {
      renewalStage: 'Planning',
      confidence: 72,
      recommendedAction: 'Send Flat Renewal; Coordinate executive outreach; Execute Strategic Annual Engagement Plan',
      keyReasons: [
        { category: 'Adoption', detail: 'Stagnant usage in first year' },
        { category: 'Executive Engagement', detail: 'No contact in 90+ days' },
        { category: 'Sentiment', detail: 'Recent support comments suggest product frustration' }
      ]
    }
  },
  chat: {
    placeholder: 'Ask about renewal strategy, contract terms, or pricing...',
    aiGreeting: "Welcome to Bluebird Memorial Hospital's renewal planning workflow. I'm here to help you develop the optimal renewal strategy.",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "I'm sorry, I didn't understand that. Please try one of the available options or ask about the renewal process.",
      initialMessage: {
        text: "Good morning! **Bluebird Memorial Hospital's** 90-day autorenewal is next week. Their YoY growth is **+1.2%** (flat) and usage trend shows **declining usage over 6 months**. It's time to prepare our strategy and deliver the renewal notification.\n\nShall we get started?",
        buttons: [
          { label: 'Skip', value: 'skip', 'label-background': 'bg-red-100', 'label-text': 'text-red-800' },
          { label: 'Snooze', value: 'snooze', 'label-background': 'bg-orange-100', 'label-text': 'text-orange-800' },
          { label: 'Let\'s Do It!', value: 'proceed', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
        ],
        nextBranches: {
          'skip': 'skip',
          'snooze': 'snooze',
          'proceed': 'strategy-selection'
        }
      },
      branches: {
        'strategy-selection': {
          response: "Perfect. Given **Bluebird Memorial Hospital's** above-average ARR ($124,500) and current risk factors, I recommend a conservative strategy with little to no increase. How shall we proceed?",
          delay: 1,
          buttons: [
            { label: 'Other approach', value: 'other', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' },
            { label: 'Conservative strategy', value: 'conservative', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'other': 'other-approach',
            'conservative': 'conservative-strategy'
          }
        },
        'conservative-strategy': {
          response: "Great, we'll proceed with the conservative strategy.",
          delay: 1,
          buttons: [
            { label: 'Continue', value: 'check-contract', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'check-contract': 'contract-analysis'
          }
        },
        'contract-analysis': {
          response: "The contract has language that does not allow price increases above 2% unless approved in writing. I recommend proceeding with a 2% price increase, as amending the contract increases risk significantly.\n\nWould you like to proceed with 2%, or enter a different percentage?",
          delay: 1,
          buttons: [
            { label: '2% increase', value: '2-percent', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Different amount', value: 'custom', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            '2-percent': 'generate-quote',
            'custom': 'custom-amount'
          }
        },
        'generate-quote': {
          response: "Noted. I've created an editable quote reflecting the updated 2% pricing. Please review it, make any changes, and let me know when you're ready to send.",
          delay: 1,
          actions: ['showArtifact', 'showMenu'],
          artifactId: 'renewal-quote',
          buttons: [
            { label: 'Looks good, send it', value: 'send-quote', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Need to modify', value: 'modify-quote', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'send-quote': 'send-quote',
            'modify-quote': 'modify-quote'
          }
        },
        'send-quote': {
          response: "On it! I've sent the quote to **Joe Devine** and cc'd you using your standard email template.",
          delay: 1,
          buttons: [
            { label: 'Perfect, thank you!', value: 'complete', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Set follow-up reminder', value: 'reminder', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'complete': 'workflow-complete',
            'reminder': 'set-reminder'
          }
        },
        'modify-quote': {
          response: "No problem! The quote is editable - you can click on any field to modify it. When you're satisfied with the changes, let me know and I'll send it out.",
          delay: 1,
          buttons: [
            { label: 'Ready to send now', value: 'send-quote', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'send-quote': 'send-quote'
          }
        },
        'workflow-complete': {
          response: "Excellent! The renewal workflow for **Bluebird Memorial Hospital** is complete. The quote has been sent and follow-up is scheduled. You're all set for this renewal cycle.",
          delay: 1,
          buttons: [
            { label: 'Next customer', value: 'next-customer-action', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ]
        },
        'other-approach': {
          response: "I understand you'd like to explore a different approach. What strategy would you prefer for Bluebird Memorial Hospital's renewal?",
          delay: 1,
          buttons: [
            { label: 'Aggressive pricing', value: 'aggressive', 'label-background': 'bg-red-100', 'label-text': 'text-red-800' },
            { label: 'Value-based approach', value: 'value-based', 'label-background': 'bg-purple-100', 'label-text': 'text-purple-800' },
            { label: 'Go back to conservative', value: 'conservative', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'aggressive': 'aggressive-strategy',
            'value-based': 'value-strategy',
            'conservative': 'conservative-strategy'
          }
        },
        'skip': { subflow: 'common.skip' },
        'snooze': { subflow: 'common.snooze' },
        'exit-task-mode': {
          response: "Task mode closed. You can reopen it anytime from the dashboard.",
          actions: ['exitTaskMode']
        },
        'next-customer-action': {
          response: "Moving to the next customer...",
          actions: ['nextCustomer']
        }
      }
    },
    features: {
      attachments: false,
      voiceRecording: false,
      designMode: false,
      editMode: true,
      artifactsToggle: true
    }
  },
  artifacts: {
    sections: [
      {
        id: 'renewal-quote',
        title: 'Renewal Quote',
        type: 'quote',
        visible: false,
        data: {
          quoteNumber: 'Q-2025-0924',
          quoteDate: 'September 17, 2025',
          customerName: 'Bluebird Memorial Hospital',
          customerContact: {
            name: 'Joe Devine',
            title: 'CTO',
            email: 'joe.devine@bluebirdmemorial.org'
          },
          customerAddress: {
            company: 'Bluebird Memorial Hospital',
            street: '1542 Medical Center Drive',
            city: 'Portland',
            state: 'OR',
            zip: '97205'
          },
          companyInfo: {
            name: 'Renubu Technologies Inc.',
            address: {
              street: '1247 Innovation Drive, Suite 400',
              city: 'San Francisco',
              state: 'CA',
              zip: '94105'
            },
            email: 'renewals@renubu.com'
          },
          lineItems: [
            {
              id: 'platform-license',
              product: 'Renubu Platform License',
              description: 'Healthcare workflow optimization platform',
              period: '12 months',
              rate: 150,
              quantity: 830,
              total: 124500
            }
          ],
          summary: {
            subtotal: 124500,
            increase: {
              percentage: 2,
              amount: 2490,
              description: '2% Annual Increase'
            },
            total: 126990
          },
          terms: [
            'Renewal effective January 18, 2026',
            '2% annual increase per contract terms (Section 4.2)',
            'Payment due within 30 days of renewal date',
            'This renewal is bound by the existing License Agreement'
          ],
          effectiveDate: 'January 18, 2026',
          notes: 'Thank you for your continued partnership with Renubu. We look forward to supporting Bluebird Memorial Hospital\'s continued success.'
        }
      }
    ]
  },
  sidePanel: {
    enabled: true,
    title: {
      text: "Renewal Planning Workflow",
      subtitle: "Bluebird Memorial Hospital",
      icon: "🏥"
    },
    steps: [
      {
        id: "initial-assessment",
        title: "Initial Assessment",
        description: "Review customer metrics and risk factors",
        status: "completed",
        workflowBranch: "initial",
        icon: "📊"
      },
      {
        id: "strategy-selection",
        title: "Strategy Selection",
        description: "Choose appropriate renewal approach",
        status: "in-progress",
        workflowBranch: "strategy-selection",
        icon: "🎯"
      },
      {
        id: "contract-review",
        title: "Contract Review",
        description: "Analyze contract terms and constraints",
        status: "pending",
        workflowBranch: "contract-analysis",
        icon: "📋"
      },
      {
        id: "quote-generation",
        title: "Quote Generation",
        description: "Create and customize renewal quote",
        status: "pending",
        workflowBranch: "generate-quote",
        icon: "💰"
      },
      {
        id: "quote-delivery",
        title: "Quote Delivery",
        description: "Send quote to customer",
        status: "pending",
        workflowBranch: "send-quote",
        icon: "📧"
      },
      {
        id: "follow-up",
        title: "Follow-up Planning",
        description: "Schedule next steps and monitoring",
        status: "pending",
        workflowBranch: "workflow-complete",
        icon: "⏰"
      }
    ],
    progressMeter: {
      currentStep: 2,
      totalSteps: 6,
      progressPercentage: 33,
      showPercentage: true,
      showStepNumbers: true
    },
    showProgressMeter: true,
    showSteps: true
  }
};