-- =============================================================================
-- P2: Seed aliases for working tools that have no alias
-- Covers: meetings, messages, voices, scheduling, email, emotions,
--         contexts, shares, intel, interviews, OKRs, themes
-- =============================================================================

INSERT INTO human_os.aliases (pattern, description, layer, tools_required, actions, priority) VALUES

  -- Calendar / Meetings
  ('my meetings', 'Show upcoming meetings', 'public',
   ARRAY['show_meetings'], '[{"tool": "show_meetings", "params": {}}]'::jsonb, 140),

  ('my calendar', 'Show upcoming meetings', 'public',
   ARRAY['show_meetings'], '[{"tool": "show_meetings", "params": {}}]'::jsonb, 141),

  -- Messaging
  ('my messages', 'Check pending messages', 'public',
   ARRAY['grab_messages'], '[{"tool": "grab_messages", "params": {}}]'::jsonb, 142),

  ('check messages', 'Check pending messages', 'public',
   ARRAY['grab_messages'], '[{"tool": "grab_messages", "params": {}}]'::jsonb, 143),

  -- Voice Profiles
  ('my voices', 'List voice profiles', 'public',
   ARRAY['list_voice_profiles'], '[{"tool": "list_voice_profiles", "params": {}}]'::jsonb, 144),

  -- Scheduling
  ('schedule {title}', 'Schedule a time block', 'public',
   ARRAY['schedule_time'], '[{"tool": "schedule_time", "params": {"title": "{title}"}}]'::jsonb, 145),

  ('block time for {title}', 'Schedule a time block', 'public',
   ARRAY['schedule_time'], '[{"tool": "schedule_time", "params": {"title": "{title}"}}]'::jsonb, 146),

  -- Email
  ('email {person} about {topic}', 'Prepare an email to someone', 'public',
   ARRAY['prepare_email'], '[{"tool": "prepare_email", "params": {"person": "{person}", "topic": "{topic}"}}]'::jsonb, 147),

  -- Emotion Analysis
  ('analyze {text}', 'Analyze text for emotions', 'public',
   ARRAY['analyze_text_emotions'], '[{"tool": "analyze_text_emotions", "params": {"text": "{text}"}}]'::jsonb, 148),

  -- Contexts
  ('my contexts', 'List available contexts', 'public',
   ARRAY['list_contexts'], '[{"tool": "list_contexts", "params": {}}]'::jsonb, 149),

  -- Sharing
  ('my shares', 'List context shares', 'public',
   ARRAY['list_shares'], '[{"tool": "list_shares", "params": {}}]'::jsonb, 150),

  -- Intel
  ('intel requests', 'List intel requests', 'public',
   ARRAY['list_intel_requests'], '[{"tool": "list_intel_requests", "params": {}}]'::jsonb, 151),

  -- Interviews
  ('my interviews', 'List interview sessions', 'public',
   ARRAY['interview_list'], '[{"tool": "interview_list", "params": {}}]'::jsonb, 152),

  -- OKRs / Goals
  ('my OKRs', 'List OKR goals', 'public',
   ARRAY['list_okr_goals'], '[{"tool": "list_okr_goals", "params": {}}]'::jsonb, 153),

  ('my goals', 'List OKR goals', 'public',
   ARRAY['list_okr_goals'], '[{"tool": "list_okr_goals", "params": {}}]'::jsonb, 154),

  -- Theme
  ('my theme', 'Get annual theme history', 'public',
   ARRAY['get_theme_history'], '[{"tool": "get_theme_history", "params": {}}]'::jsonb, 155),

  ('annual theme', 'Get annual theme history', 'public',
   ARRAY['get_theme_history'], '[{"tool": "get_theme_history", "params": {}}]'::jsonb, 156),

  -- Expert categories (short form)
  ('expert categories', 'List expert nomination categories', 'public',
   ARRAY['list_expert_categories'], '[{"tool": "list_expert_categories", "params": {}}]'::jsonb, 201)

ON CONFLICT (pattern, layer) DO UPDATE SET
  description = EXCLUDED.description,
  tools_required = EXCLUDED.tools_required,
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority,
  updated_at = NOW();
