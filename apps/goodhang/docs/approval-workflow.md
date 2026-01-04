# Good Hang: Approval Workflow

## Overview

The Good Hang membership approval workflow allows you to evaluate each applicant through an interview or assessment process before granting them full member access.

---

## How It Works

### 1. User Signs Up
- Anyone can create an account at `/login`
- Profile automatically created with `membership_status = 'pending'`
- User can browse public pages but cannot access member features

### 2. User Submits Application
- User fills out Typeform application
- Application stored in `applications` table with `status = 'pending'`
- Admin can see both user account AND application

### 3. Admin Reviews Application
- Admin logs into `/admin` dashboard
- Sees pending applications and pending users
- Clicks into individual application at `/admin/applications/[id]`

### 4. Evaluation Process
Admin can track the evaluation:
- **Schedule Interview**: Set `interview_scheduled_at` timestamp
- **Take Notes**: Add `interview_notes` during/after conversation
- **Internal Notes**: Use `admin_notes` for internal team discussion
- **Decision**: Approve or reject

### 5. Approval Decision

**If Approved:**
- Application `status` → `'approved'`
- User profile `membership_status` → `'active'`
- User gets full access to member dashboard, events, directory
- Next login redirects them to `/members` instead of `/members/pending`

**If Rejected:**
- Application `status` → `'rejected'`
- `rejection_reason` stored for internal reference
- User account remains `'pending'` (they still have account but no access)

---

## User Experience

### Pending User Flow
1. User signs up at `/login`
2. User tries to access `/members` → Redirected to `/members/pending`
3. Pending page shows:
   - Status: Application under review
   - What's next: Complete application (if not done), wait for interview
   - While you wait: Browse events, learn about Good Hang

### Active User Flow
1. User signs up
2. User submits application
3. Admin interviews and approves
4. User tries to access `/members` → Full access granted
5. Can RSVP to events, view directory, access dashboard

---

## Admin Interface

### Dashboard (`/admin`)
Shows:
- Pending applications count
- Pending users count
- Active members count
- Upcoming events count
- Quick links to review applications

### Application Review Page (`/admin/applications/[id]`)

**Application Details Section:**
- Name, email, LinkedIn
- Why they want to join
- What they can contribute
- Referral source

**User Account Status Section:**
- Shows if user has created account
- Current membership status
- Account creation date

**Evaluation & Notes Section:**
- Interview scheduling
- Interview notes
- Internal admin notes
- Save button (updates without approving)

**Approval Decision Section:**
- Rejection reason field (if rejecting)
- APPROVE button (green) - Activates user immediately
- REJECT button (red) - Marks as rejected with reason

---

## Database Schema

### New Fields in `profiles`
```sql
membership_status membership_status DEFAULT 'pending'
-- Values: 'pending' | 'active' | 'suspended' | 'alumni'
```

### New Fields in `applications`
```sql
interview_scheduled_at TIMESTAMPTZ,
interview_completed_at TIMESTAMPTZ,
interview_notes TEXT,
admin_notes TEXT,
rejection_reason TEXT
```

---

## Row Level Security (RLS)

### RSVPs
**Old:** Anyone can create RSVPs
**New:** Only active members can create RSVPs (or guests without user_id)

This prevents pending users from RSVPing to events.

### Middleware Protection
The middleware checks `membership_status` on protected routes:
- `/members/*` → Redirects pending users to `/members/pending`
- `/members/pending` → Allowed for pending users
- `/members/directory` → Public (allowed for all)

---

## Common Workflows

### Workflow 1: Standard Approval
1. User signs up → Status: `pending`
2. User submits Typeform → Application: `pending`
3. Admin schedules interview via admin panel
4. Admin conducts interview, takes notes
5. Admin clicks APPROVE → Status: `active`
6. User gets access on next login

### Workflow 2: Quick Approval (Known Member)
1. User signs up → Status: `pending`
2. User submits Typeform → Application: `pending`
3. Admin recognizes name, clicks APPROVE immediately
4. User gets access

### Workflow 3: Rejection
1. User signs up → Status: `pending`
2. User submits Typeform → Application: `pending`
3. Admin reviews, not a good fit
4. Admin enters rejection reason
5. Admin clicks REJECT → Application: `rejected`
6. User account remains pending (no access)

### Workflow 4: User Creates Account But Never Applies
1. User signs up → Status: `pending`
2. User never submits Typeform
3. Admin sees pending user in dashboard
4. Admin can reach out to remind them to apply
5. No application to approve yet

---

## Email Notifications (Future)

When you set up Resend, you can automate:
- **On signup**: Welcome email with link to complete application
- **On application submitted**: Confirmation email
- **Interview scheduled**: Calendar invite
- **Application approved**: Welcome to Good Hang email with next steps
- **Application rejected**: Polite rejection email (optional)

---

## Testing the Workflow

### 1. Create Test User
1. Go to `/login`
2. Sign up with test email
3. Check you're redirected to `/members/pending`

### 2. Submit Test Application
1. Fill out Typeform application
2. Check application appears in `/admin` dashboard

### 3. Test Admin Review
1. Log in as admin (user with `user_role = 'admin'`)
2. Go to `/admin`
3. Click on pending application
4. Fill in interview notes
5. Click APPROVE

### 4. Verify Active Access
1. Log back in as test user
2. Try to access `/members`
3. Should see full member dashboard (not pending page)
4. Try RSVPing to an event - should work

---

## Migration Instructions

To enable this workflow, run migration 004:

```sql
-- In Supabase SQL Editor
-- Copy contents of supabase/migrations/004_approval_workflow.sql
-- Paste and run
```

This adds:
- `membership_status` enum and column
- Evaluation tracking fields
- Updated RLS policies
- Auto-create profile trigger
- Helper views for admin dashboard

---

## Next Steps

After implementing approval workflow:
1. ✅ Run migration 004 in Supabase
2. ✅ Make yourself admin: `UPDATE profiles SET user_role = 'admin', membership_status = 'active' WHERE email = 'your@email.com'`
3. ✅ Test signup flow with test account
4. ✅ Test admin approval flow
5. ⏳ Set up Resend for email notifications
6. ⏳ Create email templates
7. ⏳ Deploy to production

Your approval workflow is ready! 🚀
