-- Migration: 034_community_intel
-- Description: Add community sharing columns to relationship_context and create intel_requests table
-- Date: 2024-12-19

-- =============================================================================
-- PART 1: Extend relationship_context for community sharing
-- =============================================================================

-- Add community columns to relationship_context
ALTER TABLE relationship_context
ADD COLUMN IF NOT EXISTS community_content TEXT,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private',
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_anonymously BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sanitized_by TEXT;

-- Add check constraints (separate statements for IF NOT EXISTS behavior)
DO $$ BEGIN
ALTER TABLE relationship_context ADD CONSTRAINT relationship_context_visibility_check
    CHECK (visibility IN ('private', 'community', 'public'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE relationship_context ADD CONSTRAINT relationship_context_sanitized_by_check
    CHECK (sanitized_by IS NULL OR sanitized_by IN ('ai', 'manual'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Index for community queries (only non-private)
CREATE INDEX IF NOT EXISTS idx_relationship_context_visibility
  ON relationship_context(visibility)
  WHERE visibility != 'private';

-- Index for published content queries
CREATE INDEX IF NOT EXISTS idx_relationship_context_published
  ON relationship_context(published_at DESC)
  WHERE published_at IS NOT NULL;

-- Full-text search index on community content
CREATE INDEX IF NOT EXISTS idx_relationship_context_community_fts
  ON relationship_context USING GIN(to_tsvector('english', COALESCE(community_content, '')));

COMMENT ON COLUMN relationship_context.community_content IS 'Sanitized version of content for community visibility';
COMMENT ON COLUMN relationship_context.visibility IS 'Access level: private (owner only), community (Founder OS network), public (all)';
COMMENT ON COLUMN relationship_context.published_at IS 'When the note was published to community/public';
COMMENT ON COLUMN relationship_context.published_anonymously IS 'If true, author is hidden in community queries';
COMMENT ON COLUMN relationship_context.sanitized_by IS 'How the community_content was generated: ai or manual';

-- =============================================================================
-- PART 2: Create intel_requests table for social intel requests
-- =============================================================================

CREATE TABLE IF NOT EXISTS intel_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who is asking
  requester_id UUID NOT NULL,
  requester_name TEXT,

  -- Who is being asked
  target_user_id UUID NOT NULL,

  -- About whom
  contact_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  contact_name TEXT,  -- Denormalized for display

  -- Request context
  context TEXT,  -- Why they need this intel: "Prepping for sales call", "Due diligence", etc.
  urgency TEXT DEFAULT 'normal',

  -- State
  status TEXT DEFAULT 'pending',
  fulfilled_note_id UUID REFERENCES relationship_context(id),
  decline_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Add check constraints
DO $$ BEGIN
ALTER TABLE intel_requests ADD CONSTRAINT intel_requests_urgency_check
    CHECK (urgency IN ('low', 'normal', 'high'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE intel_requests ADD CONSTRAINT intel_requests_status_check
    CHECK (status IN ('pending', 'fulfilled', 'declined', 'expired'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_intel_requests_target
  ON intel_requests(target_user_id, status);

CREATE INDEX IF NOT EXISTS idx_intel_requests_requester
  ON intel_requests(requester_id);

CREATE INDEX IF NOT EXISTS idx_intel_requests_contact
  ON intel_requests(contact_entity_id);

CREATE INDEX IF NOT EXISTS idx_intel_requests_pending
  ON intel_requests(target_user_id, created_at DESC)
  WHERE status = 'pending';

-- Enable RLS
ALTER TABLE intel_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "intel_requests_service_all" ON intel_requests;
CREATE POLICY "intel_requests_service_all" ON intel_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Target user can see requests sent to them
DROP POLICY IF EXISTS "intel_requests_target_select" ON intel_requests;
CREATE POLICY "intel_requests_target_select" ON intel_requests
  FOR SELECT USING (target_user_id = auth.uid());

-- Requester can see their own requests
DROP POLICY IF EXISTS "intel_requests_requester_select" ON intel_requests;
CREATE POLICY "intel_requests_requester_select" ON intel_requests
  FOR SELECT USING (requester_id = auth.uid());

-- Requester can insert new requests
DROP POLICY IF EXISTS "intel_requests_requester_insert" ON intel_requests;
CREATE POLICY "intel_requests_requester_insert" ON intel_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

-- Target can update (fulfill/decline) requests sent to them
DROP POLICY IF EXISTS "intel_requests_target_update" ON intel_requests;
CREATE POLICY "intel_requests_target_update" ON intel_requests
  FOR UPDATE USING (target_user_id = auth.uid());

COMMENT ON TABLE intel_requests IS 'Requests for intel about contacts between Founder OS users';
COMMENT ON COLUMN intel_requests.context IS 'Why the requester needs this intel (e.g., "Prepping for sales call")';
COMMENT ON COLUMN intel_requests.fulfilled_note_id IS 'Link to the relationship_context note created to fulfill this request';

-- =============================================================================
-- PART 3: Add relationship_ids to transcripts
-- =============================================================================

-- Add relationship_ids array to founder_os.transcripts
ALTER TABLE founder_os.transcripts
ADD COLUMN IF NOT EXISTS relationship_ids UUID[];

-- Add relationship_ids array to renubu.transcripts
ALTER TABLE renubu.transcripts
ADD COLUMN IF NOT EXISTS relationship_ids UUID[];

CREATE INDEX IF NOT EXISTS idx_founder_transcripts_relationships
  ON founder_os.transcripts USING GIN(relationship_ids);

CREATE INDEX IF NOT EXISTS idx_renubu_transcripts_relationships
  ON renubu.transcripts USING GIN(relationship_ids);

COMMENT ON COLUMN founder_os.transcripts.relationship_ids IS 'Links to relationship_context entries discussed in this transcript';
COMMENT ON COLUMN renubu.transcripts.relationship_ids IS 'Links to relationship_context entries discussed in this transcript';

-- =============================================================================
-- PART 4: Community search function
-- =============================================================================

CREATE OR REPLACE FUNCTION search_community_intel(
  p_query TEXT DEFAULT NULL,
  p_contact_entity_id UUID DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL,
  p_opinion_type TEXT DEFAULT NULL,
  p_include_anonymous BOOLEAN DEFAULT TRUE,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  contact_entity_id UUID,
  contact_name TEXT,
  opinion_type TEXT,
  community_content TEXT,
  sentiment TEXT,
  author_id UUID,
  author_name TEXT,
  published_at TIMESTAMPTZ,
  is_anonymous BOOLEAN,
  relevance_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.contact_entity_id,
    e.name AS contact_name,
    rc.opinion_type,
    rc.community_content,
    rc.sentiment,
    CASE WHEN rc.published_anonymously THEN NULL ELSE rc.owner_id END AS author_id,
    CASE WHEN rc.published_anonymously THEN NULL ELSE u.full_name END AS author_name,
    rc.published_at,
    rc.published_anonymously AS is_anonymous,
    CASE
      WHEN p_query IS NOT NULL THEN
        ts_rank(to_tsvector('english', COALESCE(rc.community_content, '')), plainto_tsquery('english', p_query))
      ELSE 1.0
    END AS relevance_score
  FROM relationship_context rc
  LEFT JOIN entities e ON rc.contact_entity_id = e.id
  LEFT JOIN human_os.users u ON rc.owner_id = u.id
  WHERE
    rc.visibility IN ('community', 'public')
    AND rc.community_content IS NOT NULL
    AND (p_include_anonymous OR NOT rc.published_anonymously)
    AND (p_contact_entity_id IS NULL OR rc.contact_entity_id = p_contact_entity_id)
    AND (p_opinion_type IS NULL OR rc.opinion_type = p_opinion_type)
    AND (p_company_name IS NULL OR e.metadata->>'company' ILIKE '%' || p_company_name || '%')
    AND (
      p_query IS NULL
      OR to_tsvector('english', COALESCE(rc.community_content, '')) @@ plainto_tsquery('english', p_query)
    )
  ORDER BY
    CASE WHEN p_query IS NOT NULL THEN relevance_score ELSE 0 END DESC,
    rc.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION search_community_intel IS 'Search published community intel across the Founder OS network';

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION search_community_intel TO service_role;
