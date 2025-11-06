# Archive Summary - October 20, 2025

## What Was Archived

### Components & Files (3,481 lines archived, 1,822 restored)
```
archive/refactoring-2025-10-20/
├── workflows/ (3,367 lines)
│   ├── TaskModeFullscreen-v2.tsx (1,931 lines)
│   └── TaskModeFullscreen-v3.tsx (1,436 lines)
│
├── old-taskmode-components/ - **RESTORED TO CODEBASE**
│   │   Still used by: /standalone-viewer, /dynamic-hd-ai, componentImports
│   │   Note: These pages aren't in sidebar navigation
│   │   Consider migrating to new TaskMode or archiving later
│
├── demo-galleries/ (114 lines)
│   ├── AllArtifactsMasterDemoGallery.tsx
│   ├── ContactStrategyDemoGallery.tsx
│   ├── ContractOverviewDemoGallery.tsx
│   ├── PlanningChecklistDemoGallery.tsx
│   ├── PlanSummaryDemoGallery.tsx
│   └── PricingAnalysisDemoGallery.tsx
│
└── demo-test-pages/ (19 directories)
    ├── Demo pages (7):
    │   ├── complete-workflow-demo/
    │   ├── contact-strategy-demo/
    │   ├── contract-demo-standalone/
    │   ├── contract-overview-demo/
    │   ├── planning-checklist-demo/
    │   ├── plan-summary-demo/
    │   └── pricing-analysis-demo/
    │
    └── Test pages (12):
        ├── test-account-overview/
        ├── test-artifact-control/
        ├── test-auth/
        ├── test-backend-integration/
        ├── test-config/
        ├── test-dynamic-clone/
        ├── test-modal-workflow/
        ├── test-planning-checklist/
        ├── test-renewal-chat/
        ├── test-templated-dynamic/
        ├── test-workflow-chat/
        └── test-workflow-executor/
```

## Why Archived?

All archived code used the **old TaskModeAdvanced system**, which has been replaced by:
- New modular `TaskMode/` architecture (Context + Callbacks pattern)
- WorkflowExecutor system
- Config-driven workflows

The demo/test pages were:
- Not linked from main navigation
- Using deprecated APIs
- Not maintained
- Duplicating functionality now in production pages

## Impact

### Before Archival
- 29+ app pages (including 19 demo/test)
- 5,303 lines of old TaskMode code
- Multiple TaskMode implementations causing confusion

### After Archival
- 19 demo/test pages removed & archived
- 3,481 lines of old code archived
- 1,822 lines kept (still used by utility pages)
- Cleaner, more maintainable codebase
- **Build status:** ✅ Success

### Git Cleanup
When committed, git will:
- **Delete 33 files** (demo/test pages + galleries)
- **Add new modular architecture** (TaskMode/, CSMDashboard/)
- Archive folder ignored by `.gitignore` (won't be committed)
- History preserved in git log if needed

### Still Using Old TaskMode System
These pages still exist but aren't in sidebar navigation:
- `/standalone-viewer` - Uses TaskModeAdvanced
- `/dynamic-hd-ai` - Uses TaskModeStandalone
- `/standalone-component` - Uses componentImports

**Recommendation:** Evaluate if these are needed or can be archived later.

## Production Pages (Still Active)

These pages remain and use the new systems:
- `/zen-dashboard` - Main dashboard (uses new TaskMode)
- `/zen-dashboard-v2` - V2 dashboard (uses new TaskMode)
- `/obsidian-black` - Customer demo (uses new TaskMode)
- `/demo-dashboard` - CSM Dashboard (refactored)
- `/artifacts` - Artifact viewer
- `/artifacts/gallery` - Artifact gallery
- `/demo` - General demo
- `/ai-dashboard` - AI Dashboard
- `/(standalone)` routes - Various standalone viewers

## Archive Location

All archived code is in `/archive/refactoring-2025-10-20/` (git-ignored)

See `archive/refactoring-2025-10-20/README.md` for detailed restoration instructions.

---

*Created: 2025-10-20*
*Part of: TaskMode & CSM Dashboard refactoring*
