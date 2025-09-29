import { WorkflowConfig } from '../WorkflowConfig';

export const testDynamicConfig: WorkflowConfig = {
  customer: {
    name: 'Test Corp'
  },
  layout: {
    modalDimensions: { width: 80, height: 90, top: 10, left: 10 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: true
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$500,000'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$7.50'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Feb 28, 2026'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Test User'
      },
      riskScore: {
        label: 'Risk Score',
        value: '2.0/10'
      },
      growthScore: {
        label: 'Growth Score',
        value: '8.0/10'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+25%'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+10%'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'License Limit',
      data: [10, 12, 14, 16, 18, 20, 22, 24],
      chartContextLabel: 'Growing steadily',
      chartContextColor: 'text-green-600',
      dataColors: { threshold: 20, belowColor: 'bg-blue-500', aboveColor: 'bg-green-500' }
    },
    userLicenses: {
      title: 'User Licenses',
      showReferenceLine: true,
      referenceLineLabel: 'Current Plan',
      data: [20, 21, 22, 23, 24, 25],
      chartContextLabel: 'At capacity',
      chartContextColor: 'text-orange-600',
      dataColors: { threshold: 25, belowColor: 'bg-blue-500', aboveColor: 'bg-orange-500' }
    },
    renewalInsights: {
      renewalStage: 'Planning',
      confidence: 85,
      recommendedAction: 'Expansion Offer',
      keyReasons: [
        { category: 'Growth', detail: 'Consistent usage increase' }
      ]
    }
  },
  chat: {
    placeholder: 'Type your message...',
    aiGreeting: "How can I help you today?",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'user',
      defaultMessage: "I didn't understand that. You can type 'help' for options.",
      branches: {
        'help-flow': {
          response: "I can help with account management. What would you like to know?"
        }
      },
      userTriggers: {
        "help": "help-flow",
        ".*help.*": "help-flow"
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
    sections: []
  }
};