-- Add invite code system and cross-app user linking
-- This allows contacts to be invited, and profiles to reference contact records

-- Add fields to contacts table for user linking and invites
ALTER TABLE public.contacts
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN invite_code text UNIQUE,
ADD COLUMN invite_used_at timestamp with time zone,
ADD COLUMN invite_sent_at timestamp with time zone;

-- Add field to profiles table to link back to contacts
ALTER TABLE public.profiles
ADD COLUMN contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_invite_code ON public.contacts(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX idx_profiles_contact_id ON public.profiles(contact_id);

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code (uppercase for readability)
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM contacts WHERE invite_code = code) INTO code_exists;

    -- If unique, return it
    IF NOT code_exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Function to auto-generate invite codes for new contacts
CREATE OR REPLACE FUNCTION auto_generate_invite_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate if invite_code is not already set
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate invite codes on contact creation
CREATE TRIGGER contacts_auto_invite_code
BEFORE INSERT ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION auto_generate_invite_code();

-- Generate invite codes for existing contacts that don't have them
UPDATE public.contacts
SET invite_code = generate_invite_code()
WHERE invite_code IS NULL;

-- Add comment documentation
COMMENT ON COLUMN contacts.user_id IS 'Links to auth.users when contact signs up';
COMMENT ON COLUMN contacts.invite_code IS 'Unique code for inviting contact to join (auto-generated)';
COMMENT ON COLUMN contacts.invite_used_at IS 'Timestamp when invite code was used to create account';
COMMENT ON COLUMN contacts.invite_sent_at IS 'Timestamp when invite was sent to contact';
COMMENT ON COLUMN profiles.contact_id IS 'Links to contacts record for CRM integration';
