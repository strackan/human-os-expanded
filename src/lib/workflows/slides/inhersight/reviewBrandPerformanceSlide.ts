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
  checklistTitle: 'Review brand performance metrics and trends',

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
        nextBranches: {
          'review': 'review-metrics',
        },
      },
      branches: {
        'review-metrics': {
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
          type: 'document',
          title: 'Brand Performance Report',
          content: `# {{customer.name}} - Brand Performance Report

**Reporting Period**: ${context?.variables?.reportingPeriod || 'Last 90 Days'}
**Health Score**: {{customer.health_score}}/100
**Report Date**: {{current_date}}

---

## Brand Visibility Metrics

### Impressions & Reach
| Metric | Value | Trend |
|--------|-------|-------|
| Brand Impressions | {{customer.brand_impressions}} | {{customer.impressions_trend}} |
| Profile Views | {{customer.profile_views}} | {{customer.views_trend}} |
| Profile Completion | {{customer.profile_completion_pct}}% | - |

### Engagement Metrics
| Metric | Value | Trend |
|--------|-------|-------|
| Job Matches | {{customer.job_matches}} | - |
| Apply Clicks | {{customer.apply_clicks}} | {{customer.clicks_trend}} |
| Click-Through Rate | {{customer.click_through_rate}}% | - |

### Content & Social
| Metric | Value |
|--------|-------|
| Article Inclusions | {{customer.article_inclusions}} |
| Social Mentions | {{customer.social_mentions}} |
| New Ratings | {{customer.new_ratings}} |
| Follower Growth | {{customer.follower_growth}} |

---

## Performance Analysis

{{customer.performance_analysis}}

### Strengths
{{customer.performance_strengths}}

### Areas for Improvement
{{customer.performance_improvements}}

---

## Recommendations

{{customer.performance_recommendations}}

---

*This report reflects InHerSight platform data. Contact your CSM for detailed analytics.*
`,
          editable: false,
          visible: true,
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
