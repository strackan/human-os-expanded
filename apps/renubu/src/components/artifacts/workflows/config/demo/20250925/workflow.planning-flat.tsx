import { WorkflowConfig, WorkflowSlide } from '../../WorkflowConfig';

// Demo Workflow #1: Planning Flat - TRULY MINIMAL VERSION
// Just one simple slide to test the basics

export const planningFlatSlides: WorkflowSlide[] = [
  {
    id: 'slide-1',
    slideNumber: 1,
    title: 'Slide 1',
    description: 'First slide test',
    label: 'Test Step',
    stepMapping: 'slide-1',
    chat: {
      initialMessage: {
        text: "Hello! This is slide 1. Click a button:",
        buttons: [
          { label: 'Button A', value: 'button-a' },
          { label: 'Button B', value: 'button-b' }
        ]
      },
      branches: {
        'button-a': {
          response: "You clicked Button A!"
        },
        'button-b': {
          response: "You clicked Button B!"
        }
      },
      userTriggers: {},
      defaultMessage: "Please click a button above."
    },
    artifacts: {
      sections: []
    },
    sidePanel: {
      enabled: true,
      title: {
        text: "Test Workflow",
        subtitle: "Slide 1",
        icon: "📋"
      },
      steps: [
        {
          id: "step-1",
          title: "Step 1",
          description: "First step",
          status: "in-progress",
          workflowBranch: "step-1",
          icon: "📞"
        }
      ]
    },
    onComplete: {
      nextSlide: 2,
      updateProgress: true
    }
  }
];

export const planningFlatWorkflow: WorkflowConfig = {
  customer: {
    name: 'Test Customer',
    nextCustomer: 'Next Customer'
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
        value: '$100,000',
        trend: 'up',
        trendValue: '+10%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$5.00',
        status: 'green'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Dec 31, 2025',
        status: 'green'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'John Doe',
        role: 'CEO'
      },
      riskScore: {
        label: 'Risk Score',
        value: '1/10',
        status: 'green'
      },
      growthScore: {
        label: 'Growth Score',
        value: '8/10',
        status: 'green'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+10%',
        status: 'green'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+5%',
        status: 'green'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: false,
      referenceLineLabel: 'Test Line',
      data: [1, 2, 3, 4, 5],
      chartContextLabel: 'Test data',
      chartContextColor: 'text-blue-600',
      chartMin: 0,
      chartMax: 10,
      dataColors: { threshold: 5, belowColor: 'bg-blue-500', aboveColor: 'bg-green-500' }
    },
    userLicenses: {
      title: 'User Licenses',
      showReferenceLine: false,
      referenceLineLabel: 'Test Line',
      data: [1, 2, 3, 4, 5],
      chartContextLabel: 'Test data',
      chartContextColor: 'text-blue-600',
      chartMin: 0,
      chartMax: 10,
      dataColors: { threshold: 5, belowColor: 'bg-blue-500', aboveColor: 'bg-green-500' }
    },
    renewalInsights: {
      renewalStage: 'Planning',
      confidence: 80,
      recommendedAction: 'Test Action',
      keyReasons: [
        { category: 'Test', detail: 'Test reason' }
      ]
    }
  },
  chat: {
    placeholder: 'Type here...',
    aiGreeting: "Hello!",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "Please click a button above.",
      initialMessage: {
        text: "Hello! This is slide 1. Click a button:",
        buttons: [
          { label: 'Button A', value: 'button-a' },
          { label: 'Button B', value: 'button-b' }
        ]
      },
      branches: {
        'button-a': {
          response: "You clicked Button A!"
        },
        'button-b': {
          response: "You clicked Button B!"
        }
      },
      userTriggers: {}
    },
    features: {
      attachments: false,
      voiceRecording: false,
      designMode: false,
      editMode: false,
      artifactsToggle: false
    }
  },
  artifacts: {
    sections: []
  },
  sidePanel: {
    enabled: true,
    title: {
      text: "Test Workflow",
      subtitle: "Slide 1",
      icon: "📋"
    },
    steps: [
      {
        id: "step-1",
        title: "Step 1",
        description: "First step",
        status: "in-progress",
        workflowBranch: "step-1",
        icon: "📞"
      }
    ],
    progressMeter: {
      currentStep: 1,
      totalSteps: 1,
      progressPercentage: 100,
      showPercentage: true,
      showStepNumbers: true
    },
    showProgressMeter: true,
    showSteps: true
  },
  slides: planningFlatSlides
};