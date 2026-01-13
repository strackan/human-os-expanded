-- =========================================================================
-- PRICING OPTIMIZATION ENGINE - DATABASE FUNCTIONS
-- =========================================================================
--
-- This migration implements the core pricing optimization algorithm as
-- PostgreSQL functions. The algorithm analyzes customer data across 5 key
-- factors to recommend optimal renewal pricing that maximizes NRR while
-- minimizing churn risk.
--
-- Target: >70% pricing recommendation acceptance rate
--
-- =========================================================================

-- -------------------------------------------------------------------------
-- FACTOR 1: Calculate Stickiness Score (0-100)
-- -------------------------------------------------------------------------
-- Measures how difficult/costly it would be for customer to switch.
-- Higher stickiness = more pricing power.
--
-- Inputs:
-- - Feature adoption (%)
-- - Integration count
-- - Data volume (TB)
-- - User adoption rate
-- - Customizations
-- - Tenure (months)
--
-- Output: Score 0-100 (higher = stickier)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_stickiness_score(p_customer_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_score INTEGER := 0;
  v_customer RECORD;
BEGIN
  SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found: %', p_customer_id;
  END IF;

  -- Feature adoption (0-25 points)
  -- Default to 50% if null (average adoption)
  v_score := v_score + (COALESCE(v_customer.feature_adoption, 50) / 100.0 * 25)::INTEGER;

  -- Integrations (0-20 points, max 4 integrations = full 20 points)
  v_score := v_score + LEAST(COALESCE(v_customer.integration_count, 0) * 5, 20);

  -- Data volume (0-20 points, max 10 TB = full 20 points)
  v_score := v_score + LEAST(COALESCE(v_customer.data_volume_tb, 0) * 2, 20)::INTEGER;

  -- User adoption (0-15 points)
  IF COALESCE(v_customer.seat_count, 0) > 0 THEN
    v_score := v_score + ((COALESCE(v_customer.active_users, 0)::FLOAT / v_customer.seat_count) * 15)::INTEGER;
  END IF;

  -- Customizations (0-15 points, max 5 customizations = full 15 points)
  v_score := v_score + LEAST(COALESCE(v_customer.customization_count, 0) * 3, 15);

  -- Tenure (0-5 points, max 5 years = full 5 points)
  IF v_customer.created_at IS NOT NULL THEN
    v_score := v_score + LEAST(
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_customer.created_at))::INTEGER,
      5
    );
  END IF;

  RETURN LEAST(v_score, 100);
END;
$$;

COMMENT ON FUNCTION calculate_stickiness_score IS
'Calculates customer stickiness score (0-100) based on switching costs. Higher score = more pricing power.';

-- -------------------------------------------------------------------------
-- FACTOR 2: Calculate Value Leverage Index (0.95 - 1.05)
-- -------------------------------------------------------------------------
-- Ratio of value delivered to price paid. Higher value = more pricing power.
--
-- Inputs:
-- - Quantified value ($) - ROI calculated from customer data (optional)
-- - Usage growth (%) - 30-day usage trend
-- - Value perception - Customer perception of value
--
-- Output: Multiplier 0.95-1.05
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_value_leverage_index(p_customer_id UUID)
RETURNS DECIMAL(4,2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer RECORD;
  v_index DECIMAL(4,2) := 1.00;
BEGIN
  SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found: %', p_customer_id;
  END IF;

  -- If quantified value available, use ratio
  IF v_customer.quantified_value IS NOT NULL AND v_customer.quantified_value > 0 AND v_customer.current_arr > 0 THEN
    -- Value:Price ratios:
    -- 5:1 or higher = 1.05 multiplier (+5% influence)
    -- 3:1 = 1.03 multiplier (+3%)
    -- 2:1 = 1.02 multiplier (+2%)
    -- 1:1 or lower = 1.00 (no influence)
    v_index := 1 + (v_customer.quantified_value / v_customer.current_arr - 1) * 0.01;
    RETURN LEAST(v_index, 1.05);
  END IF;

  -- Otherwise, infer from usage growth
  IF COALESCE(v_customer.usage_growth, 0) > 20 THEN
    v_index := v_index + 0.03; -- Strong growth = +3%
  ELSIF COALESCE(v_customer.usage_growth, 0) > 10 THEN
    v_index := v_index + 0.02; -- Moderate growth = +2%
  ELSIF COALESCE(v_customer.usage_growth, 0) > 0 THEN
    v_index := v_index + 0.01; -- Positive growth = +1%
  END IF;

  -- Value perception adjustment
  IF v_customer.value_perception = 'increasing' THEN
    v_index := v_index + 0.02;
  ELSIF v_customer.value_perception = 'decreasing' THEN
    v_index := v_index - 0.02;
  END IF;

  RETURN GREATEST(0.95, LEAST(v_index, 1.05));
END;
$$;

COMMENT ON FUNCTION calculate_value_leverage_index IS
'Calculates value leverage multiplier (0.95-1.05) based on value delivered vs. price paid.';

-- -------------------------------------------------------------------------
-- FACTOR 3: Get Market Position Adjustment (-2% to +3%)
-- -------------------------------------------------------------------------
-- Compares customer's current price to market benchmark.
--
-- Inputs:
-- - Current price per seat
-- - Peer benchmark price per seat
--
-- Output: Adjustment -2 to +3 percentage points
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_market_position_adjustment(p_customer_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer RECORD;
  v_current_per_seat DECIMAL;
  v_benchmark_per_seat DECIMAL;
  v_ratio DECIMAL;
BEGIN
  SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found: %', p_customer_id;
  END IF;

  -- If no benchmark data, return 0
  IF v_customer.peer_benchmark IS NULL OR v_customer.peer_benchmark = 0 THEN
    RETURN 0;
  END IF;

  -- Calculate price per seat
  IF COALESCE(v_customer.seat_count, 0) = 0 THEN
    RETURN 0; -- Can't calculate without seat count
  END IF;

  v_current_per_seat := v_customer.current_arr / v_customer.seat_count;
  v_benchmark_per_seat := v_customer.peer_benchmark;
  v_ratio := v_current_per_seat / v_benchmark_per_seat;

  -- Compare to benchmark
  IF v_ratio < 0.80 THEN
    RETURN 3; -- Significantly underpriced (+3%)
  ELSIF v_ratio < 0.90 THEN
    RETURN 2; -- Moderately underpriced (+2%)
  ELSIF v_ratio < 1.00 THEN
    RETURN 1; -- Slightly underpriced (+1%)
  ELSIF v_ratio > 1.20 THEN
    RETURN -2; -- Premium priced, be cautious (-2%)
  ELSE
    RETURN 0; -- At market rate (0%)
  END IF;
END;
$$;

COMMENT ON FUNCTION get_market_position_adjustment IS
'Returns market position adjustment (-2 to +3) based on comparison to peer benchmark.';

-- -------------------------------------------------------------------------
-- FACTOR 4: Calculate Risk Multiplier (0.5 - 1.1)
-- -------------------------------------------------------------------------
-- Churn risk reduces pricing aggressiveness.
--
-- Inputs:
-- - Churn risk score (0-100)
-- - Budget pressure (high/medium/low/none)
-- - Competitive threat (active_evaluation/shopping/loyal)
-- - Relationship strength (1-10)
--
-- Output: Multiplier 0.5-1.1
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_risk_multiplier(p_customer_id UUID)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer RECORD;
  v_multiplier DECIMAL(3,2) := 1.00;
BEGIN
  SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found: %', p_customer_id;
  END IF;

  -- Churn risk influence (strongest factor)
  IF COALESCE(v_customer.churn_risk_score, 0) > 70 THEN
    v_multiplier := 0.50; -- High risk: be very conservative
  ELSIF COALESCE(v_customer.churn_risk_score, 0) > 50 THEN
    v_multiplier := 0.75; -- Medium risk: somewhat conservative
  ELSIF COALESCE(v_customer.churn_risk_score, 0) < 30 THEN
    v_multiplier := 1.10; -- Low risk: can be aggressive
  END IF;

  -- Budget pressure adjustment
  IF v_customer.budget_pressure = 'high' THEN
    v_multiplier := v_multiplier * 0.90; -- Reduce by 10%
  END IF;

  -- Competitive threat adjustment
  IF v_customer.competitive_threat = 'active_evaluation' THEN
    v_multiplier := v_multiplier * 0.85; -- Reduce by 15%
  ELSIF v_customer.competitive_threat = 'shopping' THEN
    v_multiplier := v_multiplier * 0.95; -- Reduce by 5%
  END IF;

  -- Relationship strength boost
  IF COALESCE(v_customer.relationship_strength, 0) >= 8 THEN
    v_multiplier := v_multiplier * 1.05; -- Strong relationship = +5% confidence
  END IF;

  RETURN GREATEST(0.50, LEAST(v_multiplier, 1.10));
END;
$$;

COMMENT ON FUNCTION calculate_risk_multiplier IS
'Calculates risk multiplier (0.5-1.1) based on churn risk and competitive threats. Lower multiplier = more conservative.';

-- -------------------------------------------------------------------------
-- FACTOR 5: Calculate Trend Adjustment (-2% to +2%)
-- -------------------------------------------------------------------------
-- Recent trends indicate momentum direction.
--
-- Inputs:
-- - Usage trend (%) - 30-day change
-- - Support trend (increasing/stable/decreasing)
-- - Sentiment trend (improving/stable/declining)
--
-- Output: Adjustment -2 to +2 percentage points
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_trend_adjustment(p_customer_id UUID)
RETURNS DECIMAL(3,1)
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer RECORD;
  v_adjustment DECIMAL(3,1) := 0.0;
BEGIN
  SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found: %', p_customer_id;
  END IF;

  -- Usage trend
  IF COALESCE(v_customer.usage_trend, 0) > 15 THEN
    v_adjustment := v_adjustment + 1.0; -- Strong growth = +1%
  ELSIF COALESCE(v_customer.usage_trend, 0) < -10 THEN
    v_adjustment := v_adjustment - 1.0; -- Decline = -1%
  END IF;

  -- Support trend (inverse - fewer tickets is good)
  IF v_customer.support_trend = 'decreasing' THEN
    v_adjustment := v_adjustment + 0.5; -- Fewer issues = +0.5%
  ELSIF v_customer.support_trend = 'increasing' THEN
    v_adjustment := v_adjustment - 0.5; -- More issues = -0.5%
  END IF;

  -- Sentiment trend
  IF v_customer.sentiment_trend = 'improving' THEN
    v_adjustment := v_adjustment + 0.5;
  ELSIF v_customer.sentiment_trend = 'declining' THEN
    v_adjustment := v_adjustment - 1.0; -- Declining sentiment is serious
  END IF;

  RETURN GREATEST(-2.0, LEAST(v_adjustment, 2.0));
END;
$$;

COMMENT ON FUNCTION calculate_trend_adjustment IS
'Calculates trend adjustment (-2 to +2) based on usage, support, and sentiment trends.';

-- -------------------------------------------------------------------------
-- MASTER FUNCTION: Calculate Complete Pricing Recommendation
-- -------------------------------------------------------------------------
-- Orchestrates all 5 factors to generate complete pricing recommendation
-- with 3 scenarios (conservative, recommended, aggressive).
--
-- Inputs:
-- - p_customer_id: Customer UUID
-- - p_csm_inputs: Optional JSONB with CSM preferences
--   {
--     "price_increase_cap": <decimal>,
--     "risk_tolerance": "conservative" | "moderate" | "aggressive"
--   }
--
-- Output: JSONB with recommendation, scenarios, factors, confidence
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_pricing_recommendation(
  p_customer_id UUID,
  p_csm_inputs JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer RECORD;
  v_stickiness INTEGER;
  v_value_index DECIMAL(4,2);
  v_market_adj INTEGER;
  v_risk_mult DECIMAL(3,2);
  v_trend_adj DECIMAL(3,1);
  v_base_increase DECIMAL(5,2);
  v_recommended_increase DECIMAL(5,2);
  v_target_price DECIMAL(12,2);
  v_confidence INTEGER;
  v_risk_tolerance TEXT;
  v_result JSONB;
BEGIN
  -- Get customer data
  SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found: %', p_customer_id;
  END IF;

  -- Calculate all factors
  v_stickiness := calculate_stickiness_score(p_customer_id);
  v_value_index := calculate_value_leverage_index(p_customer_id);
  v_market_adj := get_market_position_adjustment(p_customer_id);
  v_risk_mult := calculate_risk_multiplier(p_customer_id);
  v_trend_adj := calculate_trend_adjustment(p_customer_id);

  -- STEP 1: Calculate base increase
  -- Stickiness influence: 0-8% (stickiness score / 100 * 8)
  -- Value leverage influence: -5% to +5% ((index - 1) * 100)
  -- Market adjustment: -2% to +3%
  -- Trend adjustment: -2% to +2%
  v_base_increase :=
    (v_stickiness / 100.0 * 8) +           -- 0-8%
    ((v_value_index - 1) * 100) +          -- -5% to +5%
    v_market_adj +                          -- -2 to +3
    v_trend_adj;                            -- -2 to +2

  -- STEP 2: Apply risk multiplier
  v_recommended_increase := v_base_increase * v_risk_mult;

  -- STEP 3: Apply CSM constraints
  -- Price increase cap from discovery/contract
  IF (p_csm_inputs->>'price_increase_cap') IS NOT NULL THEN
    v_recommended_increase := LEAST(
      v_recommended_increase,
      (p_csm_inputs->>'price_increase_cap')::DECIMAL
    );
  END IF;

  -- Risk tolerance from CSM preference
  v_risk_tolerance := COALESCE(p_csm_inputs->>'risk_tolerance', 'moderate');

  IF v_risk_tolerance = 'conservative' AND v_recommended_increase > 5 THEN
    v_recommended_increase := 5; -- Cap at 5% for conservative CSMs
  ELSIF v_risk_tolerance = 'aggressive' THEN
    v_recommended_increase := v_recommended_increase * 1.1; -- 10% more aggressive
  END IF;

  -- Ensure reasonable bounds (0-15%)
  v_recommended_increase := GREATEST(0, LEAST(v_recommended_increase, 15));

  -- Calculate target price
  v_target_price := v_customer.current_arr * (1 + v_recommended_increase / 100);

  -- STEP 4: Calculate confidence score (simplified for MVP)
  -- TODO: Enhance with data quality checks from workflow_executions
  v_confidence := 70; -- Base confidence

  -- Boost confidence if we have good data
  IF v_customer.feature_adoption IS NOT NULL THEN v_confidence := v_confidence + 5; END IF;
  IF v_customer.integration_count IS NOT NULL THEN v_confidence := v_confidence + 5; END IF;
  IF v_customer.churn_risk_score IS NOT NULL THEN v_confidence := v_confidence + 5; END IF;
  IF v_customer.peer_benchmark IS NOT NULL THEN v_confidence := v_confidence + 5; END IF;
  IF v_customer.usage_growth IS NOT NULL THEN v_confidence := v_confidence + 5; END IF;
  IF v_customer.relationship_strength IS NOT NULL THEN v_confidence := v_confidence + 5; END IF;

  v_confidence := LEAST(v_confidence, 100);

  -- STEP 5: Generate 3 scenarios
  v_result := jsonb_build_object(
    'targetPrice', v_target_price,
    'increasePercent', v_recommended_increase,
    'increaseAmount', v_target_price - v_customer.current_arr,
    'confidence', v_confidence,
    'factors', jsonb_build_object(
      'stickinessScore', v_stickiness,
      'valueIndex', v_value_index,
      'marketAdjustment', v_market_adj,
      'riskMultiplier', v_risk_mult,
      'trendAdjustment', v_trend_adj,
      'baseIncrease', v_base_increase
    ),
    'scenarios', jsonb_build_array(
      -- Conservative Scenario
      jsonb_build_object(
        'scenario', 'Conservative',
        'targetPrice', v_customer.current_arr * (1 + GREATEST(v_recommended_increase - 2, 3) / 100),
        'increasePercent', GREATEST(v_recommended_increase - 2, 3),
        'increaseAmount', v_customer.current_arr * GREATEST(v_recommended_increase - 2, 3) / 100,
        'probability', LEAST(v_confidence + 10, 95),
        'pros', ARRAY[
          'Very low churn risk',
          'High probability of acceptance',
          'Minimal negotiation expected',
          'Sets positive tone for relationship'
        ],
        'cons', ARRAY[
          'Leaves potential revenue on table',
          'May undervalue product',
          'Lower NRR contribution',
          'Could set precedent for future renewals'
        ]
      ),
      -- Recommended Scenario (PRIMARY)
      jsonb_build_object(
        'scenario', 'Recommended',
        'targetPrice', v_target_price,
        'increasePercent', v_recommended_increase,
        'increaseAmount', v_target_price - v_customer.current_arr,
        'probability', v_confidence,
        'pros', ARRAY[
          'Optimal balance of revenue and risk',
          'Data-driven and defensible',
          'Aligns with customer value delivered',
          'Strong likelihood of acceptance'
        ],
        'cons', ARRAY[
          'May require justification/negotiation',
          'Some pushback possible',
          'Depends on data quality'
        ]
      ),
      -- Aggressive Scenario
      jsonb_build_object(
        'scenario', 'Aggressive',
        'targetPrice', v_customer.current_arr * (1 + LEAST(v_recommended_increase + 3, 12) / 100),
        'increasePercent', LEAST(v_recommended_increase + 3, 12),
        'increaseAmount', v_customer.current_arr * LEAST(v_recommended_increase + 3, 12) / 100,
        'probability', GREATEST(v_confidence - 15, 60),
        'pros', ARRAY[
          'Maximizes revenue opportunity',
          'Tests pricing ceiling',
          'Can negotiate down if needed',
          'Strong NRR contribution'
        ],
        'cons', ARRAY[
          'Higher risk of pushback',
          'May trigger negotiation',
          'Could strain relationship if misread',
          'Requires strong value justification'
        ]
      )
    ),
    'dataQuality', jsonb_build_object(
      'usage', CASE
        WHEN v_customer.feature_adoption IS NOT NULL AND v_customer.usage_growth IS NOT NULL
        THEN 'complete'
        WHEN v_customer.feature_adoption IS NOT NULL OR v_customer.usage_growth IS NOT NULL
        THEN 'partial'
        ELSE 'placeholder'
      END,
      'financial', CASE
        WHEN v_customer.current_arr > 0 AND v_customer.seat_count > 0
        THEN 'complete'
        ELSE 'partial'
      END,
      'risk', CASE
        WHEN v_customer.churn_risk_score IS NOT NULL
        THEN 'complete'
        ELSE 'placeholder'
      END,
      'competitive', CASE
        WHEN v_customer.peer_benchmark IS NOT NULL
        THEN 'complete'
        ELSE 'placeholder'
      END
    )
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION calculate_pricing_recommendation IS
'Master pricing optimization function. Analyzes 5 factors to generate pricing recommendation with 3 scenarios.';

-- -------------------------------------------------------------------------
-- TRACKING TABLE: Pricing Recommendations
-- -------------------------------------------------------------------------
-- Tracks pricing recommendations and outcomes for acceptance rate analysis
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,

  -- Recommendation data (snapshot at time of recommendation)
  recommended_price DECIMAL(12,2) NOT NULL,
  recommended_increase_percent DECIMAL(5,2) NOT NULL,
  recommended_increase_amount DECIMAL(12,2) NOT NULL,
  scenarios JSONB NOT NULL,
  factors JSONB NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  data_quality JSONB,

  -- Outcome tracking (filled in after renewal closes)
  accepted BOOLEAN,
  final_price DECIMAL(12,2),
  final_increase_percent DECIMAL(5,2),
  final_increase_amount DECIMAL(12,2),
  selected_scenario TEXT CHECK (selected_scenario IN ('Conservative', 'Recommended', 'Aggressive', 'Custom')),
  acceptance_date TIMESTAMP,
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pricing_recommendations_customer ON pricing_recommendations(customer_id);
CREATE INDEX idx_pricing_recommendations_execution ON pricing_recommendations(execution_id);
CREATE INDEX idx_pricing_recommendations_accepted ON pricing_recommendations(accepted) WHERE accepted IS NOT NULL;
CREATE INDEX idx_pricing_recommendations_created ON pricing_recommendations(created_at DESC);

COMMENT ON TABLE pricing_recommendations IS
'Tracks pricing recommendations and outcomes for measuring acceptance rate and model accuracy.';

-- -------------------------------------------------------------------------
-- VIEW: Pricing Acceptance Rate Analytics
-- -------------------------------------------------------------------------
CREATE OR REPLACE VIEW pricing_acceptance_rate AS
SELECT
  -- Acceptance metrics
  COUNT(*) FILTER (WHERE accepted = true) AS accepted_count,
  COUNT(*) FILTER (WHERE accepted = false) AS rejected_count,
  COUNT(*) AS total_recommendations,
  (COUNT(*) FILTER (WHERE accepted = true)::FLOAT / NULLIF(COUNT(*), 0)) * 100 AS acceptance_rate,

  -- Price deviation metrics
  AVG(recommended_increase_percent) FILTER (WHERE accepted = true) AS avg_accepted_increase,
  AVG(final_increase_percent) FILTER (WHERE accepted = true) AS avg_final_increase,
  AVG(ABS(final_price - recommended_price)) FILTER (WHERE accepted = true) AS avg_price_deviation,
  AVG(ABS(final_increase_percent - recommended_increase_percent)) FILTER (WHERE accepted = true) AS avg_percent_deviation,

  -- Confidence correlation
  AVG(confidence) FILTER (WHERE accepted = true) AS avg_confidence_accepted,
  AVG(confidence) FILTER (WHERE accepted = false) AS avg_confidence_rejected,

  -- Scenario analysis
  COUNT(*) FILTER (WHERE selected_scenario = 'Conservative') AS conservative_count,
  COUNT(*) FILTER (WHERE selected_scenario = 'Recommended') AS recommended_count,
  COUNT(*) FILTER (WHERE selected_scenario = 'Aggressive') AS aggressive_count,
  COUNT(*) FILTER (WHERE selected_scenario = 'Custom') AS custom_count,

  -- Time period
  MIN(acceptance_date) AS first_renewal,
  MAX(acceptance_date) AS last_renewal,
  COUNT(DISTINCT customer_id) AS unique_customers

FROM pricing_recommendations
WHERE acceptance_date >= NOW() - INTERVAL '90 days' -- Last 90 days
  AND accepted IS NOT NULL; -- Only include renewals with outcomes

COMMENT ON VIEW pricing_acceptance_rate IS
'Analytics view for pricing recommendation acceptance rate and accuracy metrics. Target: >70% acceptance rate.';

-- -------------------------------------------------------------------------
-- FUNCTION: Store Pricing Recommendation
-- -------------------------------------------------------------------------
-- Helper function to store pricing recommendation from workflow execution
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION store_pricing_recommendation(
  p_customer_id UUID,
  p_execution_id UUID,
  p_recommendation JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_recommendation_id UUID;
BEGIN
  INSERT INTO pricing_recommendations (
    customer_id,
    execution_id,
    recommended_price,
    recommended_increase_percent,
    recommended_increase_amount,
    scenarios,
    factors,
    confidence,
    data_quality
  )
  VALUES (
    p_customer_id,
    p_execution_id,
    (p_recommendation->>'targetPrice')::DECIMAL,
    (p_recommendation->>'increasePercent')::DECIMAL,
    (p_recommendation->>'increaseAmount')::DECIMAL,
    p_recommendation->'scenarios',
    p_recommendation->'factors',
    (p_recommendation->>'confidence')::INTEGER,
    p_recommendation->'dataQuality'
  )
  RETURNING id INTO v_recommendation_id;

  RETURN v_recommendation_id;
END;
$$;

COMMENT ON FUNCTION store_pricing_recommendation IS
'Stores pricing recommendation from workflow execution. Returns recommendation ID.';

-- -------------------------------------------------------------------------
-- FUNCTION: Update Pricing Outcome
-- -------------------------------------------------------------------------
-- Updates pricing recommendation with actual renewal outcome
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_pricing_outcome(
  p_recommendation_id UUID,
  p_accepted BOOLEAN,
  p_final_price DECIMAL,
  p_selected_scenario TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer RECORD;
BEGIN
  -- Get customer's current ARR to calculate final increase
  SELECT c.current_arr
  INTO v_customer
  FROM pricing_recommendations pr
  JOIN customers c ON c.id = pr.customer_id
  WHERE pr.id = p_recommendation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pricing recommendation not found: %', p_recommendation_id;
  END IF;

  UPDATE pricing_recommendations
  SET
    accepted = p_accepted,
    final_price = p_final_price,
    final_increase_amount = p_final_price - v_customer.current_arr,
    final_increase_percent = ((p_final_price - v_customer.current_arr) / v_customer.current_arr) * 100,
    selected_scenario = p_selected_scenario,
    acceptance_date = NOW(),
    notes = p_notes,
    updated_at = NOW()
  WHERE id = p_recommendation_id;
END;
$$;

COMMENT ON FUNCTION update_pricing_outcome IS
'Updates pricing recommendation with actual renewal outcome for tracking acceptance rate.';
