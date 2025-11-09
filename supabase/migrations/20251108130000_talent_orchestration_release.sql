-- Add Release 1.5: Talent Orchestration System
-- Strategic dogfooding initiative for hiring + workflow validation
-- Timeline: Q1 2026 (Jan 6 - Feb 28, 2026)

-- Insert Release 1.5
INSERT INTO releases (
  version,
  name,
  phase_number,
  status_id,
  planned_start,
  planned_end,
  description
) VALUES (
  '1.5',
  'Talent Orchestration System',
  15, -- Phase 1.5
  (SELECT id FROM release_statuses WHERE slug = 'planning'),
  '2026-01-06',
  '2026-02-28',
  'AI-powered interview system for hiring. Strategic dogfooding to hire founding operator while validating workflow orchestration engine. Conversational AI interviews with 11-dimension assessment, multi-pass analysis, and automated candidate routing.'
);

-- Get the release ID for linking features
DO $$
DECLARE
  release_1_5_id UUID;
BEGIN
  SELECT id INTO release_1_5_id FROM releases WHERE version = '1.5';

  -- Feature 1: Database Schema & Services (Phases 1-2)
  INSERT INTO features (
    slug,
    title,
    status_id,
    category_id,
    release_id,
    priority,
    effort_hrs,
    business_case
  ) VALUES (
    'talent-database-schema',
    'Talent Database Schema & Services',
    (SELECT id FROM feature_statuses WHERE slug = 'planned'),
    (SELECT id FROM feature_categories WHERE slug = 'infrastructure'),
    release_1_5_id,
    1,
    16,
    'Database tables for candidates, talent bench, interview sessions. Core services (CandidateService, TalentBenchService) with RLS policies. Foundation for all talent orchestration features.'
  );

  -- Feature 2: Interview Experience (Phase 3)
  INSERT INTO features (
    slug,
    title,
    status_id,
    category_id,
    release_id,
    priority,
    2,
    48,
    'Landing page (/join) + conversational AI interview experience. Adaptive questioning across 11 dimensions (IQ, personality, motivation, work history, culture fit, technical, GTM, EQ, empathy, self-awareness, passions). Real-time chat interface with Claude Sonnet 4.5. Transcript storage for analysis.'
  );

  -- Feature 3: AI Analysis Engine (Phase 4)
  INSERT INTO features (
    slug,
    title,
    status_id,
    category_id,
    release_id,
    priority,
    3,
    16,
    'Multi-pass AI analysis: dimension scoring (0-100), archetype classification (6 types), red/green flag detection, overall recommendation. Automated routing: top 1% priority contact, top 10% benched, others passed. Analysis completes in <30 seconds.'
  );

  -- Feature 4: Candidate Dashboard (Phase 5 - Future)
  INSERT INTO features (
    slug,
    title,
    status_id,
    category_id,
    release_id,
    priority,
    4,
    8,
    'Talent pipeline dashboard with filtering (tier, archetype, score), detailed candidate profiles, transcript viewer with highlights, bench management. Enables efficient candidate review and talent pool curation.'
  );

  -- Feature 5: Email Automation (Phase 6 - Future)
  INSERT INTO features (
    slug,
    title,
    status_id,
    category_id,
    release_id,
    priority,
    5,
    8,
    'Automated email notifications based on routing: top 1% (immediate contact), benched (on radar), passed (polite rejection). Template personalization with AI-generated highlights. No emails in dev/staging.'
  );

  -- Feature 6: Landing Page & Workflow Init (Phase 2)
  INSERT INTO features (
    slug,
    title,
    status_id,
    category_id,
    release_id,
    priority,
    1,
    8,
    'Public landing page at /join with hero section, founder video embed, application form (name, email, LinkedIn, referral source). Creates workflow_execution + candidate on submit. Redirects to interview experience.'
  );

END $$;

-- Add comment for tracking
COMMENT ON TABLE releases IS 'Product releases with versioning. Release 1.5 added for Talent Orchestration System (dogfooding initiative).';

-- Update release timeline estimates
-- Phase 1.5 pushes subsequent releases:
-- - 2.0 Parking Lot: Jan → Mar 2026
-- - 3.0 Human OS: Feb-Mar → Apr-May 2026

UPDATE releases
SET
  planned_start = '2026-03-02',
  planned_end = '2026-03-20'
WHERE version = '2.0'; -- Push Parking Lot to March

UPDATE releases
SET
  planned_start = '2026-04-01',
  planned_end = '2026-05-31'
WHERE version = '3.0'; -- Push Human OS Check-Ins to Apr-May
