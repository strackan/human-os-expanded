-- 053_context_status.sql
-- Add status field to contexts table for lifecycle management

-- =============================================================================
-- ADD STATUS COLUMN
-- =============================================================================

ALTER TABLE founder_os.contexts
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'inactive', 'archived'));

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_founder_os_contexts_status
  ON founder_os.contexts(status);

-- =============================================================================
-- ADD ARCHIVED_AT COLUMN
-- =============================================================================

ALTER TABLE founder_os.contexts
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- =============================================================================
-- HELPER FUNCTION: List active contexts
-- =============================================================================

CREATE OR REPLACE FUNCTION founder_os.list_active_contexts(
  p_user_id UUID
) RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  color TEXT,
  icon TEXT
) LANGUAGE sql STABLE AS $$
  SELECT id, name, description, color, icon
  FROM founder_os.contexts
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY name;
$$;

-- =============================================================================
-- HELPER FUNCTION: Archive a context
-- =============================================================================

CREATE OR REPLACE FUNCTION founder_os.archive_context(
  p_context_id UUID
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE founder_os.contexts
  SET status = 'archived',
      archived_at = NOW(),
      updated_at = NOW()
  WHERE id = p_context_id;
END;
$$;

-- =============================================================================
-- HELPER FUNCTION: Get context usage stats
-- Shows how many tasks use each context
-- =============================================================================

CREATE OR REPLACE FUNCTION founder_os.get_context_usage(
  p_user_id UUID
) RETURNS TABLE (
  context_name TEXT,
  context_status TEXT,
  active_tasks BIGINT,
  total_tasks BIGINT
) LANGUAGE sql STABLE AS $$
  WITH context_counts AS (
    SELECT
      unnest(context_tags) as tag,
      COUNT(*) FILTER (WHERE status NOT IN ('done', 'archived')) as active_count,
      COUNT(*) as total_count
    FROM founder_os.tasks
    WHERE user_id = p_user_id
    GROUP BY unnest(context_tags)
  )
  SELECT
    COALESCE(c.name, cc.tag) as context_name,
    COALESCE(c.status, 'undefined') as context_status,
    COALESCE(cc.active_count, 0) as active_tasks,
    COALESCE(cc.total_count, 0) as total_tasks
  FROM context_counts cc
  FULL OUTER JOIN founder_os.contexts c
    ON c.name = cc.tag AND c.user_id = p_user_id
  ORDER BY cc.active_count DESC NULLS LAST;
$$;

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT EXECUTE ON FUNCTION founder_os.list_active_contexts TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION founder_os.archive_context TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION founder_os.get_context_usage TO authenticated, service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN founder_os.contexts.status IS
  'Lifecycle status: active (in use), inactive (paused), archived (historical)';

COMMENT ON FUNCTION founder_os.get_context_usage IS
  'Shows context usage stats - helps identify stale contexts to archive';
