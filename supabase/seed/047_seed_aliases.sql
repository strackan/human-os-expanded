-- ============================================
-- SEED PRIORITY ALIASES
-- Natural language command patterns
-- ============================================

-- Category 1: Session/State Workflows

INSERT INTO human_os.aliases (pattern, description, layer, mode, tools_required, actions, priority)
VALUES
  (
    'start session',
    'Initialize session with identity, state, and context - call at conversation start',
    'founder:justin',
    'tactical',
    ARRAY['get_session_context'],
    '[
      {"tool": "get_session_context", "params": {}}
    ]'::jsonb,
    1
  ),
  (
    'initialize',
    'Initialize session (alias for start session)',
    'founder:justin',
    'tactical',
    ARRAY['get_session_context'],
    '[
      {"tool": "get_session_context", "params": {}}
    ]'::jsonb,
    1
  ),
  (
    'check my os',
    'Review personal operating system dashboard - load session context and urgent tasks',
    'founder:justin',
    'tactical',
    ARRAY['get_session_context', 'get_urgent_tasks'],
    '[
      {"tool": "get_session_context", "params": {}, "output": "session"},
      {"tool": "get_urgent_tasks", "params": {"limit": 5}, "output": "urgent"}
    ]'::jsonb,
    10
  ),
  (
    'what''s urgent',
    'Show urgent tasks and blockers',
    'founder:justin',
    'tactical',
    ARRAY['get_urgent_tasks'],
    '[
      {"tool": "get_urgent_tasks", "params": {"limit": 10}}
    ]'::jsonb,
    10
  ),
  (
    'load {mode_name} mode',
    'Switch operational context to a specific mode',
    'founder:justin',
    'tactical',
    ARRAY['load_mode'],
    '[
      {"tool": "load_mode", "params": {"mode": "{mode_name}"}}
    ]'::jsonb,
    20
  ),
  (
    'add {item} to my queue',
    'Queue item for later processing',
    'founder:justin',
    'tactical',
    ARRAY['add_queue_item'],
    '[
      {"tool": "add_queue_item", "params": {"content": "{item}", "source": "voice"}}
    ]'::jsonb,
    20
  )
ON CONFLICT (pattern, layer) DO UPDATE SET
  description = EXCLUDED.description,
  mode = EXCLUDED.mode,
  tools_required = EXCLUDED.tools_required,
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Category 2: People/Relationship Queries

INSERT INTO human_os.aliases (pattern, description, layer, mode, tools_required, actions, priority)
VALUES
  (
    'who is {person}',
    'Get full context on a person - search entities, opinions, and transcripts',
    'founder:justin',
    'strategic',
    ARRAY['search_entities', 'get_opinions', 'search_transcripts'],
    '[
      {"tool": "search_entities", "params": {"query": "{person}", "entity_type": "person"}, "output": "entity"},
      {"tool": "get_opinions", "params": {"entity_slug": "{entity.slug}"}, "output": "opinions"},
      {"tool": "search_transcripts", "params": {"query": "{person}", "limit": 3}, "output": "mentions"}
    ]'::jsonb,
    10
  ),
  (
    'what do I think about {person}',
    'Retrieve opinions and notes about someone',
    'founder:justin',
    'strategic',
    ARRAY['get_opinions', 'search_transcripts'],
    '[
      {"tool": "get_opinions", "params": {"query": "{person}"}, "output": "opinions"},
      {"tool": "search_transcripts", "params": {"query": "{person}", "limit": 5}, "output": "mentions"}
    ]'::jsonb,
    20
  ),
  (
    'tie a string to {person} {timing}',
    'Set contextual reminder about a person - resurface at specified time',
    'founder:justin',
    'tactical',
    ARRAY['search_entities', 'add_task'],
    '[
      {"tool": "search_entities", "params": {"query": "{person}", "entity_type": "person"}, "output": "entity"},
      {"tool": "add_task", "params": {"title": "Follow up with {person}", "description": "String tie reminder", "due_date": "{timing}", "entity_id": "{entity.id}"}}
    ]'::jsonb,
    10
  ),
  (
    'what strings do I have tied to {person}',
    'Check pending reminders for someone - searches execution logs',
    'founder:justin',
    'tactical',
    ARRAY['recall'],
    '[
      {"tool": "recall", "params": {"query": "string tie", "entity": "{person}", "limit": 10}}
    ]'::jsonb,
    20
  )
ON CONFLICT (pattern, layer) DO UPDATE SET
  description = EXCLUDED.description,
  mode = EXCLUDED.mode,
  tools_required = EXCLUDED.tools_required,
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Category 3: Content Creation (Expert System)

INSERT INTO human_os.aliases (pattern, description, layer, mode, tools_required, actions, priority)
VALUES
  (
    'what would {expert} say about {topic}',
    'Get perspective on a topic in an expert''s voice',
    'founder:justin',
    'strategic',
    ARRAY['search_entities', 'load_mode'],
    '[
      {"tool": "search_entities", "params": {"query": "{expert}", "entity_type": "person"}, "output": "voice"},
      {"tool": "load_mode", "params": {"mode": "voice"}}
    ]'::jsonb,
    10
  ),
  (
    'write like {expert} about {topic}',
    'Generate content in an expert''s style',
    'founder:justin',
    'strategic',
    ARRAY['search_entities', 'load_mode'],
    '[
      {"tool": "search_entities", "params": {"query": "{expert}", "entity_type": "person"}, "output": "voice"},
      {"tool": "load_mode", "params": {"mode": "voice"}}
    ]'::jsonb,
    20
  ),
  (
    'channel {expert}',
    'Load expert voice profile for the session',
    'founder:justin',
    'tactical',
    ARRAY['search_entities', 'load_mode'],
    '[
      {"tool": "search_entities", "params": {"query": "{expert}", "entity_type": "person"}, "output": "voice"},
      {"tool": "load_mode", "params": {"mode": "voice"}}
    ]'::jsonb,
    20
  )
ON CONFLICT (pattern, layer) DO UPDATE SET
  description = EXCLUDED.description,
  mode = EXCLUDED.mode,
  tools_required = EXCLUDED.tools_required,
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Additional Utility Aliases

INSERT INTO human_os.aliases (pattern, description, layer, mode, tools_required, actions, priority)
VALUES
  (
    'define {term}',
    'Look up or create a glossary definition',
    'founder:justin',
    'tactical',
    ARRAY['lookup_term', 'define_term'],
    '[
      {"tool": "lookup_term", "params": {"term": "{term}"}}
    ]'::jsonb,
    30
  ),
  (
    'search for {query}',
    'Global search across entities, transcripts, and context',
    'founder:justin',
    'strategic',
    ARRAY['global_search'],
    '[
      {"tool": "global_search", "params": {"query": "{query}", "limit": 10}}
    ]'::jsonb,
    30
  ),
  (
    'how am I feeling',
    'Analyze current emotional state from recent journal entries',
    'founder:justin',
    'strategic',
    ARRAY['get_mood_history'],
    '[
      {"tool": "get_mood_history", "params": {"days": 7}}
    ]'::jsonb,
    30
  ),
  (
    'journal about {topic}',
    'Create a new journal entry about a topic',
    'founder:justin',
    'strategic',
    ARRAY['create_journal_entry'],
    '[
      {"tool": "create_journal_entry", "params": {"content": "Journaling about: {topic}"}}
    ]'::jsonb,
    30
  )
ON CONFLICT (pattern, layer) DO UPDATE SET
  description = EXCLUDED.description,
  mode = EXCLUDED.mode,
  tools_required = EXCLUDED.tools_required,
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Public aliases (available to all users)

INSERT INTO human_os.aliases (pattern, description, layer, mode, tools_required, actions, priority)
VALUES
  (
    'help',
    'List available commands and aliases',
    'public',
    'tactical',
    ARRAY['list_aliases'],
    '[
      {"tool": "list_aliases", "params": {"includeDescriptions": true}}
    ]'::jsonb,
    1
  ),
  (
    'what can I do',
    'Show available actions',
    'public',
    'tactical',
    ARRAY['list_aliases'],
    '[
      {"tool": "list_aliases", "params": {"includeDescriptions": true}}
    ]'::jsonb,
    1
  )
ON CONFLICT (pattern, layer) DO UPDATE SET
  description = EXCLUDED.description,
  mode = EXCLUDED.mode,
  tools_required = EXCLUDED.tools_required,
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Log how many aliases were seeded
DO $$
DECLARE
  alias_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO alias_count FROM human_os.aliases;
  RAISE NOTICE 'Seeded % aliases', alias_count;
END $$;
