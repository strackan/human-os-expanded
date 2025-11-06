# Pair Programming Agenda: Staging → Production Deployment

**Date:** 2025-10-28
**Duration:** ~60 minutes
**Goal:** Test user administration in staging, deploy to production, verify critical paths

---

## Pre-Session Checklist (5 min before start)

- [ ] Staging environment URL accessible
- [ ] Production deployment credentials ready
- [ ] Both developers have admin access to staging
- [ ] Production deployment checklist document open
- [ ] Test user accounts ready (or ability to create them)

---

## Session Agenda

### Phase 1: Staging Review & Testing (20 min)

**1.1 Environment Verification (3 min)**
- [ ] Confirm staging is running latest code from `feature/customer-engagement-strategy-generator` branch
- [ ] Check recent commits are deployed:
  - `735c856` - Workspace invitation system Phase 2
  - `3e5925e` - Workspace invitation system Phase 1
- [ ] Verify database migrations are applied

**1.2 User Administration Testing (12 min)**

Test these workflows systematically:

- [ ] **Create User**
  - Sign up new user with email/password
  - Sign up new user with OAuth (Google/Microsoft)
  - Verify email verification flow (if applicable)

- [ ] **User Management**
  - Edit user profile (name, email, preferences)
  - View user list (if admin panel exists)
  - Assign/change user roles/permissions

- [ ] **Delete/Deactivate User**
  - Deactivate user account
  - Verify user can't sign in after deactivation

- [ ] **Password Management**
  - Reset password flow
  - Update password from profile
  - Verify old password no longer works

**1.3 Workspace Invitation System Testing (5 min)**

Based on recent commits, test:

- [ ] **Phase 1: Basic Invitations**
  - Send workspace invitation to new user
  - Accept invitation (new user perspective)
  - Verify new user has correct workspace access

- [ ] **Phase 2: Advanced Features**
  - Test role assignment during invitation
  - Test invitation expiration (if applicable)
  - Test invitation cancellation
  - Verify invitation email delivery (check spam folders)

---

### Phase 2: Production Deployment Preparation (10 min)

**2.1 Review Deployment Checklist (3 min)**

Reference: `docS/production-deployment-checklist.md`

Quick verification:
- [ ] All staging tests passed
- [ ] No known critical bugs
- [ ] Database backup scheduled
- [ ] Rollback plan understood
- [ ] Environment variables configured for production

**2.2 Pre-Deployment Sanity Checks (7 min)**

- [ ] **Code Review**
  - Review git diff between current production and staging branch
  - Verify no debug code, console.logs, or test credentials
  - Check package.json for any new dependencies

- [ ] **Database Migrations**
  - Review migration files to be applied
  - Verify migrations are idempotent (can run multiple times safely)
  - Check for any destructive operations (DROP, DELETE)

- [ ] **Configuration Review**
  - Verify production environment variables in Vercel/hosting platform
  - Check Supabase production project URL and keys
  - Confirm OAuth redirect URLs include production domain

---

### Phase 3: Production Deployment (15 min)

**3.1 Deploy to Production (5 min)**

Depending on your setup:

**Option A: Vercel/Netlify (Recommended)**
```bash
# Merge to main branch (triggers auto-deploy)
git checkout main
git merge feature/customer-engagement-strategy-generator
git push origin main

# Monitor deployment in Vercel dashboard
```

**Option B: Manual Deploy**
```bash
# Build production bundle
npm run build

# Deploy using your hosting provider's CLI
# (provider-specific commands)
```

- [ ] Trigger deployment
- [ ] Monitor build logs for errors
- [ ] Wait for deployment to complete
- [ ] Note deployment ID/timestamp for rollback reference

**3.2 Database Migration (if needed) (3 min)**

If there are pending migrations:
```bash
# Review what will be applied
npm run db:push:prod -- --dry-run

# Apply migrations
npm run db:push:prod
```

- [ ] Review migration output
- [ ] Verify no errors
- [ ] Check migration records in database

**3.3 Verify Deployment Success (2 min)**

- [ ] Production URL loads successfully
- [ ] Check browser console for errors
- [ ] Verify build number/version matches deployment
- [ ] Check health check endpoint (if exists)

---

### Phase 4: Production Smoke Tests (10 min)

**Critical Path Testing - Do these in order:**

**4.1 Authentication Flow (4 min)**
- [ ] Sign up new test user (use `+tag` in email: `yourmail+test@gmail.com`)
- [ ] Sign out
- [ ] Sign in with test credentials
- [ ] Test OAuth sign-in (Google/Microsoft)
- [ ] Verify session persists across page refresh

**4.2 User Administration (3 min)**
- [ ] Access user profile
- [ ] Update profile name
- [ ] Verify changes persist
- [ ] Test workspace invitation (send to secondary email)
- [ ] Accept invitation in new browser/incognito

**4.3 Core Workflow Test (3 min)**
- [ ] Load dashboard
- [ ] Launch a simple workflow (if available)
- [ ] Verify workflow data loads
- [ ] Test basic navigation
- [ ] Complete or exit workflow

---

### Phase 5: Wrap-Up & Documentation (5 min)

**5.1 Issue Tracking (2 min)**
- [ ] Document any issues discovered
- [ ] Create GitHub issues for non-critical bugs
- [ ] Add items to parking lot for future work

**5.2 Success Verification (2 min)**
- [ ] All critical paths working
- [ ] No error logs in production
- [ ] Performance acceptable (load times < 2s)
- [ ] Database queries optimized (no N+1 queries visible)

**5.3 Communication (1 min)**
- [ ] Notify team of successful deployment
- [ ] Update status in project management tool
- [ ] Schedule follow-up if issues found

---

## If Something Goes Wrong

### Rollback Procedure

**Quick Rollback (< 2 minutes):**
```bash
# Vercel: Revert to previous deployment
vercel rollback [previous-deployment-url]

# Or: Revert main branch
git revert [bad-commit-hash]
git push origin main
```

**Database Rollback (if needed):**
- Have database backup ready
- Document rollback SQL commands beforehand
- Test rollback in staging first if time allows

### Common Issues & Fixes

**Issue: Authentication not working**
- Check environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
- Verify OAuth redirect URLs include production domain
- Check browser cookies/localStorage

**Issue: Database connection errors**
- Verify production database URL
- Check connection pool settings
- Verify migrations completed successfully

**Issue: 500 errors**
- Check server logs in hosting dashboard
- Verify all environment variables set
- Check for missing dependencies

---

## Post-Session Follow-Up

### Immediate (within 1 hour)
- [ ] Monitor error logs
- [ ] Watch for user-reported issues
- [ ] Check performance metrics

### Next 24 hours
- [ ] Review analytics (sign-ups, active users)
- [ ] Monitor database performance
- [ ] Address any non-critical bugs discovered

### Next week
- [ ] User feedback survey
- [ ] Performance optimization if needed
- [ ] Plan next feature deployment

---

## Key Files to Have Open

1. `docS/production-deployment-checklist.md` - Full deployment checklist
2. `docS/deployment/production-deployment-runbook.md` - Detailed runbook
3. `docS/database-seeding-strategy.md` - If you need to seed production data
4. `docS/technical/OAUTH_AUTHENTICATION_GUIDE.md` - OAuth troubleshooting reference
5. `.env.production` or hosting platform env vars - Environment configuration

---

## Success Criteria

✅ **Session is successful if:**
- All user administration features working in staging
- Production deployment completed without errors
- Authentication flow works end-to-end in production
- No critical bugs discovered
- Rollback plan tested and ready if needed

---

## Notes Section (Fill in during session)

**Staging Test Results:**
```
[Document any issues here]
```

**Production Deployment:**
```
Deployment ID:
Deployment Time:
Build Duration:
```

**Issues Found:**
```
1.
2.
3.
```

**Follow-Up Tasks:**
```
1.
2.
3.
```

---

**Good luck with the deployment! 🚀**
