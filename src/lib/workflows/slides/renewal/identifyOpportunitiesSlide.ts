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
          id: 'opportunity-analysis',
          type: 'document',
          title: 'Expansion Opportunity Analysis',
          content: `# {{customer.name}} - Expansion Opportunity Analysis

**Current ARR**: \${{customer.current_arr}}
**Recommended ARR**: \${{customer.recommended_arr}}
**Analysis Date**: {{current_date}}

---

## Current Performance

### Usage Indicators
| Metric | Value |
|--------|-------|
| Brand Impressions | {{customer.brand_impressions}} |
| Profile Engagement | {{customer.profile_views}} |
| Job Posting Activity | {{customer.apply_clicks}} |

---

## Expansion Opportunities

### 1. Enhanced Visibility Package
**Value Proposition**: Increase brand impressions with featured placement
- Premium positioning in search results
- Featured employer spotlight
- Enhanced company profile badges

### 2. Premium Job Credits
**Value Proposition**: Support hiring growth with additional job postings
- Bulk job posting credits
- Priority job placement
- Extended posting duration

### 3. Content Partnership
**Value Proposition**: Sponsored articles and social campaigns
- Co-branded content pieces
- Social media amplification
- Thought leadership opportunities

---

## Recommended Approach

Start with a mid-tier expansion focused on {{customer.expansion_focus}}, which aligns with their current engagement patterns and business goals.

### Pricing Recommendation
| Package | Current | Proposed | Increase |
|---------|---------|----------|----------|
| Base | \${{customer.current_arr}} | \${{customer.recommended_arr}} | {{customer.arr_increase_pct}}% |

### Value Justification
- ROI based on current engagement metrics
- Competitive positioning in talent market
- Employer brand growth trajectory

---

## Next Steps

1. [ ] Review expansion options with customer
2. [ ] Discuss budget and timing
3. [ ] Prepare formal proposal if interest confirmed
4. [ ] Schedule follow-up to finalize

---

*Analysis based on platform data through {{current_date}}*
`,
          editable: true,
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
