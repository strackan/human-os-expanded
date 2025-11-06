# Staging → Production Deployment Plan

## Current Situation

**Date:** January 29, 2025

### Branch Status
- **Production (main):**
  - Latest commit: `bf99c55` - "Added taskflow landing pages and landing page gallery"
  - ~10 commits

- **Staging (justin-strackany):**
  - Latest commit: `735c856` - "feat: implement workspace invitation system - Phase 2"
  - **69 commits ahead of main**
  - Major features added (see below)

- **New Work (feature/component-based-workflows):**
  - Pricing optimization engine
  - Component-based architecture
  - ~4,500 lines of new code
  - Not yet committed

### Major Features on Staging (justin-strackany)

**Priority Features (Should definitely go to prod):**
1. ✅ Workspace invitation system (Phase 1 & 2)
2. ✅ Connected Contracts page to database
3. ✅ Demo mode infinite loop fix
4. ✅ Sidebar navigation redesign
5. ✅ Database seeding strategies
6. ✅ Customer feature flags system
7. ✅ Dashboard improvements
8. ✅ Security audits and RLS policies
9. ✅ OAuth setup guides

**Nice-to-Have (Can defer if needed):**
- Chat integration UI improvements
- Zen Dashboard modernization
- Strategic account planning workflow
- Task mode enhancements

**Potential Concerns:**
- 69 commits is a LOT to promote at once
- High risk of breaking changes
- Should be tested thoroughly before prod

---

## Deployment Questions (Please Answer)

Before we proceed, I need to understand your setup:

### 1. Vercel Projects
- [ ] Do you have 2 separate Vercel projects (staging & prod)?
- [ ] OR is it 1 project with 2 branches (main → prod, justin-strackany → staging)?
- **URLs:**
  - Production: ______________________
  - Staging: ______________________

### 2. Supabase Setup
- [ ] Do you have 2 separate Supabase projects (staging & prod)?
- [ ] OR is it 1 Supabase project shared between both?
- **If separate:**
  - Prod Supabase URL: ______________________
  - Staging Supabase URL: ______________________

### 3. Database Migrations
- [ ] Are all migrations on staging applied?
- [ ] Are there migrations on staging that haven't been applied to prod?
- [ ] Do you have a migration tracking system?

### 4. Environment Variables
- [ ] Are staging and prod env vars documented?
- [ ] Do you know what's different between staging and prod?
- [ ] OAuth credentials set up for both environments?

### 5. Testing Status
- [ ] Has staging been tested thoroughly?
- [ ] Are there any known bugs on staging?
- [ ] Has anyone used staging for real customer data (if yes, needs data cleanup)?

### 6. Rollback Plan
- [ ] Can you easily rollback prod if deployment fails?
- [ ] Do you have a backup of prod database?

---

## Recommended Deployment Strategy

Based on the number of changes, I recommend a **phased approach**:

### Option A: Full Promotion (Higher Risk)
Merge all 69 commits from `justin-strackany` → `main`

**Pros:**
- Gets everything to prod at once
- Staging becomes clean slate for new work

**Cons:**
- High risk of breaking changes
- Hard to debug if something breaks
- Difficult to rollback specific features

**Recommended if:**
- ✅ Staging has been thoroughly tested
- ✅ You have a good rollback plan
- ✅ You can afford downtime if issues arise

### Option B: Cherry-Pick Critical Features (Lower Risk)
Select specific commits/features to promote

**Pros:**
- Lower risk
- Can test each feature in prod
- Easier to rollback

**Cons:**
- Takes longer
- More manual work
- Could miss dependencies between features

**Recommended if:**
- ✅ Some features on staging are experimental
- ✅ You want to minimize risk
- ✅ You have time for gradual rollout

### Option C: Create Release Branch (Best Practice)
1. Create `release/v1.1.0` from `main`
2. Cherry-pick tested features from `justin-strackany`
3. Test release branch thoroughly
4. Merge to `main` when ready

**Pros:**
- Most professional approach
- Clear version tracking
- Can test before prod deployment
- Easy to document what's in release

**Cons:**
- More steps
- Requires release discipline

**Recommended if:**
- ✅ You want to be extra cautious
- ✅ You have stakeholders who need to review changes
- ✅ You want proper version control

---

## My Recommendation

**I recommend Option C (Release Branch) for this promotion:**

Here's why:
1. **69 commits is risky** to promote all at once
2. **Many critical features** (workspace invites, security, DB connections)
3. **Unknown dependencies** between commits
4. **New work waiting** (pricing engine) needs clean staging
5. **Production stability is critical** for your business

---

## Step-by-Step Plan (Option C - Release Branch)

### Phase 1: Preparation (30 minutes)

1. **Document Current State**
   ```bash
   # Save current prod state
   git checkout main
   git log --oneline -1 > docs/deployment/prod-before-deploy.txt

   # Save current staging state
   git checkout justin-strackany
   git log --oneline -1 > docs/deployment/staging-before-deploy.txt
   ```

2. **Review Staging Features**
   - Test critical paths on staging
   - Document any known bugs
   - List features to include in release

3. **Backup Production**
   - Export Supabase prod database
   - Save current env vars
   - Document rollback procedure

### Phase 2: Create Release Branch (15 minutes)

```bash
# Start from main
git checkout main
git pull origin main

# Create release branch
git checkout -b release/v1.1.0

# Cherry-pick features from justin-strackany
# (We'll identify specific commits together)
git cherry-pick <commit-hash>
git cherry-pick <commit-hash>
# ...repeat for each feature

# Push release branch
git push origin release/v1.1.0
```

### Phase 3: Test Release Branch (1-2 hours)

1. **Deploy to Preview Environment**
   - Deploy release branch to Vercel preview
   - Test all critical paths
   - Verify database connections
   - Check OAuth flows

2. **Run Database Migrations**
   - Identify migrations needed
   - Test migrations on staging database clone
   - Document migration order

3. **Smoke Test Checklist**
   - [ ] Homepage loads
   - [ ] Authentication works (OAuth)
   - [ ] Dashboard displays
   - [ ] Contracts page works
   - [ ] Workspace invitations work
   - [ ] Database queries work
   - [ ] No console errors

### Phase 4: Promote to Production (30 minutes)

```bash
# Merge release to main
git checkout main
git merge release/v1.1.0

# Tag the release
git tag -a v1.1.0 -m "Production release: Workspace invites, contracts, security"

# Push to production
git push origin main
git push origin v1.1.0
```

### Phase 5: Production Verification (30 minutes)

1. **Verify Deployment**
   - Check Vercel deployment succeeded
   - Verify production URL loads
   - Test authentication

2. **Database Migrations**
   - Apply migrations to prod database (if any)
   - Verify data integrity

3. **Smoke Test Production**
   - [ ] Login works
   - [ ] Dashboard loads
   - [ ] Critical features work
   - [ ] No errors in logs

### Phase 6: Deploy New Work to Staging (30 minutes)

```bash
# Checkout feature branch
git checkout feature/component-based-workflows

# Rebase onto latest main (now includes staging features)
git rebase main

# Push to staging branch
git checkout justin-strackany
git merge feature/component-based-workflows

# Push to trigger staging deployment
git push origin justin-strackany
```

---

## Rollback Plan

If something breaks in production:

### Quick Rollback (Vercel)
1. Go to Vercel dashboard
2. Find previous production deployment
3. Click "Promote to Production"
4. Takes ~2 minutes

### Full Rollback (Git)
```bash
# Revert to previous state
git checkout main
git revert HEAD
git push origin main
```

### Database Rollback
1. Restore from backup taken in Phase 1
2. Re-apply only the migrations that were working

---

## Communication Plan

### Before Deployment
- [ ] Notify team of upcoming deployment
- [ ] Schedule deployment window (ideally low-traffic time)
- [ ] Have team available for testing

### During Deployment
- [ ] Post status updates
- [ ] Monitor error logs
- [ ] Test critical paths immediately

### After Deployment
- [ ] Announce successful deployment
- [ ] Share what changed
- [ ] Monitor for 24 hours

---

## Risk Assessment

### High Risk Items
- ⚠️ 69 commits at once (if full promotion)
- ⚠️ Database migrations
- ⚠️ Authentication changes (OAuth)
- ⚠️ RLS policy changes

### Mitigation Strategies
- ✅ Use release branch (controlled promotion)
- ✅ Test migrations on clone first
- ✅ Deploy during low-traffic window
- ✅ Have rollback plan ready
- ✅ Monitor logs closely

---

## Timeline Estimate

**Option C (Release Branch - Recommended):**
- Phase 1 (Preparation): 30 min
- Phase 2 (Create Release): 15 min
- Phase 3 (Test Release): 1-2 hours
- Phase 4 (Promote to Prod): 30 min
- Phase 5 (Verify Prod): 30 min
- Phase 6 (Deploy to Staging): 30 min

**Total: 3-4 hours**

**Option A (Full Promotion - Risky):**
- Total: 1-2 hours (but higher risk of issues)

---

## Next Steps

To proceed, please answer the questions in the "Deployment Questions" section above. Once I have that information, I can create a precise, step-by-step deployment script for your specific setup.

**What I need from you:**
1. ✅ Vercel project structure (1 or 2 projects? URLs?)
2. ✅ Supabase setup (1 or 2 projects?)
3. ✅ Which deployment option you prefer (A, B, or C)
4. ✅ When you want to deploy (now? scheduled?)
5. ✅ Any known issues on staging that should be fixed first?

Once you provide this info, I'll create the exact commands and checklist to execute the deployment safely.
