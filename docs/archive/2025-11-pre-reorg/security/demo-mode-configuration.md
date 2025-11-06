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
