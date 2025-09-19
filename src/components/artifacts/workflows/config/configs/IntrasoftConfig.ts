import { WorkflowConfig } from '../WorkflowConfig';

export const intrasoftConfig: WorkflowConfig = {
  customer: {
    name: 'Intrasoft Solutions',
    nextCustomer: 'TechFlow Inc'
  },
  layout: {
    modalDimensions: { width: 85, height: 75, top: 15, left: 5 },
    dividerPosition: 45,
    chatWidth: 60,
    splitModeDefault: false
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$1,250,000',
        trend: 'up',
        trendValue: '+28.3%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$12.50',
        sublabel: '(top 5% value)',
        status: 'green',
        trend: 'Premium customer'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Mar 15, 2025',
        sublabel: '45 days',
        status: 'red'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Michael Rodriguez',
        role: 'CTO'
      },
      riskScore: {
        label: 'Risk Score',
        value: '1.8/10',
        status: 'green',
        sublabel: 'Excellent health'
      },
      growthScore: {
        label: 'Growth Score',
        value: '9.2/10',
        status: 'green',
        sublabel: 'High expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+42.7%',
        status: 'green',
        sparkData: [2, 3, 4, 6, 8, 10, 12],
        sublabel: 'Accelerating'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+8.9%',
        status: 'green',
        sparkData: [5, 6, 6, 7, 7, 8, 9],
        sublabel: 'Growing'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'API Calls',
      showReferenceLine: true,
      referenceLineLabel: 'Current Tier Limit',
      data: [15, 18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125],
      upliftPercentage: 67,
      dataColors: { threshold: 18, belowColor: 'bg-blue-500', aboveColor: 'bg-green-500' }
    },
    userLicenses: {
      title: 'Active Users',
      showReferenceLine: false,
      referenceLineLabel: '',
      data: [45, 47, 48, 50, 52, 55, 58, 60, 62, 65, 68, 70, 72, 75, 78, 80, 82, 85, 88, 90],
      spikePercentage: 89,
      color: 'blue'
    },
    renewalInsights: {
      renewalStage: 'Negotiation',
      confidence: 92,
      recommendedAction: 'Multi-year Upsell',
      keyReasons: [
        { category: 'Usage', detail: '67% increase in API calls' },
        { category: 'Team Growth', detail: 'Added 15 developers this quarter' },
        { category: 'Budget', detail: 'Increased IT budget by 40%' },
        { category: 'Satisfaction', detail: 'NPS score of 9.2/10' }
      ]
    }
  },
  chat: {
    placeholder: 'Discuss Intrasoft upsell strategy...',
    aiGreeting: "Intrasoft is performing exceptionally well. Ready to discuss expansion?",
    conversationSeed: [
      {
        sender: 'ai',
        text: 'Intrasoft is our highest performing account this quarter. They\'ve exceeded usage limits and shown strong growth. I recommend a 3-year upsell with enterprise features. Shall we prepare the proposal?',
        type: 'buttons',
        buttons: [
          { label: 'Not Yet', value: 'no', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Yes, Prepare Proposal', value: 'yes', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      }
    ],
    features: {
      attachments: true,
      voiceRecording: false,
      designMode: true,
      editMode: true,
      artifactsToggle: true
    }
  },
  artifacts: {
    sections: [
      {
        id: 'upsell-analysis',
        title: 'Upsell Analysis',
        type: 'license-analysis',
        visible: true,
        content: {
          currentLicense: { tokens: 100000, unitPrice: 12.50, total: 1250000 },
          anticipatedRenewal: { tokens: 250000, unitPrice: 11.00, total: 2750000 },
          earlyDiscount: { percentage: 15, total: 2337500 },
          multiYearDiscount: { percentage: 25, total: 2062500 }
        }
      },
      {
        id: 'proposal-draft',
        title: 'Proposal Draft',
        type: 'email-draft',
        visible: true,
        content: {
          to: 'Michael Rodriguez',
          subject: 'Enterprise Upgrade Proposal - Intrasoft Solutions',
          priority: 'High',
          body: [
            "Dear Michael,",
            "Based on Intrasoft's exceptional growth and increased usage, I've prepared an enterprise upgrade proposal that will provide better value and support your expanding needs.",
            "The proposed 3-year enterprise plan includes premium support, advanced analytics, and a 25% discount on your current per-unit pricing.",
            "I'd love to schedule a call this week to discuss how this upgrade will support your continued success.",
            "Best regards,\nJustin"
          ]
        }
      }
    ]
  }
};