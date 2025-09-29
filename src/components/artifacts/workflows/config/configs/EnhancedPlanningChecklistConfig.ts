import { WorkflowConfig } from '../WorkflowConfig';

export const enhancedPlanningChecklistConfig: WorkflowConfig = {
  customer: {
    name: 'TechFlow Solutions',
    nextCustomer: 'Innovation Labs'
  },
  layout: {
    modalDimensions: { width: 85, height: 92, top: 4, left: 7.5 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: false
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$1,250,000',
        trend: 'up',
        trendValue: '+28%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$12.50',
        sublabel: '(premium tier)',
        status: 'green',
        trend: 'Above market rate'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Apr 15, 2025',
        sublabel: '60 days',
        status: 'orange'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Alex Chen',
        role: 'Chief Technology Officer'
      },
      riskScore: {
        label: 'Risk Score',
        value: '1.8/10',
        status: 'green',
        sublabel: 'Very low risk'
      },
      growthScore: {
        label: 'Growth Score',
        value: '9.5/10',
        status: 'green',
        sublabel: 'Exceptional growth'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+42%',
        status: 'green',
        sparkData: [5, 6, 7, 8, 9, 10, 11],
        sublabel: 'Accelerating'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+12%',
        status: 'green',
        sparkData: [9, 9, 10, 10, 11, 11, 12],
        sublabel: 'Strong momentum'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'License Capacity',
      data: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
      chartContextLabel: '↗ +28% growth',
      chartContextColor: 'text-green-600',
      dataColors: {
        threshold: 14,
        belowColor: 'bg-blue-500',
        aboveColor: 'bg-green-500'
      }
    },
    userLicenses: {
      title: 'User Licenses',
      showReferenceLine: true,
      referenceLineLabel: 'License Cost',
      data: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
      chartContextLabel: '↗ Robust expansion',
      chartContextColor: 'text-purple-600',
      dataColors: { threshold: 25, belowColor: 'bg-purple-500', aboveColor: 'bg-green-500' }
    },
    renewalInsights: {
      renewalStage: 'Enhanced Planning',
      confidence: 98,
      recommendedAction: 'Execute Renewal Strategy',
      keyReasons: [
        { category: 'Growth', detail: '42% YoY growth with acceleration' },
        { category: 'Usage', detail: 'Exceptional platform utilization' },
        { category: 'Health', detail: 'Outstanding customer health metrics' },
        { category: 'Engagement', detail: 'Strong executive sponsorship' }
      ]
    }
  },
  chat: {
    placeholder: 'Ask a question or describe what you need help with...',
    aiGreeting: "Welcome to the enhanced planning experience! Let's create a comprehensive renewal strategy for TechFlow Solutions.",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "I'm sorry, I didn't understand that. Could you try again or select one of the available options?",
      initialMessage: {
        text: "TechFlow Solutions is showing exceptional growth with 42% YoY increase and outstanding engagement metrics. This is a perfect opportunity for strategic expansion! Ready to create a comprehensive renewal plan? 🚀",
        buttons: [
          { label: 'Start Enhanced Planning', value: 'enhanced-planning' },
          { label: 'Review Metrics First', value: 'review-metrics' },
          { label: 'Quick Planning', value: 'quick-planning' }
        ],
        nextBranches: {
          'enhanced-planning': 'show-enhanced-checklist',
          'review-metrics': 'metrics-review',
          'quick-planning': 'basic-planning'
        }
      },
      branches: {
        'show-enhanced-checklist': {
          response: "Excellent! Here's your enhanced planning checklist with chapter navigation. Click on any item to jump to that section of the renewal process:",
          actions: ['showArtifact'],
          artifactId: 'enhanced-planning-checklist',
          buttons: [
            { label: 'Begin Chapter 1', value: 'chapter-1' },
            { label: 'Overview All Chapters', value: 'chapter-overview' },
            { label: 'Skip to Contract Review', value: 'chapter-3' }
          ],
          nextBranches: {
            'chapter-1': 'chapter-1-branch',
            'chapter-overview': 'overview-branch',
            'chapter-3': 'chapter-3-branch'
          }
        },
        'chapter-1-branch': {
          response: "📊 Chapter 1: Customer Analysis & Growth Assessment\n\nLet's start by analyzing TechFlow's impressive growth trajectory and current usage patterns. This will help us understand their expansion needs and renewal potential.",
          buttons: [
            { label: 'Analyze Growth Metrics', value: 'analyze-growth' },
            { label: 'Next Chapter', value: 'chapter-2' },
            { label: 'Back to Checklist', value: 'show-enhanced-checklist' }
          ]
        },
        'chapter-3-branch': {
          response: "📋 Chapter 3: Contract Terms & Legal Review\n\nJumping to contract analysis! We'll review current terms, identify opportunities for improvement, and prepare for legal review.",
          buttons: [
            { label: 'Review Contract Terms', value: 'contract-terms' },
            { label: 'Previous Chapter', value: 'chapter-2' },
            { label: 'Back to Checklist', value: 'show-enhanced-checklist' }
          ]
        },
        'overview-branch': {
          response: "📋 Complete Planning Overview:\n\n• Chapter 1: Customer Analysis & Growth Assessment\n• Chapter 2: Pricing Strategy & Market Positioning\n• Chapter 3: Contract Terms & Legal Review\n• Chapter 4: Stakeholder Engagement Strategy\n• Chapter 5: Timeline & Milestone Planning\n• Chapter 6: Risk Assessment & Mitigation\n\nEach chapter builds on the previous one to create a comprehensive renewal strategy.",
          buttons: [
            { label: 'Start Chapter 1', value: 'chapter-1' },
            { label: 'View Checklist', value: 'show-enhanced-checklist' }
          ]
        },
        'metrics-review': {
          response: "Let's review TechFlow's outstanding performance metrics before diving into planning.",
          buttons: [
            { label: 'Start Planning', value: 'enhanced-planning' },
            { label: 'Deep Dive Analytics', value: 'analytics' }
          ]
        },
        'basic-planning': {
          response: "Sure! We can use the streamlined planning approach for this high-confidence renewal.",
          buttons: [
            { label: 'Show Basic Checklist', value: 'basic-checklist' },
            { label: 'Switch to Enhanced', value: 'enhanced-planning' }
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
        id: 'enhanced-planning-checklist',
        title: 'Enhanced Renewal Planning Checklist',
        type: 'planning-checklist-enhanced',
        visible: false,
        content: {
          title: "Let's create a comprehensive renewal strategy:",
          subtitle: "Click any item to navigate to that chapter of the planning process",
          enableAnimations: true,
          theme: 'professional',
          showActions: true,
          items: [
            {
              id: 'customer-analysis',
              label: 'Customer Analysis & Growth Assessment',
              completed: false,
              chapterNumber: 1,
              icon: '📊',
              description: 'Analyze growth metrics, usage patterns, and expansion potential'
            },
            {
              id: 'pricing-strategy',
              label: 'Pricing Strategy & Market Positioning',
              completed: false,
              chapterNumber: 2,
              icon: '💰',
              description: 'Develop competitive pricing strategy based on value and market data'
            },
            {
              id: 'contract-review',
              label: 'Contract Terms & Legal Review',
              completed: false,
              chapterNumber: 3,
              icon: '📋',
              description: 'Review contract terms and identify improvement opportunities'
            },
            {
              id: 'stakeholder-engagement',
              label: 'Stakeholder Engagement Strategy',
              completed: false,
              chapterNumber: 4,
              icon: '🤝',
              description: 'Map key stakeholders and plan engagement approach'
            },
            {
              id: 'timeline-planning',
              label: 'Timeline & Milestone Planning',
              completed: false,
              chapterNumber: 5,
              icon: '📅',
              description: 'Create detailed timeline with key milestones and deadlines'
            },
            {
              id: 'risk-assessment',
              label: 'Risk Assessment & Mitigation',
              completed: false,
              chapterNumber: 6,
              icon: '⚠️',
              description: 'Identify potential risks and develop mitigation strategies'
            }
          ]
        }
      }
    ]
  },
  sidePanel: {
    enabled: true,
    title: {
      text: "Enhanced Renewal Planning",
      subtitle: "TechFlow Solutions Account",
      icon: "🚀"
    },
    steps: [
      {
        id: "customer-analysis",
        title: "Customer Analysis",
        description: "Growth assessment and usage patterns",
        status: "pending",
        workflowBranch: "chapter-1",
        icon: "📊"
      },
      {
        id: "pricing-strategy",
        title: "Pricing Strategy",
        description: "Market positioning and value-based pricing",
        status: "pending",
        workflowBranch: "chapter-2",
        icon: "💰"
      },
      {
        id: "contract-review",
        title: "Contract Review",
        description: "Terms analysis and legal preparation",
        status: "pending",
        workflowBranch: "chapter-3",
        icon: "📋"
      },
      {
        id: "stakeholder-engagement",
        title: "Stakeholder Strategy",
        description: "Engagement planning and communication",
        status: "pending",
        workflowBranch: "chapter-4",
        icon: "🤝"
      },
      {
        id: "timeline-planning",
        title: "Timeline Planning",
        description: "Milestones and deadline management",
        status: "pending",
        workflowBranch: "chapter-5",
        icon: "📅"
      },
      {
        id: "risk-assessment",
        title: "Risk Assessment",
        description: "Risk identification and mitigation",
        status: "pending",
        workflowBranch: "chapter-6",
        icon: "⚠️"
      }
    ],
    progressMeter: {
      currentStep: 0,
      totalSteps: 6,
      progressPercentage: 0,
      showPercentage: true,
      showStepNumbers: true
    },
    showProgressMeter: true,
    showSteps: true
  }
};