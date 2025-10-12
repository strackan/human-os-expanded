/**
 * DynamicChatFixed - Templated Version
 *
 * This is a complete recreation of DynamicChatFixed using ONLY template functions
 * from branchTemplates.ts, slideTemplates.ts, and artifactTemplates.ts.
 *
 * Purpose: Demonstrate the template system's capability and provide a cleaner,
 * more maintainable version of the comprehensive workflow demo.
 *
 * This version includes ALL artifact types for comprehensive demonstration:
 * - Planning Checklist
 * - Contract
 * - Email
 * - Workflow Summary
 * - Pricing Analysis (NEW)
 * - Contact Strategy (NEW)
 * - Plan Summary (NEW)
 * - Quote (NEW)
 * - Document (NEW)
 */

import { WorkflowConfig } from '../WorkflowConfig';
import {
  createInitialContactSlide,
  createNeedsAssessmentSlide,
  createPricingStrategySlide,
  createContactPlanningSlide,
  createPlanSummarySlide,
  createSidePanel
} from '../slideTemplates';
import {
  createEmailArtifact,
  createContractArtifact,
  createPlanningChecklistArtifact,
  createWorkflowSummaryArtifact,
  createPricingAnalysisArtifact,
  createContactStrategyArtifact,
  createPlanSummaryArtifact,
  createQuoteArtifact,
  createLicenseAnalysisArtifact
} from '../artifactTemplates';
import {
  createSnoozeSkipBranches,
  createEmailFlowBranch,
  createEmailCompleteBranch,
  createContractReviewBranch,
  createContractDetailsBranch,
  createPlanningChecklistBranch,
  createNotReadyConcernBranches,
  createNextCustomerBranch,
  createExitTaskModeBranch,
  createWorkflowSummaryBranch,
  createPricingAnalysisBranch,
  createContactStrategyBranch,
  createPlanSummaryBranch
} from '../branchTemplates';

/**
 * Slide 1: Initial Contact - Renewal Planning
 *
 * Demonstrates:
 * - Planning Checklist artifact
 * - Contract artifact
 * - Email artifact
 * - Workflow Summary artifact
 * - Standard branch patterns
 */

// Define workflow steps ONCE - single source of truth
const renewalSteps = [
  {
    id: "start-planning",
    title: "Start Planning",
    description: "Begin renewal planning process",
    status: 'pending' as const,
    workflowBranch: "expansion",
    icon: "🚀"
  },
  {
    id: "review-contract",
    title: "Review Contract",
    description: "Analyze current contract terms and conditions",
    status: 'pending' as const,
    workflowBranch: "contract-planning",
    icon: "📋"
  },
  {
    id: "set-price",
    title: "Set Price",
    description: "Determine renewal pricing strategy",
    status: 'pending' as const,
    workflowBranch: "contract-review",
    icon: "💰"
  },
  {
    id: "confirm-contacts",
    title: "Confirm Contacts",
    description: "Verify decision makers and stakeholders",
    status: 'pending' as const,
    workflowBranch: "email-flow",
    icon: "👥"
  },
  {
    id: "send-renewal-notice",
    title: "Send Renewal Notice",
    description: "Send renewal notification to customer",
    status: 'pending' as const,
    workflowBranch: "email-flow",
    icon: "📧"
  },
  {
    id: "review-action-items",
    title: "Review Action Items",
    description: "Final review of all renewal activities",
    status: 'pending' as const,
    workflowBranch: "summary",
    icon: "✅"
  }
];

const slide1 = createInitialContactSlide({
  initialMessage: {
    text: "Hi {{user.first}}! Dynamic Corp's renewal is coming up on February 27th, which means we have about a week to decide if we're going to increase their license fees. Shall we make a plan? It should take about <b>7 minutes</b>.",
    buttons: [
      { label: "Start Planning", value: "plan", "label-background": "#3b82f6", "label-text": "#ffffff" },
      { label: "Snooze", value: "snooze", "label-background": "#f3f4f6", "label-text": "#374151" },
      { label: "Skip this workflow", value: "skip", "label-background": "#f3f4f6", "label-text": "#374151" }
    ],
    nextBranches: {
      'plan': 'expansion',
      'snooze': 'snooze',
      'skip': 'skip'
    }
  },
  sidePanel: createSidePanel({
    title: "Renewal Planning",
    subtitle: "Dynamic Corp - 6 Steps",
    icon: "📋",
    steps: renewalSteps
  }),
  artifacts: [
    // Planning Checklist - shows renewal steps
    {
      ...createPlanningChecklistArtifact({
        id: 'planning-checklist-renewal',
        title: 'Renewal Planning Checklist',
        description: "Let's systematically prepare for Dynamic Corp's renewal:",
        items: [
          { id: 'start-planning', label: 'Start planning', completed: false },
          { id: 'review-contract', label: 'Review contract', completed: false },
          { id: 'set-price', label: 'Set price', completed: false },
          { id: 'confirm-contacts', label: 'Confirm contacts', completed: false },
          { id: 'send-renewal-notice', label: 'Send renewal notice', completed: false },
          { id: 'review-action-items', label: 'Review action items', completed: false }
        ],
        showActions: true,
        visible: false
      })
    },
    // Contract Artifact - contract details
    {
      ...createContractArtifact({
        id: 'enterprise-contract',
        title: 'Contract Review',
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
        lastUpdated: 'January 15, 2025',
        visible: false
      })
    },
    // License Analysis
    {
      ...createLicenseAnalysisArtifact({
        id: 'license-analysis',
        title: 'License Analysis',
        currentTokens: 100000,
        currentUnitPrice: 7.25,
        renewalTokens: 150000,
        renewalUnitPrice: 7.25,
        earlyDiscountPercentage: 15,
        multiYearDiscountPercentage: 25,
        visible: false
      })
    },
    // Email Artifact - renewal outreach
    {
      ...createEmailArtifact({
        id: 'email-draft',
        title: 'Email Composer',
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

P.S. I've also prepared some usage analytics that I think you'll find valuable for your planning discussions.`,
        editable: true,
        visible: false
      })
    },
    // Workflow Summary
    {
      ...createWorkflowSummaryArtifact({
        id: 'workflow-summary',
        title: 'Workflow Summary',
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
        ],
        visible: false
      })
    }
  ],
  branches: {
    // Planning checklist display
    'expansion': {
      response: "Great! Let's review what we need to accomplish for the renewal planning:",
      actions: ['showArtifact', 'completeStep'],
      artifactId: 'planning-checklist-renewal',
      stepId: 'start-planning'
    },
    // Contract review flow
    'contract-planning': createContractReviewBranch({
      artifactId: 'enterprise-contract',
      showMenu: true,
      reviewLabel: 'Review contract terms',
      reviewBranch: 'contract-review',
      continueLabel: 'Continue to email',
      continueBranch: 'email-flow'
    }),
    'contract-review': createContractDetailsBranch({
      highlights: [
        '8% price cap',
        '60-day notice',
        'Multi-year discounts available'
      ],
      proceedBranch: 'email-flow',
      reviewMoreBranch: 'contract-planning'
    }),
    // Email flow
    'email-flow': createEmailFlowBranch({
      artifactId: 'email-draft',
      workingDelay: 3000,
      nextBranch: 'email-complete'
    }),
    'email-complete': createEmailCompleteBranch({
      recipientName: 'Michael Roberts',
      emailPurpose: 'with a request to meet',
      confirmBranch: 'email-confirmation',
      alternativeBranch: 'alternative-options'
    }),
    'email-confirmation': createWorkflowSummaryBranch({
      artifactId: 'workflow-summary'
    }),
    'alternative-options': {
      response: "No problem! What would you like to focus on instead?",
      buttons: [
        { label: 'Review expansion options', value: 'expansion' },
        { label: 'Analyze usage patterns', value: 'usage' },
        { label: 'Prepare renewal offer', value: 'renewal' },
        { label: 'Something else', value: 'free-chat' }
      ]
    },
    // Not ready / concerns flow
    ...createNotReadyConcernBranches({
      nextCustomerBranch: 'next-customer-action',
      continueBranch: 'contract-planning'
    }),
    // Navigation actions
    ...createSnoozeSkipBranches(),
    'exit-task-mode': createExitTaskModeBranch(),
    'next-customer-action': createNextCustomerBranch(),
    // Usage analysis
    'usage': {
      response: "Let me analyze their usage patterns for you. They're currently at 85% of their license capacity with consistent growth.",
      actions: ['showArtifact'],
      artifactId: 'usage-analysis'
    },
    // Renewal options
    'renewal': {
      response: "I'll help you prepare a compelling renewal offer. Which approach would you prefer?",
      buttons: [
        { label: 'Early renewal discount', value: 'early' },
        { label: 'Multi-year package', value: 'multi-year' },
        { label: 'Standard renewal', value: 'standard' }
      ]
    }
  },
  userTriggers: {
    ".*help.*": "help-flow",
    ".*renewal.*": "renewal",
    ".*expand.*|.*expansion.*": "expansion",
    ".*usage.*|.*analyze.*": "usage",
    ".*email.*|.*draft.*": "email-flow"
  }
});

/**
 * Slide 2: Needs Assessment
 *
 * Demonstrates same artifacts in different context
 */
const slide2 = createNeedsAssessmentSlide({
  initialMessage: {
    text: "Take a look at the contract to the right and let me know what you think.",
    buttons: [
      { label: "Looks good", value: "looks-good", "label-background": "#10b981", "label-text": "#ffffff" },
      { label: "Let's discuss", value: "lets-discuss", "label-background": "#f3f4f6", "label-text": "#374151" }
    ],
    nextBranches: {
      'looks-good': 'contract-planning',
      'lets-discuss': 'contract-review'
    }
  },
  artifacts: [
    // Re-use email artifact from slide 1 structure
    {
      ...createEmailArtifact({
        id: 'needs-email',
        title: 'Follow-up Email',
        to: 'michael.roberts@dynamiccorp.com',
        subject: 'Dynamic Corp - Needs Assessment Follow-up',
        body: `Hi Michael,

Following up on our initial conversation about the renewal...`,
        editable: true,
        visible: false
      })
    },
    // Workflow summary for needs assessment
    {
      ...createWorkflowSummaryArtifact({
        id: 'needs-summary',
        title: 'Needs Assessment Summary',
        customerName: 'Dynamic Corp',
        currentStage: 'Needs Assessment Complete',
        progressPercentage: 75,
        completedActions: ['Initial contact', 'Requirements gathered'],
        pendingActions: ['Prepare proposal'],
        nextSteps: ['Schedule follow-up'],
        visible: false
      })
    }
  ],
  branches: {
    'email-flow': createEmailFlowBranch({
      artifactId: 'needs-email',
      workingDelay: 3000,
      nextBranch: 'email-complete'
    }),
    'email-complete': createEmailCompleteBranch({
      recipientName: 'Michael Roberts',
      emailPurpose: 'regarding the needs assessment',
      confirmBranch: 'needs-summary-show'
    }),
    'needs-summary-show': createWorkflowSummaryBranch({
      artifactId: 'needs-summary'
    }),
    ...createSnoozeSkipBranches()
  },
  sidePanel: createSidePanel({
    title: "Needs Assessment",
    subtitle: "Dynamic Corp",
    steps: [
      {
        id: "needs-assessment",
        title: "Complete Assessment",
        description: "Gather and document requirements",
        workflowBranch: "email-flow"
      }
    ]
  })
});

/**
 * Slide 3: Pricing Strategy (NEW - Demonstrates Pricing Analysis artifact)
 */
const slide3 = createPricingStrategySlide({
  artifacts: [
    {
      ...createPricingAnalysisArtifact({
        id: 'pricing-strategy',
        title: 'Q4 Pricing Analysis',
        customerName: 'Dynamic Corp',
        currentPrice: 725000,
        currentARR: 725000,
        pricePerUnit: 7.25,
        unitType: 'license/month',
        comparativeAnalysis: {
          averagePrice: 8.50,
          percentile: 35,
          similarCustomerCount: 47
        },
        usageMetrics: {
          currentUsage: 85,
          usageGrowth: 65,
          usageEfficiency: 92
        },
        riskFactors: [
          {
            title: 'Price Sensitivity',
            description: 'Customer currently pays below market average',
            impact: 'medium'
          }
        ],
        opportunities: [
          {
            title: 'Growth Trajectory',
            description: '65% YoY growth indicates expansion capacity',
            potential: 'high'
          },
          {
            title: 'Series C Funding',
            description: 'Recent funding provides budget flexibility',
            potential: 'high'
          }
        ],
        recommendation: {
          priceIncrease: 8,
          newAnnualPrice: 783000,
          reasons: [
            'Aligns with market rates',
            'Justified by growth and value delivered',
            'Funding provides budget capacity'
          ]
        },
        visible: false
      })
    },
    {
      ...createQuoteArtifact({
        id: 'renewal-quote',
        title: 'Renewal Quote',
        quoteNumber: 'Q-2024-DYN-001',
        customerName: 'Dynamic Corp',
        customerContact: 'Michael Roberts',
        validUntil: '2026-03-31',
        lineItems: [
          {
            description: 'Enterprise License - Year 1',
            quantity: 150000,
            unitPrice: 7.25,
            total: 1087500
          },
          {
            description: 'Priority APAC Support',
            quantity: 1,
            unitPrice: 50000,
            total: 50000
          }
        ],
        discountPercentage: 15,
        taxRate: 0,
        terms: 'Net 30 payment terms. Multi-year discount applied.',
        visible: false
      })
    }
  ],
  branches: {
    'view-pricing': createPricingAnalysisBranch({
      artifactId: 'pricing-strategy',
      acceptBranch: 'show-quote',
      adjustBranch: 'pricing-adjustment',
      reviewBranch: 'pricing-details'
    }),
    'show-quote': {
      response: "Here's the formal quote based on our pricing analysis:",
      actions: ['showArtifact'],
      artifactId: 'renewal-quote'
    },
    'pricing-adjustment': {
      response: "Let's adjust the pricing strategy. What would you like to change?",
      buttons: [
        { label: 'Increase discount', value: 'increase-discount' },
        { label: 'Adjust base price', value: 'adjust-price' },
        { label: 'Add services', value: 'add-services' }
      ]
    },
    ...createSnoozeSkipBranches()
  }
});

/**
 * Slide 4: Contact Planning (NEW - Demonstrates Contact Strategy artifact)
 */
const slide4 = createContactPlanningSlide({
  artifacts: [
    {
      ...createContactStrategyArtifact({
        id: 'contact-strategy',
        title: 'Stakeholder Engagement Strategy',
        primaryContact: {
          name: 'Michael Roberts',
          role: 'CTO',
          email: 'michael.roberts@dynamiccorp.com',
          influenceLevel: 'high',
          engagement: 'weekly'
        },
        stakeholders: [
          {
            name: 'Sarah Chen',
            role: 'CFO',
            email: 'sarah.chen@dynamiccorp.com',
            influenceLevel: 'high',
            priority: 1,
            talkingPoints: ['Budget implications', 'ROI analysis', 'Multi-year savings'],
            nextAction: 'Schedule cost-benefit review meeting'
          },
          {
            name: 'David Kim',
            role: 'VP Engineering',
            email: 'david.kim@dynamiccorp.com',
            influenceLevel: 'medium',
            priority: 2,
            talkingPoints: ['Technical requirements', 'APAC support', 'API capabilities'],
            nextAction: 'Technical consultation call'
          }
        ],
        timeline: [
          {
            date: '2026-02-15',
            contact: 'Michael Roberts',
            action: 'Initial renewal discussion',
            status: 'completed'
          },
          {
            date: '2026-02-22',
            contact: 'Sarah Chen',
            action: 'Financial review meeting',
            status: 'planned'
          },
          {
            date: '2026-02-28',
            contact: 'David Kim',
            action: 'Technical requirements review',
            status: 'planned'
          }
        ],
        strategy: 'Multi-threaded approach targeting technical, financial, and executive stakeholders',
        visible: false
      })
    }
  ],
  branches: {
    'view-strategy': createContactStrategyBranch({
      artifactId: 'contact-strategy',
      proceedBranch: 'execute-outreach',
      modifyBranch: 'adjust-strategy'
    }),
    'execute-outreach': {
      response: "Great! I'll track the stakeholder outreach according to the strategy.",
      buttons: [
        { label: 'View next steps', value: 'next-steps' },
        { label: 'Schedule meetings', value: 'schedule-meetings' }
      ]
    },
    ...createSnoozeSkipBranches()
  }
});

/**
 * Slide 5: Plan Summary (NEW - Demonstrates Plan Summary artifact)
 */
const slide5 = createPlanSummarySlide({
  artifacts: [
    {
      ...createPlanSummaryArtifact({
        id: 'complete-plan',
        title: 'Dynamic Corp Renewal Plan - Complete Summary',
        executiveSummary: 'Comprehensive multi-year renewal strategy leveraging 65% growth trajectory, Series C funding, and APAC expansion to secure premium pricing with strategic stakeholder engagement.',
        objectives: [
          'Secure multi-year commitment with 15% discount incentive',
          'Increase ARR from $725K to $1.09M (50% growth)',
          'Establish Dynamic Corp as reference customer for APAC expansion',
          'Lock in premium pricing ahead of Series D funding round'
        ],
        actionItems: [
          {
            task: 'Financial review meeting with Sarah Chen (CFO)',
            owner: 'CSM',
            deadline: '2026-02-22',
            status: 'pending',
            priority: 'high'
          },
          {
            task: 'Technical consultation with David Kim (VP Engineering)',
            owner: 'Solutions Engineer',
            deadline: '2026-02-28',
            status: 'pending',
            priority: 'high'
          },
          {
            task: 'Executive alignment call with Michael Roberts (CTO)',
            owner: 'CSM',
            deadline: '2026-03-05',
            status: 'pending',
            priority: 'high'
          },
          {
            task: 'Finalize and send formal renewal quote',
            owner: 'CSM',
            deadline: '2026-03-10',
            status: 'pending',
            priority: 'medium'
          },
          {
            task: 'Secure verbal commitment',
            owner: 'CSM',
            deadline: '2026-03-20',
            status: 'pending',
            priority: 'high'
          }
        ],
        successMetrics: [
          {
            metric: 'ARR Growth',
            target: '$1,087,500',
            current: '$725,000'
          },
          {
            metric: 'Contract Length',
            target: '3 years',
            current: '1 year'
          },
          {
            metric: 'Stakeholder Engagement',
            target: '3 key decision makers',
            current: '1 engaged'
          }
        ],
        risks: [
          {
            risk: 'Budget constraints despite funding',
            mitigation: 'Emphasize multi-year discount and payment flexibility options',
            severity: 'medium'
          },
          {
            risk: 'Competitive pressure during renewal cycle',
            mitigation: 'Early engagement and value demonstration, lock in before competitors engage',
            severity: 'medium'
          }
        ],
        timeline: [
          {
            phase: 'Stakeholder Engagement',
            startDate: '2026-02-15',
            endDate: '2026-03-05',
            milestones: ['CFO meeting', 'VP Eng consultation', 'CTO alignment']
          },
          {
            phase: 'Proposal & Negotiation',
            startDate: '2026-03-05',
            endDate: '2026-03-20',
            milestones: ['Quote delivery', 'Terms discussion', 'Verbal commitment']
          },
          {
            phase: 'Contract Execution',
            startDate: '2026-03-20',
            endDate: '2026-04-15',
            milestones: ['Legal review', 'Contract signature', 'Implementation kickoff']
          }
        ],
        visible: false
      })
    }
  ],
  branches: {
    'view-summary': createPlanSummaryBranch({
      artifactId: 'complete-plan',
      completeBranch: 'plan-finalized',
      reviseBranch: 'revise-plan'
    }),
    'plan-finalized': {
      response: "Excellent! The complete renewal plan has been documented and is ready for execution. All stakeholders have been identified, pricing is optimized, and action items are tracked.",
      buttons: [
        { label: 'Next Customer', value: 'next-customer-action' },
        { label: 'Export Plan', value: 'export-plan' }
      ]
    },
    'next-customer-action': createNextCustomerBranch(),
    ...createSnoozeSkipBranches()
  }
});

/**
 * Main Workflow Configuration
 *
 * Combines all slides into a complete workflow with customer overview and analytics
 */
export const dynamicChatAITemplated: WorkflowConfig = {
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
        value: '$7.25',
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
    features: {
      attachments: false,
      voiceRecording: false,
      designMode: false,
      editMode: false,
      artifactsToggle: true
    }
  },
  artifacts: {
    sections: []
  },
  slides: [slide1, slide2, slide3, slide4, slide5]
};

/**
 * Export templated version as main export
 */
export default dynamicChatAITemplated;
