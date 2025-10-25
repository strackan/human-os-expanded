# Security Testing Procedures

**Purpose:** Verify multi-tenant security and RLS isolation before and after production deployment.

---

## Test Suite 1: Multi-Tenant Data Isolation

### Setup Test Environment

**Create test companies and users:**

```sql
-- Create Company A
INSERT INTO public.companies (id, name, domain)
VALUES ('00000000-0000-0000-0000-000000000001', 'Security Test Company A', 'test-a.local')
ON CONFLICT (id) DO NOTHING;

-- Create Company B
INSERT INTO public.companies (id, name, domain)
VALUES ('00000000-0000-0000-0000-000000000002', 'Security Test Company B', 'test-b.local')
ON CONFLICT (id) DO NOTHING;

-- Note: User creation requires Supabase Auth
-- Create via Dashboard or API:
-- User A: test-a@example.com (company_id: ...001)
-- User B: test-b@example.com (company_id: ...002)
```

### Test 1.1: Customer Data Isolation

**Test:** User A cannot see Company B customers

**Setup:**
```sql
-- As admin, create test customers
INSERT INTO public.customers (company_id, name, domain)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Customer A1', 'a1.com'),
  ('00000000-0000-0000-0000-000000000002', 'Customer B1', 'b1.com');
```

**Test Steps:**
1. Sign in as User A (Company A)
2. Query customers:
   ```sql
   SELECT * FROM customers;
   ```
3. Expected: Only sees "Customer A1"
4. Should NOT see "Customer B1"

**Sign in as User B:**
1. Sign out User A
2. Sign in as User B (Company B)
3. Query customers:
   ```sql
   SELECT * FROM customers;
   ```
4. Expected: Only sees "Customer B1"
5. Should NOT see "Customer A1"

**Pass Criteria:**
- [ ] User A sees only Company A data
- [ ] User B sees only Company B data
- [ ] No cross-company data visible

### Test 1.2: Workflow Execution Isolation

**Test:** User A cannot see Company B workflows

**Setup:**
```sql
-- Create workflow definitions (as admin)
INSERT INTO public.workflow_definitions (id, workflow_id, company_id, name, description)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'test-wf-a', '00000000-0000-0000-0000-000000000001', 'Workflow A', 'Company A workflow'),
  ('10000000-0000-0000-0000-000000000002', 'test-wf-b', '00000000-0000-0000-0000-000000000002', 'Workflow B', 'Company B workflow');
```

**Test Steps:**
1. Sign in as User A
2. Query workflows:
   ```sql
   SELECT * FROM workflow_definitions;
   ```
3. Expected: Only sees "Workflow A"

4. Sign in as User B
5. Query workflows:
   ```sql
   SELECT * FROM workflow_definitions;
   ```
6. Expected: Only sees "Workflow B"

**Pass Criteria:**
- [ ] Users only see their company workflows
- [ ] No cross-company workflow visibility

### Test 1.3: Direct ID Access Attempt

**Test:** User A cannot access Company B data using direct ID

**Test Steps:**
1. Sign in as User A
2. Note ID of Company B customer (from admin view)
3. Attempt direct access:
   ```sql
   SELECT * FROM customers WHERE id = '[company-b-customer-id]';
   ```
4. Expected: Returns 0 rows (RLS blocks)

**Pass Criteria:**
- [ ] Direct ID access blocked by RLS
- [ ] Returns empty result set (not error)

---

## Test Suite 2: Demo Mode Verification

### Test 2.1: Demo Mode Disabled in Production

**Test:** Verify demo_mode = false

```sql
SELECT value FROM app_settings WHERE key = 'demo_mode';
```

**Expected:** `false`

**Pass Criteria:**
- [ ] demo_mode value is 'false'
- [ ] No other value present

### Test 2.2: Unauthenticated Access Blocked

**Test:** Anonymous users cannot access protected data

**Test Steps:**
1. Sign out completely
2. Open browser dev tools
3. Attempt API call:
   ```javascript
   const { data, error } = await supabase
     .from('customers')
     .select('*');
   console.log(data, error);
   ```
4. Expected: Error "not authorized" or empty data

**Pass Criteria:**
- [ ] Unauthenticated requests return no data
- [ ] RLS policies enforce auth requirement

### Test 2.3: Demo Mode Bypass Inactive

**Test:** is_demo_mode() returns false

```sql
SELECT is_demo_mode() as demo_status;
```

**Expected:** `false`

**Pass Criteria:**
- [ ] Function returns false
- [ ] RLS policies enforce auth checks

---

## Test Suite 3: Authentication Security

### Test 3.1: OAuth Flow Security

**Test:** PKCE is enabled and working

**Test Steps:**
1. Open browser network tab
2. Click "Sign in with Google"
3. Inspect OAuth redirect URL
4. Look for parameters:
   - `code_challenge`
   - `code_challenge_method=S256`

**Expected:** PKCE parameters present

**Pass Criteria:**
- [ ] PKCE challenge in OAuth request
- [ ] code_challenge_method=S256

### Test 3.2: Session Security

**Test:** Session tokens properly secured

**Test Steps:**
1. Sign in successfully
2. Check cookies in browser dev tools
3. Verify session cookie attributes:
   - `HttpOnly`: true
   - `Secure`: true (in production)
   - `SameSite`: Lax or Strict

**Pass Criteria:**
- [ ] Session cookies have HttpOnly
- [ ] Secure flag set (production)
- [ ] SameSite configured

### Test 3.3: Password Security

**Test:** Password requirements enforced

**Test Steps:**
1. Attempt signup with weak password: "123"
2. Expected: Error "Password too short"
3. Attempt signup with valid password: "SecurePass123!"
4. Expected: Success

**Pass Criteria:**
- [ ] Minimum 8 characters enforced
- [ ] Weak passwords rejected

---

## Test Suite 4: API Security

### Test 4.1: Service Role Key Not Exposed

**Test:** Client cannot access service role key

**Test Steps:**
1. View page source
2. Check all `<script>` tags
3. Search for "service_role"

**Expected:** No service role key found

**Pass Criteria:**
- [ ] Service role key not in client code
- [ ] Only anon key visible to client

### Test 4.2: Rate Limiting (if implemented)

**Test:** Auth endpoints have rate limiting

**Test Steps:**
1. Attempt 20 rapid login requests
2. Check for rate limit response

**Expected:** Rate limit error after threshold

**Pass Criteria:**
- [ ] Rate limiting active (or documented as TODO)

---

## Test Suite 5: Database Security

### Test 5.1: RLS Enabled on All Tables

**Test:** All user-data tables have RLS

```sql
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN ('app_settings', 'companies')
ORDER BY tablename;
```

**Expected:** All tables show `rowsecurity = true`

**Pass Criteria:**
- [ ] All user tables have RLS enabled
- [ ] No exceptions except system tables

### Test 5.2: Company ID Required

**Test:** Critical tables have company_id column

```sql
SELECT
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'company_id'
ORDER BY table_name;
```

**Expected:** All user-data tables listed

**Pass Criteria:**
- [ ] customers has company_id
- [ ] workflow_executions has company_id
- [ ] workflow_definitions has company_id

---

## Automated Security Test Script

**File:** `scripts/security-tests.sql`

```sql
-- Automated Security Test Suite
-- Run before and after production deployment

DO $$
DECLARE
  test_passed INTEGER := 0;
  test_failed INTEGER := 0;
BEGIN
  RAISE NOTICE '=== SECURITY TEST SUITE ===';
  RAISE NOTICE '';

  -- Test 1: Demo mode disabled
  IF EXISTS (
    SELECT 1 FROM app_settings
    WHERE key = 'demo_mode' AND value::boolean = false
  ) THEN
    RAISE NOTICE '✅ Test 1 PASS: Demo mode disabled';
    test_passed := test_passed + 1;
  ELSE
    RAISE WARNING '❌ Test 1 FAIL: Demo mode not disabled!';
    test_failed := test_failed + 1;
  END IF;

  -- Test 2: RLS enabled on critical tables
  IF (
    SELECT count(*) FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('customers', 'workflow_executions')
      AND rowsecurity = true
  ) = 2 THEN
    RAISE NOTICE '✅ Test 2 PASS: RLS enabled on critical tables';
    test_passed := test_passed + 1;
  ELSE
    RAISE WARNING '❌ Test 2 FAIL: RLS not enabled on all critical tables!';
    test_failed := test_failed + 1;
  END IF;

  -- Test 3: Company ID columns exist
  IF (
    SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('customers', 'workflow_executions', 'workflow_definitions')
      AND column_name = 'company_id'
  ) = 3 THEN
    RAISE NOTICE '✅ Test 3 PASS: company_id columns exist';
    test_passed := test_passed + 1;
  ELSE
    RAISE WARNING '❌ Test 3 FAIL: Missing company_id columns!';
    test_failed := test_failed + 1;
  END IF;

  -- Summary
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST SUMMARY ===';
  RAISE NOTICE 'Passed: %', test_passed;
  RAISE NOTICE 'Failed: %', test_failed;

  IF test_failed > 0 THEN
    RAISE EXCEPTION 'SECURITY TESTS FAILED - DO NOT DEPLOY';
  ELSE
    RAISE NOTICE '✅ ALL SECURITY TESTS PASSED';
  END IF;
END $$;
```

---

## Manual Testing Checklist

**Before Production Deployment:**

### Local Environment
- [ ] Run automated security tests
- [ ] Test multi-tenant isolation with 2 companies
- [ ] Verify demo mode = true (local)
- [ ] Test all auth methods work

### Production Environment
- [ ] Run automated security tests
- [ ] Verify demo mode = false
- [ ] Create 2 test companies
- [ ] Test data isolation between companies
- [ ] Test unauthenticated access blocked
- [ ] Verify PKCE enabled in OAuth flow
- [ ] Test all auth methods work
- [ ] Delete test data after verification

**Security Sign-Off:**

I certify that all security tests have passed:

- Name: _______________
- Date: _______________
- Environment: Production
- All tests: ✅ PASS
