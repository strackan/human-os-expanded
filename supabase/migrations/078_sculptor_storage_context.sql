-- Sculptor Storage Context Migration
-- Enables file-based context composition from Supabase Storage

-- ============================================================================
-- SCHEMA UPDATES
-- ============================================================================

-- Add entity_slug to sculptor_sessions for storage-based context lookup
-- When set, the service will read context files from storage instead of scene_prompt
ALTER TABLE sculptor_sessions
ADD COLUMN IF NOT EXISTS entity_slug TEXT;

-- Index for entity_slug lookups
CREATE INDEX IF NOT EXISTS idx_sculptor_sessions_entity_slug
ON sculptor_sessions(entity_slug);

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

-- Create the contexts bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contexts',
  'contexts',
  true,  -- Public read for context files
  5242880,  -- 5MB limit per file
  ARRAY['text/plain', 'text/markdown', 'application/json']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Public read access for context files
DROP POLICY IF EXISTS "contexts_public_read" ON storage.objects;
CREATE POLICY "contexts_public_read" ON storage.objects
FOR SELECT
USING (bucket_id = 'contexts');

-- Service role write access for context files
DROP POLICY IF EXISTS "contexts_admin_write" ON storage.objects;
CREATE POLICY "contexts_admin_write" ON storage.objects
FOR ALL
USING (
  bucket_id = 'contexts'
  AND auth.role() = 'service_role'
);

-- ============================================================================
-- HELPER FUNCTION: Get context file URL
-- ============================================================================

CREATE OR REPLACE FUNCTION get_context_file_url(
  p_entity_slug TEXT,
  p_filename TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN format(
    '%s/storage/v1/object/public/contexts/%s/%s',
    current_setting('app.settings.supabase_url', true),
    p_entity_slug,
    p_filename
  );
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: Compose context from storage
-- ============================================================================

CREATE OR REPLACE FUNCTION get_entity_context_urls(p_entity_slug TEXT)
RETURNS TABLE (
  file_type TEXT,
  file_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_url TEXT;
BEGIN
  -- Get Supabase URL from settings or use default
  v_base_url := coalesce(
    current_setting('app.settings.supabase_url', true),
    'https://your-project.supabase.co'
  );

  RETURN QUERY
  SELECT
    f.file_type,
    format('%s/storage/v1/object/public/contexts/%s/%s', v_base_url, p_entity_slug, f.filename) as file_url
  FROM (VALUES
    ('ground_rules', '_shared/NPC_GROUND_RULES.md'),
    ('character', p_entity_slug || '/CHARACTER.md'),
    ('corpus', p_entity_slug || '/CORPUS_SUMMARY.md'),
    ('gaps', p_entity_slug || '/GAP_ANALYSIS.md')
  ) AS f(file_type, filename);
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN sculptor_sessions.entity_slug IS
  'Entity slug for storage-based context lookup. When set, reads from storage://contexts/{entity_slug}/ instead of scene_prompt column.';
