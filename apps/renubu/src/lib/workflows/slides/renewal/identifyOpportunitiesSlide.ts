/**
 * Identify Opportunities Slide
 *
 * Purpose: Analyze expansion opportunities based on usage and engagement
 * Used in: InHerSight 90-day renewal workflow
 * Artifact: PricingAnalysis (already exists!)
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const identifyOpportunitiesSlide: UniversalSlideBuilder = (context): any => ({
  id: 'identify-opportunities',
  version: '2',
  name: 'Identify Expansion Opportunities',
  category: 'renewal',
  checklistTitle: 'Identify expansion and upsell opportunities',

  structure: {
    id: 'identify-opportunities',
    title: 'Expansion Opportunities',
    description: 'Identify potential expansion opportunities',
    label: 'Opportunities',
    stepMapping: 'identify-opportunities',
    showSideMenu: true,

    chat: {
      initialMessage: {
        text: context?.variables?.message ||
          `Based on {{customer.name}}'s usage and engagement, I've identified some expansion opportunities. Let's review the potential value and positioning.`,
        buttons: [
          {
            label: 'Review Opportunities',
            value: 'review',
            'label-background': 'bg-green-600',
            'label-text': 'text-white',
          },
          {
            label: 'No Expansion Needed',
            value: 'skip',
            'label-background': 'bg-gray-500',
            'label-text': 'text-white',
          },
        ],
        nextBranches: {
          'review': 'review',
          'skip': 'skip',
        },
      },
      branches: {
        review: {
          response: 'Great! I\'ve prepared an expansion analysis with pricing recommendations.',
          actions: ['nextSlide'],
        },
        skip: {
          response: 'Understood. We\'ll focus on a standard renewal without expansion.',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'Would you like to explore expansion opportunities?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'expansion-overview',
          type: 'component:interactive',
          title: 'Expansion Overview',
          visible: true,
          data: {
            componentType: 'ExpansionOverviewArtifact',
            props: {
              customerName: '{{customer.name}}',
              contractInfo: {
                licenseCount: context?.variables?.licenseCount || 50,
                pricePerSeat: context?.variables?.pricePerSeat || 150,
                annualSpend: context?.variables?.annualSpend || 90000,
                renewalDate: '{{customer.renewal_date}}',
                renewalDays: context?.variables?.renewalDays || 90,
                term: context?.variables?.term || '12 months',
                autoRenew: context?.variables?.autoRenew ?? true,
              },
              usageInfo: {
                activeUsers: context?.variables?.activeUsers || 55,
                licenseCapacity: context?.variables?.licenseCapacity || 50,
                utilizationPercent: context?.variables?.utilizationPercent || 110,
                yoyGrowth: context?.variables?.yoyGrowth || 28,
                lastMonthGrowth: context?.variables?.lastMonthGrowth || 8,
                peakUsage: context?.variables?.peakUsage || 62,
                adoptionRate: context?.variables?.adoptionRate || 87,
              },
              marketInfo: {
                currentPrice: context?.variables?.currentPrice || 150,
                marketAverage: context?.variables?.marketAverage || 210,
                percentile: context?.variables?.percentile || 25,
                priceGap: context?.variables?.priceGap || 29,
                similarCustomerRange: context?.variables?.similarCustomerRange || '$180-$240',
                opportunityValue: context?.variables?.opportunityValue || '+$45,000 ARR',
              },
              brandInfo: {
                healthScore: context?.variables?.healthScore || 78,
                reportingPeriod: context?.variables?.reportingPeriod || 'Last 90 Days',
                impressions: {
                  label: 'Impressions',
                  value: context?.variables?.impressions || '24.5K',
                  trend: 'up',
                  trendValue: '+12%',
                  sparkData: [30, 45, 35, 50, 42, 55, 60, 52, 65, 70, 68, 75],
                },
                profileViews: {
                  label: 'Profile Views',
                  value: context?.variables?.profileViews || '3,842',
                  trend: 'up',
                  trendValue: '+8%',
                  sparkData: [20, 25, 22, 30, 28, 35, 32, 40, 38, 45, 42, 48],
                },
                applyClicks: {
                  label: 'Apply Clicks',
                  value: context?.variables?.applyClicks || '847',
                  trend: 'flat',
                  trendValue: '+2%',
                  sparkData: [15, 18, 16, 20, 19, 18, 22, 21, 20, 23, 22, 24],
                },
                newRatings: {
                  label: 'New Ratings',
                  value: context?.variables?.newRatings || '156',
                  trend: 'up',
                  trendValue: '+23%',
                  sparkData: [8, 12, 10, 15, 14, 18, 16, 22, 20, 25, 28, 32],
                },
              },
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
