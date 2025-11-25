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
          type: 'custom',
          title: 'Expansion Opportunity Analysis',
          visible: true,
          editable: false,
          data: {
            componentType: 'PricingAnalysisArtifact',
            props: {
              currentPrice: '{{customer.current_arr}}',
              recommendedPrice: '{{customer.recommended_arr}}',
              reasoning: context?.variables?.expansionReasoning ||
                `Based on {{customer.name}}'s performance metrics:

**Usage Indicators:**
- Brand impressions: {{customer.brand_impressions}}
- Profile engagement: {{customer.profile_views}}
- Job posting activity: {{customer.apply_clicks}}

**Expansion Opportunities:**
1. **Enhanced Visibility Package** - Increase brand impressions with featured placement
2. **Premium Job Credits** - Support hiring growth with additional job postings
3. **Content Partnership** - Sponsored articles and social campaigns

**Recommended Approach:**
Start with a mid-tier expansion focused on {{customer.expansion_focus}}, which aligns with their current engagement patterns and business goals.`
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
