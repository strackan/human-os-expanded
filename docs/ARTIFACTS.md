# Artifacts - Renubu UI Components & Patterns

**Last Updated:** 2025-11-07
**Version:** 0.1
**Audience:** Internal (Engineers, Product)

---

## Overview

This document catalogs all artifact types in Renubu, their design patterns, usage statistics, and improvement roadmap.

**What are Artifacts?**
Artifacts are reusable UI components that render workflow outputs, data visualizations, and interactive interfaces within the Renubu platform.

---

## Artifact Types

### 1. Workflow Artifacts

#### AccountPlanArtifact
- **Purpose:** Display strategic account plans with goals and initiatives
- **Location:** `src/components/artifacts/account-plan/`
- **Usage:** Account planning workflows
- **Status:** Active

#### RenewalPlanArtifact
- **Purpose:** Interactive renewal planning and risk assessment
- **Location:** `src/components/artifacts/renewal/`
- **Usage:** Renewal workflows
- **Status:** Active

### 2. Data Visualization Artifacts

#### WorkloadDashboardArtifact
- **Purpose:** Visualize user workload and capacity
- **Location:** `src/components/artifacts/workload/`
- **Usage:** Weekly planning, capacity analysis
- **Status:** Planned (Phase 0.2)

### 3. Planning Artifacts

#### WeeklyPlanArtifact
- **Purpose:** Day-by-day weekly plan view
- **Location:** `src/components/artifacts/planner/`
- **Usage:** Weekly planning workflows
- **Status:** Deferred (Demo Roadmap)

---

## Design Patterns

### Spa Aesthetic
All artifacts follow the "Spa Aesthetic" design system:
- Calm, minimal, professional
- Cool grays (gray-400, gray-500)
- Small icons (w-4 h-4)
- Maximum information density
- No gradients or bright colors

### Component Structure
```typescript
interface ArtifactProps {
  data: ArtifactData;
  onUpdate?: (data: ArtifactData) => void;
  readOnly?: boolean;
}

export function MyArtifact({ data, onUpdate, readOnly }: ArtifactProps) {
  // Artifact implementation
}
```

### Common Patterns
- **AI/User Task Split:** Visually distinguish "I'll Handle" (AI) vs "You'll Need To" (User)
- **Progressive Disclosure:** Show summary, expand for details
- **Inline Editing:** Edit in place when not readOnly

---

## Usage Statistics

_To be populated in Phase 1+_

---

## Improvement Roadmap

### Phase 0.1
- Document existing artifacts
- Establish design patterns

### Phase 1
- Create WorkflowExecutionArtifact
- Add usage tracking

### Phase 2+
- Artifact analytics dashboard
- Performance optimization

---

## Related Documentation

- [WORKFLOWS.md](./WORKFLOWS.md) - Workflow system using artifacts
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Component architecture
- Design Guide: `docs/archive/SPA-AESTHETIC-DESIGN-GUIDE.md`

---

**Note:** This is a living document. Update as new artifacts are added or patterns evolve.
