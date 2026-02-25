# OAuth Integration Setup Guide

**Phase:** 0.2 - MCP Registry & Integrations
**Last Updated:** 2025-11-12

This guide walks through setting up OAuth credentials for Google Calendar, Gmail, and Slack integrations.

---

## Prerequisites

1. ✅ MCP Registry Infrastructure deployed (Issue #2)
2. ✅ OAuth service and routes implemented
3. ✅ `.env.local` file created (copy from `.env.example`)
4. ✅ Generate OAuth encryption key: `openssl rand -base64 32`

---

## Google OAuth Setup (Calendar + Gmail)

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: `Renubu Integrations` (or similar)
4. Click "Create"

### 2. Enable APIs

1. Navigate to **APIs & Services** → **Library**
2. Search for and enable:
   - ✅ **Google Calendar API**
   - ✅ **Gmail API**

### 3. Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** (or Internal if workspace org)
3. Fill in required fields:
   - **App name:** `Renubu`
   - **User support email:** your email
   - **Developer contact:** your email
4. Click **Save and Continue**

5. **Scopes** (click "Add or Remove Scopes"):
   - Google Calendar:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Gmail:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.readonly`
6. Click **Save and Continue**

7. **Test users** (if in Testing mode):
   - Add your email and any test user emails
   - Click **Save and Continue**

### 4. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth Client ID**
3. Application type: **Web application**
4. Name: `Renubu Web Client`
5. **Authorized redirect URIs:**
   - Development: `http://localhost:3000/api/auth/oauth/google/callback`
   - Staging: `https://staging.renubu.com/api/auth/oauth/google/callback`
   - Production: `https://app.renubu.com/api/auth/oauth/google/callback`
6. Click **Create**

7. **Copy credentials:**
   - Copy **Client ID** → Add to `.env.local` as `OAUTH_GOOGLE_CLIENT_ID`
   - Copy **Client Secret** → Add to `.env.local` as `OAUTH_GOOGLE_CLIENT_SECRET`

### 5. Update Environment Variables

```bash
# .env.local

OAUTH_GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
```

### 6. Test Google Integration

```bash
# Start dev server
npm run dev

# Navigate to:
http://localhost:3000/api/auth/oauth/google/authorize?integration=google-calendar

# Or:
http://localhost:3000/api/auth/oauth/google/authorize?integration=gmail
```

**Expected flow:**
1. Redirects to Google consent screen
2. User authorizes scopes
3. Redirects back to `/api/auth/oauth/google/callback`
4. Tokens stored encrypted in database
5. Redirects to `/settings/integrations?success=...`

---

## Slack OAuth Setup

### 1. Create Slack App

1. Go to [Slack API](https://api.slack.com/apps)
2. Click **Create New App**
3. Select **From scratch**
4. **App Name:** `Renubu`
5. **Workspace:** Select your development workspace
6. Click **Create App**

### 2. Configure OAuth & Permissions

1. Navigate to **OAuth & Permissions** (left sidebar)
2. **Redirect URLs** → Click **Add New Redirect URL**:
   - Development: `http://localhost:3000/api/auth/oauth/slack/callback`
   - Staging: `https://staging.renubu.com/api/auth/oauth/slack/callback`
   - Production: `https://app.renubu.com/api/auth/oauth/slack/callback`
3. Click **Save URLs**

### 3. Add OAuth Scopes

Scroll down to **Scopes** → **Bot Token Scopes**

Add these scopes:
- ✅ `chat:write` - Send messages
- ✅ `channels:read` - View public channels
- ✅ `users:read` - View users
- ✅ `users:read.email` - View user emails
- ✅ `im:write` - Send DMs
- ✅ `reactions:write` - Add reactions

### 4. Get Client Credentials

1. Navigate to **Basic Information** (left sidebar)
2. Scroll to **App Credentials**
3. **Copy credentials:**
   - Copy **Client ID** → Add to `.env.local` as `OAUTH_SLACK_CLIENT_ID`
   - Copy **Client Secret** → Add to `.env.local` as `OAUTH_SLACK_CLIENT_SECRET`

### 5. Install App to Workspace (for testing)

1. Navigate to **OAuth & Permissions**
2. Click **Install to Workspace**
3. Review permissions and click **Allow**
4. Copy **Bot User OAuth Token** (starts with `xoxb-`)
   - (Not needed for OAuth flow, but useful for testing)

### 6. Update Environment Variables

```bash
# .env.local

OAUTH_SLACK_CLIENT_ID=123456789.987654321
OAUTH_SLACK_CLIENT_SECRET=abc123def456ghi789jkl012mno345pq
```

### 7. Test Slack Integration

```bash
# Start dev server
npm run dev

# Navigate to:
http://localhost:3000/api/auth/oauth/slack/authorize?integration=slack
```

**Expected flow:**
1. Redirects to Slack authorization page
2. User selects workspace and authorizes
3. Redirects back to `/api/auth/oauth/slack/callback`
4. Tokens stored encrypted in database
5. Redirects to `/settings/integrations?success=...`

---

## Admin: Enable Integrations in Database

After setting up OAuth credentials, enable integrations for users:

```sql
-- Enable Google Calendar
UPDATE mcp_integrations
SET status = 'enabled'
WHERE slug = 'google-calendar';

-- Enable Gmail
UPDATE mcp_integrations
SET status = 'enabled'
WHERE slug = 'gmail';

-- Enable Slack
UPDATE mcp_integrations
SET status = 'enabled'
WHERE slug = 'slack';
```

Or via Supabase Dashboard:
1. Go to Table Editor → `mcp_integrations`
2. Find the integration row
3. Change `status` from `disabled` to `enabled`

---

## Testing Integrations

### Test Google Calendar

```typescript
import { GoogleCalendarService } from '@/lib/services/GoogleCalendarService';

// Check if connected
const isConnected = await GoogleCalendarService.isConnected(userId);

// Get upcoming events
const events = await GoogleCalendarService.getUpcomingEvents(userId, 5);
console.log('Upcoming events:', events);

// Create event
const event = await GoogleCalendarService.createEvent(userId, {
  summary: 'Test Meeting',
  start: {
    dateTime: '2025-11-15T10:00:00-08:00',
  },
  end: {
    dateTime: '2025-11-15T11:00:00-08:00',
  },
});
```

### Test Gmail

```typescript
import { GmailService } from '@/lib/services/GmailService';

// Check if connected
const isConnected = await GmailService.isConnected(userId);

// Send email
await GmailService.sendEmail(userId, {
  to: 'test@example.com',
  subject: 'Test Email',
  body: 'This is a test email from Renubu!',
});

// Get unread count
const unread = await GmailService.getUnreadCount(userId);
console.log('Unread emails:', unread);
```

### Test Slack

```typescript
import { SlackService } from '@/lib/services/SlackService';

// Check if connected
const isConnected = await SlackService.isConnected(userId);

// Post message
await SlackService.postMessage(userId, {
  channel: 'C123ABC456',
  text: 'Hello from Renubu! :wave:',
});

// List channels
const channels = await SlackService.listChannels(userId);
console.log('Available channels:', channels);
```

---

## Security Best Practices

### 1. Token Encryption

- ✅ All OAuth tokens encrypted at rest using AES-256 (pgcrypto)
- ✅ Encryption key stored in environment variable (`OAUTH_ENCRYPTION_KEY`)
- ✅ Never store encryption key in database
- ✅ Never commit `.env.local` to git

### 2. Token Refresh

- ✅ Tokens automatically refreshed before expiration (5 min buffer)
- ✅ Refresh logic handled by `OAuthService.getValidAccessToken()`
- ✅ Failed refresh marks integration as `error` status

### 3. RLS Policies

- ✅ Users can only access their own integrations and tokens
- ✅ Admin role can view all integrations for support
- ✅ Database-level security (not just application-level)

### 4. Scope Management

- ✅ Request minimum required scopes
- ✅ Scopes stored in `mcp_integrations.oauth_scopes`
- ✅ Users see requested permissions during OAuth flow

### 5. State Parameter (CSRF Protection)

- ✅ State includes: userId, integrationSlug, timestamp, nonce
- ✅ State expires after 10 minutes
- ✅ State validated on callback

---

## Troubleshooting

### "Integration not found or not enabled"

**Fix:** Enable the integration in database:
```sql
UPDATE mcp_integrations SET status = 'enabled' WHERE slug = 'google-calendar';
```

### "OAuth credentials not configured"

**Fix:** Add credentials to `.env.local`:
```bash
OAUTH_GOOGLE_CLIENT_ID=...
OAUTH_GOOGLE_CLIENT_SECRET=...
```

Then restart dev server.

### "Invalid redirect URI"

**Fix:** Ensure redirect URI in OAuth provider matches exactly:
- Google: `http://localhost:3000/api/auth/oauth/google/callback`
- Slack: `http://localhost:3000/api/auth/oauth/slack/callback`

Note: Must include protocol (`http://`) and no trailing slash.

### "Token refresh failed"

**Possible causes:**
1. Refresh token revoked by user
2. App removed from user's authorized apps
3. Scopes changed after authorization

**Fix:** User must re-authorize the integration.

### "OAUTH_ENCRYPTION_KEY not configured"

**Fix:** Generate and add encryption key:
```bash
openssl rand -base64 32
```

Add to `.env.local`:
```bash
OAUTH_ENCRYPTION_KEY=generated-key-here
```

---

## Production Deployment

### 1. Update Redirect URIs

Add production URLs to all OAuth providers:
- Google: Add `https://app.renubu.com/api/auth/oauth/google/callback`
- Slack: Add `https://app.renubu.com/api/auth/oauth/slack/callback`

### 2. Environment Variables

Set in production environment (Vercel, etc.):
```bash
OAUTH_GOOGLE_CLIENT_ID=...
OAUTH_GOOGLE_CLIENT_SECRET=...
OAUTH_SLACK_CLIENT_ID=...
OAUTH_SLACK_CLIENT_SECRET=...
OAUTH_ENCRYPTION_KEY=...  # Different key for production!
NEXT_PUBLIC_APP_URL=https://app.renubu.com
```

### 3. OAuth Consent Screen

**Google:**
- Move from "Testing" to "In Production" status
- Submit for verification if using sensitive/restricted scopes

**Slack:**
- Submit app for App Directory (optional)
- Or distribute install link to users

---

## Related Documentation

- [MCP.md](./MCP.md) - MCP architecture and security model
- [SCHEMA.md](./SCHEMA.md) - Database schema for MCP tables
- [API.md](./API.md) - API reference

---

**Need Help?**

- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- Slack OAuth: https://api.slack.com/authentication/oauth-v2
- Issues: https://github.com/Renew-Boo/renubu/issues
