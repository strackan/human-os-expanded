-- Add user_id to sculptor_sessions for direct user linking
-- This provides a cleaner join path than entity_slug matching

ALTER TABLE sculptor_sessions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_sculptor_sessions_user_id
ON sculptor_sessions(user_id);

COMMENT ON COLUMN sculptor_sessions.user_id IS
  'Direct link to human_os users table. Preferred over entity_slug for user lookups.';
