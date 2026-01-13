/**
 * Pricing Analysis Slide V2 (Template-based)
 *
 * Uses Handlebars templates for chat messages and component references for artifacts.
 * This replaces the override structure pattern with a clean, reusable design.
 */

import type { SlideBuilderV2, SlideDefinitionV2, SlideContext } from '../baseSlide';

export const pricingAnalysisSlideV2: SlideBuilderV2 = (context?: SlideContext): SlideDefinitionV2 => {
  return {
    id: 'pricing-analysis-v2',
    title: 'Pricing Analysis',
    description: 'Analyze renewal pricing strategy',
    label: 'Pricing',
    stepMapping: 'pricing-analysis',
    category: 'renewal',
    estimatedMinutes: 3,
    checklistTitle: 'Analyze current pricing vs. market benchmarks',
    requiredFields: [
      'customer.name',
      'pricing.currentARR',
      'pricing.proposedARR',
      'pricing.increasePercent',
      'customer.utilization',
      'customer.monthsToRenewal',
      'customer.seatCount',
      'pricing.currentPricePerSeat',
      'pricing.proposedPricePerSeat',
      'pricing.increaseAmount',
      'pricing.increasePerSeat',
      'pricing.proposedPercentile',
    ],
    optionalFields: [],

    // Chat configuration using templates
    chat: {
      initialMessage: {
        text: {
          templateId: 'chat.pricing-analysis.initial',
          context: context?.variables,
        },
        buttons: [
          { label: 'Draft The Quote', value: 'continue', 'label-background': 'bg-blue-600 hover:bg-blue-700', 'label-text': 'text-white' },
          { label: 'Adjust Strategy', value: 'adjust', 'label-background': 'bg-gray-500 hover:bg-gray-600', 'label-text': 'text-white' },
        ],
        nextBranches: {
          'continue': 'continue',
          'adjust': 'adjust',
        },
      },
      branches: {
        'continue': {
          response: {
            templateId: 'chat.pricing-analysis.continue',
          },
          delay: 1,
          actions: ['nextSlide'],
        },
        'adjust': {
          response: {
            templateId: 'chat.pricing-analysis.adjust',
          },
          nextBranchOnText: 'handle-adjustment',
        },
        'handle-adjustment': {
          response: {
            templateId: 'chat.pricing-analysis.handle-adjustment',
          },
          storeAs: 'pricing.adjustmentNotes',
          delay: 1,
          actions: ['nextSlide'],
        },
      },
    },

    // Artifact configuration using component references
    // Props come from context.variables (passed from workflow context)
    artifacts: {
      sections: [
        {
          id: 'pricing-analysis',
          title: 'Pricing Analysis',
          component: {
            componentId: 'artifact.pricing-analysis',
            props: context?.variables?.pricing ? {
              currentARR: context.variables.pricing.currentARR,
              currentPricePerSeat: context.variables.pricing.currentPricePerSeat,
              proposedARR: context.variables.pricing.proposedARR,
              proposedPricePerSeat: context.variables.pricing.proposedPricePerSeat,
              increasePercentage: context.variables.pricing.increasePercent,
              increaseAmount: context.variables.pricing.increaseAmount,
              marketPercentile: {
                current: context.variables.pricing.currentPercentile || 35,
                proposed: context.variables.pricing.proposedPercentile,
              },
              justification: context.variables.pricing.justification || [
                `Strong product utilization (${context.variables.customer?.utilization || 87}% capacity)`,
                `Healthy customer relationship (${context.variables.customer?.health_score || 87}% health score)`,
                `Market-aligned pricing (moving to ${context.variables.pricing.proposedPercentile}th percentile)`,
                `Optimal timing (${context.variables.customer?.monthsToRenewal || 4} months before renewal)`,
              ],
              risks: context.variables.pricing.risks || [
                { level: 'low', description: 'Price sensitivity - strong relationship mitigates risk' },
                { level: 'low', description: 'Competitive alternatives - high switching costs' },
              ],
            } : {
              // Default values if no context provided (for testing)
              currentARR: 185000,
              currentPricePerSeat: 3700,
              proposedARR: 199800,
              proposedPricePerSeat: 3996,
              increasePercentage: 8,
              increaseAmount: 14800,
              marketPercentile: { current: 35, proposed: 50 },
              justification: ['Strong utilization', 'Healthy relationship', 'Market-aligned', 'Good timing'],
              risks: [
                { level: 'low', description: 'Price sensitivity - strong relationship mitigates risk' },
                { level: 'low', description: 'Competitive alternatives - high switching costs' },
              ],
            },
          },
          visible: true,
        },
      ],
    },

    tags: ['renewal', 'pricing', 'analysis'],
    version: '2.0.0',
  };
};
