# Documentation Consolidation Plan (Streamlined)

**Problem:** 88+ markdown files with no organization or versioning
**Solution:** Category-based structure with cross-referencing

---

## Proposed Structure

```
docs/
├── README.md                           # Navigation hub (start here)
│
├── product/                            # User-facing documentation
│   ├── SYSTEM-OVERVIEW.md             # What Renubu does (for stakeholders)
│   └── USER-GUIDE.md                  # How to use features
│
├── technical/                          # Developer documentation
│   ├── ARCHITECTURE.md                # System design & data flow
│   ├── DATABASE.md                    # Schema, tables, queries
│   └── API-REFERENCE.md               # Services, hooks, components
│
├── guides/                             # Implementation how-tos
│   ├── STEP-ACTIONS.md                # Step-level snooze/skip
│   ├── WORKFLOWS.md                   # Creating/editing workflows
│   └── CONTRACT-TERMS.md              # Using contract_terms table
│
├── planning/                           # Project management
│   ├── ROADMAP.md                     # What's next
│   └── CHANGELOG.md                   # What changed (versions)
│
└── archive/                            # Historical/deprecated
    └── v0-pre-consolidation/          # All old docs moved here
```

---

## The 7 Core Documents

### 1. docs/README.md (Navigation Hub)
**Purpose:** Single entry point with links to everything
```markdown
# Renubu Documentation

## I want to...
- **Understand what Renubu does** → [System Overview](product/SYSTEM-OVERVIEW.md)
- **Learn the architecture** → [Architecture Guide](technical/ARCHITECTURE.md)
- **Look up database tables** → [Database Reference](technical/DATABASE.md)
- **Implement a feature** → [Implementation Guides](guides/)
- **See what's coming next** → [Roadmap](planning/ROADMAP.md)

## By Role
- **Stakeholder/PM:** Start with [System Overview](product/SYSTEM-OVERVIEW.md)
- **New Developer:** Read [Architecture](technical/ARCHITECTURE.md) → [Database](technical/DATABASE.md)
- **Implementing Feature:** Check [Guides](guides/) for relevant topic
```

---

### 2. product/SYSTEM-OVERVIEW.md
**Purpose:** What is Renubu, how it works (non-technical)
**Consolidates:** EXPLAIN_LIKE_IM_12.md, SYSTEM-FLOW-SUMMARY.md
**Length:** 10-15 min read

---

### 3. technical/ARCHITECTURE.md
**Purpose:** Complete technical architecture, data flow
**Consolidates:** COMPLETE-SYSTEM-FLOW.md, V2-ARCHITECTURE-COMPLETE.md, ARCHITECTURE-OVERRIDE-STRUCTURE-ANALYSIS.md
**Length:** 30-45 min read
**Cross-references:** Links to DATABASE.md for schema details, guides/ for implementation

---

### 4. technical/DATABASE.md
**Purpose:** All tables, migrations, queries
**Consolidates:** CONTRACT-TERMS-GUIDE.md, CONTRACT-MIGRATION-INSTRUCTIONS.md
**Cross-references:** Links back to ARCHITECTURE.md for context

---

### 5. guides/STEP-ACTIONS.md
**Purpose:** How to implement step-level actions
**Consolidates:** STEP-LEVEL-ACTIONS-INTEGRATION.md, STEP-LEVEL-ACTIONS-FIXES.md
**Cross-references:** Links to DATABASE.md for tables, ARCHITECTURE.md for flow

---

### 6. planning/ROADMAP.md
**Purpose:** Current phase, next steps, priorities
**Consolidates:** Various PHASE-* docs, NEXT-STEPS.md

---

### 7. planning/CHANGELOG.md
**Purpose:** Version history, what changed when
**Format:** Date-based entries (no semantic versioning needed)

---

## Versioning Strategy (Simple)

### No Version Numbers in Filenames
❌ `ARCHITECTURE-v1.0.0.md`
✅ `ARCHITECTURE.md` (with changelog at top)

### Each Document Has Internal Changelog
```markdown
# Architecture Guide

**Last Updated:** 2025-10-23

## Recent Changes
- **2025-10-23:** Added step-level actions flow
- **2025-10-15:** Updated to Phase 3 database-driven architecture
- **2025-09-20:** Added slide library composition details

[Rest of document...]
```

### Archive Old Versions Only When Needed
- Keep single current version
- When major rewrite needed, snapshot to `archive/` first
- Format: `archive/ARCHITECTURE-2025-10-23.md`

---

## Cross-Referencing Examples

### In ARCHITECTURE.md:
```markdown
## Database Schema

For complete table definitions, see [Database Reference](DATABASE.md#workflow-tables).

## Step-Level Actions

For implementation guide, see [Step Actions Guide](../guides/STEP-ACTIONS.md).
```

### In STEP-ACTIONS.md:
```markdown
## Architecture Overview

This feature adds step-level snooze/skip functionality. For the complete
system architecture, see [Architecture Guide](../technical/ARCHITECTURE.md#step-actions).

## Database Tables

This feature uses two new tables:
- `workflow_step_states` - See [Database Reference](../technical/DATABASE.md#workflow-step-states)
- `workflow_step_actions` - See [Database Reference](../technical/DATABASE.md#workflow-step-actions)
```

---

## Migration Steps

### Phase 1: Create Structure (30 min)
```bash
cd docs/
mkdir -p product technical guides planning archive/v0-pre-consolidation
```

### Phase 2: Create Core Docs (2-3 hours)
1. Create README.md with navigation
2. Consolidate into 7 core documents
3. Add cross-references
4. Add "Recent Changes" section to each

### Phase 3: Archive Old Docs (30 min)
```bash
# Move all old docs to archive
mv *.md archive/v0-pre-consolidation/
mv automation-backup/* archive/v0-pre-consolidation/

# Move core docs back
mv archive/v0-pre-consolidation/README.md ./
```

### Phase 4: Add Deprecation Notices (15 min)
Add to top of each archived doc:
```markdown
> **⚠️ DEPRECATED:** This document has been consolidated.
> See [Documentation Hub](../../README.md) for current docs.
```

---

## LLM Instructions (Simple Rules)

### When asked about architecture:
1. Update `technical/ARCHITECTURE.md`
2. Add change to "Recent Changes" section
3. Update "Last Updated" date

### When adding new feature:
1. Create `guides/FEATURE-NAME.md` (if substantial)
2. OR add section to existing guide
3. Cross-reference from ARCHITECTURE.md

### When making database changes:
1. Create migration file
2. Update `technical/DATABASE.md`
3. Add to CHANGELOG.md

### Never create these:
- ❌ `FEATURE-COMPLETE.md`
- ❌ `PHASE-X-SUMMARY.md`
- ❌ `CHECKPOINT-*.md`
- ❌ Any doc with `-COMPLETE`, `-SUMMARY`, `-EXPLAINED` suffix

---

## Before/After Comparison

### Before
```
docs/
  COMPLETE-SYSTEM-FLOW.md
  SYSTEM-FLOW-SUMMARY.md
  V2-ARCHITECTURE-COMPLETE.md
  V3-FIXES-COMPLETE.md
  PHASE-3E-COMPLETE.md
  CONFIG-BUILDER-COMPLETE.md
  STEP-LEVEL-ACTIONS-INTEGRATION.md
  STEP-LEVEL-ACTIONS-FIXES.md
  CONTRACT-TERMS-GUIDE.md
  CONTRACT-MIGRATION-INSTRUCTIONS.md
  ... 78 more files
```

### After
```
docs/
  README.md                    ← Start here!
  product/
    SYSTEM-OVERVIEW.md
  technical/
    ARCHITECTURE.md            ← All system design
    DATABASE.md                ← All schema info
  guides/
    STEP-ACTIONS.md           ← Implementation guides
    WORKFLOWS.md
    CONTRACT-TERMS.md
  planning/
    ROADMAP.md
    CHANGELOG.md
  archive/
    v0-pre-consolidation/     ← All old docs (88 files)
```

**Result:** 88 files → 7 core docs + 1 navigation hub

---

## Quick Start

To implement this NOW:

1. **Run this command:**
```bash
cd docs/
mkdir -p product technical guides planning archive/v0-pre-consolidation
```

2. **I'll create the 7 core documents** by consolidating existing content

3. **Move old docs to archive:**
```bash
mv *.md archive/v0-pre-consolidation/ 2>/dev/null
```

4. **Done!** All future updates go to the 7 core docs

---

**Time to implement:** 3-4 hours
**Maintenance:** Update existing docs instead of creating new ones
**Navigation:** Everything linked from README.md
