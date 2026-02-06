-- ============================================
-- CRM CAMPAIGNS (Phase 1)
-- Basic campaign tracking for outbound efforts
-- Converts members to opportunities on success
-- ============================================

-- =============================================================================
-- 1. CAMPAIGNS
-- Container for outbound efforts targeting groups of contacts
-- =============================================================================

CREATE TABLE IF NOT EXISTS crm.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dual-key scoping
  owner_id UUID,
  tenant_id UUID,

  -- Campaign info
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'outbound' CHECK (campaign_type IN (
    'outbound',        -- Cold outreach
    'nurture',         -- Warm leads, stay in touch
    'event',           -- Event-based (webinar, conference)
    're_engagement'    -- Revive cold contacts
  )),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',           -- Setting up
    'active',          -- Running
    'paused',          -- Temporarily stopped
    'completed'        -- Finished
  )),

  -- Goals
  goal_type TEXT CHECK (goal_type IN (
    'discovery_calls',  -- Book discovery/intro calls
    'responses',        -- Get replies
    'meetings',         -- Book any meeting
    'demos',            -- Book product demos
    'conversions'       -- Generic conversion
  )),
  goal_target INTEGER,  -- Target number to achieve

  -- Timing
  start_date DATE,
  end_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Scope constraint
  CONSTRAINT campaigns_scope_check CHECK (
    (owner_id IS NOT NULL AND tenant_id IS NULL) OR
    (owner_id IS NULL AND tenant_id IS NOT NULL)
  )
);

DROP TRIGGER IF EXISTS check_campaigns_scope ON crm.campaigns;
CREATE TRIGGER check_campaigns_scope BEFORE INSERT OR UPDATE ON crm.campaigns
  FOR EACH ROW EXECUTE FUNCTION crm.check_scope();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON crm.campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON crm.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_owner ON crm.campaigns(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON crm.campaigns(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON crm.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON crm.campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON crm.campaigns(owner_id, status) WHERE status = 'active';

-- =============================================================================
-- 2. CAMPAIGN MEMBERS
-- Contacts enrolled in a campaign with status tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS crm.campaign_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES crm.campaigns(id) ON DELETE CASCADE,

  -- Contact link (same pattern as opportunities)
  entity_id UUID,
  gft_contact_id UUID,

  -- Member status in campaign
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',         -- Added but not yet contacted
    'contacted',       -- First outreach sent
    'responded',       -- Got a reply (positive or negative)
    'interested',      -- Expressed interest
    'converted',       -- Became opportunity/meeting
    'not_interested',  -- Declined
    'opted_out',       -- Unsubscribed/asked to stop
    'bounced'          -- Unreachable (bad email, etc.)
  )),

  -- Tracking timestamps
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_contacted_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,

  -- Conversion tracking
  converted_to_opportunity_id UUID REFERENCES crm.opportunities(id) ON DELETE SET NULL,

  -- Notes
  notes TEXT,

  -- Prevent duplicate enrollment
  UNIQUE NULLS NOT DISTINCT (campaign_id, entity_id),
  UNIQUE NULLS NOT DISTINCT (campaign_id, gft_contact_id),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_campaign_members_updated_at ON crm.campaign_members;
CREATE TRIGGER update_campaign_members_updated_at BEFORE UPDATE ON crm.campaign_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign ON crm.campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_entity ON crm.campaign_members(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_members_contact ON crm.campaign_members(gft_contact_id) WHERE gft_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_members_status ON crm.campaign_members(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_members_pending ON crm.campaign_members(campaign_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_campaign_members_converted ON crm.campaign_members(converted_to_opportunity_id) WHERE converted_to_opportunity_id IS NOT NULL;

-- =============================================================================
-- 3. CAMPAIGN ACTIVITIES
-- Log of outreach activities for campaign members
-- =============================================================================

CREATE TABLE IF NOT EXISTS crm.campaign_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES crm.campaigns(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES crm.campaign_members(id) ON DELETE CASCADE,

  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'linkedin_connect',    -- Connection request
    'linkedin_message',    -- InMail or message
    'email',               -- Email sent
    'call',                -- Phone call
    'voicemail',           -- Left voicemail
    'other'
  )),

  -- Content
  message_content TEXT,    -- What was sent (for reference)

  -- Outcome
  outcome TEXT CHECK (outcome IN (
    'sent',                -- Sent successfully
    'delivered',           -- Confirmed delivered
    'opened',              -- Email opened (if tracked)
    'replied',             -- Got a response
    'accepted',            -- Connection accepted
    'declined',            -- Connection declined
    'bounced',             -- Failed to deliver
    'no_answer'            -- Call not answered
  )),

  -- Response tracking
  response_received_at TIMESTAMPTZ,
  response_content TEXT,

  -- Metadata
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_activities_campaign ON crm.campaign_activities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_activities_member ON crm.campaign_activities(member_id);
CREATE INDEX IF NOT EXISTS idx_campaign_activities_type ON crm.campaign_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_campaign_activities_performed ON crm.campaign_activities(performed_at DESC);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE crm.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.campaign_activities ENABLE ROW LEVEL SECURITY;

-- Service role
DROP POLICY IF EXISTS "service_all" ON crm.campaigns;
CREATE POLICY "service_all" ON crm.campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_all" ON crm.campaign_members;
CREATE POLICY "service_all" ON crm.campaign_members FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_all" ON crm.campaign_activities;
CREATE POLICY "service_all" ON crm.campaign_activities FOR ALL TO service_role USING (true) WITH CHECK (true);

-- CAMPAIGNS: Owner access
DROP POLICY IF EXISTS "campaigns_owner_read" ON crm.campaigns;
CREATE POLICY "campaigns_owner_read" ON crm.campaigns
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "campaigns_owner_write" ON crm.campaigns;
CREATE POLICY "campaigns_owner_write" ON crm.campaigns
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() AND tenant_id IS NULL);

-- CAMPAIGNS: Tenant access
DROP POLICY IF EXISTS "campaigns_tenant_read" ON crm.campaigns;
CREATE POLICY "campaigns_tenant_read" ON crm.campaigns
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NOT NULL
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

DROP POLICY IF EXISTS "campaigns_tenant_write" ON crm.campaigns;
CREATE POLICY "campaigns_tenant_write" ON crm.campaigns
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND owner_id IS NULL);

-- CAMPAIGN MEMBERS: Access via campaign
DROP POLICY IF EXISTS "members_read" ON crm.campaign_members;
CREATE POLICY "members_read" ON crm.campaign_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm.campaigns c
      WHERE c.id = campaign_id
        AND (c.owner_id = auth.uid() OR c.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    )
  );

DROP POLICY IF EXISTS "members_write" ON crm.campaign_members;
CREATE POLICY "members_write" ON crm.campaign_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm.campaigns c
      WHERE c.id = campaign_id
        AND (c.owner_id = auth.uid() OR c.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm.campaigns c
      WHERE c.id = campaign_id
        AND (c.owner_id = auth.uid() OR c.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    )
  );

-- CAMPAIGN ACTIVITIES: Access via campaign
DROP POLICY IF EXISTS "activities_read" ON crm.campaign_activities;
CREATE POLICY "activities_read" ON crm.campaign_activities
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm.campaigns c
      WHERE c.id = campaign_id
        AND (c.owner_id = auth.uid() OR c.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    )
  );

DROP POLICY IF EXISTS "activities_write" ON crm.campaign_activities;
CREATE POLICY "activities_write" ON crm.campaign_activities
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm.campaigns c
      WHERE c.id = campaign_id
        AND (c.owner_id = auth.uid() OR c.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm.campaigns c
      WHERE c.id = campaign_id
        AND (c.owner_id = auth.uid() OR c.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    )
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get campaign stats
CREATE OR REPLACE FUNCTION crm.get_campaign_stats(p_campaign_id UUID)
RETURNS TABLE (
  total_members BIGINT,
  pending BIGINT,
  contacted BIGINT,
  responded BIGINT,
  interested BIGINT,
  converted BIGINT,
  not_interested BIGINT,
  opted_out BIGINT,
  bounced BIGINT,
  response_rate NUMERIC,
  conversion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total BIGINT;
  v_contacted BIGINT;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'contacted'),
    COUNT(*) FILTER (WHERE status = 'responded'),
    COUNT(*) FILTER (WHERE status = 'interested'),
    COUNT(*) FILTER (WHERE status = 'converted'),
    COUNT(*) FILTER (WHERE status = 'not_interested'),
    COUNT(*) FILTER (WHERE status = 'opted_out'),
    COUNT(*) FILTER (WHERE status = 'bounced')
  INTO
    total_members,
    pending,
    contacted,
    responded,
    interested,
    converted,
    not_interested,
    opted_out,
    bounced
  FROM crm.campaign_members
  WHERE campaign_id = p_campaign_id;

  -- Calculate rates
  v_contacted := contacted + responded + interested + converted + not_interested;

  IF v_contacted > 0 THEN
    response_rate := ROUND((responded + interested + converted + not_interested)::NUMERIC / v_contacted * 100, 1);
  ELSE
    response_rate := 0;
  END IF;

  IF total_members > 0 THEN
    conversion_rate := ROUND(converted::NUMERIC / total_members * 100, 1);
  ELSE
    conversion_rate := 0;
  END IF;

  RETURN NEXT;
END;
$$;

-- Convert campaign member to opportunity
CREATE OR REPLACE FUNCTION crm.convert_member_to_opportunity(
  p_member_id UUID,
  p_opportunity_name TEXT,
  p_expected_value DECIMAL(12,2) DEFAULT NULL,
  p_stage_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member crm.campaign_members;
  v_campaign crm.campaigns;
  v_opportunity_id UUID;
BEGIN
  -- Get member
  SELECT * INTO v_member FROM crm.campaign_members WHERE id = p_member_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign member not found';
  END IF;

  -- Get campaign for scoping
  SELECT * INTO v_campaign FROM crm.campaigns WHERE id = v_member.campaign_id;

  -- Create opportunity with same scoping
  INSERT INTO crm.opportunities (
    owner_id,
    tenant_id,
    entity_id,
    gft_contact_id,
    name,
    expected_value,
    stage_id,
    source,
    description
  ) VALUES (
    v_campaign.owner_id,
    v_campaign.tenant_id,
    v_member.entity_id,
    v_member.gft_contact_id,
    p_opportunity_name,
    p_expected_value,
    p_stage_id,
    'outbound',
    'Converted from campaign: ' || v_campaign.name
  )
  RETURNING id INTO v_opportunity_id;

  -- Update member status
  UPDATE crm.campaign_members
  SET
    status = 'converted',
    converted_at = NOW(),
    converted_to_opportunity_id = v_opportunity_id
  WHERE id = p_member_id;

  RETURN v_opportunity_id;
END;
$$;

-- Get members needing outreach (pending or need follow-up)
CREATE OR REPLACE FUNCTION crm.get_members_to_contact(
  p_campaign_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS SETOF crm.campaign_members
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT m.*
  FROM crm.campaign_members m
  WHERE m.campaign_id = p_campaign_id
    AND m.status IN ('pending', 'contacted')  -- Not yet responded
  ORDER BY
    CASE WHEN m.status = 'pending' THEN 0 ELSE 1 END,  -- Pending first
    m.last_contacted_at NULLS FIRST,  -- Never contacted first
    m.added_at ASC  -- Then by add order
  LIMIT p_limit;
END;
$$;

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON crm.campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON crm.campaign_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON crm.campaign_activities TO authenticated;

GRANT EXECUTE ON FUNCTION crm.get_campaign_stats TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION crm.convert_member_to_opportunity TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION crm.get_members_to_contact TO authenticated, service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE crm.campaigns IS 'Outbound campaign containers for organized lead outreach';
COMMENT ON TABLE crm.campaign_members IS 'Contacts enrolled in campaigns with status tracking';
COMMENT ON TABLE crm.campaign_activities IS 'Log of outreach activities performed on campaign members';

COMMENT ON FUNCTION crm.get_campaign_stats IS 'Get aggregated stats for a campaign (counts, rates)';
COMMENT ON FUNCTION crm.convert_member_to_opportunity IS 'Convert a responding campaign member to an opportunity';
COMMENT ON FUNCTION crm.get_members_to_contact IS 'Get members needing outreach, prioritized';
