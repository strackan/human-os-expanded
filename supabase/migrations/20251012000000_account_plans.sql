-- ============================================================================
-- Account Plan & Workflow Automation Schema Migration
-- Created: 2025-10-12
-- Purpose: Add account_plan, risk_score, and opportunity_score to customers
--          to support intelligent workflow prioritization and assignment
-- ============================================================================

-- Add account_plan column to customers table
-- This determines which strategic workflows a customer receives
-- Values: 'invest' (high-touch), 'expand' (growth focus),
--         'manage' (standard), 'monitor' (low-touch)
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS account_plan TEXT
CHECK (account_plan IN ('invest', 'expand', 'manage', 'monitor'));

-- Add risk_score column to customers table
-- Range: 0-100, where higher score = higher risk
-- Used to trigger risk mitigation workflows
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS risk_score INTEGER
CHECK (risk_score >= 0 AND risk_score <= 100);

-- Add opportunity_score column to customers table
-- Range: 0-100, where higher score = higher upsell/expansion opportunity
-- Used to trigger opportunity workflows
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS opportunity_score INTEGER
CHECK (opportunity_score >= 0 AND opportunity_score <= 100);

-- Add comment to account_plan column for documentation
COMMENT ON COLUMN public.customers.account_plan IS
'Account engagement plan type: invest (high-touch strategic), expand (growth focus), manage (standard), monitor (low-touch). Determines workflow assignment eligibility.';

COMMENT ON COLUMN public.customers.risk_score IS
'Customer risk score (0-100). Scores >= 60 trigger risk mitigation workflows. Factors: health score, usage trends, support tickets, contract status.';

COMMENT ON COLUMN public.customers.opportunity_score IS
'Upsell/expansion opportunity score (0-100). Scores >= 70 trigger opportunity workflows. Factors: usage growth, feature adoption, engagement level.';

-- Create indexes for efficient workflow filtering and sorting
-- These support the workflow determination and prioritization queries

-- Index for filtering by account_plan (strategic workflow eligibility)
CREATE INDEX IF NOT EXISTS idx_customers_account_plan
ON public.customers(account_plan)
WHERE account_plan IS NOT NULL;

-- Index for filtering by risk_score (risk workflow eligibility)
CREATE INDEX IF NOT EXISTS idx_customers_risk_score
ON public.customers(risk_score DESC)
WHERE risk_score IS NOT NULL;

-- Index for filtering by opportunity_score (opportunity workflow eligibility)
CREATE INDEX IF NOT EXISTS idx_customers_opportunity_score
ON public.customers(opportunity_score DESC)
WHERE opportunity_score IS NOT NULL;

-- Composite index for workflow queue queries (common access pattern)
-- Supports queries that filter by owner and sort by multiple criteria
CREATE INDEX IF NOT EXISTS idx_customers_workflow_queue
ON public.customers(assigned_to, account_plan, renewal_date)
WHERE assigned_to IS NOT NULL;

-- ============================================================================
-- Migration Notes:
--
-- 1. All columns are nullable to support gradual data population
-- 2. Existing customers will have NULL values until account plans are assigned
-- 3. Risk/opportunity scores can be calculated and populated via batch update
-- 4. Indexes use partial WHERE clauses to only index non-NULL values
-- 5. account_plan enum constraint matches automation backup system
-- ============================================================================
