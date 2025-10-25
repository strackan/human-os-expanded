-- Production Deployment Security Checklist
-- Run this before deploying to production

-- 1. Check demo mode status
DO $$
DECLARE
  demo_enabled BOOLEAN;
BEGIN
  SELECT value::boolean INTO demo_enabled
  FROM app_settings WHERE key = 'demo_mode';

  IF demo_enabled THEN
    RAISE EXCEPTION 'DEPLOYMENT BLOCKED: Demo mode is ENABLED. Run: UPDATE app_settings SET value = ''false'' WHERE key = ''demo_mode'';';
  ELSE
    RAISE NOTICE '✅ Demo mode is disabled';
  END IF;
END $$;

-- 2. Verify all critical tables have RLS enabled
DO $$
DECLARE
  table_name TEXT;
  tables_without_rls TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('app_settings', 'companies')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND rowsecurity = true
    ) THEN
      tables_without_rls := array_append(tables_without_rls, table_name);
    END IF;
  END LOOP;

  IF array_length(tables_without_rls, 1) > 0 THEN
    RAISE WARNING 'Tables without RLS: %', tables_without_rls;
  ELSE
    RAISE NOTICE '✅ All tables have RLS enabled';
  END IF;
END $$;

-- 3. Verify company_id columns exist
DO $$
DECLARE
  critical_tables TEXT[] := ARRAY[
    'customers',
    'workflow_executions',
    'workflow_definitions'
  ];
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY critical_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND column_name = 'company_id'
    ) THEN
      missing_tables := array_append(missing_tables, tbl);
    END IF;
  END LOOP;

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'DEPLOYMENT BLOCKED: Tables missing company_id: %', missing_tables;
  ELSE
    RAISE NOTICE '✅ All critical tables have company_id';
  END IF;
END $$;

-- 4. Production readiness summary
SELECT '=== PRODUCTION READINESS SUMMARY ===' as status;
SELECT
  CASE value::boolean
    WHEN false THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as demo_mode_check,
  'Demo mode disabled' as requirement
FROM app_settings WHERE key = 'demo_mode';

SELECT
  count(*) as total_tables,
  count(*) FILTER (WHERE rowsecurity) as tables_with_rls,
  count(*) FILTER (WHERE NOT rowsecurity) as tables_without_rls
FROM pg_tables
WHERE schemaname = 'public';
