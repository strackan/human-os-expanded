# CHECKPOINT-003: Workflow Automation Modules Port Plan

**Date**: 2025-10-12
**Type**: Technical Architecture Review
**Engineer**: BE
**Status**: ⏸️ AWAITING JUSTIN APPROVAL (Can start after CHECKPOINT-001)

---

## What's Being Ported

Converting 4 JavaScript modules from automation backup → TypeScript:

### Module 1: workflow-types.ts (1 hour)
**Source**: `docs/automation-backup/workflow-types.js`
**Target**: `src/lib/workflows/types.ts`

**What it contains:**
- Type definitions for WorkflowInstance, WorkflowAssignment
- AccountPlan enum (invest/expand/manage/monitor)
- ScoringFactors interface
- Factory functions for creating workflow objects

**Changes from source:**
- Convert to TypeScript interfaces and types
- Use Zod for runtime validation
- Match existing codebase patterns

---

### Module 2: workflow-determination.ts (2 hours)
**Source**: `docs/automation-backup/workflow-determination.js`
**Target**: `src/lib/workflows/determination.ts`

**What it contains:**
- `determineWorkflowsForCustomer()` - Main function
- `shouldHaveRenewalWorkflow()` - Check renewal eligibility
- `shouldHaveStrategicWorkflow()` - Check if invest/expand plan
- `shouldHaveOpportunityWorkflow()` - Check opportunity_score ≥ threshold
- `shouldHaveRiskWorkflow()` - Check risk_score ≥ threshold

**Logic:**
```typescript
function determineWorkflowsForCustomer(customer: Customer): WorkflowType[] {
  const workflows: WorkflowType[] = [];

  // Always check renewal
  if (customer.renewal_id || customer.renewal_date) {
    workflows.push('renewal');
  }

  // Strategic only for invest/expand
  if (['invest', 'expand'].includes(customer.account_plan)) {
    workflows.push('strategic');
  }

  // Opportunity if score ≥ 70 (configurable)
  if (customer.opportunity_score >= THRESHOLDS.opportunity) {
    workflows.push('opportunity');
  }

  // Risk if score ≥ 60 (configurable)
  if (customer.risk_score >= THRESHOLDS.risk) {
    workflows.push('risk');
  }

  return workflows;
}
```

---

### Module 3: workflow-scoring.ts (2 hours)
**Source**: `docs/automation-backup/workflow-scoring.js`
**Target**: `src/lib/workflows/scoring.ts`

**What it contains:**
- `calculateWorkflowPriority()` - Main scoring function
- Multi-factor priority formula
- Configuration from scoring-config.ts

**Formula:**
```
Total Score = ((Base + Urgency) × ARR × AccountPlan × Experience) - Workload

Where:
- Base: 50 for renewal, 70 for strategic, etc.
- Urgency: Emergency=90, Critical=80, etc.
- ARR: 2.0x for $150k+, 1.5x for $100k-150k, 1.0x below
- AccountPlan: invest=1.5x, expand=1.3x, manage=1.0x, monitor=1.2x
- Experience: expert=1.2x, senior=1.1x, mid=1.0x, junior=0.9x
- Workload: -2 points per existing workflow
```

---

### Module 4: workflow-orchestrator.ts (2 hours)
**Source**: `docs/automation-backup/workflow-orchestrator.js`
**Target**: `src/lib/workflows/orchestrator.ts`

**What it contains:**
- `generateAllWorkflows()` - Main orchestration function
- `getWorkflowQueueForCSM()` - Filter by CSM
- `groupWorkflowsByCustomer()` - Group results
- `getWorkflowStats()` - Calculate statistics

**Flow:**
```typescript
function generateAllWorkflows(companyId: string, csmId?: string) {
  // 1. Get customers from database
  const customers = await getCustomersForCompany(companyId, csmId);

  // 2. Determine which workflows each needs
  const assignments = customers.flatMap(customer => {
    const workflowTypes = determineWorkflowsForCustomer(customer);

    // 3. Create workflow instances and score them
    return workflowTypes.map(type => {
      const workflow = createWorkflowInstance(type, customer);
      const scoring = calculateWorkflowPriority(workflow, customer);
      return { workflow, customer, scoring };
    });
  });

  // 4. Sort by priority score (highest first)
  return assignments.sort((a, b) => b.scoring.totalScore - a.scoring.totalScore);
}
```

---

## Database Adapter Changes

Convert SQLite queries → Supabase queries:

**Before (SQLite):**
```javascript
const customers = db.prepare(`
  SELECT * FROM customers
  WHERE company_id = ?
`).all(companyId);
```

**After (Supabase):**
```typescript
const { data: customers } = await supabase
  .from('customers')
  .select('*')
  .eq('company_id', companyId);
```

---

## Configuration File

Create `src/lib/workflows/config/scoring-config.ts`:

```typescript
export const SCORING_CONFIG = {
  arr_breakpoints: {
    high: 150000,
    medium: 100000
  },
  arr_multipliers: {
    high: 2.0,
    medium: 1.5,
    low: 1.0
  },
  account_plan_multipliers: {
    invest: 1.5,
    expand: 1.3,
    manage: 1.0,
    monitor: 1.2
  },
  renewal_stage_urgency: {
    Overdue: 100,
    Emergency: 90,
    Critical: 80,
    Signature: 70,
    Finalize: 60,
    Negotiate: 50,
    Engage: 40,
    Prepare: 30,
    Monitor: 20
  },
  workflow_thresholds: {
    opportunity_score_min: 70,
    risk_score_min: 60
  },
  workload_penalty_per_workflow: 2
};
```

---

## Testing Plan

**Unit Tests** (for each module):
- Type system creates valid objects
- Determination logic returns correct workflow types
- Scoring formula calculates correctly
- Orchestrator sorts by priority

**Integration Test**:
- Full flow: customer → workflows → scored → sorted
- Test with Obsidian Black demo data

---

## Timeline

- Module 1 (types): 1 hour
- Module 2 (determination): 2 hours
- Module 3 (scoring): 2 hours
- Module 4 (orchestrator): 2 hours
- Database adapter: 1 hour
- Testing: 1 hour

**Total: ~9 hours**

---

## Questions for Justin

This is mostly technical implementation, but:

**Q1**: Any concerns with the priority scoring formula?
**Q2**: Should configuration be in TypeScript file or move to database table?
**Q3**: Any workflow types besides renewal/strategic/opportunity/risk?

---

## PM Notes

This is a straight port of proven code. The automation backup has 159 passing tests. Main changes are:
- JavaScript → TypeScript syntax
- SQLite → Supabase queries
- Match existing codebase patterns

**Recommendation:** Approve and let BE proceed after database schema checkpoint passes.

---

## Approval

- [ ] **Justin Reviewed** - Date: ___________
- [ ] **Any Concerns?** - See notes below:

**Notes:**
