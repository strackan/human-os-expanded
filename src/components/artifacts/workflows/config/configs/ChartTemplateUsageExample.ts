import { WorkflowConfig } from '../WorkflowConfig';

// Example showing how to use chart templates in workflow configurations

export const chartTemplateUsageExample: WorkflowConfig = {
  customer: {
    name: 'Template Example Corp',
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
        value: '$180,000',
        trend: 'mixed',
        trendValue: '+3.2%',
      },
      licenseUnitPrice: {
        label: 'Cost Per License',
        value: '$200',
        sublabel: '(90% value)',
        status: 'orange',
        trend: 'Pays comparably to 90% of customers'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Feb 15, 2025',
        sublabel: '55 days',
        status: 'orange'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Alex Chen',
        role: 'Director of IT'
      },
      riskScore: {
        label: 'Risk Score',
        value: '5.5/10',
        status: 'orange',
        sublabel: 'Mixed signals; Some usage decline but stable relationship'
      },
      growthScore: {
        label: 'Opportunity Score',
        value: '7.1/10',
        status: 'orange',
        sublabel: 'Good growth potential; Some expansion opportunities'
      },
      // Example of using chart templates with different trends
      yoyGrowth: '{{chart.yoyGrowth.flat}}',        // Flat growth pattern
      lastMonth: '{{chart.lastMonth.rising}}',      // Rising last month
      usageTrend: '{{chart.usageTrend.falling}}',   // Falling usage trend
      userLicenses: '{{chart.userLicenses.flat}}'   // Flat license usage
    }
  },
  chat: {
    placeholder: 'Feel free to ask any questions here...',
    aiGreeting: "Hi {{user.first}}! {{customer.name}}'s renewal is coming up on {{customer.renewalDate}}. I've noticed some interesting patterns in their data. Their YoY growth is {{chart.yoyGrowth.flat.trendValue}}, but their usage trend shows {{chart.usageTrend.falling.description}}. Last month they showed {{chart.lastMonth.rising.trendValue}} growth though. Should we analyze this mixed picture?",
    conversationSeed: [
      {
        sender: 'ai',
        text: "Hi {{user.first}}! {{customer.name}}'s renewal is coming up on {{customer.renewalDate}}. I've noticed some interesting patterns in their data. Their YoY growth is {{chart.yoyGrowth.flat.trendValue}}, but their usage trend shows {{chart.usageTrend.falling.description}}. Last month they showed {{chart.lastMonth.rising.trendValue}} growth though. Should we analyze this mixed picture?",
        type: 'buttons',
        buttons: [
          { label: 'Analyze Mixed Signals', value: 'analyze', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Snooze', value: 'snooze', 'label-background': '#6b7280', 'label-text': '#ffffff' },
          { label: 'Skip This Customer', value: 'skip', 'label-background': '#6b7280', 'label-text': '#ffffff' }
        ]
      }
    ]
  }
};

// Example showing how to use chart templates in dynamic chat flows
export const dynamicChatWithChartTemplates: WorkflowConfig = {
  customer: {
    name: 'Dynamic Chart Corp',
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
        value: '$120,000',
        trend: 'declining',
        trendValue: '-2.1%',
      },
      licenseUnitPrice: {
        label: 'Cost Per License',
        value: '$150',
        sublabel: '(80% value)',
        status: 'red',
        trend: 'Pays less per unit than 80% of customers'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Mar 10, 2025',
        sublabel: '40 days',
        status: 'red'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Lisa Rodriguez',
        role: 'CFO'
      },
      riskScore: {
        label: 'Risk Score',
        value: '7.8/10',
        status: 'red',
        sublabel: 'High risk; Declining usage and limited engagement'
      },
      growthScore: {
        label: 'Opportunity Score',
        value: '3.2/10',
        status: 'red',
        sublabel: 'Limited growth potential; Focus on retention'
      },
      // Using falling trend templates
      yoyGrowth: '{{chart.yoyGrowth.falling}}',
      lastMonth: '{{chart.lastMonth.falling}}',
      usageTrend: '{{chart.usageTrend.falling}}',
      userLicenses: '{{chart.userLicenses.falling}}'
    }
  },
  chat: {
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "I understand you'd like to discuss something else. How can I help?",
      initialMessage: {
        text: "Hi {{user.first}}! {{customer.name}}'s renewal is coming up on {{customer.renewalDate}}, and I'm concerned about their declining trends. Their YoY growth is {{chart.yoyGrowth.falling.trendValue}} and usage has been falling consistently. The data shows {{chart.usageTrend.falling.description}}. Should we create a retention strategy?",
        buttons: [
          { label: 'Create Retention Plan', value: 'retention' },
          { label: 'Snooze', value: 'snooze' },
          { label: 'Skip This Customer', value: 'skip' }
        ],
        nextBranches: {
          'retention': 'retention-plan',
          'snooze': 'snooze',
          'skip': 'skip'
        }
      },
      branches: {
        'retention-plan': {
          response: "Let's create a retention plan. Based on the data, {{customer.name}}'s usage has declined from {{chart.usageTrend.falling.chart.data[0].users}} to {{chart.usageTrend.falling.chart.data[11].users}} users over the year. Their YoY growth of {{chart.yoyGrowth.falling.trendValue}} indicates we need immediate action.",
          buttons: [
            { label: 'Send Retention Offer', value: 'offer' },
            { label: 'Schedule Executive Call', value: 'call' },
            { label: 'Review Usage Data', value: 'review' }
          ],
          nextBranches: {
            'offer': 'retention-offer',
            'call': 'executive-call',
            'review': 'usage-review'
          }
        },
        'retention-offer': {
          response: "I'll prepare a retention offer with a 15% discount and additional training. This should help address their declining usage patterns.",
          actions: ['showArtifact']
        },
        'executive-call': {
          response: "I'll schedule a call with {{customer.primaryContact}} to discuss their concerns and explore ways to increase engagement.",
          actions: ['showArtifact']
        },
        'usage-review': {
          response: "Let me show you the detailed usage analysis. The data shows a consistent decline from {{chart.usageTrend.falling.chart.data[0].users}} users in January to {{chart.usageTrend.falling.chart.data[11].users}} in December.",
          actions: ['showArtifact']
        },
        'snooze': {
          response: "No problem! I'll check back in a couple days. Let me reset this workflow for you.",
          actions: ['resetToInitialState']
        },
        'skip': {
          response: "Okay, I'll check in next time they come up on my radar. Shall we move on to the next customer?",
          buttons: [
            { label: 'Exit', value: 'exit', 'label-background': 'bg-gray-300', 'label-text': 'text-gray-700' },
            { label: 'Yes', value: 'next-customer', 'label-background': 'bg-green-500', 'label-text': 'text-white' }
          ],
          nextBranches: {
            'exit': 'exit-task-mode',
            'next-customer': 'next-customer-action'
          }
        },
        'exit-task-mode': {
          response: "Task mode closed. You can reopen it anytime from the dashboard.",
          actions: ['exitTaskMode']
        },
        'next-customer-action': {
          response: "Moving to the next customer...",
          actions: ['nextCustomer']
        }
      }
    }
  }
};

// Documentation of available chart template variables
export const chartTemplateDocumentation = {
  description: "Chart templates provide predefined data patterns for analytics charts",
  availableTemplates: {
    yoyGrowth: {
      falling: "Declining year-over-year growth pattern",
      flat: "Stable year-over-year growth pattern", 
      rising: "Growing year-over-year growth pattern"
    },
    lastMonth: {
      falling: "Declining last month performance",
      flat: "Stable last month performance",
      rising: "Growing last month performance"
    },
    usageTrend: {
      falling: "Declining usage trend over time",
      flat: "Stable usage trend around license limit",
      rising: "Growing usage trend exceeding license limit"
    },
    userLicenses: {
      falling: "Low license utilization",
      flat: "Balanced license utilization", 
      rising: "High license utilization"
    }
  },
  usageExamples: [
    "{{chart.yoyGrowth.falling}} - Complete falling YoY growth template",
    "{{chart.yoyGrowth.falling.trendValue}} - Just the trend value (-2.1%)",
    "{{chart.usageTrend.rising.description}} - Just the description text",
    "{{chart.lastMonth.flat.chart.data}} - Just the chart data array"
  ]
};
