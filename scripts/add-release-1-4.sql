-- ============================================================================
-- Add Release 1.4: Event-Driven Automation & String-Tie
-- ============================================================================

BEGIN;

-- First, get the UUID for the 'planning' status
DO $$
DECLARE
  v_release_id UUID;
  v_planning_status_id UUID;
  v_planned_status_id UUID;
BEGIN
  -- Get status IDs
  SELECT id INTO v_planning_status_id FROM release_statuses WHERE slug = 'planning';
  SELECT id INTO v_planned_status_id FROM feature_statuses WHERE slug = 'planned';

  -- Insert Release 1.4
  INSERT INTO releases (
    version,
    name,
    status_id,
    phase_number,
    planned_start,
    planned_end,
    description
  ) VALUES (
    '1.4',
    'Event-Driven Automation & String-Tie',
    v_planning_status_id,
    14, -- Phase number
    '2026-02-02',
    '2026-03-20',
    'Proactive automation: Event-Driven Workflow Launcher automatically creates workflows when external events occur, String-Tie provides voice-first lightweight reminders, and Review Rejection completes the review workflow cycle. Transforms platform from user-driven to system-assisted.'
  )
  RETURNING id INTO v_release_id;

  RAISE NOTICE 'Created release 1.4 with ID: %', v_release_id;

  -- Feature 1: Event-Driven Workflow Launcher
  INSERT INTO features (
    release_id,
    slug,
    title,
    status_id,
    category_id,
    priority,
    effort_hrs,
    business_case
  ) VALUES (
    v_release_id,
    'event-driven-workflow-launcher',
    'Event-Driven Workflow Launcher',
    v_planned_status_id,
    (SELECT id FROM feature_categories WHERE slug = 'flow-control' LIMIT 1),
    1,
    50,
    'Automatically launch workflows when external events occur. Pattern: "When [person/company] does [event] → Launch [workflow]". Supports 6 event sources: SQL queries, Slack (MCP), Gmail, Calendar, CRM, Email. Simple 2-condition AND/OR logic. Cron and webhook-based evaluation. Audit trail for all triggered workflows. Dashboard at /automation-rules with visual rule builder.'
  );

  RAISE NOTICE 'Created feature: Event-Driven Workflow Launcher';

  -- Feature 2: String-Tie Standalone Reminder System
  INSERT INTO features (
    release_id,
    slug,
    title,
    status_id,
    category_id,
    priority,
    effort_hrs,
    business_case
  ) VALUES (
    v_release_id,
    'string-tie-standalone',
    'String-Tie Standalone Reminder System',
    v_planned_status_id,
    (SELECT id FROM feature_categories WHERE slug = 'flow-control' LIMIT 1),
    2,
    50,
    'Voice-first lightweight reminder system completely separate from workflows. "Tie a string around your finger" for quick personal reminders. Voice dictation using Web Speech API, LLM parses natural language (no follow-up questions). Magic snippet "TIE_A_STRING" works globally in any chat. Dashboard at /string-ties. Notifications via in-app, email, push, Slack.'
  );

  RAISE NOTICE 'Created feature: String-Tie Standalone';

  -- Feature 3: Review Rejection Enhancement
  INSERT INTO features (
    release_id,
    slug,
    title,
    status_id,
    category_id,
    priority,
    effort_hrs,
    business_case
  ) VALUES (
    v_release_id,
    'review-rejection-enhancement',
    'Review Rejection Enhancement',
    v_planned_status_id,
    (SELECT id FROM feature_categories WHERE slug = 'flow-control' LIMIT 1),
    3,
    20,
    'Complete the review workflow cycle by adding formal rejection capability. Reviewers can reject with required comments, workflows return to original user (still suspended), users address feedback and re-submit, iteration tracking with full history. Notifications on rejection and re-submission. UI updates: Reject button, rejection banner, iteration badge, history accordion.'
  );

  RAISE NOTICE 'Created feature: Review Rejection Enhancement';

  RAISE NOTICE '✅ Release 1.4 successfully added to database';
  RAISE NOTICE 'Total effort: 120 hours across 3 features (6+ weeks)';
  RAISE NOTICE 'Focus: Proactive automation, lightweight reminders, complete review cycle';
END $$;

COMMIT;

-- Verify the insertion
SELECT
  r.version,
  r.name,
  r.phase_number,
  rs.slug as status,
  r.planned_start,
  r.planned_end,
  COUNT(f.id) as feature_count,
  SUM(f.effort_hrs) as total_effort
FROM releases r
LEFT JOIN release_statuses rs ON r.status_id = rs.id
LEFT JOIN features f ON f.release_id = r.id
WHERE r.version = '1.4'
GROUP BY r.version, r.name, r.phase_number, rs.slug, r.planned_start, r.planned_end;

SELECT '✅ Release 1.4 added! Run npm run roadmap to regenerate ROADMAP.md' as message;
