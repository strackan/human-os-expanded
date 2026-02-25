# Parking Lot - Great Ideas for Later

> **Purpose**: Capture valuable ideas that emerge during development but aren't critical for current scope.
> **Process**: When scope creep emerges, PM evaluates and recommends parking. Justin makes final call.
> **Integration**: Each parked item gets a GitHub Issue for future prioritization.

---

## How to Use This Document

### When an Idea Emerges:
1. **PM Response**: "Great idea! Let me evaluate..."
2. **Quick Assessment**: Impact vs. Effort vs. Timeline
3. **Recommendation**: Park it or add to scope (with trade-offs)
4. **Justin Decides**: ✅ Park / ❌ Add to scope / 🤔 Discuss more

### Parking Lot Workflow:
```
Idea → Evaluate → Park → GitHub Issue → Phase 7 Review → Prioritize → Implement
```

---

## Evaluation Criteria

**Impact Levels:**
- 🔴 **High**: Game-changer, major differentiation, critical user need
- 🟡 **Medium**: Nice improvement, quality of life, nice-to-have
- 🟢 **Low**: Polish, edge case, minor enhancement

**Effort Estimates:**
- ⚡ **Quick**: < 4 hours
- 📅 **Medium**: 4-16 hours
- 🏔️ **Large**: 16+ hours

---

## Active Parking Lot

### 🅿️ Awaiting Phase 7 Review

*Items will appear here as they're parked during development*

---

## Template for New Items

```markdown
### PL-XXX: [Title]
- **Proposed By**: [Name] (Phase [N] checkpoint)
- **Impact**: [High/Medium/Low] - [Why this matters]
- **Effort**: [Hours estimate] - [What needs to be built]
- **Why Parked**: [Scope/timeline/dependency concern]
- **Potential Value**: [What this would enable]
- **Dependencies**: [Other features or systems needed]
- **Status**: ⏸️ Parked
- **GitHub Issue**: [#XXX when created]
- **Alternatives Considered**: [Simpler approaches we could take]
```

---

## Example (Reference Only)

### PL-001: Real-time Multi-User Collaboration
- **Proposed By**: Justin (Phase 2 Technical Review)
- **Impact**: 🔴 High - Would enable 2+ CSMs working same account simultaneously
- **Effort**: 🏔️ Large (40 hours)
  - WebSocket infrastructure (16h)
  - Conflict resolution logic (12h)
  - UI state synchronization (8h)
  - Testing & edge cases (4h)
- **Why Parked**:
  - Not required for demo narrative
  - Significant technical complexity
  - Would delay demo by 1+ week
  - Can be added post-demo without rework
- **Potential Value**:
  - Differentiated enterprise feature
  - Enables larger CSM teams
  - Improves handoff scenarios
- **Dependencies**:
  - WebSocket server infrastructure
  - Operational transform or CRDT library
  - Session management system
- **Status**: ⏸️ Parked
- **GitHub Issue**: #127
- **Alternatives Considered**:
  - Simple "lock" system (one user at a time)
  - Auto-save with last-write-wins
  - Manual refresh to see updates

---

## Graduated Items (Implemented Post-Parking)

### ✅ Moved to Backlog / Implemented

*Successful parking lot items that were later prioritized and shipped*

---

## Rejected Items (Won't Implement)

### ❌ Evaluated & Declined

*Items that were considered but determined not valuable enough*

---

## Phase 7 Review Checklist

During project close, review all parked items:

- [ ] Re-evaluate impact (did our understanding change?)
- [ ] Update effort estimates (do we know more now?)
- [ ] Identify quick wins (< 4 hours, high impact)
- [ ] Move high-value items to product backlog
- [ ] Close low-value items as "won't do"
- [ ] Document lessons learned from parked items

---

**Last Updated**: 2025-01-15
**Total Parked Items**: 0
**Items Graduated**: 0
**Items Rejected**: 0
