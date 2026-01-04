import { WorkflowConfig } from '../WorkflowConfig';

export const dynamicChatExampleConfig: WorkflowConfig = {
  customer: {
    name: 'Dynamic Corp',
    nextCustomer: 'Acme Corp Inc.'
  },
  layout: {
    modalDimensions: { width: 80, height: 90, top: 10, left: 10 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: false // Set to false to start without artifacts visible
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$725,000',
        trend: 'up',
        trendValue: '+25.5%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$8.25',
        sublabel: '(95% value)',
        status: 'green',
        trend: 'Pays more than 95% of customers'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Feb 28, 2026',
        sublabel: '90 days',
        status: 'orange'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Michael Roberts',
        role: 'CTO'
      },
      riskScore: {
        label: 'Risk Score',
        value: '2.1/10',
        status: 'green',
        sublabel: 'No critical tickets'
      },
      growthScore: {
        label: 'Growth Score',
        value: '9.2/10',
        status: 'green',
        sublabel: 'High expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+35.2%',
        status: 'green',
        sparkData: [3, 4, 5, 6, 7, 8, 9],
        sublabel: 'Annual'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+22.3%',
        status: 'green',
        sparkData: [5, 6, 7, 8, 9, 10, 11],
        sublabel: 'Growing'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'License Limit',
      referenceLineHeight: 20,
      data: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
      chartContextLabel: '↗ +65% growth trajectory',
      chartContextColor: 'text-green-600',
      chartMin: 0,
      chartMax: 35,
      dataColors: { threshold: 20, belowColor: 'bg-blue-500', aboveColor: 'bg-green-500' }
    },
    userLicenses: {
      title: 'User Licenses',
      showReferenceLine: true,
      referenceLineLabel: 'Current Plan',
      referenceLineHeight: 25,
      data: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38],
      chartContextLabel: '↗ Approaching limit',
      chartContextColor: 'text-orange-600',
      chartMin: 0,
      chartMax: 40,
      dataColors: { threshold: 25, belowColor: 'bg-blue-500', aboveColor: 'bg-orange-500' }
    },
    renewalInsights: {
      renewalStage: 'Negotiation',
      confidence: 92,
      recommendedAction: 'Proactive Expansion Offer',
      keyReasons: [
        { category: 'Adoption', detail: '65% usage growth YTD' },
        { category: 'Company Growth', detail: 'Series C funding announced' },
        { category: 'News', detail: 'Expanding to APAC region' },
        { category: 'Sentiment', detail: 'Champion actively advocating internally' }
      ]
    }
  },
  chat: {
    placeholder: 'Type your question or select an option...',
    aiGreeting: "I'm here to help with your renewal strategy.",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "I'm sorry, I didn't understand that. Could you try again or select one of the available options?",
      initialMessage: {
        text: "Hi Justin! I've noticed Dynamic Corp is experiencing significant growth with 65% increased usage YTD. Their renewal is in 90 days. How would you like to approach this opportunity?",
        buttons: [
          { label: 'Review expansion options', value: 'expansion' },
          { label: 'Analyze usage patterns', value: 'usage' },
          { label: 'Prepare renewal offer', value: 'renewal' },
          { label: 'Skip for now', value: 'skip' }
        ]
      },
      branches: {
        'expansion': {
          response: "Excellent choice! Based on their growth trajectory, I recommend a multi-year expansion deal. Let me prepare an analysis for you.",
          actions: ['launch-artifact'],
          artifactId: 'license-analysis',
          buttons: [
            { label: 'Draft email', value: 'draft-email' },
            { label: 'Schedule meeting', value: 'schedule' },
            { label: 'View details', value: 'details' }
          ],
          nextBranches: {
            'draft-email': 'email-flow',
            'schedule': 'meeting-flow',
            'details': 'detail-view'
          }
        },
        'usage': {
          response: "Let me analyze their usage patterns for you. They're currently at 85% of their license capacity with consistent growth.",
          actions: ['launch-artifact'],
          artifactId: 'usage-analysis',
          buttons: [
            { label: 'Recommend upgrade', value: 'upgrade' },
            { label: 'Continue monitoring', value: 'monitor' }
          ],
          nextBranches: {
            'upgrade': 'upgrade-flow',
            'monitor': 'monitor-flow'
          }
        },
        'renewal': {
          response: "I'll help you prepare a compelling renewal offer. Which approach would you prefer?",
          buttons: [
            { label: 'Early renewal discount', value: 'early' },
            { label: 'Multi-year package', value: 'multi-year' },
            { label: 'Standard renewal', value: 'standard' }
          ],
          nextBranches: {
            'early': 'early-renewal',
            'multi-year': 'multi-year-deal',
            'standard': 'standard-renewal'
          }
        },
        'skip': {
          response: "No problem! I'll check back in a week. Is there anything else you'd like to work on today?"
        },
        'email-flow': {
          response: "I've drafted an expansion email for Michael Roberts.",
          actions: ['showArtifact'],
          artifactId: 'exec-email',
          defaultMessage: "Great! I'll prepare that email for you."
        },
        'meeting-flow': {
          response: "Which contact would you like to schedule the meeting with?",
          buttons: [
            { label: 'Michael Roberts (CTO)', value: 'michael' },
            { label: 'Sarah Chen (VP Ops)', value: 'sarah' },
            { label: 'Someone else', value: 'other' }
          ],
          defaultMessage: "I'll use the primary contact, Michael Roberts.",
          nextBranches: {
            'michael': 'schedule-michael',
            'sarah': 'schedule-sarah'
          }
        },
        'schedule-michael': {
          response: "Perfect! I'll send a meeting invite to Michael Roberts for next week to discuss the expansion opportunity."
        },
        'early-renewal': {
          response: "Great strategy! I'll create an early renewal offer with a 15% discount. This typically increases renewal rates by 30%.",
          actions: ['launch-artifact'],
          artifactId: 'renewal-offer'
        },
        'multi-year-deal': {
          response: "Excellent choice for a high-growth customer! I'll prepare a 3-year package with volume discounts.",
          actions: ['launch-artifact'],
          artifactId: 'multi-year-offer'
        }
      },
      userTriggers: {
        ".*help.*": "help-flow",
        ".*renewal.*": "renewal",
        ".*expand.*|.*expansion.*": "expansion",
        ".*usage.*|.*analyze.*": "usage",
        ".*email.*|.*draft.*": "email-flow",
        ".*meeting.*|.*schedule.*": "meeting-flow"
      }
    },
    features: {
      attachments: true,
      voiceRecording: true,
      designMode: false,
      editMode: true,
      artifactsToggle: true
    }
  },
  artifacts: {
    sections: [
      {
        id: 'exec-email',
        title: 'Executive Email Draft',
        type: 'email-draft',
        visible: true,
        content: {
          to: 'michael.roberts@dynamiccorp.com',
          subject: 'Expansion Opportunity - Dynamic Corp',
          body: `Hi Michael,

I hope this email finds you well. I wanted to reach out regarding your upcoming renewal and the exciting growth we've observed in your usage of our platform.

Based on our analysis, Dynamic Corp has shown remarkable growth with a 65% increase in usage year-to-date. This growth trajectory suggests you're getting tremendous value from our solution, and we'd love to explore how we can support your continued expansion.

Given your current usage patterns and the approaching renewal date, I'd like to propose a few options:

1. **Multi-year expansion deal** - Lock in current pricing with volume discounts
2. **Additional user licenses** - Scale with your team growth
3. **Premium features** - Unlock advanced capabilities for your growing needs

Would you be available for a brief call next week to discuss these opportunities? I'm confident we can structure something that supports your growth while providing excellent value.

Best regards,
Justin Strackany
Customer Success Manager`
        }
      }
    ]
  }
};

export const userInitiatedDynamicConfig: WorkflowConfig = {
  customer: {
    name: 'UserFirst Inc.',
    nextCustomer: 'Dynamic Corp'
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
        value: '$325,000',
        trend: 'up',
        trendValue: '+8.5%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$5.50',
        sublabel: '(75% value)',
        status: 'orange',
        trend: 'Average pricing tier'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Mar 15, 2026',
        sublabel: '105 days',
        status: 'green'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Emily Zhang',
        role: 'VP Engineering'
      },
      riskScore: {
        label: 'Risk Score',
        value: '4.5/10',
        status: 'orange',
        sublabel: '1 escalation pending'
      },
      growthScore: {
        label: 'Growth Score',
        value: '6.5/10',
        status: 'orange',
        sublabel: 'Moderate growth potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+12.5%',
        status: 'green',
        sparkData: [4, 5, 4, 5, 6, 6, 7],
        sublabel: 'Annual'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+5.2%',
        status: 'green',
        sparkData: [6, 6, 7, 7, 7, 8, 8],
        sublabel: 'Stable'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'License Limit',
      referenceLineHeight: 15,
      data: [8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 16, 16, 17, 17, 18, 18, 19],
      chartContextLabel: 'Steady growth pattern',
      chartContextColor: 'text-blue-600',
      chartMin: 0,
      chartMax: 25,
      dataColors: { threshold: 15, belowColor: 'bg-blue-500', aboveColor: 'bg-orange-500' }
    },
    userLicenses: {
      title: 'User Licenses',
      showReferenceLine: true,
      referenceLineLabel: 'Current Plan',
      referenceLineHeight: 20,
      data: [18, 18, 18, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 22, 22, 22, 23, 23, 23, 24, 24, 24, 25, 25],
      chartContextLabel: 'Approaching capacity',
      chartContextColor: 'text-orange-600',
      chartMin: 0,
      chartMax: 30,
      dataColors: { threshold: 20, belowColor: 'bg-blue-500', aboveColor: 'bg-orange-500' }
    },
    renewalInsights: {
      renewalStage: 'Early Planning',
      confidence: 75,
      recommendedAction: 'Relationship Building',
      keyReasons: [
        { category: 'Adoption', detail: 'Steady 12% growth' },
        { category: 'Support', detail: '1 escalation needs resolution' },
        { category: 'Engagement', detail: 'Regular feature requests' },
        { category: 'Budget', detail: 'FY planning in progress' }
      ]
    }
  },
  chat: {
    placeholder: 'Ask me about renewal strategy, usage analysis, or type "help" for options...',
    aiGreeting: "I can help you with UserFirst Inc.'s account.",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'user',
      defaultMessage: "I didn't quite understand that. You can ask about renewal options, usage patterns, or type 'help' to see available commands.",
      branches: {
        'help-flow': {
          response: "I can help you with:\n• Renewal strategy and pricing\n• Usage analysis and trends\n• Drafting emails to contacts\n• Resolving the pending escalation\n• Account health assessment\n\nWhat would you like to focus on?",
          buttons: [
            { label: 'Renewal strategy', value: 'renewal' },
            { label: 'Usage analysis', value: 'usage' },
            { label: 'Escalation details', value: 'escalation' }
          ],
          nextBranches: {
            'renewal': 'renewal-strategy',
            'usage': 'usage-analysis',
            'escalation': 'escalation-details'
          }
        },
        'renewal-strategy': {
          response: "UserFirst Inc. has shown steady growth. Given their 105-day renewal window, I recommend starting engagement soon. Would you like to see pricing options?",
          buttons: [
            { label: 'Show pricing', value: 'show-pricing' },
            { label: 'Draft proposal', value: 'draft-proposal' }
          ],
          nextBranches: {
            'show-pricing': 'pricing-display',
            'draft-proposal': 'proposal-draft'
          }
        },
        'pricing-display': {
          response: "I'll prepare a detailed pricing analysis for UserFirst Inc.",
          actions: ['launch-artifact'],
          artifactId: 'pricing-analysis'
        },
        'usage-analysis': {
          response: "Analyzing UserFirst Inc.'s usage patterns now. They're at 80% capacity with consistent growth.",
          actions: ['launch-artifact'],
          artifactId: 'usage-report'
        },
        'escalation-details': {
          response: "There's one pending escalation regarding API rate limits. The customer reported intermittent throttling during peak hours. Would you like to draft a response?",
          buttons: [
            { label: 'Draft response', value: 'draft-response' },
            { label: 'View ticket details', value: 'view-ticket' }
          ],
          nextBranches: {
            'draft-response': 'response-draft',
            'view-ticket': 'ticket-details'
          }
        },
        'response-draft': {
          response: "I've prepared a response addressing the API rate limit concerns with proposed solutions.",
          actions: ['launch-artifact'],
          artifactId: 'escalation-response'
        }
      },
      userTriggers: {
        "^help$|.*help.*options.*|.*what can.*": "help-flow",
        ".*renewal.*|.*renew.*": "renewal-strategy",
        ".*usage.*|.*analyze.*|.*analysis.*": "usage-analysis",
        ".*escalation.*|.*issue.*|.*problem.*": "escalation-details",
        ".*price.*|.*pricing.*|.*cost.*": "pricing-display",
        ".*email.*|.*draft.*|.*write.*": "response-draft"
      }
    },
    features: {
      attachments: true,
      voiceRecording: false,
      designMode: false,
      editMode: true,
      artifactsToggle: true
    }
  },
  artifacts: {
    sections: []
  }
};