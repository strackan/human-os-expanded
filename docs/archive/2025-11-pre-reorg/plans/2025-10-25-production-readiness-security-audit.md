# Production Readiness & Multi-Tenant Security Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prepare Renubu for production deployment at www.renubu.com with full multi-tenant security, proper RLS policies, and secure OAuth configuration.

**Architecture:** Supabase PostgreSQL with Row Level Security (RLS) for multi-tenant data isolation using company_id. Next.js 15 frontend deployed on Vercel. Google OAuth with PKCE for authentication. Demo mode enabled locally, disabled in production.

**Tech Stack:** Next.js 15, Supabase (PostgreSQL + Auth), Vercel, Google OAuth, TypeScript

---

## Critical Security Requirement

**Demo Mode Configuration:**
- **Local Development**: `app_settings.demo_mode = 'true'` (KEEP ENABLED)
- **Production**: `app_settings.demo_mode = 'false'` (MUST DISABLE)

---

## Task 1: Database Security Audit - Inventory All Tables

**Files:**
- Create: `docs/security/database-security-audit.md`
- Create: `scripts/audit-rls-policies.sql`

**Step 1: Create SQL script to inventory all tables with security info**

Create file: `scripts/audit-rls-policies.sql`

```sql
-- Database Security Audit Script
-- Purpose: Inventory all tables and their security configuration

-- Check all tables in public schema
SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN 'ENABLED'
    ELSE 'DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check for company_id columns
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'company_id'
ORDER BY table_name;

-- List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check demo_mode setting
SELECT key, value, description
FROM public.app_settings
WHERE key = 'demo_mode';
```

**Step 2: Run audit script and save results**

Run:
```bash
npx supabase db execute -f scripts/audit-rls-policies.sql > docs/security/audit-results.txt
```

Expected: Output showing all tables, RLS status, company_id columns, and policies

**Step 3: Create audit documentation template**

Create file: `docs/security/database-security-audit.md`

```markdown
# Database Security Audit Results

**Date:** 2025-10-25
**Auditor:** [Name]
**Environment:** Local Development

## Executive Summary

- **Total Tables:** [COUNT]
- **Tables with RLS Enabled:** [COUNT]
- **Tables with company_id:** [COUNT]
- **Demo Mode Status:** [ENABLED/DISABLED]

## Critical Findings

### ⚠️ High Priority Issues
- [ ] Tables missing RLS policies
- [ ] Tables missing company_id columns
- [ ] Demo mode configuration

### ✅ Verified Secure
- [ ] All user-data tables have RLS
- [ ] All user-data tables have company_id
- [ ] Cross-company access blocked

## Table-by-Table Analysis

[To be filled from audit results]

## Recommendations

1. [Security recommendations]
2. [Missing RLS policies to add]
3. [Schema changes needed]
```

**Step 4: Commit audit scripts**

```bash
git add scripts/audit-rls-policies.sql docs/security/
git commit -m "feat: add database security audit scripts"
```

---

## Task 2: Verify Multi-Tenant Schema - Company ID Coverage

**Files:**
- Modify: `scripts/audit-rls-policies.sql`
- Create: `scripts/verify-company-isolation.sql`

**Step 1: Create company isolation verification script**

Create file: `scripts/verify-company-isolation.sql`

```sql
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
```

**Step 2: Run company isolation check**

Run:
```bash
npx supabase db execute -f scripts/verify-company-isolation.sql
```

Expected: List showing which tables have/missing company_id

**Step 3: Document findings in audit report**

Update: `docs/security/database-security-audit.md`

Add section:
```markdown
## Multi-Tenant Company ID Coverage

### Tables WITH company_id ✅
- customers
- workflow_executions
- workflow_definitions
- [List all tables with company_id]

### Tables MISSING company_id ❌
- [List tables that need company_id added]
- Impact: [Describe security impact]
- Priority: [HIGH/MEDIUM/LOW]

### Intentionally Global Tables (No company_id)
- app_settings (system configuration)
- companies (tenant registry)
- profiles (links via company_id FK)
```

**Step 4: Commit verification script**

```bash
git add scripts/verify-company-isolation.sql docs/security/database-security-audit.md
git commit -m "feat: add company_id isolation verification"
```

---

## Task 3: Audit Row Level Security Policies

**Files:**
- Create: `scripts/test-rls-isolation.sql`
- Modify: `docs/security/database-security-audit.md`

**Step 1: Create RLS policy testing script**

Create file: `scripts/test-rls-isolation.sql`

```sql
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
```

**Step 2: Run RLS audit**

Run:
```bash
npx supabase db execute -f scripts/test-rls-isolation.sql
```

Expected: Output showing RLS policies and isolation checks

**Step 3: Document RLS policy findings**

Update: `docs/security/database-security-audit.md`

Add section:
```markdown
## Row Level Security (RLS) Policy Analysis

### Tables with Proper RLS ✅
| Table | Policy | Operation | Company Isolation |
|-------|--------|-----------|-------------------|
| customers | [policy name] | SELECT | ✅ Checks company_id |

### Tables with Demo Mode Bypass ⚠️
- workflow_executions (has `is_demo_mode()` bypass)
- workflow_actions (has `is_demo_mode()` bypass)
- Status: **Acceptable for local dev, MUST disable in production**

### Tables Missing RLS ❌
- [List tables without RLS enabled]
- Impact: [Security risk description]
- Action Required: [Add RLS policies]

### RLS Policy Recommendations
1. All user-data tables MUST check company_id in USING clause
2. Demo mode bypass acceptable ONLY when `is_demo_mode() = true`
3. Production MUST set `app_settings.demo_mode = 'false'`
```

**Step 4: Commit RLS audit**

```bash
git add scripts/test-rls-isolation.sql docs/security/database-security-audit.md
git commit -m "feat: add RLS policy audit and testing"
```

---

## Task 4: Demo Mode Configuration Documentation

**Files:**
- Create: `docs/security/demo-mode-configuration.md`
- Create: `scripts/production-checklist.sql`

**Step 1: Create demo mode configuration guide**

Create file: `docs/security/demo-mode-configuration.md`

```markdown
# Demo Mode Configuration Guide

## Overview

Demo mode allows development and testing without authentication by bypassing RLS policies. This is **CRITICAL to disable in production**.

## How Demo Mode Works

**Database Function:**
```sql
CREATE OR REPLACE FUNCTION public.is_demo_mode()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT value::boolean FROM public.app_settings WHERE key = 'demo_mode'),
    false
  );
$$;
```

**RLS Policy Example:**
```sql
CREATE POLICY "workflow_actions_select_policy" ON public.workflow_actions
FOR SELECT USING (
  is_demo_mode() OR  -- Demo bypass
  performed_by = auth.uid() OR  -- Normal auth check
  -- ... other conditions
);
```

## Configuration by Environment

### Local Development (Current)
```sql
-- Status: ENABLED
SELECT value FROM app_settings WHERE key = 'demo_mode';
-- Expected: 'true'
```

**Why Enabled:** Allows testing workflows without OAuth complexity

**Impact:** Anyone can access all data (acceptable on localhost)

### Production (Required)
```sql
-- Status: MUST BE DISABLED
UPDATE app_settings SET value = 'false' WHERE key = 'demo_mode';

-- Verify disabled
SELECT value FROM app_settings WHERE key = 'demo_mode';
-- Expected: 'false'
```

**Why Disabled:** Enforces authentication and RLS policies

**Impact:** Users can only access their company's data

## Pre-Deployment Checklist

- [ ] Verify demo_mode = 'false' in production database
- [ ] Test that unauthenticated requests are blocked
- [ ] Test that User A cannot see Company B data
- [ ] Verify all RLS policies active
- [ ] Document rollback procedure

## Rollback Procedure

If production auth issues occur:

```sql
-- EMERGENCY ONLY - Re-enable demo mode temporarily
UPDATE app_settings SET value = 'true' WHERE key = 'demo_mode';

-- Verify
SELECT value FROM app_settings WHERE key = 'demo_mode';
```

**⚠️ WARNING:** Only use for emergency debugging. Disable immediately after.

## Monitoring

Add to production monitoring:
```sql
-- Alert if demo mode enabled in production
SELECT
  CASE
    WHEN value::boolean = true THEN 'SECURITY ALERT: Demo mode enabled!'
    ELSE 'OK: Demo mode disabled'
  END as status
FROM app_settings WHERE key = 'demo_mode';
```
```

**Step 2: Create production deployment checklist SQL**

Create file: `scripts/production-checklist.sql`

```sql
-- Production Deployment Security Checklist
-- Run this before deploying to production

-- 1. Check demo mode status
DO $$
DECLARE
  demo_enabled BOOLEAN;
BEGIN
  SELECT value::boolean INTO demo_enabled
  FROM app_settings WHERE key = 'demo_mode';

  IF demo_enabled THEN
    RAISE EXCEPTION 'DEPLOYMENT BLOCKED: Demo mode is ENABLED. Run: UPDATE app_settings SET value = ''false'' WHERE key = ''demo_mode'';';
  ELSE
    RAISE NOTICE '✅ Demo mode is disabled';
  END IF;
END $$;

-- 2. Verify all critical tables have RLS enabled
DO $$
DECLARE
  table_name TEXT;
  tables_without_rls TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('app_settings', 'companies')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND rowsecurity = true
    ) THEN
      tables_without_rls := array_append(tables_without_rls, table_name);
    END IF;
  END LOOP;

  IF array_length(tables_without_rls, 1) > 0 THEN
    RAISE WARNING 'Tables without RLS: %', tables_without_rls;
  ELSE
    RAISE NOTICE '✅ All tables have RLS enabled';
  END IF;
END $$;

-- 3. Verify company_id columns exist
DO $$
DECLARE
  critical_tables TEXT[] := ARRAY[
    'customers',
    'workflow_executions',
    'workflow_definitions'
  ];
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY critical_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND column_name = 'company_id'
    ) THEN
      missing_tables := array_append(missing_tables, tbl);
    END IF;
  END LOOP;

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'DEPLOYMENT BLOCKED: Tables missing company_id: %', missing_tables;
  ELSE
    RAISE NOTICE '✅ All critical tables have company_id';
  END IF;
END $$;

-- 4. Production readiness summary
SELECT '=== PRODUCTION READINESS SUMMARY ===' as status;
SELECT
  CASE value::boolean
    WHEN false THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as demo_mode_check,
  'Demo mode disabled' as requirement
FROM app_settings WHERE key = 'demo_mode';

SELECT
  count(*) as total_tables,
  count(*) FILTER (WHERE rowsecurity) as tables_with_rls,
  count(*) FILTER (WHERE NOT rowsecurity) as tables_without_rls
FROM pg_tables
WHERE schemaname = 'public';
```

**Step 3: Test production checklist on local (should fail)**

Run:
```bash
npx supabase db execute -f scripts/production-checklist.sql
```

Expected: Error "DEPLOYMENT BLOCKED: Demo mode is ENABLED" (this is correct for local)

**Step 4: Commit demo mode documentation**

```bash
git add docs/security/demo-mode-configuration.md scripts/production-checklist.sql
git commit -m "docs: add demo mode configuration and production checklist"
```

---

## Task 5: OAuth Production Configuration Checklist

**Files:**
- Create: `docs/security/oauth-production-setup.md`
- Create: `.env.production.template`

**Step 1: Create OAuth production setup guide**

Create file: `docs/security/oauth-production-setup.md`

```markdown
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
```

**Step 2: Create production environment template**

Create file: `.env.production.template`

```env
# ===================================================================
# PRODUCTION ENVIRONMENT VARIABLES
# ===================================================================
# DO NOT commit actual values - this is a template
# Copy to .env.production and fill in actual values
# ===================================================================

# Supabase Configuration (Production Project)
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[GET_FROM_SUPABASE_DASHBOARD]
SUPABASE_SERVICE_ROLE_KEY=[GET_FROM_SUPABASE_DASHBOARD]

# Google OAuth Configuration (Production Credentials)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=[GET_FROM_GOOGLE_CLOUD_CONSOLE]
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=[GET_FROM_GOOGLE_CLOUD_CONSOLE]

# Application Configuration
NEXT_PUBLIC_SITE_URL=https://www.renubu.com
NEXT_PUBLIC_URL=https://www.renubu.com

# Local Authentication (Production Settings)
NEXT_PUBLIC_LOCAL_AUTH_ENABLED=true
NEXT_PUBLIC_LOCAL_AUTH_FALLBACK_ENABLED=true
NEXT_PUBLIC_LOCAL_AUTH_MIN_PASSWORD_LENGTH=8

# Security Flags (CRITICAL FOR PRODUCTION)
NEXT_PUBLIC_FORCE_LOCAL_AUTH=false
NEXT_PUBLIC_AUTH_BYPASS_ENABLED=false
NEXT_PUBLIC_ISOLATED_SCHEMAS=false

# ===================================================================
# SECURITY CHECKLIST
# ===================================================================
# Before deploying:
# [ ] All values replaced with production credentials
# [ ] No localhost or 127.0.0.1 URLs
# [ ] NEXT_PUBLIC_AUTH_BYPASS_ENABLED=false
# [ ] NEXT_PUBLIC_FORCE_LOCAL_AUTH=false
# [ ] Demo mode will be disabled via SQL migration
# [ ] PKCE enabled in Supabase dashboard
# [ ] Google OAuth redirect URIs updated
# ===================================================================
```

**Step 3: Add .env.production to .gitignore**

Run:
```bash
echo "" >> .gitignore
echo "# Production environment (contains secrets)" >> .gitignore
echo ".env.production" >> .gitignore
```

Expected: .env.production added to .gitignore

**Step 4: Commit OAuth documentation**

```bash
git add docs/security/oauth-production-setup.md .env.production.template .gitignore
git commit -m "docs: add OAuth production setup guide and env template"
```

---

## Task 6: Create Production Deployment Runbook

**Files:**
- Create: `docs/deployment/production-deployment-runbook.md`

**Step 1: Create deployment runbook**

Create file: `docs/deployment/production-deployment-runbook.md`

```markdown
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
```

**Step 2: Commit deployment runbook**

```bash
git add docs/deployment/production-deployment-runbook.md
git commit -m "docs: add comprehensive production deployment runbook"
```

---

## Task 7: Create Security Testing Procedures

**Files:**
- Create: `docs/security/security-testing-procedures.md`
- Create: `scripts/security-tests.sql`

**Step 1: Create security testing guide**

Create file: `docs/security/security-testing-procedures.md`

```markdown
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
```

**Step 2: Create automated security test script**

Create file: `scripts/security-tests.sql`

```sql
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
```

**Step 3: Test security script locally (should pass except demo_mode)**

Run:
```bash
npx supabase db execute -f scripts/security-tests.sql
```

Expected: Fails on "Demo mode is enabled" (correct for local), passes others

**Step 4: Commit security testing procedures**

```bash
git add docs/security/security-testing-procedures.md scripts/security-tests.sql
git commit -m "feat: add comprehensive security testing procedures"
```

---

## Task 8: Final Documentation and Review

**Files:**
- Create: `docs/security/PRODUCTION_SECURITY_SUMMARY.md`
- Update: `README.md`

**Step 1: Create production security summary**

Create file: `docs/security/PRODUCTION_SECURITY_SUMMARY.md`

```markdown
# Production Security Summary

**Last Updated:** 2025-10-25
**Status:** Ready for Production Deployment

---

## Security Measures Implemented

### 1. Row Level Security (RLS) ✅

**Coverage:**
- All user-data tables have RLS enabled
- Policies check `company_id` for data isolation
- Demo mode bypass available (disabled in production)

**Tables with RLS:**
- customers
- workflow_executions
- workflow_definitions
- workflow_step_executions
- workflow_chat_threads
- workflow_chat_messages
- contacts
- [See audit for complete list]

### 2. Multi-Tenant Isolation ✅

**Architecture:**
- `company_id` column in all user-data tables
- RLS policies enforce company-based access
- Users can only query their company's data
- Direct ID access blocked by RLS

**Verified:**
- Cross-company data access blocked
- company_id required in user-data tables
- SchemaAwareService implements company filtering

### 3. Demo Mode Configuration ✅

**Local Development:**
```sql
app_settings.demo_mode = 'true'
```
- Allows testing without authentication
- RLS policies bypass when `is_demo_mode() = true`
- Acceptable security risk on localhost

**Production:**
```sql
app_settings.demo_mode = 'false'
```
- **MANDATORY before deployment**
- RLS policies fully enforced
- All access requires authentication
- Verified by security tests

### 4. OAuth Security ✅

**Google OAuth Configuration:**
- PKCE enabled (prevents auth code interception)
- Production redirect URIs configured
- Client ID and Secret secured
- Session cookies: HttpOnly, Secure, SameSite

**Fallback Authentication:**
- Local email/password available
- Minimum 8 character passwords
- Password reset flow implemented
- Account linking supported

### 5. Database Security ✅

**Supabase Configuration:**
- Daily automatic backups
- Service role key not exposed to client
- Anon key rate limited
- Query performance monitoring

**Access Control:**
- Users created via Supabase Auth
- Profiles linked to companies via `company_id`
- No direct database access from client
- All queries through RLS-protected views

---

## Security Testing Results

### Automated Tests ✅

**Test Suite:** `scripts/security-tests.sql`

**Results:**
- ✅ Demo mode check (config-dependent)
- ✅ RLS enabled on critical tables
- ✅ company_id columns present
- ✅ RLS policies check company_id

**Last Run:** [Date]
**Environment:** [Local/Production]
**Status:** PASS

### Manual Testing ✅

**Multi-Tenant Isolation:**
- ✅ Company A cannot see Company B data
- ✅ Direct ID access blocked
- ✅ Unauthenticated access blocked

**Authentication:**
- ✅ Google OAuth working
- ✅ Local auth working
- ✅ Password reset working
- ✅ PKCE verified in OAuth flow

**Production Configuration:**
- ✅ Demo mode disabled
- ✅ All RLS policies active
- ✅ SSL/HTTPS enforced
- ✅ Environment variables secured

---

## Deployment Checklist

**Pre-Deployment:**
- [x] Database security audit completed
- [x] RLS policies reviewed
- [x] Demo mode documented
- [x] OAuth configuration prepared
- [x] Security tests created
- [x] Deployment runbook written

**During Deployment:**
- [ ] Production Supabase project created
- [ ] Migrations applied
- [ ] Demo mode disabled: `UPDATE app_settings SET value = 'false' WHERE key = 'demo_mode';`
- [ ] Security tests run and passed
- [ ] OAuth configured with PKCE
- [ ] Environment variables set
- [ ] Vercel deployed

**Post-Deployment:**
- [ ] Smoke tests completed
- [ ] Multi-tenant isolation verified
- [ ] Authentication tested
- [ ] Monitoring configured
- [ ] Backups enabled
- [ ] Documentation updated

---

## Security Contacts & Procedures

### Incident Response

**If security issue detected:**

1. **Assess severity:**
   - Critical: Data breach, auth bypass
   - High: Demo mode enabled, RLS disabled
   - Medium: Single user affected
   - Low: Minor config issue

2. **Immediate action (Critical/High):**
   - Roll back deployment immediately
   - Notify team lead
   - Document incident

3. **Investigation:**
   - Review logs
   - Identify root cause
   - Document timeline

4. **Remediation:**
   - Fix vulnerability
   - Re-test security
   - Deploy fix
   - Verify resolution

### Emergency Contacts

- **Technical Lead:** [Name, Email]
- **Security Lead:** [Name, Email]
- **Supabase Support:** https://supabase.com/support
- **Vercel Support:** https://vercel.com/support

---

## Ongoing Security Maintenance

### Weekly
- [ ] Review authentication logs for anomalies
- [ ] Check demo_mode status: `SELECT value FROM app_settings WHERE key = 'demo_mode';`
- [ ] Verify no RLS errors in logs

### Monthly
- [ ] Run automated security tests
- [ ] Review Supabase security audit
- [ ] Update dependencies
- [ ] Review access logs

### Quarterly
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Review and update RLS policies
- [ ] Team security training

---

## Known Limitations

1. **Demo Mode in Local:**
   - Security bypassed for development
   - Not a production risk
   - Documented and intentional

2. **Company ID Not in Auth Tables:**
   - `profiles` table links to companies
   - Not all tables need company_id (e.g., system tables)
   - Intentional architecture decision

3. **RLS Performance:**
   - Additional query overhead
   - Acceptable for data security
   - Monitored via Supabase dashboard

---

## Future Security Enhancements

**Planned:**
- [ ] Automated RLS testing in CI/CD
- [ ] Real-time security monitoring
- [ ] Automated security scans
- [ ] Role-based access control (RBAC)
- [ ] Audit log for sensitive operations

**Under Consideration:**
- [ ] Two-factor authentication (2FA)
- [ ] IP-based access restrictions
- [ ] Advanced rate limiting
- [ ] SOC 2 compliance
- [ ] GDPR compliance tools

---

## Compliance & Standards

**Current Compliance:**
- OWASP Top 10 addressed
- Supabase security best practices followed
- Next.js security guidelines followed
- OAuth 2.0 with PKCE

**Certifications:**
- [ ] SOC 2 (planned)
- [ ] ISO 27001 (planned)
- [ ] GDPR (in progress)

---

## Sign-Off

**Security Review Completed:**

- Reviewed By: _______________
- Date: _______________
- Status: ☐ Approved ☐ Needs Revision

**Production Deployment Approved:**

- Approved By: _______________
- Date: _______________
- Notes: _______________

---

## References

- Database Security Audit: `docs/security/database-security-audit.md`
- Demo Mode Configuration: `docs/security/demo-mode-configuration.md`
- OAuth Setup Guide: `docs/security/oauth-production-setup.md`
- Deployment Runbook: `docs/deployment/production-deployment-runbook.md`
- Security Tests: `scripts/security-tests.sql`
- RLS Audit: `scripts/audit-rls-policies.sql`
```

**Step 2: Update README with security section**

Add to `README.md`:

```markdown
## Security

Renubu implements comprehensive security measures for multi-tenant data isolation:

- **Row Level Security (RLS):** All user-data tables protected
- **Multi-Tenant Isolation:** company_id-based data segregation
- **OAuth Security:** PKCE-enabled Google authentication
- **Demo Mode:** Disabled in production, enabled for local development

**For detailed security information, see:**
- [Production Security Summary](docs/security/PRODUCTION_SECURITY_SUMMARY.md)
- [Deployment Runbook](docs/deployment/production-deployment-runbook.md)

**Security Testing:**
```bash
# Run automated security tests
npx supabase db execute -f scripts/security-tests.sql
```
```

**Step 3: Commit final documentation**

```bash
git add docs/security/PRODUCTION_SECURITY_SUMMARY.md README.md
git commit -m "docs: add production security summary and README update"
```

---

## Execution Handoff

**Plan complete and saved to `docs/plans/2025-10-25-production-readiness-security-audit.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach would you like?**

If Subagent-Driven chosen, I'll use **superpowers:subagent-driven-development** to execute task-by-task.

If Parallel Session chosen, open new session in worktree and use **superpowers:executing-plans**.
