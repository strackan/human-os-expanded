# Release Scope Documentation

This directory contains official scope documentation for each point release.

## Purpose

Each point release (0.1.6, 0.1.7, 0.1.8, etc.) should have a scope document that defines:
- What features are included
- What problems are being solved
- Technical approach and architecture
- Success criteria
- Testing requirements

## Naming Convention

**Initial scope:** `{version}-scope.md`
- Example: `0.1.7-scope.md`, `0.1.8-scope.md`

**Scope updates:** `{version}.{update}-scope.md`
- Example: `0.1.7.1-scope.md`, `0.1.7.2-scope.md`

## Scope Lifecycle

1. **Planning Phase** - Create initial `X.X.X-scope.md` when release is approved
2. **Development Phase** - Update scope as needed (`X.X.X.1-scope.md`, `X.X.X.2-scope.md`)
3. **Completion Phase** - Final scope represents what was actually shipped

## Template

When creating a new release scope, use this template:

```markdown
# Release X.X.X Scope

**Status:** Planning | In Development | Testing | Shipped
**Target Ship Date:** YYYY-MM-DD
**Actual Ship Date:** YYYY-MM-DD (if shipped)

---

## Overview

[Brief 1-2 paragraph description of what this release accomplishes]

---

## Problem Statement

[What problems are we solving? What pain points does this address?]

---

## Features Included

### Feature 1: [Name]
**Description:** [What it does]
**Why:** [Business value]
**Effort:** [Time estimate]

### Feature 2: [Name]
...

---

## Technical Approach

### Architecture
[High-level technical design]

### Database Changes
- Table: `table_name` - [description]
- Migration: `YYYYMMDD_description.sql`

### API Endpoints
- `GET /api/endpoint` - [description]

### UI Components
- Component: `ComponentName` - [description]

---

## Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2

---

## Testing Requirements

### Critical Paths
1. [User flow 1]
2. [User flow 2]

### Edge Cases
- [Edge case 1]

---

## Dependencies

- Depends on: [Other releases or external factors]
- Blocks: [What is waiting on this]

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | High/Med/Low | [How we handle it] |

---

## Rollback Plan

[How to roll back if deployment fails]

---

## Post-Ship Monitoring

- Metric 1 to watch
- Metric 2 to watch

---

## Related Documentation

- Implementation: [link]
- Test Plan: [link]
- API Docs: [link]
```

## Migration of Existing Docs

The following docs should be migrated to this structure:

- `RELEASE-0.1.7-IMPLEMENTATION.md` → `0.1.7-scope.md`
- `RELEASE-0.1.8.md` → `0.1.8-scope.md`
- `STRING_TIES_IMPLEMENTATION.md` → Part of `0.1.8-scope.md`
- `PARKING_LOT_IMPLEMENTATION.md` → Part of `0.1.6-scope.md`

## Version Numbering

- `X.X.X` - Major scope (initial planning)
- `X.X.X.1` - Minor scope update (requirements changed)
- `X.X.X.2` - Second update, etc.

## When to Create a Scope Update

Create a new scope version (X.X.X.1, X.X.X.2) when:
- Requirements change significantly
- Features are added or removed
- Architecture changes
- Major technical decisions are revised

**Do NOT create updates for:**
- Bug fixes
- Minor implementation details
- Typo corrections

Just update the existing scope for minor changes.

## Best Practices

1. **Keep it current** - Update scope as decisions are made
2. **Be specific** - "Add user auth" → "Implement Supabase RLS with email/password auth"
3. **Track changes** - Use git to see scope evolution
4. **Link to related docs** - Reference test plans, implementation guides
5. **Document decisions** - Why did we choose approach A over B?

---

*This ensures every release has a clear, version-controlled scope that serves as the source of truth.*
