# Staging OAuth Configuration Guide

This guide walks through setting up Google OAuth for the Renubu staging environment.

## Prerequisites

- Staging Supabase project created: `amugmkrihnjsxlpwdzcy.supabase.co`
- Access to Google Cloud Console
- Admin access to Supabase dashboard

## Step 1: Google Cloud Console - OAuth Client Setup

### 1.1 Navigate to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one for Renubu)
3. Navigate to **APIs & Services** > **Credentials**

### 1.2 Create OAuth 2.0 Client ID (if not already created)

If you already have OAuth credentials from local development, you can reuse them by adding the staging redirect URL.

**Create New Credentials:**

1. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
2. Application type: **Web application**
3. Name: `Renubu - Staging` (or similar)

### 1.3 Configure Authorized Redirect URIs

Add the following redirect URIs:

```
https://amugmkrihnjsxlpwdzcy.supabase.co/auth/v1/callback
```

**If reusing existing credentials**, also keep your local development URL:
```
http://127.0.0.1:54321/auth/v1/callback
```

And production URL (when ready):
```
https://[your-production-project].supabase.co/auth/v1/callback
```

### 1.4 Save and Copy Credentials

After saving:
1. Copy the **Client ID** (format: `xxx.apps.googleusercontent.com`)
2. Copy the **Client Secret**

**⚠️ IMPORTANT:** Keep these credentials secure. Never commit them to git.

## Step 2: Supabase Staging - Enable Google Auth

### 2.1 Navigate to Auth Providers

1. Go to [Staging Auth Providers](https://supabase.com/dashboard/project/amugmkrihnjsxlpwdzcy/auth/providers)
2. Find **Google** in the provider list

### 2.2 Configure Google Provider

1. **Toggle enabled**: Turn ON
2. **Client ID**: Paste the Client ID from Step 1.4
3. **Client Secret**: Paste the Client Secret from Step 1.4
4. **Authorized Client IDs**: Leave empty (unless using additional clients)
5. **Skip nonce check**: Leave OFF (keep enabled for security)

### 2.3 Configure Additional Settings

Navigate to **Auth Settings** > **URL Configuration**:

1. **Site URL**: Set to your Vercel staging domain (after Step 2A.4)
   - Example: `https://renubu-staging.vercel.app`
   - Or custom domain: `https://staging.renubu.com`

2. **Redirect URLs**: Add allowed redirect URLs after OAuth:
   ```
   https://renubu-staging.vercel.app/**
   https://amugmkrihnjsxlpwdzcy.supabase.co/**
   ```

### 2.4 Save Configuration

Click **Save** to apply changes.

## Step 3: Test OAuth Flow (After Vercel Deployment)

After deploying to Vercel (Step 2A.4), test the OAuth flow:

### 3.1 Access Staging App

1. Navigate to your staging Vercel URL
2. Click **Sign in with Google**
3. Complete Google OAuth flow
4. Verify you're redirected back to staging app
5. Check that user profile is created in `public.profiles` table

### 3.2 Troubleshooting Common Issues

**Issue: "redirect_uri_mismatch" error**
- **Cause**: Redirect URI in Google Console doesn't match Supabase callback URL
- **Fix**: Verify exact match including `https://` and `/auth/v1/callback`

**Issue: "Invalid client" error**
- **Cause**: Client ID or Secret incorrect
- **Fix**: Re-copy credentials from Google Console, ensure no extra spaces

**Issue: User redirected but not logged in**
- **Cause**: Site URL misconfigured
- **Fix**: Check Site URL in Supabase Auth Settings matches Vercel domain

**Issue: "Email not confirmed" error**
- **Cause**: Email confirmation required but OAuth should auto-confirm
- **Fix**: Go to Auth Settings > Email Auth, ensure "Confirm email" is disabled for OAuth

## Step 4: Environment Variables for Vercel

When deploying to Vercel (Step 2A.4), you'll need these environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://amugmkrihnjsxlpwdzcy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[get from Supabase Settings > API]

# OAuth Configuration (optional - handled by Supabase)
# SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=[already in Supabase]
# SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=[already in Supabase]

# Application Configuration
NEXT_PUBLIC_APP_URL=https://renubu-staging.vercel.app
NODE_ENV=production
```

**To get your Supabase Anon Key:**
1. Go to [Staging Settings > API](https://supabase.com/dashboard/project/amugmkrihnjsxlpwdzcy/settings/api)
2. Copy the `anon` `public` key

## Step 5: Verify Configuration

### 5.1 Check Supabase Dashboard

1. Go to **Authentication** > **Users**
2. After testing OAuth, verify test user appears
3. Check that `email`, `full_name`, and `avatar_url` are populated

### 5.2 Check Database

Run this query in SQL Editor:

```sql
-- Verify user profile was created
SELECT
  p.id,
  p.email,
  p.full_name,
  p.company_id,
  c.name as company_name
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
ORDER BY p.created_at DESC
LIMIT 5;
```

Expected result:
- User profile exists
- `company_id` is set (to Default Company or assigned company)
- `email` and `full_name` populated from Google

## Security Considerations

### Production Checklist

Before going to production:

- [ ] Use separate OAuth credentials for staging vs production
- [ ] Enable PKCE (configured automatically by Supabase)
- [ ] Configure proper Site URL (no wildcards in production)
- [ ] Limit redirect URLs to known domains only
- [ ] Enable email confirmation if required by business logic
- [ ] Review RLS policies are enabled on all tables
- [ ] Test that users can only access their company's data

### Rate Limiting

Google OAuth has rate limits:
- **10,000 requests/day** for unverified apps
- **Unlimited** for verified apps

For production, consider [verifying your app](https://support.google.com/cloud/answer/9110914) with Google.

## Next Steps

After OAuth is configured:

1. ✅ Complete Step 2A.3 (this guide)
2. → Move to Step 2A.4: Deploy to Vercel staging
3. → Test OAuth flow end-to-end
4. → Continue with Phase 2B: Route cleanup audit

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Auth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
