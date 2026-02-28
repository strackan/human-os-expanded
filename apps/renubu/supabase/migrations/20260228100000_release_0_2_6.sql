-- Promote 0.2.5 to GA and add 0.2.6 "Platform Integration"

DO $$
DECLARE
  v_complete_id UUID;
  v_planning_id UUID;
BEGIN
  SELECT id INTO v_complete_id FROM release_statuses WHERE slug = 'complete';
  SELECT id INTO v_planning_id FROM release_statuses WHERE slug = 'planning';

  -- Promote 0.2.5 from RC to complete (GA)
  UPDATE releases
  SET status_id = v_complete_id,
      actual_shipped = '2026-02-21'
  WHERE version = '0.2.5';

  -- Add 0.2.6 "Platform Integration"
  INSERT INTO releases (version, name, status_id, actual_shipped, release_date, description)
  VALUES (
    '0.2.6',
    'Platform Integration',
    v_complete_id,
    '2026-02-28',
    '2026-02-28',
    'ARI integration via MCP, MCP bundle system, @human-os/documents package, extract() tool, Fathom meeting integration, adventure leaderboard, do() routing overhaul, cross-product contact forms, inbox summary'
  )
  ON CONFLICT (version) DO UPDATE SET
    name = EXCLUDED.name,
    status_id = EXCLUDED.status_id,
    actual_shipped = EXCLUDED.actual_shipped,
    description = EXCLUDED.description;

  -- Rename planned 0.2.6 "Human-OS Enrichment" to 0.2.7
  -- (If it exists from a previous planning entry, update it)
  UPDATE releases
  SET version = '0.2.7'
  WHERE version = '0.2.6'
    AND name = 'Human-OS Enrichment'
    AND status_id = v_planning_id;

  -- Ensure 0.2.7 planning entry exists
  INSERT INTO releases (version, name, status_id, description)
  VALUES (
    '0.2.7',
    'Human-OS Enrichment',
    v_planning_id,
    'External enrichment via MCP, wake triggers, string-tie enrichment, workflow greeting refresh'
  )
  ON CONFLICT (version) DO NOTHING;
END $$;
