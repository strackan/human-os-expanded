/**
 * BLUESOFT SHOWCASE DEMO - Database Schema
 *
 * Creates tables for real intelligence, financials, usage, and engagement data
 * Replaces mocked data in Context API with actual database retrieval
 *
 * Run this AFTER RUN_THIS_MIGRATION.sql
 *
 * Date: October 9, 2025
 */

-- =====================================================
-- CUSTOMER INTELLIGENCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  -- Core intelligence scores
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  opportunity_score INTEGER NOT NULL CHECK (opportunity_score BETWEEN 0 AND 100),
  health_score INTEGER NOT NULL CHECK (health_score BETWEEN 0 AND 100),

  -- Trend indicators
  health_trend VARCHAR(20) CHECK (health_trend IN ('improving', 'stable', 'declining')),
  usage_trend VARCHAR(20) CHECK (usage_trend IN ('increasing', 'stable', 'decreasing')),
  engagement_trend VARCHAR(20) CHECK (engagement_trend IN ('high', 'moderate', 'low')),

  -- Calculated fields
  churn_probability NUMERIC(5,2), -- 0.00 to 100.00
  expansion_probability NUMERIC(5,2),

  -- Metadata
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_customer ON customer_intelligence(customer_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_risk ON customer_intelligence(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_opportunity ON customer_intelligence(opportunity_score DESC);

-- =====================================================
-- CUSTOMER FINANCIALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  -- ARR data
  current_arr NUMERIC(12,2) NOT NULL,
  previous_arr NUMERIC(12,2),
  projected_arr NUMERIC(12,2),

  -- Trends
  arr_trend VARCHAR(20) CHECK (arr_trend IN ('growing', 'stable', 'declining')),
  growth_rate NUMERIC(5,2), -- Percentage

  -- Historical data
  arr_12_months_ago NUMERIC(12,2),
  arr_6_months_ago NUMERIC(12,2),

  -- Payment info
  payment_status VARCHAR(20) DEFAULT 'current',
  days_past_due INTEGER DEFAULT 0,

  -- Validity period
  valid_from DATE NOT NULL,
  valid_to DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financials_customer ON customer_financials(customer_id);
CREATE INDEX IF NOT EXISTS idx_financials_valid ON customer_financials(valid_from DESC, valid_to DESC);

-- =====================================================
-- CUSTOMER USAGE METRICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  -- Usage stats
  active_users INTEGER NOT NULL DEFAULT 0,
  total_licensed_users INTEGER,
  utilization_rate NUMERIC(5,2), -- Percentage

  -- Activity
  last_activity_date TIMESTAMP,
  last_login_date TIMESTAMP,
  weekly_active_users INTEGER,
  monthly_active_users INTEGER,

  -- Feature adoption
  features_adopted INTEGER DEFAULT 0,
  total_features INTEGER,
  adoption_rate NUMERIC(5,2),

  -- Trend
  usage_trend VARCHAR(20) CHECK (usage_trend IN ('increasing', 'stable', 'decreasing')),

  -- Time period
  metric_date DATE NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_customer ON customer_usage_metrics(customer_id);
CREATE INDEX IF NOT EXISTS idx_usage_date ON customer_usage_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_usage_customer_date ON customer_usage_metrics(customer_id, metric_date DESC);

-- =====================================================
-- CUSTOMER ENGAGEMENT TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  -- Contact tracking
  last_contact_date TIMESTAMP,
  last_contact_type VARCHAR(50), -- email, call, meeting, etc.
  contact_frequency VARCHAR(20), -- daily, weekly, monthly, etc.

  -- Meeting history
  last_qbr_date DATE,
  next_qbr_date DATE,
  meetings_this_quarter INTEGER DEFAULT 0,

  -- Satisfaction
  nps_score INTEGER CHECK (nps_score BETWEEN 0 AND 10),
  csat_score NUMERIC(3,1) CHECK (csat_score BETWEEN 0 AND 5),
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),

  -- Support
  open_support_tickets INTEGER DEFAULT 0,
  closed_tickets_30d INTEGER DEFAULT 0,
  avg_resolution_time_hours NUMERIC(6,1),

  -- Engagement level
  engagement_score INTEGER CHECK (engagement_score BETWEEN 0 AND 100),
  engagement_trend VARCHAR(20) CHECK (engagement_trend IN ('high', 'moderate', 'low')),

  -- Time period
  recorded_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engagement_customer ON customer_engagement(customer_id);
CREATE INDEX IF NOT EXISTS idx_engagement_recorded ON customer_engagement(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_customer_recorded ON customer_engagement(customer_id, recorded_at DESC);

-- =====================================================
-- STAKEHOLDER TRACKING TABLE (for demos)
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  -- Stakeholder info
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  role VARCHAR(100), -- decision_maker, influencer, champion, user, etc.
  department VARCHAR(100),

  -- Contact info
  email VARCHAR(255),
  phone VARCHAR(50),

  -- Influence
  influence_level VARCHAR(20) CHECK (influence_level IN ('high', 'medium', 'low')),
  decision_authority BOOLEAN DEFAULT FALSE,
  is_champion BOOLEAN DEFAULT FALSE,

  -- Sentiment
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  last_interaction_date DATE,

  -- Metadata
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stakeholders_customer ON customer_stakeholders(customer_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_role ON customer_stakeholders(role);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update intelligence timestamp
CREATE OR REPLACE FUNCTION update_intelligence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS intelligence_updated ON customer_intelligence;
CREATE TRIGGER intelligence_updated
  BEFORE UPDATE ON customer_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION update_intelligence_timestamp();

-- Update financials timestamp
CREATE OR REPLACE FUNCTION update_financials_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS financials_updated ON customer_financials;
CREATE TRIGGER financials_updated
  BEFORE UPDATE ON customer_financials
  FOR EACH ROW
  EXECUTE FUNCTION update_financials_timestamp();

-- Update stakeholders timestamp
CREATE OR REPLACE FUNCTION update_stakeholders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stakeholders_updated ON customer_stakeholders;
CREATE TRIGGER stakeholders_updated
  BEFORE UPDATE ON customer_stakeholders
  FOR EACH ROW
  EXECUTE FUNCTION update_stakeholders_timestamp();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get latest intelligence for customer
CREATE OR REPLACE FUNCTION get_latest_intelligence(p_customer_id UUID)
RETURNS TABLE (
  risk_score INTEGER,
  opportunity_score INTEGER,
  health_score INTEGER,
  health_trend VARCHAR,
  usage_trend VARCHAR,
  engagement_trend VARCHAR,
  churn_probability NUMERIC,
  expansion_probability NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.risk_score,
    ci.opportunity_score,
    ci.health_score,
    ci.health_trend,
    ci.usage_trend,
    ci.engagement_trend,
    ci.churn_probability,
    ci.expansion_probability
  FROM customer_intelligence ci
  WHERE ci.customer_id = p_customer_id
  ORDER BY ci.calculated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Get latest financials for customer
CREATE OR REPLACE FUNCTION get_latest_financials(p_customer_id UUID)
RETURNS TABLE (
  current_arr NUMERIC,
  previous_arr NUMERIC,
  projected_arr NUMERIC,
  arr_trend VARCHAR,
  growth_rate NUMERIC,
  payment_status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cf.current_arr,
    cf.previous_arr,
    cf.projected_arr,
    cf.arr_trend,
    cf.growth_rate,
    cf.payment_status
  FROM customer_financials cf
  WHERE cf.customer_id = p_customer_id
    AND (cf.valid_to IS NULL OR cf.valid_to >= CURRENT_DATE)
  ORDER BY cf.valid_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Get latest usage metrics for customer
CREATE OR REPLACE FUNCTION get_latest_usage(p_customer_id UUID)
RETURNS TABLE (
  active_users INTEGER,
  utilization_rate NUMERIC,
  last_activity_date TIMESTAMP,
  usage_trend VARCHAR,
  adoption_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cum.active_users,
    cum.utilization_rate,
    cum.last_activity_date,
    cum.usage_trend,
    cum.adoption_rate
  FROM customer_usage_metrics cum
  WHERE cum.customer_id = p_customer_id
  ORDER BY cum.metric_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Get latest engagement data for customer
CREATE OR REPLACE FUNCTION get_latest_engagement(p_customer_id UUID)
RETURNS TABLE (
  last_contact_date TIMESTAMP,
  last_qbr_date DATE,
  nps_score INTEGER,
  engagement_score INTEGER,
  open_support_tickets INTEGER,
  sentiment VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.last_contact_date,
    ce.last_qbr_date,
    ce.nps_score,
    ce.engagement_score,
    ce.open_support_tickets,
    ce.sentiment
  FROM customer_engagement ce
  WHERE ce.customer_id = p_customer_id
  ORDER BY ce.recorded_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BLUESOFT DEMO SCHEMA MIGRATION COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - customer_intelligence';
  RAISE NOTICE '  - customer_financials';
  RAISE NOTICE '  - customer_usage_metrics';
  RAISE NOTICE '  - customer_engagement';
  RAISE NOTICE '  - customer_stakeholders';
  RAISE NOTICE '';
  RAISE NOTICE 'Created helper functions:';
  RAISE NOTICE '  - get_latest_intelligence()';
  RAISE NOTICE '  - get_latest_financials()';
  RAISE NOTICE '  - get_latest_usage()';
  RAISE NOTICE '  - get_latest_engagement()';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run BLUESOFT_DEMO_SEED.sql';
  RAISE NOTICE '========================================';
END $$;
