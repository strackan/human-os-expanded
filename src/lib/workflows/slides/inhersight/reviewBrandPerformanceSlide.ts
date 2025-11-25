/**
 * Review Brand Performance Slide
 *
 * Purpose: Display InHerSight-specific brand metrics and performance analysis
 * Used in: InHerSight 90-day renewal, 120-day at-risk workflows
 * Artifact: BrandExposureReport (already exists!)
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const reviewBrandPerformanceSlide: UniversalSlideBuilder = (context): any => ({
  id: 'review-brand-performance',
  version: '2',
  name: 'Review Brand Performance',
  category: 'inhersight',

  structure: {
    id: 'review-brand-performance',
    title: 'Brand Performance Review',
    description: 'Review InHerSight brand metrics and performance',
    label: 'Performance Review',
    stepMapping: 'review-brand-performance',
    showSideMenu: true,

    chat: {
      initialMessage: {
        text: context?.variables?.message ||
          `I've pulled together {{customer.name}}'s brand performance data from InHerSight. Let's review the key metrics and see how things are trending.`,
        buttons: [
          {
            label: 'Review Metrics',
            value: 'review',
            'label-background': 'bg-blue-600',
            'label-text': 'text-white',
          },
        ],
      },
      branches: {
        review: {
          response: 'Great! Take a look at the performance report. The data shows some interesting trends.',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'Would you like to review the performance data?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'brand-exposure-report',
          type: 'custom',
          title: 'Brand Performance Report',
          visible: true,
          editable: false,
          data: {
            componentType: 'BrandExposureReportArtifact',
            props: {
              customerName: '{{customer.name}}',
              reportingPeriod: context?.variables?.reportingPeriod || 'Last 90 days',
              healthScore: '{{customer.health_score}}',
              metrics: {
                brandImpressions: '{{customer.brand_impressions}}',
                brandImpressionsTrend: '{{customer.impressions_trend}}',
                profileViews: '{{customer.profile_views}}',
                profileViewsTrend: '{{customer.views_trend}}',
                profileCompletionPct: '{{customer.profile_completion_pct}}',
                jobMatches: '{{customer.job_matches}}',
                applyClicks: '{{customer.apply_clicks}}',
                applyClicksTrend: '{{customer.clicks_trend}}',
                clickThroughRate: '{{customer.click_through_rate}}',
                articleInclusions: '{{customer.article_inclusions}}',
                socialMentions: '{{customer.social_mentions}}',
                newRatings: '{{customer.new_ratings}}',
                followerGrowth: '{{customer.follower_growth}}'
              },
              performanceAnalysis: '{{customer.performance_analysis}}',
              strengths: '{{customer.performance_strengths}}',
              improvements: '{{customer.performance_improvements}}',
              recommendations: '{{customer.performance_recommendations}}'
            }
          }
        }
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
