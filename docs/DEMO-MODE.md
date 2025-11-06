# Demo Mode - Automatic Local Development Authentication

**Purpose:** Enable instant authentication for localhost development without OAuth redirects, while ensuring production safety.

---

## 🎯 How It Works

### Automatic Activation Rules:

| Environment | Domain | Demo Mode | Reason |
|------------|--------|-----------|--------|
| Development | `localhost:3000` | ✅ ON | Auto-enabled for local dev |
| Development | `127.0.0.1:3000` | ✅ ON | Auto-enabled for local dev |
| Development | `192.168.x.x:3000` | ✅ ON | Auto-enabled for local network |
| Staging | `*.vercel.app` (preview) | 🟡 Respects env var | Manual control via `NEXT_PUBLIC_DEMO_MODE` |
| Production | `renubu.com` | ❌ FORCE OFF | Always disabled |
| Production | `renubu.demo` | ❌ FORCE OFF | Always disabled |
| Production | `*.vercel.app` (prod) | ❌ FORCE OFF | Always disabled |

### When Demo Mode is ON:
1. **Auto-authenticates as justin@renubu.com** (configurable via `NEXT_PUBLIC_DEMO_USER_ID`)
2. **Skips OAuth flow** - No Google sign-in redirects
3. **Uses service role key on localhost** - Bypasses RLS for testing
4. **Shows visual indicator** - Yellow "🎮 DEMO MODE" badge in top-left corner

---

## 🔒 Security Safeguards

### 1. Production Protection
```typescript
// Force disables demo mode on production domains
const isProduction = hostname.includes('renubu.com') ||
                    hostname.includes('renubu.demo') ||
                    (hostname.includes('vercel.app') && !hostname.includes('preview'));

if (isProduction) {
  return { enabled: false, reason: 'Production domain - force disabled' };
}
```

### 2. Service Role Key Restriction
```typescript
// Only uses service role key in development, never in production
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_ALLOW_DEMO_IN_PROD) {
  return false; // Block service role key usage
}
```

### 3. Visual Indicator
- Always shows yellow "🎮 DEMO MODE" badge when active
- Prevents confusion about authentication state
- Hover to see activation reason

---

## 📋 Configuration

### Environment Variables

**Development (.env.local):**
```bash
# Demo mode auto-enabled on localhost, no config needed
# Optional: Explicitly disable demo mode on localhost
NEXT_PUBLIC_DEMO_MODE=false

# Optional: Change demo user
NEXT_PUBLIC_DEMO_USER_ID=your-user-uuid
```

**Staging (Vercel env vars):**
```bash
# Enable demo mode on staging
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_USER_ID=d152cc6c-8d71-4816-9b96-eccf249ed0ac

# Service role key for bypassing RLS
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**Production (Vercel env vars):**
```bash
# DO NOT SET - Demo mode is force-disabled on production domains
# Even if set, will be ignored due to domain protection
```

---

## 🧪 Testing Demo Mode Safety

### Test 1: Localhost Auto-Enable
```bash
# Start dev server
npm run dev

# Navigate to http://localhost:3000
# Expected: See yellow "🎮 DEMO MODE" badge
# Console: "🎮 [DEMO MODE] Auto-authenticated as justin@renubu.com"
```

### Test 2: Production Force-Disable
```bash
# Deploy to production with NEXT_PUBLIC_DEMO_MODE=true set
# Navigate to https://renubu.com or https://renubu.demo

# Expected: Normal authentication flow (OAuth)
# Expected: NO demo mode badge
# Console: "🔒 NORMAL MODE: Production domain - force disabled"
```

### Test 3: Staging Manual Control
```bash
# Deploy to Vercel preview with NEXT_PUBLIC_DEMO_MODE=true
# Navigate to https://your-branch-xyz.vercel.app

# Expected: See yellow "🎮 DEMO MODE" badge
# Console: "🎮 [DEMO MODE] Staging/preview - enabled via env var"
```

### Test 4: Service Role Key Restriction
```bash
# Set NODE_ENV=production
# Set NEXT_PUBLIC_DEMO_MODE=true
# Try to use service role key

# Expected: Service role key NOT used
# Console: "⚠️ Demo mode requested in production but service role key usage is blocked"
```

---

## 🛠️ Implementation Details

### Files Modified:

1. **`src/lib/demo-mode-config.ts`** ⭐ NEW
   - Centralized demo mode detection
   - Domain-based auto-enable/disable
   - Service role key safety checks

2. **`src/components/auth/AuthProvider.tsx`**
   - Uses `getDemoModeConfig()` for safe detection
   - Auto-authenticates demo user when enabled

3. **`src/components/auth/RouteGuard.tsx`**
   - Uses `getDemoModeConfig()` for safe detection
   - Skips auth redirects in demo mode

4. **`src/components/auth/DemoModeBadge.tsx`** ⭐ NEW
   - Visual indicator component
   - Shows in top-left corner when demo mode active

5. **`src/lib/supabase/server.ts`**
   - Uses `shouldUseServiceRoleKey()` for safe service role key usage
   - Only allows service role key on localhost in development

6. **`src/app/api/test/calendar/route.ts`**
   - Test API uses demo mode for local testing
   - Falls back to normal auth in production

7. **`src/app/layout.tsx`**
   - Added `<DemoModeBadge />` component

8. **`src/app/globals.css`**
   - Fixed JSON text color (general improvement, unrelated to demo mode)

---

## ✅ Benefits

1. **Instant Local Testing** - No OAuth setup needed for local dev
2. **No Manual .env Changes** - Auto-detects localhost
3. **Production Safe** - Impossible to enable on production domains
4. **Visual Clarity** - Always know when demo mode is active
5. **Flexible** - Can manually control on staging/preview environments

---

## ⚠️ Important Notes

### Service Role Key
- **Never commit** `SUPABASE_SERVICE_ROLE_KEY` to git
- Only needed for localhost testing
- Bypasses all RLS policies - use carefully
- Automatically blocked in production builds

### Demo User Requirements
- Must be a real user in your database
- Needs appropriate calendar preferences for testing
- Default: `justin@renubu.com` (configurable)

### When to Disable Demo Mode on Localhost
```bash
# Set in .env.local
NEXT_PUBLIC_DEMO_MODE=false
```

Use cases:
- Testing actual OAuth flow locally
- Testing authentication errors
- Testing RLS policies with real auth

---

## 🔮 Future Enhancements

Potential improvements for future versions:

1. **Demo User Selector** - UI to switch between demo users
2. **Demo Data Generator** - Auto-generate test calendar data
3. **Demo Session Recording** - Capture demo sessions for QA
4. **Multi-User Demo Mode** - Test collaboration features
5. **Time Travel Mode** - Simulate different dates for testing

---

## 📚 Related Documentation

- `docs/labs/DEMO-MODE-TESTING.md` - Testing guide for weekly planner
- `src/lib/demo-mode-config.ts` - Implementation source code
- `docs/labs/WEEKLY-PLANNER-OVERVIEW.md` - Project overview

---

**Last Updated:** 2025-11-03
**Status:** ✅ Ready for Main Branch Merge
