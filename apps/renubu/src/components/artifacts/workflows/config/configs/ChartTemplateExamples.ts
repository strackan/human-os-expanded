import { WorkflowConfig } from '../WorkflowConfig';
import { applyTemplateSet } from '../templateVariables';

// Example configurations using chart templates

// Declining Customer Example
export const decliningCustomerConfig: WorkflowConfig = {
  customer: {
    name: 'Declining Corp',
    nextCustomer: 'Stable Inc.'
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
        value: '$95,000',
        trend: 'declining',
        trendValue: '-5.2%',
      },
      licenseUnitPrice: {
        label: 'Cost Per License',
        value: '$120',
        sublabel: '(75% value)',
        status: 'red',
        trend: 'Pays significantly less per unit than 75% of customers'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Mar 15, 2025',
        sublabel: '45 days',
        status: 'red'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Jane Smith',
        role: 'CFO'
      },
      riskScore: {
        label: 'Risk Score',
        value: '8.5/10',
        status: 'red',
        sublabel: 'Declining usage; No executive engagement in 120+ days'
      },
      growthScore: {
        label: 'Opportunity Score',
        value: '2.1/10',
        status: 'red',
        sublabel: 'Limited growth potential; High churn risk'
      },
      // Chart templates will be applied here
      yoyGrowth: '{{chart.yoyGrowth.falling}}',
      lastMonth: '{{chart.lastMonth.falling}}'
    }
  },
  analytics: {
    usageTrend: '{{chart.usageTrend.falling}}',
    userLicenses: '{{chart.userLicenses.falling}}',
    renewalInsights: {
      renewalStage: 'At Risk',
      confidence: 45,
      recommendedAction: 'Retention Strategy Required',
      keyReasons: [
        { category: 'Usage', detail: 'Declining usage trend over 6 months' },
        { category: 'Engagement', detail: 'Reduced user engagement' }
      ]
    }
  },
  chat: {
    placeholder: 'Feel free to ask any questions here...',
    aiGreeting: "Hi {{user.first}}! {{customer.name}}'s renewal is coming up on {{customer.renewalDate}}, and I'm concerned about their declining usage trends. Their YoY growth is {{chart.yoyGrowth.falling.trendValue}} and usage has been falling consistently. Should we discuss a retention strategy?",
    conversationSeed: [
      {
        sender: 'ai',
        text: "Hi {{user.first}}! {{customer.name}}'s renewal is coming up on {{customer.renewalDate}}, and I'm concerned about their declining usage trends. Their YoY growth is {{chart.yoyGrowth.falling.trendValue}} and usage has been falling consistently. Should we discuss a retention strategy?",
        type: 'buttons',
        buttons: [
          { label: 'Start Retention Plan', value: 'retention', 'label-background': '#ef4444', 'label-text': '#ffffff' },
          { label: 'Snooze', value: 'snooze', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Skip This Customer', value: 'skip', 'label-background': '#6b7280', 'label-text': '#ffffff' }
        ]
      }
    ],
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
  }
};

// Stable Customer Example
export const stableCustomerConfig: WorkflowConfig = {
  customer: {
    name: 'Stable Inc.',
    nextCustomer: 'Growing Corp'
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
        value: '$150,000',
        trend: 'flat',
        trendValue: '+1.2%',
      },
      licenseUnitPrice: {
        label: 'Cost Per License',
        value: '$180',
        sublabel: '(85% value)',
        status: 'orange',
        trend: 'Pays comparably to 85% of customers'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Feb 20, 2025',
        sublabel: '60 days',
        status: 'green'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Mike Johnson',
        role: 'CTO'
      },
      riskScore: {
        label: 'Risk Score',
        value: '4.2/10',
        status: 'green',
        sublabel: 'Stable usage patterns; Regular executive check-ins'
      },
      growthScore: {
        label: 'Opportunity Score',
        value: '6.8/10',
        status: 'orange',
        sublabel: 'Moderate growth potential; Some expansion opportunities'
      },
      // Chart templates will be applied here
      yoyGrowth: '{{chart.yoyGrowth.flat}}',
      lastMonth: '{{chart.lastMonth.flat}}'
    }
  },
  analytics: {
    usageTrend: '{{chart.usageTrend.flat}}',
    userLicenses: '{{chart.userLicenses.flat}}',
    renewalInsights: {
      renewalStage: 'Planning',
      confidence: 70,
      recommendedAction: 'Standard Renewal with Modest Price Increase',
      keyReasons: [
        { category: 'Usage', detail: 'Stable usage patterns' },
        { category: 'Engagement', detail: 'Regular executive check-ins' }
      ]
    }
  },
  chat: {
    placeholder: 'Feel free to ask any questions here...',
    aiGreeting: "Good morning, {{user.first}}! {{customer.name}}'s renewal is coming up on {{customer.renewalDate}}. They've been a stable customer with {{chart.yoyGrowth.flat.trendValue}} YoY growth. Usage is hovering around the license limit. Should we discuss a modest price increase?",
    conversationSeed: [
      {
        sender: 'ai',
        text: "Good morning, {{user.first}}! {{customer.name}}'s renewal is coming up on {{customer.renewalDate}}. They've been a stable customer with {{chart.yoyGrowth.flat.trendValue}} YoY growth. Usage is hovering around the license limit. Should we discuss a modest price increase?",
        type: 'buttons',
        buttons: [
          { label: 'Discuss Price Increase', value: 'price', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Snooze', value: 'snooze', 'label-background': '#6b7280', 'label-text': '#ffffff' },
          { label: 'Skip This Customer', value: 'skip', 'label-background': '#6b7280', 'label-text': '#ffffff' }
        ]
      }
    ],
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
  }
};

// Growing Customer Example
export const growingCustomerConfig: WorkflowConfig = {
  customer: {
    name: 'Growing Corp',
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
        value: '$250,000',
        trend: 'growing',
        trendValue: '+12.5%',
      },
      licenseUnitPrice: {
        label: 'Cost Per License',
        value: '$220',
        sublabel: '(95% value)',
        status: 'green',
        trend: 'Pays premium rates compared to 95% of customers'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Jan 30, 2025',
        sublabel: '30 days',
        status: 'green'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Sarah Wilson',
        role: 'VP Engineering'
      },
      riskScore: {
        label: 'Risk Score',
        value: '2.1/10',
        status: 'green',
        sublabel: 'Excellent usage growth; Strong executive relationship'
      },
      growthScore: {
        label: 'Opportunity Score',
        value: '9.2/10',
        status: 'green',
        sublabel: 'High growth potential; Multiple expansion opportunities'
      },
      // Chart templates will be applied here
      yoyGrowth: '{{chart.yoyGrowth.rising}}',
      lastMonth: '{{chart.lastMonth.rising}}'
    }
  },
  analytics: {
    usageTrend: '{{chart.usageTrend.rising}}',
    userLicenses: '{{chart.userLicenses.rising}}',
    renewalInsights: {
      renewalStage: 'Expansion',
      confidence: 92,
      recommendedAction: 'Aggressive Price Increase and License Expansion',
      keyReasons: [
        { category: 'Usage', detail: 'Excellent usage growth exceeding license limits' },
        { category: 'Engagement', detail: 'Strong executive relationship and engagement' }
      ]
    }
  },
  chat: {
    placeholder: 'Feel free to ask any questions here...',
    aiGreeting: "Excellent news, {{user.first}}! {{customer.name}} is our fastest growing customer with {{chart.yoyGrowth.rising.trendValue}} YoY growth. Their usage has exceeded license limits and they're actively expanding. Should we discuss a significant price increase and additional licenses?",
    conversationSeed: [
      {
        sender: 'ai',
        text: "Excellent news, {{user.first}}! {{customer.name}} is our fastest growing customer with {{chart.yoyGrowth.rising.trendValue}} YoY growth. Their usage has exceeded license limits and they're actively expanding. Should we discuss a significant price increase and additional licenses?",
        type: 'buttons',
        buttons: [
          { label: 'Plan Price Increase', value: 'price', 'label-background': '#10b981', 'label-text': '#ffffff' },
          { label: 'Snooze', value: 'snooze', 'label-background': '#6b7280', 'label-text': '#ffffff' },
          { label: 'Skip This Customer', value: 'skip', 'label-background': '#6b7280', 'label-text': '#ffffff' }
        ]
      }
    ],
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
  }
};

// Helper function to create configs with resolved chart templates
export const createConfigWithChartTemplates = (baseConfig: WorkflowConfig, templateSet: 'declining' | 'stable' | 'growing'): WorkflowConfig => {
  return applyTemplateSet(baseConfig, templateSet, {
    user: { first: 'User' },
    customer: baseConfig.customer
  });
};



