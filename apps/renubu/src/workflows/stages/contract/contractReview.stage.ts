/**
 * Contract Review Stage Configuration
 *
 * Generates a reusable contract review artifact for renewal workflows
 */

export interface ContractReviewConfig {
  contractId: string;
  customerName: string;
  contractValue: number;
  renewalDate: string;
  signerBaseAmount: number;
  pricingCalculation: {
    basePrice: number;
    volumeDiscount: number;
    additionalServices: number;
    totalPrice: number;
  };
  businessTerms: {
    unsigned: string[];
    nonStandardRenewal: string[];
    nonStandardPricing: string[];
    pricingCaps: string[];
    otherTerms: string[];
  };
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdated: string;
}

/**
 * Creates a contract review artifact section
 *
 * @param config - Contract review configuration
 * @returns Artifact section for contract review
 */
export function createContractReviewStage(config: ContractReviewConfig) {
  return {
    id: 'enterprise-contract',
    title: 'Contract Review',
    type: 'contract' as const,
    visible: false,
    data: {
      contractId: config.contractId,
      customerName: config.customerName,
      contractValue: config.contractValue,
      renewalDate: config.renewalDate,
      signerBaseAmount: config.signerBaseAmount,
      pricingCalculation: config.pricingCalculation,
      businessTerms: config.businessTerms,
      riskLevel: config.riskLevel,
      lastUpdated: config.lastUpdated
    }
  };
}

/**
 * Default contract review configuration for Dynamic Corp
 */
export const dynamicCorpContractConfig: ContractReviewConfig = {
  contractId: 'DYN-2024-0512',
  customerName: 'Dynamic Corp',
  contractValue: 725000,
  renewalDate: 'February 28, 2026',
  signerBaseAmount: 725000,
  pricingCalculation: {
    basePrice: 725000,
    volumeDiscount: 0,
    additionalServices: 0,
    totalPrice: 725000
  },
  businessTerms: {
    unsigned: [],
    nonStandardRenewal: [
      'Standard 12-month renewal cycle',
      'Automatic renewal with 60-day notice'
    ],
    nonStandardPricing: [
      'Multi-year discount available (10% for 2-year, 20% for 3-year)',
      'Volume pricing tiers unlock at 150,000+ licenses'
    ],
    pricingCaps: [
      'Annual price increases capped at 8% maximum'
    ],
    otherTerms: [
      'Standard support with 24-hour response SLA',
      'Quarterly business reviews included',
      'API access with standard rate limits'
    ]
  },
  riskLevel: 'low',
  lastUpdated: 'January 15, 2025'
};
