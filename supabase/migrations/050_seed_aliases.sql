-- 050_seed_aliases.sql
-- Seed starter aliases for the do() natural language router
-- These provide common patterns for founder workflows

-- =============================================================================
-- STARTER ALIASES
-- =============================================================================

INSERT INTO human_os.aliases (pattern, description, layer, tools_required, actions, priority)
VALUES
  -- Session & Status
  (
    'check my os',
    'Load session context with identity, state, and urgent tasks',
    'public',
    ARRAY['get_session_context', 'get_urgent_tasks'],
    '[
      {"tool": "get_session_context", "params": {}, "output": "session"},
      {"tool": "get_urgent_tasks", "params": {}, "output": "urgent"}
    ]'::jsonb,
    10
  ),
  (
    'what''s urgent',
    'Show urgent and overdue tasks',
    'public',
    ARRAY['get_urgent_tasks'],
    '[{"tool": "get_urgent_tasks", "params": {}}]'::jsonb,
    20
  ),
  (
    'my tasks',
    'List all active tasks',
    'public',
    ARRAY['list_all_tasks'],
    '[{"tool": "list_all_tasks", "params": {}}]'::jsonb,
    30
  ),

  -- Task Management
  (
    'add task {title}',
    'Create a new task with the given title',
    'public',
    ARRAY['add_task'],
    '[{"tool": "add_task", "params": {"title": "{title}"}}]'::jsonb,
    40
  ),
  (
    'add {title} to my tasks',
    'Create a new task',
    'public',
    ARRAY['add_task'],
    '[{"tool": "add_task", "params": {"title": "{title}"}}]'::jsonb,
    41
  ),

  -- Queue Management
  (
    'queue {item}',
    'Add something to the processing queue for later',
    'public',
    ARRAY['add_queue_item'],
    '[{"tool": "add_queue_item", "params": {"notes": "{item}", "intent_type": "note", "payload": {}}}]'::jsonb,
    50
  ),
  (
    'add {item} to my queue',
    'Queue an item for later processing',
    'public',
    ARRAY['add_queue_item'],
    '[{"tool": "add_queue_item", "params": {"notes": "{item}", "intent_type": "note", "payload": {}}}]'::jsonb,
    51
  ),
  (
    'process queue',
    'Process pending queue items',
    'public',
    ARRAY['process_queue'],
    '[{"tool": "process_queue", "params": {}}]'::jsonb,
    52
  ),

  -- Search & Lookup
  (
    'who is {person}',
    'Get full context on a person',
    'public',
    ARRAY['quick_search'],
    '[{"tool": "quick_search", "params": {"query": "{person}"}}]'::jsonb,
    60
  ),
  (
    'search {query}',
    'Search across entities and knowledge',
    'public',
    ARRAY['quick_search'],
    '[{"tool": "quick_search", "params": {"query": "{query}"}}]'::jsonb,
    61
  ),
  (
    'find {query}',
    'Search for something',
    'public',
    ARRAY['quick_search'],
    '[{"tool": "quick_search", "params": {"query": "{query}"}}]'::jsonb,
    62
  ),

  -- Projects
  (
    'my projects',
    'List all active projects',
    'public',
    ARRAY['list_projects'],
    '[{"tool": "list_projects", "params": {}}]'::jsonb,
    70
  ),
  (
    'project {name}',
    'Get details about a specific project',
    'public',
    ARRAY['get_project'],
    '[{"tool": "get_project", "params": {"slug": "{name}"}}]'::jsonb,
    71
  ),

  -- Journal
  (
    'journal {content}',
    'Create a journal entry',
    'public',
    ARRAY['create_journal_entry'],
    '[{"tool": "create_journal_entry", "params": {"content": "{content}"}}]'::jsonb,
    80
  ),
  (
    'how am I feeling',
    'Get mood trends and analytics',
    'public',
    ARRAY['get_mood_trends'],
    '[{"tool": "get_mood_trends", "params": {"days": 7}}]'::jsonb,
    81
  ),

  -- Glossary
  (
    'define {term}',
    'Look up a term definition',
    'public',
    ARRAY['lookup_term'],
    '[{"tool": "lookup_term", "params": {"term": "{term}"}}]'::jsonb,
    90
  ),
  (
    'what is {term}',
    'Look up a term or concept',
    'public',
    ARRAY['lookup_term'],
    '[{"tool": "lookup_term", "params": {"term": "{term}"}}]'::jsonb,
    91
  )

ON CONFLICT (pattern, layer) DO UPDATE SET
  description = EXCLUDED.description,
  tools_required = EXCLUDED.tools_required,
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- =============================================================================
-- VERIFY
-- =============================================================================
DO $$
DECLARE
  alias_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO alias_count FROM human_os.aliases;
  RAISE NOTICE 'Seeded % aliases for do() natural language routing', alias_count;
END $$;
