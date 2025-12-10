-- Human OS Migration: Interactions
-- Temporal event log for check-ins, meetings, notes, engagements

-- =============================================================================
-- INTERACTIONS TABLE
-- Records of interactions with entities over time
-- =============================================================================
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Entity being interacted with (optional - some interactions are self-reflections)
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,

  -- Layer scoping
  layer TEXT NOT NULL,

  -- Interaction classification
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'meeting',        -- Scheduled meeting
    'email',          -- Email sent/received
    'call',           -- Phone/video call
    'message',        -- Chat/DM message
    'comment',        -- Comment on content
    'check_in',       -- Human OS check-in (mood, status, etc.)
    'workflow_step',  -- Step in a Renubu workflow
    'note',           -- Manual note/observation
    'engagement'      -- Social media engagement (like, share, etc.)
  )),

  -- Content
  title TEXT,
  content TEXT,

  -- Sentiment analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'concerned', 'urgent')),

  -- Flexible metadata
  metadata JSONB DEFAULT '{}',

  -- Temporal
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER,

  -- Ownership
  owner_id UUID,                       -- User who created this interaction

  -- Source tracking
  source_system TEXT,                  -- 'renubu', 'founder_os', 'guyforthat', etc.
  source_id TEXT,                      -- Original ID in source system

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_interactions_entity ON interactions(entity_id);
CREATE INDEX idx_interactions_layer ON interactions(layer);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);
CREATE INDEX idx_interactions_owner ON interactions(owner_id);
CREATE INDEX idx_interactions_occurred ON interactions(occurred_at DESC);
CREATE INDEX idx_interactions_source ON interactions(source_system, source_id);

-- GIN index for metadata queries
CREATE INDEX idx_interactions_metadata ON interactions USING GIN (metadata);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get recent interactions for an entity
CREATE OR REPLACE FUNCTION get_recent_interactions(
  p_entity_id UUID,
  p_layers TEXT[] DEFAULT ARRAY['public'],
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  interaction_type TEXT,
  title TEXT,
  content TEXT,
  sentiment TEXT,
  occurred_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.interaction_type,
    i.title,
    i.content,
    i.sentiment,
    i.occurred_at
  FROM interactions i
  WHERE i.entity_id = p_entity_id
    AND i.layer = ANY(p_layers)
  ORDER BY i.occurred_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE interactions IS 'Temporal event log for check-ins, meetings, notes, engagements';
COMMENT ON COLUMN interactions.interaction_type IS 'Type: meeting, email, call, check_in, note, engagement, etc.';
COMMENT ON COLUMN interactions.sentiment IS 'Sentiment: positive, neutral, concerned, urgent';
COMMENT ON COLUMN interactions.occurred_at IS 'When the interaction occurred (not when it was recorded)';
