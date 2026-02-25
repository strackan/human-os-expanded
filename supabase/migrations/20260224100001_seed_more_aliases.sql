-- =============================================================================
-- Seed missing aliases + clean up stale/broken ones
-- =============================================================================

-- Remove aliases mapping to non-existent tools
DELETE FROM human_os.aliases WHERE pattern IN ('db projects', 'db {project} {query}');

-- Seed new aliases for common phrasings that have no match
INSERT INTO human_os.aliases (pattern, description, layer, tools_required, actions, priority) VALUES

  -- Tasks (natural language variants)
  ('list all my outstanding tasks', 'List active tasks', 'public',
   ARRAY['list_all_tasks'], '[{"tool": "list_all_tasks", "params": {}}]'::jsonb, 31),

  ('what''s on my plate', 'Show urgent tasks and upcoming meetings', 'public',
   ARRAY['get_urgent_tasks'], '[{"tool": "get_urgent_tasks", "params": {}}]'::jsonb, 21),

  -- Projects
  ('create project {name}', 'Create a new project', 'public',
   ARRAY['create_project'], '[{"tool": "create_project", "params": {"name": "{name}"}}]'::jsonb, 72),

  ('new project {name}', 'Create a new project', 'public',
   ARRAY['create_project'], '[{"tool": "create_project", "params": {"name": "{name}"}}]'::jsonb, 73),

  -- Priorities
  ('my priorities', 'Show current priorities', 'public',
   ARRAY['list_priorities'], '[{"tool": "list_priorities", "params": {}}]'::jsonb, 132),

  -- Journal
  ('my journal', 'List recent journal entries', 'public',
   ARRAY['list_journal_entries'], '[{"tool": "list_journal_entries", "params": {}}]'::jsonb, 86),

  ('my journal entries', 'List recent journal entries', 'public',
   ARRAY['list_journal_entries'], '[{"tool": "list_journal_entries", "params": {}}]'::jsonb, 87),

  -- Glossary
  ('what does {term} mean', 'Look up a term', 'public',
   ARRAY['lookup_term'], '[{"tool": "lookup_term", "params": {"term": "{term}"}}]'::jsonb, 92),

  ('look up {query}', 'Quick search', 'public',
   ARRAY['quick_search'], '[{"tool": "quick_search", "params": {"query": "{query}"}}]'::jsonb, 63),

  -- Session
  ('start session', 'Load session context', 'public',
   ARRAY['get_session_context'], '[{"tool": "get_session_context", "params": {}}]'::jsonb, 11),

  ('load {mode_name} mode', 'Load a specific mode', 'public',
   ARRAY['load_mode'], '[{"tool": "load_mode", "params": {"mode": "{mode_name}"}}]'::jsonb, 12),

  -- Recall / Opinions
  ('what do I think about {person}', 'Recall opinions and notes about someone', 'public',
   ARRAY['recall'], '[{"tool": "recall", "params": {"query": "{person}", "type": "opinion"}}]'::jsonb, 160),

  ('what strings do I have tied to {person}', 'Recall string ties for someone', 'public',
   ARRAY['recall'], '[{"tool": "recall", "params": {"query": "{person}", "type": "string_tie"}}]'::jsonb, 161),

  -- Transcripts
  ('my transcripts', 'List recent transcripts', 'public',
   ARRAY['list_transcripts'], '[{"tool": "list_transcripts", "params": {}}]'::jsonb, 170),

  ('my calls', 'List recent transcripts', 'public',
   ARRAY['list_transcripts'], '[{"tool": "list_transcripts", "params": {}}]'::jsonb, 171),

  -- CRM / Pipeline
  ('my pipeline', 'Show sales pipeline', 'public',
   ARRAY['get_pipeline_summary'], '[{"tool": "get_pipeline_summary", "params": {}}]'::jsonb, 180),

  ('my deals', 'Show sales pipeline', 'public',
   ARRAY['get_pipeline_summary'], '[{"tool": "get_pipeline_summary", "params": {}}]'::jsonb, 181),

  -- Identity / Voice
  ('my identity', 'Get identity profile', 'public',
   ARRAY['get_identity_profile'], '[{"tool": "get_identity_profile", "params": {}}]'::jsonb, 190),

  ('my profile', 'Get identity profile', 'public',
   ARRAY['get_identity_profile'], '[{"tool": "get_identity_profile", "params": {}}]'::jsonb, 191),

  -- Expert nominations
  ('experts in {category}', 'Find experts in a category', 'public',
   ARRAY['list_expert_categories'], '[{"tool": "list_expert_categories", "params": {"status": "active"}}]'::jsonb, 200),

  -- Search variant
  ('search for {query}', 'Search across all sources', 'public',
   ARRAY['quick_search'], '[{"tool": "quick_search", "params": {"query": "{query}"}}]'::jsonb, 64)

ON CONFLICT (pattern, layer) DO UPDATE SET
  description = EXCLUDED.description,
  tools_required = EXCLUDED.tools_required,
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority,
  updated_at = NOW();
