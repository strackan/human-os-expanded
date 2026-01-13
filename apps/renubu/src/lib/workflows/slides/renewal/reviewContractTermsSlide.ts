/**
 * Review Contract Terms Slide - Renewal-Specific Slide
 *
 * Used ONLY in renewal workflows to review current contract terms and identify
 * what needs to change for the renewal.
 *
 * This is workflow-specific to renewals - not reused in risk, opportunity, or strategic workflows.
 */

import type { UniversalSlideBuilder } from '../baseSlide';

/**
 * Review Contract Terms Slide Builder
 *
 * Renewal-specific slide for reviewing current contract and planning renewal terms.
 */
export const reviewContractTermsSlide: UniversalSlideBuilder = (context): any => ({
  id: 'review-contract-terms',
  version: '2',
  name: 'Review Contract Terms',
  category: 'renewal',

  structure: {
    id: 'review-contract-terms',
    title: 'Review Contract Terms',
    description: 'Review current contract and plan renewal terms',
    label: 'Contract Review',
    stepMapping: 'review-contract-terms',
    showSideMenu: true,

    chat: {
      initialMessage: {
        text: context?.variables?.message ||
          `Let's review {{customer.name}}'s current contract to prepare for the renewal conversation. I've pulled together the key terms and dates.`,
        buttons: [
          {
            label: 'Review Contract',
            value: 'review',
            'label-background': 'bg-blue-600',
            'label-text': 'text-white',
          },
        ],
        nextBranches: {
          'review': 'review',
        },
      },
      branches: {
        review: {
          response: 'Great! Take a look at the contract summary. Make note of any terms you want to discuss or change.',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'Ready to review the contract terms?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'contract-review',
          type: 'component:interactive',
          title: 'Contract Review',
          visible: true,
          data: {
            componentType: 'ContractArtifact',
            props: {
              data: {
                contractId: context?.variables?.contractId || 'CNT-2024-001',
                customerName: '{{customer.name}}',
                contractValue: context?.variables?.contractValue || 180000,
                renewalDate: '{{customer.renewal_date}}',
                signerBaseAmount: context?.variables?.signerBaseAmount || 150000,
                pricingCalculation: {
                  basePrice: context?.variables?.basePrice || 150000,
                  volumeDiscount: context?.variables?.volumeDiscount || -15000,
                  additionalServices: context?.variables?.additionalServices || 45000,
                  totalPrice: context?.variables?.totalPrice || 180000,
                },
                businessTerms: {
                  unsigned: context?.variables?.unsignedTerms || [],
                  nonStandardRenewal: context?.variables?.nonStandardRenewal || ['90-day notice period (standard: 30 days)'],
                  nonStandardPricing: context?.variables?.nonStandardPricing || [],
                  pricingCaps: context?.variables?.pricingCaps || ['Maximum 10% annual increase'],
                  otherTerms: context?.variables?.otherTerms || ['Priority support included'],
                },
                riskLevel: context?.variables?.riskLevel || 'low',
                lastUpdated: context?.variables?.lastUpdated || 'November 2024',
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
