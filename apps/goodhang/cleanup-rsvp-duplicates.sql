-- Delete duplicate RSVPs, keeping only the oldest record per (event_id, guest_email)
DELETE FROM rsvps
WHERE id NOT IN (
  SELECT DISTINCT ON (event_id, guest_email) id
  FROM rsvps
  WHERE guest_email IS NOT NULL
  ORDER BY event_id, guest_email, created_at ASC
);
