# Staging Vercel Deployment Guide

This guide walks through deploying Renubu to Vercel staging environment.

## Prerequisites

- [ ] Staging Supabase project created: `amugmkrihnjsxlpwdzcy.supabase.co`
- [ ] All migrations pushed to staging (Step 2A.2)
- [ ] OAuth configured in Supabase (Step 2A.3)
- [ ] GitHub repository with latest main branch
- [ ] Vercel account with access to deploy

## Step 1: Prepare Environment Variables

### 1.1 Get Supabase Credentials

1. Go to [Staging Settings > API](https://supabase.com/dashboard/project/amugmkrihnjsxlpwdzcy/settings/api)
2. Copy the following:
   - **Project URL**: `https://amugmkrihnjsxlpwdzcy.supabase.co`
   - **Anon/Public Key**: `eyJ...` (long string)

### 1.2 Create Environment Variables List

Prepare these variables for Vercel:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://amugmkrihnjsxlpwdzcy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[paste anon key from Supabase]

# Application Configuration
NEXT_PUBLIC_APP_URL=https://renubu-staging.vercel.app
NODE_ENV=production

# Optional: Demo Mode (should be false for staging)
NEXT_PUBLIC_DEMO_MODE=false
```

**Note:** We do NOT need `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` or `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` in Vercel because those are already configured in Supabase Auth settings.

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended for First Deploy)

#### 2.1 Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** > **Project**
3. Import your GitHub repository: `strackan/renubu`
4. Select the `main` branch

#### 2.2 Configure Project

**Framework Preset:** Next.js (should auto-detect)

**Root Directory:** `./` (leave as default)

**Build Command:** (leave default)
```bash
npm run build
```

**Output Directory:** (leave default)
```
.next
```

**Install Command:** (leave default)
```bash
npm install
```

#### 2.3 Environment Variables

Click **Environment Variables** section and add each variable:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://amugmkrihnjsxlpwdzcy.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[your-anon-key]` | All |
| `NEXT_PUBLIC_APP_URL` | `https://renubu-staging.vercel.app` | Production, Preview |
| `NODE_ENV` | `production` | Production, Preview |
| `NEXT_PUBLIC_DEMO_MODE` | `false` | All |

**Note:** Select "All" or "Production + Preview" for each variable as appropriate.

#### 2.4 Deploy

1. Click **Deploy**
2. Wait for build to complete (2-5 minutes)
3. Vercel will assign a URL like: `renubu-staging.vercel.app` or `renubu-[hash].vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Or deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel env add NODE_ENV
vercel env add NEXT_PUBLIC_DEMO_MODE
```

## Step 3: Update Supabase Auth Settings

After deployment, update Supabase with the Vercel URL:

### 3.1 Update Site URL

1. Go to [Auth Settings](https://supabase.com/dashboard/project/amugmkrihnjsxlpwdzcy/auth/url-configuration)
2. **Site URL**: Set to your Vercel URL
   ```
   https://renubu-staging.vercel.app
   ```
3. Click **Save**

### 3.2 Update Redirect URLs

1. **Additional Redirect URLs**: Add your Vercel domain
   ```
   https://renubu-staging.vercel.app/**
   ```
2. Click **Save**

### 3.3 Update Google OAuth Consent Screen (if needed)

If you created separate OAuth credentials for staging:

1. Go to [Google Cloud Console > APIs & Services > OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Add **Authorized domains**: `vercel.app`
3. Save changes

## Step 4: Verify Deployment

### 4.1 Check Build Logs

1. In Vercel dashboard, click on your deployment
2. Check **Build Logs** for any errors
3. Common issues:
   - TypeScript errors → Fix in code and redeploy
   - Missing environment variables → Add in Vercel settings
   - Build timeout → Check for infinite loops or large dependencies

### 4.2 Test Application

Visit your staging URL: `https://renubu-staging.vercel.app`

**Checklist:**
- [ ] App loads without errors
- [ ] Homepage renders correctly
- [ ] Click "Sign in with Google"
- [ ] Complete OAuth flow
- [ ] Redirected back to app and logged in
- [ ] Dashboard loads with no data (expected for new environment)
- [ ] No console errors in browser DevTools

### 4.3 Test Database Connection

After signing in:

1. Go to [Supabase Auth > Users](https://supabase.com/dashboard/project/amugmkrihnjsxlpwdzcy/auth/users)
2. Verify your test user appears
3. Go to [Table Editor > profiles](https://supabase.com/dashboard/project/amugmkrihnjsxlpwdzcy/editor)
4. Verify profile record was created
5. Check `company_id` is set

## Step 5: Configure Custom Domain (Optional)

### 5.1 Add Domain in Vercel

1. Go to Vercel Project > **Settings** > **Domains**
2. Click **Add**
3. Enter domain: `staging.renubu.com`
4. Vercel will provide DNS records to add

### 5.2 Update DNS

Add these records in your DNS provider:

**For subdomain (staging.renubu.com):**
```
Type: CNAME
Name: staging
Value: cname.vercel-dns.com
```

**For root domain (renubu.com) - if using for staging:**
```
Type: A
Name: @
Value: 76.76.21.21

Type: AAAA
Name: @
Value: 2606:4700:4700::1111
```

### 5.3 Update Environment Variables

After custom domain is active:

1. Update `NEXT_PUBLIC_APP_URL` in Vercel:
   ```
   https://staging.renubu.com
   ```
2. Redeploy for changes to take effect

### 5.4 Update Supabase Auth

1. Update **Site URL** to custom domain
2. Add custom domain to **Redirect URLs**

## Step 6: Enable Vercel Analytics (Optional)

1. Go to Vercel Project > **Analytics**
2. Click **Enable**
3. Provides insights on:
   - Page views
   - User sessions
   - Core Web Vitals
   - Error tracking

## Troubleshooting

### Build Failures

**Error: TypeScript build errors**
```bash
# Run locally to see full errors
npm run build

# Fix errors in code
# Commit and push to trigger redeploy
```

**Error: Missing environment variables**
- Check all required variables are set in Vercel
- Ensure variable names match exactly (case-sensitive)
- Variables starting with `NEXT_PUBLIC_` are exposed to browser

### Runtime Errors

**Error: "Failed to fetch" or network errors**
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify Supabase project is not paused
- Check Supabase API key is the anon/public key (not service role)

**Error: OAuth redirect loop**
- Verify Site URL matches Vercel domain exactly
- Check redirect URLs include Vercel domain
- Ensure Google OAuth callback URL matches Supabase

**Error: 404 on routes**
- Check Next.js App Router structure is correct
- Verify all page components are exported correctly
- Review Vercel build logs for routing issues

### Database Connection Issues

**Error: RLS policy violations**
- Check user is authenticated (auth.uid() returns value)
- Verify user has company_id set in profiles table
- Review RLS policies for the table with errors
- Temporarily disable RLS to test (then re-enable)

## Rollback Procedure

If deployment has critical issues:

### Option 1: Instant Rollback via Vercel

1. Go to Vercel Project > **Deployments**
2. Find previous working deployment
3. Click **⋯** > **Promote to Production**
4. Previous version is live immediately

### Option 2: Rollback via Git

```bash
# Revert to previous commit
git revert HEAD

# Push to trigger redeploy
git push origin main
```

## Monitoring & Logs

### View Logs

**Runtime Logs:**
1. Vercel Dashboard > Project > **Logs**
2. Filter by:
   - Time range
   - Status code (errors only)
   - Search query

**Build Logs:**
1. Vercel Dashboard > Project > **Deployments**
2. Click on specific deployment
3. View **Build Logs** tab

### Set Up Alerts (Optional)

1. Vercel Project > **Settings** > **Notifications**
2. Configure:
   - Deployment failures
   - Performance degradation
   - Error rate thresholds

## Next Steps

After successful staging deployment:

1. ✅ Complete Step 2A.4 (this guide)
2. → Move to Step 2B: Interactive route cleanup audit
3. → Move to Step 2C: Test in staging environment
4. → Prepare for Step 2D: Production deployment

## Security Checklist

Before production:

- [ ] All environment variables secured (not committed to git)
- [ ] RLS enabled on all tables
- [ ] OAuth credentials use PKCE
- [ ] Site URL configured (no wildcards)
- [ ] Demo mode disabled (`NEXT_PUBLIC_DEMO_MODE=false`)
- [ ] Service role key NOT exposed to frontend
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] CSP headers configured (if applicable)

## References

- [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase + Vercel Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
