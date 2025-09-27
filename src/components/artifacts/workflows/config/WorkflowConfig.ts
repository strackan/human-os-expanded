export interface CustomerMetric {
  label: string;
  value: string | number;
  trend?: string;
  trendValue?: string;
  status?: 'green' | 'orange' | 'red';
  sublabel?: string;
  sparkData?: number[];
}

// Support for template variables in metrics
export type CustomerMetricOrTemplate = CustomerMetric | string;

export interface AnalyticsConfig {
  usageTrend: {
    title: string;
    showReferenceLine: boolean;
    referenceLineLabel: string;
    referenceLineHeight?: number; // Height value in same scale as data (e.g., 15 for where data value would be 15)
    data: number[];
    chartMin?: number; // Minimum value for chart scale (default: 0)
    chartMax?: number; // Maximum value for chart scale (default: max of data)
    chartContextLabel: string; // Custom label like "↗ +45% recent uplift" or "Stable usage"
    chartContextColor: string; // Color class like "text-green-500" or "text-orange-600"
    dataColors: { threshold: number; belowColor: string; aboveColor: string };
  };
  userLicenses: {
    title: string;
    showReferenceLine: boolean;
    referenceLineLabel: string;
    referenceLineHeight?: number; // Height value in same scale as data
    data: number[];
    chartMin?: number; // Minimum value for chart scale (default: 0)
    chartMax?: number; // Maximum value for chart scale (default: max of data)
    chartContextLabel: string; // Custom label like "↗ +120% spike" or "Gradual increase"
    chartContextColor: string; // Color class like "text-purple-500"
    dataColors: { threshold: number; belowColor: string; aboveColor: string };
  };
  renewalInsights: {
    renewalStage: string;
    confidence: number;
    recommendedAction: string;
    keyReasons: Array<{
      category: string;
      detail: string;
    }>;
  };
}

// Support for template variables in analytics
export type AnalyticsConfigOrTemplate = {
  usageTrend: AnalyticsConfig['usageTrend'] | string;
  userLicenses: AnalyticsConfig['userLicenses'] | string;
  renewalInsights: AnalyticsConfig['renewalInsights'];
};

export interface DynamicChatButton {
  label: string;
  value: string;
  'label-background'?: string;
  'label-text'?: string;
}

export interface DynamicChatBranch {
  response: string;
  defaultMessage?: string;
  delay?: number; // Delay in seconds before showing the response
  predelay?: number; // Delay in seconds before this branch can be triggered
  actions?: Array<'launch-artifact' | 'showArtifact' | 'removeArtifact' | 'show-buttons' | 'hide-buttons' | 'clear-chat' | 'nextChat' | 'exitTaskMode' | 'nextCustomer' | 'resetChat' | 'resetToInitialState' | 'showFinalSlide'>;
  artifactId?: string;
  buttons?: DynamicChatButton[];
  nextBranches?: {
    [userResponse: string]: string;
  };
}

export interface DynamicChatFlow {
  startsWith: 'ai' | 'user';
  defaultMessage?: string;
  initialMessage?: {
    text: string;
    buttons?: DynamicChatButton[];
    nextBranches?: {
      [userResponse: string]: string;
    };
  };
  userTriggers?: {
    [pattern: string]: string;
  };
  branches: {
    [branchName: string]: DynamicChatBranch | { subflow: string; parameters?: { [key: string]: any } };
  };
}

export interface WorkflowSlide {
  id: string;
  slideNumber: number;
  title: string;
  description: string;
  label: string; // Human-readable label for progress steps (e.g., "Initial Contact", "Needs Assessment")
  stepMapping: string; // Maps to sidePanel step ID
  chat: {
    initialMessage?: {
      text: string;
      buttons?: DynamicChatButton[];
      nextBranches?: {
        [userResponse: string]: string;
      };
    };
    branches: {
      [branchName: string]: DynamicChatBranch;
    };
    userTriggers?: {
      [pattern: string]: string;
    };
    defaultMessage?: string;
  };
  artifacts: {
    sections: Array<{
      id: string;
      title: string;
      type: 'license-analysis' | 'email-draft' | 'email' | 'html' | 'custom' | 'workflow-summary';
      visible: boolean;
      editable?: boolean;
      content?: any;
      htmlContent?: string;
      styles?: string;
    }>;
  };
  sidePanel?: {
    enabled: boolean;
    title: {
      text: string;
      subtitle: string;
      icon: string;
    };
    steps: Array<{
      id: string;
      title: string;
      description: string;
      status: 'pending' | 'in-progress' | 'completed';
      workflowBranch: string;
      icon: string;
    }>;
  };
  onComplete?: {
    nextSlide?: number;
    actions?: string[];
    updateProgress?: boolean;
  };
}

export interface ChatConfig {
  placeholder: string;
  aiGreeting: string;
  mode?: 'preload' | 'dynamic';
  conversationSeed?: Array<{
    sender?: 'ai' | 'user';
    text: string;
    type?: 'text' | 'buttons';
    buttons?: Array<{
      label: string;
      value: string;
      'label-background'?: string;
      'label-text'?: string;
    }>;
    timestamp?: string | Date;
  }>;
  dynamicFlow?: DynamicChatFlow;
  features: {
    attachments: boolean;
    voiceRecording: boolean;
    designMode: boolean;
    editMode: boolean;
    artifactsToggle: boolean;
  };
}

export interface ArtifactsConfig {
  sections: Array<{
    id: string;
    title: string;
    type: 'license-analysis' | 'email-draft' | 'email' | 'html' | 'custom' | 'workflow-summary';
    visible: boolean;
    editable?: boolean;
    content?: any;
    htmlContent?: string;
    styles?: string;
  }>;
}

export interface CustomerOverviewConfig {
  metrics: {
    arr: CustomerMetric;
    licenseUnitPrice: CustomerMetric;
    renewalDate: CustomerMetric;
    primaryContact: CustomerMetric & { role?: string };
    riskScore: CustomerMetric;
    growthScore: CustomerMetric;
    yoyGrowth: CustomerMetricOrTemplate;
    lastMonth: CustomerMetricOrTemplate;
  };
}

export interface SidePanelStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  workflowBranch?: string; // Maps to a workflow branch for step progression
  icon?: string; // Optional icon identifier
}

export interface SidePanelProgressMeter {
  currentStep: number;
  totalSteps: number;
  progressPercentage: number;
  showPercentage?: boolean;
  showStepNumbers?: boolean;
}

export interface SidePanelConfig {
  enabled: boolean;
  title: {
    text: string;
    subtitle?: string;
    icon?: string;
  };
  steps: SidePanelStep[];
  progressMeter: SidePanelProgressMeter;
  showProgressMeter?: boolean;
  showSteps?: boolean;
}

export interface WorkflowConfig {
  customer: {
    name: string;
    nextCustomer?: string;
  };
  layout: {
    modalDimensions: {
      width: number;
      height: number;
      top: number;
      left: number;
    };
    dividerPosition: number;
    chatWidth: number;
    splitModeDefault: boolean;
    statsHeight?: number; // Percentage of height for stats section (default: 45.3)
  };
  customerOverview: CustomerOverviewConfig;
  analytics: AnalyticsConfigOrTemplate;
  chat: ChatConfig;
  artifacts: ArtifactsConfig;
  sidePanel?: SidePanelConfig;
  slides?: WorkflowSlide[]; // Optional slides for slide-based presentation
  // Variable substitution context - will be populated at runtime
  _variableContext?: {
    user?: any;
    customer?: any;
    [key: string]: any;
  };
}

export const defaultWorkflowConfig: WorkflowConfig = {
  customer: {
    name: 'Acme Corp Inc.',
    nextCustomer: 'Intrasoft'
  },
  layout: {
    modalDimensions: {
      width: 80,
      height: 90,
      top: 10,
      left: 10
    },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: false,
    statsHeight: 45.3 // Default 45.3% for stats section
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
      data: [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 9, 11, 13, 15, 14, 16, 18, 20, 22, 21, 23, 25],
      chartContextLabel: '↗ +45% uplift',
      chartContextColor: 'text-green-600',
      dataColors: {
        threshold: 15,
        belowColor: 'bg-blue-500',
        aboveColor: 'bg-green-500'
      }
    },
    userLicenses: {
      title: 'User Licenses',
      showReferenceLine: true,
      referenceLineLabel: 'License Cost',
      data: [8, 9, 8, 9, 10, 9, 8, 9, 10, 9, 8, 9, 10, 11, 12, 20, 21, 22, 21, 20, 22, 21, 23, 22, 24, 23, 25, 24, 26, 25, 27, 26, 28, 27, 29, 28, 30, 29, 31, 30],
      chartContextLabel: '↗ +120% spike',
      chartContextColor: 'text-purple-600',
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
    placeholder: 'Ask a question or describe what you need help with...',
    aiGreeting: "I understand you're working on this task. How can I help you proceed?",
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
      },
      {
        id: 'email-draft',
        title: 'Draft Email',
        type: 'email-draft',
        visible: true,
        content: {
          to: 'Sarah Chen',
          subject: 'Account Review - Usage Update',
          priority: 'Normal',
          body: [
            "Dear Sarah,",
            "I've been reviewing your account, and it looks like your usage has increased substantially over the past month. I wanted to set a meeting to review the impact on your license fees so we can make sure there are no surprises come budget time.",
            "I am free next Tuesday morning from 9am to 12pm PST. Can we find some time to connect?",
            "Best regards,\nJustin"
          ]
        }
      }
    ]
  }
};