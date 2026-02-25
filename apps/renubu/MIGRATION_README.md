# Version Migration: 0.1.8 → 0.1.6 (New Structure)

**Date:** November 18, 2025
**Status:** Ready to Deploy
**Impact:** Database restructure, version numbering change

---

## Quick Start

### Option 1: Automated (Recommended)

**Windows:**
```bash
scripts\apply-version-migration.bat
```

**Linux/Mac:**
```bash
./scripts/apply-version-migration.sh
```

### Option 2: Manual (Supabase Dashboard)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy contents of `supabase/migrations/20251118000000_version_restructure.sql`
5. Paste and run
6. Run `npm run roadmap`

---

## What This Migration Does

### Database Changes

✅ **Deletes:**
- All existing releases (old 0.1.6-0.1.9 structure)
- All existing features (due to FK constraints)

✅ **Creates:**
- 18 new releases with proper versioning:
  - **0.0.1-0.0.9**: Early Development (Apr-Nov 2025)
  - **0.1.0-0.1.6**: Foundation (Oct-Nov 2025) ← **Current**
  - **0.2.0**: Production Launch (Jan 1, 2026)
  - **0.3.0**: Growth (Q2 2026)

### Code Changes (Already Applied)

✅ **Files Modified:**
- `src/app/api/version/route.ts` - Fallback version updated to 0.1.6
- `src/app/(public)/release-notes/page.tsx` - Public release notes page created
- `RELEASE_NOTES.md` - Professional changelog created

✅ **Git Tags Created:**
- v0.0.1 through v0.1.6 (16 tags)
- Ready to push with `git push origin --tags`

---

## New Version Structure

| Version Range | Phase | Status | Timeline |
|--------------|-------|--------|----------|
| 0.0.1 - 0.0.9 | Early Development | ✅ Complete | Apr - Nov 2025 |
| 0.1.0 - 0.1.6 | Foundation | ✅ Complete | Oct - Nov 2025 |
| 0.2.0 | Production Launch | 🔄 Planning | Jan 1, 2026 |
| 0.3.0 | Growth | 🔄 Planning | Q2 2026 |
| 1.0.0 | General Availability | 📋 TBD | TBD |

**Current Version:** 0.1.6 ← You are here!

---

## Migration Steps

### Pre-Migration Checklist

- [ ] Backup current database (if needed)
- [ ] Review `RELEASE_NOTES.md` to understand new structure
- [ ] Ensure `.env.local` has correct database credentials

### Apply Migration

**Choose one method:**

#### Method A: Batch Script (Windows - Easiest)
```bash
scripts\apply-version-migration.bat
```

#### Method B: Shell Script (Linux/Mac)
```bash
chmod +x scripts/apply-version-migration.sh
./scripts/apply-version-migration.sh
```

#### Method C: Direct SQL (Any Platform)
```bash
# Copy the SQL file contents
cat supabase/migrations/20251118000000_version_restructure.sql

# Then paste into Supabase Dashboard > SQL Editor
```

### Post-Migration

1. **Verify Database:**
   - Check Supabase dashboard
   - Should see 18 releases (0.0.1 - 0.3.0)

2. **Check Version API:**
   ```bash
   curl http://localhost:3000/api/version
   # Should return: {"version":"0.1.6","source":"database"}
   ```

3. **View Release Notes:**
   ```bash
   # Start dev server
   npm run dev

   # Visit in browser
   open http://localhost:3000/release-notes
   ```

4. **Regenerate Roadmap:**
   ```bash
   npm run roadmap
   ```

5. **Push Git Tags:**
   ```bash
   # View tags
   git tag -l | grep "^v0\."

   # Push all tags
   git push origin --tags
   ```

6. **Commit Changes:**
   ```bash
   git add .
   git commit -m "feat: restructure versioning to 0.0.x-0.1.x framework

   - Add professional RELEASE_NOTES.md
   - Create public /release-notes page
   - Update version API to 0.1.6
   - Add git tags v0.0.1 through v0.1.6
   - Prepare for 0.2.0 production launch

   BREAKING CHANGE: Version numbering restructured
   - Old: 0.1.6, 0.1.7, 0.1.8, 0.1.9
   - New: 0.0.1-0.0.9 (Early Dev), 0.1.0-0.1.6 (Foundation)
   - Current: 0.1.6
   - Next: 0.2.0 (Production Launch - Jan 1, 2026)"

   git push
   ```

7. **Deploy:**
   ```bash
   # Deploy to staging
   vercel --prod

   # Or your deployment method
   ```

---

## Files Included

### Migration Files
- `supabase/migrations/20251118000000_version_restructure.sql` - SQL migration
- `scripts/apply-version-migration.sh` - Unix/Linux/Mac automation
- `scripts/apply-version-migration.bat` - Windows automation

### Documentation
- `RELEASE_NOTES.md` - Public-facing changelog (Bugzilla-style)
- `docs/VERSION_MIGRATION_GUIDE.md` - Detailed technical guide
- `MIGRATION_README.md` - This file (quick start)

### Code Changes
- `src/app/api/version/route.ts` - Version API (0.1.6 fallback)
- `src/app/(public)/release-notes/page.tsx` - Public release notes page

### Git Tags
- v0.0.1 through v0.1.6 (16 tags, not yet pushed)

---

## What About Features?

⚠️ **Important:** The `features` table was cleared due to foreign key constraints.

**You have two options:**

### Option 1: Recreate Features Later (Recommended)
- Focus on getting the release structure in place first
- Manually recreate features as needed
- Assign to appropriate releases (0.1.3 = Parking Lot, 0.1.4 = Skip/Review, etc.)

### Option 2: Restore from Backup
- If you have a database backup, restore just the features
- Then manually reassign `release_id` to match new releases

---

## Verification Commands

```bash
# Check current version
curl http://localhost:3000/api/version

# View git tags
git tag -l | grep "^v0\."

# View specific tag
git tag -n9 v0.1.6

# Check release notes page
npm run dev
# Then visit: http://localhost:3000/release-notes

# Verify database (requires psql or Supabase dashboard)
# Expected: 18 rows in releases table
```

---

## Rollback Plan

If you need to rollback:

1. **Restore database from backup** (if you made one)

2. **Or manually delete new releases:**
   ```sql
   DELETE FROM releases WHERE version IN (
     '0.0.1', '0.0.2', '0.0.3', '0.0.4', '0.0.5',
     '0.0.6', '0.0.7', '0.0.8', '0.0.9',
     '0.1.0', '0.1.1', '0.1.2', '0.1.3', '0.1.4', '0.1.5', '0.1.6',
     '0.2.0', '0.3.0'
   );
   ```

3. **Restore old releases** (recreate 0.1.6-0.1.9)

4. **Revert code changes:**
   ```bash
   git revert HEAD
   ```

5. **Delete git tags:**
   ```bash
   git tag -d v0.0.1 v0.0.2 v0.0.3 v0.0.4 v0.0.5 v0.0.6 v0.0.7 v0.0.8 v0.0.9
   git tag -d v0.1.0 v0.1.1 v0.1.2 v0.1.3 v0.1.4 v0.1.5 v0.1.6
   ```

---

## Support

**Documentation:**
- Full technical guide: `docs/VERSION_MIGRATION_GUIDE.md`
- Release notes: `RELEASE_NOTES.md` or https://renubu.com/release-notes

**Database:**
- Supabase Dashboard: https://supabase.com/dashboard
- Table: `releases` (should have 18 rows)
- Table: `features` (will be empty after migration)

**Questions?**
- Review the migration SQL: `supabase/migrations/20251118000000_version_restructure.sql`
- Check logs from the migration script
- Review this README

---

## Success Criteria

✅ **Migration is complete when:**
- [ ] Database has 18 releases (verify in Supabase dashboard)
- [ ] `/api/version` returns `{"version":"0.1.6"}`
- [ ] `/release-notes` page loads successfully
- [ ] `npm run roadmap` completes without errors
- [ ] Git tags v0.0.1 through v0.1.6 exist locally
- [ ] All changes committed and pushed
- [ ] Deployed to staging/production

---

**Ready to migrate?** Run `scripts\apply-version-migration.bat` (Windows) or review the manual steps above!

**Last Updated:** November 18, 2025
**Migration File:** `supabase/migrations/20251118000000_version_restructure.sql`
**Status:** ✅ Ready for Deployment
