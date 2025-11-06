# OAuth Production Setup Guide

## Google Cloud Console Configuration

### 1. Update OAuth Consent Screen

**Location:** Google Cloud Console > APIs & Services > OAuth consent screen

**Changes Required:**
- [ ] Remove test domains (127.0.0.1, localhost)
- [ ] Add production domain: `renubu.com`
- [ ] Add production domain: `www.renubu.com`
- [ ] Verify app is in "Published" status (not "Testing")

### 2. Update OAuth Client ID Credentials

**Location:** Google Cloud Console > APIs & Services > Credentials

**Authorized JavaScript Origins:**
- [ ] Remove: `http://localhost:3000`
- [ ] Remove: `http://127.0.0.1:3000`
- [ ] Add: `https://www.renubu.com`
- [ ] Add: `https://renubu.com` (if using apex domain)

**Authorized Redirect URIs:**
- [ ] Remove: `http://127.0.0.1:54321/auth/v1/callback`
- [ ] Remove: `http://localhost:3000/auth/callback`
- [ ] Add: `https://[your-supabase-project].supabase.co/auth/v1/callback`
- [ ] Add: `https://www.renubu.com/auth/callback`

**Save credentials:**
- Client ID: [saved securely]
- Client Secret: [saved securely]

## Supabase Production Configuration

### 1. Create Production Project

**Location:** Supabase Dashboard > New Project

**Settings:**
- Project Name: renubu-production
- Database Password: [strong password, saved in password manager]
- Region: [closest to users]
- Pricing Plan: [appropriate tier]

### 2. Configure OAuth Provider

**Location:** Supabase Dashboard > Authentication > Providers > Google

**Configuration:**
- [ ] Enable Google provider
- [ ] Client ID: [from Google Cloud Console]
- [ ] Client Secret: [from Google Cloud Console]
- [ ] Redirect URL: Auto-configured by Supabase
- [ ] Enable PKCE: **YES** (security requirement)

### 3. Configure Auth Settings

**Location:** Supabase Dashboard > Authentication > Settings

**Required Changes:**
- [ ] Site URL: `https://www.renubu.com`
- [ ] Additional Redirect URLs:
  - `https://www.renubu.com/auth/callback`
  - `https://www.renubu.com/**`
- [ ] JWT Expiry: 3600 seconds (1 hour)
- [ ] Enable Email Confirmations: **YES** (for local auth)
- [ ] Disable Email Signups: **NO** (allow local auth fallback)

### 4. Enable PKCE (Proof Key for Code Exchange)

**Location:** Supabase Dashboard > Authentication > Settings

**Setting:**
- [ ] Enable PKCE: **YES**
- Impact: Prevents authorization code interception attacks
- Requirement: **MANDATORY for production**

## Vercel Production Configuration

### 1. Set Environment Variables

**Location:** Vercel Dashboard > Project > Settings > Environment Variables

**Required Variables:**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production_anon_key]
SUPABASE_SERVICE_ROLE_KEY=[production_service_role_key]

# Google OAuth Configuration
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=[production_client_id]
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=[production_client_secret]

# Application Configuration
NEXT_PUBLIC_SITE_URL=https://www.renubu.com
NEXT_PUBLIC_URL=https://www.renubu.com

# Local Auth Configuration
NEXT_PUBLIC_LOCAL_AUTH_ENABLED=true
NEXT_PUBLIC_LOCAL_AUTH_FALLBACK_ENABLED=true
NEXT_PUBLIC_LOCAL_AUTH_MIN_PASSWORD_LENGTH=8

# Security Flags
NEXT_PUBLIC_FORCE_LOCAL_AUTH=false
NEXT_PUBLIC_AUTH_BYPASS_ENABLED=false  # CRITICAL: false in production
NEXT_PUBLIC_ISOLATED_SCHEMAS=false  # Using shared schema with RLS
```

**Variable Scope:**
- [ ] All variables set to "Production" environment
- [ ] Sensitive variables (secrets) marked as "Sensitive"
- [ ] Preview/Development use different Supabase project

### 2. Domain Configuration

**Location:** Vercel Dashboard > Project > Settings > Domains

**Domains:**
- [ ] www.renubu.com (primary)
- [ ] renubu.com (redirect to www)

**SSL:**
- [ ] Auto-provisioned SSL certificate
- [ ] Force HTTPS: Enabled

## Production Database Setup

### 1. Run Migrations

```bash
# Connect to production Supabase project
npx supabase link --project-ref [production-project-id]

# Push all migrations
npx supabase db push

# Verify migrations applied
npx supabase db remote commit
```

### 2. Disable Demo Mode

```sql
-- CRITICAL: Run this in production database
UPDATE public.app_settings
SET value = 'false'
WHERE key = 'demo_mode';

-- Verify
SELECT key, value FROM public.app_settings WHERE key = 'demo_mode';
-- Expected: demo_mode | false
```

### 3. Run Security Checklist

```bash
npx supabase db execute -f scripts/production-checklist.sql
```

Expected: All checks pass

## Testing Checklist

### Pre-Deployment
- [ ] Run local build: `npm run build`
- [ ] Run type check: `npm run type-check`
- [ ] Run tests: `npm test`
- [ ] Verify .env.production has correct values

### Post-Deployment
- [ ] Visit https://www.renubu.com
- [ ] Test Google OAuth login
- [ ] Test local auth signup/login
- [ ] Test password reset flow
- [ ] Verify user can only see their company data
- [ ] Test signout functionality

### Security Validation
- [ ] Unauthenticated access blocked
- [ ] Cross-company data access blocked
- [ ] Demo mode disabled
- [ ] RLS policies active
- [ ] PKCE enabled

## Rollback Plan

If critical issues occur:

1. **Vercel:** Instant rollback to previous deployment
2. **Database:** Restore from automatic Supabase backup
3. **Emergency Debug:** Temporarily point production to staging Supabase

**DO NOT re-enable demo mode in production unless critical emergency**

## Monitoring Setup

### Supabase Dashboard
- [ ] Enable daily database backups
- [ ] Set up query performance monitoring
- [ ] Configure authentication event logs

### Vercel Dashboard
- [ ] Enable error tracking
- [ ] Set up uptime monitoring
- [ ] Configure deployment notifications

### Custom Alerts
Add to monitoring service:
- Alert if demo_mode becomes 'true'
- Alert on authentication failures spike
- Alert on RLS policy violations

## Known Limitations & Future Requirements

### OAuth User Company Assignment

**Current State:**
- OAuth users are NOT automatically assigned to companies during signup
- After OAuth authentication, `profiles.company_id` is `null` by default
- Users authenticate successfully but lack company context

**Impact:**
- OAuth users cannot access company-scoped data until manually assigned
- RLS policies will block access to all company-specific resources
- Manual intervention required to assign users to companies

**Root Cause:**
- Domain-based company assignment logic not yet implemented
- No automatic mapping from email domain to company during OAuth signup
- Supabase Auth triggers/hooks not configured for company assignment

**Required Implementation:**
Before production deployment, implement one of:

1. **Domain-Based Auto-Assignment (Recommended):**
   - Parse email domain during OAuth signup (e.g., user@acmecorp.com → acmecorp.com)
   - Lookup matching company by domain: `SELECT id FROM companies WHERE domain = 'acmecorp.com'`
   - Auto-assign company_id to profile during user creation
   - Implement via Supabase Auth Hook or trigger on `profiles` insert

2. **Manual Company Assignment (Temporary Workaround):**
   - Admin manually assigns users to companies via SQL:
     ```sql
     UPDATE profiles SET company_id = '[company-uuid]' WHERE id = '[user-uuid]';
     ```
   - Not scalable for production with multiple companies
   - Acceptable for initial launch with single known company

3. **Company Selection During Onboarding:**
   - After OAuth, show company selection screen
   - User chooses from available companies
   - Update profile with selected company_id
   - Requires UI implementation

**Current Workaround:**
- Local authentication (email/password) available as fallback
- For non-corporate emails, use local auth to create accounts
- Manual company assignment via SQL until auto-assignment implemented

**Security Implications:**
- No security vulnerability (RLS still enforces isolation)
- Users simply cannot access data until company assigned
- Prevents "accidental" cross-company access

**Next Steps:**
- [ ] Implement domain-based company assignment before production
- [ ] Add Supabase Auth Hook for automatic company_id assignment
- [ ] Test with multiple email domains
- [ ] Document company onboarding flow for admins
- [ ] Consider fallback for non-matching domains (e.g., gmail.com)

**Timeline:**
- Critical for multi-company production deployment
- Can launch with single company and manual assignment initially
- Must be implemented before onboarding second company
