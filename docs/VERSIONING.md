# Renubu Versioning Convention

**Last Updated:** 2025-11-13
**Status:** Active

---

## Philosophy

**True 1.0 = Customer successfully using Renubu with their customers (GA-ready)**

We're building **toward** 1.0, not already at it. The 0.x numbering makes it clear this is pre-GA while we validate product-market fit and iterate toward general availability.

---

## Versioning Scheme

### Pre-1.0 (Current)

```
0.MAJOR.MINOR

Example: 0.1.7, 0.2.0
```

- **0.x.x** - Pre-GA releases building toward 1.0
- **0.MAJOR** - Significant feature milestone or architectural change
- **0.MINOR** - Incremental feature releases within a major milestone

### Post-1.0 (Future)

Standard semantic versioning:
```
MAJOR.MINOR.PATCH

Example: 1.0.0, 1.1.0, 2.0.0
```

---

## Current Roadmap Structure

### Phase 0.1.x - Core Workflow Features

Building foundational workflow capabilities:

- **0.1.0** - Workflow Snoozing (125h)
- **0.1.1** - Skip Enhanced (30h)
- **0.1.2** - Escalate Enhanced (30h)
- **0.1.3** - String-Tie (35h)
- **0.1.4** - [Open - TBD] (reserved for refinements)
- **0.1.5** - Talent Orchestration System (96h)
- **0.1.6** - Return Visit System (24h)
- **0.1.7** - Parking Lot (16h)

**Total 0.1.x Effort:** ~356 hours

### Phase 0.2.0 - Competitive Moat

First major release with strategic differentiator:

- **0.2.0** - Human OS Check-Ins (64h)
  - Learning loop where system discovers what works for each user
  - Justifies premium pricing ($200/user vs $50/user)
  - **THE competitive moat** - Gainsight and competitors don't have this

---

## Migration from Old Convention

**What Changed (2025-11-13):**

All version numbers divided by 10:

| Old Version | New Version | Feature |
|-------------|-------------|---------|
| 1.0 | 0.1.0 | Workflow Snoozing |
| 1.1 | 0.1.1 | Skip Enhanced |
| 1.2 | 0.1.2 | Escalate Enhanced |
| 1.3 | 0.1.3 | String-Tie |
| 1.4 | 0.1.4 | [Open - TBD] |
| 1.5 | 0.1.5 | Talent Orchestration |
| 1.6 | 0.1.6 | Return Visit System |
| **2.0** | **0.1.7** | **Parking Lot** (reslotted) |
| **3.0** | **0.2.0** | **Human OS Check-Ins** (accelerated) |

**Strategic Reslotting:**
- Parking Lot moved from 2.0 → 0.1.7 (quick UX win before major 0.2.0)
- Human OS accelerated from 3.0 → 0.2.0 (prioritize competitive moat)

---

## Criteria for 1.0

We will release 1.0 when:

1. ✅ Core workflow features complete (0.1.x series)
2. ✅ Human OS learning loop validated (0.2.0)
3. ⏳ **Customer successfully using Renubu with their customers**
4. ⏳ Product-market fit demonstrated
5. ⏳ Ready for general availability (GA)

---

## Related Documentation

- [ROADMAP.md](../ROADMAP.md) - Auto-generated from database
- [FEATURES.md](FEATURES.md) - Complete feature catalog
- [ARCHITECTURE.md](ARCHITECTURE.md) - Strategic guardrails

---

## Database Migration

Version updates applied via:
```
supabase/migrations/20251113000000_update_version_numbering.sql
```

To regenerate roadmap after database changes:
```bash
npm run roadmap
```
