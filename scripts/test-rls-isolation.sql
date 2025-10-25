-- Test RLS Isolation Between Companies
-- Purpose: Verify users can only see their company's data

-- Setup test scenario
DO $$
DECLARE
  company_a_id UUID;
  company_b_id UUID;
  user_a_id UUID;
  user_b_id UUID;
BEGIN
  -- Create two test companies
  INSERT INTO public.companies (name, domain)
  VALUES ('Test Company A', 'company-a.test')
  RETURNING id INTO company_a_id;

  INSERT INTO public.companies (name, domain)
  VALUES ('Test Company B', 'company-b.test')
  RETURNING id INTO company_b_id;

  RAISE NOTICE 'Company A ID: %', company_a_id;
  RAISE NOTICE 'Company B ID: %', company_b_id;

  -- Note: Actual user creation requires auth.users
  -- This is documented for manual testing
  RAISE NOTICE 'Manual testing required:';
  RAISE NOTICE '1. Create user in Company A via Supabase dashboard';
  RAISE NOTICE '2. Create user in Company B via Supabase dashboard';
  RAISE NOTICE '3. Sign in as User A and verify cannot see Company B data';
  RAISE NOTICE '4. Sign in as User B and verify cannot see Company A data';
END $$;

-- Check RLS policies for critical tables
SELECT
  tablename,
  policyname,
  CASE cmd
    WHEN 'SELECT' THEN 'READ'
    WHEN 'INSERT' THEN 'CREATE'
    WHEN 'UPDATE' THEN 'UPDATE'
    WHEN 'DELETE' THEN 'DELETE'
    WHEN 'ALL' THEN 'ALL OPS'
  END as operation,
  CASE
    WHEN qual::text LIKE '%company_id%' THEN '✅ Checks company_id'
    WHEN qual::text LIKE '%demo_mode%' THEN '⚠️ Demo mode bypass'
    ELSE '❌ No company isolation'
  END as isolation_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'customers',
    'workflow_executions',
    'workflow_definitions',
    'contacts'
  )
ORDER BY tablename, policyname;
