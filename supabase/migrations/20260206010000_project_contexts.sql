-- Project Contexts Table
-- Mirrors relationship_contexts pattern for tracking context about projects over time

-- ============================================
-- PROJECT CONTEXTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS founder_os.project_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the project
  project_id UUID NOT NULL REFERENCES founder_os.projects(id) ON DELETE CASCADE,

  -- Context details
  context_type TEXT NOT NULL DEFAULT 'general' CHECK (context_type IN (
    'general',           -- General context/note
    'update',            -- Project update/progress
    'blocker',           -- Blocker or issue
    'decision',          -- Decision made
    'milestone',         -- Milestone reached
    'idea'               -- Idea or brainstorm
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
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fos_proj_contexts_project
ON founder_os.project_contexts(project_id);

CREATE INDEX IF NOT EXISTS idx_fos_proj_contexts_observed_at
ON founder_os.project_contexts(observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_fos_proj_contexts_proj_date
ON founder_os.project_contexts(project_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_fos_proj_contexts_transcript
ON founder_os.project_contexts(transcript_id) WHERE transcript_id IS NOT NULL;

-- RLS
ALTER TABLE founder_os.project_contexts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON founder_os.project_contexts;
CREATE POLICY "Service role full access" ON founder_os.project_contexts FOR ALL USING (true);

COMMENT ON TABLE founder_os.project_contexts IS 'Context log for projects - tracks updates, blockers, decisions over time';
