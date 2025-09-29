import { WorkflowConfig } from '../WorkflowConfig';

export const allArtifactsMasterDemo: WorkflowConfig = {
  customer: {
    name: 'Global Innovations Enterprise',
    nextCustomer: 'Next Demo Customer'
  },
  layout: {
    modalDimensions: { width: 90, height: 95, top: 2.5, left: 5 },
    dividerPosition: 55,
    chatWidth: 45,
    splitModeDefault: true
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$1,850,000',
        trend: 'up',
        trendValue: '+24%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$11.20',
        sublabel: '(enterprise tier)',
        status: 'green',
        trend: 'Premium pricing achieved'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Mar 31, 2025',
        sublabel: '90 days',
        status: 'orange'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Alexandra Chen',
        role: 'Chief Technology Officer'
      },
      riskScore: {
        label: 'Risk Score',
        value: '3.2/10',
        status: 'green',
        sublabel: 'Well-managed renewal'
      },
      growthScore: {
        label: 'Growth Score',
        value: '9.3/10',
        status: 'green',
        sublabel: 'Exceptional expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+35%',
        status: 'green',
        sparkData: [6, 7, 8, 9, 10, 11, 12],
        sublabel: 'Annual'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+9%',
        status: 'green',
        sparkData: [10, 10, 11, 11, 12, 12, 13],
        sublabel: 'Accelerating'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'Licensed Capacity',
      referenceLineHeight: 25,
      data: [15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35],
      chartMin: 10,
      chartMax: 40,
      chartContextLabel: '↗ +133% growth - exceeding capacity',
      chartContextColor: 'text-orange-600',
      dataColors: {
        threshold: 25,
        belowColor: 'bg-blue-500',
        aboveColor: 'bg-orange-500'
      }
    },
    userLicenses: {
      title: 'License Growth',
      showReferenceLine: true,
      referenceLineLabel: 'Budget Target',
      referenceLineHeight: 30,
      data: [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40],
      chartMin: 15,
      chartMax: 45,
      chartContextLabel: '↗ Strong expansion trajectory',
      chartContextColor: 'text-green-600',
      dataColors: { threshold: 30, belowColor: 'bg-green-500', aboveColor: 'bg-purple-500' }
    },
    renewalInsights: {
      renewalStage: 'Comprehensive Renewal Planning',
      confidence: 91,
      recommendedAction: 'Execute Full Artifact Workflow',
      keyReasons: [
        { category: 'Comprehensive Planning', detail: 'All workflow artifacts ready for systematic renewal execution' },
        { category: 'Strong Relationship', detail: 'Excellent stakeholder coverage across all business functions' },
        { category: 'Growth Trajectory', detail: 'Exceeding capacity with 35% YoY growth - prime expansion candidate' },
        { category: 'Market Position', detail: 'Premium pricing achieved with continued value realization' }
      ]
    }
  },
  chat: {
    placeholder: 'Ask about the comprehensive workflow or select an option to begin...',
    aiGreeting: "Welcome to the Complete Artifact Showcase! I'll guide you through a comprehensive renewal workflow using all our artifacts.",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "I'm sorry, I didn't understand that. Please try one of the available options or ask about the comprehensive workflow.",
      initialMessage: {
        text: "🎉 Welcome to the **Complete Artifact Showcase Demo**! \n\nThis comprehensive demo shows how all 5 artifacts work together in a realistic enterprise renewal workflow. Global Innovations Enterprise is an ideal candidate showcasing the full power of our integrated artifact system.\n\n**Artifacts in this demo:**\n• Planning Checklist\n• Contact Strategy \n• Contract Overview\n• Pricing Analysis\n• Plan Summary\n\nReady to see them all in action?",
        buttons: [
          { label: 'Start comprehensive workflow', value: 'start-workflow', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
          { label: 'Jump to specific artifact', value: 'artifact-menu', 'label-background': 'bg-purple-100', 'label-text': 'text-purple-800' },
          { label: 'See workflow overview', value: 'workflow-overview', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
        ],
        nextBranches: {
          'start-workflow': 'phase-1-planning',
          'artifact-menu': 'show-artifact-menu',
          'workflow-overview': 'explain-workflow'
        }
      },
      branches: {
        'explain-workflow': {
          response: "**Comprehensive Renewal Workflow Overview:**\n\n📋 **Phase 1: Planning** - Strategic checklist and timeline setup\n🤝 **Phase 2: Relationships** - Contact strategy and stakeholder management\n📄 **Phase 3: Contract Review** - Terms analysis and risk assessment\n💰 **Phase 4: Pricing Strategy** - Market analysis and optimization\n📊 **Phase 5: Execution Summary** - Progress tracking and next steps\n\nThis integrated approach ensures nothing falls through the cracks while maximizing renewal success. Ready to begin?",
          delay: 1,
          buttons: [
            { label: 'Start Phase 1: Planning', value: 'start-workflow', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Jump to specific phase', value: 'artifact-menu', 'label-background': 'bg-purple-100', 'label-text': 'text-purple-800' }
          ],
          nextBranches: {
            'start-workflow': 'phase-1-planning',
            'artifact-menu': 'show-artifact-menu'
          }
        },
        'phase-1-planning': {
          response: "🎯 **Phase 1: Strategic Planning**\n\nLet's start with our **Planning Checklist** to organize the renewal process systematically. This ensures we cover all critical areas for Global Innovations Enterprise's complex enterprise renewal.",
          delay: 1,
          actions: ['showArtifact'],
          artifactId: 'enterprise-planning-checklist',
          buttons: [
            { label: 'Complete planning phase', value: 'planning-complete', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Skip to Phase 2: Contacts', value: 'phase-2-contacts', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'See all phases menu', value: 'artifact-menu', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
          ],
          nextBranches: {
            'planning-complete': 'phase-2-contacts',
            'phase-2-contacts': 'phase-2-contacts',
            'artifact-menu': 'show-artifact-menu'
          }
        },
        'planning-complete': {
          response: "✅ **Planning Phase Complete!** \n\nExcellent work on the strategic planning. Now let's move to **Phase 2: Contact Strategy** to ensure we have the right stakeholder relationships for this enterprise renewal.",
          delay: 1,
          buttons: [
            { label: 'Continue to Phase 2', value: 'phase-2-contacts', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'phase-2-contacts': 'phase-2-contacts'
          }
        },
        'phase-2-contacts': {
          response: "🤝 **Phase 2: Contact Strategy & Relationship Management**\n\nNow let's review our **Contact Strategy** for Global Innovations. We need strong relationships across technical, executive, and financial stakeholders for this enterprise renewal.",
          delay: 1,
          actions: ['removeArtifact', 'showArtifact'],
          artifactId: 'enterprise-contact-strategy',
          buttons: [
            { label: 'Contacts look good', value: 'contacts-complete', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Skip to Phase 3: Contract', value: 'phase-3-contract', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Back to planning', value: 'phase-1-planning', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
          ],
          nextBranches: {
            'contacts-complete': 'phase-3-contract',
            'phase-3-contract': 'phase-3-contract',
            'phase-1-planning': 'phase-1-planning'
          }
        },
        'contacts-complete': {
          response: "✅ **Contact Strategy Complete!** \n\nGreat stakeholder coverage! Now let's move to **Phase 3: Contract Review** to understand the terms, risks, and opportunities in their current agreement.",
          delay: 1,
          buttons: [
            { label: 'Continue to Phase 3', value: 'phase-3-contract', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'phase-3-contract': 'phase-3-contract'
          }
        },
        'phase-3-contract': {
          response: "📄 **Phase 3: Contract Analysis & Risk Assessment**\n\nLet's examine the **Contract Overview** for Global Innovations. This enterprise agreement has some complexity we need to understand for renewal planning.",
          delay: 1,
          actions: ['removeArtifact', 'showArtifact'],
          artifactId: 'enterprise-contract-overview',
          buttons: [
            { label: 'Contract analysis complete', value: 'contract-complete', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Skip to Phase 4: Pricing', value: 'phase-4-pricing', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Back to contacts', value: 'phase-2-contacts', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
          ],
          nextBranches: {
            'contract-complete': 'phase-4-pricing',
            'phase-4-pricing': 'phase-4-pricing',
            'phase-2-contacts': 'phase-2-contacts'
          }
        },
        'contract-complete': {
          response: "✅ **Contract Analysis Complete!** \n\nGood understanding of the terms and risk factors. Now let's move to **Phase 4: Pricing Strategy** to optimize the financial aspects of this renewal.",
          delay: 1,
          buttons: [
            { label: 'Continue to Phase 4', value: 'phase-4-pricing', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'phase-4-pricing': 'phase-4-pricing'
          }
        },
        'phase-4-pricing': {
          response: "💰 **Phase 4: Pricing Strategy & Market Analysis**\n\nTime for **Pricing Analysis**! Global Innovations has exceptional growth and strong value realization - perfect for strategic pricing optimization and expansion discussions.",
          delay: 1,
          actions: ['removeArtifact', 'showArtifact'],
          artifactId: 'enterprise-pricing-analysis',
          buttons: [
            { label: 'Pricing strategy complete', value: 'pricing-complete', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Skip to Phase 5: Summary', value: 'phase-5-summary', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Back to contract', value: 'phase-3-contract', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
          ],
          nextBranches: {
            'pricing-complete': 'phase-5-summary',
            'phase-5-summary': 'phase-5-summary',
            'phase-3-contract': 'phase-3-contract'
          }
        },
        'pricing-complete': {
          response: "✅ **Pricing Strategy Complete!** \n\nExcellent optimization opportunities identified! Now let's move to **Phase 5: Plan Summary** to consolidate everything we've accomplished and plan our execution.",
          delay: 1,
          buttons: [
            { label: 'Continue to Phase 5', value: 'phase-5-summary', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'phase-5-summary': 'phase-5-summary'
          }
        },
        'phase-5-summary': {
          response: "📊 **Phase 5: Comprehensive Plan Summary & Execution Planning**\n\nFinally, let's review our **Plan Summary** that consolidates all the work we've done across planning, contacts, contract analysis, and pricing strategy. This provides a complete view of our accomplishments and next steps.",
          delay: 1,
          actions: ['removeArtifact', 'showArtifact'],
          artifactId: 'comprehensive-plan-summary',
          buttons: [
            { label: 'Workflow complete!', value: 'workflow-complete', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Review specific phase', value: 'artifact-menu', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Back to pricing', value: 'phase-4-pricing', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
          ],
          nextBranches: {
            'workflow-complete': 'final-summary',
            'artifact-menu': 'show-artifact-menu',
            'phase-4-pricing': 'phase-4-pricing'
          }
        },
        'show-artifact-menu': {
          response: "🎯 **Artifact Navigation Menu** \n\nJump directly to any phase of the comprehensive workflow:\n\n📋 **Planning Checklist** - Strategic renewal planning and timeline\n🤝 **Contact Strategy** - Stakeholder mapping and relationship management\n📄 **Contract Overview** - Terms analysis and risk assessment\n💰 **Pricing Analysis** - Market positioning and optimization strategy\n📊 **Plan Summary** - Comprehensive progress tracking and next steps\n\nWhich artifact would you like to explore?",
          delay: 1,
          buttons: [
            { label: 'Planning Checklist', value: 'phase-1-planning', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Contact Strategy', value: 'phase-2-contacts', 'label-background': 'bg-purple-100', 'label-text': 'text-purple-800' },
            { label: 'Contract Overview', value: 'phase-3-contract', 'label-background': 'bg-orange-100', 'label-text': 'text-orange-800' },
            { label: 'Pricing Analysis', value: 'phase-4-pricing', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Plan Summary', value: 'phase-5-summary', 'label-background': 'bg-yellow-100', 'label-text': 'text-yellow-800' }
          ],
          nextBranches: {
            'phase-1-planning': 'phase-1-planning',
            'phase-2-contacts': 'phase-2-contacts',
            'phase-3-contract': 'phase-3-contract',
            'phase-4-pricing': 'phase-4-pricing',
            'phase-5-summary': 'phase-5-summary'
          }
        },
        'final-summary': {
          response: "🎉 **Comprehensive Artifact Workflow Complete!** \n\nYou've successfully navigated through all 5 artifacts in an integrated enterprise renewal workflow:\n\n✅ **Planning Checklist** - Strategic framework established\n✅ **Contact Strategy** - Stakeholder relationships mapped and optimized\n✅ **Contract Overview** - Terms analyzed and risks assessed\n✅ **Pricing Analysis** - Market-aligned optimization strategy developed\n✅ **Plan Summary** - Comprehensive execution plan with clear next steps\n\n**Result:** A systematic, data-driven approach to enterprise renewal management that maximizes success while ensuring nothing falls through the cracks!\n\nThis integrated artifact system transforms complex renewals into manageable, trackable workflows.",
          delay: 1,
          actions: ['showFinalSlide'],
          buttons: [
            { label: 'Restart full demo', value: 'restart', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Review specific artifact', value: 'artifact-menu', 'label-background': 'bg-purple-100', 'label-text': 'text-purple-800' },
            { label: 'Exit demo', value: 'exit', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
          ]
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
        id: 'enterprise-planning-checklist',
        title: 'Enterprise Renewal Planning Checklist',
        type: 'planning-checklist',
        visible: false,
        content: {
          description: "Comprehensive planning checklist for Global Innovations Enterprise renewal:",
          items: [
            { id: 'stakeholder-mapping', label: 'Complete comprehensive stakeholder mapping across all business units', completed: false },
            { id: 'usage-analysis', label: 'Analyze platform adoption and growth patterns across enterprise', completed: false },
            { id: 'roi-documentation', label: 'Document ROI metrics and business value realization', completed: false },
            { id: 'contract-review', label: 'Review current enterprise agreement terms and conditions', completed: false },
            { id: 'competitive-analysis', label: 'Assess competitive landscape and differentiation factors', completed: false },
            { id: 'pricing-strategy', label: 'Develop market-aligned pricing and expansion strategy', completed: false },
            { id: 'technical-roadmap', label: 'Align product roadmap with customer technical requirements', completed: false },
            { id: 'executive-engagement', label: 'Schedule executive stakeholder meetings and presentations', completed: false },
            { id: 'renewal-timeline', label: 'Establish detailed renewal timeline and milestone tracking', completed: false }
          ],
          showActions: true
        }
      },
      {
        id: 'enterprise-contact-strategy',
        title: 'Enterprise Contact Strategy',
        type: 'custom',
        visible: false,
        editable: true,
        content: {
          component: 'ContactStrategyArtifact',
          props: {
            title: 'Enterprise Contact Strategy',
            subtitle: 'Comprehensive stakeholder map for Global Innovations Enterprise',
            contacts: [
              {
                id: 'contact-1',
                name: 'Alexandra Chen',
                role: 'Chief Technology Officer',
                email: 'alexandra.chen@globalinnovations.com',
                type: 'executive',
                lastMeeting: '2 weeks ago',
                meetingStatus: 'recent',
                strategy: 'Executive sponsor and technical champion. Focus on strategic technology vision, competitive differentiation, and long-term partnership value.',
                updates: 'Strong advocate for platform expansion - key decision maker for enterprise renewal'
              },
              {
                id: 'contact-2',
                name: 'Robert Kim',
                role: 'Chief Financial Officer',
                email: 'robert.kim@globalinnovations.com',
                type: 'executive',
                lastMeeting: '3 weeks ago',
                meetingStatus: 'recent',
                strategy: 'Budget authority and financial decision maker. Emphasize ROI metrics, cost efficiency, and strategic investment value.',
                updates: 'Focused on maximizing platform ROI - supportive of expansion with clear business case'
              },
              {
                id: 'contact-3',
                name: 'Maria Santos',
                role: 'VP of Engineering',
                email: 'maria.santos@globalinnovations.com',
                type: 'business',
                lastMeeting: '1 week ago',
                meetingStatus: 'recent',
                strategy: 'Technical implementation lead and day-to-day platform advocate. Focus on feature roadmap, integration capabilities, and team productivity.',
                updates: 'Highly engaged technical leader - drives adoption across engineering teams'
              },
              {
                id: 'contact-4',
                name: 'James Wilson',
                role: 'VP of Operations',
                email: 'james.wilson@globalinnovations.com',
                type: 'business',
                lastMeeting: '10 days ago',
                meetingStatus: 'recent',
                strategy: 'Operations efficiency champion. Highlight process improvements, scalability benefits, and operational cost savings.',
                updates: 'Strong supporter of platform expansion for operational excellence initiatives'
              },
              {
                id: 'contact-5',
                name: 'Sarah Davis',
                role: 'Senior Solutions Architect',
                email: 'sarah.davis@globalinnovations.com',
                type: 'technical',
                lastMeeting: '5 days ago',
                meetingStatus: 'recent',
                strategy: 'Technical integration expert and platform power user. Provide advanced feature training, API support, and architectural guidance.',
                updates: 'Platform expert driving advanced integrations - excellent technical relationship'
              }
            ],
            showActions: true
          }
        }
      },
      {
        id: 'enterprise-contract-overview',
        title: 'Enterprise Contract Overview',
        type: 'contract',
        visible: false,
        data: {
          contractId: 'ENT-2024-1127',
          customerName: 'Global Innovations Enterprise',
          contractValue: 1850000,
          renewalDate: 'March 31, 2025',
          signerBaseAmount: 1500000,
          pricingCalculation: {
            basePrice: 1500000,
            volumeDiscount: -225000,
            additionalServices: 575000,
            totalPrice: 1850000
          },
          businessTerms: {
            unsigned: [
              'International data residency addendum pending legal review'
            ],
            nonStandardRenewal: [
              'Custom 24-month renewal cycle with performance milestones',
              'Automatic renewal with 120-day notice period'
            ],
            nonStandardPricing: [
              'Enterprise volume pricing with custom tier breakpoints',
              'Professional services credits pool included in base contract',
              'Multi-year discount structure: 12% for 2-year, 22% for 3-year commitment'
            ],
            pricingCaps: [
              'Annual price increases capped at 10% maximum',
              'Price protection for first 12 months of any renewal period'
            ],
            otherTerms: [
              'Dedicated customer success manager and technical account manager',
              'Priority support with 1-hour response SLA for critical issues',
              'Quarterly executive business reviews with C-level participation',
              'Custom API rate limits and dedicated infrastructure resources',
              'Advanced security and compliance certifications included'
            ]
          },
          riskLevel: 'medium',
          lastUpdated: 'December 28, 2024'
        }
      },
      {
        id: 'enterprise-pricing-analysis',
        title: 'Enterprise Pricing Analysis',
        type: 'custom',
        visible: false,
        content: {
          component: 'PricingAnalysisArtifact',
          props: {
            title: 'Enterprise Pricing Strategy Analysis',
            customerName: 'Global Innovations Enterprise',
            currentPrice: 1850000,
            currentARR: 1850000,
            pricePerUnit: 11.20,
            unitType: 'seat/month',
            comparativeAnalysis: {
              averagePrice: 10.80,
              percentile: 78,
              similarCustomerCount: 45
            },
            usageMetrics: {
              currentUsage: 165,
              usageGrowth: 133,
              usageEfficiency: 94
            },
            riskFactors: [
              {
                title: 'Enterprise Contract Complexity',
                description: 'Complex terms and custom pricing may require careful negotiation',
                impact: 'medium'
              },
              {
                title: 'Multi-Stakeholder Decision Process',
                description: 'Multiple C-level stakeholders involved in pricing decisions',
                impact: 'low'
              }
            ],
            opportunities: [
              {
                title: 'Capacity Expansion Required',
                description: 'Currently exceeding licensed capacity by 65% - immediate expansion justified',
                potential: 'high'
              },
              {
                title: 'Premium Service Tier Migration',
                description: 'Strong usage patterns support enterprise premium tier positioning',
                potential: 'high'
              },
              {
                title: 'Multi-Year Strategic Partnership',
                description: 'Long-term commitment opportunity with enhanced service levels',
                potential: 'high'
              },
              {
                title: 'Additional Business Unit Expansion',
                description: 'Opportunity to expand platform to additional corporate divisions',
                potential: 'medium'
              }
            ],
            recommendation: {
              priceIncrease: 18,
              newAnnualPrice: 2183000,
              reasons: [
                'Capacity expansion required for 65% over-usage justifies immediate pricing adjustment',
                'Strong enterprise relationships and value realization support premium positioning',
                'Market benchmarking indicates opportunity for enterprise tier optimization',
                'Exceptional 35% YoY growth demonstrates strong ROI and business value',
                'Multi-year strategic partnership framework supports enhanced pricing model'
              ]
            }
          }
        }
      },
      {
        id: 'comprehensive-plan-summary',
        title: 'Comprehensive Renewal Plan Summary',
        type: 'custom',
        visible: false,
        content: {
          component: 'PlanSummaryArtifact',
          props: {
            customerName: 'Global Innovations Enterprise',
            workflowType: 'Comprehensive Enterprise Renewal',
            currentStage: 'Ready for Execution - All Phases Complete',
            progressPercentage: 95,
            startDate: 'December 1, 2024',
            lastUpdated: 'December 28, 2024',
            completedTasks: [
              {
                id: 'task-1',
                title: 'Strategic Planning Checklist Completion',
                description: 'Completed comprehensive 9-point enterprise renewal planning checklist',
                completedDate: 'December 10, 2024',
                owner: 'Renewal Team',
                category: 'Strategic Planning',
                impact: 'High - Established systematic approach to complex enterprise renewal'
              },
              {
                id: 'task-2',
                title: 'Enterprise Stakeholder Mapping & Engagement',
                description: 'Mapped and engaged 5 key stakeholders across executive, business, and technical functions',
                completedDate: 'December 15, 2024',
                owner: 'Customer Success Team',
                category: 'Relationship Management',
                impact: 'Critical - Secured comprehensive stakeholder coverage and support'
              },
              {
                id: 'task-3',
                title: 'Contract Terms Analysis & Risk Assessment',
                description: 'Reviewed complex enterprise agreement terms, identified risks and optimization opportunities',
                completedDate: 'December 20, 2024',
                owner: 'Legal & Contract Team',
                category: 'Contract Management',
                impact: 'High - Clear understanding of contract complexities and negotiation points'
              },
              {
                id: 'task-4',
                title: 'Market-Aligned Pricing Strategy Development',
                description: 'Developed comprehensive pricing analysis with 18% optimization recommendation',
                completedDate: 'December 25, 2024',
                owner: 'Pricing Strategy Team',
                category: 'Revenue Optimization',
                impact: 'Critical - $333K ARR expansion opportunity identified and validated'
              },
              {
                id: 'task-5',
                title: 'Comprehensive ROI Documentation',
                description: 'Compiled detailed business value metrics showing 280% platform ROI',
                completedDate: 'December 27, 2024',
                owner: 'Business Value Team',
                category: 'Value Demonstration',
                impact: 'High - Strong financial justification for expansion and pricing optimization'
              }
            ],
            accomplishments: [
              '✅ Completed systematic enterprise renewal planning across all critical dimensions',
              '✅ Secured engagement with 5 key stakeholders including CTO, CFO, and VPs',
              '✅ Documented 280% ROI with clear business value metrics and growth trajectory',
              '✅ Identified $333K expansion opportunity through capacity and pricing optimization',
              '✅ Analyzed complex contract terms and developed risk mitigation strategies',
              '✅ Achieved premium pricing position with market-aligned enterprise tier strategy',
              '✅ Established multi-year strategic partnership framework for long-term growth',
              '✅ Integrated all artifact insights into cohesive renewal execution plan'
            ],
            nextSteps: [
              {
                id: 'next-1',
                title: 'Executive Renewal Presentation',
                description: 'Present comprehensive renewal proposal to CTO and CFO with full artifact support',
                dueDate: 'January 10, 2025',
                owner: 'Strategic Account Team',
                priority: 'Critical',
                estimatedHours: 16,
                dependencies: ['Presentation materials finalization', 'Executive calendar coordination']
              },
              {
                id: 'next-2',
                title: 'Contract Terms Negotiation',
                description: 'Negotiate enterprise contract renewal terms with legal and procurement teams',
                dueDate: 'January 25, 2025',
                owner: 'Legal & Contracts Team',
                priority: 'Critical',
                estimatedHours: 40,
                dependencies: ['Pricing approval', 'Terms framework agreement']
              },
              {
                id: 'next-3',
                title: 'Technical Expansion Planning',
                description: 'Plan infrastructure scaling and feature rollout for capacity expansion',
                dueDate: 'February 5, 2025',
                owner: 'Technical Account Management',
                priority: 'High',
                estimatedHours: 24,
                dependencies: ['Contract execution', 'Capacity requirements finalization']
              },
              {
                id: 'next-4',
                title: 'Multi-Year Partnership Framework',
                description: 'Establish strategic partnership agreement and governance structure',
                dueDate: 'February 15, 2025',
                owner: 'Strategic Partnerships Team',
                priority: 'Medium',
                estimatedHours: 20,
                dependencies: ['Contract renewal completion', 'Executive alignment']
              }
            ],
            integrationStatus: {
              salesforce: {
                status: 'connected',
                lastSync: '30 seconds ago',
                description: 'Enterprise account data and renewal pipeline synchronized'
              },
              projectTracking: {
                status: 'connected',
                lastSync: '2 minutes ago',
                description: 'All artifact workflows and task progress tracked'
              },
              communicationPlatforms: {
                status: 'connected',
                lastSync: '1 minute ago',
                description: 'Stakeholder notifications and executive updates automated'
              },
              financialSystems: {
                status: 'connected',
                lastSync: '5 minutes ago',
                description: 'Revenue projections and contract value tracking synchronized'
              },
              legalSystems: {
                status: 'connected',
                lastSync: '10 minutes ago',
                description: 'Contract terms and compliance tracking integrated'
              }
            },
            keyMetrics: {
              tasksCompleted: 18,
              totalTasks: 19,
              daysInProgress: 27,
              stakeholdersEngaged: 5,
              expansionValue: '$333,000',
              confidenceScore: 95,
              artifactsUsed: 5,
              workflowEfficiency: '92%'
            },
            recommendations: [
              'Execute renewal presentation immediately - all stakeholders aligned and ready',
              'Leverage strong ROI metrics and relationship foundation for pricing optimization',
              'Consider accelerated contract process to capture Q1 expansion revenue',
              'Use comprehensive artifact documentation to support executive decision making',
              'Establish this renewal as template for future enterprise accounts'
            ]
          }
        }
      }
    ]
  },
  sidePanel: {
    enabled: true,
    title: {
      text: "Complete Artifact Showcase",
      subtitle: "Global Innovations Enterprise",
      icon: "🎯"
    },
    steps: [
      {
        id: "phase-1-planning",
        title: "Strategic Planning",
        description: "Comprehensive renewal planning checklist",
        status: "completed",
        workflowBranch: "phase-1-planning",
        icon: "📋"
      },
      {
        id: "phase-2-contacts",
        title: "Contact Strategy",
        description: "Stakeholder mapping and relationship management",
        status: "completed",
        workflowBranch: "phase-2-contacts",
        icon: "🤝"
      },
      {
        id: "phase-3-contract",
        title: "Contract Analysis",
        description: "Terms review and risk assessment",
        status: "completed",
        workflowBranch: "phase-3-contract",
        icon: "📄"
      },
      {
        id: "phase-4-pricing",
        title: "Pricing Strategy",
        description: "Market analysis and optimization",
        status: "in-progress",
        workflowBranch: "phase-4-pricing",
        icon: "💰"
      },
      {
        id: "phase-5-summary",
        title: "Plan Summary",
        description: "Comprehensive execution planning",
        status: "pending",
        workflowBranch: "phase-5-summary",
        icon: "📊"
      }
    ],
    progressMeter: {
      currentStep: 4,
      totalSteps: 5,
      progressPercentage: 80,
      showPercentage: true,
      showStepNumbers: true
    },
    showProgressMeter: true,
    showSteps: true
  }
};