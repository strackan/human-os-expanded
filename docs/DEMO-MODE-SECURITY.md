# Demo Mode Security Configuration

**Status:** ✅ Implemented
**Migration:** `20251022000006_rls_with_demo_mode.sql`

---

## 🎯 Overview

This system allows the app to run in **demo mode** for testing while maintaining **proper RLS security** for production. The key difference:

- **Demo Mode ON**: RLS policies allow unrestricted access (for testing)
- **Demo Mode OFF**: RLS policies enforce authentication and authorization

**No code changes needed** - just toggle a database setting!

---

## ⚙️ How It Works

### Database Components

1. **`app_settings` table**: Stores configuration flags
   ```sql
   SELECT * FROM app_settings WHERE key = 'demo_mode';
   -- Returns: { key: 'demo_mode', value: 'true' }
   ```

2. **`is_demo_mode()` function**: Checks if demo mode is enabled
   ```sql
   SELECT is_demo_mode();
   -- Returns: true (in demo) or false (in production)
   ```

3. **RLS Policies**: All policies check demo mode first
   ```sql
   CREATE POLICY "workflow_actions_insert_policy" ON workflow_actions
   FOR INSERT WITH CHECK (
     is_demo_mode() OR           -- ← Demo bypass
     (performed_by = auth.uid()  -- ← Production auth
      AND EXISTS (...))
   );
   ```

### Policy Pattern

Every RLS policy follows this pattern:
```
is_demo_mode() OR [proper auth check]
```

This means:
- ✅ If `demo_mode = true`: Anyone can access
- ✅ If `demo_mode = false`: Must pass auth checks

---

## 🚀 Enabling/Disabling Demo Mode

### Check Current Mode
```sql
SELECT value FROM app_settings WHERE key = 'demo_mode';
```

### Enable Demo Mode (Testing/Development)
```sql
UPDATE app_settings SET value = 'true' WHERE key = 'demo_mode';
```

### Disable Demo Mode (Production)
```sql
UPDATE app_settings SET value = 'false' WHERE key = 'demo_mode';
```

**Current Status:** `demo_mode = true` (for development)

---

## 🔐 Security Implications

### Demo Mode ON (Current)
- ✅ **Pros:**
  - Easy testing without authentication
  - Works with unauthenticated Supabase client
  - No need to manage test users

- ⚠️ **Cons:**
  - **INSECURE** - Anyone can read/write data
  - Should **NEVER** be used with real customer data
  - Must be disabled before production deployment

### Demo Mode OFF (Production)
- ✅ **Pros:**
  - **SECURE** - Proper authentication required
  - Users can only access their own workflows
  - Full audit trail with user attribution

- ⚠️ **Cons:**
  - Requires authenticated users
  - Demo pages won't work without auth

---

## 📋 Affected Tables & Policies

### `workflow_actions`
- ✅ RLS re-enabled (was disabled before)
- ✅ SELECT: Demo mode OR user performed action
- ✅ INSERT: Demo mode OR user is performing action on their workflow

### `workflow_executions`
- ✅ SELECT: Demo mode OR user is assigned/owner
- ✅ INSERT: Demo mode OR user is creating for themselves
- ✅ UPDATE: Demo mode OR user has access
- ✅ DELETE: Demo mode OR user owns workflow

---

## 🧪 Testing

### Test Demo Mode Works
1. Ensure `demo_mode = true` in database
2. Launch workflow in `obsidian-black-v3`
3. Click Snooze/Skip/Escalate
4. Should work without authentication

### Test Production Mode Works
1. Set `demo_mode = false` in database
2. Try to launch workflow without auth
3. Should fail with permission error
4. Sign in with authenticated user
5. Should work with proper auth

---

## 🚨 Pre-Production Checklist

Before deploying to production:

- [ ] Disable demo mode:
  ```sql
  UPDATE app_settings SET value = 'false' WHERE key = 'demo_mode';
  ```

- [ ] Verify RLS is enforced:
  ```sql
  SELECT is_demo_mode();  -- Should return: false
  ```

- [ ] Test with authenticated users

- [ ] Confirm unauthenticated users cannot access data

- [ ] Add monitoring for `app_settings` changes

---

## 🛠️ Environment Variables

The Next.js app has demo mode set in `.env.local`:
```bash
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_COMPANY_ID=f84a0794-93b5-473b-bbca-f16ac213b6f4
NEXT_PUBLIC_DEMO_CSM_ID=d152cc6c-8d71-4816-9b96-eccf249ed0ac
```

**Note:** These are for client-side features only. The database `demo_mode` setting is what controls RLS policies.

---

## 📝 Migration History

1. **20251022000001**: Initial Phase 3E workflow actions
2. **20251022000002-20251022000005**: ❌ Disabled RLS (bad approach)
3. **20251022000006**: ✅ Proper RLS with `demo_mode` flag (current)

---

## 🎓 Best Practices

1. **Never commit with demo_mode = true** to production branches
2. **Use separate databases** for demo vs production
3. **Audit `app_settings` changes** in production
4. **Document which features require demo mode** for testing
5. **Add automated tests** that verify RLS works in both modes

---

## 🔗 Related Files

- Migration: `supabase/migrations/20251022000006_rls_with_demo_mode.sql`
- Services: `src/lib/workflows/actions/WorkflowActionService.ts`
- Demo: `src/app/obsidian-black-v3/`
