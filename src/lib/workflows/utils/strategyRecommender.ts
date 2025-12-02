/**
 * Strategy Recommender
 *
 * Computes recommended renewal strategy based on customer data.
 * Used to ensure slides "sing from the same hymnal" - if Account Review
 * shows expansion opportunity, Pricing Strategy should reflect that.
 *
 * TEMPORARY: This uses static thresholds for now. Will be replaced with
 * live data integration once we have real-time customer metrics flowing
 * from InHerSight/CRM systems. The goal is to derive recommendations
 * from actual usage patterns, not hardcoded rules.
 *
 * Strategy Types:
 * - 'expansion': High utilization (>90%), below-market pricing, growth signals
 * - 'increase': Good health, at/below market pricing, value delivered
 * - 'flat': Standard renewal, maintaining relationship
 * - 'decrease': At-risk, retention focus, may need discount
 */

export type PriceChangeStrategy = 'expansion' | 'increase' | 'flat' | 'decrease';

export interface CustomerMetrics {
  // Usage metrics
  utilizationPercent?: number;      // License utilization (e.g., 110 = 110%)
  activeUsers?: number;
  licenseCount?: number;
  yoyGrowth?: number;               // Year-over-year growth percentage

  // Financial metrics
  currentPrice?: number;            // Current price per seat
  marketAverage?: number;           // Market average price
  currentARR?: number;

  // Health metrics
  healthScore?: number;             // 0-100
  riskScore?: number;               // 0-100 (higher = more risk)
  engagementScore?: number;         // 0-100

  // Contract info
  daysToRenewal?: number;
  autoRenew?: boolean;
}

export interface StrategyRecommendation {
  strategy: PriceChangeStrategy;
  confidence: number;               // 0-100
  reasoning: string[];
  includeExpansion: boolean;
  multiYearOption: boolean;
  suggestedChange?: {
    type: 'increase' | 'decrease' | 'expansion';
    percent?: number;
    amount?: number;
  };
}

/**
 * Calculate recommended strategy based on customer metrics
 */
export function recommendStrategy(metrics: CustomerMetrics): StrategyRecommendation {
  const reasoning: string[] = [];
  let strategy: PriceChangeStrategy = 'flat';
  let confidence = 50;
  let includeExpansion = false;
  let multiYearOption = false;
  let suggestedChange: StrategyRecommendation['suggestedChange'] = undefined;

  const {
    utilizationPercent = 100,
    healthScore = 70,
    riskScore = 30,
    currentPrice = 0,
    marketAverage = 0,
    yoyGrowth = 0,
  } = metrics;

  // === EXPANSION SIGNALS ===
  const isOverUtilized = utilizationPercent > 100;
  const highGrowth = yoyGrowth > 20;
  const belowMarket = marketAverage > 0 && currentPrice < marketAverage * 0.8;

  if (isOverUtilized) {
    reasoning.push(`High utilization (${utilizationPercent}%) - exceeding licensed capacity`);
    strategy = 'expansion';
    includeExpansion = true;
    confidence += 20;
  }

  if (highGrowth) {
    reasoning.push(`Strong YoY growth (${yoyGrowth}%) signals expansion readiness`);
    if (strategy !== 'expansion') strategy = 'expansion';
    includeExpansion = true;
    confidence += 15;
  }

  if (belowMarket && strategy === 'expansion') {
    const discount = Math.round((1 - currentPrice / marketAverage) * 100);
    reasoning.push(`Below market pricing (${discount}% discount) - room for expansion pricing`);
    confidence += 10;
  }

  // === INCREASE SIGNALS ===
  if (strategy !== 'expansion') {
    const goodHealth = healthScore >= 75;
    const lowRisk = riskScore < 40;

    if (goodHealth && lowRisk) {
      reasoning.push(`Strong health score (${healthScore}) with low risk`);
      if (belowMarket) {
        strategy = 'increase';
        reasoning.push('Below market pricing supports price increase');
        confidence += 15;
        suggestedChange = {
          type: 'increase',
          percent: Math.min(10, Math.round((marketAverage - currentPrice) / currentPrice * 50)),
        };
      }
    }
  }

  // === RETENTION/DECREASE SIGNALS ===
  const atRisk = riskScore >= 60 || healthScore < 50;
  const criticalRisk = riskScore >= 80 || healthScore < 30;

  if (atRisk) {
    strategy = 'decrease';
    reasoning.push(`Elevated risk (${riskScore}) or low health (${healthScore}) - retention focus`);
    confidence = criticalRisk ? 85 : 65;

    if (criticalRisk) {
      reasoning.push('Critical risk level - consider significant retention discount');
      suggestedChange = { type: 'decrease', percent: 10 };
    } else {
      reasoning.push('Moderate risk - maintain pricing with value demonstration');
    }
  }

  // === MULTI-YEAR CONSIDERATION ===
  if (strategy === 'expansion' || (strategy === 'flat' && healthScore >= 70)) {
    multiYearOption = true;
    reasoning.push('Consider multi-year option for commitment discount');
  }

  // Cap confidence
  confidence = Math.min(95, confidence);

  return {
    strategy,
    confidence,
    reasoning,
    includeExpansion,
    multiYearOption,
    suggestedChange,
  };
}

/**
 * Get strategy context for pricing slide based on customer data
 */
export function getPricingSlideContext(metrics: CustomerMetrics): Record<string, any> {
  const recommendation = recommendStrategy(metrics);

  return {
    priceChangeStrategy: recommendation.strategy,
    includeExpansion: recommendation.includeExpansion,
    multiYearOption: recommendation.multiYearOption,
    recommendedStrategy: recommendation,
    // Pass through for display
    utilizationPercent: metrics.utilizationPercent,
    marketAverage: metrics.marketAverage,
    currentPrice: metrics.currentPrice,
  };
}
