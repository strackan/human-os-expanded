/**
 * SEED DATA: Essential Actions for Demo
 *
 * Run this AFTER running RUN_THIS_MIGRATION.sql
 *
 * Creates essential saved actions:
 * - Snooze (pause workflow for X days)
 * - Skip (skip current step)
 * - Escalate (escalate to manager)
 * - Schedule Meeting (create calendar event)
 *
 * HOW TO RUN:
 * 1. Go to Supabase Dashboard → SQL Editor
 * 2. Paste this entire file
 * 3. Click "Run"
 */

-- =====================================================
-- SAVED ACTIONS (Reusable Workflow Actions)
-- =====================================================

-- 1. Snooze Action
INSERT INTO saved_actions (action_id, action_name, action_type, handler, config, available_globally)
VALUES (
  'snooze',
  'Snooze Workflow',
  'snooze',
  'code:GlobalActions.snooze',
  '{
    "defaultDays": 7,
    "maxDays": 30,
    "minDays": 1,
    "allowCustomDuration": true,
    "promptForReason": true
  }'::jsonb,
  true
)
ON CONFLICT (action_id) DO UPDATE SET
  action_name = EXCLUDED.action_name,
  config = EXCLUDED.config;

-- 2. Skip Action
INSERT INTO saved_actions (action_id, action_name, action_type, handler, config, available_globally)
VALUES (
  'skip',
  'Skip Step',
  'skip',
  'code:GlobalActions.skip',
  '{
    "requireReason": true,
    "allowedReasons": [
      "Not applicable",
      "Already completed",
      "Customer requested skip",
      "Internal decision",
      "Other"
    ]
  }'::jsonb,
  true
)
ON CONFLICT (action_id) DO UPDATE SET
  action_name = EXCLUDED.action_name,
  config = EXCLUDED.config;

-- 3. Escalate Action
INSERT INTO saved_actions (action_id, action_name, action_type, handler, config, available_globally)
VALUES (
  'escalate',
  'Escalate to Manager',
  'escalation',
  'code:GlobalActions.escalate',
  '{
    "escalationLevels": ["manager", "vp_cs", "ceo"],
    "requireReason": true,
    "autoNotify": true,
    "allowCustomMessage": true
  }'::jsonb,
  true
)
ON CONFLICT (action_id) DO UPDATE SET
  action_name = EXCLUDED.action_name,
  config = EXCLUDED.config;

-- 4. Schedule Meeting Action
INSERT INTO saved_actions (action_id, action_name, action_type, handler, config, available_globally)
VALUES (
  'schedule_meeting',
  'Schedule Meeting',
  'script',
  'code:GlobalActions.scheduleMeeting',
  '{
    "defaultDuration": 30,
    "allowedDurations": [15, 30, 45, 60],
    "includeCustomer": true,
    "autoAddToCalendar": true,
    "sendInvite": true
  }'::jsonb,
  true
)
ON CONFLICT (action_id) DO UPDATE SET
  action_name = EXCLUDED.action_name,
  config = EXCLUDED.config;

-- 5. Send Email Action (for email draft artifacts)
INSERT INTO saved_actions (action_id, action_name, action_type, handler, config, available_globally)
VALUES (
  'send_email',
  'Send Email',
  'script',
  'code:GlobalActions.sendEmail',
  '{
    "allowEdit": true,
    "requireApproval": false,
    "saveToThreads": true,
    "trackOpen": true
  }'::jsonb,
  true
)
ON CONFLICT (action_id) DO UPDATE SET
  action_name = EXCLUDED.action_name,
  config = EXCLUDED.config;

-- 6. Create Task Action
INSERT INTO saved_actions (action_id, action_name, action_type, handler, config, available_globally)
VALUES (
  'create_task',
  'Create Follow-up Task',
  'script',
  'code:GlobalActions.createTask',
  '{
    "requireDueDate": true,
    "allowAssignToOthers": true,
    "defaultPriority": "medium",
    "linkToWorkflow": true
  }'::jsonb,
  true
)
ON CONFLICT (action_id) DO UPDATE SET
  action_name = EXCLUDED.action_name,
  config = EXCLUDED.config;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
  action_count INT;
BEGIN
  SELECT COUNT(*) INTO action_count FROM saved_actions;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED DATA COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created % saved actions:', action_count;
  RAISE NOTICE '  ✅ snooze';
  RAISE NOTICE '  ✅ skip';
  RAISE NOTICE '  ✅ escalate';
  RAISE NOTICE '  ✅ schedule_meeting';
  RAISE NOTICE '  ✅ send_email';
  RAISE NOTICE '  ✅ create_task';
  RAISE NOTICE '';
  RAISE NOTICE 'Saved actions are now available globally!';
  RAISE NOTICE '========================================';
END $$;
