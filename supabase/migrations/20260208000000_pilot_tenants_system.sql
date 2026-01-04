-- ============================================================================
-- Pilot Tenants System Migration
-- Created: 2025-12-21
-- Purpose: Multi-environment infrastructure for test drives and pilots
-- ============================================================================
-- Changes:
--   1. Extend companies table with tenant_type and is_demo_tenant
--   2. Create pilot_tenants table for lifecycle management
--   3. Create demo_templates table for industry scenario templates
--   4. Add helper functions for pilot tenant management
--   5. Add cleanup function for expired tenants
-- ============================================================================

-- ============================================================================
-- EXTEND COMPANIES TABLE
-- ============================================================================

-- Add tenant_type to classify companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS tenant_type TEXT DEFAULT 'customer'
    CHECK (tenant_type IN ('customer', 'internal', 'test_drive', 'pilot'));

-- Add is_demo_tenant flag for easy filtering
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS is_demo_tenant BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_companies_tenant_type
  ON public.companies(tenant_type);

CREATE INDEX IF NOT EXISTS idx_companies_is_demo_tenant
  ON public.companies(is_demo_tenant) WHERE is_demo_tenant = true;

COMMENT ON COLUMN public.companies.tenant_type IS 'Type of tenant: customer (real), internal (renubu), test_drive (short eval), pilot (longer eval)';
COMMENT ON COLUMN public.companies.is_demo_tenant IS 'True for test_drive and pilot tenants - enables easy cleanup';

-- ============================================================================
-- PILOT TENANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pilot_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core Identity
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tenant_type TEXT NOT NULL CHECK (tenant_type IN ('test_drive', 'pilot')),

  -- Lifecycle Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('provisioning', 'active', 'expired', 'archived')),

  -- Template Configuration
  template_id TEXT NOT NULL,  -- 'healthcare', 'fintech', 'saas', 'obsidian_black'
  environment TEXT NOT NULL CHECK (environment IN ('demo', 'staging')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  expired_at TIMESTAMPTZ,

  -- Ownership
  provisioned_by UUID REFERENCES public.profiles(id),
  se_email TEXT NOT NULL,
  prospect_company TEXT,
  prospect_email TEXT,

  -- Cleanup Tracking
  cleanup_scheduled_at TIMESTAMPTZ,
  cleanup_completed_at TIMESTAMPTZ,

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_pilot_tenants_company_id
  ON public.pilot_tenants(company_id);

CREATE INDEX IF NOT EXISTS idx_pilot_tenants_status
  ON public.pilot_tenants(status);

CREATE INDEX IF NOT EXISTS idx_pilot_tenants_expires_at
  ON public.pilot_tenants(expires_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_pilot_tenants_template
  ON public.pilot_tenants(template_id);

CREATE INDEX IF NOT EXISTS idx_pilot_tenants_se_email
  ON public.pilot_tenants(se_email);

COMMENT ON TABLE public.pilot_tenants IS 'Manages test drive and pilot tenant lifecycle for demo/evaluation purposes';

-- ============================================================================
-- DEMO TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.demo_templates (
  id TEXT PRIMARY KEY,  -- 'healthcare', 'fintech', 'saas', 'obsidian_black'
  display_name TEXT NOT NULL,
  description TEXT,
  industry TEXT NOT NULL,

  -- Template Data (JSONB for flexibility)
  customer_data JSONB NOT NULL,   -- Customer record template
  contacts_data JSONB NOT NULL,   -- Array of contacts
  contracts_data JSONB NOT NULL,  -- Contract template
  renewals_data JSONB NOT NULL,   -- Renewal template
  operations_data JSONB,          -- Optional demo operations
  tickets_data JSONB,             -- Optional support tickets

  -- Workflow Configuration
  workflow_template_id TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.demo_templates IS 'Industry-specific templates for provisioning test drives and pilots';

-- ============================================================================
-- SEED INITIAL TEMPLATES
-- ============================================================================

INSERT INTO public.demo_templates (id, display_name, description, industry, customer_data, contacts_data, contracts_data, renewals_data, operations_data, tickets_data)
VALUES
  -- Obsidian Black (existing demo scenario)
  (
    'obsidian_black',
    'Obsidian Black',
    'Strategic ops customer with Operation Blackout incident - the classic ACO demo',
    'Global Strategic Coordination Services',
    '{
      "name": "Obsidian Black",
      "health_score": 64,
      "current_arr": 185000,
      "domain": "obsidianblack.io",
      "industry": "Global Strategic Coordination Services",
      "account_plan": "manage",
      "risk_score": 45,
      "opportunity_score": 35
    }'::jsonb,
    '[
      {"first_name": "Marcus", "last_name": "Castellan", "title": "COO", "email": "marcus@obsidianblack.io", "is_primary": true},
      {"first_name": "Elena", "last_name": "Vance", "title": "Director of Operations", "email": "elena@obsidianblack.io", "is_primary": false}
    ]'::jsonb,
    '{
      "arr": 185000,
      "seats": 450,
      "contract_type": "subscription",
      "term_months": 12
    }'::jsonb,
    '{
      "probability": 58,
      "stage": "discovery",
      "risk_level": "medium",
      "expansion_potential": 25000
    }'::jsonb,
    '[
      {"name": "Operation Blackout", "status": "failed", "failure_reason": "Communication breakdown during critical phase", "cost_impact": 45000, "quarter": "Q3 2024"},
      {"name": "Operation Nightfall", "status": "success", "cost_impact": null, "quarter": "Q1 2024"}
    ]'::jsonb,
    '[
      {"ticket_number": "TKT-2847", "subject": "API rate limiting during peak ops", "category": "Technical", "priority": "high", "sentiment": "frustrated"},
      {"ticket_number": "TKT-2891", "subject": "Dashboard loading slowly", "category": "Performance", "priority": "medium", "sentiment": "neutral"}
    ]'::jsonb
  ),

  -- Healthcare SaaS
  (
    'healthcare',
    'MedTech Health Systems',
    'Healthcare SaaS with compliance focus and expansion opportunity',
    'Healthcare Technology',
    '{
      "name": "MedTech Health Systems",
      "health_score": 78,
      "current_arr": 320000,
      "domain": "medtechhealth.com",
      "industry": "Healthcare Technology",
      "account_plan": "expand",
      "risk_score": 22,
      "opportunity_score": 68
    }'::jsonb,
    '[
      {"first_name": "Dr. Sarah", "last_name": "Chen", "title": "CTO", "email": "sarah.chen@medtechhealth.com", "is_primary": true},
      {"first_name": "Robert", "last_name": "Williams", "title": "VP of Engineering", "email": "r.williams@medtechhealth.com", "is_primary": false}
    ]'::jsonb,
    '{
      "arr": 320000,
      "seats": 1200,
      "contract_type": "enterprise",
      "term_months": 36
    }'::jsonb,
    '{
      "probability": 75,
      "stage": "negotiation",
      "risk_level": "low",
      "expansion_potential": 80000
    }'::jsonb,
    NULL,
    '[
      {"ticket_number": "TKT-1001", "subject": "HIPAA compliance audit support", "category": "Compliance", "priority": "high", "sentiment": "satisfied"},
      {"ticket_number": "TKT-1042", "subject": "New department onboarding", "category": "Onboarding", "priority": "medium", "sentiment": "satisfied"}
    ]'::jsonb
  ),

  -- Fintech
  (
    'fintech',
    'SecurePay Financial',
    'Fintech with regulatory expansion opportunity and integration challenges',
    'Financial Services',
    '{
      "name": "SecurePay Financial",
      "health_score": 55,
      "current_arr": 450000,
      "domain": "securepay.io",
      "industry": "Financial Services",
      "account_plan": "manage",
      "risk_score": 58,
      "opportunity_score": 42
    }'::jsonb,
    '[
      {"first_name": "Michael", "last_name": "Torres", "title": "VP Engineering", "email": "m.torres@securepay.io", "is_primary": true},
      {"first_name": "Amanda", "last_name": "Foster", "title": "Head of Compliance", "email": "a.foster@securepay.io", "is_primary": false}
    ]'::jsonb,
    '{
      "arr": 450000,
      "seats": 800,
      "contract_type": "enterprise",
      "term_months": 24
    }'::jsonb,
    '{
      "probability": 45,
      "stage": "discovery",
      "risk_level": "high",
      "expansion_potential": 120000
    }'::jsonb,
    NULL,
    '[
      {"ticket_number": "TKT-3001", "subject": "PCI-DSS audit preparation", "category": "Compliance", "priority": "urgent", "sentiment": "frustrated"},
      {"ticket_number": "TKT-3015", "subject": "API integration issues with banking partners", "category": "Integration", "priority": "high", "sentiment": "frustrated"}
    ]'::jsonb
  ),

  -- SaaS Mid-Market
  (
    'saas',
    'CloudScale Solutions',
    'Mid-market SaaS with strong expansion potential and healthy engagement',
    'Software & Technology',
    '{
      "name": "CloudScale Solutions",
      "health_score": 72,
      "current_arr": 95000,
      "domain": "cloudscale.io",
      "industry": "Software & Technology",
      "account_plan": "expand",
      "risk_score": 28,
      "opportunity_score": 55
    }'::jsonb,
    '[
      {"first_name": "Emily", "last_name": "Zhang", "title": "Director of Operations", "email": "emily@cloudscale.io", "is_primary": true}
    ]'::jsonb,
    '{
      "arr": 95000,
      "seats": 250,
      "contract_type": "subscription",
      "term_months": 12
    }'::jsonb,
    '{
      "probability": 68,
      "stage": "planning",
      "risk_level": "medium",
      "expansion_potential": 35000
    }'::jsonb,
    NULL,
    '[
      {"ticket_number": "TKT-5001", "subject": "Feature request: Advanced reporting", "category": "Feature Request", "priority": "medium", "sentiment": "satisfied"}
    ]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  customer_data = EXCLUDED.customer_data,
  contacts_data = EXCLUDED.contacts_data,
  contracts_data = EXCLUDED.contracts_data,
  renewals_data = EXCLUDED.renewals_data,
  operations_data = EXCLUDED.operations_data,
  tickets_data = EXCLUDED.tickets_data,
  updated_at = NOW();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on pilot_tenants
ALTER TABLE public.pilot_tenants ENABLE ROW LEVEL SECURITY;

-- Policy: Demo mode bypasses all restrictions
CREATE POLICY "pilot_tenants_demo_mode" ON public.pilot_tenants
  USING (is_demo_mode());

-- Policy: Users with demo_godmode can manage all pilot tenants
CREATE POLICY "pilot_tenants_godmode_select" ON public.pilot_tenants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND demo_godmode = true)
  );

CREATE POLICY "pilot_tenants_godmode_insert" ON public.pilot_tenants
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND demo_godmode = true)
  );

CREATE POLICY "pilot_tenants_godmode_update" ON public.pilot_tenants
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND demo_godmode = true)
  );

CREATE POLICY "pilot_tenants_godmode_delete" ON public.pilot_tenants
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND demo_godmode = true)
  );

-- Policy: SEs can view their own provisioned tenants
CREATE POLICY "pilot_tenants_se_view" ON public.pilot_tenants
  FOR SELECT USING (
    provisioned_by = auth.uid()
  );

-- Enable RLS on demo_templates (read-only for most users)
ALTER TABLE public.demo_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_templates_read" ON public.demo_templates
  FOR SELECT USING (true);  -- Anyone can read templates

CREATE POLICY "demo_templates_godmode_write" ON public.demo_templates
  FOR ALL USING (
    is_demo_mode() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND demo_godmode = true)
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a company is a pilot/test-drive tenant
CREATE OR REPLACE FUNCTION public.is_pilot_tenant(company_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = company_uuid
    AND tenant_type IN ('test_drive', 'pilot')
    AND is_demo_tenant = true
  );
$$;

COMMENT ON FUNCTION public.is_pilot_tenant(UUID) IS 'Check if a company is a test drive or pilot tenant';

-- Function to get pilot tenant info for a company
CREATE OR REPLACE FUNCTION public.get_pilot_tenant_info(company_uuid UUID)
RETURNS TABLE(
  pilot_id UUID,
  tenant_type TEXT,
  status TEXT,
  template_id TEXT,
  environment TEXT,
  expires_at TIMESTAMPTZ,
  se_email TEXT,
  prospect_company TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    pt.id,
    pt.tenant_type,
    pt.status,
    pt.template_id,
    pt.environment,
    pt.expires_at,
    pt.se_email,
    pt.prospect_company
  FROM public.pilot_tenants pt
  WHERE pt.company_id = company_uuid
  ORDER BY pt.created_at DESC
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_pilot_tenant_info(UUID) IS 'Get pilot tenant details for a company';

-- Function to clean up a specific pilot tenant
CREATE OR REPLACE FUNCTION public.cleanup_pilot_tenant(pilot_uuid UUID)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  customers_deleted INTEGER,
  contacts_deleted INTEGER,
  contracts_deleted INTEGER,
  renewals_deleted INTEGER,
  workflows_deleted INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
  v_customers_deleted INTEGER := 0;
  v_contacts_deleted INTEGER := 0;
  v_contracts_deleted INTEGER := 0;
  v_renewals_deleted INTEGER := 0;
  v_workflows_deleted INTEGER := 0;
BEGIN
  -- Get company_id for this pilot
  SELECT company_id INTO v_company_id
  FROM public.pilot_tenants
  WHERE id = pilot_uuid;

  IF v_company_id IS NULL THEN
    RETURN QUERY SELECT false, 'Pilot tenant not found', 0, 0, 0, 0, 0;
    RETURN;
  END IF;

  -- Delete workflow executions for this company's demo customers
  DELETE FROM public.workflow_executions
  WHERE customer_id IN (
    SELECT id FROM public.customers
    WHERE company_id = v_company_id AND is_demo = true
  );
  GET DIAGNOSTICS v_workflows_deleted = ROW_COUNT;

  -- Delete demo-specific tables
  DELETE FROM public.demo_strategic_plans
  WHERE customer_id IN (
    SELECT id FROM public.customers
    WHERE company_id = v_company_id AND is_demo = true
  );

  DELETE FROM public.demo_support_tickets
  WHERE customer_id IN (
    SELECT id FROM public.customers
    WHERE company_id = v_company_id AND is_demo = true
  );

  DELETE FROM public.demo_operations
  WHERE customer_id IN (
    SELECT id FROM public.customers
    WHERE company_id = v_company_id AND is_demo = true
  );

  -- Delete renewals
  DELETE FROM public.renewals
  WHERE customer_id IN (
    SELECT id FROM public.customers
    WHERE company_id = v_company_id AND is_demo = true
  );
  GET DIAGNOSTICS v_renewals_deleted = ROW_COUNT;

  -- Delete contracts
  DELETE FROM public.contracts
  WHERE customer_id IN (
    SELECT id FROM public.customers
    WHERE company_id = v_company_id AND is_demo = true
  );
  GET DIAGNOSTICS v_contracts_deleted = ROW_COUNT;

  -- Delete contacts
  DELETE FROM public.contacts
  WHERE customer_id IN (
    SELECT id FROM public.customers
    WHERE company_id = v_company_id AND is_demo = true
  );
  GET DIAGNOSTICS v_contacts_deleted = ROW_COUNT;

  -- Delete customers
  DELETE FROM public.customers
  WHERE company_id = v_company_id AND is_demo = true;
  GET DIAGNOSTICS v_customers_deleted = ROW_COUNT;

  -- Update pilot_tenants record
  UPDATE public.pilot_tenants
  SET
    status = 'archived',
    cleanup_completed_at = NOW()
  WHERE id = pilot_uuid;

  RETURN QUERY SELECT
    true,
    'Pilot tenant cleaned up successfully',
    v_customers_deleted,
    v_contacts_deleted,
    v_contracts_deleted,
    v_renewals_deleted,
    v_workflows_deleted;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT
    false,
    'Error: ' || SQLERRM,
    0, 0, 0, 0, 0;
END;
$$;

COMMENT ON FUNCTION public.cleanup_pilot_tenant(UUID) IS 'Clean up all demo data for a specific pilot tenant';

-- Function to find expired pilot tenants
CREATE OR REPLACE FUNCTION public.get_expired_pilot_tenants()
RETURNS TABLE(
  pilot_id UUID,
  company_id UUID,
  tenant_type TEXT,
  se_email TEXT,
  prospect_company TEXT,
  expired_since INTERVAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    id,
    company_id,
    tenant_type,
    se_email,
    prospect_company,
    NOW() - expires_at as expired_since
  FROM public.pilot_tenants
  WHERE status = 'active'
  AND expires_at < NOW()
  ORDER BY expires_at ASC;
$$;

COMMENT ON FUNCTION public.get_expired_pilot_tenants() IS 'Get all pilot tenants that have expired and need cleanup';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
--   1. Create CLI tool for provisioning (scripts/renubu-admin/)
--   2. Create cleanup cron endpoint (/api/cron/cleanup-expired-tenants)
--   3. Configure Vercel projects for demo/staging/production
--   4. Set up git branching strategy (demo-stable, tags)
-- ============================================================================
