# Workflow Architecture Audit

## Status: MIGRATION COMPLETE ✅

*Last Updated: 2025-12-18*

---

## Summary

The DynamicFlow architecture has been fully deprecated and removed from the codebase. All workflows now use the **slides-based architecture** with `composeFromDatabase()` and the SLIDE_LIBRARY system.

### What Was Migrated

| Item | Status | Notes |
|------|--------|-------|
| `/demo-workflows` page | ✅ Migrated | Now uses `composeFromDatabase()` for both V1 and V2 |
| `InHerSight90DayRenewal.ts` | ✅ Deleted | Legacy DynamicFlow config |
| `InHerSight90DayRenewalV2.ts` | ✅ Deleted | Legacy DynamicFlow config |
| `InHerSight120DayAtRisk.ts` | ✅ Deleted | Orphaned legacy config |
| `growthstackLLM.config.ts` | ✅ Deleted | Wrapper around legacy V2 |
| `useTaskModeState.ts` | ✅ Cleaned | DynamicFlow support removed |
| Workflow registry | ✅ Cleaned | Legacy imports removed |

---

## Current Architecture (Standard)

### Single Source of Truth

All workflows are now built using the **Phase 3 Modular Slide Library System**:

```typescript
// STANDARD: Use composeFromDatabase()
import { composeFromDatabase } from '@/lib/workflows/db-composer';

const workflowConfig = await composeFromDatabase(
  'workflow-id',      // ID from workflow_definitions table
  null,               // company_id (null = stock workflow)
  { ...customerContext }
);
registerWorkflowConfig('runtime-id', workflowConfig);
```

### Workflow Types

| Type | Source | Example |
|------|--------|---------|
| Database-driven | `composeFromDatabase()` + SLIDE_LIBRARY | InHerSight 90-day renewal |
| Static configs | Direct registry in `src/config/workflows/` | Obsidian Black demos |

### Obsidian Black Static Configs (Still in Registry)

These use the slides-based architecture but are defined as static TypeScript configs:

- `obsblk-strategic-planning`
- `obsblk-expansion`
- `obsblk-executive-engagement`
- `obsidian-black-pricing`
- `obsidian-black-call-debrief`

---

## Terminology Reference

| Term | Meaning | Location | Example |
|------|---------|----------|---------|
| **Workflow Slides** | Steps/screens in a workflow | `config.slides[]` | Greeting, Account Review, Pricing |
| **Presentation Slides** | Slides in a meeting deck artifact | `artifact.data.props.slides[]` | Title, Metrics, Highlights |

> **Note:** These two uses of "slides" are in different contexts and shouldn't be confused:
> - Workflow slides define the steps a CSM goes through
> - Presentation slides are content for customer-facing PowerPoint decks

---

## Files Deleted in Migration

```
src/components/artifacts/workflows/configs/workflows/InHerSight90DayRenewal.ts
src/components/artifacts/workflows/configs/workflows/InHerSight90DayRenewalV2.ts
src/components/artifacts/workflows/configs/workflows/InHerSight120DayAtRisk.ts
src/config/workflows/growthstackLLM.config.ts
```

---

## Demo Workflows Page

**Location:** `src/app/demo-workflows/page.tsx`

The demo page now:
1. Uses `composeFromDatabase('inhersight-90day-renewal', ...)` for V1
2. Uses the same workflow with `_llmMode: true` flag for V2
3. Registers configs dynamically with `registerWorkflowConfig()`

Both V1 and V2 now use identical architecture, differing only in:
- V1: Standard step progression
- V2: LLM orchestration enabled via feature flag

---

## Future Enhancements

### Presentation Slides Terminology (Deferred)

To further clarify terminology, consider renaming `slides` in presentation artifacts to `presSlides`:

**Scope of Change:**
- `PresentationArtifact.tsx` props
- `artifactTemplates.ts` config types
- Slide library presentation builders
- Export services and APIs

**Decision:** Deferred - current terminology is contextually clear and change would touch 13+ files.

---

## References

- `docs/workflows/WORKFLOW_SYSTEM_STANDARD.md` - Authoritative guide
- `src/lib/workflows/db-composer.ts` - Database composition logic
- `src/lib/workflows/slides/` - SLIDE_LIBRARY modules
- `src/config/workflows/index.ts` - Static workflow registry

---

*Migration completed: 2025-12-18*
