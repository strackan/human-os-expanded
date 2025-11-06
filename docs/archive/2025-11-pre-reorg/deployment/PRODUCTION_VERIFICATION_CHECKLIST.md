# Production Verification Checklist

## Step 1: Verify Git State

### Expected Production State
- **Branch**: `main`
- **Commit**: `735c856`
- **Commit message**: "feat: implement workspace invitation system - Phase 2"
- **Date**: Recent (should be within last few days based on user statement)

### Current Local State ✅
```bash
# Already verified locally:
main branch: 735c856
justin-strackany branch: 735c856 (same as main)
```

**Status**: ✅ Local git is up-to-date

---

## Step 2: Verify Vercel Production Deployment

### How to Check Vercel Deployment

**Option A: Via Vercel Dashboard** (Recommended)

1. **Go to Vercel Dashboard**
   - URL: https://vercel.com/dashboard
   - Log in with your account

2. **Find Production Project**
   - Look for your production project (not staging)
   - Click on it

3. **Check Latest Deployment**
   - Look at the "Deployments" tab
   - Find the deployment marked "Production"
   - Check the commit hash/message

4. **Verify Commit**
   - Should show commit: `735c856`
   - Should show: "feat: implement workspace invitation system - Phase 2"
   - Or click through to GitHub to verify commit

**Option B: Via Production URL**

1. **Open Production URL** in browser
   - Your production URL (from .env or Vercel dashboard)
   - Example: `https://your-app.vercel.app` or custom domain

2. **Check for Recent Features** (Visual verification)
   - Look for zen dashboard styling
   - Check if workspace/user management UI exists
   - Look for updated sidebar navigation
   - Try logging in to verify OAuth works

**Option C: Via Vercel CLI** (If installed)

```bash
# List deployments for production project
vercel list --prod

# Should show latest deployment with commit 735c856
```

---

## Step 3: Expected Features on Production

If production is at commit `735c856`, these features should be live:

### User Management & Workspace System ✅

**How to verify**:
1. Log in to production
2. Look for admin/user management UI
3. Check if you can see workspace settings
4. Try inviting a user (if admin)

**Database tables that should exist**:
- `profiles.status` column (0=Disabled, 1=Active, 2=Pending)
- `profiles.is_admin` column
- `customer_features` table

**To check via Supabase**:
```sql
-- Check if workspace columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('status', 'is_admin');

-- Should return: status, is_admin
```

---

### Customer Feature Flags ✅

**Database table**:
```sql
-- Check if customer_features table exists
SELECT * FROM customer_features LIMIT 1;

-- Should not error (table exists)
```

---

### Zen Dashboard & UI Improvements ✅

**Visual checks**:
- [ ] Dashboard has modern, clean styling
- [ ] Minimal global header
- [ ] Sidebar navigation present
- [ ] Charts and modular layout
- [ ] Avatar fallbacks to initials if no image

---

### Authentication Improvements ✅

**Functional checks**:
- [ ] OAuth login works (Google)
- [ ] No infinite redirect loop
- [ ] Demo mode accessible (if enabled)
- [ ] Session persists after login

---

### Workflow System ✅

**Features to look for**:
- [ ] Task mode modal works
- [ ] Workflows can be launched
- [ ] Chat integration visible
- [ ] Workflow steps render correctly

---

## Step 4: Check Production Database Migrations

**In Production Supabase dashboard**:

```sql
-- Check which migrations have been applied
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 25;

-- Expected: Should see migrations up to 20251027000001_workspace_system.sql
```

**Key migrations that should be present**:
- `20251027000001` - Workspace system (LATEST)
- `20251026000000` - Customer features
- `20251023000001` - Contract terms
- `20251022000007` - Step level actions
- `20251022000006` - RLS with demo mode
- Multiple earlier migrations from Oct-Nov 2025

**Key migration that should NOT be present** (not merged yet):
- `20250128000001` - Pricing optimization engine (this is our new work)
- `20251028000000` - Workflow template system (incomplete, not merged)

---

## Step 5: Production Health Check

### API Endpoints
Test a few key endpoints to ensure production is working:

**Test 1: Health Check**
```bash
curl https://your-production-url.vercel.app/api/health
# Or open in browser
```

**Test 2: Authentication Status**
- Open production URL
- Try to log in
- Verify you're redirected to dashboard after login

**Test 3: Customer List** (if accessible without auth issues)
- Navigate to customers page
- Verify customers load from database
- Check for no console errors

---

## Step 6: Document Production URLs & Access

**Fill in these details**:

### Production Vercel
- **Project Name**: ______________________
- **Production URL**: ______________________
- **Latest Deployment Commit**: ______________________ (should be 735c856)
- **Deployment Date**: ______________________

### Production Supabase
- **Project Name**: ______________________
- **Project URL**: ______________________
- **Connection String**: (in .env.production or Vercel env vars)
- **Latest Migration**: ______________________ (should be 20251027000001)

### Access
- **Vercel Account Email**: ______________________
- **Supabase Account Email**: ______________________
- **GitHub Repo**: ______________________

---

## Verification Results

### ✅ Production is Confirmed at Commit 735c856

**If verified**, production has:
- [x] User management & workspace invitations
- [x] Customer feature flags
- [x] Zen dashboard & UI improvements
- [x] Authentication improvements
- [x] Workflow system enhancements
- [x] 24 database migrations applied

**Next steps**:
1. Proceed to Step 2: Deploy pricing optimization to staging
2. Follow `docs/deployment/REVISED_DEPLOYMENT_PLAN.md`

---

### ⚠️ Production is NOT at Commit 735c856

**If production is at a different commit**, we need to:

1. **Identify the actual production commit**
   ```bash
   # Check Vercel deployment commit hash
   # Or check production URL for version info
   ```

2. **Assess the gap**
   ```bash
   git log <production-commit>..735c856 --oneline
   # See what's missing from production
   ```

3. **Create promotion plan**
   - If production is behind, we may need to promote staging to prod FIRST
   - Then deploy new pricing work to staging
   - Then test and promote everything

4. **Review with stakeholder**
   - Confirm which features should be on production
   - Decide on promotion timeline

---

### ❌ Production Has Issues

**If you discover production issues**:

1. **Document the issue**
   - What's broken?
   - Error messages?
   - When did it start?

2. **Check if it's a deployment issue**
   - Try rolling back to previous Vercel deployment
   - Check Vercel logs for errors

3. **Check if it's a database issue**
   - Review Supabase logs
   - Check for failed migrations
   - Verify RLS policies aren't blocking access

4. **Emergency fix if needed**
   - May need to cherry-pick specific fixes to production
   - Follow emergency deployment procedure

---

## What to Report Back

Please provide:

1. **Vercel Production Status**
   - [ ] Verified: Production is at commit 735c856
   - [ ] Issue: Production is at different commit: ____________
   - [ ] Issue: Cannot access Vercel dashboard

2. **Production URL Status**
   - [ ] Working: Production URL loads correctly
   - [ ] Issue: Production URL shows error: ____________
   - [ ] Issue: Cannot find production URL

3. **Feature Verification**
   - [ ] Verified: Can log in via OAuth
   - [ ] Verified: Dashboard loads with zen styling
   - [ ] Verified: Workspace features present
   - [ ] Issue: Feature missing: ____________

4. **Database Status**
   - [ ] Verified: Production Supabase accessible
   - [ ] Verified: Migrations up to 20251027000001 applied
   - [ ] Issue: Database issue: ____________

---

## Next Steps After Verification

### If Everything Checks Out ✅
→ **Proceed to Step 2**: Deploy pricing optimization work to staging
→ **Follow**: `docs/deployment/REVISED_DEPLOYMENT_PLAN.md`
→ **Timeline**: ~40 minutes (commit + deploy + migrate + test)

### If Production is Behind ⚠️
→ **PAUSE**: Need to promote existing work to production first
→ **Review**: `docs/deployment/STAGING_TO_PROD_DEPLOYMENT_PLAN.md`
→ **Discuss**: Timeline and risk assessment

### If Production Has Issues ❌
→ **URGENT**: Address production issues before proceeding
→ **Create**: Emergency fix plan
→ **Test**: Thoroughly before any new deployments

---

## Quick Verification Script

If you have access to production and want a quick check:

```bash
# Check git state (local)
echo "=== Local Git State ==="
git log --oneline -1 main
# Expected: 735c856 feat: implement workspace invitation system - Phase 2

echo ""
echo "=== Remote Git State ==="
git log --oneline -1 origin/main
# Expected: Same as local

echo ""
echo "=== Staging Git State ==="
git log --oneline -1 justin-strackany
# Expected: Same as main (735c856)
```

For Vercel/Supabase verification, you'll need to check their dashboards manually.

---

**Ready?** Let me know what you find from the Vercel dashboard, and we'll proceed accordingly! 🚀
