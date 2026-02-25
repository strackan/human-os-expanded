-- =============================================================================
-- Fix alias param mismatches and tool name errors
-- =============================================================================

-- Fix: ping aliases — tool expects person_name, not name
UPDATE human_os.aliases SET
  actions = '[{"tool": "ping_person", "params": {"person_name": "{name}", "message": "{message}"}}]'::jsonb,
  updated_at = NOW()
WHERE pattern = 'ping {name} {message}' AND layer = 'public';

UPDATE human_os.aliases SET
  actions = '[{"tool": "ping_person", "params": {"person_name": "{name}", "message": "{message}"}}]'::jsonb,
  updated_at = NOW()
WHERE pattern = 'message {name} {message}' AND layer = 'public';

-- Fix: reply alias — tool expects to_name, not name
UPDATE human_os.aliases SET
  actions = '[{"tool": "reply_message", "params": {"to_name": "{name}", "message": "{message}"}}]'::jsonb,
  updated_at = NOW()
WHERE pattern = 'reply to {name} {message}' AND layer = 'public';

-- Fix: email alias — tool expects contact (not person), purpose (not topic)
UPDATE human_os.aliases SET
  actions = '[{"tool": "prepare_email", "params": {"contact": "{person}", "purpose": "{topic}"}}]'::jsonb,
  updated_at = NOW()
WHERE pattern = 'email {person} about {topic}' AND layer = 'public';

-- Fix: pipeline aliases — tool name is get_pipeline, not get_pipeline_summary
UPDATE human_os.aliases SET
  tools_required = ARRAY['get_pipeline'],
  actions = '[{"tool": "get_pipeline", "params": {}}]'::jsonb,
  updated_at = NOW()
WHERE pattern = 'my pipeline' AND layer = 'public';

UPDATE human_os.aliases SET
  tools_required = ARRAY['get_pipeline'],
  actions = '[{"tool": "get_pipeline", "params": {}}]'::jsonb,
  updated_at = NOW()
WHERE pattern = 'my deals' AND layer = 'public';

-- Fix: help alias — list_aliases is now callable through do() dispatcher
-- No change needed (tool name is correct, dispatcher was the issue)

-- Add: "create project called {name}" — prevents "called" from being part of name
INSERT INTO human_os.aliases (pattern, description, layer, tools_required, actions, priority) VALUES
  ('create project called {name}', 'Create a new project', 'public',
   ARRAY['create_project'], '[{"tool": "create_project", "params": {"name": "{name}"}}]'::jsonb, 71)
ON CONFLICT (pattern, layer) DO UPDATE SET
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Fix: help alias — use list_aliases (now routable through dispatcher)
UPDATE human_os.aliases SET
  tools_required = ARRAY['list_aliases'],
  actions = '[{"tool": "list_aliases", "params": {"includeDescriptions": true}}]'::jsonb,
  updated_at = NOW()
WHERE pattern = 'help' AND layer = 'public';

UPDATE human_os.aliases SET
  tools_required = ARRAY['list_aliases'],
  actions = '[{"tool": "list_aliases", "params": {"includeDescriptions": true}}]'::jsonb,
  updated_at = NOW()
WHERE pattern = 'what can I do' AND layer = 'public';
