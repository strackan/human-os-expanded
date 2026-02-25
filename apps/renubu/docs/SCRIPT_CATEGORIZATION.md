# Complete Script File Categorization

## ✅ Category 1: Official Migrations (KEEP AS-IS)
**Location**: `supabase/migrations/` - **DO NOT MOVE**

These are version-controlled, sequential database migrations applied via Supabase CLI or Dashboard.

**Files** (50 files):
- `20250101000099_optimized_public_schema_consolidation.sql`
- `20251007140440_workflow_execution_tracking.sql`
- `20251007150000_workflow_tasks_system.sql`
- ... all timestamped migrations
- `20260202000001_string_ties_phase1_4.sql` ← Latest

**Action**: ✅ No changes needed

---

## 📦 Category 2: Production Admin Scripts
**New Location**: `scripts/admin/`

Scripts used by admins or in production for maintenance, auditing, security.

### SQL Files
1. `scripts/audit-rls-policies.sql` → Security auditing
2. `scripts/production-checklist.sql` → Pre-deployment validation
3. `scripts/security-tests.sql` → Security test suite

### TypeScript Files
4. `scripts/create-test-invite.ts` → User invite management
5. `scripts/evaluate-parking-lot-triggers.ts` → Parking lot system admin

**Action**: Move to `scripts/admin/`

---

## 🌱 Category 3: Data Seeding
**New Location**: `scripts/seed/`

Scripts that populate databases with demo, test, or initial data.

### From `supabase/scripts/`
1. `seed_obsidian_black_renewal_workflow.sql` → Demo workflow
2. `seed_demo_workflow_definitions.sql` → Workflow templates
3. `seed_contacts_relationship_data.sql` → Test contacts
4. `seed_aco_demo_data.sql` → ACO demo data
5. `seed_techflow_expansion_data.sql` → TechFlow demo
6. `seed_obsidian_black_expansion_data.sql` → Obsidian Black v1
7. `seed_obsidian_black_expansion_data_v2.sql` → Obsidian Black v2

### From `scripts/`
8. `seed-obsidian-black.ts` → TypeScript seeder
9. `seed-demo-workflows.ts` → Workflow seeder
10. `seed-database.ts` → General database seeder

### From root `supabase/`
11. `supabase/seed.sql` → Legacy seed file
12. `supabase/seed_weekly_planner_test_data.sql` → Weekly planner
13. `supabase/seed_justin_test_data.sql` → Justin's test data

**Action**: Move to `scripts/seed/`

---

## 🔧 Category 4: Development Utilities
**New Location**: `scripts/dev/`

Local development helpers, environment setup, debugging tools.

### SQL Files
1. `scripts/create-local-user.sql` → Create local auth user
2. `scripts/setup-local-oauth.sql` → OAuth development setup

### JavaScript/TypeScript Files
3. `scripts/check-env.js` → Validate environment vars
4. `scripts/check-supabase-status.js` → Test Supabase connection
5. `scripts/check-oauth-config.js` → Validate OAuth setup
6. `scripts/setup-env.js` → Initialize .env files
7. `scripts/check-mvp-data.js` → Validate MVP data structure
8. `scripts/check-db-structure.js` → Database structure check
9. `scripts/check-contacts.js` → Contact data validation
10. `scripts/check-aco-data.mjs` → ACO data check
11. `scripts/show-tables.js` → List database tables
12. `scripts/show-tables-simple.js` → Simple table listing

**Action**: Move to `scripts/dev/`

---

## 🔄 Category 5: Migration Helpers
**New Location**: `scripts/migrations/`

One-time migration helpers, consolidation scripts, manual migration tools.

### From `supabase/scripts/`
1. `consolidated_phase1_setup.sql` → Phase 1 consolidation
2. `apply_phase1_skip_escalate_migrations.sql` → Skip/Review migration

### From `scripts/`
3. `apply-phase1-migration.ts` → Phase 1 applier
4. `run-migration.ts` → Generic migration runner
5. `run-staging-migration.ts` → Staging migration runner
6. `apply-string-ties-migration.ts` → String-Tie table creator
7. `create-string-ties-table.sql` → Manual String-Tie SQL
8. `apply-contract-migrations.ts` → Contract migration
9. `apply-contract-migrations.mjs` → Contract migration (ESM)
10. `manual-contract-migration.sql` → Manual contract SQL
11. `migrate-schema-data.ts` → Schema data migration
12. `sync-schema.ts` → Schema synchronization
13. `migrate-styles.js` → Style migration

**Action**: Move to `scripts/migrations/`

---

## 📋 Category 6: Release Management
**New Location**: `scripts/releases/`

Version tracking, changelog generation, feature tracking, deployment automation.

1. `scripts/snapshot-release.ts` → Create release snapshots
2. `scripts/commit-and-track.ts` → Track commits to releases
3. `scripts/generate-roadmap.ts` → Generate ROADMAP.md
4. `scripts/query-releases.ts` → Query release data
5. `scripts/add-flow-control-releases.ts` → Add flow control versions
6. `scripts/add-release-1-4.sql` → SQL for release 1.4
7. `scripts/update-flow-control-features.ts` → Update feature tracking
8. `scripts/README-commit-and-track.md` → Commit tracking docs

**Action**: Move to `scripts/releases/`

---

## 🐛 Category 7: Debugging & One-Time Scripts
**New Location**: `scripts/debug/` (add to .gitignore)

Temporary debugging, one-time validation, exploratory queries.

### Debug Scripts
1. `scripts/debug-orchestrator.ts` → Orchestrator debugging
2. `scripts/debug-orchestrator-query.sql` → SQL debugging

### Test Scripts (One-time validation)
3. `scripts/test-local-data.js`
4. `scripts/test-customer-creation.js`
5. `scripts/test-renewal-dates.js`
6. `scripts/test-renewal-logic.sql`
7. `scripts/test-orchestrator-query.ts`
8. `scripts/test-rls-isolation.sql`
9. `scripts/test-optimized-migration.js`
10. `scripts/test-migration-deployment.js`

### Validation Scripts (One-time)
11. `scripts/validate-phase1-schema.mjs`
12. `scripts/validate-phase1-schema.ts`
13. `scripts/validate-phase2b-seeding.ts`
14. `scripts/validate-phase2b-seeding.sql`
15. `scripts/validate-optimized-sql.js`
16. `scripts/validate-schema.js`

### Verification Scripts (One-time)
17. `scripts/verify-company-isolation.sql`
18. `scripts/verify-cloud-data.js`
19. `scripts/verify-demo-executions.sql`

### Other Debug/Exploration
20. `scripts/export-local-data.js` → Data export tool
21. `scripts/populate-cloud-demo.js` → Cloud demo populator
22. `scripts/populate-cloud-full-seed.js` → Full cloud seed
23. `scripts/reset-cloud-schema.js` → Schema reset
24. `scripts/run-seed.js` → Generic seed runner
25. `scripts/run-aco-seed.mjs` → ACO seed runner
26. `scripts/seed-aco-simple.mjs` → Simple ACO seed
27. `scripts/insert-customers.js` → Customer insertion
28. `scripts/add-test-data.js` → Add test data
29. `scripts/clear-auth-cookies.js` → Clear auth cookies
30. `scripts/fix-env.js` → Fix environment files
31. `scripts/create-company-schema.ts` → Company schema creator
32. `scripts/setup-renubu-company.ts` → Renubu company setup
33. `scripts/update-preview-env.sh` → Preview environment update

**Action**: Move to `scripts/debug/` and add to .gitignore

---

## 🗄️ Category 8: Archive (Historical)
**New Location**: `docs/archive/scripts/`

Old scripts no longer in use but kept for historical reference.

### From Root Directory
1. `apply_rls_fix_prod.sql` → One-time RLS fix (Nov 2)
2. `apply_rls_fix_staging.sql` → One-time RLS fix (Nov 2)
3. `disable-rls.sql` → RLS disabler (old)
4. `enable-rls.sql` → RLS enabler (old)
5. `fix-rls-policies.sql` → RLS policy fixes (old)
6. `backup_20250810_005031.sql` → Empty backup
7. `backup_2025-08-10T04-52-42-042Z.sql` → Empty backup
8. `local_data_dump.sql` → Old data dump (43 bytes)
9. `schema.sql` → Empty schema file
10. `supabase_schema_definitions.sql` → Old schema definitions
11. `test_demo_mode.sql` → Demo mode test (61 bytes)

### From `supabase/scripts/`
12. `reset_aco_demo.sql` → ACO demo reset
13. `initialize_demo_executions.sql` → Demo initialization
14. `run_orchestrator_setup.sql` → Orchestrator setup
15. `fix_demo_mode_rls.sql` → RLS fix (one-time)
16. `fix_customers_rls.sql` → RLS fix (one-time)
17. `fix_all_workflow_tables_rls.sql` → RLS fix (one-time)
18. `fix_profiles_rls.sql` → RLS fix (one-time)
19. `fix_workflow_definitions_simple.sql` → RLS fix (one-time)
20. `FINAL_RLS_FIX.sql` → RLS fix (one-time)

### Already Archived
21. `docs/archive/v0-pre-consolidation/` → 14 SQL files (already archived)
22. `supabase/migrations-backup/` → 27 old migrations (already archived)
23. `src/lib/db/migrations/001_event_workflow_system.sql` → Legacy migration

**Action**: Move to `docs/archive/scripts/{rls-fixes,misc,v0-backups}/`

---

## Summary

### Files by Category
- ✅ **Official Migrations**: 50 files (no change)
- 📦 **Admin Scripts**: 5 files → `scripts/admin/`
- 🌱 **Seed Data**: 13 files → `scripts/seed/`
- 🔧 **Dev Utilities**: 12 files → `scripts/dev/`
- 🔄 **Migration Helpers**: 13 files → `scripts/migrations/`
- 📋 **Release Management**: 8 files → `scripts/releases/`
- 🐛 **Debug/One-Time**: 33 files → `scripts/debug/` (gitignore)
- 🗄️ **Archive**: 23 files → `docs/archive/scripts/`

### Total Files Organized: ~157 files

### Recommended Next Steps
1. Review and approve categorization
2. Execute migration plan (bash script or manual)
3. Update .gitignore for debug folder
4. Create README.md files for each category
5. Update any hardcoded paths in code
