import { WorkflowConfig } from '../WorkflowConfig';

export const dynamicChatAI: WorkflowConfig = {
  customer: {
    name: 'Dynamic Corp',
    nextCustomer: 'UserFirst Inc.'
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
          actions: ['showArtifact'],
          artifactId: 'usage-analysis'
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
          response: "Working On It",
          delay: 3000, // Delay to allow typing animation to complete
          actions: ['showArtifact', 'nextChat'],
          artifactId: 'email-draft',
          nextBranches: {
            'auto-followup': 'email-complete'
          }
        },
        'email-complete': {
          response: "Okay, I've drafted the email to Michael Roberts with a request to meet. Feel free to edit and send directly in the composer. After you process the email, I'll summarize everything we've done and next steps. Sound good?",
          predelay: 4500,
          buttons: [
            { label: 'Yes', value: 'email-confirmation' },
            { label: 'Something Else', value: 'alternative-options' }
          ]
        },
        'email-confirmation': {
          response: "Perfect! Once you've sent the email, I'll prepare a follow-up summary with our next steps and any additional recommendations for the Dynamic Corp account."
        },
        'alternative-options': {
          response: "No problem! What would you like to focus on instead?",
          buttons: [
            { label: 'Review expansion options', value: 'expansion' },
            { label: 'Analyze usage patterns', value: 'usage' },
            { label: 'Prepare renewal offer', value: 'renewal' },
            { label: 'Something else', value: 'help-flow' }
          ]
        },
        'early-renewal': {
          response: "Great strategy! I'll create an early renewal offer with a 15% discount.",
          actions: ['showArtifact'],
          artifactId: 'renewal-offer'
        }
      },
      userTriggers: {
        ".*help.*": "help-flow",
        ".*renewal.*": "renewal",
        ".*expand.*|.*expansion.*": "expansion",
        ".*usage.*|.*analyze.*": "usage",
        ".*email.*|.*draft.*": "email-flow",
        ".*auto-followup.*": "email-complete"
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
        id: 'license-analysis',
        title: 'License Analysis',
        type: 'license-analysis',
        visible: false,
        content: {
          currentLicense: { tokens: 100000, unitPrice: 7.25, total: 725000 },
          anticipatedRenewal: { tokens: 150000, unitPrice: 7.25, total: 1087500 },
          earlyDiscount: { percentage: 15, total: 924375 },
          multiYearDiscount: { percentage: 25, total: 815625 }
        }
      },
      {
        id: 'email-draft',
        title: 'Email Composer',
        type: 'email',
        visible: false,
        editable: true,
        content: {
          to: 'michael.roberts@dynamiccorp.com',
          subject: 'Dynamic Corp - Expansion Opportunity & Strategic Renewal Discussion',
          body: `Hi Michael,

I hope this email finds you well! I've been reviewing Dynamic Corp's impressive performance metrics, and I'm excited about the 65% growth you've achieved this year. Your expansion into APAC and the recent Series C funding announcement clearly demonstrate Dynamic Corp's trajectory toward becoming a market leader.

Given your current usage patterns and the approaching renewal date, I'd love to discuss how we can support your continued growth with a strategic renewal package that aligns with your expansion goals.

I'm proposing a multi-year expansion deal that would:
• Provide capacity for your anticipated growth
• Include priority support for your APAC operations
• Offer significant cost savings through our enterprise pricing

Are you available for a brief call next week to explore how we can structure this to support Dynamic Corp's continued success?

Best regards,
Justin

P.S. I've also prepared some usage analytics that I think you'll find valuable for your planning discussions.`
        }
      }
    ]
  }
};

export const dynamicChatUser: WorkflowConfig = {
  customer: {
    name: 'UserFirst Inc.'
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
        value: '$325,000',
        trend: 'up',
        trendValue: '+8.5%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$5.50',
        sublabel: '(75% value)',
        status: 'orange'
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
        status: 'green'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+5.2%',
        status: 'green'
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
          response: "I can help you with:\\n• Renewal strategy and pricing\\n• Usage analysis and trends\\n• Drafting emails to contacts\\n• Resolving the pending escalation\\n• Account health assessment\\n\\nWhat would you like to focus on?",
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
          actions: ['showArtifact'],
          artifactId: 'pricing-analysis'
        },
        'usage-analysis': {
          response: "Analyzing UserFirst Inc.'s usage patterns now. They're at 80% capacity with consistent growth.",
          actions: ['showArtifact'],
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
          actions: ['showArtifact'],
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
    sections: [
      {
        id: 'pricing-analysis',
        title: 'Pricing Analysis',
        type: 'license-analysis',
        visible: false,
        content: {
          currentLicense: { tokens: 60000, unitPrice: 5.42, total: 325000 },
          anticipatedRenewal: { tokens: 70000, unitPrice: 5.42, total: 379400 },
          earlyDiscount: { percentage: 10, total: 341460 },
          multiYearDiscount: { percentage: 18, total: 311128 }
        }
      },
      {
        id: 'escalation-response',
        title: 'Email Composer',
        type: 'email',
        visible: false,
        editable: true,
        content: {
          to: 'emily.zhang@userfirst.com',
          subject: 'Re: API Rate Limit Issues - Solution Proposal & Implementation Plan',
          body: `Hi Emily,

Thank you for bringing the API rate limit issues to our attention. I've conducted a thorough review of UserFirst Inc.'s usage patterns and identified the root cause of the intermittent throttling during peak hours.

I'm pleased to propose two immediate solutions:

1. **Temporary Rate Limit Increase**: We'll implement a 40% increase in your current rate limits while we optimize your API usage patterns.

2. **Request Batching Implementation**: Our technical team will work with yours to implement intelligent request batching, which should reduce your API calls by approximately 60% while maintaining functionality.

I've scheduled a technical consultation with our API optimization team for this Thursday at 2 PM PST. This will include:
• Detailed analysis of your current API usage patterns
• Implementation timeline for the proposed solutions
• Best practices for optimizing future API interactions

I'm confident these changes will resolve the throttling issues and improve your overall API experience significantly.

Please let me know if Thursday works for your team, or if you'd prefer an alternative time.

Best regards,
Technical Support Team

P.S. I've attached a preliminary usage analysis that shows the specific patterns causing the rate limit triggers.`
        }
      }
    ]
  }
};