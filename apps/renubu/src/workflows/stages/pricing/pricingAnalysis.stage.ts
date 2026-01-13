/**
 * Pricing Analysis Stage Configuration
 *
 * Generates a reusable pricing analysis artifact for renewal workflows
 */

export interface PricingAnalysisConfig {
  customerName: string;
  currentPrice: number;
  currentARR: number;
  pricePerUnit: number;
  unitType: string;
  comparativeAnalysis: {
    averagePrice: number;
    percentile: number;
    similarCustomerCount: number;
  };
  usageMetrics: {
    currentUsage: number;
    usageGrowth: number;
    usageEfficiency: number;
  };
  riskFactors: Array<{
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  opportunities: Array<{
    title: string;
    description: string;
    potential: 'low' | 'medium' | 'high';
  }>;
  recommendation: {
    priceIncrease: number;
    newAnnualPrice: number;
    reasons: string[];
  };
}

/**
 * Creates a pricing analysis artifact section
 *
 * @param config - Pricing analysis configuration
 * @returns Artifact section for pricing strategy analysis
 */
export function createPricingAnalysisStage(config: PricingAnalysisConfig) {
  return {
    id: 'pricing-analysis-renewal',
    title: 'Pricing Strategy Analysis',
    type: 'pricing-analysis' as const,
    visible: false,
    content: {
      title: 'Renewal Pricing Analysis',
      customerName: config.customerName,
      currentPrice: config.currentPrice,
      currentARR: config.currentARR,
      pricePerUnit: config.pricePerUnit,
      unitType: config.unitType,
      comparativeAnalysis: config.comparativeAnalysis,
      usageMetrics: config.usageMetrics,
      riskFactors: config.riskFactors,
      opportunities: config.opportunities,
      recommendation: config.recommendation
    }
  };
}

/**
 * Default pricing analysis configuration for Dynamic Corp
 */
export const dynamicCorpPricingConfig: PricingAnalysisConfig = {
  customerName: 'Dynamic Corp',
  currentPrice: 725000,
  currentARR: 725000,
  pricePerUnit: 7.25,
  unitType: 'seat/month',
  comparativeAnalysis: {
    averagePrice: 8.50,
    percentile: 35,
    similarCustomerCount: 47
  },
  usageMetrics: {
    currentUsage: 87,
    usageGrowth: 23,
    usageEfficiency: 92
  },
  riskFactors: [
    {
      title: 'Price Cap Constraint',
      description: '8% maximum price increase specified in current contract',
      impact: 'medium'
    },
    {
      title: 'Competitive Pressure',
      description: 'Competitors offering aggressive pricing in the market',
      impact: 'medium'
    }
  ],
  opportunities: [
    {
      title: 'High Usage Growth',
      description: '23% increase in platform usage over last quarter',
      potential: 'high'
    },
    {
      title: 'APAC Expansion',
      description: 'Customer expanding operations to new geographic region',
      potential: 'high'
    },
    {
      title: 'Series C Funding',
      description: 'Recent funding round provides budget flexibility',
      potential: 'high'
    }
  ],
  recommendation: {
    priceIncrease: 8,
    newAnnualPrice: 783000,
    reasons: [
      'Usage metrics show 87% platform utilization, well above the 60% average',
      'Current pricing at 35th percentile presents optimization opportunity',
      'APAC expansion justifies premium support and infrastructure pricing',
      'Series C funding indicates strong financial position for investment',
      '8% increase maximizes value while respecting contractual price cap'
    ]
  }
};
