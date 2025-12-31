-- 062_relationship_aliases.sql
-- Aliases for relationship management

INSERT INTO human_os.aliases (pattern, description, layer, tools_required, actions, priority)
VALUES
  -- Who is X?
  (
    'who is {name}',
    'Look up information about a person in relationships',
    'public',
    ARRAY['who_is'],
    '[{"tool": "who_is", "params": {"name": "{name}"}}]'::jsonb,
    100
  ),
  (
    'who''s {name}',
    'Look up information about a person',
    'public',
    ARRAY['who_is'],
    '[{"tool": "who_is", "params": {"name": "{name}"}}]'::jsonb,
    101
  ),
  (
    'tell me about {name}',
    'Get relationship context for a person',
    'public',
    ARRAY['get_relationship'],
    '[{"tool": "get_relationship", "params": {"name": "{name}"}}]'::jsonb,
    102
  ),

  -- Adding relationships
  (
    'add {name} as {relationship}',
    'Add a new relationship with description',
    'public',
    ARRAY['add_relationship'],
    '[{"tool": "add_relationship", "params": {"name": "{name}", "relationship": "{relationship}"}}]'::jsonb,
    110
  ),
  (
    'remember {name} is {relationship}',
    'Add a new relationship',
    'public',
    ARRAY['add_relationship'],
    '[{"tool": "add_relationship", "params": {"name": "{name}", "relationship": "{relationship}"}}]'::jsonb,
    111
  ),
  (
    '{name} is my {relationship}',
    'Add a relationship based on user describing someone',
    'public',
    ARRAY['add_relationship'],
    '[{"tool": "add_relationship", "params": {"name": "{name}", "relationship": "my {relationship}"}}]'::jsonb,
    112
  ),

  -- Contact logging
  (
    'I talked to {name}',
    'Log a contact with someone',
    'public',
    ARRAY['log_contact'],
    '[{"tool": "log_contact", "params": {"name": "{name}"}}]'::jsonb,
    120
  ),
  (
    'I met with {name}',
    'Log meeting with someone',
    'public',
    ARRAY['log_contact'],
    '[{"tool": "log_contact", "params": {"name": "{name}"}}]'::jsonb,
    121
  ),
  (
    'just spoke with {name}',
    'Log contact with someone',
    'public',
    ARRAY['log_contact'],
    '[{"tool": "log_contact", "params": {"name": "{name}"}}]'::jsonb,
    122
  ),

  -- Listing and checking
  (
    'my relationships',
    'List all relationships',
    'public',
    ARRAY['list_relationships'],
    '[{"tool": "list_relationships", "params": {}}]'::jsonb,
    130
  ),
  (
    'who do I know',
    'List all relationships',
    'public',
    ARRAY['list_relationships'],
    '[{"tool": "list_relationships", "params": {}}]'::jsonb,
    131
  ),
  (
    'who should I contact',
    'Get overdue contacts',
    'public',
    ARRAY['get_overdue_contacts'],
    '[{"tool": "get_overdue_contacts", "params": {}}]'::jsonb,
    140
  ),
  (
    'overdue contacts',
    'Get relationships needing attention',
    'public',
    ARRAY['get_overdue_contacts'],
    '[{"tool": "get_overdue_contacts", "params": {}}]'::jsonb,
    141
  ),
  (
    'who haven''t I talked to',
    'Get overdue contacts',
    'public',
    ARRAY['get_overdue_contacts'],
    '[{"tool": "get_overdue_contacts", "params": {}}]'::jsonb,
    142
  ),
  (
    'when did I last talk to {name}',
    'Get relationship details including last contact',
    'public',
    ARRAY['get_relationship'],
    '[{"tool": "get_relationship", "params": {"name": "{name}"}}]'::jsonb,
    150
  )
ON CONFLICT (pattern, layer) DO UPDATE SET
  description = EXCLUDED.description,
  tools_required = EXCLUDED.tools_required,
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority;

-- =============================================================================
-- CLEANUP: Drop legacy transcript tables
-- =============================================================================
-- These tables are empty and superseded by human_os.transcripts (migration 051).
-- - founder_os.transcripts: original table, raw_content stored in DB
-- - renubu.transcripts: tenant-scoped variant, never populated
-- Both have been replaced by human_os.transcripts which:
--   1. Uses layer-based scoping (works for all products)
--   2. Stores content in Supabase Storage (not raw_content in DB)
--   3. Has proper entity linking and metadata

DROP TABLE IF EXISTS founder_os.transcripts CASCADE;
DROP TABLE IF EXISTS renubu.transcripts CASCADE;
