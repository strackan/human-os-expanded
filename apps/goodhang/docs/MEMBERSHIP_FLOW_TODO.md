# Membership Flow Overhaul - Implementation Guide

## ✅ Completed
1. Created database migration file: `supabase/migrations/20251118000000_assessment_status_flow.sql`
   - Adds `assessment_status` enum and column to profiles
   - Adds `invite_code_used` and `assessment_completed_at` columns
   - Creates `invite_codes` table with RLS policies
   - Includes helper functions for generating/validating codes

## 🔴 Next Steps (In Priority Order)

### 1. Run Database Migration
**Action**: Copy contents of `supabase/migrations/20251118000000_assessment_status_flow.sql` and run in Supabase SQL Editor

**Why First**: All code changes depend on these new database columns

### 2. Update HomePage.tsx
**File**: `components/HomePage.tsx`

**Changes Needed**:
- Line 78-79: Remove Events link from DesktopNav
- Line 94-95: Remove Events link from MobileNav
- Line 133-135: Change "RSVP for Launch Party" button to "Take the Assessment" linking to `/assessment/start-auth`
- Lines 190-260 (newsletter section): Replace with Contact modal

**Before**:
```tsx
links={[
  { href: '/about', label: 'About' },
  { href: '/events', label: 'Events' },  // REMOVE THIS
  { href: '/login', label: 'Member Login' },
]}
```

**After**:
```tsx
links={[
  { href: '/about', label: 'About' },
  { href: '/login', label: 'Member Login' },
]}
```

### 3. Create Contact Modal Component
**New File**: `components/ContactModal.tsx`

**Purpose**: Replace newsletter signup with contact form
- Email field
- Message textarea
- Submit to `/api/contact` endpoint
- Close modal after submission

### 4. Update "Join the Club" Section
**File**: `components/HomePage.tsx` (around line 180)

**Current**: "Apply for Membership" section with Typeform description

**New Content**:
```tsx
<div id="join" className="pt-32">
  <h2 className="text-4xl font-bold font-mono mb-6">
    <span className="neon-cyan">TAKE THE ASSESSMENT</span>
  </h2>
  <p className="text-xl text-foreground-dim mb-8">
    Discover your work style, connect with your tribe, and unlock exclusive membership.
    Our assessment is our gift to you - keep your detailed results forever, whether you join or not.
  </p>
  <NeonButton variant="cyan" href="/assessment/start-auth">
    Start the Assessment
  </NeonButton>
</div>
```

### 5. Create Assessment Start Page
**New File**: `app/assessment/start-auth/page.tsx`

**UI Elements**:
- Optional "Invite Code" input field
- "Authenticate with LinkedIn" button
- If authenticated → Check assessment_status:
  - `in_progress` → redirect to `/assessment/questions`
  - `pending_review`/`trial`/`approved` → redirect to `/members`
  - `waitlist`/`rejected` → redirect to `/status/not-approved`
  - `not_started` → show assessment intro

**Auth Flow**:
1. User clicks "Authenticate with LinkedIn"
2. After OAuth callback, create/update user with `assessment_status: 'not_started'`
3. If invite code provided → validate and set `assessment_status: 'trial'` after assessment
4. If no invite code → set `assessment_status: 'pending_review'` after assessment

### 6. Update Auth Callback
**File**: `app/auth/callback/route.ts`

**Current** (line 7):
```tsx
const next = searchParams.get('next') ?? '/members'
```

**New Logic**:
```tsx
// Check user's assessment status
const { data: profile } = await supabase
  .from('profiles')
  .select('assessment_status')
  .eq('id', user.id)
  .single();

let next = '/members'; // default

if (!profile || profile.assessment_status === 'not_started') {
  next = '/assessment/start-auth';
} else if (profile.assessment_status === 'in_progress') {
  next = '/assessment/questions';
} else if (['waitlist', 'rejected'].includes(profile.assessment_status)) {
  next = '/status/not-approved';
}
// Otherwise redirect to members (trial, approved, pending_review)
```

### 7. Create Status Page for Rejected/Waitlist
**New File**: `app/status/not-approved/page.tsx`

**Content** (from your spec):
```tsx
<strong>Thanks for your interest in Good Hang.</strong>

Right now, we're building carefully to ensure great experiences for everyone.
Unfortunately, we're not able to bring you into the community at this time.

<strong>Want Good Hang in your city?</strong>
We're expanding all the time - [Contact Us] and let us know where you are.

Questions? Reach out to help@goodhang.club
```

### 8. Update Members Page Access Control
**File**: `app/members/page.tsx`

**Add Status Check** (after line 19):
```tsx
if (profile?.assessment_status === 'waitlist' || profile?.assessment_status === 'rejected') {
  redirect('/status/not-approved');
}

if (profile?.assessment_status === 'not_started' || profile?.assessment_status === 'in_progress') {
  redirect('/assessment/start-auth');
}

// Show limited features for trial members
const isTrial = profile?.assessment_status === 'trial';
const isApproved = profile?.assessment_status === 'approved';
```

### 9. Update Assessment Complete Handler
**File**: Wherever assessment completion is handled

**After user completes assessment**:
```tsx
const inviteCodeUsed = /* get from session/state */;

const newStatus = inviteCodeUsed ? 'trial' : 'pending_review';

await supabase
  .from('profiles')
  .update({
    assessment_status: newStatus,
    assessment_completed_at: new Date().toISOString(),
  })
  .eq('id', user.id);

// If trial with invite code, redirect to members
// If pending_review, show "Thanks! We'll be in touch" message
```

### 10. Create Admin Invite Code Tools
**New File**: `app/admin/invite-codes/page.tsx`

**Features**:
- Button to generate new invite code
- List of all invite codes with status (used/unused)
- Show who generated each code
- Show who used each code and when

**API Route**: `app/api/admin/invite-codes/route.ts`
- POST: Generate new code (calls `generate_invite_code()` function)
- GET: List all codes

### 11. Remove Old Apply Page
**File**: `app/apply/page.tsx`

**Replace entire content** with redirect or update to new flow

## 🎯 Testing Checklist

1. **New User Flow**:
   - [ ] Visit homepage → Click "Take the Assessment"
   - [ ] Enter invite code → Auth with LinkedIn
   - [ ] Complete assessment → Lands in /members as trial
   - [ ] Trial member sees limited features

2. **New User Without Invite**:
   - [ ] Visit homepage → Click "Take the Assessment"
   - [ ] Skip invite code → Auth with LinkedIn
   - [ ] Complete assessment → See "pending review" message
   - [ ] Cannot access /members until approved

3. **Returning User**:
   - [ ] Mid-assessment user logs in → Resumes assessment
   - [ ] Approved user logs in → Goes to /members
   - [ ] Rejected user logs in → See not-approved page

4. **Admin Tools**:
   - [ ] Admin can generate invite codes
   - [ ] Admin can see who used codes
   - [ ] Admin can approve pending members

## 📝 Database Migration SQL

```sql
-- Run this in Supabase SQL Editor:
-- (See: supabase/migrations/20251118000000_assessment_status_flow.sql)
```

## 🚨 Important Notes

- **Do NOT use sed commands** - They keep breaking the JSX structure
- **Use Edit tool carefully** - Match exact strings including whitespace
- **Test locally first** - Run `npm run dev` before deploying
- **Migration must run first** - All code depends on new DB columns
