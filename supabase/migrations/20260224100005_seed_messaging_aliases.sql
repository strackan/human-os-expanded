-- =============================================================================
-- Messaging / send() aliases
-- Covers: ping_person, reply_message, send_group_message, lookup_contacts
-- =============================================================================

INSERT INTO human_os.aliases (pattern, description, layer, tools_required, actions, priority) VALUES

  -- Ping / message someone (tool expects person_name, not name)
  ('ping {name} {message}', 'Send a message to someone', 'public',
   ARRAY['ping_person'], '[{"tool": "ping_person", "params": {"person_name": "{name}", "message": "{message}"}}]'::jsonb, 210),

  ('message {name} {message}', 'Send a message to someone', 'public',
   ARRAY['ping_person'], '[{"tool": "ping_person", "params": {"person_name": "{name}", "message": "{message}"}}]'::jsonb, 211),

  -- Reply (tool expects to_name, not name)
  ('reply to {name} {message}', 'Reply to a message', 'public',
   ARRAY['reply_message'], '[{"tool": "reply_message", "params": {"to_name": "{name}", "message": "{message}"}}]'::jsonb, 212),

  -- Broadcast
  ('broadcast {message} to {tier}', 'Send group message to a tier', 'public',
   ARRAY['send_group_message'], '[{"tool": "send_group_message", "params": {"message": "{message}", "tier": "{tier}"}}]'::jsonb, 213),

  -- Contact lookup
  ('lookup contact {name}', 'Look up a contact', 'public',
   ARRAY['lookup_contacts'], '[{"tool": "lookup_contacts", "params": {"query": "{name}"}}]'::jsonb, 214),

  ('find contact {name}', 'Look up a contact', 'public',
   ARRAY['lookup_contacts'], '[{"tool": "lookup_contacts", "params": {"query": "{name}"}}]'::jsonb, 215)

ON CONFLICT (pattern, layer) DO UPDATE SET
  description = EXCLUDED.description,
  tools_required = EXCLUDED.tools_required,
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority,
  updated_at = NOW();
