/**
 * Review Brand Performance Slide
 *
 * Purpose: Display InHerSight-specific brand metrics and performance analysis
 * Used in: InHerSight 90-day renewal, 120-day at-risk workflows
 * Artifact: BrandPerformanceArtifact (simple, attractive design with mini charts)
 *
 * Chat: LLM-powered summary of growth/adoption performance
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const reviewBrandPerformanceSlide: UniversalSlideBuilder = (context): any => ({
  id: 'review-brand-performance',
  version: '2',
  name: 'Review Brand Performance',
  category: 'inhersight',
  checklistTitle: 'Review brand performance metrics and trends',

  structure: {
    id: 'review-brand-performance',
    title: 'Brand Performance Review',
    description: 'Review InHerSight brand metrics and performance',
    label: 'Performance Review',
    stepMapping: 'review-brand-performance',
    showSideMenu: true,

    chat: {
      // Enable LLM generation for performance summary
      generateInitialMessage: true,
      llmPrompt: `You are a customer success manager reviewing brand performance metrics for {{customer.name}} on InHerSight.

Based on the following metrics, provide a brief, friendly summary of their brand performance from a growth and adoption standpoint:

- Health Score: {{customer.health_score}}/100
- Brand Impressions: 24.5K (+12% vs last period)
- Profile Views: 3,842 (+8% vs last period)
- Apply Clicks: 847 (+2% vs last period)
- New Ratings: 156 (+23% vs last period)

Keep your response to 2-3 sentences. Focus on the positive trends and highlight any areas worth discussing. Be conversational and helpful, not formal.`,
      initialMessage: {
        text: context?.variables?.message ||
          `Looking at {{customer.name}}'s performance, I'm seeing some solid growth! Your brand impressions are up 12% and you've gained 23% more ratings compared to last period. The engagement looks healthy - let's review the details together.`,
        buttons: [
          {
            label: 'Looks good, continue',
            value: 'continue',
            'label-background': 'bg-blue-600',
            'label-text': 'text-white',
          },
          {
            label: 'Tell me more',
            value: 'more-details',
            'label-background': 'bg-gray-100',
            'label-text': 'text-gray-700',
          },
        ],
        nextBranches: {
          'continue': 'proceed',
          'more-details': 'explain-metrics',
        },
      },
      branches: {
        'proceed': {
          response: 'Great! Let\'s move on to the next step.',
          actions: ['nextSlide'],
        },
        'explain-metrics': {
          response: `Here's a quick breakdown:

**Impressions** (24.5K) - How often your brand appears in search results and recommendations. This is your visibility.

**Profile Views** (3,842) - Users actively clicking through to learn more about you. Strong indicator of interest.

**Apply Clicks** (847) - Direct job application interest from your profile. This is bottom-of-funnel engagement.

**New Ratings** (156) - Fresh employee reviews coming in. More ratings = more credibility and better ranking.

Overall, the trends are positive across all metrics. Ready to continue?`,
          buttons: [
            {
              label: 'Got it, continue',
              value: 'proceed-after-details',
              'label-background': 'bg-blue-600',
              'label-text': 'text-white',
            },
          ],
          nextBranches: {
            'proceed-after-details': 'proceed',
          },
        },
      },
      defaultMessage: 'Would you like to review the performance data?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'brand-performance',
          type: 'custom',
          title: 'Brand Performance',
          visible: true,
          data: {
            componentType: 'BrandPerformanceArtifact',
            props: {
              customerName: '{{customer.name}}',
              reportingPeriod: context?.variables?.reportingPeriod || 'Last 90 Days',
              healthScore: context?.variables?.healthScore || 78,
              // Using default mock metrics from the component
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
