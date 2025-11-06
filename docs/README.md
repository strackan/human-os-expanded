# Renubu Documentation

**Last Updated:** 2025-11-05
**Status:** Phase 0 Complete, Ready for Phase 0.1

---

## 📚 Start Here

### The 4 Essential Documents

Read these to understand everything about Renubu development:

1. **[PLAN.md](PLAN.md)** - What we're building & when
   - Current phase status
   - Q4 2025 roadmap
   - Week-by-week breakdown
   - Success metrics

2. **[STATE.md](STATE.md)** - What exists right now
   - Services, APIs, database schema
   - What's working, what's not
   - Recent changes

3. **[AGENT-GUIDE.md](AGENT-GUIDE.md)** - How to work here
   - Quick start (5 min)
   - Communication protocols
   - Git workflow
   - Development environment

4. **[DEV-GUIDE.md](DEV-GUIDE.md)** - Technical architecture
   - System architecture
   - Agentification strategy
   - Velocity tracking
   - Code style & testing

---

## 🚀 Quick Start

**For New Agents:**
1. Read the 4 documents above (15 min)
2. Check GitHub Projects for your assignment
3. Set up git worktree for your task
4. Start coding!

**For Humans:**
1. Read PLAN.md to see current status
2. Check GitHub Projects board
3. Review open PRs if any
4. Provide feedback in Google Chat

---

## 📸 Historical Documentation

### Snapshots (Point-in-Time Captures)

Snapshots are FROZEN copies of the 4 living docs at major milestones:

- **[2025-11-05-sprint-0/](snapshots/2025-11-05-sprint-0/)** - Phase 0 completion
  - PLAN.md - Phase 0/0.1/1 roadmap
  - STATE.md - Services, auth, database status
  - AGENT-GUIDE.md - Communication & git workflow
  - DEV-GUIDE.md - Agentification strategy

**Future Snapshots:**
- `2025-11-22-phase-0.1/` - After MCP implementation
- `2025-12-20-phase-1/` - After Workflow Snoozing launch

### Archive (Pre-Reorganization)

**[archive/2025-11-pre-reorg/](archive/2025-11-pre-reorg/)** contains all pre-Nov 5 documentation:
- Original Sprint 0 docs (AGENT-COMMUNICATION, AGENTIFICATION-STRATEGY, etc.)
- Labs folder (Q4-2025-DEVELOPMENT-PLAN, WEEKLY-PLANNER-DEVELOPMENT-PLAN)
- Technical docs, guides, planning docs

**Don't look here unless:**
- Researching historical decisions
- Finding old technical details not in STATE.md
- Comparing before/after of reorganization

---

## 📋 Documentation Rules

### The 4 Living Docs Are Sacred

**DO:**
- ✅ Update one of the 4 living docs when things change
- ✅ Create snapshot before major phase transitions
- ✅ Keep docs current (update "Last Updated" date)

**DON'T:**
- ❌ Create new root-level .md files
- ❌ Create sub-folders besides `snapshots/` and `archive/`
- ❌ Edit snapshot files (they're FROZEN)
- ❌ Delete archive files

### When to Update Which Doc

**Update PLAN.md when:**
- Phase status changes
- Timeline shifts
- Priorities change
- New features added/removed

**Update STATE.md when:**
- Services added/removed
- Database schema changes
- Major features completed
- Production deployment happens

**Update AGENT-GUIDE.md when:**
- Processes change (git workflow, communication)
- New tools added
- Development environment changes

**Update DEV-GUIDE.md when:**
- Architecture decisions made
- New patterns established
- Testing strategy changes

### When to Create Snapshot

**Create snapshot at:**
- End of each phase (Sprint 0, Phase 0.1, Phase 1)
- Before major pivots (like Weekly Planner → Workflow Snoozing)
- Before breaking changes

**How to create snapshot:**
```bash
# Create folder with date and phase name
mkdir docs/snapshots/2025-11-22-phase-0.1

# Copy all 4 living docs
cp docs/PLAN.md docs/STATE.md docs/AGENT-GUIDE.md docs/DEV-GUIDE.md \
   docs/snapshots/2025-11-22-phase-0.1/

# Commit snapshot
git add docs/snapshots/2025-11-22-phase-0.1/
git commit -m "docs: Phase 0.1 snapshot"
```

---

## 🎯 Current Status (Nov 5, 2025)

**Phase:** Phase 0 (Sprint 0) - 95% Complete

**What's Done:**
- ✅ 4 living docs created
- ✅ First snapshot (2025-11-05-sprint-0)
- ✅ Old docs archived
- ✅ Auth improvements merged to main
- ✅ Demo mode working

**What's Next:**
- GitHub Projects setup (1h)
- Environment validation (3h)
- Phase 0.1 starts Nov 13 (MCP implementation)

---

## 🔗 External Resources

**GitHub:**
- Repository: https://github.com/Renew-Boo/renubu
- Projects: [Workflow Snoozing Board](#) (to be created)
- Issues: https://github.com/Renew-Boo/renubu/issues

**Production:**
- App: https://renubu-iota.vercel.app
- Database: Supabase (staging instance)

**Communication:**
- Google Chat: "Renubu Dev Sync" space
- Daily updates, blockers, quick questions

---

## ❓ FAQ

**Q: I can't find information about [topic]. Where do I look?**
A: Check the 4 living docs first. If not there, search `archive/2025-11-pre-reorg/` for historical context.

**Q: Should I create a new .md file for my feature?**
A: No. Update one of the 4 living docs instead. If your content doesn't fit, discuss with team first.

**Q: How often should I update the docs?**
A: After completing major tasks or at end of each phase. Minor updates can batch.

**Q: What if the docs are out of date?**
A: Update them! That's the whole point of living documents. Just update the "Last Updated" date.

**Q: Where are the weekly planner docs?**
A: In `archive/2025-11-pre-reorg/labs/`. Weekly Planner is deferred to Q1 2026, so those docs are archived.

---

**Document Structure Version:** 1.0 (Nov 5, 2025)
**Next Review:** After Phase 0.1 (Nov 22, 2025)
