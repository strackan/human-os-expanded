/**
 * Account Review Tabbed Slide
 *
 * Purpose: Consolidated account review with 5 tabs:
 *   1. Usage - Brand performance metrics (BrandPerformanceArtifact)
 *   2. Contract - Contract details (ContractArtifact)
 *   3. Contacts - Stakeholder contacts (ContactStrategyArtifact)
 *   4. Expansion - Expansion opportunities (ExpansionOverviewArtifact)
 *   5. Risk - Risk assessment (placeholder for now)
 *
 * Uses TabbedContainerArtifact to compose existing artifacts into a tabbed interface.
 * This replaces 5 separate slides with a single consolidated view.
 *
 * Used in: InHerSight 90-day renewal workflow
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const accountReviewTabbedSlide: UniversalSlideBuilder = (context): any => ({
  id: 'account-review-tabbed',
  version: '1',
  name: 'Account Review',
  category: 'inhersight',
  checklistTitle: 'Review account details across all dimensions',

  structure: {
    id: 'account-review-tabbed',
    title: 'Account Review',
    description: 'Comprehensive account review with usage, contract, contacts, expansion, and risk analysis',
    label: 'Account Review',
    stepMapping: 'account-review-tabbed',
    showSideMenu: true,

    chat: {
      generateInitialMessage: true,
      llmPrompt: `You are a customer success manager reviewing {{customer.name}}'s account.

This is a comprehensive account review covering:
- Usage metrics and brand performance
- Contract terms and renewal details
- Key stakeholder contacts
- Expansion opportunities
- Risk factors

Provide a brief, friendly introduction (2-3 sentences) explaining that you'll be reviewing the account together. Mention that they can use the tabs on the right to explore different aspects of the account. Be conversational and helpful.`,
      initialMessage: {
        text: context?.variables?.message ||
          `Let's review {{customer.name}}'s account together. I've organized everything into tabs on the right - you can explore their usage metrics, contract details, contacts, and more.

**Check the "reviewed" box on each tab as you complete your review.** Once all sections are reviewed, you'll be able to continue to pricing strategy.`,
        // Note: "Continue" button appears dynamically when all tabs are reviewed
        // via useTaskModeState's allTabsReviewed effect
        buttons: [
          {
            label: 'Walk me through it',
            value: 'walkthrough',
            'label-background': 'bg-gray-100',
            'label-text': 'text-gray-700',
          },
        ],
        nextBranches: {
          'reviewed': 'proceed',
          'walkthrough': 'explain-tabs',
        },
      },
      branches: {
        'proceed': {
          response: 'Great! Let\'s move on to align on your renewal strategy.',
          actions: ['nextSlide'],
        },
        'explain-tabs': {
          response: `Here's what each tab shows:

**Usage** - Brand performance metrics like impressions, profile views, and apply clicks. This shows how engaged candidates are with their brand.

**Contract** - Current contract terms, renewal date, pricing, and any special clauses to be aware of.

**Contacts** - Key stakeholders at the account. Make sure you have the right people identified for renewal discussions.

**Expansion** - Opportunities for upsell or cross-sell. Look at usage trends and market positioning.

**Risk** - Any concerns or risk factors to address before renewal.

Take your time exploring each tab. Ready to continue when you are!`,
          buttons: [
            {
              label: 'Got it, let me review',
              value: 'continue-review',
              'label-background': 'bg-blue-600',
              'label-text': 'text-white',
            },
          ],
          nextBranches: {
            'continue-review': 'await-review',
          },
        },
        'await-review': {
          response: 'Take your time reviewing the tabs. Click "I\'ve reviewed everything" when you\'re ready to continue.',
          buttons: [
            {
              label: 'I\'ve reviewed everything',
              value: 'done-reviewing',
              'label-background': 'bg-blue-600',
              'label-text': 'text-white',
            },
          ],
          nextBranches: {
            'done-reviewing': 'proceed',
          },
        },
      },
      defaultMessage: 'Feel free to explore the tabs and let me know if you have questions about any section.',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'tabbed-account-review',
          type: 'component:interactive',
          title: 'Account Review',
          visible: true,
          data: {
            componentType: 'TabbedContainerArtifact',
            props: {
              title: 'Account Review',
              customerName: '{{customer.name}}',
              showNavigation: false, // Navigation handled by workflow
              tabs: [
                {
                  id: 'usage',
                  label: 'Usage',
                  icon: 'chart-bar',
                  artifact: 'BrandPerformanceArtifact',
                  props: {
                    customerName: '{{customer.name}}',
                    title: 'Brand Performance',
                    reportingPeriod: context?.variables?.reportingPeriod || 'Last 90 Days',
                    healthScore: context?.variables?.healthScore || 78,
                    metrics: {
                      impressions: {
                        label: 'Impressions',
                        value: context?.variables?.impressions || '24.5K',
                        trend: 'up',
                        trendValue: '+12% vs last period',
                        sparkData: [30, 45, 35, 50, 42, 55, 60, 52, 65, 70, 68, 75],
                      },
                      profileViews: {
                        label: 'Profile Views',
                        value: context?.variables?.profileViews || '3,842',
                        trend: 'up',
                        trendValue: '+8% vs last period',
                        sparkData: [20, 25, 22, 30, 28, 35, 32, 40, 38, 45, 42, 48],
                      },
                      applyClicks: {
                        label: 'Apply Clicks',
                        value: context?.variables?.applyClicks || '847',
                        trend: 'flat',
                        trendValue: '+2% vs last period',
                        sparkData: [15, 18, 16, 20, 19, 18, 22, 21, 20, 23, 22, 24],
                      },
                      newRatings: {
                        label: 'New Ratings',
                        value: context?.variables?.newRatings || '156',
                        trend: 'up',
                        trendValue: '+23% vs last period',
                        sparkData: [8, 12, 10, 15, 14, 18, 16, 22, 20, 25, 28, 32],
                      },
                    },
                  },
                },
                {
                  id: 'contract',
                  label: 'Contract',
                  icon: 'document-text',
                  artifact: 'ContractArtifact',
                  props: {
                    customerName: '{{customer.name}}',
                    contractData: {
                      startDate: context?.variables?.contractStartDate || '2024-01-15',
                      endDate: '{{customer.renewal_date}}',
                      term: context?.variables?.term || '12 months',
                      autoRenew: context?.variables?.autoRenew ?? true,
                      value: context?.variables?.contractValue || '$90,000',
                      seats: context?.variables?.seats || 50,
                      pricePerSeat: context?.variables?.pricePerSeat || '$150',
                    },
                  },
                },
                {
                  id: 'contacts',
                  label: 'Contacts',
                  icon: 'users',
                  artifact: 'ContactStrategyArtifact',
                  props: {
                    title: 'Key Contacts',
                    subtitle: 'Stakeholders for {{customer.name}}',
                    showActions: false, // Read-only in tabbed view
                    contacts: context?.variables?.contacts || [
                      {
                        id: '1',
                        name: 'Sarah Johnson',
                        role: 'VP of People',
                        email: 'sarah.johnson@growthstack.io',
                        type: 'executive' as const,
                        lastMeeting: '2 weeks ago',
                        meetingStatus: 'recent' as const,
                        strategy: 'Primary decision maker for renewal. Schedule executive briefing to discuss enterprise upgrade.',
                        linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
                        intel: {
                          personality: {
                            discStyle: 'D' as const,
                            communicationStyle: 'Direct, results-focused. Prefers data-driven conversations.',
                            decisionMaking: 'Fast decision maker when ROI is clear',
                            motivators: ['Business Growth', 'Team Efficiency', 'Innovation'],
                          },
                          recentActivity: [
                            {
                              type: 'linkedin' as const,
                              title: 'Shared article on hiring trends',
                              date: '3 days ago',
                              summary: 'Posted about the importance of employer branding in competitive hiring markets',
                              sentiment: 'positive' as const,
                            },
                            {
                              type: 'company_event' as const,
                              title: 'GrowthStack Series C Announcement',
                              date: '2 weeks ago',
                              summary: 'Company raised $45M Series C - expanding to London office in Q2',
                              sentiment: 'positive' as const,
                            },
                            {
                              type: 'engagement' as const,
                              title: 'Requested Greenhouse API integration',
                              date: '1 month ago',
                              summary: 'Expressed strong interest in ATS integration for streamlined workflows',
                              sentiment: 'positive' as const,
                            },
                          ],
                          relationship: {
                            strength: 85,
                            sentiment: 'champion' as const,
                            lastPositiveInteraction: 'Praised product value in QBR call',
                          },
                          talkingPoints: [
                            'Congratulate on Series C funding and London expansion',
                            'Discuss enterprise tier benefits for scaling team',
                            'Follow up on Greenhouse API integration timeline',
                            'Explore additional departments that could benefit',
                          ],
                          topicsOfInterest: ['Employer Branding', 'DEI Initiatives', 'Remote Hiring'],
                        },
                      },
                      {
                        id: '2',
                        name: 'Jennifer Walsh',
                        role: 'VP of HR (New)',
                        email: 'jennifer.walsh@growthstack.io',
                        type: 'executive' as const,
                        lastMeeting: 'Never',
                        meetingStatus: 'none' as const,
                        strategy: 'New executive hire - critical to establish relationship. Schedule intro call.',
                        linkedinUrl: 'https://linkedin.com/in/jenniferwalsh',
                        intel: {
                          personality: {
                            discStyle: 'S' as const,
                            communicationStyle: 'Collaborative, seeks consensus. Values relationships.',
                            decisionMaking: 'Thorough evaluation, involves stakeholders',
                            motivators: ['Team Success', 'Process Improvement', 'Employee Experience'],
                          },
                          recentActivity: [
                            {
                              type: 'role_change' as const,
                              title: 'Joined GrowthStack as VP of HR',
                              date: '3 weeks ago',
                              summary: 'Previously at Stripe for 4 years leading talent operations',
                              sentiment: 'neutral' as const,
                            },
                            {
                              type: 'linkedin' as const,
                              title: 'Connected with InHerSight CEO',
                              date: '1 week ago',
                              summary: 'Engaged with company content about workplace transparency',
                              sentiment: 'positive' as const,
                            },
                          ],
                          relationship: {
                            strength: 20,
                            sentiment: 'neutral' as const,
                          },
                          buyerPersona: {
                            archetype: 'The Evaluator',
                            priorities: ['Vendor consolidation', 'ROI measurement', 'Team adoption'],
                            painPoints: ['Learning new vendor landscape', 'Proving value to leadership'],
                            influenceLevel: 'decision_maker' as const,
                          },
                          talkingPoints: [
                            'Welcome to GrowthStack - offer product walkthrough',
                            'Share success metrics from current usage',
                            'Discuss how InHerSight aligned with Stripe\'s values',
                            'Introduce customer success resources available',
                          ],
                        },
                      },
                      {
                        id: '3',
                        name: 'Mike Chen',
                        role: 'HR Director',
                        email: 'mike.chen@growthstack.io',
                        type: 'business' as const,
                        lastMeeting: '1 month ago',
                        meetingStatus: 'recent' as const,
                        strategy: 'Day-to-day champion. Keep engaged on product updates and feature requests.',
                        linkedinUrl: 'https://linkedin.com/in/mikechen',
                        intel: {
                          personality: {
                            discStyle: 'I' as const,
                            communicationStyle: 'Enthusiastic, collaborative. Enjoys sharing wins.',
                            decisionMaking: 'Influences through relationships and success stories',
                            motivators: ['Recognition', 'Team Impact', 'Innovation'],
                          },
                          recentActivity: [
                            {
                              type: 'engagement' as const,
                              title: 'Submitted feature request',
                              date: '2 weeks ago',
                              summary: 'Requested bulk export functionality for compliance reporting',
                              sentiment: 'positive' as const,
                            },
                            {
                              type: 'linkedin' as const,
                              title: 'Shared InHerSight award win',
                              date: '1 month ago',
                              summary: 'Posted about GrowthStack\'s Best Places to Work recognition',
                              sentiment: 'positive' as const,
                            },
                          ],
                          relationship: {
                            strength: 90,
                            sentiment: 'champion' as const,
                            lastPositiveInteraction: 'Referred two peer companies',
                          },
                          talkingPoints: [
                            'Thank for referrals and social advocacy',
                            'Update on bulk export feature progress',
                            'Discuss bridge relationship to Jennifer Walsh',
                            'Explore expansion to recruiting team',
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  id: 'expansion',
                  label: 'Expansion',
                  icon: 'trending-up',
                  artifact: 'ExpansionOverviewArtifact',
                  props: {
                    customerName: '{{customer.name}}',
                    contractInfo: {
                      licenseCount: context?.variables?.licenseCount || 50,
                      pricePerSeat: context?.variables?.pricePerSeat || 150,
                      annualSpend: context?.variables?.annualSpend || 90000,
                      renewalDate: '{{customer.renewal_date}}',
                      renewalDays: context?.variables?.renewalDays || 90,
                    },
                    usageInfo: {
                      activeUsers: context?.variables?.activeUsers || 55,
                      utilizationPercent: context?.variables?.utilizationPercent || 110,
                      yoyGrowth: context?.variables?.yoyGrowth || 28,
                    },
                    marketInfo: {
                      currentPrice: context?.variables?.currentPrice || 150,
                      marketAverage: context?.variables?.marketAverage || 210,
                      percentile: context?.variables?.percentile || 25,
                      opportunityValue: context?.variables?.opportunityValue || '+$45,000 ARR',
                    },
                  },
                },
                {
                  id: 'risk',
                  label: 'Risk',
                  icon: 'exclamation-triangle',
                  artifact: 'RiskAssessmentArtifact',
                  props: {
                    customerName: '{{customer.name}}',
                    overallRiskScore: context?.variables?.overallRiskScore || 25,
                    // Risk factors will use defaults from artifact if not provided
                  },
                },
              ],
            },
          },
        },
      ],
    },

    sidePanel: {
      enabled: true,
      title: {
        text: 'Workflow Progress',
        subtitle: 'Track your progress',
        icon: 'checklist',
      },
      steps: [],
      progressMeter: {
        currentStep: 0,
        totalSteps: 0,
        progressPercentage: 0,
        showPercentage: true,
        showStepNumbers: true,
      },
      showProgressMeter: true,
      showSteps: true,
    },

    onComplete: {
      nextSlide: undefined,
      updateProgress: true,
    },
  },
});
