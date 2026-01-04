import { WorkflowConfig, WorkflowSlide } from '../WorkflowConfig';

// BASELINE template for building new demos
// This is a proven working config that loads correctly in dashboard
// Copy this file and modify gradually to create new templates
export const dynamicAiV2Baseline: WorkflowConfig = {
  customer: {
    name: 'Showcase Corp',
    nextCustomer: 'Demo Industries'
  },
  layout: {
    modalDimensions: { width: 80, height: 80, top: 10, left: 10 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: false
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$725,000',
        trend: 'up',
        trendValue: '+25.5%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$8.25',
        sublabel: '(95% value)',
        status: 'green',
        trend: 'Pays more than 95% of customers'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Feb 28, 2026',
        sublabel: '90 days',
        status: 'orange'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Michael Roberts',
        role: 'CTO'
      },
      riskScore: {
        label: 'Risk Score',
        value: '2.1/10',
        status: 'green',
        sublabel: 'No critical tickets'
      },
      growthScore: {
        label: 'Growth Score',
        value: '9.2/10',
        status: 'green',
        sublabel: 'High expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+35.2%',
        status: 'green',
        sparkData: [3, 4, 5, 6, 7, 8, 9],
        sublabel: 'Annual'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+22.3%',
        status: 'green',
        sparkData: [5, 6, 7, 8, 9, 10, 11],
        sublabel: 'Growing'
      }
    }
  },
  analytics: {
    usageTrend: '{{chart.usageTrend.rising}}',
    userLicenses: '{{chart.userLicenses.rising}}',
    renewalInsights: {
      renewalStage: 'Negotiation',
      confidence: 92,
      recommendedAction: 'Proactive Expansion Offer',
      keyReasons: [
        { category: 'Adoption', detail: '65% usage growth YTD' },
        { category: 'Company Growth', detail: 'Series C funding announced' },
        { category: 'News', detail: 'Expanding to APAC region' },
        { category: 'Sentiment', detail: 'Champion actively advocating internally' }
      ]
    }
  },
  chat: {
    placeholder: 'Type your question or select an option...',
    aiGreeting: "I'm here to help with your renewal strategy.",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "I'm sorry, I didn't understand that. Could you try again or select one of the available options?",
      initialMessage: {
        text: "Hi {{user.first}}! {{customer.name}}'s renewal is coming up on February 27th, which means we have about a week to decide if we're going to increase their license fees. Shall me make a plan? It should take about <b>7 minutes</b>. ",
        buttons: [
          { label: 'Start Planning', value: 'planning' },
          { label: 'Snooze', value: 'snooze' },
          { label: 'Skip This Workflow', value: 'skip' }
        ],
        nextBranches: {
          'planning': 'planning',
          'snooze': 'snooze',
          'skip': 'skip'
        }
      },
      branches: {
        'planning': {
          response: "Excellent choice! Based on their growth trajectory, I recommend a multi-year expansion deal. Let me prepare an analysis for you.",
          buttons: [
            { label: 'Draft email', value: 'draft-email' },
            { label: 'Schedule meeting', value: 'schedule' },
            { label: 'View details', value: 'details' }
          ],
          nextBranches: {
            'draft-email': 'email-flow',
            'schedule': 'meeting-flow',
            'details': 'detail-view'
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
            { label: 'Yes', value: 'email-confirmation' },
            { label: 'Something Else', value: 'alternative-options' }
          ]
        },
        'email-confirmation': {
          response: "Perfect! I've created a comprehensive workflow summary with our progress, action items, and next steps for the Showcase Corp account.",
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
          response: "I'm here to help! Feel free to ask me anything about Showcase Corp's account, renewal strategy, or any other questions you might have. What would you like to know?"
        },
        'early-renewal': {
          response: "Great strategy! I'll create an early renewal offer with a 15% discount.",
          actions: ['showArtifact'],
          artifactId: 'renewal-offer'
        }
      },
      userTriggers: {
        ".*help.*": "help-flow",
        ".*renewal.*": "renewal",
        ".*expand.*|.*expansion.*": "expansion",
        ".*usage.*|.*analyze.*": "usage",
        ".*email.*|.*draft.*": "email-flow",
        ".*auto-followup.*": "email-complete",
        ".*something.*else.*": "free-chat"
      }
    },
    features: {
      attachments: true,
      voiceRecording: true,
      designMode: false,
      editMode: true,
      artifactsToggle: true
    }
  },
  artifacts: {
    sections: [
      {
        id: 'license-analysis',
        title: 'License Analysis',
        type: 'license-analysis',
        visible: false,
        content: {
          currentLicense: { tokens: 100000, unitPrice: 7.25, total: 725000 },
          anticipatedRenewal: { tokens: 150000, unitPrice: 7.25, total: 1087500 },
          earlyDiscount: { percentage: 15, total: 924375 },
          multiYearDiscount: { percentage: 25, total: 815625 }
        }
      },
      {
        id: 'email-draft',
        title: 'Email Composer',
        type: 'email',
        visible: false,
        editable: true,
        content: {
          to: 'michael.roberts@showcasecorp.com',
          subject: 'Showcase Corp - Expansion Opportunity & Strategic Renewal Discussion',
          body: `Hi Michael,

I hope this email finds you well! I've been reviewing Showcase Corp's impressive performance metrics, and I'm excited about the 65% growth you've achieved this year. Your expansion into APAC and the recent Series C funding announcement clearly demonstrate Showcase Corp's trajectory toward becoming a market leader.

Given your current usage patterns and the approaching renewal date, I'd love to discuss how we can support your continued growth with a strategic renewal package that aligns with your expansion goals.

I'm proposing a multi-year expansion deal that would:
• Provide capacity for your anticipated growth
• Include priority support for your APAC operations
• Offer significant cost savings through our enterprise pricing

Are you available for a brief call next week to explore how we can structure this to support Showcase Corp's continued success?

Best regards,
{{user.first}}

P.S. I've also prepared some usage analytics that I think you'll find valuable for your planning discussions.`
        }
      },
      {
        id: 'workflow-summary',
        title: 'Workflow Summary',
        type: 'workflow-summary',
        visible: false,
        content: {
          customerName: 'Showcase Corp',
          currentStage: 'Needs Assessment',
          progressPercentage: 50,
          completedActions: [
            'Initial customer contact established',
            'Growth analysis completed (65% YoY growth)',
            'Expansion opportunity identified',
            'Email drafted to Michael Roberts (CTO)'
          ],
          pendingActions: [
            'Schedule follow-up meeting with Michael Roberts',
            'Prepare detailed expansion proposal',
            'Coordinate with technical team for APAC support details',
            'Review Series C funding impact on pricing'
          ],
          nextSteps: [
            'Wait for response to initial email (2-3 days)',
            'Prepare comprehensive renewal package',
            'Schedule technical consultation for APAC expansion',
            'Draft multi-year contract terms'
          ],
          keyMetrics: {
            currentARR: '$725,000',
            projectedARR: '$1,087,500',
            growthRate: '65%',
            riskScore: '2.1/10',
            renewalDate: 'Feb 28, 2026'
          },
          recommendations: [
            'Prioritize multi-year deal to lock in growth',
            'Leverage APAC expansion for premium pricing',
            'Use Series C funding as negotiation point',
            'Offer priority support as differentiator'
          ]
        }
      }
    ]
  },
  sidePanel: {
    enabled: true,
    title: {
      text: "Customer Engagement Workflow",
      subtitle: "Showcase Corp Account",
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
    ],
    progressMeter: {
      currentStep: 2,
      totalSteps: 4,
      progressPercentage: 50,
      showPercentage: true,
      showStepNumbers: true
    },
    showProgressMeter: true,
    showSteps: true
  }
};