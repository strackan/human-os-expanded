-- ============================================
-- RELATIONSHIP CONTEXT LOG
-- Convert relationship_context from one-per-type to temporal log
-- Allows multiple context entries per relationship over time
-- ============================================

-- Drop the unique constraint that limited to one opinion per type
ALTER TABLE relationship_context
DROP CONSTRAINT IF EXISTS relationship_context_owner_id_contact_entity_id_opinion_type_key;

-- Add transcript_id for linking context back to source transcripts
ALTER TABLE relationship_context
ADD COLUMN IF NOT EXISTS transcript_id UUID;

-- Add index for transcript lookups
CREATE INDEX IF NOT EXISTS idx_relationship_context_transcript
ON relationship_context(transcript_id) WHERE transcript_id IS NOT NULL;

-- Add index for date-range queries (created_at already exists, but let's ensure it's indexed well)
CREATE INDEX IF NOT EXISTS idx_relationship_context_created_at
ON relationship_context(created_at DESC);

-- Composite index for efficient date-range queries per contact
CREATE INDEX IF NOT EXISTS idx_relationship_context_contact_date
ON relationship_context(contact_entity_id, created_at DESC);

-- ============================================
-- TRANSCRIPTS TABLE (founder_os schema)
-- Metadata for raw transcripts stored in storage
-- ============================================
CREATE TABLE IF NOT EXISTS founder_os.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- When the transcript was recorded
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Storage location: {founder-slug}/transcripts/{date}/{id}.json
  storage_path TEXT NOT NULL,

  -- Source of the transcript
  source TEXT NOT NULL CHECK (source IN (
    'brain_dump',      -- Tutorial brain dump
    'voice_note',      -- Quick voice capture
    'meeting',         -- Meeting recording
    'call',            -- Phone/video call
    'dictation',       -- General dictation
    'dream'            -- End-of-day dream() processing
  )),

  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',         -- Not yet processed
    'processing',      -- Currently being processed
    'completed',       -- Fully processed, entities extracted
    'failed'           -- Processing failed
  )),

  -- Optional metadata
  duration_seconds INTEGER,
  word_count INTEGER,
  session_id TEXT,     -- Link to tutorial/app session if applicable

  -- Timestamps
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for transcripts
CREATE INDEX IF NOT EXISTS idx_fos_transcripts_user_id ON founder_os.transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_fos_transcripts_recorded_at ON founder_os.transcripts(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_fos_transcripts_source ON founder_os.transcripts(source);
CREATE INDEX IF NOT EXISTS idx_fos_transcripts_status ON founder_os.transcripts(status);

-- Updated at trigger
CREATE TRIGGER update_fos_transcripts_updated_at
  BEFORE UPDATE ON founder_os.transcripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FOUNDER_OS RELATIONSHIP CONTEXTS
-- Context log specifically for founder_os.relationships
-- (separate from public.relationship_context which uses entities)
-- ============================================
CREATE TABLE IF NOT EXISTS founder_os.relationship_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the relationship
  relationship_id UUID NOT NULL REFERENCES founder_os.relationships(id) ON DELETE CASCADE,

  -- Context details
  context_type TEXT NOT NULL DEFAULT 'general' CHECK (context_type IN (
    'general',           -- General context/note
    'interaction',       -- Record of an interaction
    'observation',       -- Observation about the person
    'commitment',        -- Commitment made to/by them
    'preference',        -- Their preferences
    'history'            -- Historical context
  )),
  context_details TEXT NOT NULL,

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN (
    'brain_dump',
    'voice_note',
    'meeting',
    'dream',
    'manual',
    'import'
  )),
  transcript_id UUID REFERENCES founder_os.transcripts(id) ON DELETE SET NULL,

  -- Timestamps
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- When this was observed (may differ from created_at)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_fos_rel_contexts_relationship
ON founder_os.relationship_contexts(relationship_id);

CREATE INDEX IF NOT EXISTS idx_fos_rel_contexts_observed_at
ON founder_os.relationship_contexts(observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_fos_rel_contexts_rel_date
ON founder_os.relationship_contexts(relationship_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_fos_rel_contexts_transcript
ON founder_os.relationship_contexts(transcript_id) WHERE transcript_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fos_rel_contexts_source
ON founder_os.relationship_contexts(source);

-- Full-text search on context details
ALTER TABLE founder_os.relationship_contexts
ADD COLUMN IF NOT EXISTS context_tsv TSVECTOR
GENERATED ALWAYS AS (to_tsvector('english', context_details)) STORED;

CREATE INDEX IF NOT EXISTS idx_fos_rel_contexts_search
ON founder_os.relationship_contexts USING GIN(context_tsv);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get context for a relationship within a date range
CREATE OR REPLACE FUNCTION founder_os.get_relationship_context(
  p_relationship_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  context_type TEXT,
  context_details TEXT,
  source TEXT,
  transcript_id UUID,
  observed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.context_type,
    rc.context_details,
    rc.source,
    rc.transcript_id,
    rc.observed_at
  FROM founder_os.relationship_contexts rc
  WHERE rc.relationship_id = p_relationship_id
    AND (p_start_date IS NULL OR rc.observed_at >= p_start_date)
    AND (p_end_date IS NULL OR rc.observed_at <= p_end_date)
  ORDER BY rc.observed_at DESC
  LIMIT p_limit;
END;
$$;

-- Add context to a relationship
CREATE OR REPLACE FUNCTION founder_os.add_relationship_context(
  p_relationship_id UUID,
  p_context_details TEXT,
  p_context_type TEXT DEFAULT 'general',
  p_source TEXT DEFAULT 'manual',
  p_transcript_id UUID DEFAULT NULL,
  p_observed_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO founder_os.relationship_contexts (
    relationship_id, context_type, context_details, source, transcript_id, observed_at
  ) VALUES (
    p_relationship_id, p_context_type, p_context_details, p_source, p_transcript_id, p_observed_at
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE founder_os.transcripts IS 'Metadata for raw transcripts stored in storage';
COMMENT ON TABLE founder_os.relationship_contexts IS 'Temporal log of context per relationship';
COMMENT ON FUNCTION founder_os.get_relationship_context IS 'Get context entries for a relationship, optionally filtered by date range';
COMMENT ON FUNCTION founder_os.add_relationship_context IS 'Add a new context entry for a relationship';
