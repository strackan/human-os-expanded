/**
 * Pricing Optimization Engine
 *
 * Multi-factor pricing recommendation system for renewal workflows.
 *
 * Analyzes:
 * - Stickiness (feature adoption, integrations, data volume, customizations)
 * - Value Leverage (quantified ROI, usage growth, value perception)
 * - Market Position (peer benchmarks, competitive landscape)
 * - Risk Factors (churn risk, budget pressure, competitive threats)
 * - Trend Data (30-day usage, engagement, sentiment)
 *
 * Outputs:
 * - Recommended price with confidence score (0-100)
 * - Data-backed reasoning
 * - 3 scenarios (Conservative, Recommended, Aggressive)
 * - Factor breakdown for transparency
 *
 * NOTE: Many data sources have PLACEHOLDERS for future integration
 * (sentiment analysis, competitive intelligence, risk scoring, market benchmarks)
 */

const { generateLLMResponse } = require('../services/llmService');

/**
 * Generate pricing recommendation
 *
 * @param {Object} context - Workflow execution context
 * @returns {Object} Pricing recommendation
 */
async function generatePricingRecommendation(context) {
  const {
    customer,
    discoveryOutputs,
    dataSnapshot,
    pricingStrategy,
    workflowExecution
  } = context;

  console.log(`\n💵 Generating Pricing Recommendation for ${customer.name}...`);
  console.log(`   Current ARR: $${customer.arr.toLocaleString()}`);
  console.log(`   Days to Renewal: ${customer.daysUntilRenewal}`);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Calculate Stickiness Score (0-100)
  // ─────────────────────────────────────────────────────────────────────────

  const stickiness = calculateStickinessScore({
    featureAdoption: dataSnapshot.featureAdoption || 0.75,
    integrationCount: dataSnapshot.integrations || 0,
    dataVolumeTB: dataSnapshot.dataVolume || 0,
    activeUsers: dataSnapshot.activeUsers || Math.floor(customer.seatCount * 0.7),
    seatCount: customer.seatCount,
    customizations: dataSnapshot.customizations || 0,
    customerTenure: calculateTenureMonths(customer.firstContractDate)
  });

  console.log(`   Stickiness Score: ${stickiness.score}/100`);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Calculate Value Leverage Index
  // ─────────────────────────────────────────────────────────────────────────

  const valueLeverage = calculateValueLeverage({
    currentARR: customer.arr,
    quantifiedValue: discoveryOutputs.quantifiedValue || 0,
    usageGrowth: dataSnapshot.usageGrowth || 0,
    valuePerceptionChange: pricingStrategy.valuePerceptionChange || 'neutral'
  });

  console.log(`   Value Index: ${valueLeverage.index.toFixed(2)}`);
  console.log(`   Value Trend: ${valueLeverage.trend}`);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Market Position Analysis
  // ─────────────────────────────────────────────────────────────────────────

  const marketPosition = analyzeMarketPosition({
    customerARR: customer.arr,
    seatCount: customer.seatCount,
    industry: customer.industry || 'Technology',
    region: customer.region || 'North America',
    competitivePressure: pricingStrategy.competitivePressure || 'none'
  });

  console.log(`   Peer Benchmark Ratio: ${marketPosition.peerBenchmarkRatio.toFixed(2)}`);

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Risk Factor Assessment
  // ─────────────────────────────────────────────────────────────────────────

  const riskFactors = assessRiskFactors({
    relationshipStrength: discoveryOutputs.relationshipStrength || 5,
    renewalConfidence: discoveryOutputs.renewalConfidence || 5,
    renewalConfidenceCurrentPrice: pricingStrategy.renewalConfidenceCurrentPrice || 7,
    budgetPressure: discoveryOutputs.budgetPressure || 50,
    competitiveThreat: discoveryOutputs.competitiveThreat || 30,
    sentimentScore: dataSnapshot.sentimentScore || 70,
    riskTolerance: pricingStrategy.riskTolerance || 'medium'
  });

  console.log(`   Churn Risk: ${riskFactors.churnRisk}/100`);

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Calculate Base Price Increase
  // ─────────────────────────────────────────────────────────────────────────

  let baseIncrease = 0;

  // Factor 1: Stickiness (0-8% influence)
  baseIncrease += (stickiness.score / 100) * 0.08;
  console.log(`      Stickiness contribution: +${((stickiness.score / 100) * 0.08 * 100).toFixed(1)}%`);

  // Factor 2: Value leverage (0-5% influence)
  if (valueLeverage.index > 1.5) {
    baseIncrease += 0.05;
    console.log(`      Value leverage contribution: +5.0% (high value delivered)`);
  } else if (valueLeverage.index > 1.2) {
    baseIncrease += 0.03;
    console.log(`      Value leverage contribution: +3.0% (moderate value)`);
  } else if (valueLeverage.index > 1.0) {
    baseIncrease += 0.01;
    console.log(`      Value leverage contribution: +1.0% (neutral value)`);
  } else {
    console.log(`      Value leverage contribution: 0% (no quantified value)`);
  }

  // Factor 3: Market position (0-3% influence)
  if (marketPosition.peerBenchmarkRatio < 0.95) {
    baseIncrease += 0.03;
    console.log(`      Market position contribution: +3.0% (underpriced)`);
  } else if (marketPosition.peerBenchmarkRatio < 1.0) {
    baseIncrease += 0.02;
    console.log(`      Market position contribution: +2.0% (slightly underpriced)`);
  } else if (marketPosition.peerBenchmarkRatio < 1.05) {
    baseIncrease += 0.01;
    console.log(`      Market position contribution: +1.0% (market-aligned)`);
  } else {
    console.log(`      Market position contribution: 0% (at or above market)`);
  }

  // Factor 4: Trend adjustment (-2% to +2%)
  if (dataSnapshot.usageGrowth > 0.15) {
    baseIncrease += 0.02;
    console.log(`      Trend adjustment: +2.0% (strong growth)`);
  } else if (dataSnapshot.usageGrowth > 0.05) {
    baseIncrease += 0.01;
    console.log(`      Trend adjustment: +1.0% (positive growth)`);
  } else if (dataSnapshot.usageGrowth < -0.10) {
    baseIncrease -= 0.02;
    console.log(`      Trend adjustment: -2.0% (declining usage)`);
  } else {
    console.log(`      Trend adjustment: 0% (stable)`);
  }

  console.log(`   Base Increase (before risk): ${(baseIncrease * 100).toFixed(1)}%`);

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Apply Risk Multiplier
  // ─────────────────────────────────────────────────────────────────────────

  let riskMultiplier = 1.0;

  if (riskFactors.churnRisk > 60) {
    riskMultiplier = 0.5;
    console.log(`   Risk Multiplier: 0.5x (high churn risk)`);
  } else if (riskFactors.churnRisk > 40) {
    riskMultiplier = 0.75;
    console.log(`   Risk Multiplier: 0.75x (medium churn risk)`);
  } else if (riskFactors.churnRisk < 20) {
    riskMultiplier = 1.1;
    console.log(`   Risk Multiplier: 1.1x (low risk, can be aggressive)`);
  } else {
    console.log(`   Risk Multiplier: 1.0x (moderate risk)`);
  }

  const adjustedIncrease = baseIncrease * riskMultiplier;

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Apply Constraints
  // ─────────────────────────────────────────────────────────────────────────

  const contractCap = discoveryOutputs.priceIncreaseCap || 0.10;
  const pricingGoal = pricingStrategy.pricingGoal || 'market';

  // Adjust based on CSM's pricing goal
  let goalAdjustment = 1.0;
  if (pricingGoal === 'maintain') {
    goalAdjustment = 0;  // No increase
  } else if (pricingGoal === 'modest') {
    goalAdjustment = 0.6;  // Conservative
  } else if (pricingGoal === 'aggressive') {
    goalAdjustment = 1.2;  // Push higher
  } else if (pricingGoal === 'defensive') {
    goalAdjustment = -0.05;  // Discount
  }
  // 'market' = 1.0 (default)

  const goalAdjustedIncrease = adjustedIncrease * goalAdjustment;

  // Apply contract cap
  const finalIncrease = Math.min(
    Math.max(goalAdjustedIncrease, -0.05),  // Floor at -5% discount
    contractCap  // Ceiling at contract cap
  );

  const targetPrice = Math.round(customer.arr * (1 + finalIncrease));

  console.log(`   Final Increase: ${(finalIncrease * 100).toFixed(1)}%`);
  console.log(`   Target Price: $${targetPrice.toLocaleString()}`);

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Calculate Confidence Score (0-100)
  // ─────────────────────────────────────────────────────────────────────────

  const dataQuality = {
    usage: dataSnapshot.usageData ? 100 : 50,
    financial: customer.arr ? 100 : 0,
    sentiment: dataSnapshot.sentimentScore ? 70 : 30,  // PLACEHOLDER
    competitive: marketPosition.peerBenchmark ? 60 : 20,  // PLACEHOLDER
    risk: discoveryOutputs.relationshipStrength ? 80 : 40
  };

  const avgDataQuality = Object.values(dataQuality).reduce((a, b) => a + b, 0) / 5;

  // Confidence also considers alignment with CSM strategy
  const strategyAlignment = pricingGoal === 'market' ? 1.0 :
                           pricingGoal === 'modest' ? 0.95 :
                           pricingGoal === 'aggressive' ? 0.85 :
                           pricingGoal === 'maintain' ? 1.0 : 0.9;

  const confidence = Math.round(avgDataQuality * strategyAlignment);

  console.log(`   Confidence Score: ${confidence}/100`);

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Generate Reasoning
  // ─────────────────────────────────────────────────────────────────────────

  const reasoning = generateReasoning({
    stickiness,
    valueLeverage,
    marketPosition,
    riskFactors,
    dataSnapshot,
    finalIncrease,
    contractCap,
    targetPrice,
    currentARR: customer.arr
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 10. Generate Alternative Scenarios
  // ─────────────────────────────────────────────────────────────────────────

  const scenarios = generateScenarios({
    currentARR: customer.arr,
    recommendedIncrease: finalIncrease,
    recommendedPrice: targetPrice,
    contractCap,
    riskFactors,
    valueLeverage,
    stickiness,
    marketPosition
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 11. Store in Database (for tracking and audit)
  // ─────────────────────────────────────────────────────────────────────────

  // In production, would save to pricing_optimizations table
  // await savePricingOptimization({ customer, recommendation, factors, ... });

  // ─────────────────────────────────────────────────────────────────────────
  // 12. Return Results
  // ─────────────────────────────────────────────────────────────────────────

  return {
    recommendation: {
      targetPrice,
      increaseAmount: targetPrice - customer.arr,
      increasePercent: finalIncrease * 100,
      confidence,
      reasoning,
      scenarios
    },
    factors: {
      stickinessScore: stickiness.score,
      valueIndex: valueLeverage.index,
      valueTrend: valueLeverage.trend,
      peerBenchmarkRatio: marketPosition.peerBenchmarkRatio,
      churnRisk: riskFactors.churnRisk,
      riskMultiplier,
      baseIncrease: baseIncrease * 100,
      adjustedIncrease: adjustedIncrease * 100,
      finalIncrease: finalIncrease * 100
    },
    dataQuality: {
      usage: dataQuality.usage > 80 ? 'complete' : dataQuality.usage > 50 ? 'partial' : 'placeholder',
      financial: dataQuality.financial > 80 ? 'complete' : 'partial',
      sentiment: dataQuality.sentiment > 60 ? 'partial' : 'placeholder',
      competitive: dataQuality.competitive > 50 ? 'partial' : 'placeholder',
      risk: dataQuality.risk > 70 ? 'complete' : 'partial',
      overallConfidence: confidence
    }
  };
}

/**
 * Calculate Stickiness Score (0-100)
 * Higher score = customer is more embedded = more pricing power
 */
function calculateStickinessScore(inputs) {
  const {
    featureAdoption,      // 0-1 (% of features used)
    integrationCount,     // Number of integrations
    dataVolumeTB,        // TB of data stored
    activeUsers,         // Active users
    seatCount,          // Total seats
    customizations,     // Custom workflows/configs
    customerTenure      // Months as customer
  } = inputs;

  // Weighted scoring
  let score = 0;

  // Feature adoption (0-30 points)
  score += featureAdoption * 30;

  // Integrations (0-20 points, capped)
  score += Math.min(integrationCount * 5, 20);

  // Data volume (0-15 points, capped)
  score += Math.min(dataVolumeTB * 2, 15);

  // User engagement ratio (0-20 points)
  const userEngagementRatio = seatCount > 0 ? activeUsers / seatCount : 0.5;
  score += userEngagementRatio * 20;

  // Customizations (0-10 points, capped)
  score += Math.min(customizations * 3, 10);

  // Customer tenure (0-5 points, capped)
  score += Math.min((customerTenure / 12) * 5, 5);

  return {
    score: Math.round(score),
    components: {
      featureAdoption: Math.round(featureAdoption * 30),
      integrations: Math.round(Math.min(integrationCount * 5, 20)),
      dataVolume: Math.round(Math.min(dataVolumeTB * 2, 15)),
      userEngagement: Math.round(userEngagementRatio * 20),
      customizations: Math.round(Math.min(customizations * 3, 10)),
      tenure: Math.round(Math.min((customerTenure / 12) * 5, 5))
    }
  };
}

/**
 * Calculate Value Leverage Index
 * Ratio of value delivered to price paid
 */
function calculateValueLeverage(inputs) {
  const {
    currentARR,
    quantifiedValue,
    usageGrowth,
    valuePerceptionChange
  } = inputs;

  // Value index: value delivered / price paid
  const index = quantifiedValue > 0 ? quantifiedValue / currentARR : 1.0;

  // Determine trend based on usage growth and perception
  let trend = 'stable';
  if (usageGrowth > 0.1 || valuePerceptionChange === 'significantly_improved') {
    trend = 'improving';
  } else if (usageGrowth < -0.05 || valuePerceptionChange === 'declined') {
    trend = 'declining';
  }

  return {
    index,
    trend,
    quantifiedValue,
    usageGrowth
  };
}

/**
 * Analyze Market Position
 * Compare customer's pricing to market benchmarks
 */
function analyzeMarketPosition(inputs) {
  const {
    customerARR,
    seatCount,
    industry,
    region,
    competitivePressure
  } = inputs;

  // PLACEHOLDER: In production, would call market data API
  // For now, using simplified logic

  // Average price per seat for industry/region
  const industryAveragePricePerSeat = {
    'Technology': 2500,
    'Healthcare': 3000,
    'Finance': 3500,
    'Retail': 2000,
    'Manufacturing': 2200
  }[industry] || 2500;

  const customerPricePerSeat = seatCount > 0 ? customerARR / seatCount : industryAveragePricePerSeat;

  // Peer benchmark ratio
  const peerBenchmarkRatio = customerPricePerSeat / industryAveragePricePerSeat;

  // Competitive position
  let competitivePosition = 'same';
  if (competitivePressure === 'none') {
    competitivePosition = 'stronger';
  } else if (competitivePressure === 'high') {
    competitivePosition = 'weaker';
  }

  return {
    peerBenchmarkRatio,
    competitivePosition,
    customerPricePerSeat,
    industryAverage: industryAveragePricePerSeat,
    peerBenchmark: peerBenchmarkRatio > 0.8  // Has some benchmark data
  };
}

/**
 * Assess Risk Factors
 * Calculate churn risk and other risk indicators
 */
function assessRiskFactors(inputs) {
  const {
    relationshipStrength,        // 1-10
    renewalConfidence,           // 1-10
    renewalConfidenceCurrentPrice, // 1-10
    budgetPressure,             // 0-100
    competitiveThreat,          // 0-100
    sentimentScore,             // 0-100
    riskTolerance              // low | medium | high
  } = inputs;

  // Churn risk: inverse of confidence/relationship
  let churnRisk = 100 - (renewalConfidenceCurrentPrice * 10);

  // Adjust for relationship strength
  churnRisk -= (relationshipStrength - 5) * 3;

  // Adjust for budget pressure
  churnRisk += (budgetPressure - 50) * 0.2;

  // Adjust for competitive threat
  churnRisk += (competitiveThreat - 30) * 0.15;

  // Adjust for sentiment
  churnRisk -= (sentimentScore - 70) * 0.1;

  // Clamp to 0-100
  churnRisk = Math.max(0, Math.min(100, churnRisk));

  return {
    churnRisk: Math.round(churnRisk),
    budgetPressure,
    competitiveThreat,
    sentimentScore,
    relationshipStrength,
    renewalConfidence
  };
}

/**
 * Generate reasoning for pricing recommendation
 */
function generateReasoning(inputs) {
  const {
    stickiness,
    valueLeverage,
    marketPosition,
    riskFactors,
    dataSnapshot,
    finalIncrease,
    contractCap,
    targetPrice,
    currentARR
  } = inputs;

  const reasoning = [];

  // Stickiness reasoning
  if (stickiness.score > 80) {
    reasoning.push(`🔺 High Stickiness (${stickiness.score}/100): Customer deeply embedded with ${stickiness.components.integrations} integrations, ${(stickiness.components.featureAdoption / 30 * 100).toFixed(0)}% feature adoption → low switching risk`);
  } else if (stickiness.score > 60) {
    reasoning.push(`🔸 Moderate Stickiness (${stickiness.score}/100): Customer has good product adoption → some pricing flexibility`);
  } else {
    reasoning.push(`🔻 Lower Stickiness (${stickiness.score}/100): Customer adoption could be stronger → conservative pricing recommended`);
  }

  // Value leverage reasoning
  if (valueLeverage.index > 1.5) {
    reasoning.push(`🔺 Strong Value Leverage (${valueLeverage.index.toFixed(2)}x): Delivering $${valueLeverage.quantifiedValue.toLocaleString()} value vs. $${currentARR.toLocaleString()} price → justifies increase`);
  } else if (valueLeverage.index > 1.0) {
    reasoning.push(`🔸 Positive Value (${valueLeverage.index.toFixed(2)}x): Delivering value above price → supports modest increase`);
  }

  // Usage trend reasoning
  if (dataSnapshot.usageGrowth > 0.1) {
    reasoning.push(`🔺 Usage Growing (+${(dataSnapshot.usageGrowth * 100).toFixed(1)}%): Customer seeing increasing value → positive signal`);
  } else if (dataSnapshot.usageGrowth < -0.05) {
    reasoning.push(`🔻 Usage Declining (${(dataSnapshot.usageGrowth * 100).toFixed(1)}%): Reduced activity → caution on pricing`);
  }

  // Market position reasoning
  if (marketPosition.peerBenchmarkRatio < 0.95) {
    reasoning.push(`🔺 Below Market Rate (${(marketPosition.peerBenchmarkRatio * 100).toFixed(0)}% of peers): $${marketPosition.customerPricePerSeat.toFixed(0)}/seat vs. $${marketPosition.industryAverage}/seat industry avg → room to increase`);
  } else if (marketPosition.peerBenchmarkRatio > 1.05) {
    reasoning.push(`🔻 Above Market Rate (${(marketPosition.peerBenchmarkRatio * 100).toFixed(0)}% of peers): Already at premium → limited pricing power`);
  }

  // Risk reasoning
  if (riskFactors.churnRisk > 50) {
    reasoning.push(`🔻 Elevated Churn Risk (${riskFactors.churnRisk}/100): Budget pressure (${riskFactors.budgetPressure}/100) and other factors → conservative increase recommended`);
  } else if (riskFactors.churnRisk < 30) {
    reasoning.push(`🔺 Low Churn Risk (${riskFactors.churnRisk}/100): Strong relationship (${riskFactors.relationshipStrength}/10) → confidence in increase`);
  }

  // Contract constraint reasoning
  if (finalIncrease >= contractCap * 0.9) {
    reasoning.push(`⚖️  Near Contract Cap: ${(finalIncrease * 100).toFixed(1)}% increase (cap: ${(contractCap * 100).toFixed(0)}%) → at maximum allowable`);
  } else {
    reasoning.push(`✅ Within Contract Cap: ${(finalIncrease * 100).toFixed(1)}% increase (cap: ${(contractCap * 100).toFixed(0)}%) → compliant`);
  }

  return reasoning;
}

/**
 * Generate alternative pricing scenarios
 */
function generateScenarios(inputs) {
  const {
    currentARR,
    recommendedIncrease,
    recommendedPrice,
    contractCap,
    riskFactors,
    valueLeverage,
    stickiness,
    marketPosition
  } = inputs;

  // Conservative scenario: 50% of recommended
  const conservativeIncrease = recommendedIncrease * 0.5;
  const conservativePrice = Math.round(currentARR * (1 + conservativeIncrease));

  // Aggressive scenario: 120% of recommended (capped at contract)
  const aggressiveIncrease = Math.min(recommendedIncrease * 1.2, contractCap);
  const aggressivePrice = Math.round(currentARR * (1 + aggressiveIncrease));

  return [
    {
      scenario: 'Conservative',
      targetPrice: conservativePrice,
      increaseAmount: conservativePrice - currentARR,
      increasePercent: conservativeIncrease * 100,
      probability: 95,
      pros: [
        'Very low churn risk',
        'Easy approval given minimal increase',
        'Builds goodwill for future pricing',
        'Leaves room for negotiation'
      ],
      cons: [
        `Leaves $${(recommendedPrice - conservativePrice).toLocaleString()} on table`,
        'Below market rate potential',
        'Doesn\'t fully reflect value delivered',
        'May set expectation for low increases'
      ]
    },
    {
      scenario: 'Recommended',
      targetPrice: recommendedPrice,
      increaseAmount: recommendedPrice - currentARR,
      increasePercent: recommendedIncrease * 100,
      probability: 85,
      pros: [
        `Reflects value delivered (${valueLeverage.index.toFixed(2)}x value/price)`,
        `Stickiness supports increase (${stickiness.score}/100)`,
        'Data-driven justification',
        'Balanced risk/reward approach'
      ],
      cons: [
        riskFactors.churnRisk > 40 ? `Moderate churn risk (${riskFactors.churnRisk}/100)` : 'Requires value conversation',
        riskFactors.budgetPressure > 50 ? 'Budget pressure may create resistance' : 'Some customer pushback expected',
        'Needs executive alignment'
      ]
    },
    {
      scenario: 'Aggressive',
      targetPrice: aggressivePrice,
      increaseAmount: aggressivePrice - currentARR,
      increasePercent: aggressiveIncrease * 100,
      probability: 65,
      pros: [
        'Maximizes NRR potential',
        valueLeverage.index > 1.5 ? 'Strong value justification exists' : 'Market rate aligned',
        stickiness.score > 80 ? 'High stickiness supports premium' : 'Captures full value potential'
      ],
      cons: [
        aggressiveIncrease >= contractCap ? 'Requires contract amendment' : 'Higher churn risk',
        'May trigger competitive evaluation',
        'Requires executive-level selling',
        'Could damage relationship if poorly positioned'
      ]
    }
  ];
}

/**
 * Helper: Calculate customer tenure in months
 */
function calculateTenureMonths(firstContractDate) {
  if (!firstContractDate) return 12;  // Default 1 year

  const now = new Date();
  const start = new Date(firstContractDate);
  const months = (now.getFullYear() - start.getFullYear()) * 12 +
                 (now.getMonth() - start.getMonth());

  return Math.max(1, months);
}

module.exports = {
  generatePricingRecommendation,
  calculateStickinessScore,
  calculateValueLeverage,
  analyzeMarketPosition,
  assessRiskFactors
};
