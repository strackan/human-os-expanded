-- Verify Multi-Tenant Isolation
-- Purpose: Test that company_id properly isolates data

-- List all tables that should have company_id
SELECT
  t.tablename,
  CASE
    WHEN c.column_name IS NOT NULL THEN '✅ HAS company_id'
    ELSE '❌ MISSING company_id'
  END as status
FROM pg_tables t
LEFT JOIN information_schema.columns c
  ON c.table_name = t.tablename
  AND c.column_name = 'company_id'
  AND c.table_schema = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename NOT IN (
    'app_settings',
    'profiles',  -- May link to companies via FK
    'companies',
    'workflow_chat_branches',  -- Template data
    'saved_actions'  -- Global actions
  )
ORDER BY status DESC, t.tablename;

-- Check critical user-data tables
DO $$
DECLARE
  critical_tables TEXT[] := ARRAY[
    'customers',
    'workflow_executions',
    'workflow_definitions',
    'workflow_step_executions',
    'workflow_chat_threads',
    'workflow_chat_messages',
    'contacts',
    'contracts'
  ];
  tbl TEXT;
  has_column BOOLEAN;
BEGIN
  RAISE NOTICE '=== CRITICAL TABLE COMPANY_ID CHECK ===';

  FOREACH tbl IN ARRAY critical_tables
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND column_name = 'company_id'
    ) INTO has_column;

    IF has_column THEN
      RAISE NOTICE '✅ % has company_id', tbl;
    ELSE
      RAISE WARNING '❌ % MISSING company_id - SECURITY RISK!', tbl;
    END IF;
  END LOOP;
END $$;
