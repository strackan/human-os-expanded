# Demo Mode Testing Guide

Demo mode auto-authenticates as **justin@renubu.com** to allow local testing with real user data and working RLS policies.

## What Was Changed

1. **`.env.local`** - Enabled demo mode:
   ```
   NEXT_PUBLIC_DEMO_MODE=true
   NEXT_PUBLIC_DEMO_USER_ID=d152cc6c-8d71-4816-9b96-eccf249ed0ac
   SUPABASE_SERVICE_ROLE_KEY=<needs real key from Supabase dashboard>
   ```

2. **`AuthProvider.tsx`** - Auto-authenticates as justin@renubu.com in demo mode:
   - User ID: From `NEXT_PUBLIC_DEMO_USER_ID` env var
   - Email: `justin@renubu.com`
   - Name: Justin Stracity
   - **No OAuth/Supabase auth calls** - instant login

3. **`RouteGuard.tsx`** - Skips auth redirect checks in demo mode

4. **`auth-config.ts`** - Added `/test` route to public routes

5. **`server.ts`** - Uses service role key in demo mode to bypass RLS

6. **`route.ts`** (API) - Injects demo user instead of checking auth

## IMPORTANT: Get Service Role Key

Demo mode requires the service role key to bypass RLS checks. Get it from:
https://supabase.com/dashboard/project/amugmkrihnjsxlpwdzcy/settings/api

Copy the **service_role** key (not anon) and update `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Never commit this key to git! It bypasses all security.**

## How to Test

### 1. Verify Demo Mode is Active

Open your browser console and navigate to any page. You should see:
```
🎮 [DEMO MODE] Auto-authenticated as justin@renubu.com (User ID: d152cc6c-...)
🎮 DEMO MODE: Skipping auth check for: /your-path
🎮 [DEMO MODE] Using service role key to bypass RLS
🎮 [DEMO MODE] API using demo user: justin@renubu.com
```

### 2. Test Calendar Service

Navigate to: **http://localhost:3000/test/calendar**

This page should now load without authentication redirects. It provides:

- **Find Next Opening** - Test the AI scheduling algorithm
  - Adjust duration slider (15-240 minutes)
  - Select task type (deep work, meeting, admin, etc.)
  - Click "Find Next Opening" to see scoring and reasoning

- **Workload Analysis** - Test workload integration
  - See snoozed workflows, customer renewals, priorities
  - View categorization (urgent/important/routine/suggested)

- **Weekly Availability** - View the full week's calendar
  - Shows meetings, focus blocks, available slots
  - Color-coded by availability

### 3. Test API Endpoints Directly

You can also test the API endpoints via curl or browser:

```bash
# Find next opening
curl "http://localhost:3000/api/test/calendar?action=findNextOpening&duration=60&taskType=deep"

# Get workload analysis
curl "http://localhost:3000/api/test/calendar?action=workload"

# Get weekly availability
curl "http://localhost:3000/api/test/calendar?action=availability"

# Get user preferences
curl "http://localhost:3000/api/test/calendar?action=preferences"
```

## Expected Test Data

The demo user should have access to the test data seeded in:
- `supabase/seed_weekly_planner_test_data.sql`

This includes:
- 3 active projects
- Work hours: M-F 9am-5pm
- Focus blocks: M/W/F 9-11am
- 2 weekly plans (last week + current)
- 8 commitments with completion tracking
- 7 scheduled tasks

## Troubleshooting

### Still Getting Redirected to Signin?

1. Check console for demo mode logs - should see 🎮 emojis
2. Verify environment variables loaded: `console.log(process.env.NEXT_PUBLIC_DEMO_MODE)`
3. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
4. Restart dev server if env vars were just changed

### API Errors?

- Check if Supabase local database is running: `npx supabase status`
- Verify test data was seeded: See queries in `docs/labs/TESTING-GUIDE.md`
- Check browser console for specific error messages

### No Test Data Showing?

The test data uses the first available user in the database. If you don't have test data:

1. Start Supabase: `npx supabase start`
2. Apply migrations: `npx supabase migration up`
3. Seed test data: `npx supabase db reset` (or run seed file manually)

## Disabling Demo Mode

When you're done testing, disable demo mode in `.env.local`:

```
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_AUTH_BYPASS_ENABLED=false
```

Restart the dev server for changes to take effect.

## Next Steps After Testing

Once you've verified the calendar service and workload integration work:

1. **Test the full workflow** - Wire up the weekly planning slides to the UI
2. **Build artifact components** - WeeklyPlanArtifact, FocusDocumentArtifact, etc.
3. **Implement action handlers** - saveReflection, createCalendarEvents, scheduleCheckIns
4. **Add workflow to database** - Seed 'weekly-planning' workflow definition
5. **Phase 2 features** - Project ingestion, Excel export, multi-party scheduling
