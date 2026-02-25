-- =============================================================================
-- Final do() fixes: re-apply find_alias, add campaigns alias, fix CRM schema
-- =============================================================================
-- This migration uses a timestamp after 20260225 to ensure it runs even if
-- earlier 20260224* migrations were skipped due to ordering.
-- =============================================================================

-- ============================================
-- 1. Re-apply improved find_alias function
--    (prefix stripping + reversed FTS)
-- ============================================

CREATE OR REPLACE FUNCTION human_os.find_alias(
  p_request TEXT,
  p_layer TEXT DEFAULT 'public',
  p_context TEXT[] DEFAULT '{}'
) RETURNS TABLE (
  id UUID,
  pattern TEXT,
  description TEXT,
  mode human_os.execution_mode,
  tools_required TEXT[],
  actions JSONB,
  match_type TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cleaned TEXT;
BEGIN
  -- Stage 1: Exact pattern match (with {variable} → regex)
  RETURN QUERY
  SELECT
    a.id, a.pattern, a.description, a.mode, a.tools_required, a.actions,
    'exact'::TEXT as match_type
  FROM human_os.aliases a
  WHERE a.enabled = true
    AND (a.layer = 'public' OR a.layer = p_layer)
    AND (a.context = '{}' OR a.context && p_context)
    AND p_request ~* ('^' || regexp_replace(a.pattern, '\{[^}]+\}', '(.+)', 'g') || '$')
  ORDER BY a.priority, a.layer DESC
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Stage 1b: Strip common command prefixes and retry exact match
  v_cleaned := regexp_replace(
    p_request,
    '^\s*(please\s+)?(show me|show|list all|list|give me|display|get me|get|find me|tell me about|tell me|what are|what''s my|what''s|can you|could you)\s+',
    '', 'i'
  );
  v_cleaned := trim(v_cleaned);

  IF v_cleaned <> p_request AND v_cleaned <> '' THEN
    RETURN QUERY
    SELECT
      a.id, a.pattern, a.description, a.mode, a.tools_required, a.actions,
      'exact'::TEXT as match_type
    FROM human_os.aliases a
    WHERE a.enabled = true
      AND (a.layer = 'public' OR a.layer = p_layer)
      AND (a.context = '{}' OR a.context && p_context)
      AND v_cleaned ~* ('^' || regexp_replace(a.pattern, '\{[^}]+\}', '(.+)', 'g') || '$')
    ORDER BY a.priority, a.layer DESC
    LIMIT 1;

    IF FOUND THEN RETURN; END IF;
  END IF;

  -- Stage 2: Reversed FTS — does request contain the pattern's keywords?
  RETURN QUERY
  SELECT
    a.id, a.pattern, a.description, a.mode, a.tools_required, a.actions,
    'fuzzy'::TEXT as match_type
  FROM human_os.aliases a
  WHERE a.enabled = true
    AND (a.layer = 'public' OR a.layer = p_layer)
    AND to_tsvector('english', p_request) @@ plainto_tsquery(
      'english',
      regexp_replace(a.pattern, '\{[^}]+\}', '', 'g')
    )
  ORDER BY
    ts_rank(
      to_tsvector('english', p_request),
      plainto_tsquery('english', regexp_replace(a.pattern, '\{[^}]+\}', '', 'g'))
    ) DESC,
    length(a.pattern) DESC,
    a.priority
  LIMIT 3;
END;
$$;

-- ============================================
-- 2. Ensure CRM schema is exposed to PostgREST
-- ============================================

ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,human_os,founder_os,gft,global,crm';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 3. Add "my campaigns" alias
-- ============================================

INSERT INTO human_os.aliases (pattern, description, layer, tools_required, actions, priority) VALUES
  ('my campaigns', 'List outreach campaigns', 'public',
   ARRAY['list_campaigns'], '[{"tool": "list_campaigns", "params": {}}]'::jsonb, 182)
ON CONFLICT (pattern, layer) DO UPDATE SET
  description = EXCLUDED.description,
  tools_required = EXCLUDED.tools_required,
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- ============================================
-- 4. Re-apply param fixes (in case 100006 was skipped)
-- ============================================

-- ping aliases: person_name
UPDATE human_os.aliases SET
  actions = '[{"tool": "ping_person", "params": {"person_name": "{name}", "message": "{message}"}}]'::jsonb,
  updated_at = NOW()
WHERE pattern IN ('ping {name} {message}', 'message {name} {message}') AND layer = 'public';

-- reply alias: to_name
UPDATE human_os.aliases SET
  actions = '[{"tool": "reply_message", "params": {"to_name": "{name}", "message": "{message}"}}]'::jsonb,
  updated_at = NOW()
WHERE pattern = 'reply to {name} {message}' AND layer = 'public';

-- email alias: contact + purpose
UPDATE human_os.aliases SET
  actions = '[{"tool": "prepare_email", "params": {"contact": "{person}", "purpose": "{topic}"}}]'::jsonb,
  updated_at = NOW()
WHERE pattern = 'email {person} about {topic}' AND layer = 'public';

-- pipeline aliases: get_pipeline (not get_pipeline_summary)
UPDATE human_os.aliases SET
  tools_required = ARRAY['get_pipeline'],
  actions = '[{"tool": "get_pipeline", "params": {}}]'::jsonb,
  updated_at = NOW()
WHERE pattern IN ('my pipeline', 'my deals') AND layer = 'public';

-- create project called {name}
INSERT INTO human_os.aliases (pattern, description, layer, tools_required, actions, priority) VALUES
  ('create project called {name}', 'Create a new project', 'public',
   ARRAY['create_project'], '[{"tool": "create_project", "params": {"name": "{name}"}}]'::jsonb, 71)
ON CONFLICT (pattern, layer) DO UPDATE SET
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- help / what can I do → list_aliases
UPDATE human_os.aliases SET
  tools_required = ARRAY['list_aliases'],
  actions = '[{"tool": "list_aliases", "params": {"includeDescriptions": true}}]'::jsonb,
  updated_at = NOW()
WHERE pattern IN ('help', 'what can I do') AND layer = 'public';

-- ============================================
-- 5. Ensure all seed aliases exist
--    (in case 100001/100002/100005 were skipped)
-- ============================================

INSERT INTO human_os.aliases (pattern, description, layer, tools_required, actions, priority) VALUES
  ('my priorities', 'Show current priorities', 'public',
   ARRAY['list_priorities'], '[{"tool": "list_priorities", "params": {}}]'::jsonb, 132),
  ('my journal', 'List recent journal entries', 'public',
   ARRAY['list_journal_entries'], '[{"tool": "list_journal_entries", "params": {}}]'::jsonb, 86),
  ('my journal entries', 'List recent journal entries', 'public',
   ARRAY['list_journal_entries'], '[{"tool": "list_journal_entries", "params": {}}]'::jsonb, 87),
  ('start session', 'Load session context', 'public',
   ARRAY['get_session_context'], '[{"tool": "get_session_context", "params": {}}]'::jsonb, 11),
  ('load {mode_name} mode', 'Load a specific mode', 'public',
   ARRAY['load_mode'], '[{"tool": "load_mode", "params": {"mode": "{mode_name}"}}]'::jsonb, 12),
  ('what''s on my plate', 'Show urgent tasks and upcoming meetings', 'public',
   ARRAY['get_urgent_tasks'], '[{"tool": "get_urgent_tasks", "params": {}}]'::jsonb, 21),
  ('my meetings', 'Show upcoming meetings', 'public',
   ARRAY['show_meetings'], '[{"tool": "show_meetings", "params": {}}]'::jsonb, 140),
  ('my calendar', 'Show upcoming meetings', 'public',
   ARRAY['show_meetings'], '[{"tool": "show_meetings", "params": {}}]'::jsonb, 141),
  ('my messages', 'Check pending messages', 'public',
   ARRAY['grab_messages'], '[{"tool": "grab_messages", "params": {}}]'::jsonb, 142),
  ('check messages', 'Check pending messages', 'public',
   ARRAY['grab_messages'], '[{"tool": "grab_messages", "params": {}}]'::jsonb, 143),
  ('my voices', 'List voice profiles', 'public',
   ARRAY['list_voice_profiles'], '[{"tool": "list_voice_profiles", "params": {}}]'::jsonb, 144),
  ('my transcripts', 'List recent transcripts', 'public',
   ARRAY['list_transcripts'], '[{"tool": "list_transcripts", "params": {}}]'::jsonb, 170),
  ('my calls', 'List recent transcripts', 'public',
   ARRAY['list_transcripts'], '[{"tool": "list_transcripts", "params": {}}]'::jsonb, 171),
  ('my identity', 'Get identity profile', 'public',
   ARRAY['get_identity_profile'], '[{"tool": "get_identity_profile", "params": {}}]'::jsonb, 190),
  ('my profile', 'Get identity profile', 'public',
   ARRAY['get_identity_profile'], '[{"tool": "get_identity_profile", "params": {}}]'::jsonb, 191),
  ('my contexts', 'List available contexts', 'public',
   ARRAY['list_contexts'], '[{"tool": "list_contexts", "params": {}}]'::jsonb, 149),
  ('my shares', 'List context shares', 'public',
   ARRAY['list_shares'], '[{"tool": "list_shares", "params": {}}]'::jsonb, 150),
  ('intel requests', 'List intel requests', 'public',
   ARRAY['list_intel_requests'], '[{"tool": "list_intel_requests", "params": {}}]'::jsonb, 151),
  ('my interviews', 'List interview sessions', 'public',
   ARRAY['interview_list'], '[{"tool": "interview_list", "params": {}}]'::jsonb, 152),
  ('my OKRs', 'List OKR goals', 'public',
   ARRAY['list_okr_goals'], '[{"tool": "list_okr_goals", "params": {}}]'::jsonb, 153),
  ('my goals', 'List OKR goals', 'public',
   ARRAY['list_okr_goals'], '[{"tool": "list_okr_goals", "params": {}}]'::jsonb, 154),
  ('my theme', 'Get annual theme history', 'public',
   ARRAY['get_theme_history'], '[{"tool": "get_theme_history", "params": {}}]'::jsonb, 155),
  ('expert categories', 'List expert nomination categories', 'public',
   ARRAY['list_expert_categories'], '[{"tool": "list_expert_categories", "params": {}}]'::jsonb, 201),
  ('experts in {category}', 'Find experts in a category', 'public',
   ARRAY['list_expert_categories'], '[{"tool": "list_expert_categories", "params": {"status": "active"}}]'::jsonb, 200),
  ('schedule {title}', 'Schedule a time block', 'public',
   ARRAY['schedule_time'], '[{"tool": "schedule_time", "params": {"title": "{title}"}}]'::jsonb, 145),
  ('block time for {title}', 'Schedule a time block', 'public',
   ARRAY['schedule_time'], '[{"tool": "schedule_time", "params": {"title": "{title}"}}]'::jsonb, 146),
  ('email {person} about {topic}', 'Prepare an email to someone', 'public',
   ARRAY['prepare_email'], '[{"tool": "prepare_email", "params": {"contact": "{person}", "purpose": "{topic}"}}]'::jsonb, 147),
  ('analyze {text}', 'Analyze text for emotions', 'public',
   ARRAY['analyze_text_emotions'], '[{"tool": "analyze_text_emotions", "params": {"text": "{text}"}}]'::jsonb, 148),
  ('what does {term} mean', 'Look up a term', 'public',
   ARRAY['lookup_term'], '[{"tool": "lookup_term", "params": {"term": "{term}"}}]'::jsonb, 92),
  ('look up {query}', 'Quick search', 'public',
   ARRAY['quick_search'], '[{"tool": "quick_search", "params": {"query": "{query}"}}]'::jsonb, 63),
  ('search for {query}', 'Search across all sources', 'public',
   ARRAY['quick_search'], '[{"tool": "quick_search", "params": {"query": "{query}"}}]'::jsonb, 64),
  ('what do I think about {person}', 'Recall opinions and notes about someone', 'public',
   ARRAY['recall'], '[{"tool": "recall", "params": {"query": "{person}", "type": "opinion"}}]'::jsonb, 160),
  ('what strings do I have tied to {person}', 'Recall string ties for someone', 'public',
   ARRAY['recall'], '[{"tool": "recall", "params": {"query": "{person}", "type": "string_tie"}}]'::jsonb, 161),
  ('create project {name}', 'Create a new project', 'public',
   ARRAY['create_project'], '[{"tool": "create_project", "params": {"name": "{name}"}}]'::jsonb, 72),
  ('new project {name}', 'Create a new project', 'public',
   ARRAY['create_project'], '[{"tool": "create_project", "params": {"name": "{name}"}}]'::jsonb, 73),
  ('list all my outstanding tasks', 'List active tasks', 'public',
   ARRAY['list_all_tasks'], '[{"tool": "list_all_tasks", "params": {}}]'::jsonb, 31),
  ('ping {name} {message}', 'Send a message to someone', 'public',
   ARRAY['ping_person'], '[{"tool": "ping_person", "params": {"person_name": "{name}", "message": "{message}"}}]'::jsonb, 210),
  ('message {name} {message}', 'Send a message to someone', 'public',
   ARRAY['ping_person'], '[{"tool": "ping_person", "params": {"person_name": "{name}", "message": "{message}"}}]'::jsonb, 211),
  ('reply to {name} {message}', 'Reply to a message', 'public',
   ARRAY['reply_message'], '[{"tool": "reply_message", "params": {"to_name": "{name}", "message": "{message}"}}]'::jsonb, 212),
  ('broadcast {message} to {tier}', 'Send group message to a tier', 'public',
   ARRAY['send_group_message'], '[{"tool": "send_group_message", "params": {"message": "{message}", "tier": "{tier}"}}]'::jsonb, 213),
  ('lookup contact {name}', 'Look up a contact', 'public',
   ARRAY['lookup_contacts'], '[{"tool": "lookup_contacts", "params": {"query": "{name}"}}]'::jsonb, 214),
  ('find contact {name}', 'Look up a contact', 'public',
   ARRAY['lookup_contacts'], '[{"tool": "lookup_contacts", "params": {"query": "{name}"}}]'::jsonb, 215),
  ('annual theme', 'Get annual theme history', 'public',
   ARRAY['get_theme_history'], '[{"tool": "get_theme_history", "params": {}}]'::jsonb, 156)
ON CONFLICT (pattern, layer) DO UPDATE SET
  description = EXCLUDED.description,
  tools_required = EXCLUDED.tools_required,
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Remove stale aliases
DELETE FROM human_os.aliases WHERE pattern IN ('db projects', 'db {project} {query}');
