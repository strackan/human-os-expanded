# Production Deployment Checklist

## Pre-Deployment Verification

### 1. Code Status
- [x] All changes tested in staging
- [x] Build passes successfully (`npm run build`)
- [x] No TypeScript errors
- [x] All commits pushed to `main` branch
- [x] Latest commit: `695c28e` (logo added)

### 2. Database Preparation

#### Supabase Production Project
- [ ] Production Supabase project created (separate from staging)
- [ ] Production database is CLEAN (no seed data)
- [ ] Migrations applied: `npx supabase db push --linked`
- [ ] RLS policies enabled and verified
- [ ] Service role key secured

**Verify clean database:**
```sql
SELECT
  (SELECT COUNT(*) FROM customers) as customer_count,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'admin') as has_admin_user,
  (SELECT COUNT(*) FROM renewals) as renewal_count;
```
Expected: All counts should be `0`

### 3. OAuth Configuration

#### Google OAuth (Production)
- [ ] Create new OAuth client in Google Cloud Console
- [ ] Add production domain to authorized origins
  - Example: `https://app.renubu.com`
- [ ] Add callback URLs:
  - `https://[your-project].supabase.co/auth/v1/callback`
  - `https://app.renubu.com/auth/callback`
- [ ] Copy Client ID and Client Secret

#### Supabase Auth Settings (Production)
- [ ] Navigate to Authentication > Providers > Google
- [ ] Enable Google provider
- [ ] Add production Client ID
- [ ] Add production Client Secret
- [ ] Save changes

### 4. Environment Variables (Vercel Production)

Navigate to Vercel Dashboard > Project Settings > Environment Variables

**Required Production Variables:**
```bash
# Supabase (Production Project)
NEXT_PUBLIC_SUPABASE_URL=https://[prod-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[production-service-role-key]

# Demo Mode (MUST BE FALSE for production)
NEXT_PUBLIC_DEMO_MODE=false

# OAuth URLs (Production Domain)
NEXT_PUBLIC_SITE_URL=https://app.renubu.com
```

**Important:**
- [ ] `NEXT_PUBLIC_DEMO_MODE` is set to `false`
- [ ] All keys are from PRODUCTION Supabase project (not staging)
- [ ] Service role key is kept secret (not public)

### 5. Vercel Production Deployment

#### Option A: Promote Staging to Production (Recommended)
If your staging deployment is working perfectly:

1. Go to Vercel Dashboard
2. Click on the staging deployment that's working
3. Click "Promote to Production"
4. Verify production domain

#### Option B: Manual Production Deployment
1. Go to Vercel Dashboard > Settings > Domains
2. Add production domain: `app.renubu.com`
3. Configure DNS (add CNAME or A record)
4. Deploy from `main` branch
5. Set Production Environment to use `main` branch

### 6. Domain Configuration

#### DNS Settings
- [ ] Domain purchased/configured
- [ ] DNS pointed to Vercel
  - CNAME record: `app.renubu.com` → `cname.vercel-dns.com`
  - Or A record as provided by Vercel
- [ ] SSL certificate auto-provisioned by Vercel

#### Vercel Domain Settings
- [ ] Production domain added: `app.renubu.com`
- [ ] Domain verified
- [ ] SSL certificate active (automatic)
- [ ] Redirect from `www` to non-www (optional)

## Deployment Steps

### Step 1: Verify Current State
```bash
# Check you're on main branch
git branch

# Verify latest commit
git log --oneline -1

# Ensure everything is pushed
git status
```

### Step 2: Supabase Production Setup

**A. Link to Production Project**
```bash
# Link to production Supabase project
npx supabase link --project-ref [production-project-ref]
```

**B. Apply Migrations (NO SEED DATA)**
```bash
# This runs ONLY migrations, NOT seed.sql
npx supabase db push --linked
```

**C. Verify Clean Database**
```bash
# Connect to production DB and run:
SELECT COUNT(*) FROM customers; -- Should be 0
```

### Step 3: Configure Vercel Production

**A. Set Environment Variables**
1. Go to: https://vercel.com/[your-team]/renubu/settings/environment-variables
2. Select "Production" environment
3. Add all required variables (see section 4 above)
4. **Critical:** Set `NEXT_PUBLIC_DEMO_MODE=false`

**B. Deploy to Production**
1. Go to: https://vercel.com/[your-team]/renubu
2. Click "Deployments" tab
3. Find latest successful staging deployment
4. Click "..." menu → "Promote to Production"
   - OR trigger new deployment from `main` branch

### Step 4: Post-Deployment Verification

**A. Smoke Tests**
- [ ] Visit production URL: `https://app.renubu.com`
- [ ] Landing page loads correctly
- [ ] Logo appears in header
- [ ] Sign in with Google OAuth works
- [ ] Redirects to `/dashboard` after authentication
- [ ] Sidebar navigation works (primary + secondary sections)
- [ ] All main pages load:
  - [ ] Dashboard
  - [ ] Customers (empty state)
  - [ ] Renewals (empty state)
  - [ ] Contracts (empty state)
- [ ] 404 page works for invalid routes

**B. Authentication Flow**
- [ ] Click "Sign In"
- [ ] Google OAuth popup appears
- [ ] After authentication, redirects to dashboard
- [ ] User avatar shows in header
- [ ] Can sign out successfully

**C. Database Verification**
After first user signs in:
```sql
-- Should have 1 user (the one who just signed in)
SELECT COUNT(*) FROM auth.users;

-- Should have 1 profile
SELECT COUNT(*) FROM profiles;

-- Customers should still be 0
SELECT COUNT(*) FROM customers;
```

## Rollback Plan

If something goes wrong:

### Quick Rollback (Vercel)
1. Go to Vercel Dashboard > Deployments
2. Find last known good deployment
3. Click "..." → "Promote to Production"

### Database Rollback
```bash
# If you need to revert a migration
npx supabase db reset --linked

# Then reapply up to a specific version
npx supabase db push --linked
```

## Post-Production Tasks

### Monitoring Setup
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Configure Vercel Analytics
- [ ] Set up uptime monitoring
- [ ] Create alerts for critical errors

### Documentation
- [ ] Update README with production URL
- [ ] Document first-time user onboarding flow
- [ ] Create user guide for customers

### Security
- [ ] Review RLS policies in production
- [ ] Verify no test/admin accounts exist
- [ ] Confirm service role key is secured
- [ ] Check CORS settings in Supabase

### Backups
- [ ] Enable Supabase automated backups
- [ ] Test backup restoration process
- [ ] Document backup retention policy

## Common Issues & Solutions

### Issue: OAuth redirect fails
**Solution:** Verify callback URLs in both:
- Google Cloud Console OAuth settings
- Supabase Authentication > Providers > Google

### Issue: Database connection errors
**Solution:** Verify environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` matches production project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is from production project

### Issue: Demo mode still active
**Solution:**
- Set `NEXT_PUBLIC_DEMO_MODE=false` in Vercel production env vars
- Redeploy to pick up new environment variable

### Issue: Logo not showing
**Solution:**
- Verify `public/logo.png` is in git repository
- Check Vercel build logs for asset compilation
- Clear browser cache

## Success Criteria

Production deployment is successful when:
- [x] Application loads at production URL
- [x] OAuth authentication works
- [x] Database is clean (no seed data)
- [x] All pages render correctly
- [x] No console errors
- [x] Performance is acceptable
- [x] First real user can sign in and use the app

## Next Steps After Production

1. **User Onboarding**: Create process for adding customers
2. **Data Import**: Plan for importing existing customer data (if applicable)
3. **Team Setup**: Add additional CSM users
4. **Training**: Prepare training materials for team
5. **Beta Testing**: Consider limited beta with select customers

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Production URL:** https://app.renubu.com
**Supabase Project:** [production-project-ref]
