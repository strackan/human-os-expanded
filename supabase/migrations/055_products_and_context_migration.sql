-- 055_products_and_context_migration.sql
-- Add products table, add product_id to context, migrate data from founder_os.contexts

-- =============================================================================
-- PRODUCTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS human_os.products (
  id TEXT PRIMARY KEY,  -- slug-style ID: 'founder_os', 'renubu', 'gft'
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed products
INSERT INTO human_os.products (id, name, description) VALUES
  ('human_os', 'Human OS', 'Core platform - identity, entities, context, knowledge graph'),
  ('founder_os', 'Founder OS', 'Personal executive system for founders - tasks, goals, planning'),
  ('renubu', 'Renubu', 'B2B SaaS for Customer Success - workflow automation'),
  ('gft', 'Guy for That', 'Relationship intelligence platform'),
  ('voice_os', 'Voice OS', 'Voice interface and profiles')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ADD PRODUCT_ID TO CONTEXT TABLE
-- =============================================================================

ALTER TABLE human_os.context
ADD COLUMN IF NOT EXISTS product_id TEXT REFERENCES human_os.products(id);

-- Default existing rows to 'founder_os' (since that's where old contexts came from)
UPDATE human_os.context SET product_id = 'founder_os' WHERE product_id IS NULL;

-- Make it required going forward
ALTER TABLE human_os.context ALTER COLUMN product_id SET DEFAULT 'human_os';

-- Index for product filtering
CREATE INDEX IF NOT EXISTS idx_context_product ON human_os.context(product_id);

-- =============================================================================
-- MIGRATE DATA FROM founder_os.contexts
-- =============================================================================

-- The old contexts table has: id, user_id, name, description, color, icon, status, created_at, updated_at
-- We'll create context entries where the context itself is the "object" being described
-- context_slug = slugified name, notes = description

INSERT INTO human_os.context (
  object_uuid,
  object_type,
  context_slug,
  notes,
  status,
  active,
  layer,
  product_id,
  created_at,
  updated_at
)
SELECT
  id as object_uuid,  -- The context's own ID becomes the object
  'context_definition' as object_type,  -- Meta: this defines the context itself
  LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) as context_slug,
  COALESCE(description, name) as notes,
  COALESCE(status, 'active') as status,
  COALESCE(status = 'active', true) as active,
  'founder:justin' as layer,  -- All old contexts were for Justin
  'founder_os' as product_id,
  created_at,
  updated_at
FROM founder_os.contexts
ON CONFLICT (layer, object_uuid, context_slug) DO NOTHING;

-- =============================================================================
-- UPDATE HELPER FUNCTIONS TO SUPPORT PRODUCT_ID
-- =============================================================================

-- Get all context for a specific object (with optional product filter)
CREATE OR REPLACE FUNCTION human_os.get_object_context(
  p_object_uuid UUID,
  p_layer TEXT DEFAULT 'public',
  p_product_id TEXT DEFAULT NULL,
  p_active_only BOOLEAN DEFAULT true
) RETURNS TABLE (
  id UUID,
  context_slug TEXT,
  notes TEXT,
  status TEXT,
  active BOOLEAN,
  product_id TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) LANGUAGE sql STABLE AS $$
  SELECT id, context_slug, notes, status, active, product_id, created_at, updated_at
  FROM human_os.context
  WHERE object_uuid = p_object_uuid
    AND (layer = 'public' OR layer = p_layer)
    AND (p_product_id IS NULL OR product_id = p_product_id)
    AND (NOT p_active_only OR active = true)
  ORDER BY context_slug;
$$;

-- Get all objects in a context (with optional product filter)
CREATE OR REPLACE FUNCTION human_os.get_context_members(
  p_context_slug TEXT,
  p_layer TEXT DEFAULT 'public',
  p_product_id TEXT DEFAULT NULL,
  p_object_type TEXT DEFAULT NULL,
  p_active_only BOOLEAN DEFAULT true
) RETURNS TABLE (
  id UUID,
  object_uuid UUID,
  object_type TEXT,
  notes TEXT,
  status TEXT,
  active BOOLEAN,
  product_id TEXT
) LANGUAGE sql STABLE AS $$
  SELECT id, object_uuid, object_type, notes, status, active, product_id
  FROM human_os.context
  WHERE context_slug = p_context_slug
    AND (layer = 'public' OR layer = p_layer)
    AND (p_product_id IS NULL OR product_id = p_product_id)
    AND (p_object_type IS NULL OR object_type = p_object_type)
    AND (NOT p_active_only OR active = true)
  ORDER BY object_type, created_at;
$$;

-- List all context slugs (with optional product filter)
CREATE OR REPLACE FUNCTION human_os.list_context_slugs(
  p_layer TEXT DEFAULT 'public',
  p_product_id TEXT DEFAULT NULL,
  p_active_only BOOLEAN DEFAULT true
) RETURNS TABLE (
  context_slug TEXT,
  member_count BIGINT,
  object_types TEXT[],
  product_ids TEXT[]
) LANGUAGE sql STABLE AS $$
  SELECT
    context_slug,
    COUNT(*) as member_count,
    ARRAY_AGG(DISTINCT object_type) as object_types,
    ARRAY_AGG(DISTINCT product_id) as product_ids
  FROM human_os.context
  WHERE (layer = 'public' OR layer = p_layer)
    AND (p_product_id IS NULL OR product_id = p_product_id)
    AND (NOT p_active_only OR active = true)
  GROUP BY context_slug
  ORDER BY context_slug;
$$;

-- Add or update context for an object (with product_id)
CREATE OR REPLACE FUNCTION human_os.set_context(
  p_object_uuid UUID,
  p_object_type TEXT,
  p_context_slug TEXT,
  p_notes TEXT DEFAULT NULL,
  p_layer TEXT DEFAULT 'public',
  p_product_id TEXT DEFAULT 'human_os',
  p_active BOOLEAN DEFAULT true
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO human_os.context (object_uuid, object_type, context_slug, notes, layer, product_id, active, status)
  VALUES (p_object_uuid, p_object_type, p_context_slug, p_notes, p_layer, p_product_id, p_active,
          CASE WHEN p_active THEN 'active' ELSE 'inactive' END)
  ON CONFLICT (layer, object_uuid, context_slug) DO UPDATE SET
    notes = COALESCE(EXCLUDED.notes, human_os.context.notes),
    product_id = EXCLUDED.product_id,
    active = EXCLUDED.active,
    status = CASE WHEN EXCLUDED.active THEN 'active' ELSE 'inactive' END,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- =============================================================================
-- GRANTS FOR PRODUCTS TABLE
-- =============================================================================

GRANT SELECT ON human_os.products TO authenticated;
GRANT ALL ON human_os.products TO service_role;

-- =============================================================================
-- VERIFY MIGRATION
-- =============================================================================

DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count FROM founder_os.contexts;
  SELECT COUNT(*) INTO new_count FROM human_os.context WHERE object_type = 'context_definition';
  RAISE NOTICE 'Migrated % of % contexts from founder_os.contexts to human_os.context', new_count, old_count;
END $$;
