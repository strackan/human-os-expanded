/**
 * Contract Provider
 * Fetches contract, usage, and market data for expansion opportunity workflows
 * Phase: 2B.2 (Data Extraction)
 */

import { createClient } from '@/lib/supabase/client';

export interface ContractData {
  licenseCount: number;
  pricePerSeat: number;
  annualSpend: number;
  renewalDate: string;
  renewalDays: number;
  term: string;
  autoRenew: boolean;
}

export interface UsageData {
  activeUsers: number;
  licenseCapacity: number;
  utilizationPercent: number;
  yoyGrowth: number;
  lastMonthGrowth: number;
  peakUsage: number;
  adoptionRate: number;
}

export interface MarketData {
  currentPrice: number;
  marketAverage: number;
  percentile: number;
  priceGap: number;
  similarCustomerRange: string;
  opportunityValue: string;
}

export interface PricingScenario {
  id: 'conservative' | 'balanced' | 'aggressive';
  name: string;
  recommended?: boolean;
  seatsChange: { from: number; to: number; percent: number };
  priceChange: { from: number; to: number; percent: number };
  arrChange: { from: number; to: number; percent: number };
  term: string;
  positioning: string;
  riskLevel: 'low' | 'medium' | 'high';
  justification: string[];
}

export interface ExpansionData {
  contract: ContractData;
  usage: UsageData;
  market: MarketData;
  scenarios: PricingScenario[];
}

/**
 * Calculate days until renewal
 */
function calculateRenewalDays(renewalDate: string): number {
  const today = new Date();
  const renewal = new Date(renewalDate);
  const diffTime = renewal.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate pricing scenarios based on current contract and usage
 */
function calculatePricingScenarios(
  contract: ContractData,
  usage: UsageData,
  market: MarketData
): PricingScenario[] {
  const { licenseCount, pricePerSeat, annualSpend } = contract;
  const { activeUsers, yoyGrowth } = usage;

  // Conservative: Capacity catch-up with modest price increase
  const conservative: PricingScenario = {
    id: 'conservative',
    name: 'Capacity Catch-Up',
    seatsChange: {
      from: licenseCount,
      to: Math.ceil(activeUsers * 1.1), // 10% headroom
      percent: Math.round(((activeUsers * 1.1 - licenseCount) / licenseCount) * 100)
    },
    priceChange: {
      from: pricePerSeat,
      to: pricePerSeat * 1.15, // 15% increase
      percent: 15
    },
    arrChange: {
      from: annualSpend,
      to: Math.ceil(activeUsers * 1.1) * (pricePerSeat * 1.15) * 12,
      percent: 0 // Will calculate below
    },
    term: '12 months',
    positioning: 'Increase capacity to meet current demand with modest price adjustment to market norms',
    riskLevel: 'low',
    justification: [
      `Addresses immediate capacity shortage (currently ${Math.round((activeUsers / licenseCount) * 100)}% utilized)`,
      `Price increase stays below market average ($${(pricePerSeat * 1.15).toFixed(2)} vs $${market.marketAverage.toFixed(2)})`,
      'Minimal risk given strong relationship and product adoption',
      'Positions for future growth without overcommitting'
    ]
  };
  conservative.arrChange.percent = Math.round(
    ((conservative.arrChange.to - annualSpend) / annualSpend) * 100
  );

  // Balanced: Growth alignment with market pricing
  const balanced: PricingScenario = {
    id: 'balanced',
    name: 'Growth & Value Alignment',
    recommended: true,
    seatsChange: {
      from: licenseCount,
      to: Math.ceil(activeUsers * 1.25), // 25% headroom for growth
      percent: Math.round(((activeUsers * 1.25 - licenseCount) / licenseCount) * 100)
    },
    priceChange: {
      from: pricePerSeat,
      to: market.marketAverage * 0.88, // 88% of market average
      percent: Math.round(((market.marketAverage * 0.88 - pricePerSeat) / pricePerSeat) * 100)
    },
    arrChange: {
      from: annualSpend,
      to: Math.ceil(activeUsers * 1.25) * (market.marketAverage * 0.88) * 12,
      percent: 0 // Will calculate below
    },
    term: '24 months',
    positioning: 'Multi-year partnership that scales with growth trajectory while bringing pricing closer to market value',
    riskLevel: 'medium',
    justification: [
      `Accommodates ${yoyGrowth}% YoY growth plus 25% headroom`,
      'Price adjustment to 88% of market average is defensible',
      'Multi-year lock-in provides predictability for both parties',
      'Optimal balance of revenue capture and relationship preservation',
      'Best value for customer given expansion trajectory'
    ]
  };
  balanced.arrChange.percent = Math.round(
    ((balanced.arrChange.to - annualSpend) / annualSpend) * 100
  );

  // Aggressive: Full market rate with maximum capacity
  const aggressive: PricingScenario = {
    id: 'aggressive',
    name: 'Market Rate Optimization',
    seatsChange: {
      from: licenseCount,
      to: Math.ceil(activeUsers * 1.5), // 50% headroom
      percent: Math.round(((activeUsers * 1.5 - licenseCount) / licenseCount) * 100)
    },
    priceChange: {
      from: pricePerSeat,
      to: market.marketAverage * 1.03, // 3% above market
      percent: Math.round(((market.marketAverage * 1.03 - pricePerSeat) / pricePerSeat) * 100)
    },
    arrChange: {
      from: annualSpend,
      to: Math.ceil(activeUsers * 1.5) * (market.marketAverage * 1.03) * 12,
      percent: 0 // Will calculate below
    },
    term: '36 months',
    positioning: 'Full market rate with maximum capacity for aggressive expansion',
    riskLevel: 'high',
    justification: [
      'Brings pricing above market average to capture full value',
      'Provides maximum capacity for aggressive hiring plans',
      '3-year commitment ensures stability through growth phase',
      'Highest revenue potential if executed with executive alignment'
    ]
  };
  aggressive.arrChange.percent = Math.round(
    ((aggressive.arrChange.to - annualSpend) / annualSpend) * 100
  );

  return [conservative, balanced, aggressive];
}

/**
 * Fetch expansion data for a customer
 * Returns contract, usage, market data, and calculated pricing scenarios
 */
export async function fetchExpansionData(customerId: string): Promise<ExpansionData> {
  try {
    const supabase = createClient();

    // Fetch contract data
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .single();

    if (contractError || !contractData) {
      throw new Error(`Failed to fetch contract: ${contractError?.message || 'No active contract found'}`);
    }

    // Fetch customer properties (usage and market data)
    const { data: propsData, error: propsError } = await supabase
      .from('customer_properties')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (propsError || !propsData) {
      throw new Error(`Failed to fetch customer properties: ${propsError?.message || 'No properties found'}`);
    }

    // Calculate price per seat
    const pricePerSeat = contractData.arr / contractData.seats / 12;

    // Build contract data
    const contract: ContractData = {
      licenseCount: contractData.seats || 0,
      pricePerSeat: pricePerSeat,
      annualSpend: contractData.arr || 0,
      renewalDate: contractData.end_date || '',
      renewalDays: calculateRenewalDays(contractData.end_date),
      term: `${contractData.term_months || 12} months`, // Use auto-calculated term_months from database
      autoRenew: contractData.auto_renewal || false
    };

    // Build usage data
    const usage: UsageData = {
      activeUsers: propsData.active_users || 0,
      licenseCapacity: contractData.seats || 0,
      utilizationPercent: propsData.utilization_percent || 0,
      yoyGrowth: propsData.yoy_growth || 0,
      lastMonthGrowth: propsData.last_month_growth || 0,
      peakUsage: propsData.peak_usage || 0,
      adoptionRate: propsData.adoption_rate || 0
    };

    // Build market data
    const market: MarketData = {
      currentPrice: pricePerSeat,
      marketAverage: propsData.market_price_average || 10.20,
      percentile: propsData.market_percentile || 50,
      priceGap: propsData.price_gap || 0,
      similarCustomerRange: propsData.similar_customer_range || '$8.00 - $12.00',
      opportunityValue: propsData.opportunity_value || 'TBD'
    };

    // Calculate pricing scenarios
    const scenarios = calculatePricingScenarios(contract, usage, market);

    console.log(`[ContractProvider] Fetched expansion data for customer ${customerId}`);
    console.log(`[ContractProvider] Utilization: ${usage.utilizationPercent}%, YoY Growth: ${usage.yoyGrowth}%`);

    return {
      contract,
      usage,
      market,
      scenarios
    };

  } catch (error) {
    console.error('[ContractProvider] Error fetching expansion data:', error);
    throw error;
  }
}
