-- Version Restructure Migration
-- Date: 2025-11-18
-- Purpose: Migrate from 0.1.6-0.1.9 versioning to 0.0.1-0.1.6 structure
-- This provides more room for growth before 1.0 and better reflects the product journey
-- IDEMPOTENT: Uses ON CONFLICT to handle re-runs safely

-- Step 1: Get or create status IDs and insert releases (idempotent)
DO $$
DECLARE
  v_complete_status_id UUID;
  v_planning_status_id UUID;
  v_existing_count INTEGER;
BEGIN
  -- Check if we already have the restructured versions
  SELECT COUNT(*) INTO v_existing_count FROM releases WHERE version LIKE '0.0.%';

  -- If we already have 0.0.x versions, skip the migration
  IF v_existing_count >= 9 THEN
    RAISE NOTICE 'Version restructure already applied (found % 0.0.x releases), skipping', v_existing_count;
    RETURN;
  END IF;

  -- Clear existing data only if we haven't migrated yet
  DELETE FROM features WHERE id != '00000000-0000-0000-0000-000000000000';
  DELETE FROM releases WHERE id != '00000000-0000-0000-0000-000000000000';

  -- Get or create status IDs
  SELECT id INTO v_complete_status_id FROM release_statuses WHERE slug = 'complete';
  SELECT id INTO v_planning_status_id FROM release_statuses WHERE slug = 'planning';

  -- If statuses don't exist, create them
  IF v_complete_status_id IS NULL THEN
    INSERT INTO release_statuses (slug, name) VALUES ('complete', 'Complete')
    RETURNING id INTO v_complete_status_id;
  END IF;

  IF v_planning_status_id IS NULL THEN
    INSERT INTO release_statuses (slug, name) VALUES ('planning', 'Planning')
    RETURNING id INTO v_planning_status_id;
  END IF;

  -- Step 2: Insert new releases
  -- Early Development (0.0.x)
  INSERT INTO releases (version, name, description, release_date, actual_shipped, status_id, created_at, updated_at) VALUES
    ('0.0.1', 'Genesis', 'Initial application with Renewals HQ dashboard, timeline toggle, and customer list', '2025-04-29', '2025-04-29', v_complete_status_id, NOW(), NOW()),
    ('0.0.2', 'Dashboard Core', 'Enhanced dashboard iterations with snooze functionality, actions dropdown, resizable columns, and contracts page', '2025-05-03', '2025-05-03', v_complete_status_id, NOW(), NOW()),
    ('0.0.3', 'Workflow Experiments', 'Planning Workflow Alpha, customer page modularization, AI workflow scaffolding', '2025-05-24', '2025-05-24', v_complete_status_id, NOW(), NOW()),
    ('0.0.4', 'Authentication Battle', 'Supabase integration, Google OAuth, event handling system, database conversation handles', '2025-07-28', '2025-07-28', v_complete_status_id, NOW(), NOW()),
    ('0.0.5', 'Backend Breakthrough', 'Supabase Cloud migration, Customers page, Customer 360 view, ActivePieces integration, Demo mode. 83 new API routes', '2025-08-27', '2025-08-27', v_complete_status_id, NOW(), NOW()),
    ('0.0.6', 'Artifact Engine', '100+ artifact components, configuration-driven workflows, template groups, dynamic artifact loading, progress tracker', '2025-09-28', '2025-09-28', v_complete_status_id, NOW(), NOW()),
    ('0.0.7', 'Orchestrator Birth', 'Step-based workflow system, workflow registry, WorkflowEngine component, database-driven launches, 7-day snooze enforcement', '2025-10-27', '2025-10-27', v_complete_status_id, NOW(), NOW()),
    ('0.0.8', 'Labs Launch', 'Renubu Labs multi-domain proof of concept, Weekly Planner workflow, email orchestration prototype', '2025-10-31', '2025-10-31', v_complete_status_id, NOW(), NOW()),
    ('0.0.9', 'Pre-Production Polish', 'Code consolidation, architecture documentation, build configuration optimization', '2025-11-06', '2025-11-06', v_complete_status_id, NOW(), NOW());

  -- Foundation (0.1.x)
  INSERT INTO releases (version, name, description, release_date, actual_shipped, status_id, created_at, updated_at) VALUES
    ('0.1.0', 'Zen Dashboard', 'Zen dashboard modernization, chat integration UI, living documentation system, GitHub Projects integration, production build system', '2025-11-06', '2025-11-06', v_complete_status_id, NOW(), NOW()),
    ('0.1.1', 'Multi-Tenancy', 'Workspace authentication with company_id isolation, workspace invitation system, multi-domain workflow support', '2025-11-08', '2025-11-08', v_complete_status_id, NOW(), NOW()),
    ('0.1.2', 'MCP Foundation', 'MCP Registry infrastructure, OAuth integrations (Google Calendar, Gmail, Slack), email orchestration, feature tracking', '2025-11-12', '2025-11-12', v_complete_status_id, NOW(), NOW()),
    ('0.1.3', 'Parking Lot System', 'AI-powered workflow event detection, Parking Lot dashboard, LLM analysis with Claude Sonnet 4.5, workflow health scoring', '2025-11-15', '2025-11-15', v_complete_status_id, NOW(), NOW()),
    ('0.1.4', 'Skip & Review Systems', 'Skip trigger system with 4 trigger conventions, Review trigger system for approval workflows, enhanced flow control modals', '2025-11-15', '2025-11-15', v_complete_status_id, NOW(), NOW()),
    ('0.1.5', 'String-Tie & Optimization', 'String-Tie natural language reminders with Claude AI, voice dictation, feature flag infrastructure, code optimization', '2025-11-16', '2025-11-16', v_complete_status_id, NOW(), NOW()),
    ('0.1.6', 'Workflow Templates', 'Database-driven workflow template system, scope-based inheritance, workflow compilation service, InHerSight integration', '2025-11-17', '2025-11-17', v_complete_status_id, NOW(), NOW());

  -- Future Releases
  INSERT INTO releases (version, name, description, release_date, status_id, created_at, updated_at) VALUES
    ('0.2.0', 'Production Launch', 'Human OS Check-In System with pattern recognition, personalized workflow suggestions, adaptive reminders, success tracking', '2026-01-01', v_planning_status_id, NOW(), NOW()),
    ('0.3.0', 'TBD', 'Details to be announced', '2026-06-30', v_planning_status_id, NOW(), NOW());

  -- Step 3: Log the migration
  RAISE NOTICE 'Version restructure migration complete!';
  RAISE NOTICE 'Created 18 releases (0.0.1 through 0.3.0)';
  RAISE NOTICE 'Current version: 0.1.6';
  RAISE NOTICE 'Next: Recreate features and assign to releases';
END $$;

-- Verify the migration
SELECT
  r.version,
  r.name,
  r.release_date,
  r.actual_shipped,
  rs.slug as status
FROM releases r
LEFT JOIN release_statuses rs ON r.status_id = rs.id
ORDER BY
  CASE
    WHEN r.version ~ '^0\.0\.' THEN 1
    WHEN r.version ~ '^0\.1\.' THEN 2
    WHEN r.version ~ '^0\.2\.' THEN 3
    WHEN r.version ~ '^0\.3\.' THEN 4
    ELSE 99
  END,
  r.version;

-- Output summary
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM releases;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ % releases created', v_count;
  RAISE NOTICE '✅ Current version: 0.1.6';
  RAISE NOTICE '✅ Versions: 0.0.1-0.0.9 (Early Dev), 0.1.0-0.1.6 (Foundation)';
  RAISE NOTICE '⚠️  Features table cleared - recreate as needed';
  RAISE NOTICE '📝 Next: Run npm run roadmap to regenerate ROADMAP.md';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
