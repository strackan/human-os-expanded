-- Add unique constraint to prevent duplicate RSVPs from same email for same event
-- This ensures that each email can only RSVP once per event
-- Same email can still RSVP to different events

-- Add unique constraint on (event_id, guest_email) combination
ALTER TABLE rsvps
ADD CONSTRAINT unique_rsvp_per_email_per_event
UNIQUE (event_id, guest_email);

-- Also add unique constraint for authenticated users
-- This prevents the same user from RSVPing multiple times even if they change their email
-- Using partial unique index for conditional uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS unique_rsvp_per_user_per_event
ON rsvps (event_id, user_id)
WHERE user_id IS NOT NULL;
