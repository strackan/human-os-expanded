-- ============================================================================
-- Add Release 1.4: Flow Mode Extended Functionality
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
    'Flow Mode Extended Functionality',
    v_planning_status_id,
    14, -- Phase number
    '2026-02-02',
    '2026-02-27',
    'Complete the flow control vision: event-based triggers, complex logic (AND/OR), trigger editing, and real-time evaluation for all three methods (Snooze, Skip, Escalate). Transforms flow control from basic automation to intelligent orchestration.'
  )
  RETURNING id INTO v_release_id;

  RAISE NOTICE 'Created release 1.4 with ID: %', v_release_id;

  -- Feature 1: Event-Based Triggers (Cross-Method)
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
    'event-based-triggers-cross-method',
    'Event-Based Triggers (Cross-Method)',
    v_planned_status_id,
    (SELECT id FROM feature_categories WHERE slug = 'flow-control' LIMIT 1),
    1,
    32,
    'Enable Snooze, Skip, and Escalate to wake/trigger based on real-world events: Gmail emails, Slack messages, Calendar events, CRM changes. Moves beyond date-only triggers to event-driven orchestration. Includes webhook receivers, event matching logic, and UI components.'
  );

  RAISE NOTICE 'Created feature: Event-Based Triggers';

  -- Feature 2: Complex Trigger Logic (AND/OR Operators)
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
    'complex-trigger-logic-and-or',
    'Complex Trigger Logic (AND/OR Operators)',
    v_planned_status_id,
    (SELECT id FROM feature_categories WHERE slug = 'flow-control' LIMIT 1),
    2,
    24,
    'Support sophisticated multi-condition flows with AND/OR logic trees. Examples: "Snooze until Monday AND customer responds" or "Escalate if no response within 48h OR health score drops". Includes visual logic builder UI and tree evaluation engine.'
  );

  RAISE NOTICE 'Created feature: Complex Trigger Logic';

  -- Feature 3: Real-Time Trigger Evaluation
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
    'real-time-trigger-evaluation',
    'Real-Time Trigger Evaluation',
    v_planned_status_id,
    (SELECT id FROM feature_categories WHERE slug = 'flow-control' LIMIT 1),
    3,
    20,
    'Replace daily cron with webhook-based real-time evaluation for sub-5-second event-to-surface latency. Essential for event triggers to be useful. Includes webhook infrastructure, signature validation, and performance optimization.'
  );

  RAISE NOTICE 'Created feature: Real-Time Evaluation';

  -- Feature 4: Trigger Editing (Bonus)
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
    'trigger-editing-bonus',
    'Trigger Editing (Nice-to-Have)',
    v_planned_status_id,
    (SELECT id FROM feature_categories WHERE slug = 'flow-control' LIMIT 1),
    4,
    16,
    'Allow users to modify triggers on snoozed/skipped/escalated items without waking them. Nice-to-have that improves UX but not critical for 1.4. Include if time permits in Week 4.'
  );

  RAISE NOTICE 'Created feature: Trigger Editing';

  RAISE NOTICE '✅ Release 1.4 successfully added to database';
  RAISE NOTICE 'Total effort: 92 hours (primary) + 16 hours (bonus) = 108 hours';
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
