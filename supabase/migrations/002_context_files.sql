-- Human OS Migration: Context Files
-- Tracks markdown files stored in Supabase Storage

-- =============================================================================
-- CONTEXT FILES TABLE
-- Registry of markdown context files with layer-based privacy
-- =============================================================================
CREATE TABLE IF NOT EXISTS context_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entity linkage
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,

  -- Layer encodes privacy (the path IS the permission)
  layer TEXT NOT NULL,                 -- 'public', 'powerpak-published', 'renubu:tenant-xyz', 'founder:justin'
  file_path TEXT NOT NULL,             -- Full path including layer prefix (e.g., 'founder-os/justin/goals/q1.md')

  -- Storage location
  storage_bucket TEXT NOT NULL DEFAULT 'contexts',

  -- Change detection
  content_hash TEXT,                   -- SHA-256 hash for detecting changes

  -- Sync tracking
  last_synced_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one file per layer/path combo
  UNIQUE(layer, file_path)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_context_files_layer ON context_files(layer);
CREATE INDEX IF NOT EXISTS idx_context_files_entity ON context_files(entity_id);
CREATE INDEX IF NOT EXISTS idx_context_files_path ON context_files(file_path);

-- =============================================================================
-- FULL-TEXT SEARCH SUPPORT
-- =============================================================================

-- Note: To enable full-text search on file content, you would typically:
-- 1. Store content in the table (denormalized) or
-- 2. Use a separate search index (Supabase's built-in or external)
--
-- For now, we'll add a placeholder column that can be populated by a trigger
-- or background job that reads from storage.

ALTER TABLE context_files ADD COLUMN IF NOT EXISTS content_tsv TSVECTOR;

CREATE INDEX IF NOT EXISTS idx_context_files_search ON context_files USING GIN(content_tsv);

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE context_files IS 'Registry of markdown context files in Supabase Storage';
COMMENT ON COLUMN context_files.layer IS 'Privacy layer: public, powerpak-published, renubu:tenant-{id}, founder:{userId}';
COMMENT ON COLUMN context_files.file_path IS 'Full storage path including layer prefix';
COMMENT ON COLUMN context_files.content_hash IS 'SHA-256 hash for change detection';
