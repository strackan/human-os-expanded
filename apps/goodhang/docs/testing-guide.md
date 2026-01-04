# Testing Guide

Complete testing checklist before launch. Test each flow end-to-end to ensure everything works.

---

## Pre-Testing Setup

### 1. Verify Environment Variables

Check `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://zxzwlogjgawckfunhifb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
NEXT_PUBLIC_TYPEFORM_FORM_ID=your-form-id (if ready)
```

### 2. Start Dev Server

```bash
cd goodhang-web
npm run dev
```

Visit: http://localhost:3200

### 3. Database Ready

- [ ] All migrations run successfully
- [ ] Raleigh region exists
- [ ] Launch event created with real details

---

## Test 1: Homepage & Navigation

**URL**: http://localhost:3200

**Steps**:
1. [ ] Page loads without errors
2. [ ] Glitch intro plays (or skips if seen before)
3. [ ] Hero text displays: "FULLY ALIVE. WELL CONNECTED. UNSTOPPABLE."
4. [ ] Primary CTA says "RSVP for Launch Party"
5. [ ] Secondary CTA says "Apply for Membership"
6. [ ] Navigation links work (Home, About, Events, Member Login)
7. [ ] Footer displays correctly

**Expected**: Clean, glitch-free experience with all CTAs working

---

## Test 2: Launch Party RSVP

**URL**: http://localhost:3200/launch

**Steps**:
1. [ ] Event details display correctly (date, time, venue)
2. [ ] Attendance counter shows current count
3. [ ] Fill out RSVP form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Plus Ones: Select 1
4. [ ] Click "Count Me In"
5. [ ] Success message appears
6. [ ] Attendance counter increases
7. [ ] CTAs to directory and apply page work

**Verify in Database**:
```sql
SELECT * FROM rsvps WHERE guest_email = 'test@example.com';
```

**Expected**: RSVP saved, counter updates, confirmation shown

---

## Test 3: Member Directory

**URL**: http://localhost:3200/members/directory

**Steps**:
1. [ ] Page loads with member count (may be 0 initially)
2. [ ] Search bar works (try searching for names/roles)
3. [ ] Filter tabs work (All / Founding / Core)
4. [ ] If members exist, cards display correctly:
   - Avatar or initial
   - Name, role, company
   - Membership tier badge
   - Bio and interests
   - LinkedIn link (if provided)
5. [ ] No errors if directory is empty
6. [ ] "Apply Now" CTA works

**Expected**: Clean grid view, functional search and filters

---

## Test 4: Authentication Flow

**URL**: http://localhost:3200/login

### Part A: Sign Up
1. [ ] Enter email: `you@yourdomain.com`
2. [ ] Enter password: Create secure password
3. [ ] Click "Sign In" (will create account if new)
4. [ ] Check email for verification (if required)
5. [ ] Redirected to `/members` dashboard

### Part B: Profile Check
After signup, check database:
```sql
SELECT * FROM profiles WHERE email = 'you@yourdomain.com';
```

**If profile doesn't exist**: Auth user created but no profile row. This is expected - profiles are created separately.

### Part C: Make Yourself Admin
```sql
INSERT INTO profiles (id, email, name, user_role, membership_tier)
VALUES (
  'YOUR_AUTH_USER_ID',  -- Get from auth.users table
  'you@yourdomain.com',
  'Your Name',
  'admin',
  'free'
);
```

Or if profile exists:
```sql
UPDATE profiles
SET user_role = 'admin'
WHERE email = 'you@yourdomain.com';
```

### Part D: Verify Admin Access
1. [ ] Log out and log back in
2. [ ] "Admin" link appears in navigation
3. [ ] Can access `/admin` (will build this next)

**Expected**: Successful login, profile created, admin role assigned

---

## Test 5: Member Dashboard

**URL**: http://localhost:3200/members (requires login)

**Steps**:
1. [ ] Must be logged in (redirects to `/login` if not)
2. [ ] Welcome message shows your name or email
3. [ ] Profile info displays (if profile complete)
4. [ ] Quick links to directory and events work
5. [ ] If admin, "Admin" nav link visible
6. [ ] Logout button works

**Expected**: Personalized dashboard with working links

---

## Test 6: Membership Application

**URL**: http://localhost:3200/apply

**Prerequisites**:
- Typeform created and ID added to `.env.local`

**Steps**:
1. [ ] Page explains membership benefits
2. [ ] Application process clearly outlined
3. [ ] Typeform embed loads (not "⚠️ Typeform Not Configured")
4. [ ] Fill out Typeform completely
5. [ ] Submit application

**Verify in Database** (if webhook configured):
```sql
SELECT * FROM applications ORDER BY created_at DESC LIMIT 1;
```

**Expected**: Form submits, data saved to Supabase (if webhook set up)

---

## Test 7: Magic Link Login (Optional)

**URL**: http://localhost:3200/login

**Steps**:
1. [ ] Enter email only (no password)
2. [ ] Click "Send magic link instead"
3. [ ] Check email for magic link
4. [ ] Click link in email
5. [ ] Redirected to `/members` and logged in

**Expected**: Passwordless login works via email

---

## Test 8: Mobile Responsiveness

**Test on**:
- [ ] Mobile (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1920px width)

**Check**:
- [ ] Navigation doesn't overflow
- [ ] Buttons are clickable
- [ ] Text is readable
- [ ] Forms work on mobile
- [ ] Directory grid adjusts (1 col → 2 col → 3 col)

**Expected**: Site works on all screen sizes

---

## Test 9: Error Handling

### Test Invalid Login
1. [ ] Enter wrong password
2. [ ] Error message displays clearly

### Test Duplicate RSVP
1. [ ] RSVP with same email twice
2. [ ] Should handle gracefully (may allow or show error)

### Test Without Typeform
1. [ ] Remove `NEXT_PUBLIC_TYPEFORM_FORM_ID` from `.env.local`
2. [ ] Restart dev server
3. [ ] Visit `/apply`
4. [ ] Should show configuration message

**Expected**: Errors handled gracefully with clear messages

---

## Test 10: Performance

**Check**:
- [ ] Pages load in < 2 seconds
- [ ] No console errors
- [ ] No React warnings
- [ ] Images load properly
- [ ] Glitch animations don't lag

**Tools**:
- Chrome DevTools → Network tab
- Chrome DevTools → Console
- Lighthouse (built into Chrome DevTools)

**Expected**: Fast load times, no errors

---

## Production Testing Checklist

Before deploying to Vercel:

- [ ] All tests above pass locally
- [ ] Environment variables ready for production
- [ ] Database migrations run in production Supabase
- [ ] Launch event has real details
- [ ] At least 1 admin user exists
- [ ] 5-10 founding members added
- [ ] Typeform created and configured
- [ ] Custom domain DNS configured

---

## After Deployment Testing

Once deployed to https://goodhang.club:

1. [ ] Homepage loads correctly
2. [ ] Launch RSVP works (use real email)
3. [ ] Member directory shows real members
4. [ ] Login works
5. [ ] Admin access works
6. [ ] Apply page loads with Typeform
7. [ ] SSL certificate valid (🔒 in browser)
8. [ ] Mobile responsive
9. [ ] Fast page loads

---

## Known Issues to Watch For

### Issue: Profile Not Created After Signup
- Auth user exists but no profile row
- **Fix**: Create profile manually via SQL or wait for profile creation flow

### Issue: Can't Access Admin
- User role not set to 'admin'
- **Fix**: Run SQL to update user_role

### Issue: RSVP Count Doesn't Update
- Cache issue or query problem
- **Fix**: Refresh page, check Supabase data

### Issue: Typeform Not Showing
- Form ID missing or wrong
- **Fix**: Verify `NEXT_PUBLIC_TYPEFORM_FORM_ID` in environment

---

## Support & Debugging

**Supabase Dashboard**: Check data directly
- https://supabase.com/dashboard/project/zxzwlogjgawckfunhifb/editor

**Browser Console**: Check for errors
- Press F12 → Console tab

**Network Tab**: Check API calls
- Press F12 → Network tab

**Logs**: Check Vercel deployment logs (after deploy)
- Vercel dashboard → Your project → Deployments

---

## Launch Day Final Check

On the day of the happy hour:

- [ ] Site is live at goodhang.club
- [ ] Launch event details are correct
- [ ] RSVP form works
- [ ] You can log in as admin
- [ ] Member directory looks good
- [ ] Apply page ready for new members
- [ ] Mobile site tested
- [ ] Share links ready to send

You're ready to launch! 🚀
