-- 061_relationships_entity_link.sql
-- Fix relationships table to properly link to entities
-- Also adds relationship_type column for better categorization

-- =============================================================================
-- ADD ENTITY_ID COLUMN
-- =============================================================================

ALTER TABLE founder_os.relationships
  ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_relationships_entity ON founder_os.relationships(entity_id);

COMMENT ON COLUMN founder_os.relationships.entity_id IS
  'Link to entities table. Preferred over name field for proper entity resolution.';

-- =============================================================================
-- ADD RELATIONSHIP_TYPE FOR BETTER CATEGORIZATION
-- =============================================================================

-- The existing 'relationship' column is free text. Add a typed column for filtering.
ALTER TABLE founder_os.relationships
  ADD COLUMN IF NOT EXISTS relationship_type TEXT
  CHECK (relationship_type IN (
    'family',
    'friend',
    'colleague',
    'investor',
    'advisor',
    'mentor',
    'mentee',
    'client',
    'vendor',
    'partner',
    'acquaintance',
    'other'
  ));

CREATE INDEX IF NOT EXISTS idx_relationships_type ON founder_os.relationships(relationship_type);

COMMENT ON COLUMN founder_os.relationships.relationship_type IS
  'Categorized relationship type for filtering. Free-text "relationship" column preserved for user description.';

-- =============================================================================
-- ADD CONTACT DUE TRACKING
-- =============================================================================

-- Computed column for when next contact is "due" based on frequency
ALTER TABLE founder_os.relationships
  ADD COLUMN IF NOT EXISTS next_contact_due DATE;

-- Function to calculate next contact due date
CREATE OR REPLACE FUNCTION founder_os.calculate_next_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_contact IS NOT NULL AND NEW.contact_frequency_days IS NOT NULL THEN
    NEW.next_contact_due := NEW.last_contact + (NEW.contact_frequency_days || ' days')::interval;
  ELSE
    NEW.next_contact_due := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate next_contact_due
DROP TRIGGER IF EXISTS relationships_calculate_due ON founder_os.relationships;
CREATE TRIGGER relationships_calculate_due
  BEFORE INSERT OR UPDATE OF last_contact, contact_frequency_days ON founder_os.relationships
  FOR EACH ROW EXECUTE FUNCTION founder_os.calculate_next_contact();

CREATE INDEX IF NOT EXISTS idx_relationships_next_due ON founder_os.relationships(next_contact_due)
  WHERE next_contact_due IS NOT NULL;

COMMENT ON COLUMN founder_os.relationships.next_contact_due IS
  'Auto-calculated: last_contact + contact_frequency_days. Null if either is missing.';

-- =============================================================================
-- HELPER FUNCTION: Get overdue relationships
-- =============================================================================

CREATE OR REPLACE FUNCTION founder_os.get_overdue_relationships(
  p_user_id UUID,
  p_days_overdue INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  entity_id UUID,
  relationship TEXT,
  relationship_type TEXT,
  last_contact DATE,
  days_overdue INTEGER,
  contact_frequency_days INTEGER,
  notes TEXT,
  sentiment TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    r.id,
    COALESCE(e.name, r.name) as name,
    r.entity_id,
    r.relationship,
    r.relationship_type,
    r.last_contact,
    (CURRENT_DATE - r.next_contact_due)::INTEGER as days_overdue,
    r.contact_frequency_days,
    r.notes,
    r.sentiment
  FROM founder_os.relationships r
  LEFT JOIN entities e ON r.entity_id = e.id
  WHERE r.user_id = p_user_id
    AND r.next_contact_due IS NOT NULL
    AND r.next_contact_due <= CURRENT_DATE - p_days_overdue
  ORDER BY r.next_contact_due ASC;
$$;

GRANT EXECUTE ON FUNCTION founder_os.get_overdue_relationships TO authenticated, service_role;

-- =============================================================================
-- HELPER FUNCTION: Search relationships
-- =============================================================================

CREATE OR REPLACE FUNCTION founder_os.search_relationships(
  p_user_id UUID,
  p_query TEXT DEFAULT NULL,
  p_relationship_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  entity_id UUID,
  entity_email TEXT,
  relationship TEXT,
  relationship_type TEXT,
  last_contact DATE,
  next_contact_due DATE,
  notes TEXT,
  sentiment TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    r.id,
    COALESCE(e.name, r.name) as name,
    r.entity_id,
    e.email as entity_email,
    r.relationship,
    r.relationship_type,
    r.last_contact,
    r.next_contact_due,
    r.notes,
    r.sentiment
  FROM founder_os.relationships r
  LEFT JOIN entities e ON r.entity_id = e.id
  WHERE r.user_id = p_user_id
    AND (p_query IS NULL OR COALESCE(e.name, r.name) ILIKE '%' || p_query || '%')
    AND (p_relationship_type IS NULL OR r.relationship_type = p_relationship_type)
  ORDER BY COALESCE(e.name, r.name);
$$;

GRANT EXECUTE ON FUNCTION founder_os.search_relationships TO authenticated, service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION founder_os.get_overdue_relationships IS
  'Get relationships where contact is overdue (next_contact_due < today).';

COMMENT ON FUNCTION founder_os.search_relationships IS
  'Search relationships by name or filter by type.';
