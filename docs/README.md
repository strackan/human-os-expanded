# Renubu Documentation

**Last Updated:** 2025-11-08
**Version:** 2.0 (Phase 0.1)
**Status:** Database-First Documentation System

---

## 📚 Documentation System Overview

Renubu uses a **database-first documentation approach** with **living documents** that are continuously updated rather than versioned. All documentation is stored in the database with automatic versioning snapshots at release boundaries.

### Core Principles

1. **Single Source of Truth**: Database is authoritative
2. **Living Documents**: Update in place, don't create new files
3. **Auto-Snapshots**: Automatic versioning at phase boundaries
4. **No File Proliferation**: Strict guidelines on creating new docs

---

## 🎯 Quick Start

### For AI Agents
1. Read **[DEV-GUIDE.md](DEV-GUIDE.md)** (comprehensive agent guide)
2. Check current **[PLAN.md](PLAN.md)** for active work
3. Review **[ARCHITECTURE.md](ARCHITECTURE.md)** for system design
4. Set up git worktree and start coding

### For Human Developers
1. Read **[PLAN.md](PLAN.md)** for roadmap and status
2. Check **[DEV-GUIDE.md](DEV-GUIDE.md)** Part II for local setup
3. Review **[DEPLOYMENT.md](DEPLOYMENT.md)** for deployment process
4. Check GitHub Projects for task assignments

### For Customer Success
1. Read **[ONBOARDING.md](ONBOARDING.md)** for customer onboarding playbooks
2. Review **[CUSTOMERS.md](CUSTOMERS.md)** for customer-specific configs
3. Check **[FEATURES.md](FEATURES.md)** for feature status and roadmap

---

## 📖 Living Documents (11 Core Docs)

These documents are **continuously updated** and represent the current state of the system:

### Technical Documentation

1. **[ARTIFACTS.md](ARTIFACTS.md)** - UI component catalog and design patterns
   - Artifact types (slides, forms, visualizations)
   - Spa Aesthetic design system
   - Usage statistics

2. **[WORKFLOWS.md](WORKFLOWS.md)** - Workflow definitions and catalog
   - Active workflows (Renewal, Account Planning)
   - Planned workflows (Snoozing, Check-Ins)
   - Workflow composition patterns

3. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and key decisions
   - High-level architecture
   - Technology stack
   - Major architectural decisions
   - MCP architecture

4. **[SCHEMA.md](SCHEMA.md)** - Database schema reference
   - All tables with descriptions
   - RLS policies
   - Migration best practices
   - Index strategy

5. **[API.md](API.md)** - API endpoint reference
   - REST endpoints
   - Server actions
   - Request/response examples
   - Authentication

6. **[MCP.md](MCP.md)** - MCP integration architecture
   - 8 core MCP operations
   - Security model (walled garden)
   - Marketplace tier structure
   - Token efficiency strategies

7. **[LLM.md](LLM.md)** - AI strategy and agentification
   - Model selection (Haiku/Sonnet/Opus)
   - Agentification results (32-47x speedup)
   - Communication protocols
   - Prompt engineering

8. **[DEV-GUIDE.md](DEV-GUIDE.md)** - Development guide
   - **Part I**: For LLM Agents (codebase navigation, patterns, pitfalls)
   - **Part II**: For Human Developers (local setup, deployment)
   - Most comprehensive guide for working in codebase

### Operations Documentation

9. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment process and rollback
   - Environment configs
   - Release checklist
   - Rollback procedures
   - Monitoring and alerts

### Customer Success Documentation

10. **[ONBOARDING.md](ONBOARDING.md)** - Customer onboarding playbooks
    - 3-phase onboarding process
    - Customer personas
    - Project plans (Standard/Fast-Track/Enterprise)

11. **[CUSTOMERS.md](CUSTOMERS.md)** - Customer-specific documentation
    - Custom code and configurations
    - Support history per customer
    - Health indicators
    - Feature requests

---

## 📋 Other Maintained Docs

These documents are also maintained but serve specific purposes:

- **[FEATURES.md](FEATURES.md)** - Auto-generated feature registry
  - Generated from `features` database table
  - Feature lifecycle (underway, planned, backlog, deferred, complete)
  - Business cases and success criteria
  - **DO NOT EDIT MANUALLY** - Update database instead

- **[PLAN.md](PLAN.md)** - Current development plan
  - Active phase status
  - Timeline and milestones
  - Success criteria
  - Phase completion logs

- **[GITHUB-PROJECTS-GUIDE.md](GITHUB-PROJECTS-GUIDE.md)** - GitHub Projects workflow
  - Issue templates
  - Label conventions
  - Project board automation

- **[README.md](README.md)** - This file (documentation index)

---

## 📸 Documentation Versioning

### Database-First Snapshots

At each release boundary, all living documents are automatically snapshotted using:

```bash
npm run snapshot -- <version> <release-date>
```

**Example:**
```bash
npm run snapshot -- 0.1 2025-11-08
```

This:
1. Inserts all 11 living docs into `documentation` table
2. Creates versioned snapshot in `documentation_versions`
3. Links to release in `releases` table

### Snapshot Storage

- **Database**: `documentation_versions` table (source of truth)
- **Files**: `docs/snapshots/YYYY-MM-DD-phase-X/` (convenience copies)

### Querying Historical Docs

```sql
-- Get docs at specific release
SELECT * FROM documentation_versions
WHERE release_id = (SELECT id FROM releases WHERE version = '0.1');

-- Get all versions of a document
SELECT version, content, created_at
FROM documentation_versions
WHERE slug = 'architecture'
ORDER BY created_at DESC;
```

---

## ✍️ Documentation Rules

### When to Update Living Docs

**Update immediately when:**
- Architecture decisions are made → **ARCHITECTURE.md**
- Database schema changes → **SCHEMA.md**
- New API endpoints added → **API.md**
- Workflow definitions change → **WORKFLOWS.md**
- MCP operations added → **MCP.md**
- Deployment process changes → **DEPLOYMENT.md**

**Batch updates (end of phase) for:**
- Artifact usage statistics → **ARTIFACTS.md**
- Customer success playbooks → **ONBOARDING.md**
- Model selection guidelines → **LLM.md**

### DO

✅ Update existing living documents
✅ Keep "Last Updated" current
✅ Use database as source of truth
✅ Create snapshots at phase boundaries
✅ Archive temporary files after consolidation

### DON'T

❌ Create new root-level .md files (use living docs)
❌ Create sub-folders (except `archive/`, `snapshots/`, `demo-roadmap/`)
❌ Edit FEATURES.md manually (generated from database)
❌ Edit snapshot files (they're frozen)
❌ Keep temporary planning docs in root

---

## 🗂️ Archive

### Current Archive Structure

- **[archive/2025-11-pre-reorg/](archive/2025-11-pre-reorg/)** - Pre-consolidation docs
- **[archive/v0-pre-consolidation/](archive/v0-pre-consolidation/)** - Original automation docs
- **[archive/phase-0.1-cleanup/](archive/phase-0.1-cleanup/)** - Phase 0.1 temporary files

**When to look in archive:**
- Researching historical decisions
- Finding old technical details
- Understanding evolution of features

---

## 🔄 Commit and Track Workflow

### Standard Commits

Use the commit-and-track script to keep database in sync:

```bash
git add .
npm run commit -- -m "feat: add feature"
```

This commits to git AND logs metadata to database.

### Phase Completion

```bash
npm run commit -- -m "release: Phase 0.1 complete" --phase
```

This:
- Commits to git
- Marks release complete in database
- Updates all features to 'complete'
- Sets `shipped_at` timestamps

### New Release

```bash
npm run commit -- -m "start Phase 0.2" --release 0.2
```

Creates new release entry in database.

**See:** [scripts/README-commit-and-track.md](../scripts/README-commit-and-track.md)

---

## 🎯 Current Status (Nov 8, 2025)

**Phase:** 0.1 - MCP Foundation & Documentation
**Status:** Complete, ready to snapshot

**Completed in Phase 0.1:**
- ✅ 11 living documents created
- ✅ MCP server with 8 operations
- ✅ Documentation database system
- ✅ Feature tracking system
- ✅ Commit-and-track automation
- ✅ Phase 0.1 cleanup

**Next:**
- Snapshot Phase 0.1 documentation
- Start Phase 0.2 (MCP Registry & Integrations)

---

## 🔗 External Resources

**GitHub:**
- Repository: https://github.com/Renew-Boo/renubu
- Issues: https://github.com/Renew-Boo/renubu/issues

**Production:**
- App: https://renubu-iota.vercel.app
- Database: Supabase (staging)

---

## ❓ FAQ

**Q: Where do I find information about [topic]?**
A: Check the 11 living docs first. Use search or consult the index above.

**Q: Should I create a new .md file for my feature?**
A: No. Update one of the 11 living docs instead. If content doesn't fit anywhere, discuss with team first.

**Q: How do I update FEATURES.md?**
A: Don't edit the file. Update the `features` database table, then regenerate FEATURES.md.

**Q: When should I create a snapshot?**
A: Snapshots are created automatically at release boundaries using `npm run snapshot`.

**Q: What if a living doc is out of date?**
A: Update it! Change the content and update the "Last Updated" date. That's the whole point.

---

**Documentation System Version:** 2.0 (Database-First)
**Last Major Update:** 2025-11-08 (Phase 0.1 completion)
**Next Review:** After Phase 0.2
