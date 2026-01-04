import { WorkflowConfig, WorkflowSlide } from '../WorkflowConfig';

// EXACT clone of dynamicChatAI - this should work identically
export const dynamicClone: WorkflowConfig = {
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
        text: "Welcome to the **Planning Checklist Demo**! 🎯\n\nThis demo showcases how our planning checklist artifact helps CSMs organize and track renewal workflows. Showcase Corp has 75 days until renewal with strong growth metrics.\n\nWhat would you like to explore?",
        buttons: [
          { label: 'Start renewal planning', value: 'start-planning', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
          { label: 'View checklist features', value: 'features-tour', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
        ],
        nextBranches: {
          'start-planning': 'show-renewal-checklist',
          'features-tour': 'features-explanation'
        }
      },
      branches: {
        'show-renewal-checklist': {
          response: "Perfect! Here's our **Renewal Planning Checklist** for Showcase Corp. Notice how it breaks down the renewal process into manageable, trackable steps with a visual progress indicator.",
          delay: 1,
          actions: ['showArtifact'],
          artifactId: 'renewal-planning-checklist',
          buttons: [
            { label: 'Check off some items', value: 'interact-checklist', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Complete this demo', value: 'complete-workflow', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
          ],
          nextBranches: {
            'interact-checklist': 'checklist-interaction',
            'complete-workflow': 'workflow-complete'
          }
        },
        'checklist-interaction': {
          response: "Excellent! You can see how the progress bar updates in real-time as you check off items. The artifact tracks completion status and provides visual feedback. This helps CSMs stay organized and ensures nothing falls through the cracks.",
          delay: 1,
          buttons: [
            { label: 'Complete this demo', value: 'complete-workflow', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'complete-workflow': 'workflow-complete'
          }
        },
        'features-explanation': {
          response: "**Key Planning Checklist Features:**\n\n✅ **Interactive Progress Tracking** - Visual progress bar updates in real-time\n✅ **Customizable Templates** - Pre-built templates for common workflows\n✅ **Action Buttons** - Integrated workflow actions (Let's Do It!, Not Yet, Go Back)\n✅ **State Management** - Persistent completion tracking\n✅ **Visual Feedback** - Strikethrough completed items, color-coded status\n\nReady to see these in action?",
          delay: 1,
          buttons: [
            { label: 'Show renewal checklist', value: 'show-renewal-checklist', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'show-renewal-checklist': 'show-renewal-checklist'
          }
        },
        'workflow-complete': {
          response: "🎉 **Demo Complete!** \n\nYou've seen how the Planning Checklist artifact helps organize and track workflows with:\n\n• Interactive progress tracking\n• Real-time visual feedback\n• Customizable action items\n• State management\n\nThis artifact is excellent for keeping renewal processes organized and ensuring nothing gets missed!",
          delay: 1,
          buttons: [
            { label: 'Restart demo', value: 'restart', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ]
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
        id: 'renewal-planning-checklist',
        title: 'Renewal Planning Checklist',
        type: 'planning-checklist',
        visible: false,
        content: {
          description: "Let's systematically prepare for Showcase Corp's renewal:",
          items: [
            { id: 'review-contract', label: 'Review current contract terms and conditions', completed: false },
            { id: 'analyze-usage', label: 'Analyze usage patterns and growth trends', completed: false },
            { id: 'set-target-price', label: 'Set renewal target price and expansion opportunities', completed: false },
            { id: 'confirm-contacts', label: 'Confirm decision makers and influencers', completed: false },
            { id: 'prepare-materials', label: 'Prepare renewal presentation materials', completed: false },
            { id: 'schedule-kickoff', label: 'Schedule renewal kickoff meeting', completed: false },
            { id: 'send-notice', label: 'Send formal renewal notice with timeline', completed: false }
          ],
          showActions: true
        }
      },
      {
        id: 'email-draft',
        title: 'Email Composer',
        type: 'email',
        visible: false,
        editable: true,
        content: {
          to: 'michael.roberts@dynamiccorp.com',
          subject: 'Dynamic Corp - Expansion Opportunity & Strategic Renewal Discussion',
          body: `Hi Michael,

I hope this email finds you well! I've been reviewing Dynamic Corp's impressive performance metrics, and I'm excited about the 65% growth you've achieved this year. Your expansion into APAC and the recent Series C funding announcement clearly demonstrate Dynamic Corp's trajectory toward becoming a market leader.

Given your current usage patterns and the approaching renewal date, I'd love to discuss how we can support your continued growth with a strategic renewal package that aligns with your expansion goals.

I'm proposing a multi-year expansion deal that would:
• Provide capacity for your anticipated growth
• Include priority support for your APAC operations
• Offer significant cost savings through our enterprise pricing

Are you available for a brief call next week to explore how we can structure this to support Dynamic Corp's continued success?

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
          customerName: 'Dynamic Corp',
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
      text: "Planning Checklist Demo",
      subtitle: "Showcase Corp Account",
      icon: "✅"
    },
    steps: [
      {
        id: "demo-intro",
        title: "Demo Introduction",
        description: "Overview of planning checklist features",
        status: "completed",
        workflowBranch: "initial",
        icon: "👋"
      },
      {
        id: "explore-checklist",
        title: "Explore Checklist",
        description: "Review checklist templates and features",
        status: "in-progress",
        workflowBranch: "show-renewal-checklist",
        icon: "📋"
      },
      {
        id: "interactive-demo",
        title: "Interactive Demo",
        description: "Try checking off items and see progress tracking",
        status: "pending",
        workflowBranch: "checklist-interaction",
        icon: "✅"
      },
      {
        id: "demo-complete",
        title: "Demo Complete",
        description: "Review what was learned",
        status: "pending",
        workflowBranch: "workflow-complete",
        icon: "🎉"
      }
    ],
    progressMeter: {
      currentStep: 1,
      totalSteps: 4,
      progressPercentage: 25,
      showPercentage: true,
      showStepNumbers: true
    },
    showProgressMeter: true,
    showSteps: true
  }
};