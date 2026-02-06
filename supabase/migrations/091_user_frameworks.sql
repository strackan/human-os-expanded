/**
 * User Frameworks
 *
 * Storage for user-imported frameworks, methodologies, and key content.
 * Human OS will reference these when helping users.
 *
 * Key Features:
 * - Visibility controls (public, gated, private)
 * - Source attribution
 * - Full-text search indexing
 * - Chunking for large content (RAG-ready)
 */

-- Create enum for framework visibility
DO $$ BEGIN
  CREATE TYPE human_os.framework_visibility AS ENUM (
    'public',   -- Can quote and reference openly
    'gated',    -- Reference but don't quote without asking
    'private'   -- Never expose externally
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for framework type
DO $$ BEGIN
  CREATE TYPE human_os.framework_type AS ENUM (
    'methodology',   -- Business/work methodology
    'framework',     -- Conceptual framework
    'playbook',      -- Step-by-step guide
    'principles',    -- Core principles/values
    'template',      -- Reusable template
    'notes',         -- General notes/content
    'book_notes',    -- Notes from a book
    'other'          -- Other types
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-----------------------------------------------------------
-- Table: user_frameworks
-- Purpose: Store user-imported frameworks and content
-----------------------------------------------------------

CREATE TABLE IF NOT EXISTS human_os.user_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Framework Identity
  title TEXT NOT NULL,
  description TEXT,
  framework_type human_os.framework_type NOT NULL DEFAULT 'framework',

  -- Content
  content TEXT NOT NULL,                    -- Raw content (markdown supported)
  content_format TEXT DEFAULT 'markdown',   -- 'markdown', 'plaintext', 'html'
  word_count INTEGER,                       -- For display/sorting

  -- Visibility & Attribution
  visibility human_os.framework_visibility NOT NULL DEFAULT 'gated',
  source_title TEXT,                        -- Book title, course name, etc.
  source_url TEXT,                          -- URL if applicable
  source_author TEXT,                       -- Author/creator

  -- Organization
  tags TEXT[] DEFAULT '{}',                 -- User-defined tags
  category TEXT,                            -- User-defined category

  -- Processing Status
  is_indexed BOOLEAN DEFAULT false,         -- Has been indexed for search
  indexed_at TIMESTAMPTZ,
  chunk_count INTEGER DEFAULT 0,            -- Number of chunks created

  -- Usage Stats
  times_referenced INTEGER DEFAULT 0,       -- How often NPC references this
  last_referenced_at TIMESTAMPTZ,

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_frameworks_user
  ON human_os.user_frameworks(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_frameworks_type
  ON human_os.user_frameworks(framework_type)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_frameworks_visibility
  ON human_os.user_frameworks(visibility)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_frameworks_tags
  ON human_os.user_frameworks USING gin(tags)
  WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_user_frameworks_fts
  ON human_os.user_frameworks
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, '')))
  WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE human_os.user_frameworks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own frameworks
CREATE POLICY "Users see own frameworks"
  ON human_os.user_frameworks FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Users can insert their own frameworks
CREATE POLICY "Users can add frameworks"
  ON human_os.user_frameworks FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own frameworks
CREATE POLICY "Users can update own frameworks"
  ON human_os.user_frameworks FOR UPDATE
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Users can soft-delete their own frameworks
CREATE POLICY "Users can remove own frameworks"
  ON human_os.user_frameworks FOR DELETE
  USING (user_id = auth.uid());

-----------------------------------------------------------
-- Table: framework_chunks
-- Purpose: Chunked content for RAG retrieval
-----------------------------------------------------------

CREATE TABLE IF NOT EXISTS human_os.framework_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  framework_id UUID NOT NULL REFERENCES human_os.user_frameworks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Chunk Content
  chunk_index INTEGER NOT NULL,             -- Order within framework
  content TEXT NOT NULL,                    -- Chunk content
  token_count INTEGER,                      -- Token count for this chunk

  -- Embedding (if using vector search)
  embedding vector(1536),                   -- OpenAI embedding dimension

  -- Metadata
  heading TEXT,                             -- Section heading if applicable
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for chunk retrieval
CREATE INDEX IF NOT EXISTS idx_framework_chunks_framework
  ON human_os.framework_chunks(framework_id);

CREATE INDEX IF NOT EXISTS idx_framework_chunks_user
  ON human_os.framework_chunks(user_id);

-- Vector similarity index (if using pgvector)
-- Uncomment if pgvector is enabled:
-- CREATE INDEX IF NOT EXISTS idx_framework_chunks_embedding
--   ON human_os.framework_chunks
--   USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);

-- RLS for chunks
ALTER TABLE human_os.framework_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own framework chunks"
  ON human_os.framework_chunks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage framework chunks"
  ON human_os.framework_chunks FOR ALL
  USING (user_id = auth.uid());

-----------------------------------------------------------
-- Functions
-----------------------------------------------------------

-- Function to calculate word count
CREATE OR REPLACE FUNCTION human_os.calculate_word_count(content TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN array_length(regexp_split_to_array(trim(content), '\s+'), 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-calculate word count
CREATE OR REPLACE FUNCTION human_os.update_framework_word_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.word_count = human_os.calculate_word_count(NEW.content);
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_frameworks_word_count ON human_os.user_frameworks;
CREATE TRIGGER update_user_frameworks_word_count BEFORE INSERT OR UPDATE OF content ON human_os.user_frameworks
  FOR EACH ROW
  EXECUTE FUNCTION human_os.update_framework_word_count();

-- Function to search frameworks
CREATE OR REPLACE FUNCTION human_os.search_frameworks(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  framework_type human_os.framework_type,
  visibility human_os.framework_visibility,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.title,
    f.description,
    f.framework_type,
    f.visibility,
    ts_rank(
      to_tsvector('english', coalesce(f.title, '') || ' ' || coalesce(f.description, '') || ' ' || coalesce(f.content, '')),
      plainto_tsquery('english', p_query)
    ) AS relevance
  FROM human_os.user_frameworks f
  WHERE f.user_id = p_user_id
    AND f.deleted_at IS NULL
    AND to_tsvector('english', coalesce(f.title, '') || ' ' || coalesce(f.description, '') || ' ' || coalesce(f.content, ''))
        @@ plainto_tsquery('english', p_query)
  ORDER BY relevance DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment reference count
CREATE OR REPLACE FUNCTION human_os.record_framework_reference(p_framework_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE human_os.user_frameworks
  SET
    times_referenced = times_referenced + 1,
    last_referenced_at = NOW()
  WHERE id = p_framework_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-----------------------------------------------------------
-- Comments
-----------------------------------------------------------

COMMENT ON TABLE human_os.user_frameworks IS 'User-imported frameworks, methodologies, and key content for NPC reference';
COMMENT ON TABLE human_os.framework_chunks IS 'Chunked content from frameworks for RAG retrieval';
COMMENT ON COLUMN human_os.user_frameworks.visibility IS 'public=quote freely, gated=ask before quoting, private=never expose';
COMMENT ON FUNCTION human_os.search_frameworks IS 'Full-text search across user frameworks';
