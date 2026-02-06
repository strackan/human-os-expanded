-- ============================================
-- CRM SCHEMA
-- Opportunities, pipelines, and deal tracking
-- Dual-key scoping: owner_id (personal) OR tenant_id (team)
-- ============================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS crm;

-- =============================================================================
-- SCOPE CHECK TRIGGER FUNCTION
-- Ensures exactly one of owner_id/tenant_id is set
-- =============================================================================

CREATE OR REPLACE FUNCTION crm.check_scope()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.owner_id IS NULL AND NEW.tenant_id IS NULL) THEN
    RAISE EXCEPTION 'Either owner_id or tenant_id must be set';
  END IF;
  IF (NEW.owner_id IS NOT NULL AND NEW.tenant_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Cannot set both owner_id and tenant_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. PIPELINE STAGES
-- Customizable deal stages per owner/tenant
-- =============================================================================

CREATE TABLE IF NOT EXISTS crm.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dual-key scoping (one must be set, except for template rows)
  owner_id UUID,
  tenant_id UUID,

  -- Stage definition
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false,
  color TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- For user/tenant stages, ensure unique names within scope
  UNIQUE NULLS NOT DISTINCT (owner_id, tenant_id, name)
);

-- Scope check trigger (skip for template rows where both are NULL)
CREATE OR REPLACE FUNCTION crm.check_pipeline_stage_scope()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow template rows (both NULL)
  IF (NEW.owner_id IS NULL AND NEW.tenant_id IS NULL) THEN
    RETURN NEW;
  END IF;
  -- Enforce mutual exclusion for non-template rows
  IF (NEW.owner_id IS NOT NULL AND NEW.tenant_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Cannot set both owner_id and tenant_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_pipeline_stages_scope ON crm.pipeline_stages;
CREATE TRIGGER check_pipeline_stages_scope BEFORE INSERT OR UPDATE ON crm.pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION crm.check_pipeline_stage_scope();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_owner ON crm.pipeline_stages(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_tenant ON crm.pipeline_stages(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_position ON crm.pipeline_stages(position);

-- =============================================================================
-- 2. PRODUCTS/SERVICES
-- What you sell
-- =============================================================================

CREATE TABLE IF NOT EXISTS crm.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dual-key scoping
  owner_id UUID,
  tenant_id UUID,

  -- Product info
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  description TEXT,
  unit_price DECIMAL(12,2),
  is_recurring BOOLEAN DEFAULT false,
  billing_period TEXT CHECK (billing_period IN ('monthly', 'quarterly', 'annually', 'one_time')),
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Scope constraint
  CONSTRAINT products_scope_check CHECK (
    (owner_id IS NOT NULL AND tenant_id IS NULL) OR
    (owner_id IS NULL AND tenant_id IS NOT NULL)
  ),

  -- Unique SKU per scope
  UNIQUE NULLS NOT DISTINCT (owner_id, tenant_id, sku)
);

DROP TRIGGER IF EXISTS check_products_scope ON crm.products;
CREATE TRIGGER check_products_scope BEFORE INSERT OR UPDATE ON crm.products
  FOR EACH ROW EXECUTE FUNCTION crm.check_scope();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_owner ON crm.products(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_tenant ON crm.products(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON crm.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON crm.products(is_active) WHERE is_active = true;

-- =============================================================================
-- 3. OPPORTUNITIES (Deals)
-- Core CRM entity for tracking deals
-- =============================================================================

CREATE TABLE IF NOT EXISTS crm.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dual-key scoping
  owner_id UUID,
  tenant_id UUID,

  -- Links (via canonical entities for portability)
  entity_id UUID,                    -- Link to global.entities (contact)
  gft_contact_id UUID,               -- Optional direct link to gft.contacts
  company_entity_id UUID,            -- Link to global.entities (company)
  gft_company_id UUID,               -- Optional direct link to gft.companies

  -- Deal info
  name TEXT NOT NULL,
  stage_id UUID REFERENCES crm.pipeline_stages(id) ON DELETE SET NULL,
  expected_value DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  expected_close_date DATE,
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),

  -- Context
  source TEXT,                       -- linkedin, referral, inbound, cold_outreach, event
  description TEXT,
  next_step TEXT,
  next_step_date DATE,

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,

  -- Assigned to (for team CRM)
  assigned_to UUID,

  -- Scope constraint
  CONSTRAINT opportunities_scope_check CHECK (
    (owner_id IS NOT NULL AND tenant_id IS NULL) OR
    (owner_id IS NULL AND tenant_id IS NOT NULL)
  )
);

DROP TRIGGER IF EXISTS check_opportunities_scope ON crm.opportunities;
CREATE TRIGGER check_opportunities_scope BEFORE INSERT OR UPDATE ON crm.opportunities
  FOR EACH ROW EXECUTE FUNCTION crm.check_scope();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_owner ON crm.opportunities(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_tenant ON crm.opportunities(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_entity ON crm.opportunities(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_gft_contact ON crm.opportunities(gft_contact_id) WHERE gft_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_company ON crm.opportunities(company_entity_id) WHERE company_entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON crm.opportunities(stage_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_expected_close ON crm.opportunities(expected_close_date) WHERE expected_close_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_created ON crm.opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_open ON crm.opportunities(owner_id, stage_id) WHERE closed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_assigned ON crm.opportunities(assigned_to) WHERE assigned_to IS NOT NULL;

-- =============================================================================
-- 4. OPPORTUNITY ACTIVITIES
-- Activities linked to specific deals
-- =============================================================================

CREATE TABLE IF NOT EXISTS crm.opportunity_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES crm.opportunities(id) ON DELETE CASCADE,

  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'note', 'linkedin_message',
    'demo', 'proposal_sent', 'contract_sent', 'follow_up', 'other'
  )),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  outcome TEXT,                      -- completed, no_answer, voicemail, rescheduled, etc.
  duration_minutes INTEGER,

  -- Who did this
  created_by UUID,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_opportunity_activities_opportunity ON crm.opportunity_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_activities_type ON crm.opportunity_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_opportunity_activities_occurred ON crm.opportunity_activities(occurred_at DESC);

-- =============================================================================
-- 5. OPPORTUNITY LINE ITEMS
-- Products/services in each deal
-- =============================================================================

CREATE TABLE IF NOT EXISTS crm.opportunity_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES crm.opportunities(id) ON DELETE CASCADE,
  product_id UUID REFERENCES crm.products(id) ON DELETE SET NULL,

  -- Pricing
  product_name TEXT,                 -- Denormalized for deleted products
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),

  -- Computed total
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (
    quantity * unit_price * (1 - discount_percent / 100)
  ) STORED,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_line_items_opportunity ON crm.opportunity_line_items(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_line_items_product ON crm.opportunity_line_items(product_id) WHERE product_id IS NOT NULL;

-- =============================================================================
-- 6. ACCOUNT CONTEXT
-- Tenant-specific company intelligence
-- =============================================================================

CREATE TABLE IF NOT EXISTS crm.account_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dual-key scoping
  owner_id UUID,
  tenant_id UUID,

  -- Links
  company_entity_id UUID,            -- Link to global.entities
  gft_company_id UUID,               -- Optional link to gft.companies

  -- Account classification
  account_type TEXT CHECK (account_type IN ('prospect', 'customer', 'partner', 'competitor', 'other')),
  tier TEXT CHECK (tier IN ('enterprise', 'mid_market', 'smb', 'startup')),
  industry_vertical TEXT,

  -- Intelligence
  tech_stack JSONB DEFAULT '[]'::jsonb,
  budget_info TEXT,
  decision_process TEXT,
  fiscal_year_end TEXT,              -- e.g., 'December', 'June'

  -- Relationship
  relationship_owner UUID,
  last_engagement_date DATE,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Scope constraint
  CONSTRAINT account_context_scope_check CHECK (
    (owner_id IS NOT NULL AND tenant_id IS NULL) OR
    (owner_id IS NULL AND tenant_id IS NOT NULL)
  ),

  -- One context per company per scope
  UNIQUE NULLS NOT DISTINCT (owner_id, tenant_id, company_entity_id),
  UNIQUE NULLS NOT DISTINCT (owner_id, tenant_id, gft_company_id)
);

DROP TRIGGER IF EXISTS check_account_context_scope ON crm.account_context;
CREATE TRIGGER check_account_context_scope BEFORE INSERT OR UPDATE ON crm.account_context
  FOR EACH ROW EXECUTE FUNCTION crm.check_scope();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_account_context_owner ON crm.account_context(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_account_context_tenant ON crm.account_context(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_account_context_company ON crm.account_context(company_entity_id) WHERE company_entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_account_context_gft_company ON crm.account_context(gft_company_id) WHERE gft_company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_account_context_type ON crm.account_context(account_type);
CREATE INDEX IF NOT EXISTS idx_account_context_tier ON crm.account_context(tier);

-- =============================================================================
-- TRIGGERS - Updated At
-- =============================================================================

DROP TRIGGER IF EXISTS update_pipeline_stages_updated_at ON crm.pipeline_stages;
CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON crm.pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON crm.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON crm.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON crm.opportunities;
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON crm.opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_account_context_updated_at ON crm.account_context;
CREATE TRIGGER update_account_context_updated_at BEFORE UPDATE ON crm.account_context
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE crm.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.opportunity_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.opportunity_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.account_context ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
DROP POLICY IF EXISTS "service_all" ON crm.pipeline_stages;
CREATE POLICY "service_all" ON crm.pipeline_stages FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_all" ON crm.products;
CREATE POLICY "service_all" ON crm.products FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_all" ON crm.opportunities;
CREATE POLICY "service_all" ON crm.opportunities FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_all" ON crm.opportunity_activities;
CREATE POLICY "service_all" ON crm.opportunity_activities FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_all" ON crm.opportunity_line_items;
CREATE POLICY "service_all" ON crm.opportunity_line_items FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_all" ON crm.account_context;
CREATE POLICY "service_all" ON crm.account_context FOR ALL TO service_role USING (true) WITH CHECK (true);

-- PIPELINE STAGES: Owner or tenant access, plus template rows
DROP POLICY IF EXISTS "stages_owner_read" ON crm.pipeline_stages;
CREATE POLICY "stages_owner_read" ON crm.pipeline_stages
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR (owner_id IS NULL AND tenant_id IS NULL)  -- Template rows
  );

DROP POLICY IF EXISTS "stages_owner_write" ON crm.pipeline_stages;
CREATE POLICY "stages_owner_write" ON crm.pipeline_stages
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() AND tenant_id IS NULL);

DROP POLICY IF EXISTS "stages_tenant_read" ON crm.pipeline_stages;
CREATE POLICY "stages_tenant_read" ON crm.pipeline_stages
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NOT NULL
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

DROP POLICY IF EXISTS "stages_tenant_write" ON crm.pipeline_stages;
CREATE POLICY "stages_tenant_write" ON crm.pipeline_stages
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND owner_id IS NULL);

-- PRODUCTS: Owner or tenant access
DROP POLICY IF EXISTS "products_owner_read" ON crm.products;
CREATE POLICY "products_owner_read" ON crm.products
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "products_owner_write" ON crm.products;
CREATE POLICY "products_owner_write" ON crm.products
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() AND tenant_id IS NULL);

DROP POLICY IF EXISTS "products_tenant_read" ON crm.products;
CREATE POLICY "products_tenant_read" ON crm.products
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NOT NULL
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

DROP POLICY IF EXISTS "products_tenant_write" ON crm.products;
CREATE POLICY "products_tenant_write" ON crm.products
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND owner_id IS NULL);

-- OPPORTUNITIES: Owner or tenant access
DROP POLICY IF EXISTS "opportunities_owner_read" ON crm.opportunities;
CREATE POLICY "opportunities_owner_read" ON crm.opportunities
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "opportunities_owner_write" ON crm.opportunities;
CREATE POLICY "opportunities_owner_write" ON crm.opportunities
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() AND tenant_id IS NULL);

DROP POLICY IF EXISTS "opportunities_tenant_read" ON crm.opportunities;
CREATE POLICY "opportunities_tenant_read" ON crm.opportunities
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NOT NULL
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

DROP POLICY IF EXISTS "opportunities_tenant_write" ON crm.opportunities;
CREATE POLICY "opportunities_tenant_write" ON crm.opportunities
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND owner_id IS NULL);

-- OPPORTUNITY ACTIVITIES: Access via opportunity
DROP POLICY IF EXISTS "activities_read" ON crm.opportunity_activities;
CREATE POLICY "activities_read" ON crm.opportunity_activities
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm.opportunities o
      WHERE o.id = opportunity_id
        AND (
          o.owner_id = auth.uid()
          OR o.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        )
    )
  );

DROP POLICY IF EXISTS "activities_write" ON crm.opportunity_activities;
CREATE POLICY "activities_write" ON crm.opportunity_activities
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm.opportunities o
      WHERE o.id = opportunity_id
        AND (
          o.owner_id = auth.uid()
          OR o.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm.opportunities o
      WHERE o.id = opportunity_id
        AND (
          o.owner_id = auth.uid()
          OR o.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        )
    )
  );

-- LINE ITEMS: Access via opportunity
DROP POLICY IF EXISTS "line_items_read" ON crm.opportunity_line_items;
CREATE POLICY "line_items_read" ON crm.opportunity_line_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm.opportunities o
      WHERE o.id = opportunity_id
        AND (
          o.owner_id = auth.uid()
          OR o.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        )
    )
  );

DROP POLICY IF EXISTS "line_items_write" ON crm.opportunity_line_items;
CREATE POLICY "line_items_write" ON crm.opportunity_line_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm.opportunities o
      WHERE o.id = opportunity_id
        AND (
          o.owner_id = auth.uid()
          OR o.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm.opportunities o
      WHERE o.id = opportunity_id
        AND (
          o.owner_id = auth.uid()
          OR o.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        )
    )
  );

-- ACCOUNT CONTEXT: Owner or tenant access
DROP POLICY IF EXISTS "account_context_owner_read" ON crm.account_context;
CREATE POLICY "account_context_owner_read" ON crm.account_context
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "account_context_owner_write" ON crm.account_context;
CREATE POLICY "account_context_owner_write" ON crm.account_context
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() AND tenant_id IS NULL);

DROP POLICY IF EXISTS "account_context_tenant_read" ON crm.account_context;
CREATE POLICY "account_context_tenant_read" ON crm.account_context
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NOT NULL
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

DROP POLICY IF EXISTS "account_context_tenant_write" ON crm.account_context;
CREATE POLICY "account_context_tenant_write" ON crm.account_context
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND owner_id IS NULL);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Initialize pipeline stages for a new user/tenant
CREATE OR REPLACE FUNCTION crm.initialize_pipeline(
  p_owner_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS SETOF crm.pipeline_stages
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate scope
  IF (p_owner_id IS NULL AND p_tenant_id IS NULL) THEN
    RAISE EXCEPTION 'Either owner_id or tenant_id must be provided';
  END IF;
  IF (p_owner_id IS NOT NULL AND p_tenant_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Cannot provide both owner_id and tenant_id';
  END IF;

  -- Clone from template stages
  RETURN QUERY
  INSERT INTO crm.pipeline_stages (owner_id, tenant_id, name, position, probability, is_won, is_lost, color)
  SELECT
    p_owner_id,
    p_tenant_id,
    t.name,
    t.position,
    t.probability,
    t.is_won,
    t.is_lost,
    t.color
  FROM crm.pipeline_stages t
  WHERE t.owner_id IS NULL AND t.tenant_id IS NULL  -- Template rows
  ON CONFLICT (owner_id, tenant_id, name) DO NOTHING
  RETURNING *;
END;
$$;

-- Get all opportunities for a contact (via entity_id or gft_contact_id)
CREATE OR REPLACE FUNCTION crm.get_contact_opportunities(
  p_gft_contact_id UUID DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
)
RETURNS SETOF crm.opportunities
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entity_id UUID;
BEGIN
  -- Resolve entity_id from gft_contact_id if needed
  IF p_entity_id IS NULL AND p_gft_contact_id IS NOT NULL THEN
    SELECT global_entity_id INTO v_entity_id
    FROM gft.contacts
    WHERE id = p_gft_contact_id;
  ELSE
    v_entity_id := p_entity_id;
  END IF;

  -- Return opportunities matching either link
  RETURN QUERY
  SELECT o.*
  FROM crm.opportunities o
  WHERE
    o.gft_contact_id = p_gft_contact_id
    OR (v_entity_id IS NOT NULL AND o.entity_id = v_entity_id);
END;
$$;

-- Get pipeline summary (counts and values per stage)
CREATE OR REPLACE FUNCTION crm.get_pipeline_summary(
  p_owner_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  stage_id UUID,
  stage_name TEXT,
  "position" INTEGER,
  opportunity_count BIGINT,
  total_value DECIMAL(12,2),
  weighted_value DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS stage_id,
    s.name AS stage_name,
    s."position",
    COUNT(o.id) AS opportunity_count,
    COALESCE(SUM(o.expected_value), 0) AS total_value,
    COALESCE(SUM(o.expected_value * COALESCE(o.probability, s.probability) / 100.0), 0) AS weighted_value
  FROM crm.pipeline_stages s
  LEFT JOIN crm.opportunities o ON o.stage_id = s.id
    AND o.closed_at IS NULL
    AND (
      (p_owner_id IS NOT NULL AND o.owner_id = p_owner_id)
      OR (p_tenant_id IS NOT NULL AND o.tenant_id = p_tenant_id)
    )
  WHERE
    (
      (p_owner_id IS NOT NULL AND s.owner_id = p_owner_id)
      OR (p_tenant_id IS NOT NULL AND s.tenant_id = p_tenant_id)
    )
    AND s.is_lost = false  -- Exclude lost stage from pipeline view
  GROUP BY s.id, s.name, s."position"
  ORDER BY s."position";
END;
$$;

-- Calculate opportunity total from line items
CREATE OR REPLACE FUNCTION crm.calculate_opportunity_total(p_opportunity_id UUID)
RETURNS DECIMAL(12,2)
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(SUM(total_price), 0)
  FROM crm.opportunity_line_items
  WHERE opportunity_id = p_opportunity_id;
$$;

-- =============================================================================
-- DEFAULT PIPELINE STAGES (Template rows)
-- These are cloned when initializing a new user/tenant
-- =============================================================================

INSERT INTO crm.pipeline_stages (owner_id, tenant_id, name, position, probability, is_won, is_lost, color) VALUES
  (NULL, NULL, 'Lead', 1, 10, false, false, '#6366f1'),
  (NULL, NULL, 'Qualified', 2, 25, false, false, '#8b5cf6'),
  (NULL, NULL, 'Proposal', 3, 50, false, false, '#a855f7'),
  (NULL, NULL, 'Negotiation', 4, 75, false, false, '#d946ef'),
  (NULL, NULL, 'Closed Won', 5, 100, true, false, '#22c55e'),
  (NULL, NULL, 'Closed Lost', 6, 0, false, true, '#ef4444')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT USAGE ON SCHEMA crm TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA crm TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA crm TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA crm TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION crm.initialize_pipeline TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION crm.get_contact_opportunities TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION crm.get_pipeline_summary TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION crm.calculate_opportunity_total TO authenticated, service_role;

-- =============================================================================
-- EXPOSE SCHEMA TO POSTGREST
-- =============================================================================

ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,human_os,founder_os,gft,global,crm';
NOTIFY pgrst, 'reload config';

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON SCHEMA crm IS 'CRM overlay for opportunities, pipelines, and deal tracking';

COMMENT ON TABLE crm.pipeline_stages IS 'Customizable deal stages per owner or tenant';
COMMENT ON TABLE crm.opportunities IS 'Deals with pipeline tracking';
COMMENT ON TABLE crm.opportunity_activities IS 'Activities linked to deals';
COMMENT ON TABLE crm.products IS 'Products and services catalog';
COMMENT ON TABLE crm.opportunity_line_items IS 'Products/services in each deal';
COMMENT ON TABLE crm.account_context IS 'Tenant-specific company intelligence';

COMMENT ON FUNCTION crm.initialize_pipeline IS 'Clone default pipeline stages for a new user or tenant';
COMMENT ON FUNCTION crm.get_contact_opportunities IS 'Get all opportunities for a contact via entity_id or gft_contact_id';
COMMENT ON FUNCTION crm.get_pipeline_summary IS 'Get pipeline summary with counts and values per stage';
COMMENT ON FUNCTION crm.calculate_opportunity_total IS 'Calculate total value from line items';
