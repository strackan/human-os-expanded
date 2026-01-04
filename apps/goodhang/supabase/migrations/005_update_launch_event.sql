-- Update the launch event with actual details
-- November 13, 2025 Scavenger Hunt

UPDATE events
SET
  title = 'Good Hang Launch Party - Downtown Cary Scavenger Hunt',
  description = 'Join us for the inaugural Good Hang event — an adventure through Downtown Cary! We''ll start at The Williams House with drinks and introductions, then embark on a scavenger hunt through 4 bars with clues and challenges. The evening culminates at a Secret VIP Party.

Perfect for CS leaders, tech founders, and interesting humans who want to connect over adventure and great conversation.

📍 Meet at 5:00 PM | 🚀 Caravan departs 6:00 PM SHARP',
  location = 'The Williams House Cary, 210 E Chatham St, Cary, NC 27511',
  location_lat = 35.7915,
  location_lng = -78.7811,
  event_datetime = '2025-11-13 17:00:00-05:00', -- November 13, 2025 at 5:00 PM EST
  capacity = 50, -- Adjust based on your venue capacity
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verify the update
SELECT
  id,
  title,
  location,
  event_datetime,
  capacity,
  description
FROM events
WHERE id = '00000000-0000-0000-0000-000000000001';
