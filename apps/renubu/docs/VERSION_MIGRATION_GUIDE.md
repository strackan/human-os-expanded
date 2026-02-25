# Version Migration Guide

**Date:** November 18, 2025
**Migration:** Old versioning (0.1.6-0.1.9) → New versioning (0.0.1-0.1.6)

---

## Summary

We've restructured Renubu's version numbering to better reflect the product journey and provide more room for growth before 1.0:

- **Old:** 0.1.6, 0.1.7, 0.1.8, 0.1.9 (running out of space)
- **New:** 0.0.1-0.0.9 (early development), 0.1.0-0.1.6 (foundation), 0.2.0 (production launch)

---

## What Has Been Completed

### ✅ Code Changes

1. **RELEASE_NOTES.md** - Professional public-facing changelog created
   - Location: `C:\Users\strac\dev\renubu\RELEASE_NOTES.md`
   - Bugzilla-style format
   - Covers 0.0.1 → 0.3.0

2. **Public Release Notes Page** - Available at `/release-notes`
   - Location: `src/app/(public)/release-notes/page.tsx`
   - Server-rendered markdown
   - Accessible at: https://renubu.com/release-notes

3. **Version API Updated** - Fallback version changed from 0.1.8 → 0.1.6
   - Location: `src/app/api/version/route.ts:32,36,47`

4. **Git Tags Created** - 16 annotated tags
   - v0.0.1 through v0.0.9 (early development)
   - v0.1.0 through v0.1.6 (foundation)
   - View: `git tag -l -n9 v0.*`
   - **Action Required:** Push tags with `git push origin --tags`

5. **Migration Script Created** - Database update automation
   - Location: `scripts/migrate-to-new-versioning.ts`
   - **Status:** Partially successful (schema issues)

---

## Database Updates Required

⚠️ **IMPORTANT:** The database migration script failed due to schema mismatches. Manual updates are required.

### Current State

- ❌ All releases DELETED
- ❌ All features DELETED
- ✅ Tables are empty and ready for fresh data

### Manual Steps Required

#### Step 1: Insert Release Statuses (if not present)

```sql
INSERT INTO release_statuses (slug, name) VALUES
  ('planning', 'Planning'),
  ('complete', 'Complete')
ON CONFLICT (slug) DO NOTHING;
```

#### Step 2: Get Status IDs

```sql
SELECT id, slug FROM release_statuses;
```

Note the UUIDs for `planning` and `complete`.

#### Step 3: Insert New Releases

Replace `<complete_id>` and `<planning_id>` with actual UUIDs from Step 2.

```sql
-- Early Development (0.0.x)
INSERT INTO releases (version, name, description, release_date, actual_shipped, status_id, timeline) VALUES
  ('0.0.1', 'Genesis', 'Initial application with Renewals HQ dashboard', '2025-04-29', '2025-04-29', '<complete_id>', 'April 28-29, 2025'),
  ('0.0.2', 'Dashboard Core', 'Enhanced dashboard with snooze, actions, contracts', '2025-05-03', '2025-05-03', '<complete_id>', 'April 30 - May 3, 2025'),
  ('0.0.3', 'Workflow Experiments', 'Planning Workflow Alpha, customer modularization', '2025-05-24', '2025-05-24', '<complete_id>', 'May 4-24, 2025'),
  ('0.0.4', 'Authentication Battle', 'Supabase integration, Google OAuth', '2025-07-28', '2025-07-28', '<complete_id>', 'June 13 - July 28, 2025'),
  ('0.0.5', 'Backend Breakthrough', 'Supabase Cloud migration, 83 API routes', '2025-08-27', '2025-08-27', '<complete_id>', 'August 9-27, 2025'),
  ('0.0.6', 'Artifact Engine', '100+ artifact components, config-driven workflows', '2025-09-28', '2025-09-28', '<complete_id>', 'September 5-28, 2025'),
  ('0.0.7', 'Orchestrator Birth', 'Step-based workflow system, registry', '2025-10-27', '2025-10-27', '<complete_id>', 'October 3-27, 2025'),
  ('0.0.8', 'Labs Launch', 'Multi-domain proof of concept, Weekly Planner', '2025-10-31', '2025-10-31', '<complete_id>', 'October 28-31, 2025'),
  ('0.0.9', 'Pre-Production Polish', 'Code consolidation, documentation', '2025-11-06', '2025-11-06', '<complete_id>', 'November 1-6, 2025'),

  -- Foundation (0.1.x)
  ('0.1.0', 'Zen Dashboard', 'Dashboard modernization, living docs, production build', '2025-11-06', '2025-11-06', '<complete_id>', 'October 21 - November 6, 2025'),
  ('0.1.1', 'Multi-Tenancy', 'Workspace authentication, company_id isolation', '2025-11-08', '2025-11-08', '<complete_id>', 'November 2-8, 2025'),
  ('0.1.2', 'MCP Foundation', 'MCP Registry, OAuth integrations', '2025-11-12', '2025-11-12', '<complete_id>', 'November 7-12, 2025'),
  ('0.1.3', 'Parking Lot System', 'AI-powered event detection, LLM analysis', '2025-11-15', '2025-11-15', '<complete_id>', 'November 15, 2025'),
  ('0.1.4', 'Skip & Review Systems', 'Flow control with 4 trigger conventions', '2025-11-15', '2025-11-15', '<complete_id>', 'November 15, 2025'),
  ('0.1.5', 'String-Tie & Optimization', 'Natural language reminders, code optimization', '2025-11-16', '2025-11-16', '<complete_id>', 'November 15-16, 2025'),
  ('0.1.6', 'Workflow Templates', 'Database-driven templates, InHerSight integration', '2025-11-17', '2025-11-17', '<complete_id>', 'November 17, 2025'),

  -- Future Releases
  ('0.2.0', 'Production Launch', 'Human OS Check-In System, pattern recognition', NULL, NULL, '<planning_id>', 'Target: January 1, 2026'),
  ('0.3.0', 'TBD', 'Details to be announced', NULL, NULL, '<planning_id>', 'Target: Q2 2026');
```

#### Step 4: Regenerate Roadmap

```bash
npm run roadmap
```

#### Step 5: Verify Current Version

Visit `/api/version` or check the version indicator in the app. Should show `v0.1.6`.

---

## Features Table

The `features` table was cleared due to foreign key constraints. You'll need to manually recreate and assign features to releases.

**Recommended Approach:**
1. Review old feature data (if backed up)
2. Create new features aligned with new release structure
3. Assign to appropriate releases (0.1.3 for Parking Lot, 0.1.4 for Skip/Review, etc.)

---

## Deployment Checklist

### Before Deployment

- [ ] Execute SQL commands in Supabase dashboard (Step 1-3)
- [ ] Verify releases table has 18 rows
- [ ] Run `npm run roadmap` successfully
- [ ] Verify `/api/version` returns `0.1.6`
- [ ] Test `/release-notes` page loads correctly
- [ ] Review git tags: `git tag -l | grep "^v0\."`

### Deployment

- [ ] Push git tags: `git push origin --tags`
- [ ] Commit changes:
  ```bash
  git add RELEASE_NOTES.md src/app/api/version/route.ts src/app/\(public\)/release-notes/
  git commit -m "feat: restructure versioning to 0.0.x-0.1.x framework

  - Add professional RELEASE_NOTES.md
  - Create public /release-notes page
  - Update version API to 0.1.6
  - Add git tags v0.0.1 through v0.1.6
  - Prepare for 0.2.0 production launch"
  git push
  ```
- [ ] Deploy to staging
- [ ] Verify version indicator shows `v0.1.6`
- [ ] Verify release notes page accessible
- [ ] Deploy to production

### Post-Deployment

- [ ] Announce new versioning scheme to team
- [ ] Update any external documentation
- [ ] Plan 0.2.0 production launch features

---

## Quick Reference

### New Version Structure

| Range | Phase | Purpose | Status |
|-------|-------|---------|--------|
| 0.0.1-0.0.9 | Early Development | Initial prototyping and foundation | Complete |
| 0.1.0-0.1.6 | Foundation | Production-ready core features | Complete |
| 0.2.0 | Production Launch | Human OS Check-ins | Planning (Jan 1, 2026) |
| 0.3.0 | Growth | TBD | Planning (Q2 2026) |
| 1.0.0 | GA | General Availability | TBD |

### Files Modified

- `RELEASE_NOTES.md` - Created
- `src/app/(public)/release-notes/page.tsx` - Created
- `src/app/api/version/route.ts` - Updated fallback version
- `scripts/migrate-to-new-versioning.ts` - Created
- Git tags: v0.0.1 through v0.1.6 - Created

### Commands

```bash
# View git tags
git tag -l | grep "^v0\."

# View tag details
git tag -n9 v0.1.6

# Push tags
git push origin --tags

# Regenerate roadmap
npm run roadmap

# Check current version
curl http://localhost:3000/api/version

# View release notes locally
open http://localhost:3000/release-notes
```

---

## Rollback Plan

If needed, to rollback:

1. Restore database from backup (pre-migration)
2. Revert git commits:
   ```bash
   git revert <commit-hash>
   ```
3. Delete git tags:
   ```bash
   git tag -d v0.0.1 v0.0.2 ... v0.1.6
   git push origin --delete v0.0.1 v0.0.2 ... v0.1.6
   ```
4. Update version API back to 0.1.8

---

## Support

For questions or issues:
- Check this guide first
- Review `RELEASE_NOTES.md` for version history
- Check Supabase dashboard for database state
- Contact: [Your team lead]

---

**Last Updated:** November 18, 2025
**Migration Status:** Partially Complete - Manual Database Steps Required
**Next Action:** Execute SQL commands in Steps 1-3 above
