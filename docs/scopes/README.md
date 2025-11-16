# Scopes Directory

This directory contains two types of scope documentation:

1. **Release Scopes** (`releases/`) - Official scope docs for each point release (0.1.6, 0.1.7, etc.)
2. **Session Scopes** (root level) - Agent handoff documents for context continuity

## Purpose

### Release Scopes (`releases/`)
- Define what each point release includes
- Document technical approach and architecture
- Serve as the source of truth for what shipped
- Track scope changes over time (0.1.7-scope.md → 0.1.7.1-scope.md)

### Session Scopes (Root)
- Enable smooth handoffs between Claude Code agents
- Preserve context when approaching token limits
- Document current state and next steps
- Prevent loss of intent and decisions

## Why This Matters

**Release Scopes:** Every release needs a single source of truth. What features are included? What problems are solved? What's the technical approach? This becomes the historical record.

**Session Scopes:** Context windows are limited (~200k tokens). Without proper handoff documentation:
- Next agents have to guess previous intent
- Important decisions get lost
- Work gets duplicated
- Bugs get reintroduced

## Standard Practice

### When to Create a Release Scope (`releases/`)

1. **Planning Phase** - When a point release is approved, create initial scope
2. **Scope Changes** - When requirements/architecture change, create X.X.X.1 update
3. **Pre-Ship** - Final scope update documenting what actually shipped

See `releases/README.md` for full details.

### When to Create a Session Scope (Root)

1. **Context approaching limit** (>40k tokens used)
2. **Major milestone completed** (release shipped, feature finished)
3. **Switching contexts** (moving from feature A to feature B)
4. **End of work session** (user going offline for extended period)

### What to Include

Every scope doc should have:

✅ **Session Overview** - What was the main focus?
✅ **Completed Tasks** - What was accomplished (with commit SHAs)?
✅ **Current State** - Git status, deployment status, database state
✅ **Next Steps** - Priority-ordered list of what comes next
✅ **Known Issues** - Blockers, warnings, gotchas
✅ **File Locations** - Where is the relevant code?
✅ **Technical Context** - Non-obvious details next agent needs to know
✅ **User Preferences** - Any specific instructions or patterns observed
✅ **History Snapshot** - Reference to captured history.jsonl

### Naming Convention

```
YYYY-MM-DD-brief-description.md
```

Examples:
- `2025-11-16-release-0.1.8-deployment.md`
- `2025-11-20-parking-lot-refactor.md`
- `2025-12-01-database-migration-rollback.md`

## Template

Copy this template for new scope docs:

```markdown
# Session Scope: [Brief Description]
**Date:** YYYY-MM-DD
**Context Window:** [tokens used/total]
**Status:** 🟢/🟡/🔴 [Brief status]

---

## Session Overview
[What was the focus of this session?]

---

## What Was Accomplished
### ✅ Completed Tasks
1. Task 1 (commit SHA if applicable)
2. Task 2

---

## Current State
### Git Status
- **Branch:**
- **Latest commit:**
- **Pushed:**

### Deployment Status
- **Staging:**
- **Production:**

### Database State
- **Migrations applied:**

---

## Next Steps (Priority Order)
1. **[Task 1]** 🎯 IMMEDIATE NEXT TASK
2. [Task 2]

---

## Known Issues
### ⚠️ Issue Title
**Description:**
**Impact:**
**Fix Applied/Needed:**

---

## File Locations Reference
**Feature Name:**
- `path/to/file.ts` - Description

---

## Technical Context for Next Agent
[Non-obvious details, gotchas, patterns to know]

---

## User Preferences & Instructions
[Any specific guidance from user about how they want things done]

---

## Quick Commands Reference
```bash
# Useful commands for this context
```

---

## Session End Notes
**Token usage:**
**Ending status:**
**Blocker:**
**Confidence level:**

**Handoff to next agent:** [Direct instruction for what to do next]

---

## History Snapshot
Last 1000 lines of conversation history captured at: `/tmp/recent_history.jsonl`
```

## History Snapshot Practice

Before creating a scope doc, always capture recent history:

```bash
tail -n 1000 ~/.claude/history.jsonl > /tmp/recent_history_$(date +%Y%m%d_%H%M%S).jsonl
```

This ensures you can review the exact conversation if needed.

## Reading Scope Docs

When starting a new session:

1. Check `docs/scopes/` for recent scope docs
2. Read the most recent one(s) relevant to your task
3. Review the "Next Steps" section
4. Check "Known Issues" for gotchas
5. Use "File Locations" as a map
6. Follow "User Preferences" patterns

## Maintenance

- Keep scope docs indefinitely (they're small text files)
- Use git to track them (they're part of project documentation)
- Reference them in commit messages when relevant
- Update them if plans change significantly

---

## Example: Using a Scope Doc

**Scenario:** You're a new agent starting fresh. User says "continue with the deployment."

**What to do:**
1. `ls docs/scopes/` to see recent scopes
2. Read the most recent scope doc
3. Look for "Next Steps" section
4. Execute the 🎯 IMMEDIATE NEXT TASK
5. Update the scope doc or create a new one when you approach context limit

**Don't:**
- Ignore scope docs and start guessing
- Re-implement something already done
- Miss known issues that were already debugged

---

*This practice ensures our codebase has institutional memory, even across agent context windows.*
