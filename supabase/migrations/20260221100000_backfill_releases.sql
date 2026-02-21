-- Backfill releases table with 0.1.7 through 0.2.5
-- These releases were shipped but never tracked in the database.

DO $$
DECLARE
  v_complete_id UUID;
  v_rc_id UUID;
  v_planning_id UUID;
BEGIN
  SELECT id INTO v_complete_id FROM release_statuses WHERE slug = 'complete';
  SELECT id INTO v_planning_id FROM release_statuses WHERE slug = 'planning';

  -- Add 'rc' status if it doesn't exist
  INSERT INTO release_statuses (slug, name, description, sort_order)
  VALUES ('rc', 'Release Candidate', 'Release candidate under validation', 3)
  ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO v_rc_id FROM release_statuses WHERE slug = 'rc';

  -- 0.1.x series (shipped, missing from DB)
  INSERT INTO releases (version, name, status_id, actual_shipped, release_date, description)
  VALUES
    ('0.1.7', 'Parking Lot', v_complete_id, '2025-11-18', '2025-11-18', 'Parking lot idea capture system'),
    ('0.1.8', 'Return Visit System', v_complete_id, '2025-11-20', '2025-11-20', 'Return visit longitudinal intelligence'),
    ('0.1.9', 'Workflow Templates', v_complete_id, '2025-11-22', '2025-11-22', 'InHerSight workflow template system'),
    ('0.1.10', 'Scalable Workflows', v_complete_id, '2025-11-25', '2025-11-25', 'Scalable workflow infrastructure'),
    ('0.1.11', 'QBR Presentations', v_complete_id, '2025-11-28', '2025-11-28', 'Presentation artifact type and QBR decks'),
    ('0.1.12', 'TaskMode Encapsulation', v_complete_id, '2025-12-02', '2025-12-02', 'Reusable workflow launcher with resume dialog'),
    ('0.1.13', 'Dark Mode Infrastructure', v_complete_id, '2025-12-07', '2025-12-07', 'Class-based dark mode with toggle, semantic DOM')
  ON CONFLICT (version) DO UPDATE SET
    name = EXCLUDED.name,
    status_id = EXCLUDED.status_id,
    actual_shipped = EXCLUDED.actual_shipped;

  -- Update existing 0.2.0 row (was 'planning', now shipped)
  UPDATE releases
  SET name = 'Human-OS Integration & LLM Workflow Architecture',
      status_id = v_complete_id,
      actual_shipped = '2025-12-18',
      release_date = '2025-12-18',
      description = 'Human-OS integration, LLM workflow architecture, per-workflow LLM mode'
  WHERE version = '0.2.0';

  -- If 0.2.0 doesn't exist yet, insert it
  INSERT INTO releases (version, name, status_id, actual_shipped, release_date, description)
  VALUES ('0.2.0', 'Human-OS Integration & LLM Workflow Architecture', v_complete_id, '2025-12-18', '2025-12-18', 'Human-OS integration, LLM workflow architecture, per-workflow LLM mode')
  ON CONFLICT (version) DO NOTHING;

  -- 0.2.x series
  INSERT INTO releases (version, name, status_id, actual_shipped, release_date, description)
  VALUES
    ('0.2.1', 'Sculptor Sessions & Workflow Chat', v_complete_id, '2026-01-05', '2026-01-05',
     'Theatrical sculptor sessions, v0-style step chat, API client layer, pilot tenants, staging deploy'),
    ('0.2.2', 'Cleanup & Workflow UX Polish', v_complete_id, '2026-02-12', '2026-02-12',
     'Sculptor removal, PostgREST cleanup, Continue buttons, presentation UX improvements'),
    ('0.2.3', 'Dashboard Revamp', v_complete_id, '2026-02-18', '2026-02-18',
     'Bounty system, dashboard v3 layout, Fraunces serif, adventure-score edge function'),
    ('0.2.4', 'Dashboard Polish & Theme', v_complete_id, '2026-02-20', '2026-02-20',
     'Hero card CSS scoping, centralized dashboard theme, visual polish'),
    ('0.2.5', 'First Contact Onboarding', v_rc_id, '2026-02-21', '2026-02-21',
     'Conversational onboarding with Claude, SSE streaming, tool-use continuation pattern')
  ON CONFLICT (version) DO UPDATE SET
    name = EXCLUDED.name,
    status_id = EXCLUDED.status_id,
    actual_shipped = EXCLUDED.actual_shipped,
    description = EXCLUDED.description;

  -- Update 0.3.0 to remain planning
  UPDATE releases
  SET status_id = v_planning_id
  WHERE version = '0.3.0';
END $$;
