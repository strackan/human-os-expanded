-- ============================================
-- Context Sharing (#14)
-- Bidirectional topic-scoped context sharing.
-- Justin and Scott opt in to share specific context topics.
-- ============================================

-- =============================================================================
-- CONTEXT SHARES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS human_os.context_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,           -- who is sharing
  grantee_id UUID NOT NULL,         -- who sees it
  context_slug TEXT NOT NULL,        -- topic being shared (e.g., 'sales-leadership')
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked')),
  invited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(owner_id, grantee_id, context_slug)
);

CREATE INDEX IF NOT EXISTS idx_context_shares_owner ON human_os.context_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_context_shares_grantee ON human_os.context_shares(grantee_id);
CREATE INDEX IF NOT EXISTS idx_context_shares_status ON human_os.context_shares(status);
CREATE INDEX IF NOT EXISTS idx_context_shares_slug ON human_os.context_shares(context_slug);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_context_shares_updated_at ON human_os.context_shares;
CREATE TRIGGER update_context_shares_updated_at
  BEFORE UPDATE ON human_os.context_shares
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE human_os.context_shares ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
DROP POLICY IF EXISTS service_all ON human_os.context_shares;
CREATE POLICY service_all ON human_os.context_shares FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- HELPER: get_active_shares_for_user
-- Returns all accepted shares where user is grantee
-- =============================================================================

CREATE OR REPLACE FUNCTION human_os.get_active_shares_for_user(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  owner_id UUID,
  owner_slug TEXT,
  context_slug TEXT,
  accepted_at TIMESTAMPTZ
) LANGUAGE sql STABLE AS $$
  SELECT
    cs.id,
    cs.owner_id,
    u.slug AS owner_slug,
    cs.context_slug,
    cs.accepted_at
  FROM human_os.context_shares cs
  LEFT JOIN human_os.users u ON u.id = cs.owner_id
  WHERE cs.grantee_id = p_user_id
    AND cs.status = 'accepted';
$$;

-- =============================================================================
-- SEED: Demo shares (Justin ↔ Scott on 'sales-leadership')
-- These will only work if Justin and Scott users exist in human_os.users.
-- Skip gracefully if not.
-- =============================================================================

DO $$
DECLARE
  v_justin_id UUID;
  v_scott_id UUID;
BEGIN
  SELECT id INTO v_justin_id FROM human_os.users WHERE slug = 'justin' LIMIT 1;
  SELECT id INTO v_scott_id FROM human_os.users WHERE slug = 'scott' LIMIT 1;

  IF v_justin_id IS NOT NULL AND v_scott_id IS NOT NULL THEN
    -- Justin shares with Scott
    INSERT INTO human_os.context_shares (owner_id, grantee_id, context_slug, status, accepted_at)
    VALUES (v_justin_id, v_scott_id, 'sales-leadership', 'accepted', NOW())
    ON CONFLICT (owner_id, grantee_id, context_slug) DO NOTHING;

    -- Scott shares with Justin
    INSERT INTO human_os.context_shares (owner_id, grantee_id, context_slug, status, accepted_at)
    VALUES (v_scott_id, v_justin_id, 'sales-leadership', 'accepted', NOW())
    ON CONFLICT (owner_id, grantee_id, context_slug) DO NOTHING;
  END IF;
END $$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE human_os.context_shares IS 'Topic-scoped context sharing between users';
COMMENT ON FUNCTION human_os.get_active_shares_for_user IS 'Get accepted shares where user is grantee';

NOTIFY pgrst, 'reload config';
