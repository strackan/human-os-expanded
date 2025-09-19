import { WorkflowConfig } from '../WorkflowConfig';

export const acmeCorpConfig: WorkflowConfig = {
  customer: {
    name: 'Acme Corp Inc.',
    nextCustomer: 'Intrasoft'
  },
  layout: {
    modalDimensions: { width: 80, height: 80, top: 10, left: 10 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: true
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$485,000',
        trend: 'up',
        trendValue: '+12.5%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$6.76',
        sublabel: '(88% value)',
        status: 'orange',
        trend: 'Pays less than 88% of customers'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Jan 18, 2026',
        sublabel: '125 days',
        status: 'orange'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Sarah Chen',
        role: 'VP Operations'
      },
      riskScore: {
        label: 'Risk Score',
        value: '3.2/10',
        status: 'green',
        sublabel: '2 open critical tickets'
      },
      growthScore: {
        label: 'Growth Score',
        value: '7.8/10',
        status: 'green',
        sublabel: 'Expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+18.2%',
        status: 'green',
        sparkData: [3, 4, 3, 5, 6, 7, 8],
        sublabel: 'Annual'
      },
      lastMonth: {
        label: 'Last Month',
        value: '-15.3%',
        status: 'red',
        sparkData: [8, 7, 6, 5, 4, 3, 2],
        sublabel: 'Declining'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'License Cost',
      referenceLineHeight: 15,
      data: [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 9, 11, 13, 15, 14, 16, 18, 20, 22, 21, 23, 25],
      chartContextLabel: '↗ +45% recent uplift',
      chartContextColor: 'text-green-600',
      chartMin: 0,
      chartMax: 30,
      dataColors: { threshold: 15, belowColor: 'bg-blue-500', aboveColor: 'bg-green-500' }
    },
    userLicenses: {
      title: 'User Licenses',
      showReferenceLine: true,
      referenceLineLabel: 'License Cost',
      referenceLineHeight: 20,
      data: [8, 9, 8, 9, 10, 9, 8, 9, 10, 9, 8, 9, 10, 11, 12, 20, 21, 22, 21, 20, 22, 21, 23, 22, 24, 23, 25, 24, 26, 25, 27, 26, 28, 27, 29, 28, 30, 29, 31, 30],
      chartContextLabel: '↗ +120% license spike',
      chartContextColor: 'text-purple-600',
      chartMin: 0,
      chartMax: 35,
      dataColors: { threshold: 15, belowColor: 'bg-purple-500', aboveColor: 'bg-green-500' }
    },
    renewalInsights: {
      renewalStage: 'Planning',
      confidence: 85,
      recommendedAction: 'Early Renewal Outreach',
      keyReasons: [
        { category: 'Adoption', detail: '45% recent usage increase' },
        { category: 'Company Growth', detail: 'Employees ↗ 12% (LinkedIn)' },
        { category: 'News', detail: 'Strong recent earnings report' },
        { category: 'Sentiment', detail: 'Strong executive engagement in Q3' }
      ]
    }
  },
  chat: {
    placeholder: 'Ask about Acme Corp renewal strategy...',
    aiGreeting: "I understand you're working on Acme Corp's renewal. How can I help?",
    conversationSeed: [
      {
        sender: 'ai',
        text: 'Hi, Justin! It appears AcmeCorp\'s usage has increased significantly over the past 4 weeks. Reaching out proactively to engaged customers can increase renewal rates and likelihood of multi-year extensions. Because their renewal is over 120 days away, I recommend an Early Outreach strategy. Shall we proceed, snooze for now, or skip?',
        type: 'buttons',
        buttons: [
          { label: 'Skip', value: 'skip', 'label-background': '#ef4444', 'label-text': '#ffffff' },
          { label: 'Snooze', value: 'snooze', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Proceed', value: 'proceed', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Proceed'
      },
      {
        sender: 'ai',
        text: 'Great. Let\'s get started. Last year, this customer paid $485,000 for 100,000 tokens. This year their usage is projected to be 240,000 tokens, which would generate renewal license fees at $1,164,000. I recommend sending an initial email bringing this to the customer\'s attention. Shall I draft one for you?',
        type: 'buttons',
        buttons: [
          { label: 'No', value: 'no', 'label-background': '#ef4444', 'label-text': '#ffffff' },
          { label: 'Yes', value: 'yes', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      }
    ],
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
        id: 'license-analysis',
        title: 'License Analysis',
        type: 'license-analysis',
        visible: true,
        content: {
          currentLicense: { tokens: 100000, unitPrice: 4.85, total: 485000 },
          anticipatedRenewal: { tokens: 170000, unitPrice: 4.85, total: 824500 },
          earlyDiscount: { percentage: 10, total: 742050 },
          multiYearDiscount: { percentage: 22, total: 643110 }
        }
      }
    ]
  }
};