/**
 * Pricing Strategy Slide - Renewal-Specific Slide
 *
 * Used ONLY in renewal workflows to develop pricing strategy for the renewal.
 *
 * Helps CSMs think through:
 * - Price increase vs flat renewal
 * - Expansion opportunities
 * - Discount strategies
 * - Multi-year incentives
 *
 * Context customization:
 * - priceChangeStrategy: 'increase' | 'flat' | 'decrease' | 'expansion'
 * - targetARR: Desired renewal ARR
 * - includeExpansion: Whether expansion is being proposed
 */

import { SlideBuilder, SlideContext, createSlideBuilder } from '../baseSlide';

/**
 * Pricing Strategy Slide Builder
 *
 * Renewal-specific slide for developing renewal pricing strategy.
 */
export const pricingStrategySlide: SlideBuilder = createSlideBuilder(
  {
    id: 'pricing-strategy',
    name: 'Pricing Strategy',
    category: 'renewal',
    description: 'Develop renewal pricing strategy',
    estimatedMinutes: 5,
    requiredFields: ['customer.name', 'customer.current_arr'],
  },
  (context?: SlideContext) => {
    const priceChangeStrategy = context?.variables?.priceChangeStrategy || 'flat';
    const includeExpansion = context?.variables?.includeExpansion || false;
    const multiYearOption = context?.variables?.multiYearOption || false;

    const strategyLabels: Record<string, string> = {
      increase: 'Price Increase',
      flat: 'Flat Renewal',
      decrease: 'Price Decrease (Retention)',
      expansion: 'Expansion Pricing',
    };

    const strategyDescriptions: Record<string, string> = {
      increase: 'Propose higher pricing based on value delivered or market adjustments',
      flat: 'Renew at current pricing (no increase)',
      decrease: 'Offer discount or reduction to retain at-risk customer',
      expansion: 'Add products/licenses with expansion pricing',
    };

    return {
      id: 'pricing-strategy',
      title: 'Pricing Strategy',
      description: 'Develop renewal pricing strategy',
      label: 'Pricing',
      stepMapping: 'pricing-strategy',
      chat: { initialMessage: undefined, branches: {} },
      artifacts: { sections: [] },
      layout: 'side-by-side',
      chatInstructions: [
        `You are helping develop a pricing strategy for a customer renewal.`,
        ``,
        `Customer Context:`,
        `- Customer: {{customer.name}}`,
        `- Current ARR: {{customer.current_arr}}`,
        `- Strategy: ${strategyLabels[priceChangeStrategy]}`,
        `- Health Score: {{customer.health_score}}`,
        includeExpansion ? `- Expansion: Yes` : '',
        multiYearOption ? `- Multi-year: Being considered` : '',
        ``,
        `Your role is to help the CSM:`,
        `1. Determine the right pricing strategy for this renewal`,
        `2. Calculate proposed renewal ARR`,
        `3. Develop discount strategy (if applicable)`,
        `4. Consider multi-year incentives`,
        `5. Prepare pricing justification`,
        ``,
        `Answer questions about:`,
        `- Pricing best practices for renewals`,
        `- How to justify price increases`,
        `- When to offer discounts`,
        `- Multi-year contract incentives`,
        `- Handling pricing objections`,
        `- Expansion vs renewal pricing`,
      ].filter(Boolean).join('\n'),

      artifactPanel: {
        title: 'Renewal Pricing Strategy',
        content: [
          {
            type: 'intro' as const,
            content: `Let's develop a pricing strategy for {{customer.name}}'s renewal.`,
          },
          {
            type: 'section' as const,
            title: 'Current State',
            subsections: [
              {
                title: 'Baseline',
                items: [
                  {
                    label: 'Current ARR',
                    value: '{{customer.current_arr}}',
                    type: 'text' as const,
                  },
                  {
                    label: 'Contract Term',
                    value: '{{customer.contract_term}} months',
                    type: 'text' as const,
                  },
                  {
                    label: 'Current Licenses',
                    value: '{{customer.license_count}}',
                    type: 'text' as const,
                  },
                  {
                    label: 'Utilization',
                    value: '{{customer.utilization_percent}}%',
                    type: 'text' as const,
                  },
                ],
              },
            ],
          },
          {
            type: 'section' as const,
            title: 'Pricing Strategy',
            subsections: [
              {
                title: 'Approach',
                items: [
                  {
                    label: 'Strategy',
                    value: strategyLabels[priceChangeStrategy],
                    type: 'badge' as const,
                  },
                  {
                    label: 'Description',
                    value: strategyDescriptions[priceChangeStrategy],
                    type: 'text' as const,
                  },
                ],
              },
              {
                title: 'Proposal',
                items: [
                  {
                    label: 'Proposed ARR',
                    value: context?.variables?.proposedARR || '{{customer.current_arr}}',
                    type: 'editable-text' as const,
                    helpText: 'Target renewal ARR',
                  },
                  priceChangeStrategy === 'increase' || priceChangeStrategy === 'expansion'
                    ? {
                        label: 'Change Amount',
                        value: context?.variables?.changeAmount || 'TBD',
                        type: 'editable-text' as const,
                        helpText: 'Dollar amount of increase',
                      }
                    : null,
                  priceChangeStrategy === 'increase' || priceChangeStrategy === 'expansion'
                    ? {
                        label: 'Percentage Change',
                        value: context?.variables?.changePercent || 'TBD',
                        type: 'editable-text' as const,
                        helpText: 'Percentage increase',
                      }
                    : null,
                  priceChangeStrategy === 'decrease'
                    ? {
                        label: 'Discount Amount',
                        value: context?.variables?.discountAmount || 'TBD',
                        type: 'editable-text' as const,
                        helpText: 'Dollar amount of discount',
                      }
                    : null,
                  priceChangeStrategy === 'decrease'
                    ? {
                        label: 'Discount Percentage',
                        value: context?.variables?.discountPercent || 'TBD',
                        type: 'editable-text' as const,
                        helpText: 'Percentage discount',
                      }
                    : null,
                ].filter(Boolean) as Array<{
                  label: string;
                  value: string;
                  type: string;
                  helpText?: string;
                }>,
              },
            ],
          },
          includeExpansion
            ? {
                type: 'section' as const,
                title: 'Expansion Components',
                subsections: [
                  {
                    title: 'Additional Products/Licenses',
                    items: [
                      {
                        label: 'Expansion Type',
                        value: context?.variables?.expansionType || 'Additional licenses',
                        type: 'editable-text' as const,
                      },
                      {
                        label: 'Expansion ARR',
                        value: context?.variables?.expansionARR || 'TBD',
                        type: 'editable-text' as const,
                        helpText: 'ARR from expansion',
                      },
                      {
                        label: 'Total ARR (Renewal + Expansion)',
                        value: context?.variables?.totalARR || 'TBD',
                        type: 'editable-text' as const,
                        helpText: 'Combined renewal and expansion ARR',
                      },
                    ],
                  },
                ],
              }
            : null,
          multiYearOption
            ? {
                type: 'section' as const,
                title: 'Multi-Year Option',
                subsections: [
                  {
                    title: 'Extended Term Incentive',
                    items: [
                      {
                        label: 'Proposed Term',
                        value: context?.variables?.multiYearTerm || '24 months',
                        type: 'editable-text' as const,
                      },
                      {
                        label: 'Multi-Year Discount',
                        value: context?.variables?.multiYearDiscount || '5-10%',
                        type: 'editable-text' as const,
                        helpText: 'Discount for multi-year commitment',
                      },
                      {
                        label: 'Multi-Year ARR',
                        value: context?.variables?.multiYearARR || 'TBD',
                        type: 'editable-text' as const,
                        helpText: 'ARR with multi-year discount applied',
                      },
                    ],
                  },
                ],
              }
            : null,
          {
            type: 'section' as const,
            title: 'Justification',
            subsections: [
              {
                title: 'Value Delivered',
                items: [
                  {
                    label: 'Key Achievements',
                    value: context?.variables?.valueAchievements || 'List value delivered this year',
                    type: 'editable-textarea' as const,
                    helpText: 'Achievements to justify pricing',
                  },
                  priceChangeStrategy === 'increase'
                    ? {
                        label: 'Increase Rationale',
                        value:
                          context?.variables?.increaseRationale ||
                          'Value delivered, feature enhancements, market alignment',
                        type: 'editable-textarea' as const,
                        helpText: 'Why the price increase is justified',
                      }
                    : null,
                ].filter(Boolean) as Array<{
                  label: string;
                  value: string;
                  type: string;
                  helpText?: string;
                }>,
              },
            ],
          },
          {
            type: 'qa-section' as const,
            title: 'Pricing Strategy Checklist',
            questions: [
              {
                id: 'pricing-strategy-defined',
                question: 'Is the pricing strategy clear and appropriate for this customer?',
                required: true,
              },
              {
                id: 'pricing-justified',
                question:
                  priceChangeStrategy === 'increase'
                    ? 'Do you have strong justification for the price increase?'
                    : 'Is the pricing aligned with customer health and market rates?',
                required: true,
              },
              includeExpansion
                ? {
                    id: 'pricing-expansion-clear',
                    question: 'Is the expansion pricing clear and separated from renewal pricing?',
                    required: true,
                  }
                : null,
              {
                id: 'pricing-objection-ready',
                question: 'Are you prepared to handle potential pricing objections?',
                required: true,
              },
            ].filter(Boolean) as Array<{ id: string; question: string; required: boolean }>,
          },
        ].filter(Boolean),
      },

      flowControl: {
        nextSlideLabel: 'Continue to Quote',
        canSkip: false,
      },
    };
  }
);

/**
 * Usage Examples:
 *
 * // Flat renewal (no price change)
 * pricingStrategySlide({
 *   variables: {
 *     priceChangeStrategy: 'flat',
 *     proposedARR: '$185,000',
 *     multiYearOption: true,
 *     multiYearTerm: '24 months',
 *     multiYearDiscount: '7%',
 *     multiYearARR: '$172,050'
 *   }
 * })
 *
 * // Price increase renewal
 * pricingStrategySlide({
 *   variables: {
 *     priceChangeStrategy: 'increase',
 *     proposedARR: '$203,500',
 *     changeAmount: '$18,500',
 *     changePercent: '10%',
 *     increaseRationale: 'Significant feature enhancements delivered, high customer satisfaction, market alignment',
 *     valueAchievements: 'Helped customer reduce operational costs by 30%, improved efficiency by 40%'
 *   }
 * })
 *
 * // Expansion renewal
 * pricingStrategySlide({
 *   variables: {
 *     priceChangeStrategy: 'expansion',
 *     proposedARR: '$185,000',
 *     includeExpansion: true,
 *     expansionType: '50 additional licenses',
 *     expansionARR: '$75,000',
 *     totalARR: '$260,000',
 *     multiYearOption: true
 *   }
 * })
 *
 * // Retention pricing (at-risk customer)
 * pricingStrategySlide({
 *   variables: {
 *     priceChangeStrategy: 'decrease',
 *     proposedARR: '$166,500',
 *     discountAmount: '$18,500',
 *     discountPercent: '10%',
 *     valueAchievements: 'Despite challenges, we delivered X, Y, Z value'
 *   }
 * })
 */
