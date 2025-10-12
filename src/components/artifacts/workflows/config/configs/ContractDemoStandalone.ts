import { WorkflowConfig } from '../WorkflowConfig';

// Standalone version for testing
export const contractDemoStandaloneConfig: WorkflowConfig = {
  customer: {
    name: 'Enterprise Solutions Inc',
    nextCustomer: 'Corporate Systems Ltd'
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
        value: '$1,250,000',
        trend: 'up',
        trendValue: '+22%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$12.50',
        sublabel: '(enterprise tier)',
        status: 'green',
        trend: 'Premium pricing tier'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Aug 31, 2025',
        sublabel: '120 days',
        status: 'green'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'David Martinez',
        role: 'Chief Technology Officer'
      },
      riskScore: {
        label: 'Risk Score',
        value: '3.5/10',
        status: 'orange',
        sublabel: 'Some contract complexities'
      },
      growthScore: {
        label: 'Growth Score',
        value: '9.1/10',
        status: 'green',
        sublabel: 'Strong expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+31%',
        status: 'green',
        sparkData: [5, 6, 7, 8, 9, 10, 11],
        sublabel: 'Annual'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+8%',
        status: 'green',
        sparkData: [9, 9, 10, 10, 11, 11, 12],
        sublabel: 'Consistent growth'
      }
    }
  },
  analytics: {
    usageTrend: '{{chart.usageTrend.rising}}',
    userLicenses: '{{chart.userLicenses.rising}}',
    renewalInsights: {
      renewalStage: 'Contract Review',
      confidence: 78,
      recommendedAction: 'Review Contract Terms & Expansion',
      keyReasons: [
        { category: 'Usage', detail: 'Exceeding licensed capacity - immediate expansion needed' },
        { category: 'Contract', detail: 'Complex terms require careful review and negotiation' },
        { category: 'Growth', detail: 'Strong growth trajectory supports pricing discussions' },
        { category: 'Relationship', detail: 'Strong technical relationship with decision makers' }
      ]
    }
  },
  chat: {
    placeholder: 'Ask about contract terms, pricing, or business conditions...',
    aiGreeting: "Welcome to the Contract Overview Demo! I'll show you how our contract artifact helps manage complex enterprise agreements.",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "I'm sorry, I didn't understand that. Please try one of the available options or ask about contract features.",
      initialMessage: {
        text: "Welcome to the **Contract Overview Demo**! 📋\n\nThis demo showcases how our contract artifact helps CSMs understand and manage complex enterprise agreements. Enterprise Solutions Inc has a sophisticated contract with custom terms.\n\nWhat would you like to explore?",
        buttons: [
          { label: 'View contract overview', value: 'show-contract', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
          { label: 'See contract features', value: 'contract-features', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
        ],
        nextBranches: {
          'show-contract': 'display-contract',
          'contract-features': 'explain-features'
        }
      },
      branches: {
        'display-contract': {
          response: "Here's the **Enterprise Solutions Inc Contract Overview**. Notice how it organizes complex contract information into clear sections: financial summary, business terms by category, and risk indicators.",
          delay: 1,
          actions: ['showArtifact', 'showMenu'],
          artifactId: 'enterprise-contract',
          buttons: [
            { label: 'Explore contract details', value: 'contract-interaction', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Complete this demo', value: 'complete-demo', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
          ],
          nextBranches: {
            'contract-interaction': 'contract-interaction',
            'complete-demo': 'demo-complete'
          }
        },
        'contract-interaction': {
          response: "Excellent! You can see how the contract artifact organizes complex enterprise terms into manageable categories. Each section provides clear visibility into contract complexity, risks, and business terms to help CSMs navigate renewal discussions effectively.",
          delay: 1,
          buttons: [
            { label: 'Complete this demo', value: 'complete-demo', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'complete-demo': 'demo-complete'
          }
        },
        'explain-features': {
          response: "**Contract Artifact Key Features:**\n\n📊 **Financial Summary** - Contract value, renewal date, base pricing\n🏢 **Business Terms Categorization** - Organized by risk and complexity\n⚠️ **Risk Level Indicators** - Color-coded visual risk assessment\n💡 **Pricing Transparency** - Breakdown of all pricing components\n🔗 **PDF Integration** - Direct access to full contract documents\n📈 **Smart Insights** - AI-powered contract analysis and recommendations\n\nReady to see these in action?",
          delay: 1,
          buttons: [
            { label: 'Show enterprise contract', value: 'show-contract', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'View editable document', value: 'show-document', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'show-contract': 'display-contract',
            'show-document': 'display-document'
          }
        },
        'display-document': {
          response: "Here's the **Contract Document** with double-click-to-edit functionality. You can edit any field by double-clicking on it - just like Salesforce! Notice how it automatically detects field types (currency, dates, emails) and provides appropriate validation.",
          delay: 1,
          actions: ['showArtifact', 'showMenu'],
          artifactId: 'enterprise-contract-document',
          buttons: [
            { label: 'Try editing some fields', value: 'document-interaction', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Complete this demo', value: 'complete-demo', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
          ],
          nextBranches: {
            'document-interaction': 'document-interaction',
            'complete-demo': 'demo-complete'
          }
        },
        'document-interaction': {
          response: "Excellent! The document type provides Salesforce-like editing with:\n\n• **Double-click to edit** any field\n• **Smart field detection** (currency, dates, emails)\n• **Automatic validation** with error messages\n• **Keyboard shortcuts** (Enter to save, Escape to cancel)\n• **Read-only mode** when `readOnly: true`\n\nThis makes it perfect for contract editing, customer records, or any structured document!",
          delay: 1,
          buttons: [
            { label: 'Complete this demo', value: 'complete-demo', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'complete-demo': 'demo-complete'
          }
        },
        'demo-complete': {
          response: "🎉 **Contract Demo Complete!**\n\nYou've explored how the Contract artifact helps manage complex enterprise agreements:\n\n• **Organized Information** - Clear categorization of terms and conditions\n• **Risk Assessment** - Visual indicators and detailed analysis\n• **Pricing Transparency** - Complete breakdown of contract value\n• **Business Intelligence** - Insights for better renewal planning\n\nThis artifact is essential for managing enterprise contracts with confidence!",
          delay: 1,
          buttons: [
            { label: 'Restart demo', value: 'restart', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ]
        },
        'skip': { subflow: 'common.skip' },
        'snooze': { subflow: 'common.snooze' },
        'exit-task-mode': {
          response: "Task mode closed. You can reopen it anytime from the dashboard.",
          actions: ['exitTaskMode']
        },
        'next-customer-action': {
          response: "Moving to the next customer...",
          actions: ['nextCustomer']
        }
      }
    },
    features: {
      attachments: false,
      voiceRecording: false,
      designMode: false,
      editMode: true,
      artifactsToggle: true
    }
  },
  artifacts: {
    sections: [
      {
        id: 'enterprise-contract',
        title: 'Enterprise Contract Overview',
        type: 'contract',
        visible: false,
        data: {
          contractId: 'ENT-2024-0847',
          customerName: 'Enterprise Solutions Inc',
          contractValue: 1250000,
          renewalDate: 'August 31, 2025',
          signerBaseAmount: 1000000,
          pricingCalculation: {
            basePrice: 1000000,
            volumeDiscount: -150000,
            additionalServices: 400000,
            totalPrice: 1250000
          },
          businessTerms: {
            unsigned: [
              'Data processing amendment requiring legal review',
              'International data transfer addendum pending approval'
            ],
            nonStandardRenewal: [
              'Custom 18-month renewal cycle instead of standard 12-month',
              'Automatic renewal clause with 90-day opt-out provision'
            ],
            nonStandardPricing: [
              'Volume-based pricing tier with custom breakpoints',
              'Multi-year discount structure (15% for 2-year, 25% for 3-year)',
              'Professional services credits included in base pricing'
            ],
            pricingCaps: [
              'Annual price increases capped at 8% maximum',
              'No price increases for first 6 months of any renewal period'
            ],
            otherTerms: [
              'Dedicated technical account manager included',
              'Priority support with 2-hour response SLA',
              'Custom integration support and API rate limits',
              'Quarterly business reviews with executive sponsors'
            ]
          },
          riskLevel: 'medium',
          lastUpdated: 'December 15, 2024'
        }
      },
      {
        id: 'enterprise-contract-document',
        title: 'Contract Document (Editable)',
        type: 'document',
        visible: false,
        readOnly: false,
        data: {
          contractNumber: 'ENT-2024-0847',
          customerName: 'Enterprise Solutions Inc',
          contractValue: 1250000,
          renewalDate: '2025-08-31',
          signerEmail: 'david.martinez@enterprisesolutions.com',
          signerName: 'David Martinez',
          signerTitle: 'Chief Technology Officer',
          contractDetails: {
            startDate: '2024-09-01',
            endDate: '2025-08-31',
            paymentTerms: 'Net 30 days',
            billingFrequency: 'Annual',
            autoRenewal: true,
            notificationPeriod: 90
          },
          pricingStructure: {
            basePrice: 1000000,
            volumeDiscount: -150000,
            additionalServices: 400000,
            totalPrice: 1250000,
            priceIncreaseCapPercentage: 8,
            discountEligibility: 'Volume discounts apply for 2+ year terms'
          },
          legalTerms: {
            dataProcessingAddendum: 'Pending legal review',
            liabilityCap: '$2,500,000',
            indemnificationClause: 'Mutual indemnification for third-party claims',
            terminationClause: '90-day written notice required',
            governingLaw: 'State of California'
          },
          notes: 'Custom enterprise contract with special pricing tiers. Includes dedicated account management and priority support.'
        }
      }
    ]
  },
  sidePanel: {
    enabled: true,
    title: {
      text: "Contract Overview Demo",
      subtitle: "Enterprise Solutions Inc",
      icon: "📋"
    },
    steps: [
      {
        id: "demo-intro",
        title: "Demo Introduction",
        description: "Overview of contract artifact capabilities",
        status: "completed",
        workflowBranch: "initial",
        icon: "👋"
      },
      {
        id: "contract-analysis",
        title: "Contract Analysis",
        description: "Explore contract structure and business terms",
        status: "in-progress",
        workflowBranch: "display-contract",
        icon: "📊"
      },
      {
        id: "risk-assessment",
        title: "Risk Assessment",
        description: "Understand risk factors and mitigation strategies",
        status: "pending",
        workflowBranch: "risk-factors-detail",
        icon: "⚠️"
      },
      {
        id: "features-review",
        title: "Features Review",
        description: "Learn about contract artifact capabilities",
        status: "pending",
        workflowBranch: "explain-features",
        icon: "⚙️"
      }
    ],
    progressMeter: {
      currentStep: 2,
      totalSteps: 4,
      progressPercentage: 50,
      showPercentage: true,
      showStepNumbers: true
    },
    showProgressMeter: true,
    showSteps: true
  }
};