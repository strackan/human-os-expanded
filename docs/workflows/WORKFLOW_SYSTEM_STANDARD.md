# Workflow System Standard

**Last Updated**: 2025-01-24
**Status**: ✅ Active Standard (Phase 3)

## Overview

Renubu uses a **modular slide library system** (Phase 3) for all workflow creation and execution. This document defines the standard approach that ALL new workflows and workflow launches MUST follow.

## The Standard: Modular Slide Library System

### Architecture

```
Database (workflow_definitions)
    ↓
composeFromDatabase()
    ↓
Slide Library (SLIDE_LIBRARY)
    ↓
WorkflowConfig
    ↓
TaskMode
```

### Key Components

1. **Database Storage**: `workflow_definitions` table
2. **Composer**: `src/lib/workflows/db-composer.ts`
3. **Slide Library**: `src/lib/workflows/slides/`
4. **Runtime Engine**: `src/lib/workflows/composer.ts`

## How to Launch Workflows (Standard Pattern)

### ✅ Correct Approach (Use Everywhere)

```typescript
import { composeFromDatabase } from '@/lib/workflows/db-composer';
import { createWorkflowExecution } from '@/lib/workflows/actions';
import { registerWorkflowConfig } from '@/config/workflows/index';
import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';

const handleLaunchWorkflow = async () => {
  try {
    // 1. Load workflow config from database using modular system
    const workflowConfig = await composeFromDatabase(
      'workflow-id',           // Workflow identifier from database
      null,                    // company_id (null = stock workflow)
      {
        // Customer context for template hydration
        name: customer.name,
        current_arr: customer.current_arr,
        health_score: customer.health_score,
        ...customer,           // Spread all customer fields
      }
    );

    if (!workflowConfig) {
      throw new Error('Workflow not found in database');
    }

    // 2. Register config so TaskMode can retrieve it
    registerWorkflowConfig('workflow-id', workflowConfig as WorkflowConfig);

    // 3. Create workflow execution record
    const executionResult = await createWorkflowExecution({
      workflowConfigId: 'workflow-id',
      workflowName: (workflowConfig as any).workflowName || 'Workflow Name',
      workflowType: 'renewal', // or 'risk', 'opportunity', etc.
      customerId: customer.id,
      userId: user.id,
      assignedCsmId: user.id,
      totalSteps: workflowConfig.slides?.length || 0,
    });

    // 4. Open TaskMode
    setActiveWorkflow({
      workflowId: 'workflow-id',
      title: (workflowConfig as any).workflowName,
      customerId: customer.id,
      customerName: customer.name,
    });
    setTaskModeOpen(true);

  } catch (error) {
    console.error('[Workflow Launch] Error:', error);
    // Handle error appropriately
  }
};
```

### ❌ Incorrect Approaches (DO NOT USE)

#### Don't Use: Template Compilation API
```typescript
// ❌ WRONG - This is legacy System 2
const response = await fetch('/api/workflows/compile', { ... });
const workflowConfig = WorkflowConfigTransformer.transformToWorkflowConfig(...);
```

#### Don't Use: Static Config Files
```typescript
// ❌ WRONG - This is legacy System 3
import { inhersight90DayRenewalWorkflow } from '@/components/artifacts/workflows/configs/workflows/InHerSight90DayRenewal';
```

## Examples of Correct Implementation

### Example 1: Dashboard (Obsidian Black)
**File**: `src/app/dashboard/DashboardClient.tsx:62-147`

This is the reference implementation showing the correct pattern.

### Example 2: Customer View
**File**: `src/app/customers/view/[id]/page.tsx:175-291`

Updated to use the standard modular system instead of the legacy template compilation.

## Creating New Workflows

When creating a new workflow:

1. **Define in Database**: Create entry in `workflow_definitions` table
   - Use seed scripts: `scripts/seed-workflow-definitions.ts`
   - Define `slide_sequence` and `slide_contexts`

2. **Use Existing Slides**: Reference slides from `SLIDE_LIBRARY`
   - Location: `src/lib/workflows/slides/`
   - Create new slides only if needed

3. **Test with composeFromDatabase()**: Always use the standard launch pattern

4. **Never**: Create static WorkflowConfig files in code

## Why This Standard Exists

### ✅ Benefits of Modular System
- **Database-driven**: Workflows stored in DB, not code
- **Modular & Reusable**: Slide library enables composition
- **Multi-tenant**: Company-specific workflow customization
- **Maintainable**: Change workflows without code deployments
- **Consistent**: Same artifact rendering system everywhere
- **Scalable**: Easy to add new workflows

### ❌ Problems with Legacy Systems
- **System 2 (Template Compilation)**: Separate system, loses rich features
- **System 3 (Static Configs)**: Hard-coded, not reusable, no multi-tenancy
- **Inconsistency**: Different rendering, different behaviors

## Migration Status

### ✅ Migrated to Standard
- Dashboard (Obsidian Black workflows)
- Customer View page (as of 2025-01-24)

### 🔄 Needs Migration
- InHerSight 90-day workflow → needs database entry
- InHerSight 120-day at-risk workflow → needs database entry
- Any other static WorkflowConfig files

### 📦 Deprecated
- `/api/workflows/compile` endpoint (System 2)
- `WorkflowConfigTransformer` (System 2)
- Static WorkflowConfig files (System 3)

## Troubleshooting

### Error: "Workflow not found in database"
- **Cause**: Workflow definition not seeded in `workflow_definitions` table
- **Solution**: Run `npx tsx scripts/seed-workflow-definitions.ts`

### Error: "Slide not found in library"
- **Cause**: Workflow references non-existent slide in `slide_sequence`
- **Solution**: Check `SLIDE_LIBRARY` exports or create missing slide

### Workflows behaving differently
- **Cause**: Using legacy system instead of standard
- **Solution**: Check code uses `composeFromDatabase()`, not API or static configs

## Getting Help

If you're unsure about workflow implementation:

1. Reference: `src/app/dashboard/DashboardClient.tsx` (correct example)
2. Check: This document for standard pattern
3. Avoid: Any code using `WorkflowConfigTransformer` or `/api/workflows/compile`

## Summary

**ALWAYS use `composeFromDatabase()` for workflow launches. Never use legacy systems.**

This ensures:
- Consistent behavior across all workflows
- Same modular artifact system
- Database-driven configuration
- Multi-tenant support
- Easy maintenance

---

**Version**: Phase 3 (Active)
**Previous Systems**: Phase 2 (Template Compilation - Deprecated), Phase 1 (Static Configs - Deprecated)
