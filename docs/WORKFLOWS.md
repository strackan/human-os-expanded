# Workflows - Renubu Workflow System

**Last Updated:** 2025-11-07
**Version:** 0.1
**Audience:** Internal (Engineers, Product)

---

## Overview

This document catalogs all workflow definitions, usage patterns, and the workflow execution engine.

**What are Workflows?**
Workflows are structured, multi-step processes that guide users through complex tasks (renewals, account planning, onboarding, etc.).

---

## Workflow Architecture

### Core Concepts
- **Workflow Definition:** Template with slides, conditions, transitions
- **Workflow Execution:** Instance of a workflow for a specific context
- **Slide:** Individual step in a workflow
- **Action:** User or AI action within a slide
- **Condition:** Logic for transitions and wake events

### Database Tables
- `workflow_executions` - Runtime instances
- `workflow_tasks` - Individual tasks within workflows
- `workflow_actions` - Actions taken during execution

---

## Active Workflows

### 1. Renewal Planning
- **Status:** Active
- **Definition:** `src/lib/workflows/compositions/renewalComposition.ts`
- **Slides:**
  - Discovery
  - Risk Assessment
  - Renewal Strategy
  - Action Plan
- **Usage:** High-touch renewal management

### 2. Account Planning
- **Status:** Active
- **Definition:** `src/lib/workflows/compositions/accountPlanComposition.ts`
- **Slides:**
  - Account Overview
  - Goals & Initiatives
  - Success Plan
- **Usage:** Strategic account planning

---

## Planned Workflows

### Phase 1: Workflow Snoozing
- **Weekly Planning Workflow** - Deferred to Demo Roadmap
- **Snooze Management** - Condition-based wake logic

### Phase 2: Parking Lot
- **Quick Capture Workflow** - Capture non-urgent items

### Phase 3: Human OS Check-Ins
- **Check-In Workflow** - Post-completion reflection
- **Pattern Discovery Workflow** - Surface learning loops

---

## Workflow Engine

### Execution Flow
```
1. Create workflow execution (workflow_executions)
2. Initialize first slide
3. User/AI completes actions
4. Evaluate transition conditions
5. Move to next slide or complete
6. Optionally snooze with wake conditions
```

### Snoozing System (Phase 1)
- **Date-based:** Wake on specific date
- **Condition-based:** Wake when business condition met
- **Hybrid:** Combination of date + condition

---

## Usage Statistics

_To be populated in Phase 1+_

- Execution completion rate
- Average time per workflow
- Most common snooze reasons
- Drop-off points

---

## Development Guide

### Creating a New Workflow

1. **Define composition** in `src/lib/workflows/compositions/`
2. **Create slides** in `src/lib/workflows/slides/`
3. **Add artifacts** in `src/components/artifacts/`
4. **Register workflow** in workflow registry
5. **Test execution** end-to-end

### Testing Workflows
```bash
npm run test:workflows
```

---

## Related Documentation

- [ARTIFACTS.md](./ARTIFACTS.md) - Artifact components
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [API.md](./API.md) - Workflow APIs

---

**Note:** This is a living document. Update as workflows are added or modified.
