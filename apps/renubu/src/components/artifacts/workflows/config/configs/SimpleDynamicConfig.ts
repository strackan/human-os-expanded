import { WorkflowConfig } from '../WorkflowConfig';

export const simpleDynamicConfig: WorkflowConfig = {
  customer: {
    name: 'Dynamic Test Corp'
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
        value: '$500,000',
        trend: 'up',
        trendValue: '+15%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$7.50',
        status: 'green'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Feb 28, 2026',
        sublabel: '90 days',
        status: 'green'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Test User',
        role: 'CTO'
      },
      riskScore: {
        label: 'Risk Score',
        value: '2.0/10',
        status: 'green'
      },
      growthScore: {
        label: 'Growth Score',
        value: '8.0/10',
        status: 'green'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+25%',
        status: 'green'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+10%',
        status: 'green'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'License Limit',
      referenceLineHeight: 20,
      data: [10, 12, 14, 16, 18, 20, 22, 24],
      chartContextLabel: 'Growing steadily',
      chartContextColor: 'text-green-600',
      dataColors: { threshold: 20, belowColor: 'bg-blue-500', aboveColor: 'bg-green-500' }
    },
    userLicenses: {
      title: 'User Licenses',
      showReferenceLine: true,
      referenceLineLabel: 'Current Plan',
      referenceLineHeight: 25,
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
      startsWith: 'ai',
      defaultMessage: "I didn't understand that. Please try again.",
      initialMessage: {
        text: "Hello! I can help with your account. What would you like to do?",
        buttons: [
          { label: 'View Analysis', value: 'analysis' },
          { label: 'Draft Email', value: 'email' },
          { label: 'Compose Email', value: 'compose-email' }
        ]
      },
      branches: {
        'analysis': {
          response: "I'll show you the account analysis.",
          actions: ['launch-artifact'],
          artifactId: 'license-analysis'
        },
        'email': {
          response: "I'll draft an email for you.",
          actions: ['launch-artifact'],
          artifactId: 'email-draft'
        },
        'compose-email': {
          response: "I'll open the email composer for you.",
          actions: ['launch-artifact'],
          artifactId: 'email-composer'
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
        id: 'license-analysis',
        title: 'License Analysis',
        type: 'license-analysis',
        visible: false,
        content: {
          currentLicense: { tokens: 50000, unitPrice: 5.0, total: 250000 },
          anticipatedRenewal: { tokens: 75000, unitPrice: 5.0, total: 375000 },
          earlyDiscount: { percentage: 10, total: 337500 },
          multiYearDiscount: { percentage: 20, total: 300000 }
        }
      },
      {
        id: 'email-draft',
        title: 'Draft Email',
        type: 'email-draft',
        visible: false,
        content: {
          to: 'Test User',
          subject: 'Account Review',
          priority: 'Normal',
          body: ['Hello!', 'This is a test email.', 'Best regards']
        }
      },
      {
        id: 'email-composer',
        title: 'Email Composer',
        type: 'email',
        visible: false,
        editable: true,
        content: {
          to: 'eric.estrada@techflowindustries.com',
          subject: 'TechFlow Industries - Renewal Planning & Important Updates',
          body: `Hi Eric,

I hope this email finds you well. I wanted to reach out regarding your upcoming renewal date of April 1st for TechFlow Industries. As we approach this important milestone, I'd like to discuss some updates and coordinate our planning for the upcoming period.

I'm pleased to inform you that we've implemented several enhancements to our platform that I believe will bring significant value to your team. However, I also need to let you know about a 3% price increase that will take effect with your renewal, bringing your annual investment from $12,500 to $12,875. This adjustment reflects our continued commitment to enhancing the platform's capabilities and ensuring the highest level of service.

Given your executive engagement and leadership at TechFlow, I'd love to schedule a renewal planning discussion to review these updates, address any questions you may have, and explore opportunities for maximizing your team's success with our platform.

Best regards,
Justin`
        }
      }
    ]
  },
  sidePanel: {
    enabled: true,
    title: {
      text: "TechFlow Industries Engagement",
      subtitle: "Renewal Planning Workflow",
      icon: "🏢"
    },
    steps: [
      {
        id: "analysis",
        title: "License Analysis",
        description: "Review current usage and identify opportunities",
        status: "completed",
        workflowBranch: "analysis",
        icon: "📊"
      },
      {
        id: "email-compose",
        title: "Email Composition",
        description: "Draft renewal communication",
        status: "in-progress",
        workflowBranch: "compose-email",
        icon: "✉️"
      }
    ],
    progressMeter: {
      currentStep: 2,
      totalSteps: 2,
      progressPercentage: 100,
      showPercentage: true,
      showStepNumbers: true
    },
    showProgressMeter: true,
    showSteps: true
  }
};