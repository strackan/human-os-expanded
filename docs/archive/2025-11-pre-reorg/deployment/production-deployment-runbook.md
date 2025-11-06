# Production Deployment Runbook

**Purpose:** Step-by-step guide to deploy Renubu to production at www.renubu.com

**Target Environment:** Vercel + Supabase Production

**Estimated Time:** 2-3 hours

---

## Pre-Deployment Phase

### Step 1: Create Production Supabase Project (30 min)

**Actions:**
1. Go to https://app.supabase.com
2. Click "New Project"
3. Settings:
   - Name: `renubu-production`
   - Database Password: [Generate strong password, save to password manager]
   - Region: `us-east-1` (or closest to users)
   - Plan: [Select appropriate tier]
4. Wait for project creation (~10 minutes)
5. Save credentials:
   - Project URL: `https://[project-id].supabase.co`
   - Anon Key: [Copy from Settings > API]
   - Service Role Key: [Copy from Settings > API]

**Verification:**
- [ ] Project status: "Active"
- [ ] Database status: "Healthy"
- [ ] Credentials saved securely

### Step 2: Configure Production OAuth (30 min)

**Google Cloud Console:**
1. Go to https://console.cloud.google.com
2. Navigate to: APIs & Services > Credentials
3. Edit OAuth 2.0 Client ID
4. Update Authorized JavaScript Origins:
   - Add: `https://www.renubu.com`
5. Update Authorized Redirect URIs:
   - Add: `https://[project-id].supabase.co/auth/v1/callback`
   - Add: `https://www.renubu.com/auth/callback`
6. Save changes
7. Copy Client ID and Client Secret

**Supabase Dashboard:**
1. Go to Authentication > Providers
2. Enable Google provider
3. Enter Client ID and Client Secret
4. Click "Save"
5. Go to Authentication > Settings
6. Set Site URL: `https://www.renubu.com`
7. Add Redirect URL: `https://www.renubu.com/**`
8. **Enable PKCE: YES** ⚠️ CRITICAL
9. Save settings

**Verification:**
- [ ] Google provider enabled in Supabase
- [ ] PKCE enabled
- [ ] Redirect URLs configured

### Step 3: Apply Database Migrations (20 min)

**Link to Production:**
```bash
# Link local CLI to production project
npx supabase link --project-ref [production-project-id]

# You'll be prompted for database password
```

**Push Migrations:**
```bash
# Review migrations that will be applied
npx supabase db remote commit

# Push all migrations to production
npx supabase db push

# Verify migrations applied
npx supabase db remote commit
```

**Expected Output:**
```
✓ Pushing migrations to remote database...
✓ All migrations applied successfully
```

**Verification:**
- [ ] All migrations applied without errors
- [ ] Tables created successfully
- [ ] RLS policies exist

### Step 4: Disable Demo Mode (5 min)

**Run SQL in Production Database:**

Option A - Via Supabase Dashboard:
1. Go to SQL Editor
2. Run:
```sql
UPDATE public.app_settings
SET value = 'false'
WHERE key = 'demo_mode';

-- Verify
SELECT key, value FROM public.app_settings WHERE key = 'demo_mode';
```

Option B - Via CLI:
```bash
echo "UPDATE public.app_settings SET value = 'false' WHERE key = 'demo_mode';" | npx supabase db execute
```

**Expected Result:**
```
demo_mode | false
```

**Verification:**
- [ ] demo_mode = 'false'
- [ ] No errors returned

### Step 5: Run Production Security Checklist (10 min)

**Execute Security Checks:**
```bash
npx supabase db execute -f scripts/production-checklist.sql
```

**Expected Output:**
```
✅ Demo mode is disabled
✅ All tables have RLS enabled
✅ All critical tables have company_id
=== PRODUCTION READINESS SUMMARY ===
✅ PASS: Demo mode disabled
```

**If Checks Fail:**
- Review error messages
- Fix issues before continuing
- Re-run checklist

**Verification:**
- [ ] All security checks pass
- [ ] No warnings or errors

---

## Deployment Phase

### Step 6: Deploy to Vercel (30 min)

**Initial Setup:**
1. Go to https://vercel.com
2. Import repository from GitHub
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`

**Set Environment Variables:**

In Vercel Dashboard > Settings > Environment Variables, add all from `.env.production.template`:

**Production Environment:**
```
NEXT_PUBLIC_SUPABASE_URL=[production-supabase-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[production-service-role-key]
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=[google-client-id]
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=[google-client-secret]
NEXT_PUBLIC_SITE_URL=https://www.renubu.com
NEXT_PUBLIC_URL=https://www.renubu.com
NEXT_PUBLIC_LOCAL_AUTH_ENABLED=true
NEXT_PUBLIC_LOCAL_AUTH_FALLBACK_ENABLED=true
NEXT_PUBLIC_LOCAL_AUTH_MIN_PASSWORD_LENGTH=8
NEXT_PUBLIC_FORCE_LOCAL_AUTH=false
NEXT_PUBLIC_AUTH_BYPASS_ENABLED=false
NEXT_PUBLIC_ISOLATED_SCHEMAS=false
```

**Important:**
- [ ] Mark all `_SECRET` and `_KEY` variables as "Sensitive"
- [ ] Set scope to "Production" only
- [ ] Use different Supabase project for Preview/Development

**Deploy:**
1. Click "Deploy"
2. Wait for build to complete (~5-10 minutes)
3. Note deployment URL

**Verification:**
- [ ] Build successful
- [ ] No build errors
- [ ] Deployment URL accessible

### Step 7: Configure Custom Domain (20 min)

**Add Domain:**
1. Vercel Dashboard > Settings > Domains
2. Add domain: `www.renubu.com`
3. Configure DNS:
   - Type: CNAME
   - Name: www
   - Value: [vercel-provided-value]
4. Add redirect: `renubu.com` → `www.renubu.com`

**SSL Configuration:**
- [ ] Auto-provision SSL certificate
- [ ] Force HTTPS: Enabled
- [ ] Wait for SSL propagation (~5-30 minutes)

**Verification:**
- [ ] https://www.renubu.com loads
- [ ] SSL certificate valid
- [ ] HTTP redirects to HTTPS

---

## Post-Deployment Phase

### Step 8: Smoke Testing (20 min)

**Authentication Tests:**

1. **Google OAuth:**
   - [ ] Visit https://www.renubu.com
   - [ ] Click "Sign in with Google"
   - [ ] Completes OAuth flow
   - [ ] Redirects to dashboard
   - [ ] User profile created

2. **Local Auth Signup:**
   - [ ] Click "Use Email/Password"
   - [ ] Enter email and password
   - [ ] Account created successfully
   - [ ] Can sign in

3. **Password Reset:**
   - [ ] Click "Forgot password"
   - [ ] Enter email
   - [ ] Receive reset email
   - [ ] Reset password successfully

**Data Isolation Tests:**

1. **Create Test Company A:**
   ```sql
   INSERT INTO public.companies (name, domain)
   VALUES ('Test Company A', 'test-a.com');
   ```

2. **Create Test Company B:**
   ```sql
   INSERT INTO public.companies (name, domain)
   VALUES ('Test Company B', 'test-b.com');
   ```

3. **Test Cross-Company Access:**
   - [ ] Sign in as User A (Company A)
   - [ ] Create workflow for Company A
   - [ ] Sign out
   - [ ] Sign in as User B (Company B)
   - [ ] Verify CANNOT see Company A workflows
   - [ ] Create workflow for Company B
   - [ ] Verify only sees Company B data

**Expected Results:**
- All authentication methods work
- Users cannot see other companies' data
- RLS policies enforced

### Step 9: Performance & Monitoring Setup (15 min)

**Supabase Monitoring:**
1. Dashboard > Database > Backups
   - [ ] Enable daily backups
   - [ ] Retention: 7 days minimum

2. Dashboard > Database > Query Performance
   - [ ] Review slow queries
   - [ ] No obvious performance issues

3. Dashboard > Auth > Users
   - [ ] Monitor user signups
   - [ ] Check for auth errors

**Vercel Monitoring:**
1. Dashboard > Analytics
   - [ ] Enable Web Analytics
   - [ ] Monitor page performance

2. Dashboard > Settings > Integrations
   - [ ] Consider: Sentry (error tracking)
   - [ ] Consider: LogTail (logging)

**Custom Monitoring:**

Create file: `scripts/production-health-check.sql`
```sql
-- Run daily to verify security settings
SELECT
  CASE
    WHEN value::boolean = true THEN '🚨 ALERT: Demo mode enabled in production!'
    ELSE '✅ OK: Demo mode disabled'
  END as security_status
FROM app_settings WHERE key = 'demo_mode';
```

**Verification:**
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Health checks accessible

### Step 10: Documentation & Handoff (10 min)

**Update Documentation:**
1. Record production URLs:
   - Application: https://www.renubu.com
   - Supabase: https://[project-id].supabase.co
   - Vercel: https://vercel.com/[org]/renubu

2. Document credentials location:
   - Password manager: [name]
   - Team access: [list who has access]

3. Update README.md:
   ```markdown
   ## Production Deployment

   - **URL:** https://www.renubu.com
   - **Status:** ✅ Live
   - **Deployed:** [date]
   - **Monitoring:** [links]
   ```

**Verification:**
- [ ] All URLs documented
- [ ] Credentials accessible to team
- [ ] Runbook updated with actual values

---

## Post-Deployment Checklist

### Security ✅
- [ ] Demo mode disabled in production
- [ ] RLS policies active
- [ ] PKCE enabled
- [ ] Cross-company access blocked
- [ ] All secrets stored securely

### Functionality ✅
- [ ] Google OAuth working
- [ ] Local auth working
- [ ] Password reset working
- [ ] Workflows loading
- [ ] Dashboard accessible

### Infrastructure ✅
- [ ] Custom domain configured
- [ ] SSL certificate valid
- [ ] Database backups enabled
- [ ] Monitoring active
- [ ] Error tracking configured

### Documentation ✅
- [ ] Deployment runbook complete
- [ ] Credentials documented
- [ ] Team has access
- [ ] Rollback plan documented

---

## Rollback Procedures

### Immediate Rollback (Vercel)

**If deployment has critical issues:**

1. Vercel Dashboard > Deployments
2. Find last working deployment
3. Click "..." > "Promote to Production"
4. Confirm promotion

**Time to rollback:** ~2 minutes

### Database Rollback (Supabase)

**If database changes cause issues:**

1. Supabase Dashboard > Database > Backups
2. Select backup before deployment
3. Click "Restore"
4. Confirm restoration

**Time to rollback:** ~5-10 minutes

**⚠️ WARNING:** This restores entire database, losing data created after backup

### Emergency Debug Mode

**ONLY if authentication completely broken:**

```sql
-- EMERGENCY ONLY - Enable demo mode temporarily
UPDATE app_settings SET value = 'true' WHERE key = 'demo_mode';
```

**Steps:**
1. Enable demo mode (above SQL)
2. Debug authentication issue
3. Fix issue
4. IMMEDIATELY disable demo mode:
   ```sql
   UPDATE app_settings SET value = 'false' WHERE key = 'demo_mode';
   ```

**⚠️ CRITICAL:** Document why demo mode was enabled and when disabled

---

## Support Contacts

**Technical Issues:**
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support

**Infrastructure:**
- DNS Provider: [name and contact]
- Domain Registrar: [name and contact]

**Team:**
- Primary Contact: [name and email]
- Backup Contact: [name and email]

---

## Success Criteria

Deployment is successful when:

- ✅ Application accessible at https://www.renubu.com
- ✅ SSL certificate valid
- ✅ Authentication working (OAuth + local)
- ✅ Demo mode disabled
- ✅ RLS policies enforcing data isolation
- ✅ No console errors on page load
- ✅ Backups enabled
- ✅ Monitoring active
- ✅ Team can access and verify

**Deployment Complete! 🎉**
