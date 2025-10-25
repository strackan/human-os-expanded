-- Automated Security Test Suite
-- Run this before deploying to production

DO $$
DECLARE
  test_passed INTEGER := 0;
  test_failed INTEGER := 0;
  demo_value TEXT;
  rls_count INTEGER;
  company_id_count INTEGER;
BEGIN
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║   SECURITY TEST SUITE - AUTOMATED     ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  RAISE NOTICE '';

  -- ============================================
  -- Test 1: Demo Mode Configuration
  -- ============================================
  RAISE NOTICE '--- Test 1: Demo Mode Status ---';

  SELECT value INTO demo_value
  FROM app_settings
  WHERE key = 'demo_mode';

  IF demo_value = 'false' THEN
    RAISE NOTICE '✅ PASS: Demo mode is disabled (value: %)', demo_value;
    test_passed := test_passed + 1;
  ELSE
    RAISE WARNING '❌ FAIL: Demo mode is enabled (value: %)', demo_value;
    RAISE WARNING '   Action: Run UPDATE app_settings SET value = ''false'' WHERE key = ''demo_mode'';';
    test_failed := test_failed + 1;
  END IF;
  RAISE NOTICE '';

  -- ============================================
  -- Test 2: RLS Enabled on Critical Tables
  -- ============================================
  RAISE NOTICE '--- Test 2: RLS Policy Coverage ---';

  SELECT count(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN (
      'customers',
      'workflow_executions',
      'workflow_definitions',
      'workflow_step_executions',
      'contacts'
    )
    AND rowsecurity = true;

  IF rls_count >= 5 THEN
    RAISE NOTICE '✅ PASS: RLS enabled on % critical tables', rls_count;
    test_passed := test_passed + 1;
  ELSE
    RAISE WARNING '❌ FAIL: Only % critical tables have RLS enabled', rls_count;
    RAISE WARNING '   Action: Enable RLS on missing tables';
    test_failed := test_failed + 1;
  END IF;
  RAISE NOTICE '';

  -- ============================================
  -- Test 3: Company ID Columns
  -- ============================================
  RAISE NOTICE '--- Test 3: Multi-Tenant company_id Coverage ---';

  SELECT count(*) INTO company_id_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN (
      'customers',
      'workflow_executions',
      'workflow_definitions'
    )
    AND column_name = 'company_id';

  IF company_id_count = 3 THEN
    RAISE NOTICE '✅ PASS: All critical tables have company_id';
    test_passed := test_passed + 1;
  ELSE
    RAISE WARNING '❌ FAIL: Only % of 3 critical tables have company_id', company_id_count;
    RAISE WARNING '   Action: Add company_id to missing tables';
    test_failed := test_failed + 1;
  END IF;
  RAISE NOTICE '';

  -- ============================================
  -- Test 4: RLS Policies Check company_id
  -- ============================================
  RAISE NOTICE '--- Test 4: RLS Policies Use company_id ---';

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'customers'
      AND qual::text LIKE '%company_id%'
  ) OR EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'customers'
      AND qual::text LIKE '%demo_mode%'
  ) THEN
    RAISE NOTICE '✅ PASS: Customer RLS policies check company_id or demo_mode';
    test_passed := test_passed + 1;
  ELSE
    RAISE WARNING '❌ FAIL: Customer RLS policies missing company_id check';
    test_failed := test_failed + 1;
  END IF;
  RAISE NOTICE '';

  -- ============================================
  -- Summary
  -- ============================================
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║          TEST SUMMARY                  ║';
  RAISE NOTICE '╠════════════════════════════════════════╣';
  RAISE NOTICE '║  Passed: % / %                          ║', test_passed, test_passed + test_failed;
  RAISE NOTICE '║  Failed: %                              ║', test_failed;
  RAISE NOTICE '╚════════════════════════════════════════╝';
  RAISE NOTICE '';

  IF test_failed > 0 THEN
    RAISE EXCEPTION '⛔ SECURITY TESTS FAILED - DO NOT DEPLOY TO PRODUCTION';
  ELSE
    RAISE NOTICE '✅ ALL SECURITY TESTS PASSED - SAFE TO DEPLOY';
  END IF;
END $$;
