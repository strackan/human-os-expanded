-- Add Email Orchestration Feature
-- Shipped: 2025-11-11
-- AI-powered email generation for CS teams

INSERT INTO features (
  slug, title, status_id, category_id, release_id,
  priority, effort_hrs, business_case, technical_approach, success_criteria, shipped_at
) VALUES
  (
    'email-orchestration',
    'AI-Powered Email Orchestration',
    (SELECT id FROM feature_statuses WHERE slug = 'complete'),
    (SELECT id FROM feature_categories WHERE slug = 'ai'),
    (SELECT id FROM releases WHERE version = '0.2'),
    1,
    20,
    'Generate contextual CS emails using Claude API. 5 email types (renewal kickoff, pricing discussion, QBR invitation, risk mitigation, expansion pitch). Reduces email writing time from 15min to 30sec.',
    'Claude Haiku 4.5 integration via AnthropicService. Email type templates with Handlebars. Customer context enrichment from database. Test page at /email-test for validation.',
    ARRAY[
      'AI generates professional CS emails in <30 seconds',
      'All 5 email types work correctly',
      'Customer context properly injected',
      'Email tone matches CSM standards',
      'TypeScript compilation passes'
    ],
    '2025-11-11'
  );
