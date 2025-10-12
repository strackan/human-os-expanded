import { WorkflowConfig, WorkflowSlide, DynamicChatBranch } from '../WorkflowConfig';

// Slide-based workflow configuration
export const dynamicChatSlides: WorkflowSlide[] = [
  {
    id: 'initial-contact',
    slideNumber: 1,
    title: 'Renewals',
    description: 'Customer renewal workflow',
    label: 'Renewals',
    stepMapping: 'initial-contact',
    showSideMenu: false, // Side menu will be triggered by artifact action
    chat: {
      initialMessage: {
        text: "Hi {{user.first}}! {{customer.name}}'s renewal is coming up on February 27th, which means we have about a week to decide if we're going to increase their license fees. Shall me make a plan? It should take about <b>7 minutes</b>. ",
        buttons: [
          { label: 'Start Planning', value: 'plan', completeStep: 'start-planning' } as any,
          { label: 'Snooze', value: 'snooze' },
          { label: 'Skip this workflow', value: 'skip' }
        ],
        nextBranches: {
          'plan': 'expansion',
          'snooze': 'snooze',
          'skip': 'skip'
        }
      },
      branches: {
        'expansion': {
          response: "Great! Let's review what we need to accomplish for the renewal planning:",
          actions: ['showArtifact'],
          artifactId: 'planning-checklist-renewal'
        },
        'contract-planning': {
          response: "Perfect! Let's dive into the contract details to inform our renewal strategy.",
          delay: 1,
          actions: ['showArtifact', 'showMenu'],
          artifactId: 'enterprise-contract',
          buttons: [
            { label: 'Review contract terms', value: 'review-terms', completeStep: 'review-contract' } as any,
            { label: 'Continue to email', value: 'email-flow' }
          ],
          nextBranches: {
            'review-terms': 'contract-review',
            'email-flow': 'email-flow'
          }
        },
        'contract-review': {
          response: "The contract shows: 8% price cap, 60-day notice, multi-year discounts available. Ready to review pricing?",
          delay: 1,
          buttons: [
            { label: 'Review pricing', value: 'pricing-analysis', completeStep: 'review-contract' } as any,
            { label: 'Review more', value: 'contract-planning' }
          ],
          nextBranches: {
            'pricing-analysis': 'pricing-analysis',
            'contract-planning': 'contract-planning'
          }
        },
        'pricing-analysis': {
          response: "Let me analyze the optimal pricing strategy for this renewal based on market data and usage patterns.",
          delay: 1,
          actions: ['showArtifact', 'showMenu'],
          artifactId: 'pricing-analysis-renewal',
          buttons: [
            { label: 'Accept recommendation', value: 'confirm-contacts', completeStep: 'set-price' } as any,
            { label: 'Review alternatives', value: 'pricing-analysis' }
          ],
          nextBranches: {
            'confirm-contacts': 'confirm-contacts',
            'pricing-analysis': 'pricing-analysis'
          }
        },
        'confirm-contacts': {
          response: "Great! Now let's confirm the key stakeholders for this renewal. I've identified Michael Roberts (CTO) as the primary contact. Should we proceed with drafting the renewal notice?",
          delay: 1,
          buttons: [
            { label: 'Yes, draft email', value: 'email-flow', completeStep: 'confirm-contacts' } as any,
            { label: 'Review contacts', value: 'confirm-contacts' }
          ],
          nextBranches: {
            'email-flow': 'email-flow',
            'confirm-contacts': 'confirm-contacts'
          }
        },
        'not-ready-concern': {
          response: "No problem. Anything in particular you're concerned about?",
          delay: 1,
          buttons: [
            { label: 'Need more time', value: 'concern-ack' },
            { label: 'Questions about approach', value: 'concern-ack' },
            { label: 'Something else', value: 'concern-ack' }
          ],
          nextBranches: {
            'concern-ack': 'concern-acknowledge'
          }
        },
        'concern-acknowledge': {
          response: "That's a good point. Let's move on to the next customer and we can come back to this a little later. Sound good?",
          delay: 1,
          buttons: [
            { label: 'Next Customer', value: 'next-customer-action' },
            { label: 'Continue Plan', value: 'contract-planning' }
          ],
          nextBranches: {
            'next-customer-action': 'next-customer-action',
            'contract-planning': 'contract-planning'
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
        'snooze': { subflow: 'common.snooze' } as unknown as DynamicChatBranch,
        'skip': { subflow: 'common.skip' } as unknown as DynamicChatBranch,
        'exit-task-mode': {
          response: "Task mode closed. You can reopen it anytime from the dashboard.",
          actions: ['exitTaskMode']
        },
        'next-customer-action': {
          response: "Moving to the next customer...",
          actions: ['nextCustomer']
        },
        'email-flow': {
          response: "Working On It",
          delay: 3000,
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
            { label: 'Yes', value: 'email-confirmation', completeStep: 'send-renewal-notice' } as any,
            { label: 'Something Else', value: 'alternative-options' }
          ]
        },
        'email-confirmation': {
          response: "Perfect! I've created a comprehensive workflow summary with our progress, action items, and next steps for the Dynamic Corp account.",
          actions: ['showArtifact'],
          artifactId: 'workflow-summary'
        },
        'alternative-options': {
          response: "No problem! What would you like to focus on instead?",
          buttons: [
            { label: 'Review expansion options', value: 'expansion' },
            { label: 'Analyze usage patterns', value: 'usage' },
            { label: 'Prepare renewal offer', value: 'renewal' },
            { label: 'Something else', value: 'free-chat' }
          ]
        },
        'not-ready-flow': {
          response: "No problem! Take your time to review the checklist. When you're ready to proceed, just let me know.",
          buttons: [
            { label: 'I\'m ready now', value: 'proceed-with-plan' },
            { label: 'Go back to start', value: 'back-to-initial' }
          ]
        },
        'back-to-initial': {
          response: "Hi {{user.first}}! {{customer.name}}'s renewal is coming up on February 27th, which means we have about a week to decide if we're going to increase their license fees. Shall me make a plan? It should take about <b>7 minutes</b>.",
          buttons: [
            { label: 'Start Planning', value: 'plan' },
            { label: 'Snooze', value: 'snooze' },
            { label: 'Skip this workflow', value: 'skip' }
          ],
          nextBranches: {
            'plan': 'expansion',
            'snooze': 'snooze',
            'skip': 'skip'
          }
        }
      },
      userTriggers: {
        ".*help.*": "help-flow",
        ".*renewal.*": "renewal",
        ".*expand.*|.*expansion.*": "expansion",
        ".*usage.*|.*analyze.*": "usage",
        ".*email.*|.*draft.*": "email-flow"
      },
      defaultMessage: "I'm sorry, I didn't understand that. Could you try again or select one of the available options?"
    },
    artifacts: {
      sections: [
        {
          id: 'planning-checklist-renewal',
          title: 'Renewal Planning Checklist',
          type: 'planning-checklist',
          visible: false,
          content: {
            description: "Let's systematically prepare for Dynamic Corp's renewal:",
            items: [
              { id: 'start-planning', label: 'Start planning', completed: false },
              { id: 'review-contract', label: 'Review contract', completed: false },
              { id: 'set-price', label: 'Set price', completed: false },
              { id: 'confirm-contacts', label: 'Confirm contacts', completed: false },
              { id: 'send-renewal-notice', label: 'Send renewal notice', completed: false },
              { id: 'review-action-items', label: 'Review action items', completed: false }
            ],
            showActions: true
          }
        },
        {
          id: 'enterprise-contract',
          title: 'Contract Review',
          type: 'contract',
          visible: false,
          data: {
            contractId: 'DYN-2024-0512',
            customerName: 'Dynamic Corp',
            contractValue: 725000,
            renewalDate: 'February 28, 2026',
            signerBaseAmount: 725000,
            pricingCalculation: {
              basePrice: 725000,
              volumeDiscount: 0,
              additionalServices: 0,
              totalPrice: 725000
            },
            businessTerms: {
              unsigned: [],
              nonStandardRenewal: [
                'Standard 12-month renewal cycle',
                'Automatic renewal with 60-day notice'
              ],
              nonStandardPricing: [
                'Multi-year discount available (10% for 2-year, 20% for 3-year)',
                'Volume pricing tiers unlock at 150,000+ licenses'
              ],
              pricingCaps: [
                'Annual price increases capped at 8% maximum'
              ],
              otherTerms: [
                'Standard support with 24-hour response SLA',
                'Quarterly business reviews included',
                'API access with standard rate limits'
              ]
            },
            riskLevel: 'low',
            lastUpdated: 'January 15, 2025'
          }
        },
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
          id: 'pricing-analysis-renewal',
          title: 'Pricing Strategy Analysis',
          type: 'pricing-analysis',
          visible: false,
          content: {
            title: 'Renewal Pricing Analysis',
            customerName: 'Dynamic Corp',
            currentPrice: 725000,
            currentARR: 725000,
            pricePerUnit: 7.25,
            unitType: 'seat/month',
            comparativeAnalysis: {
              averagePrice: 8.50,
              percentile: 35,
              similarCustomerCount: 47
            },
            usageMetrics: {
              currentUsage: 87,
              usageGrowth: 23,
              usageEfficiency: 92
            },
            riskFactors: [
              {
                title: 'Price Cap Constraint',
                description: '8% maximum price increase specified in current contract',
                impact: 'medium'
              },
              {
                title: 'Competitive Pressure',
                description: 'Competitors offering aggressive pricing in the market',
                impact: 'medium'
              }
            ],
            opportunities: [
              {
                title: 'High Usage Growth',
                description: '23% increase in platform usage over last quarter',
                potential: 'high'
              },
              {
                title: 'APAC Expansion',
                description: 'Customer expanding operations to new geographic region',
                potential: 'high'
              },
              {
                title: 'Series C Funding',
                description: 'Recent funding round provides budget flexibility',
                potential: 'high'
              }
            ],
            recommendation: {
              priceIncrease: 8,
              newAnnualPrice: 783000,
              reasons: [
                'Usage metrics show 87% platform utilization, well above the 60% average',
                'Current pricing at 35th percentile presents optimization opportunity',
                'APAC expansion justifies premium support and infrastructure pricing',
                'Series C funding indicates strong financial position for investment',
                '8% increase maximizes value while respecting contractual price cap'
              ]
            }
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
{{user.first}}

P.S. I've also prepared some usage analytics that I think you'll find valuable for your planning discussions.`
          }
        },
        {
          id: 'workflow-summary',
          title: 'Workflow Summary',
          type: 'workflow-summary',
          visible: false,
          content: {
            customerName: 'Dynamic Corp',
            currentStage: 'Needs Assessment',
            progressPercentage: 50,
            completedActions: [
              'Initial customer contact established',
              'Growth analysis completed (65% YoY growth)',
              'Expansion opportunity identified',
              'Email drafted to Michael Roberts (CTO)'
            ],
            pendingActions: [
              'Schedule follow-up meeting with Michael Roberts',
              'Prepare detailed expansion proposal',
              'Coordinate with technical team for APAC support details',
              'Review Series C funding impact on pricing'
            ],
            nextSteps: [
              'Wait for response to initial email (2-3 days)',
              'Prepare comprehensive renewal package',
              'Schedule technical consultation for APAC expansion',
              'Draft multi-year contract terms'
            ],
            keyMetrics: {
              currentARR: '$725,000',
              projectedARR: '$1,087,500',
              growthRate: '65%',
              riskScore: '2.1/10',
              renewalDate: 'Feb 28, 2026'
            },
            recommendations: [
              'Prioritize multi-year deal to lock in growth',
              'Leverage APAC expansion for premium pricing',
              'Use Series C funding as negotiation point',
              'Offer priority support as differentiator'
            ]
          }
        }
      ]
    },
    sidePanel: {
      enabled: true,
      title: {
        text: "Renewal Planning",
        subtitle: "Dynamic Corp - 6 Steps",
        icon: "📋"
      },
      steps: [
        {
          id: "start-planning",
          title: "Start Planning",
          description: "Begin renewal planning process",
          status: "pending",
          workflowBranch: "expansion",
          icon: "🚀"
        },
        {
          id: "review-contract",
          title: "Review Contract",
          description: "Analyze current contract terms and conditions",
          status: "pending",
          workflowBranch: "contract-planning",
          icon: "📋"
        },
        {
          id: "set-price",
          title: "Set Price",
          description: "Determine renewal pricing strategy",
          status: "pending",
          workflowBranch: "pricing-analysis",
          icon: "💰"
        },
        {
          id: "confirm-contacts",
          title: "Confirm Contacts",
          description: "Verify decision makers and stakeholders",
          status: "pending",
          workflowBranch: "confirm-contacts",
          icon: "👥"
        },
        {
          id: "send-renewal-notice",
          title: "Send Renewal Notice",
          description: "Initiate formal renewal communication",
          status: "pending",
          workflowBranch: "email-flow",
          icon: "📧"
        },
        {
          id: "review-action-items",
          title: "Review Action Items",
          description: "Finalize and track next steps",
          status: "pending",
          workflowBranch: "email-complete",
          icon: "✅"
        }
      ],
      showSteps: true,
      showProgressMeter: false
    }
  },
  // SLIDE 2 - Multi-slide workflow testing
  {
    id: 'needs-assessment',
    slideNumber: 2,
    title: 'Needs Assessment',
    description: 'Analyze customer requirements and growth opportunities',
    label: 'Needs Assessment',
    stepMapping: 'needs-assessment',
    showSideMenu: false, // Side menu closed by default when entering this slide
    chat: {
      initialMessage: {
        text: "Great! I've prepared an analysis of {{customer.name}}'s expansion opportunities. Based on their 65% growth and Series C funding, they're prime candidates for a multi-year expansion deal.",
        buttons: [
          { label: 'Draft email', value: 'draft-email', completeStep: 'needs-assessment' } as any,
          { label: 'Schedule meeting', value: 'schedule' },
          { label: 'View detailed analysis', value: 'analysis' }
        ]
      },
      branches: {
        'email-flow': {
          response: "Working On It",
          delay: 3000,
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
          response: "Perfect! I've created a comprehensive workflow summary with our progress, action items, and next steps for the Dynamic Corp account.",
          actions: ['showArtifact'],
          artifactId: 'workflow-summary'
        },
        'alternative-options': {
          response: "No problem! What would you like to focus on instead?",
          buttons: [
            { label: 'Review expansion options', value: 'expansion' },
            { label: 'Analyze usage patterns', value: 'usage' },
            { label: 'Prepare renewal offer', value: 'renewal' },
            { label: 'Something else', value: 'free-chat' }
          ]
        },
        'free-chat': {
          response: "I'm here to help! Feel free to ask me anything about Dynamic Corp's account, renewal strategy, or any other questions you might have. What would you like to know?"
        }
      },
      userTriggers: {
        ".*email.*|.*draft.*": "email-flow",
        ".*auto-followup.*": "email-complete",
        ".*something.*else.*": "free-chat"
      },
      defaultMessage: "I'm sorry, I didn't understand that. Could you try again or select one of the available options?"
    },
    artifacts: {
      sections: [
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
{{user.first}}

P.S. I've also prepared some usage analytics that I think you'll find valuable for your planning discussions.`
          }
        },
        {
          id: 'workflow-summary',
          title: 'Workflow Summary',
          type: 'workflow-summary',
          visible: false,
          content: {
            customerName: 'Dynamic Corp',
            currentStage: 'Needs Assessment',
            progressPercentage: 50,
            completedActions: [
              'Initial customer contact established',
              'Growth analysis completed (65% YoY growth)',
              'Expansion opportunity identified',
              'Email drafted to Michael Roberts (CTO)'
            ],
            pendingActions: [
              'Schedule follow-up meeting with Michael Roberts',
              'Prepare detailed expansion proposal',
              'Coordinate with technical team for APAC support details',
              'Review Series C funding impact on pricing'
            ],
            nextSteps: [
              'Wait for response to initial email (2-3 days)',
              'Prepare comprehensive renewal package',
              'Schedule technical consultation for APAC expansion',
              'Draft multi-year contract terms'
            ],
            keyMetrics: {
              currentARR: '$725,000',
              projectedARR: '$1,087,500',
              growthRate: '65%',
              riskScore: '2.1/10',
              renewalDate: 'Feb 28, 2026'
            },
            recommendations: [
              'Prioritize multi-year deal to lock in growth',
              'Leverage APAC expansion for premium pricing',
              'Use Series C funding as negotiation point',
              'Offer priority support as differentiator'
            ]
          }
        }
      ]
    },
    sidePanel: {
      enabled: true,
      title: {
        text: "Customer Engagement Workflow",
        subtitle: "Dynamic Corp Account",
        icon: "📋"
      },
      steps: [
        {
          id: "initial-contact",
          title: "Initial Contact",
          description: "Establish communication with customer",
          status: "completed",
          workflowBranch: "initial",
          icon: "📞"
        },
        {
          id: "needs-assessment",
          title: "Needs Assessment",
          description: "Analyze customer requirements and growth opportunities",
          status: "in-progress",
          workflowBranch: "expansion",
          icon: "🔍"
        },
        {
          id: "proposal-draft",
          title: "Proposal Draft",
          description: "Create tailored proposal based on analysis",
          status: "pending",
          workflowBranch: "email-flow",
          icon: "📝"
        },
        {
          id: "follow-up",
          title: "Follow-up",
          description: "Schedule meeting and next steps",
          status: "pending",
          workflowBranch: "email-complete",
          icon: "📅"
        }
      ]
    }
  }
];

// Legacy configuration for backward compatibility
export const dynamicChatAI: WorkflowConfig = {
  customer: {
    name: 'Dynamic Corp',
    nextCustomer: 'UserFirst Inc.'
  },
  layout: {
    modalDimensions: { width: 80, height: 80, top: 10, left: 10 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: false
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
    usageTrend: '{{chart.usageTrend.rising}}',
    userLicenses: '{{chart.userLicenses.rising}}',
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
        text: "Hi {{user.first}}! {{customer.name}}'s renewal is coming up on February 27th, which means we have about a week to decide if we're going to increase their license fees. Shall me make a plan? It should take about <b>7 minutes</b>. ",
        buttons: [
          { label: 'Start Planning', value: 'planning' },
          { label: 'Snooze', value: 'snooze' },
          { label: 'Skip This Workflow', value: 'skip' }
        ],
        nextBranches: {
          'planning': 'planning',
          'snooze': 'snooze',
          'skip': 'skip'
        }
      },
      branches: {
        'planning': {
          response: "Great! Let's review what we need to accomplish for the renewal planning:",
          actions: ['showArtifact'],
          artifactId: 'planning-checklist-renewal',
          buttons: [
            { label: 'Let\'s Do It!', value: 'letsDoIt' },
            { label: 'Not Yet', value: 'notYet' },
            { label: 'Go Back', value: 'back-to-start' }
          ],
          nextBranches: {
            'letsDoIt': 'contract-planning-phase',
            'notYet': 'notYet',
            'back-to-start': 'back-to-initial'
          }
        },
        'notYet': {
          response: "No problem. Anything in particular you're concerned about?",
          delay: 1,
          buttons: [
            { label: 'Just need more time', value: 'need-more-time' },
            { label: 'Have questions about approach', value: 'questions-approach' },
            { label: 'Something else', value: 'something-else' }
          ],
          nextBranches: {
            'need-more-time': 'acknowledge-concern',
            'questions-approach': 'acknowledge-concern',
            'something-else': 'acknowledge-concern'
          }
        },
        'acknowledge-concern': {
          response: "That's a good point. Let's move on to the next customer and we can come back to this a little later. Sound good?",
          delay: 1,
          buttons: [
            { label: 'Next Customer', value: 'next-customer-action', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Continue Plan', value: 'continue-plan', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'next-customer-action': 'next-customer-action',
            'continue-plan': 'contract-planning-phase'
          }
        },
        'contract-planning-phase': {
          response: "Perfect! Let's dive into the contract details to inform our renewal strategy.",
          delay: 1,
          actions: ['showArtifact', 'showMenu'],
          artifactId: 'enterprise-contract',
          buttons: [
            { label: 'Review contract terms', value: 'review-contract', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Continue to email', value: 'email-flow', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'review-contract': 'contract-details',
            'email-flow': 'email-flow'
          }
        },
        'contract-details': {
          response: "The contract shows important considerations:\n\n• Annual price increases capped at 8%\n• 90-day notice required for non-renewal\n• Multi-year discount options available\n• Custom renewal cycle terms\n\nReady to proceed with the renewal email?",
          delay: 1,
          buttons: [
            { label: 'Yes, draft the email', value: 'email-flow', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Review more details', value: 'contract-planning-phase', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'email-flow': 'email-flow',
            'contract-planning-phase': 'contract-planning-phase'
          }
        },
        'skip': { subflow: 'common.skip' } as unknown as DynamicChatBranch,
        'snooze': { subflow: 'common.snooze' } as unknown as DynamicChatBranch,
        'exit-task-mode': {
          response: "Task mode closed. You can reopen it anytime from the dashboard.",
          actions: ['exitTaskMode']
        },
        'next-customer-action': {
          response: "Moving to the next customer...",
          actions: ['nextCustomer']
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
          response: "Perfect! I've created a comprehensive workflow summary with our progress, action items, and next steps for the Dynamic Corp account.",
          actions: ['showArtifact'],
          artifactId: 'workflow-summary'
        },
        'alternative-options': {
          response: "No problem! What would you like to focus on instead?",
          buttons: [
            { label: 'Review expansion options', value: 'expansion' },
            { label: 'Analyze usage patterns', value: 'usage' },
            { label: 'Prepare renewal offer', value: 'renewal' },
            { label: 'Something else', value: 'free-chat' }
          ]
        },
        'free-chat': {
          response: "I'm here to help! Feel free to ask me anything about Dynamic Corp's account, renewal strategy, or any other questions you might have. What would you like to know?"
        },
        'back-to-initial': {
          response: "Hi {{user.first}}! {{customer.name}}'s renewal is coming up on February 27th, which means we have about a week to decide if we're going to increase their license fees. Shall me make a plan? It should take about <b>7 minutes</b>.",
          buttons: [
            { label: 'Start Planning', value: 'planning' },
            { label: 'Snooze', value: 'snooze' },
            { label: 'Skip this workflow', value: 'skip' }
          ],
          nextBranches: {
            'planning': 'planning',
            'snooze': 'snooze',
            'skip': 'skip'
          }
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
        ".*auto-followup.*": "email-complete",
        ".*something.*else.*": "free-chat"
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
{{user.first}}

P.S. I've also prepared some usage analytics that I think you'll find valuable for your planning discussions.`
        }
      },
      {
        id: 'workflow-summary',
        title: 'Workflow Summary',
        type: 'workflow-summary',
        visible: false,
        content: {
          customerName: 'Dynamic Corp',
          currentStage: 'Needs Assessment',
          progressPercentage: 50,
          completedActions: [
            'Initial customer contact established',
            'Growth analysis completed (65% YoY growth)',
            'Expansion opportunity identified',
            'Email drafted to Michael Roberts (CTO)'
          ],
          pendingActions: [
            'Schedule follow-up meeting with Michael Roberts',
            'Prepare detailed expansion proposal',
            'Coordinate with technical team for APAC support details',
            'Review Series C funding impact on pricing'
          ],
          nextSteps: [
            'Wait for response to initial email (2-3 days)',
            'Prepare comprehensive renewal package',
            'Schedule technical consultation for APAC expansion',
            'Draft multi-year contract terms'
          ],
          keyMetrics: {
            currentARR: '$725,000',
            projectedARR: '$1,087,500',
            growthRate: '65%',
            riskScore: '2.1/10',
            renewalDate: 'Feb 28, 2026'
          },
          recommendations: [
            'Prioritize multi-year deal to lock in growth',
            'Leverage APAC expansion for premium pricing',
            'Use Series C funding as negotiation point',
            'Offer priority support as differentiator'
          ]
        }
      },
      {
        id: 'planning-checklist-renewal',
        title: 'Renewal Planning Checklist',
        type: 'planning-checklist',
        visible: false,
        content: {
          description: "Let's systematically prepare for Dynamic Corp's renewal:",
          items: [
            { id: 'start-planning', label: 'Start planning', completed: true },
            { id: 'review-contract', label: 'Review contract', completed: false },
            { id: 'set-price', label: 'Set price', completed: false },
            { id: 'confirm-contacts', label: 'Confirm contacts', completed: false },
            { id: 'send-renewal-notice', label: 'Send renewal notice', completed: false },
            { id: 'review-action-items', label: 'Review action items', completed: false }
          ],
          showActions: true
        }
      },
      {
        id: 'enterprise-contract',
        title: 'Contract Overview',
        type: 'contract',
        visible: false,
        data: {
          contractId: 'DYN-2024-0512',
          customerName: 'Dynamic Corp',
          contractValue: 725000,
          renewalDate: 'February 28, 2026',
          signerBaseAmount: 725000,
          pricingCalculation: {
            basePrice: 725000,
            volumeDiscount: 0,
            additionalServices: 0,
            totalPrice: 725000
          },
          businessTerms: {
            unsigned: [],
            nonStandardRenewal: [
              'Standard 12-month renewal cycle',
              'Automatic renewal with 60-day notice'
            ],
            nonStandardPricing: [
              'Multi-year discount available (10% for 2-year, 20% for 3-year)',
              'Volume pricing tiers unlock at 150,000+ licenses'
            ],
            pricingCaps: [
              'Annual price increases capped at 8% maximum'
            ],
            otherTerms: [
              'Standard support with 24-hour response SLA',
              'Quarterly business reviews included',
              'API access with standard rate limits'
            ]
          },
          riskLevel: 'low',
          lastUpdated: 'January 15, 2025'
        }
      }
    ]
  },
  // Slide-based workflow - sidePanels are defined within each slide
  slides: dynamicChatSlides
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
    usageTrend: '{{chart.usageTrend.rising}}',
    userLicenses: '{{chart.userLicenses.rising}}',
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
  },
  // Slide-based workflow - sidePanels are defined within each slide
  slides: dynamicChatSlides
};