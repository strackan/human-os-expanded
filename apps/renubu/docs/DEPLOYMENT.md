# Deployment - Renubu Release Process

**Last Updated:** 2025-11-07
**Version:** 0.1
**Audience:** Internal (Engineers, Ops)

---

## Overview

This document describes the deployment process for Renubu, including environment setup, release procedures, testing protocols, and rollback strategies.

---

## Environments

### Local Development
- **URL:** http://localhost:3000
- **Database:** Local Supabase (Docker) OR cloud Supabase (staging project)
- **Purpose:** Development and testing
- **Demo Mode:** Enabled (localhost only)

### Staging (Preview)
- **URL:** https://renubu-preview-xyz.vercel.app (auto-generated)
- **Database:** Supabase Staging Project
- **Purpose:** Pre-production testing
- **Trigger:** Any PR to main
- **Lifetime:** Active while PR open

### Production
- **URL:** https://app.renubu.com
- **Database:** Supabase Production Project
- **Purpose:** Live customer-facing application
- **Trigger:** Merge to main branch
- **Deployment:** Automatic via Vercel

---

## Deployment Process

### Automatic Deployment (Standard)

**1. Create Feature Branch:**
```bash
git checkout -b feature/my-feature
```

**2. Develop & Test Locally:**
```bash
# Make changes
npm run build   # Ensure builds
npm run lint    # Check linting
npx tsc --noEmit  # TypeScript check
```

**3. Commit & Push:**
```bash
git add .
git commit -m "feat: description"
git push origin feature/my-feature
```

**4. Create Pull Request:**
- GitHub automatically creates preview deployment
- Vercel bot comments with preview URL
- Review changes in preview environment

**5. Merge to Main:**
- After approval, merge PR
- Vercel automatically deploys to production
- Live in ~2-3 minutes

### Manual Deployment (Emergency)

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

---

## Pre-Deployment Checklist

### Code Quality
- [ ] TypeScript compiles with 0 new errors
- [ ] All tests pass
- [ ] Linting passes
- [ ] Build completes successfully
- [ ] No console errors in development

### Database
- [ ] Migrations tested locally
- [ ] RLS policies verified
- [ ] Seed data works (if applicable)
- [ ] Backup created (if schema changes)

### Environment Variables
- [ ] All required env vars set in Vercel
- [ ] Secrets not committed to git
- [ ] Production keys different from staging

### Testing
- [ ] Feature manually tested locally
- [ ] Auth flows work
- [ ] API endpoints return expected data
- [ ] UI renders correctly on mobile

---

## Database Migrations

### Local Testing
```bash
# Start local Supabase
npx supabase start

# Apply migrations
npx supabase db reset

# Test migration
npm run dev
# Verify feature works
```

### Staging Deployment
```bash
# Push to staging Supabase
npx supabase db push --db-url $STAGING_DB_URL

# Verify schema
npx supabase db diff
```

### Production Deployment

**⚠️ ALWAYS BACKUP FIRST**

```bash
# 1. Create backup
# (Use Supabase dashboard: Database > Backups > Create Backup)

# 2. Push migration
npx supabase db push --db-url $PRODUCTION_DB_URL

# 3. Verify schema
npx supabase db diff --db-url $PRODUCTION_DB_URL

# 4. Test critical paths
# - Auth login
# - Workflow creation
# - Task updates
```

---

## Release Process

### Version Numbers

**Format:** `MAJOR.MINOR.PATCH`
- **MAJOR:** Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR:** New features (e.g., 1.0.0 → 1.1.0)
- **PATCH:** Bug fixes (e.g., 1.0.0 → 1.0.1)

**Current:** Pre-1.0 (using dates: 2025-11-07, 2025-11-15, etc.)

### Release Checklist

**1. Pre-Release (1 day before):**
- [ ] All features merged to main
- [ ] Staging environment tested
- [ ] Database migrations prepared
- [ ] Release notes drafted
- [ ] Customer communication planned (if needed)

**2. Release Day:**
- [ ] Create backup of production database
- [ ] Apply database migrations (if any)
- [ ] Merge final PR to main
- [ ] Vercel deploys automatically
- [ ] Verify production deployment
- [ ] Test critical user flows
- [ ] Monitor error logs (Vercel dashboard)

**3. Post-Release:**
- [ ] Create git tag: `git tag -a v0.1 -m "Release 0.1"`
- [ ] Push tag: `git push origin v0.1`
- [ ] Create release snapshot: SQL function `create_release_snapshot()`
- [ ] Update PLAN.md with next phase
- [ ] Notify customers (if applicable)

---

## Rollback Procedure

### If Deployment Fails

**Option 1: Revert Commit (Fastest)**
```bash
# 1. Revert the problematic commit
git revert HEAD

# 2. Push to main
git push origin main

# 3. Vercel automatically redeploys previous version
```

**Option 2: Rollback via Vercel Dashboard**
1. Go to Vercel dashboard
2. Find previous successful deployment
3. Click "Promote to Production"
4. Previous version goes live immediately

**Option 3: Emergency Hotfix**
```bash
# 1. Create hotfix branch from last good commit
git checkout -b hotfix/critical-fix <last-good-commit>

# 2. Fix the issue
# 3. Push and merge immediately
git push origin hotfix/critical-fix
# Merge PR (skip normal review process for emergencies)
```

### If Database Migration Fails

**⚠️ CRITICAL: Do not run more migrations until fixed**

```bash
# 1. Restore from backup (Supabase dashboard)

# 2. Investigate migration error
npx supabase db diff

# 3. Fix migration locally
# Edit migration file

# 4. Test fix locally
npx supabase db reset

# 5. Re-apply to production
npx supabase db push --db-url $PRODUCTION_DB_URL
```

---

## Monitoring

### Health Checks

**Application Health:**
- Vercel Dashboard: https://vercel.com/dashboard
- Check deployment status
- Monitor error logs
- View function logs

**Database Health:**
- Supabase Dashboard: https://app.supabase.com
- Check connection pool usage
- Monitor query performance
- Review RLS policy logs

### Key Metrics to Watch

**After Deployment:**
- [ ] Response times (should be < 500ms for most requests)
- [ ] Error rate (should be < 1%)
- [ ] Auth success rate (should be > 99%)
- [ ] Database connection errors (should be 0)

**Tools:**
- Vercel Analytics (built-in)
- Supabase Logs
- Browser console (for frontend errors)

---

## Troubleshooting

### Common Deployment Issues

**Issue: Build fails in Vercel**
```
Solution:
1. Check build logs in Vercel dashboard
2. Verify all dependencies in package.json
3. Ensure TypeScript compiles locally first
4. Check for environment variable issues
```

**Issue: Database connection fails**
```
Solution:
1. Verify env vars in Vercel (SUPABASE_URL, SUPABASE_ANON_KEY)
2. Check Supabase project status
3. Verify RLS policies aren't blocking queries
4. Check network connectivity
```

**Issue: Auth not working**
```
Solution:
1. Check Supabase Auth settings
2. Verify redirect URLs configured correctly
3. Check session cookie settings
4. Verify OAuth credentials (if using)
```

---

## Emergency Contacts

**Deployment Issues:**
- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.io

**Internal:**
- Justin Strackany (Owner)
- Claude Code (Development Agent)

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [DEV-GUIDE.md](./DEV-GUIDE.md) - Development guide
- [PLAN.md](./PLAN.md) - Release schedule

---

**Note:** This is a living document. Update as deployment process evolves.
