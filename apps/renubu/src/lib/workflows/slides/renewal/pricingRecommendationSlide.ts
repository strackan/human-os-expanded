/**
 * Pricing Recommendation Slide
 *
 * Purpose: Display AI-generated pricing recommendation with 3 scenarios
 * Uses: PricingRecommendation composite component
 * Backend: PricingOptimizationService API
 *
 * This slide:
 * 1. Shows the AI pricing recommendation artifact
 * 2. Allows CSM to select Conservative, Recommended, or Aggressive scenario
 * 3. Stores the selected scenario in workflow context
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const pricingRecommendationSlide: UniversalSlideBuilder = (context): any => ({
  id: 'pricing-recommendation',
  version: '2',
  name: 'AI Pricing Recommendation',
  category: 'renewal',
  checklistTitle: 'Review AI-generated pricing recommendation',

  structure: {
    id: 'pricing-recommendation',
    title: 'AI Pricing Recommendation',
    description: 'Review AI-generated pricing scenarios and select approach',
    label: 'AI Pricing',
    stepMapping: 'pricing-recommendation',
    showSideMenu: true,

    chat: {
      initialMessage: {
        text: context?.variables?.message ||
          `I've analyzed {{customer.name}}'s data across 5 key factors and generated pricing recommendations. The **Recommended** scenario balances growth with retention risk.

Review the three scenarios and select the approach that best fits your strategy for this renewal.`,
        buttons: [
          {
            label: 'Use Conservative',
            value: 'select-conservative',
            'label-background': 'bg-blue-500',
            'label-text': 'text-white',
          },
          {
            label: 'Use Recommended',
            value: 'select-recommended',
            'label-background': 'bg-green-600',
            'label-text': 'text-white',
          },
          {
            label: 'Use Aggressive',
            value: 'select-aggressive',
            'label-background': 'bg-orange-500',
            'label-text': 'text-white',
          },
        ],
        nextBranches: {
          'select-conservative': 'conservative',
          'select-recommended': 'recommended',
          'select-aggressive': 'aggressive',
        },
      },
      branches: {
        conservative: {
          response: `Good choice for this situation. The **Conservative** scenario minimizes risk with a {{pricing.scenarios.conservative.increasePercent}}% increase.

I'll use this for your renewal quote.`,
          storeAs: 'pricing.selectedScenario',
          actions: ['nextSlide'],
        },
        recommended: {
          response: `The balanced approach. The **Recommended** scenario captures {{pricing.scenarios.recommended.increasePercent}}% additional value while maintaining strong retention probability.

I'll use this for your renewal quote.`,
          storeAs: 'pricing.selectedScenario',
          actions: ['nextSlide'],
        },
        aggressive: {
          response: `Maximizing value capture with the **Aggressive** scenario at {{pricing.scenarios.aggressive.increasePercent}}% increase. This works well for high-stickiness accounts.

I'll use this for your renewal quote.`,
          storeAs: 'pricing.selectedScenario',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'Which pricing scenario would you like to use?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'pricing-recommendation',
          type: 'component',
          componentRef: 'artifact.pricing-recommendation',
          title: 'Pricing Recommendation',
          visible: true,
          data: {
            recommendation: context?.variables?.recommendation || {
              targetPrice: 0,
              increasePercent: 0,
              increaseAmount: 0,
              confidence: 0,
              scenarios: [],
              factors: {
                stickinessScore: 0,
                valueIndex: 1,
                marketAdjustment: 0,
                riskMultiplier: 1,
                trendAdjustment: 0,
              },
              dataQuality: {
                usage: 'placeholder',
                financial: 'placeholder',
                risk: 'placeholder',
                competitive: 'placeholder',
              },
            },
            currentARR: context?.variables?.currentARR || 0,
            customerName: context?.variables?.customerName || '{{customer.name}}',
            showFactors: true,
            showDataQuality: true,
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
