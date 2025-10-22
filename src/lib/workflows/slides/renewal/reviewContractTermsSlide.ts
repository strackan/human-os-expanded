/**
 * Review Contract Terms Slide - Renewal-Specific Slide
 *
 * Used ONLY in renewal workflows to review current contract terms and identify
 * what needs to change for the renewal.
 *
 * This is workflow-specific to renewals - not reused in risk, opportunity, or strategic workflows.
 *
 * Context customization:
 * - currentContract: Details about the current contract
 * - renewalDate: When the contract is up for renewal
 * - proposedChanges: Any changes being considered for the renewal
 */

import { SlideBuilder, SlideContext, createSlideBuilder } from '../baseSlide';

/**
 * Review Contract Terms Slide Builder
 *
 * Renewal-specific slide for reviewing current contract and planning renewal terms.
 */
export const reviewContractTermsSlide: SlideBuilder = createSlideBuilder(
  {
    id: 'review-contract-terms',
    name: 'Review Contract Terms',
    category: 'renewal',
    requiredFields: [
      'customer.name',
      'customer.contract_start_date',
      'customer.contract_end_date',
      'customer.current_arr',
    ],
  },
  (context?: SlideContext) => {
    const contractTerm = context?.variables?.contractTerm || 12; // months
    const paymentTerms = context?.variables?.paymentTerms || 'annual';
    const includeChanges = context?.variables?.includeChanges !== false;

    return {
      layout: 'side-by-side',
      chatInstructions: [
        `You are helping review the current contract terms for a renewal.`,
        ``,
        `Contract Details:`,
        `- Customer: {{customer.name}}`,
        `- Current ARR: {{customer.current_arr}}`,
        `- Contract Start: {{customer.contract_start_date}}`,
        `- Contract End: {{customer.contract_end_date}}`,
        `- Contract Term: ${contractTerm} months`,
        `- Payment Terms: ${paymentTerms}`,
        ``,
        `Your role is to help the CSM:`,
        `1. Review all current contract terms`,
        `2. Identify what's working and what needs to change`,
        `3. Consider customer requests or needs`,
        `4. Prepare renewal terms proposal`,
        ``,
        `Answer questions about:`,
        `- Current contract terms and what they mean`,
        `- Common renewal modifications`,
        `- Best practices for renewal terms`,
        `- How to handle term length negotiations`,
        `- Pricing and payment term strategies`,
      ].join('\n'),

      artifactPanel: {
        title: 'Contract Review',
        content: [
          {
            type: 'intro' as const,
            content: `Let's review {{customer.name}}'s current contract to prepare for the renewal conversation.`,
          },
          {
            type: 'section' as const,
            title: 'Current Contract',
            subsections: [
              {
                title: 'Term & Dates',
                items: [
                  {
                    label: 'Contract Start Date',
                    value: '{{customer.contract_start_date}}',
                    type: 'text' as const,
                  },
                  {
                    label: 'Contract End Date',
                    value: '{{customer.contract_end_date}}',
                    type: 'text' as const,
                  },
                  {
                    label: 'Contract Term',
                    value: `${contractTerm} months`,
                    type: 'text' as const,
                  },
                  {
                    label: 'Days Until Renewal',
                    value: '{{days_until_renewal}}',
                    type: 'badge' as const,
                  },
                ],
              },
              {
                title: 'Financial Terms',
                items: [
                  {
                    label: 'Current ARR',
                    value: '{{customer.current_arr}}',
                    type: 'text' as const,
                  },
                  {
                    label: 'Payment Terms',
                    value: paymentTerms.charAt(0).toUpperCase() + paymentTerms.slice(1),
                    type: 'text' as const,
                  },
                  {
                    label: 'Auto-Renewal',
                    value: '{{customer.auto_renewal}}',
                    type: 'text' as const,
                  },
                ],
              },
              {
                title: 'Product & Services',
                items: [
                  {
                    label: 'Products',
                    value: '{{customer.products}}',
                    type: 'text' as const,
                  },
                  {
                    label: 'License Count',
                    value: '{{customer.license_count}}',
                    type: 'text' as const,
                  },
                  {
                    label: 'Support Level',
                    value: '{{customer.support_level}}',
                    type: 'text' as const,
                  },
                ],
              },
            ],
          },
          {
            type: 'section' as const,
            title: 'Usage & Performance',
            subsections: [
              {
                title: 'Metrics',
                items: [
                  {
                    label: 'Utilization',
                    value: '{{customer.utilization_percent}}%',
                    type: 'text' as const,
                  },
                  {
                    label: 'Active Users',
                    value: '{{customer.active_users}} of {{customer.license_count}}',
                    type: 'text' as const,
                  },
                  {
                    label: 'Health Score',
                    value: '{{customer.health_score}}',
                    type: 'badge' as const,
                  },
                ],
              },
            ],
          },
          includeChanges
            ? {
                type: 'section' as const,
                title: 'Proposed Changes',
                subsections: [
                  {
                    title: 'Recommendations',
                    items: [
                      {
                        label: 'Contract Term',
                        value: context?.variables?.proposedTerm || `${contractTerm} months (no change)`,
                        type: 'editable-text' as const,
                        helpText: 'Recommended contract term for renewal',
                      },
                      {
                        label: 'License Count',
                        value: context?.variables?.proposedLicenses || '{{customer.license_count}} (no change)',
                        type: 'editable-text' as const,
                        helpText: 'Recommended license count based on usage',
                      },
                      {
                        label: 'Support Level',
                        value: context?.variables?.proposedSupport || '{{customer.support_level}} (no change)',
                        type: 'editable-text' as const,
                        helpText: 'Recommended support level',
                      },
                      {
                        label: 'Payment Terms',
                        value: context?.variables?.proposedPayment || paymentTerms,
                        type: 'editable-text' as const,
                        helpText: 'Proposed payment terms (annual, quarterly, monthly)',
                      },
                    ],
                  },
                  {
                    title: 'Additional Considerations',
                    items: [
                      {
                        label: 'Expansion Opportunity',
                        value: context?.variables?.expansionNotes || 'Review utilization trends',
                        type: 'editable-textarea' as const,
                        helpText: 'Notes on expansion potential',
                      },
                      {
                        label: 'Discount Discussion',
                        value: context?.variables?.discountNotes || 'Standard renewal pricing',
                        type: 'editable-textarea' as const,
                        helpText: 'Discount strategy for renewal',
                      },
                    ],
                  },
                ],
              }
            : null,
          {
            type: 'qa-section' as const,
            title: 'Contract Review Checklist',
            questions: [
              {
                id: 'contract-terms-reviewed',
                question: 'Have you reviewed all current contract terms?',
                required: true,
              },
              {
                id: 'contract-usage-analyzed',
                question: 'Have you analyzed their usage relative to the contract?',
                required: true,
              },
              includeChanges
                ? {
                    id: 'contract-changes-identified',
                    question: 'Have you identified what should change in the renewal?',
                    required: true,
                  }
                : null,
              {
                id: 'contract-customer-needs',
                question: 'Do you understand any changes the customer may want?',
                required: true,
              },
            ].filter(Boolean) as Array<{ id: string; question: string; required: boolean }>,
          },
        ].filter(Boolean),
      },

      flowControl: {
        nextSlideLabel: 'Continue to Pricing',
        canSkip: false,
      },
    };
  }
);

/**
 * Usage Examples:
 *
 * // Standard contract review
 * reviewContractTermsSlide({
 *   variables: {
 *     contractTerm: 12,
 *     paymentTerms: 'annual',
 *     includeChanges: true
 *   }
 * })
 *
 * // Contract review with proposed changes
 * reviewContractTermsSlide({
 *   variables: {
 *     contractTerm: 12,
 *     paymentTerms: 'annual',
 *     includeChanges: true,
 *     proposedTerm: '24 months',
 *     proposedLicenses: '150 (up from 100 due to high utilization)',
 *     proposedSupport: 'Premium (upgrade recommended)',
 *     proposedPayment: 'annual',
 *     expansionNotes: 'Team is at 95% utilization - strong case for expansion',
 *     discountNotes: 'Standard pricing with 5% multi-year discount if they commit to 24 months'
 *   }
 * })
 */
