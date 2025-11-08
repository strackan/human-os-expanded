-- Populate features table with all known features
-- Phase 0.1: Initial feature catalog

-- ============================================================================
-- COMPLETE FEATURES (Previously Shipped)
-- ============================================================================

INSERT INTO features (
  slug, title, status_id, category_id, release_id,
  priority, effort_hrs, business_case, shipped_at
) VALUES
  (
    'demo-mode',
    'Demo Mode',
    (SELECT id FROM feature_statuses WHERE slug = 'complete'),
    (SELECT id FROM feature_categories WHERE slug = 'ux'),
    (SELECT id FROM releases WHERE version = '0.0'),
    2,
    4,
    'Force-enable demo mode on localhost for easier development. Visual badge indicator. Auto-disabled on production.',
    '2025-11-05'
  ),
  (
    'auth-improvements',
    'Auth Improvements',
    (SELECT id FROM feature_statuses WHERE slug = 'complete'),
    (SELECT id FROM feature_categories WHERE slug = 'infrastructure'),
    (SELECT id FROM releases WHERE version = '0.0'),
    1,
    16,
    'Comprehensive auth debugging, timeout detection, signin redirect fixes. Reduced auth-related support tickets.',
    '2025-11-05'
  ),
  (
    'documentation-system',
    'Documentation System',
    (SELECT id FROM feature_statuses WHERE slug = 'complete'),
    (SELECT id FROM feature_categories WHERE slug = 'infrastructure'),
    (SELECT id FROM releases WHERE version = '0.1'),
    1,
    24,
    'Database-first documentation with versioning, search, and customer help articles. Single source of truth for docs.',
    '2025-11-08'
  ),
  (
    'feature-tracking-system',
    'Feature Tracking System',
    (SELECT id FROM feature_statuses WHERE slug = 'complete'),
    (SELECT id FROM feature_categories WHERE slug = 'infrastructure'),
    (SELECT id FROM releases WHERE version = '0.1'),
    1,
    16,
    'Database registry for all features with status tracking, change logs, and approval chains. Auto-generated FEATURES.md.',
    '2025-11-08'
  ),
  (
    'mcp-foundation',
    'MCP Foundation',
    (SELECT id FROM feature_statuses WHERE slug = 'complete'),
    (SELECT id FROM feature_categories WHERE slug = 'infrastructure'),
    (SELECT id FROM releases WHERE version = '0.1'),
    1,
    32,
    'MCP server with 8 core operations (workflows, tasks, check-ins). 90%+ token reduction for AI agents. Progressive disclosure pattern.',
    '2025-11-08'
  );

-- ============================================================================
-- PLANNED FEATURES
-- ============================================================================

-- Release 0.2: MCP Registry & Integrations
INSERT INTO features (
  slug, title, status_id, category_id, release_id,
  priority, effort_hrs, business_case, technical_approach, success_criteria
) VALUES
  (
    'google-calendar-integration',
    'Google Calendar Integration',
    (SELECT id FROM feature_statuses WHERE slug = 'planned'),
    (SELECT id FROM feature_categories WHERE slug = 'integration'),
    (SELECT id FROM releases WHERE version = '0.2'),
    2,
    8,
    'Must-have integration for scheduling-based workflows. Enables auto-scheduling and calendar-aware reminders.',
    'Google Calendar MCP server, OAuth integration, read/write calendar events, findNextOpening() algorithm',
    ARRAY[
      'Can read user''s calendar',
      'Can create calendar events (with confirmation)',
      'Integration approved by admin'
    ]
  ),
  (
    'slack-integration',
    'Slack Integration',
    (SELECT id FROM feature_statuses WHERE slug = 'planned'),
    (SELECT id FROM feature_categories WHERE slug = 'integration'),
    (SELECT id FROM releases WHERE version = '0.2'),
    2,
    8,
    'Communication hub for many teams. Enables notifications and quick actions from Slack.',
    'Slack MCP server, OAuth integration, send messages, create reminders',
    ARRAY[
      'Can send Slack messages (with confirmation)',
      'Admin can enable/disable'
    ]
  ),
  (
    'gmail-integration',
    'Google Email (Gmail) Integration',
    (SELECT id FROM feature_statuses WHERE slug = 'planned'),
    (SELECT id FROM feature_categories WHERE slug = 'integration'),
    (SELECT id FROM releases WHERE version = '0.2'),
    2,
    6,
    'Email remains primary communication channel. Enables email-based workflow actions.',
    'Gmail API MCP server, OAuth integration, send emails, search emails',
    ARRAY[
      'Can send emails (with user confirmation)',
      'Integration secure and admin-approved'
    ]
  );

-- Release 1.0: Workflow Snoozing
INSERT INTO features (
  slug, title, status_id, category_id, release_id,
  priority, effort_hrs, business_case, technical_approach, success_criteria
) VALUES
  (
    'workflow-snoozing',
    'Workflow Snoozing',
    (SELECT id FROM feature_statuses WHERE slug = 'planned'),
    (SELECT id FROM feature_categories WHERE slug = 'workflow'),
    (SELECT id FROM releases WHERE version = '1.0'),
    1,
    125,
    'Core product promise: "I won''t let you forget." Enables users to park workflows until specific dates or business conditions are met.',
    'Condition-based wake logic, database fields (snoozed_until, wake_conditions), daily cron evaluation service, smart surface algorithm',
    ARRAY[
      'Users can snooze workflows with date + condition',
      '90%+ accuracy in wake condition detection',
      'Handles 1000+ snoozed workflows efficiently',
      '80%+ user adoption'
    ]
  );

-- Release 2.0: Parking Lot
INSERT INTO features (
  slug, title, status_id, category_id, release_id,
  priority, effort_hrs, business_case, technical_approach, success_criteria
) VALUES
  (
    'parking-lot',
    'Parking Lot',
    (SELECT id FROM feature_statuses WHERE slug = 'planned'),
    (SELECT id FROM feature_categories WHERE slug = 'workflow'),
    (SELECT id FROM releases WHERE version = '2.0'),
    2,
    16,
    'Quick capture for non-time-sensitive ideas and tasks. Provides peace of mind that nothing is forgotten without cluttering active workflows.',
    'Simple table: parking_lot_items, tag-based organization, quick add UI, no dates or conditions (unlike snoozing)',
    ARRAY[
      'Can capture idea in <5 seconds',
      'Tag-based filtering works',
      'Design partners actively using'
    ]
  );

-- Release 3.0: Human OS Check-Ins
INSERT INTO features (
  slug, title, status_id, category_id, release_id,
  priority, effort_hrs, business_case, technical_approach, success_criteria, depends_on
) VALUES
  (
    'human-os-checkins',
    'Human OS Check-Ins',
    (SELECT id FROM feature_statuses WHERE slug = 'planned'),
    (SELECT id FROM feature_categories WHERE slug = 'ai'),
    (SELECT id FROM releases WHERE version = '3.0'),
    1,
    64,
    'THE competitive moat. Creates learning loop where system discovers what works for each specific user. Justifies premium pricing ($200/user vs $50/user).',
    'Post-completion check-in prompts, pattern detection service, recommendation engine based on user''s history, "This worked for YOU before" insights',
    ARRAY[
      '80%+ check-in completion rate',
      'Patterns detected after 5+ workflows',
      'Recommendations shown with 70%+ confidence',
      '2+ design partners find it useful'
    ],
    ARRAY[(SELECT id FROM features WHERE slug = 'workflow-snoozing')]
  );

-- ============================================================================
-- BACKLOG FEATURES
-- ============================================================================

INSERT INTO features (
  slug, title, status_id, category_id,
  priority, effort_hrs, business_case
) VALUES
  (
    'custom-mcp-servers',
    'Custom MCP Servers',
    (SELECT id FROM feature_statuses WHERE slug = 'backlog'),
    (SELECT id FROM feature_categories WHERE slug = 'infrastructure'),
    4,
    40,
    'Allow power users to add custom MCP servers for niche integrations. Currently deferred due to security concerns.'
  ),
  (
    'hubspot-integration',
    'HubSpot Integration',
    (SELECT id FROM feature_statuses WHERE slug = 'backlog'),
    (SELECT id FROM feature_categories WHERE slug = 'integration'),
    3,
    12,
    'Popular CRM alternative to Salesforce. Some customers use HubSpot.'
  ),
  (
    'salesforce-integration',
    'Salesforce Integration',
    (SELECT id FROM feature_statuses WHERE slug = 'backlog'),
    (SELECT id FROM feature_categories WHERE slug = 'integration'),
    3,
    16,
    'Enterprise CRM standard. Update opportunities, log activities, sync data.'
  ),
  (
    'notion-integration',
    'Notion Integration',
    (SELECT id FROM feature_statuses WHERE slug = 'backlog'),
    (SELECT id FROM feature_categories WHERE slug = 'integration'),
    3,
    8,
    'Popular knowledge management tool. Sync workflows to Notion databases.'
  ),
  (
    'airtable-integration',
    'Airtable Integration',
    (SELECT id FROM feature_statuses WHERE slug = 'backlog'),
    (SELECT id FROM feature_categories WHERE slug = 'integration'),
    3,
    8,
    'Flexible database tool used by many teams.'
  );

-- ============================================================================
-- DEFERRED FEATURES
-- ============================================================================

INSERT INTO features (
  slug, title, status_id, category_id,
  priority, effort_hrs, business_case, deferred_reason, deferred_conditions
) VALUES
  (
    'weekly-planner',
    'Weekly Planner',
    (SELECT id FROM feature_statuses WHERE slug = 'deferred'),
    (SELECT id FROM feature_categories WHERE slug = 'workflow'),
    NULL,
    60,
    'AI-powered weekly planning that integrates work commitments with calendar. Nice-to-have but not core differentiator.',
    'Zero customer demand to date. Not core to "learning loop" value proposition. Gainsight already has this (not our moat). Can be demoed effectively without building. Resource allocation better spent on Human OS Check-Ins.',
    'Build Trigger: 2+ design partners explicitly request it. Timeline if triggered: Q2 2026. Fast-track approach: Now 40-60h (vs 109h) due to workflow snoozing infrastructure.'
  );
