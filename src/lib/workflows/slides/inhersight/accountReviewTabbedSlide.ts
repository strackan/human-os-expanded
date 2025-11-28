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
          `Let's review {{customer.name}}'s account together. I've organized everything into tabs on the right - you can explore their usage metrics, contract details, contacts, and more. Take your time reviewing, and let me know if you have any questions!`,
        buttons: [
          {
            label: 'I\'ve reviewed everything',
            value: 'reviewed',
            'label-background': 'bg-blue-600',
            'label-text': 'text-white',
          },
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
                        email: 'sarah.johnson@company.com',
                        type: 'executive' as const,
                        lastMeeting: '2 weeks ago',
                        meetingStatus: 'recent' as const,
                        strategy: 'Primary decision maker for renewal. Schedule executive briefing.',
                      },
                      {
                        id: '2',
                        name: 'Mike Chen',
                        role: 'HR Director',
                        email: 'mike.chen@company.com',
                        type: 'business' as const,
                        lastMeeting: '1 month ago',
                        meetingStatus: 'recent' as const,
                        strategy: 'Day-to-day champion. Keep engaged on product updates.',
                      },
                      {
                        id: '3',
                        name: 'Lisa Park',
                        role: 'Talent Acquisition Lead',
                        email: 'lisa.park@company.com',
                        type: 'technical' as const,
                        lastMeeting: '3 months ago',
                        meetingStatus: 'overdue' as const,
                        strategy: 'Power user. Schedule training session to drive adoption.',
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
                  artifact: 'PlanSummaryArtifact', // Placeholder - shows summary of risk factors
                  props: {
                    title: 'Risk Assessment',
                    customerName: '{{customer.name}}',
                    sections: [
                      {
                        title: 'Risk Factors',
                        items: context?.variables?.riskFactors || [
                          { label: 'Budget Constraints', status: 'low', note: 'No known budget issues' },
                          { label: 'Competitive Threat', status: 'medium', note: 'Evaluating alternatives' },
                          { label: 'Champion Risk', status: 'low', note: 'Main contact stable' },
                          { label: 'Usage Decline', status: 'low', note: 'Usage is growing' },
                        ],
                      },
                    ],
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
