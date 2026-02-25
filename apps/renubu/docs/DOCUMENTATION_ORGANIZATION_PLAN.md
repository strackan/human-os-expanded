# Documentation Organization Plan

## Overview

This plan organizes 224 markdown files in the `docs/` directory into a clear, logical structure that makes it easy for future developers to find relevant documentation.

**Safety Note**: This is a documentation-only reorganization. No code files, migrations, or scripts will be affected. This is purely reorganizing .md files within the docs/ folder.

## Current State Analysis

### Existing Structure
- Root-level docs (26 files) - Mix of current guides and older docs
- `docs/archive/` - 186 files in various subdirectories
  - `docs/archive/2025-11-pre-reorg/` - 97 files (most recent archive, Nov 2025)
  - `docs/archive/v0-pre-consolidation/` - 85 files (v0 legacy archive)
  - Other archive folders
- `docs/demo-roadmap/` - 4 files for Weekly Planner feature
- `docs/releases/` - 5 files for flow control releases
- `docs/snapshots/` - 10 files from Sprint 0 and Phase 0.2
- `docs/technical/` - 1 file (trigger event types)

### Problems with Current Structure
1. **26 root-level files** - Hard to find what you need
2. **Unclear what's current vs archived** - Some files at root are outdated
3. **Deep archive nesting** - `docs/archive/2025-11-pre-reorg/deployment/` is 4 levels deep
4. **Inconsistent categorization** - Similar content in different places
5. **No clear entry points** - Hard to know where to start

## Proposed New Structure

```
docs/
├── README.md                          # Main entry point - start here
├── ONBOARDING.md                      # New developer onboarding
├── DEV-GUIDE.md                       # Development workflows and standards
│
├── getting-started/                   # Quick start guides
│   ├── README.md                      # Getting started index
│   ├── OAUTH_SETUP.md
│   └── MCP.md
│
├── architecture/                      # System design and architecture
│   ├── README.md                      # Architecture index
│   ├── ARCHITECTURE.md
│   ├── MODULES_ARCHITECTURE.md
│   ├── WORKFLOWS.md
│   ├── CUSTOMERS.md
│   └── ARTIFACTS.md
│
├── database/                          # Database and schema docs
│   ├── README.md                      # Database index
│   └── SCHEMA.md
│
├── features/                          # Feature documentation
│   ├── README.md                      # Features index
│   ├── FEATURES.md
│   ├── LLM.md
│   ├── PARKING_LOT_IMPLEMENTATION.md
│   └── weekly-planner/
│       ├── README.md
│       ├── development-plan.md
│       ├── overview.md
│       └── status.md
│
├── deployment/                        # Deployment and ops
│   └── DEPLOYMENT.md
│
├── releases/                          # Release documentation
│   ├── README.md                      # Release index
│   ├── VERSIONING.md
│   ├── PHASE_1_0_COMPLETION.md
│   ├── PHASE_1_1_1_2_STATUS.md
│   ├── RELEASE_1_4_PROPOSAL.md
│   ├── RELEASE_1_4_SUMMARY.md
│   ├── 1.1-skip-enhanced.md
│   ├── 1.2-escalate-enhanced.md
│   └── flow-control-implementation-checklist.md
│
├── technical/                         # Technical references
│   ├── README.md                      # Technical index
│   ├── API.md
│   ├── GITHUB-PROJECTS-GUIDE.md
│   ├── SCRIPT_ORGANIZATION_PLAN.md
│   ├── SCRIPT_CATEGORIZATION.md
│   ├── TALENT_SYSTEM_Q1_READINESS.md
│   └── trigger-event-types.md
│
├── snapshots/                         # Point-in-time state captures
│   ├── 2025-11-05-sprint-0/
│   └── 2025-11-06-phase-0.2/
│
└── archive/                           # Historical documentation
    ├── README.md                      # What's archived and why
    ├── 2024/                          # 2024 archives (4 files)
    │   ├── AUTH_SETUP.md
    │   ├── AUTHENTICATION_SYSTEM.md
    │   ├── CUSTOMER_WORKFLOW_SYSTEM.md
    │   └── TASK_MANAGEMENT.md
    │
    ├── 2025-11-pre-reorg/            # Pre-reorganization docs (97 files)
    │   ├── README.md                  # What was reorganized
    │   ├── AGENT-COMMUNICATION.md
    │   ├── AGENTIFICATION-STRATEGY.md
    │   ├── ... (keep existing structure)
    │
    ├── v0-pre-consolidation/          # v0 legacy (85 files)
    │   ├── README.md                  # v0 context
    │   └── ... (keep existing structure)
    │
    └── phase-0.1-cleanup/             # Phase 0.1 archive (7 files)
        ├── README.md                  # Phase 0.1 context
        └── ...
```

## Categorization Rules

### Current Documentation (Root Level)
Files actively maintained and referenced:
- Core architecture/design docs
- Developer onboarding and guides
- Current feature documentation
- Active release documentation
- Technical references

### Snapshots (Keep Separate)
Point-in-time state captures for historical reference:
- Sprint snapshots
- Phase completion snapshots
- Should NOT be modified, only referenced

### Archive
Documentation that is no longer actively maintained but kept for historical context:
- Old architecture docs superseded by newer versions
- Completed migration/deployment guides
- Old refactoring plans
- Legacy system documentation

## Benefits

### For New Developers
1. **Clear entry point** - README.md → ONBOARDING.md → relevant guides
2. **Logical grouping** - Find architecture docs in architecture/, deployment in deployment/
3. **Reduced clutter** - Only ~25 current docs vs 186 archived
4. **Better discoverability** - Each category has a README index

### For Maintenance
1. **Clear separation** - Current vs historical documentation
2. **Easier updates** - Know where to update docs for each feature
3. **Better organization** - Similar content grouped together
4. **Reduced confusion** - No duplicate or conflicting information at root level

## Safety Guarantees

1. ✅ **No code changes** - Only moving .md files
2. ✅ **No migration impact** - Migrations folder untouched
3. ✅ **No script impact** - Scripts folder untouched
4. ✅ **Archive preserved** - All archived docs kept intact
5. ✅ **Snapshots preserved** - Historical snapshots unchanged
6. ✅ **Git tracked** - All moves tracked with `git mv` for history

## Next Steps

1. **Review and approve** this categorization plan
2. **Execute reorganization** - Run migration script to move files
3. **Create README files** - Add index files for each category
4. **Update references** - Check for any hardcoded doc links in code/docs
5. **Commit changes** - Single atomic commit with clear message

## Execution Plan

See `DOCUMENTATION_CATEGORIZATION.md` for detailed file-by-file categorization.
