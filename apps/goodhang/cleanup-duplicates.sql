-- Find duplicate RSVPs (for review)
SELECT event_id, guest_email, COUNT(*) as count
FROM rsvps
GROUP BY event_id, guest_email
HAVING COUNT(*) > 1;

-- Delete duplicate RSVPs, keeping only the earliest one for each email+event combination
DELETE FROM rsvps
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY event_id, guest_email ORDER BY created_at ASC) as rn
    FROM rsvps
  ) t
  WHERE rn > 1
);

-- Show how many RSVPs remain after cleanup
SELECT COUNT(*) as total_rsvps FROM rsvps;
