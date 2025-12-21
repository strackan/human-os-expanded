-- GFT Migration: Contact Tiers
-- YOUR relationship data - how you categorize contacts (not canonical entity data)

-- =============================================================================
-- TIER ENUM
-- Inner 5 → Key 50 → Network 500 → Outer (everyone else)
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE gft.contact_tier AS ENUM ('inner_5', 'key_50', 'network_500', 'outer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- ADD TIER COLUMNS TO CONTACTS
-- =============================================================================

-- Tier classification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'tier'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN tier gft.contact_tier DEFAULT 'outer';
  END IF;
END $$;

-- Custom labels/tags (your personal categorization)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'custom_labels'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN custom_labels TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Private notes (your notes, never shared)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'private_notes'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN private_notes TEXT;
  END IF;
END $$;

-- Last interaction date (for relationship health tracking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'last_interaction_at'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN last_interaction_at TIMESTAMPTZ;
  END IF;
END $$;

-- Next follow-up date (when to reach out)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gft' AND table_name = 'contacts' AND column_name = 'next_followup_at'
  ) THEN
    ALTER TABLE gft.contacts ADD COLUMN next_followup_at TIMESTAMPTZ;
  END IF;
END $$;

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_gft_contacts_tier ON gft.contacts(tier);
CREATE INDEX IF NOT EXISTS idx_gft_contacts_custom_labels ON gft.contacts USING GIN(custom_labels);
CREATE INDEX IF NOT EXISTS idx_gft_contacts_last_interaction ON gft.contacts(last_interaction_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_gft_contacts_next_followup ON gft.contacts(next_followup_at ASC NULLS LAST);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get contacts by tier
CREATE OR REPLACE FUNCTION gft.get_contacts_by_tier(
  p_owner_id UUID,
  p_tier gft.contact_tier
) RETURNS SETOF gft.contacts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM gft.contacts
  WHERE owner_id = p_owner_id
    AND tier = p_tier
  ORDER BY canonical_name ASC;
END;
$$ LANGUAGE plpgsql;

-- Get contacts needing follow-up
CREATE OR REPLACE FUNCTION gft.get_contacts_needing_followup(
  p_owner_id UUID,
  p_days_overdue INTEGER DEFAULT 0
) RETURNS SETOF gft.contacts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM gft.contacts
  WHERE owner_id = p_owner_id
    AND next_followup_at IS NOT NULL
    AND next_followup_at <= (NOW() + (p_days_overdue || ' days')::INTERVAL)
  ORDER BY next_followup_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Update contact tier
CREATE OR REPLACE FUNCTION gft.set_contact_tier(
  p_contact_id UUID,
  p_tier gft.contact_tier
) RETURNS gft.contacts AS $$
DECLARE
  v_contact gft.contacts;
BEGIN
  UPDATE gft.contacts
  SET tier = p_tier,
      updated_at = NOW()
  WHERE id = p_contact_id
  RETURNING * INTO v_contact;

  RETURN v_contact;
END;
$$ LANGUAGE plpgsql;

-- Add label to contact
CREATE OR REPLACE FUNCTION gft.add_contact_label(
  p_contact_id UUID,
  p_label TEXT
) RETURNS gft.contacts AS $$
DECLARE
  v_contact gft.contacts;
BEGIN
  UPDATE gft.contacts
  SET custom_labels = array_append(
    COALESCE(custom_labels, '{}'),
    p_label
  ),
      updated_at = NOW()
  WHERE id = p_contact_id
    AND NOT (COALESCE(custom_labels, '{}') @> ARRAY[p_label])
  RETURNING * INTO v_contact;

  RETURN v_contact;
END;
$$ LANGUAGE plpgsql;

-- Remove label from contact
CREATE OR REPLACE FUNCTION gft.remove_contact_label(
  p_contact_id UUID,
  p_label TEXT
) RETURNS gft.contacts AS $$
DECLARE
  v_contact gft.contacts;
BEGIN
  UPDATE gft.contacts
  SET custom_labels = array_remove(custom_labels, p_label),
      updated_at = NOW()
  WHERE id = p_contact_id
  RETURNING * INTO v_contact;

  RETURN v_contact;
END;
$$ LANGUAGE plpgsql;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION gft.get_contacts_by_tier TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION gft.get_contacts_needing_followup TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION gft.set_contact_tier TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION gft.add_contact_label TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION gft.remove_contact_label TO authenticated, service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN gft.contacts.tier IS 'Relationship tier: inner_5, key_50, network_500, outer';
COMMENT ON COLUMN gft.contacts.custom_labels IS 'Your personal tags/labels for this contact';
COMMENT ON COLUMN gft.contacts.private_notes IS 'Your private notes (never shared)';
COMMENT ON COLUMN gft.contacts.last_interaction_at IS 'When you last interacted with this contact';
COMMENT ON COLUMN gft.contacts.next_followup_at IS 'When to follow up with this contact';

COMMENT ON FUNCTION gft.get_contacts_by_tier IS 'Get all contacts in a specific tier';
COMMENT ON FUNCTION gft.get_contacts_needing_followup IS 'Get contacts with overdue or upcoming follow-ups';
COMMENT ON FUNCTION gft.set_contact_tier IS 'Update a contact tier';
COMMENT ON FUNCTION gft.add_contact_label IS 'Add a custom label to a contact';
COMMENT ON FUNCTION gft.remove_contact_label IS 'Remove a custom label from a contact';
