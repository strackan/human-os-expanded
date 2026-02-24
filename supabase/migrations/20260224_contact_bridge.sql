-- ============================================
-- Contact Bridge (#12)
-- Auto-bridge trigger: gft.contacts/companies → entities
-- Unified contact/company access layer.
-- ============================================

-- =============================================================================
-- AUTO-BRIDGE TRIGGER FOR gft.contacts → entities
-- =============================================================================

CREATE OR REPLACE FUNCTION gft.bridge_contact_to_entity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_slug TEXT;
  v_entity_id UUID;
BEGIN
  -- Only fire when entity_id is NULL
  IF NEW.entity_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Generate slug from name
  v_slug := lower(regexp_replace(trim(NEW.name), '\s+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '[^a-z0-9-]', '', 'g');

  -- Try to find existing entity by slug or email
  SELECT id INTO v_entity_id
  FROM entities
  WHERE entity_type = 'person'
    AND (
      slug = v_slug
      OR (NEW.email IS NOT NULL AND email = NEW.email)
    )
  LIMIT 1;

  -- If not found, create one
  IF v_entity_id IS NULL THEN
    INSERT INTO entities (slug, entity_type, name, email, owner_id, source_system, privacy_scope)
    VALUES (
      v_slug,
      'person',
      NEW.name,
      NEW.email,
      NEW.owner_id,
      'guyforthat',
      'private'
    )
    ON CONFLICT (slug) DO UPDATE SET
      email = COALESCE(entities.email, EXCLUDED.email),
      updated_at = NOW()
    RETURNING id INTO v_entity_id;
  END IF;

  -- Set entity_id on the contact row
  NEW.entity_id := v_entity_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bridge_contact_entity ON gft.contacts;
CREATE TRIGGER bridge_contact_entity
  BEFORE INSERT OR UPDATE ON gft.contacts
  FOR EACH ROW EXECUTE FUNCTION gft.bridge_contact_to_entity();

-- =============================================================================
-- AUTO-BRIDGE TRIGGER FOR gft.companies → entities
-- =============================================================================

CREATE OR REPLACE FUNCTION gft.bridge_company_to_entity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_slug TEXT;
  v_entity_id UUID;
BEGIN
  IF NEW.entity_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_slug := lower(regexp_replace(trim(NEW.name), '\s+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '[^a-z0-9-]', '', 'g');

  SELECT id INTO v_entity_id
  FROM entities
  WHERE entity_type = 'company'
    AND slug = v_slug
  LIMIT 1;

  IF v_entity_id IS NULL THEN
    INSERT INTO entities (slug, entity_type, name, owner_id, source_system, privacy_scope, metadata)
    VALUES (
      v_slug,
      'company',
      NEW.name,
      NEW.owner_id,
      'guyforthat',
      'private',
      COALESCE(NEW.profile_data, '{}'::jsonb)
    )
    ON CONFLICT (slug) DO UPDATE SET
      updated_at = NOW()
    RETURNING id INTO v_entity_id;
  END IF;

  NEW.entity_id := v_entity_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bridge_company_entity ON gft.companies;
CREATE TRIGGER bridge_company_entity
  BEFORE INSERT OR UPDATE ON gft.companies
  FOR EACH ROW EXECUTE FUNCTION gft.bridge_company_to_entity();

-- =============================================================================
-- BACKFILL: Touch existing contacts/companies so trigger fires
-- Run this after creating the triggers to bridge existing data.
-- =============================================================================

-- Backfill contacts without entity_id
UPDATE gft.contacts SET updated_at = NOW() WHERE entity_id IS NULL;

-- Backfill companies without entity_id
UPDATE gft.companies SET updated_at = NOW() WHERE entity_id IS NULL;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION gft.bridge_contact_to_entity IS 'Auto-bridge: find/create entity for GFT contact';
COMMENT ON FUNCTION gft.bridge_company_to_entity IS 'Auto-bridge: find/create entity for GFT company';

NOTIFY pgrst, 'reload config';
