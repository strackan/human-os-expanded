-- Sculptor Rollback - Remove tables from wrong database
-- Run on: https://supabase.com/dashboard/project/zulowgscotdrqlccomht/sql

DROP TRIGGER IF EXISTS sculptor_session_accessed ON sculptor_sessions;
DROP FUNCTION IF EXISTS update_sculptor_session_accessed();
DROP FUNCTION IF EXISTS generate_sculptor_access_code();

DROP POLICY IF EXISTS "sculptor_responses_public_insert" ON sculptor_responses;
DROP POLICY IF EXISTS "sculptor_responses_public_read" ON sculptor_responses;
DROP POLICY IF EXISTS "sculptor_sessions_public_update" ON sculptor_sessions;
DROP POLICY IF EXISTS "sculptor_sessions_public_insert" ON sculptor_sessions;
DROP POLICY IF EXISTS "sculptor_sessions_public_read" ON sculptor_sessions;
DROP POLICY IF EXISTS "sculptor_templates_public_read" ON sculptor_templates;

DROP TABLE IF EXISTS sculptor_responses CASCADE;
DROP TABLE IF EXISTS sculptor_sessions CASCADE;
DROP TABLE IF EXISTS sculptor_templates CASCADE;
