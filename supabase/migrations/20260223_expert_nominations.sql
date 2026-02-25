-- ============================================
-- Expert Nominations (#15)
-- Chain of expert designations: Justin designates Scott,
-- Scott nominates Alice, chain continues.
-- ============================================

-- =============================================================================
-- EXPERT CATEGORIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS gft.expert_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES gft.expert_categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending_review', 'rejected')),
  suggested_by UUID,  -- entity_id of who suggested it
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gft_expert_categories_slug ON gft.expert_categories(slug);
CREATE INDEX IF NOT EXISTS idx_gft_expert_categories_status ON gft.expert_categories(status);

-- =============================================================================
-- EXPERT DESIGNATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS gft.expert_designations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_entity_id UUID NOT NULL,       -- the person being designated
  category_id UUID NOT NULL REFERENCES gft.expert_categories(id) ON DELETE CASCADE,
  designated_by_entity_id UUID NOT NULL, -- who designated them
  claim_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (claim_status IN ('pending', 'claimed', 'declined')),
  claim_token TEXT UNIQUE,              -- for email claim link
  claimed_at TIMESTAMPTZ,
  mini_profile JSONB DEFAULT '{}'::jsonb, -- tagline, linkedin_url, one_liner
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(expert_entity_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_gft_designations_expert ON gft.expert_designations(expert_entity_id);
CREATE INDEX IF NOT EXISTS idx_gft_designations_category ON gft.expert_designations(category_id);
CREATE INDEX IF NOT EXISTS idx_gft_designations_designated_by ON gft.expert_designations(designated_by_entity_id);
CREATE INDEX IF NOT EXISTS idx_gft_designations_claim_token ON gft.expert_designations(claim_token);
CREATE INDEX IF NOT EXISTS idx_gft_designations_claim_status ON gft.expert_designations(claim_status);

-- =============================================================================
-- EXPERT NOMINATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS gft.expert_nominations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nominator_entity_id UUID NOT NULL,    -- who nominated them
  nominee_name TEXT NOT NULL,
  nominee_email TEXT,
  category_id UUID NOT NULL REFERENCES gft.expert_categories(id) ON DELETE CASCADE,
  message TEXT,                          -- personal note
  status TEXT NOT NULL DEFAULT 'pending_invite'
    CHECK (status IN ('pending_invite', 'invited', 'claimed', 'expired')),
  designation_id UUID REFERENCES gft.expert_designations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gft_nominations_nominator ON gft.expert_nominations(nominator_entity_id);
CREATE INDEX IF NOT EXISTS idx_gft_nominations_category ON gft.expert_nominations(category_id);
CREATE INDEX IF NOT EXISTS idx_gft_nominations_status ON gft.expert_nominations(status);

-- =============================================================================
-- EXPERT ASSESSMENTS (placeholder for future interview feature)
-- Each category can have an assessment template. When an expert claims,
-- they can optionally take the interview to encode their knowledge.
-- =============================================================================

CREATE TABLE IF NOT EXISTS gft.expert_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES gft.expert_categories(id) ON DELETE CASCADE,
  designation_id UUID REFERENCES gft.expert_designations(id) ON DELETE SET NULL,
  expert_entity_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'published')),
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'paywalled', 'private')),
  responses JSONB DEFAULT '[]'::jsonb,   -- array of {question, answer, timestamp}
  summary TEXT,                           -- AI-generated summary of expertise
  completed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(designation_id)
);

CREATE INDEX IF NOT EXISTS idx_gft_assessments_category ON gft.expert_assessments(category_id);
CREATE INDEX IF NOT EXISTS idx_gft_assessments_expert ON gft.expert_assessments(expert_entity_id);
CREATE INDEX IF NOT EXISTS idx_gft_assessments_status ON gft.expert_assessments(status);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS update_gft_expert_categories_updated_at ON gft.expert_categories;
CREATE TRIGGER update_gft_expert_categories_updated_at
  BEFORE UPDATE ON gft.expert_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gft_expert_designations_updated_at ON gft.expert_designations;
CREATE TRIGGER update_gft_expert_designations_updated_at
  BEFORE UPDATE ON gft.expert_designations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gft_expert_nominations_updated_at ON gft.expert_nominations;
CREATE TRIGGER update_gft_expert_nominations_updated_at
  BEFORE UPDATE ON gft.expert_nominations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gft_expert_assessments_updated_at ON gft.expert_assessments;
CREATE TRIGGER update_gft_expert_assessments_updated_at
  BEFORE UPDATE ON gft.expert_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE gft.expert_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.expert_designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.expert_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.expert_assessments ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
DROP POLICY IF EXISTS service_all ON gft.expert_categories;
CREATE POLICY service_all ON gft.expert_categories FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_all ON gft.expert_designations;
CREATE POLICY service_all ON gft.expert_designations FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_all ON gft.expert_nominations;
CREATE POLICY service_all ON gft.expert_nominations FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_all ON gft.expert_assessments;
CREATE POLICY service_all ON gft.expert_assessments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- HELPER: get_nomination_chain
-- Recursive CTE walking designator → expert → nominations
-- =============================================================================

CREATE OR REPLACE FUNCTION gft.get_nomination_chain(p_entity_id UUID)
RETURNS TABLE (
  depth INT,
  entity_id UUID,
  entity_name TEXT,
  entity_email TEXT,
  category_slug TEXT,
  category_name TEXT,
  designated_by_entity_id UUID,
  designated_by_name TEXT,
  claim_status TEXT,
  nomination_count BIGINT
) LANGUAGE sql STABLE AS $$
  WITH RECURSIVE chain AS (
    -- Base: designations where this entity is the expert
    SELECT
      0 AS depth,
      d.expert_entity_id AS entity_id,
      e.name AS entity_name,
      e.email AS entity_email,
      c.slug AS category_slug,
      c.name AS category_name,
      d.designated_by_entity_id,
      db.name AS designated_by_name,
      d.claim_status,
      d.id AS designation_id
    FROM gft.expert_designations d
    JOIN entities e ON e.id = d.expert_entity_id
    JOIN gft.expert_categories c ON c.id = d.category_id
    LEFT JOIN entities db ON db.id = d.designated_by_entity_id
    WHERE d.expert_entity_id = p_entity_id
       OR d.designated_by_entity_id = p_entity_id

    UNION ALL

    -- Recurse: follow outgoing nominations that became designations
    SELECT
      ch.depth + 1,
      d2.expert_entity_id,
      e2.name,
      e2.email,
      c2.slug,
      c2.name,
      d2.designated_by_entity_id,
      db2.name,
      d2.claim_status,
      d2.id
    FROM chain ch
    JOIN gft.expert_nominations n ON n.nominator_entity_id = ch.entity_id
    JOIN gft.expert_designations d2 ON d2.id = n.designation_id
    JOIN entities e2 ON e2.id = d2.expert_entity_id
    JOIN gft.expert_categories c2 ON c2.id = d2.category_id
    LEFT JOIN entities db2 ON db2.id = d2.designated_by_entity_id
    WHERE ch.depth < 10  -- prevent infinite recursion
  )
  SELECT
    chain.depth,
    chain.entity_id,
    chain.entity_name,
    chain.entity_email,
    chain.category_slug,
    chain.category_name,
    chain.designated_by_entity_id,
    chain.designated_by_name,
    chain.claim_status,
    (SELECT COUNT(*) FROM gft.expert_nominations nom WHERE nom.nominator_entity_id = chain.entity_id) AS nomination_count
  FROM chain
  ORDER BY chain.depth, chain.category_slug;
$$;

-- =============================================================================
-- SEED CATEGORIES
-- =============================================================================

INSERT INTO gft.expert_categories (slug, name, description) VALUES
  ('sales-leadership', 'Sales Leadership', 'Sales strategy, team building, and quota achievement'),
  ('revenue-operations', 'Revenue Operations', 'RevOps, forecasting, and GTM alignment'),
  ('customer-success', 'Customer Success', 'Retention, expansion, and customer outcomes'),
  ('product-management', 'Product Management', 'Product strategy, roadmapping, and discovery'),
  ('engineering-leadership', 'Engineering Leadership', 'Technical leadership, team scaling, and architecture'),
  ('go-to-market', 'Go-to-Market', 'GTM strategy, launch planning, and market entry'),
  ('fundraising', 'Fundraising', 'Venture capital, pitch strategy, and investor relations'),
  ('brand-building', 'Brand Building', 'Brand strategy, positioning, and creative direction'),
  ('community-building', 'Community Building', 'Community strategy, engagement, and growth'),
  ('partnerships', 'Partnerships', 'Strategic alliances, channel partnerships, and BD'),
  ('demand-generation', 'Demand Generation', 'Pipeline generation, ABM, and marketing ops'),
  ('sales-enablement', 'Sales Enablement', 'Training, content, and sales productivity'),
  ('talent-acquisition', 'Talent Acquisition', 'Recruiting strategy, employer branding, and hiring'),
  ('executive-coaching', 'Executive Coaching', 'Leadership development, performance, and mindset'),
  ('content-strategy', 'Content Strategy', 'Content marketing, thought leadership, and editorial'),
  ('marketing-strategy', 'Marketing Strategy', 'Integrated marketing, positioning, and campaigns'),
  ('financial-planning', 'Financial Planning', 'FP&A, modeling, and financial strategy'),
  ('people-operations', 'People Operations', 'HR strategy, culture, and organizational design'),
  ('data-science', 'Data Science', 'Analytics, ML, and data-driven decision making'),
  ('ai-engineering', 'AI Engineering', 'Applied AI, LLMs, and ML infrastructure'),
  ('cybersecurity', 'Cybersecurity', 'Security strategy, compliance, and risk management'),
  ('legal-strategy', 'Legal Strategy', 'Corporate law, contracts, and regulatory'),
  ('venture-capital', 'Venture Capital', 'VC investing, portfolio management, and deal flow'),
  ('operations', 'Operations', 'Business operations, process optimization, and scaling'),
  ('account-management', 'Account Management', 'Key accounts, relationship management, and upselling')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- EXPOSE SCHEMA UPDATES TO POSTGREST
-- =============================================================================

NOTIFY pgrst, 'reload config';

-- COMMENTS
COMMENT ON TABLE gft.expert_categories IS 'Expert category taxonomy for the nomination chain';
COMMENT ON TABLE gft.expert_designations IS 'Expert designations — someone is "the guy" for a category';
COMMENT ON TABLE gft.expert_nominations IS 'Outgoing nominations from experts to new nominees';
COMMENT ON TABLE gft.expert_assessments IS 'Placeholder: expert interview/assessment per designation (future feature)';
COMMENT ON FUNCTION gft.get_nomination_chain IS 'Walk the expert nomination chain from a given entity';
