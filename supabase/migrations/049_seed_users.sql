-- 049_seed_users.sql
-- Seed initial users for Human OS
-- This is idempotent - safe to run multiple times

-- =============================================================================
-- SEED USERS
-- =============================================================================

-- Insert justin if not exists
INSERT INTO human_os.users (id, slug, display_name, email)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'justin',
  'Justin',
  'justin@human-os.io'
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email;

-- Insert scott if not exists
INSERT INTO human_os.users (id, slug, display_name, email)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid,
  'scott',
  'Scott',
  'scott@human-os.io'
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email;

-- =============================================================================
-- VERIFY
-- =============================================================================
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM human_os.users WHERE slug IN ('justin', 'scott');
  RAISE NOTICE 'Seeded % users (justin, scott)', user_count;
END $$;
