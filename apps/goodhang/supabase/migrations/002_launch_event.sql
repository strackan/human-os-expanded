-- Create the launch event
-- Run this in Supabase SQL Editor after updating the details

INSERT INTO events (
  id,
  title,
  description,
  location,
  event_datetime,
  capacity,
  is_public,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- This is the ID you'll use in the launch page
  'Good Hang Launch Party',
  'Join us for the inaugural Good Hang event — a celebration of connection, community, and the launch of Renubu. Meet the founding members, enjoy drinks and conversation, and learn about what''s next for Good Hang in Raleigh.',
  'TBD - Raleigh, NC', -- UPDATE THIS with actual venue
  '2025-02-15 18:00:00-05:00', -- UPDATE THIS with actual date/time (format: YYYY-MM-DD HH:MM:SS-TZ)
  100, -- UPDATE THIS with actual capacity
  true,
  NOW()
);

-- Verify it was created
SELECT * FROM events WHERE id = '00000000-0000-0000-0000-000000000001';
