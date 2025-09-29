import { WorkflowConfig } from '../WorkflowConfig';

export const planningChecklistTestConfig: WorkflowConfig = {
  customer: {
    name: 'Test Corp',
    nextCustomer: 'Next Corp'
  },
  layout: {
    modalDimensions: { width: 80, height: 90, top: 10, left: 10 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: false
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$500,000',
        trend: 'up',
        trendValue: '+15%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$5.00',
        sublabel: '(average)',
        status: 'green',
        trend: 'Standard pricing'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Mar 15, 2026',
        sublabel: '90 days',
        status: 'orange'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'John Doe',
        role: 'CTO'
      },
      riskScore: {
        label: 'Risk Score',
        value: '3.0/10',
        status: 'green',
        sublabel: 'Low risk'
      },
      growthScore: {
        label: 'Growth Score',
        value: '8.0/10',
        status: 'green',
        sublabel: 'High growth'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+25%',
        status: 'green',
        sparkData: [3, 4, 5, 6, 7, 8, 9],
        sublabel: 'Annual'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+5%',
        status: 'green',
        sparkData: [7, 7, 8, 8, 9, 9, 10],
        sublabel: 'Growing'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'License Capacity',
      data: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      chartContextLabel: '↗ +15% growth',
      chartContextColor: 'text-green-600',
      dataColors: {
        threshold: 10,
        belowColor: 'bg-blue-500',
        aboveColor: 'bg-green-500'
      }
    },
    userLicenses: {
      title: 'User Licenses',
      showReferenceLine: true,
      referenceLineLabel: 'License Cost',
      data: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
      chartContextLabel: '↗ Steady growth',
      chartContextColor: 'text-purple-600',
      dataColors: { threshold: 20, belowColor: 'bg-purple-500', aboveColor: 'bg-green-500' }
    },
    renewalInsights: {
      renewalStage: 'Planning',
      confidence: 90,
      recommendedAction: 'Start Planning Process',
      keyReasons: [
        { category: 'Growth', detail: '25% YoY growth' },
        { category: 'Usage', detail: 'Consistent usage increase' },
        { category: 'Health', detail: 'Low risk score' },
        { category: 'Engagement', detail: 'Active customer contact' }
      ]
    }
  },
  chat: {
    placeholder: 'Ask a question or describe what you need help with...',
    aiGreeting: "I understand you're working on this task. How can I help you proceed?",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "I'm sorry, I didn't understand that. Could you try again or select one of the available options?",
      initialMessage: {
        text: "Hi! Test Corp's renewal is coming up on March 15th. Shall we start the planning process? It should take about 5 minutes.",
        buttons: [
          { label: 'Start Planning', value: 'planning' },
          { label: 'Not Now', value: 'snooze' },
          { label: 'Skip', value: 'skip' }
        ],
        nextBranches: {
          'planning': 'show-checklist',
          'snooze': 'snooze-branch',
          'skip': 'skip-branch'
        }
      },
      branches: {
        'show-checklist': {
          response: "Great! Let's review what we need to accomplish for the renewal planning:",
          actions: ['showArtifact', 'showMenu'],
          artifactId: 'planning-checklist',
          buttons: [
            { label: 'Let\'s Do It!', value: 'proceed' },
            { label: 'Not Yet', value: 'not-ready' },
            { label: 'Go Back', value: 'go-back' }
          ],
          nextBranches: {
            'proceed': 'proceed-branch',
            'not-ready': 'not-ready-branch',
            'go-back': 'initial'
          }
        },
        'proceed-branch': {
          response: "Excellent! Let's move forward with the renewal planning process.",
          buttons: [
            { label: 'Continue', value: 'continue' }
          ]
        },
        'not-ready-branch': {
          response: "No problem! Take your time to review the checklist. When you're ready, just let me know.",
          buttons: [
            { label: 'I\'m ready now', value: 'proceed' },
            { label: 'Go back', value: 'go-back' }
          ]
        },
        'snooze-branch': {
          response: "No problem! I'll remind you about this later.",
          buttons: [
            { label: 'Ok', value: 'ok' }
          ]
        },
        'skip-branch': {
          response: "Understood. I'll skip this workflow for now.",
          buttons: [
            { label: 'Ok', value: 'ok' }
          ]
        }
      }
    },
    features: {
      attachments: true,
      voiceRecording: true,
      designMode: true,
      editMode: true,
      artifactsToggle: true
    }
  },
  artifacts: {
    sections: [
      {
        id: 'planning-checklist',
        title: 'Renewal Planning Checklist',
        type: 'planning-checklist',
        visible: false,
        content: {
          description: "Let's review what we need to accomplish:",
          items: [
            { id: 'review-contract', label: 'Review the contract terms', completed: false },
            { id: 'set-target-price', label: 'Set our target price', completed: false },
            { id: 'establish-pricing', label: 'Establish our initial pricing strategy', completed: false },
            { id: 'confirm-contacts', label: 'Confirm our contacts', completed: false },
            { id: 'send-notice', label: 'Send out the renewal notice', completed: false }
          ],
          showActions: true
        }
      }
    ]
  }
};