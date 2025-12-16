-- Human OS Migration: Remove incorrect public.tasks table
-- Tasks belong in founder_os schema, not public
-- This corrects the architectural mistake from migration 012

-- =============================================================================
-- DROP FUNCTIONS (must drop before table due to dependencies)
-- =============================================================================
DROP FUNCTION IF EXISTS public.get_urgent_tasks(UUID, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_task_urgency(DATE) CASCADE;
DROP FUNCTION IF EXISTS public.update_task_urgency() CASCADE;
DROP FUNCTION IF EXISTS public.record_task_escalation(UUID, TEXT) CASCADE;

-- =============================================================================
-- DROP TABLE
-- =============================================================================
DROP TABLE IF EXISTS public.tasks CASCADE;

-- =============================================================================
-- COMMENT
-- =============================================================================
-- Note: Tasks now live in founder_os.tasks (created in migration 020)
-- The human-os-workflows server should be deprecated or updated to use founder_os.tasks
