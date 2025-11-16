# Script and SQL File Organization Plan

## Current State Analysis

After auditing all SQL and script files across the codebase, we have files scattered in multiple locations:

### Locations
- **Root directory** (`/`) - 11 SQL files (mostly debugging/one-offs)
- **`/scripts`** - 70+ mixed TypeScript/JavaScript/SQL files
- **`/supabase/scripts`** - 18 SQL files (mix of seed data and fixes)
- **`/supabase/migrations`** - 50+ timestamped migration files ✅
- **`/supabase/migrations-backup`** - 27 old migrations (archive)
- **`/docs/archive`** - 14 very old SQL files (archive)

## Proposed Structure

### 1. Official Migrations (Already Good)
**Location**: `supabase/migrations/`
- **Keep as-is** - Timestamped, sequential migrations
- These are applied via `supabase db push` or dashboard
- **Never delete or modify** - Version controlled history

### 2. Production Admin Scripts
**New Location**: `scripts/admin/`
**Purpose**: Scripts used in production or by admins

**Files to Move Here:**
- `scripts/audit-rls-policies.sql` → RLS auditing
- `scripts/production-checklist.sql` → Pre-deployment checks
- `scripts/security-tests.sql` → Security validation
- `scripts/create-test-invite.ts` → User invite management
- Any future admin tools

### 3. Data Seeding (Production & Staging)
**New Location**: `scripts/seed/`
**Purpose**: Populate databases with demo/test data

**Files to Move Here:**
- `supabase/scripts/seed_obsidian_black_renewal_workflow.sql`
- `supabase/scripts/seed_demo_workflow_definitions.sql`
- `supabase/scripts/seed_contacts_relationship_data.sql`
- `supabase/scripts/seed_aco_demo_data.sql`
- `scripts/seed-obsidian-black.ts`
- `scripts/seed-demo-workflows.ts`

### 4. Development Utilities
**New Location**: `scripts/dev/`
**Purpose**: Local development helpers

**Files to Move Here:**
- `scripts/create-local-user.sql` → Local auth setup
- `scripts/setup-local-oauth.sql` → OAuth dev setup
- `scripts/check-env.js` → Environment validation
- `scripts/check-supabase-status.js` → Connection testing

### 5. Migration Helpers
**New Location**: `scripts/migrations/`
**Purpose**: One-time migration scripts and consolidation helpers

**Files to Move Here:**
- `supabase/scripts/consolidated_phase1_setup.sql`
- `supabase/scripts/apply_phase1_skip_escalate_migrations.sql`
- `scripts/apply-phase1-migration.ts`
- `scripts/run-migration.ts`
- `scripts/run-staging-migration.ts`
- `scripts/apply-string-ties-migration.ts`
- `scripts/create-string-ties-table.sql` → Manual table creation

### 6. Debugging & One-Time Scripts
**New Location**: `scripts/debug/` (gitignored or archived)
**Purpose**: Temporary debugging, testing, validation

**Files to Move/Archive:**
- `scripts/debug-orchestrator.ts`
- `scripts/debug-orchestrator-query.sql`
- `scripts/test-*.js` (various test files)
- `scripts/validate-*.js` (one-time validations)
- `scripts/check-*.js` (one-time checks)

### 7. Archive (Keep for History)
**Location**: `docs/archive/scripts/`
**Purpose**: Historical scripts no longer in use

**Files to Archive:**
- Root SQL files: `disable-rls.sql`, `enable-rls.sql`, `fix-rls-policies.sql`
- `backup_*.sql` (empty files)
- `schema.sql`, `local_data_dump.sql`
- `apply_rls_fix_prod.sql`, `apply_rls_fix_staging.sql`
- `supabase/scripts/fix_*.sql` (one-time RLS fixes)
- All files in `supabase/migrations-backup/` (already archived)
- All files in `docs/archive/v0-pre-consolidation/`

### 8. Release Management
**Location**: `scripts/releases/` (NEW)
**Purpose**: Version tracking, changelog, deployment

**Files to Move Here:**
- `scripts/snapshot-release.ts`
- `scripts/commit-and-track.ts`
- `scripts/generate-roadmap.ts`
- `scripts/query-releases.ts`
- `scripts/add-flow-control-releases.ts`
- `scripts/add-release-1-4.sql`
- `scripts/update-flow-control-features.ts`

## New Directory Structure

```
renubu/
├── scripts/
│   ├── admin/              # Production admin tools
│   │   ├── audit-rls-policies.sql
│   │   ├── production-checklist.sql
│   │   ├── security-tests.sql
│   │   └── create-test-invite.ts
│   ├── seed/               # Data seeding
│   │   ├── obsidian-black-renewal.sql
│   │   ├── demo-workflows.ts
│   │   └── contacts-relationships.sql
│   ├── dev/                # Local development
│   │   ├── create-local-user.sql
│   │   ├── setup-local-oauth.sql
│   │   ├── check-env.js
│   │   └── README.md
│   ├── migrations/         # Migration helpers
│   │   ├── consolidated-phase1-setup.sql
│   │   ├── apply-string-ties-migration.ts
│   │   ├── run-migration.ts
│   │   └── README.md
│   ├── releases/           # Release management
│   │   ├── snapshot-release.ts
│   │   ├── commit-and-track.ts
│   │   ├── generate-roadmap.ts
│   │   └── README.md
│   ├── debug/              # Debugging (gitignored)
│   │   ├── .gitkeep
│   │   └── README.md
│   └── README.md           # Main scripts documentation
├── supabase/
│   ├── migrations/         # ✅ Official migrations (DON'T TOUCH)
│   └── seed.sql            # Legacy seed file (consider moving)
├── docs/
│   └── archive/
│       └── scripts/        # Historical scripts
│           ├── v0-pre-consolidation/
│           ├── rls-fixes/
│           └── misc/
└── [root files archived or removed]
```

## Immediate Actions

### Phase 1: Archive Clutter (Remove from root)
1. Move root SQL files to `docs/archive/scripts/misc/`
2. Delete empty backup files
3. Archive old RLS fix scripts

### Phase 2: Create New Structure
1. Create new directories: `scripts/{admin,seed,dev,migrations,releases,debug}`
2. Add README.md to each with purpose and examples

### Phase 3: Migrate Files
1. Move files according to categorization above
2. Update any import paths in TypeScript files
3. Update package.json scripts if needed

### Phase 4: Documentation
1. Create `scripts/README.md` as main index
2. Document each category with usage examples
3. Add .gitignore for `scripts/debug/`

## Benefits

✅ **Clear Separation**: Migrations vs utilities vs one-offs
✅ **Easy Discovery**: New devs know where to look
✅ **Safe Deletion**: Debug scripts can be gitignored
✅ **Better History**: Archive preserves context
✅ **Maintainable**: Less clutter, clearer purpose
