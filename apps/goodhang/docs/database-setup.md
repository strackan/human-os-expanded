# Database Setup Guide

## Migrations Overview

Run these SQL migrations in order through the Supabase SQL Editor:
https://supabase.com/dashboard/project/zxzwlogjgawckfunhifb/sql

---

## Migration 001: Initial Schema

**File**: `supabase/migrations/001_initial_schema.sql`

**What it creates**:
- All database tables (profiles, applications, events, rsvps, regions)
- Enums for membership tiers, application status, user roles
- Row Level Security policies
- Indexes for performance
- Raleigh region seed data

**How to run**:
1. Open Supabase SQL Editor
2. Copy entire contents of `001_initial_schema.sql`
3. Paste and click "Run"
4. Verify: "Success. No rows returned"

---

## Migration 002: Launch Event

**File**: `supabase/migrations/002_launch_event.sql`

**What it creates**:
- The launch party event with ID `00000000-0000-0000-0000-000000000001`

**BEFORE running, update these fields**:
```sql
location: 'Your Venue Name - Raleigh, NC'
event_datetime: '2025-02-15 18:00:00-05:00'  -- Your actual date/time
capacity: 100  -- Your actual capacity
```

**How to run**:
1. Open the SQL file
2. Update location, datetime, and capacity
3. Copy to Supabase SQL Editor
4. Run and verify the event was created

---

## Migration 004: Approval Workflow

**File**: `supabase/migrations/004_approval_workflow.sql`

**What it creates**:
- `membership_status` enum and column (pending/active/suspended/alumni)
- Evaluation tracking fields in applications table
- Updated RLS policies for status-based access control
- Auto-create profile trigger on user signup
- Helper view for admin dashboard

**How to run**:
1. Open Supabase SQL Editor
2. Copy entire contents of `004_approval_workflow.sql`
3. Paste and click "Run"
4. Verify: "Success. No rows returned"

**What this enables**:
- New users default to "pending" status
- Admins can track interview scheduling and notes
- Only "active" members can RSVP to events
- Middleware automatically redirects pending users

---

## Migration 003: Seed Founding Members

**File**: `supabase/migrations/003_seed_founding_members.sql`

**What it does**:
- Provides template for making yourself admin
- Shows how to update member profiles

**How to use**:
1. First, sign up at `/login` to create your account
2. Then run this to make yourself admin:
```sql
UPDATE profiles
SET
  name = 'Your Name',
  bio = 'Your bio here',
  role = 'Founder & CEO',
  company = 'Renubu',
  linkedin_url = 'https://linkedin.com/in/yourprofile',
  interests = ARRAY['AI', 'GTM', 'Community Building'],
  user_role = 'admin',
  membership_tier = 'free'
WHERE email = 'your@email.com';
```

---

## Database Schema Reference

### Tables

**profiles** - Member profiles
- `id` (UUID, references auth.users)
- `email`, `name`, `bio`, `avatar_url`
- `role`, `company`, `linkedin_url`
- `interests` (text array)
- `membership_tier` (free/core)
- `membership_status` (pending/active/suspended/alumni)
- `user_role` (member/ambassador/admin)
- `region_id` (references regions)

**applications** - Membership applications
- `id` (UUID)
- `email`, `name`, `linkedin_url`
- `why_join`, `contribution`, `referral_source`
- `status` (pending/approved/rejected)
- `reviewed_by`, `reviewed_at`
- `interview_scheduled_at`, `interview_completed_at`
- `interview_notes`, `admin_notes`, `rejection_reason`

**events** - Events and meetups
- `id` (UUID)
- `title`, `description`, `location`
- `event_datetime`, `capacity`
- `is_public`, `created_by`
- `region_id`, `image_url`

**rsvps** - Event RSVPs
- `id` (UUID)
- `event_id` (references events)
- `user_id` (references profiles, nullable for guests)
- `guest_name`, `guest_email` (for non-members)
- `plus_ones` (integer)

**regions** - Geographic regions
- `id` (UUID)
- `name`, `slug`, `description`
- `ambassador_ids` (UUID array)

---

## Row Level Security Policies

### Profiles
- ✅ Everyone can view profiles
- ✅ Users can update their own profile

### Applications
- ✅ Anyone can submit applications
- ✅ Only admins can view/update applications

### Events
- ✅ Public events viewable by everyone
- ✅ Admins and ambassadors can create events
- ✅ Creators can update their events

### RSVPs
- ✅ Anyone can view RSVPs for public events
- ✅ Active members can create RSVPs (or guests without user_id)
- ✅ Users can delete their own RSVPs

### Regions
- ✅ Everyone can view regions
- ✅ Only admins can manage regions

---

## Testing Database Setup

### 1. Verify Tables Created

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Should show: applications, events, profiles, regions, rsvps

### 2. Check Raleigh Region

```sql
SELECT * FROM regions;
```

Should show one region: Raleigh

### 3. Test Profile Creation

Sign up at `/login`, then check:
```sql
SELECT id, email, name, user_role FROM profiles;
```

### 4. Make Yourself Admin

```sql
UPDATE profiles
SET user_role = 'admin'
WHERE email = 'your@email.com';
```

Verify:
```sql
SELECT email, user_role FROM profiles WHERE user_role = 'admin';
```

---

## Common Issues

**Issue: "relation does not exist"**
- Migration 001 wasn't run
- Run the initial schema migration first

**Issue: "duplicate key value violates unique constraint"**
- Trying to run a migration twice
- Check if data already exists before inserting

**Issue: "permission denied for table"**
- RLS policies blocking access
- Make sure you're admin or check policies

**Issue: Can't see profiles after signup**
- Profile not created automatically
- Supabase Auth creates user, but profile table is separate
- Need to create profile manually or via trigger

---

## Adding More Members

### Option 1: They Sign Up
1. Share `/login` link
2. They create account
3. You update their profile via SQL or admin dashboard

### Option 2: Manual Creation (Not Recommended)
Only use for testing. Real users should sign up.

```sql
-- Don't do this for real members!
-- This is for testing only
```

---

## Backup & Restore

### Create Backup
```sql
-- In Supabase, go to Database → Backups
-- Enable daily backups
-- Download current backup if needed
```

### Restore from Backup
- Supabase Pro plan includes automatic backups
- Can restore via dashboard
- Free tier: Manual exports only

---

## Next Steps

After setting up the database:
1. ✅ Sign up at `/login`
2. ✅ Make yourself admin
3. ✅ Update your profile with bio, interests
4. ✅ Create the launch event with real details
5. ✅ Test RSVP flow
6. ✅ Invite founding members to sign up

Your database is ready for launch! 🚀
