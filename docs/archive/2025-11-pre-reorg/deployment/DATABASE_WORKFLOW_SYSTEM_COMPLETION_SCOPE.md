# Database Workflow System - Completion Scope & Effort

## Executive Summary

**What it is**: A database-driven workflow template system that stores workflow logic, prompts, and configurations in PostgreSQL instead of TypeScript files.

**Current status**: ~40% complete (Phases 1-3 of 8)

**Effort to complete**: **12-18 hours** (broken down below)

**Value proposition**: Enables dynamic workflow creation, UI workflow builders, and easier workflow management without code deployments.

**Recommendation**: Complete after pricing optimization MVP is tested (Week 4-5 timeframe)

---

## What is the Database Workflow System?

### The Problem It Solves

**Current state**: Workflows are hardcoded in TypeScript files like this:
```typescript
// docs/automation-backup/renewal-configs/3-Prepare.ts (1,029 lines!)
export const workflow: WorkflowConfig = {
  id: "prepare-renewal",
  steps: [
    {
      id: "data-snapshot",
      title: "30-Day Analysis",
      llmPrompt: "Analyze customer health for " + customerName + "...",
      // ... hundreds of lines of configuration
    }
  ]
}
```

**Problems**:
- ❌ Need code deployment to change workflows
- ❌ Difficult to manage 18 workflow configs (16,820 lines)
- ❌ Can't create workflows dynamically
- ❌ No UI workflow builder possible
- ❌ Hard to maintain consistency

**Database workflow solution**:
- ✅ Store workflows in database
- ✅ Use template variables: `{{customer.name}}` resolved at runtime
- ✅ Change workflows without code deployment
- ✅ Enable future UI workflow builder
- ✅ Centralized workflow management

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE TABLES                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  workflow_definitions                                        │
│  ├─ stage_name: "Prepare", "Negotiate", etc.               │
│  ├─ days_min, days_max: Trigger conditions                 │
│  ├─ llm_prompts: System prompts (JSONB)                    │
│  └─ conditional_routing: Decision trees (JSONB)            │
│                                                              │
│  workflow_step_templates                                     │
│  ├─ step_name: "Data Snapshot", "Risk Assessment"          │
│  ├─ llm_prompt: "Analyze {{customer.name}}..." (TEXT)      │
│  ├─ data_required: ["customer.arr", "usage.trend"]         │
│  └─ outputs: What step produces                            │
│                                                              │
│  workflow_artifact_templates                                 │
│  ├─ artifact_type: "report", "email", "checklist"          │
│  ├─ title: "Risk Report for {{customer.name}}"             │
│  └─ sections: Content structure (JSONB)                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  WorkflowTemplateService                                     │
│  ├─ Fetch workflow from database                           │
│  ├─ Resolve variables: {{customer.name}} → "Acme Corp"     │
│  └─ Validate data requirements                             │
│                                                              │
│  WorkflowExecutionService                                    │
│  ├─ Create execution instances                             │
│  ├─ Manage step progression                                │
│  └─ Store outputs for step chaining                        │
│                                                              │
│  LLMPromptService                                            │
│  ├─ Send prompts to OpenAI/Anthropic                       │
│  ├─ Parse structured JSON outputs                          │
│  └─ Mock mode for testing                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  POST /api/workflows/from-template                          │
│  → Create workflow execution from template                  │
│                                                              │
│  POST /api/workflows/executions/{id}/steps/{stepId}/execute│
│  → Execute step with LLM, store outputs                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  useDatabaseWorkflow() hook                                  │
│  └─ Load workflow, execute steps, track progress           │
│                                                              │
│  TaskModeFullscreen.tsx                                      │
│  └─ Render workflow UI (already built, just wire it up)    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Example: How It Works

**1. Workflow stored in database**:
```sql
-- workflow_definitions
{
  stage_name: "Prepare",
  days_min: 120,
  days_max: 149
}

-- workflow_step_templates
{
  step_name: "Risk Assessment",
  llm_prompt: "Analyze risk for {{customer.name}} with ARR ${{customer.arr}}.
              Current usage: {{data.usage.trend}}.
              Days until renewal: {{workflow.daysUntilRenewal}}.",
  data_required: ["customer.arr", "data.usage.trend", "workflow.daysUntilRenewal"]
}
```

**2. At runtime** (when CSM opens renewal for Acme Corp):
```typescript
// Service resolves variables
const resolvedPrompt = workflowTemplateService.resolveVariables(template, context);

// Result:
"Analyze risk for Acme Corp with ARR $100000.
 Current usage: +12% growth.
 Days until renewal: 130."
```

**3. LLM generates analysis**:
```typescript
const response = await llmPromptService.executeWorkflowStep(resolvedPrompt);
// Returns: { overall_health: "Good", risk_score: 35, recommendations: [...] }
```

**4. Outputs stored for next step**:
```typescript
await workflowExecutionService.completeStep(executionId, stepIndex, outputs);
// Next step can reference: {{outputs.risk_score}}
```

---

## What's Already Built (40% Complete)

### ✅ Phase 1: Database Schema (COMPLETE)
**File**: `supabase/migrations/20251028000000_workflow_template_system.sql` (269 lines)

**Created**:
- 4 new tables (workflow_definitions extended, step_templates, artifact_templates, variables)
- Helper functions for workflow lookup
- Added `outputs` column to `workflow_step_executions`

**Status**: Migration file created but NOT applied (has conflicts with existing migrations)

### ✅ Phase 2: Migration Script (COMPLETE)
**File**: `scripts/migrate-prepare-workflow.ts` (677 lines)

**Does**:
- Extracts logic from legacy `3-Prepare.ts` config (1,029 lines)
- Inserts 3-Prepare workflow into database
- Creates 3 steps with full LLM prompts
- Creates artifacts for each step

**Status**: Ready to run once database migration is applied

### ✅ Phase 3: Service Layer (COMPLETE)
**Files**:
- `src/lib/workflows/services/WorkflowTemplateService.ts` (423 lines)
- `src/lib/workflows/services/WorkflowExecutionService.ts` (500 lines)
- `src/lib/workflows/services/LLMPromptService.ts` (420 lines)

**Capabilities**:
- Fetch workflows from database
- Resolve Handlebars template variables
- Manage execution lifecycle
- Integrate with OpenAI/Anthropic/Mock LLM
- Step output chaining
- Conditional routing evaluation

**Status**: Code complete, not tested

### ✅ Phase 4 (Partial): API Endpoint (PARTIAL)
**File**: `src/app/api/workflows/from-template/route.ts` (230 lines)

**Endpoints**:
- `POST /api/workflows/from-template` - Create execution from template
- `GET /api/workflows/from-template` - List available templates

**Status**: Created but not tested

---

## What Needs to Be Built (60% Remaining)

### ❌ Phase 4 (Remaining): Step Execution API
**File needed**: `src/app/api/workflows/executions/[id]/steps/[stepId]/execute/route.ts`

**Effort**: **3-4 hours**

**What it does**:
1. Receive step execution request
2. Use `WorkflowExecutionService.executeStep()` to get resolved prompt
3. Call `LLMPromptService.executeWorkflowStep()` with prompt
4. Parse LLM's structured output
5. Store outputs using `WorkflowExecutionService.completeStep()`
6. Return to frontend

**API Contract**:
```typescript
POST /api/workflows/executions/{executionId}/steps/{stepId}/execute
Body: {
  context: {
    customer: { id, name, arr, ... },
    data: { usage, engagement, ... },
    outputs: { /* from previous steps */ }
  }
}

Response: {
  success: true,
  outputs: { overall_health: "Good", risk_score: 35, ... },
  nextStep: { stepId: "...", title: "..." },
  artifacts: [...]
}
```

**Tasks**:
- [ ] Create Next.js API route file
- [ ] Wire up services (Template + Execution + LLM)
- [ ] Error handling for missing data
- [ ] Error handling for LLM failures
- [ ] Test with Postman/curl
- [ ] Test with mock LLM
- [ ] Test with real LLM (OpenAI/Anthropic)

---

### ❌ Phase 5: Context Builder
**File needed**: `src/lib/workflows/context/WorkflowContextBuilder.ts`

**Effort**: **3-4 hours**

**What it does**:
Fetches all data needed for workflow prompts from database:
```typescript
interface WorkflowContext {
  customer: {
    id: string
    name: string
    arr: number
    renewalDate: string
    tier: string
    // ... 20+ fields
  }
  intelligence: {
    riskScore: number
    aiSummary: string
    insights: Array<...>
  }
  data: {
    usage: { trend, changePercent, lastActivity }
    engagement: { lastMeeting, supportTickets }
    salesforce: { opportunityStage, contacts }
  }
  workflow: {
    daysUntilRenewal: number
    stage: string
    currentStep: number
  }
  outputs: {
    // Accumulated from previous steps
    // e.g., { overall_health: "Good", risk_score: 35 }
  }
}
```

**Methods needed**:
- `buildContext(customerId, executionId)` - Fetch all data
- `validateContext(context, dataRequired)` - Check for missing data
- `enrichContext(context, additionalData)` - Add runtime data

**Data sources to integrate**:
- `customers` table (basic info)
- `contracts` table (renewal date, ARR)
- `customer_intelligence` table (AI insights)
- `usage_metrics` table (usage data)
- `workflow_step_executions` table (previous outputs)

**Tasks**:
- [ ] Create service file
- [ ] Implement data fetching methods
- [ ] Build context aggregation
- [ ] Handle missing data gracefully
- [ ] Add caching for performance
- [ ] Write unit tests

---

### ❌ Phase 6: Frontend Hook
**File needed**: `src/components/workflows/hooks/useDatabaseWorkflow.ts`

**Effort**: **2-3 hours**

**What it does**:
React hook to manage database-driven workflows from frontend:

```typescript
function useDatabaseWorkflow(stageName: string, customerId: string) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load workflow from template
  const loadWorkflow = async () => {
    const response = await fetch('/api/workflows/from-template', {
      method: 'POST',
      body: JSON.stringify({ stageName, customerId })
    });
    const data = await response.json();
    setWorkflow(data.workflow);
  };

  // Execute step with LLM
  const executeStep = async (stepId: string, context: any) => {
    const response = await fetch(
      `/api/workflows/executions/${workflow.executionId}/steps/${stepId}/execute`,
      { method: 'POST', body: JSON.stringify({ context }) }
    );
    const result = await response.json();
    return result;
  };

  // Complete step and move to next
  const completeStep = (outputs: any) => {
    // Store outputs, advance to next step
  };

  return {
    workflow,
    currentStep,
    loading,
    executeStep,
    completeStep,
    skipStep,
    goBack
  };
}
```

**Integration point**: Modify `TaskModeFullscreen.tsx`:
```typescript
// Check if workflow is database-driven
if (workflow.templateId) {
  // Use useDatabaseWorkflow hook
  const { executeStep, completeStep } = useDatabaseWorkflow(workflow.stageName, customerId);
} else {
  // Use existing hardcoded workflow logic
}
```

**Tasks**:
- [ ] Create hook file
- [ ] Implement workflow loading
- [ ] Implement step execution
- [ ] Handle loading states
- [ ] Handle errors
- [ ] Integrate with TaskModeFullscreen
- [ ] Test with UI

---

### ❌ Phase 7: Database Migration & Testing
**Effort**: **2-3 hours**

**Tasks**:

**7.1 Resolve Migration Conflicts** (1 hour):
- [ ] Review conflicting migrations
- [ ] Decide: modify existing tables or create new ones
- [ ] Update migration file if needed
- [ ] Test migration on local database

**7.2 Apply Migration** (15 min):
```bash
npx supabase db push
```

**7.3 Run Migration Script** (5 min):
```bash
npx tsx scripts/migrate-prepare-workflow.ts
```

**7.4 Verify Database** (15 min):
```sql
-- Check workflow created
SELECT * FROM workflow_definitions WHERE stage_name = 'Prepare';

-- Check steps created
SELECT * FROM workflow_step_templates WHERE workflow_definition_id = '...';

-- Check artifacts created
SELECT * FROM workflow_artifact_templates WHERE workflow_definition_id = '...';
```

**7.5 End-to-End Test** (1-2 hours):
- [ ] Create test customer with renewal in 130 days
- [ ] Call API to create workflow execution
- [ ] Execute first step (Data Snapshot)
- [ ] Verify LLM prompt resolution
- [ ] Check outputs stored in database
- [ ] Execute second step (Pricing Interview)
- [ ] Verify step chaining works (outputs passed to next step)
- [ ] Test artifact rendering
- [ ] Test conditional routing
- [ ] Test skip step functionality

**7.6 Performance Testing** (30 min):
- [ ] Test with multiple simultaneous executions
- [ ] Measure API response times
- [ ] Check database query performance
- [ ] Add indexes if needed

---

### ❌ Phase 8: Documentation & Migration Guide
**File needed**: `docs/WORKFLOW_MIGRATION_GUIDE.md`

**Effort**: **2-3 hours**

**Contents**:

**8.1 Overview** (30 min):
- What is the database workflow system
- When to use it vs hardcoded workflows
- Architecture diagram
- Benefits and trade-offs

**8.2 Migration Tutorial** (1 hour):
- Step-by-step: Extract logic from TypeScript config
- How to create workflow definition
- How to create step templates
- How to structure LLM prompts with template variables
- How to define data requirements
- How to configure artifacts
- Example: Migrating "4-Negotiate" workflow

**8.3 Template Variable Reference** (30 min):
- Available context paths (customer.*, data.*, outputs.*)
- Handlebars helper functions
- Common patterns and examples
- Debugging template resolution

**8.4 Testing Guide** (30 min):
- How to test workflows locally
- Mock LLM vs real LLM
- How to seed test data
- Troubleshooting common issues

**8.5 Remaining Workflows** (30 min):
- List of 17 remaining workflows to migrate
- Complexity assessment for each
- Priority recommendations
- Effort estimates

---

## Effort Breakdown

| Phase | Task | Effort | Priority |
|-------|------|--------|----------|
| 4 (remaining) | Step execution API | 3-4 hrs | High |
| 5 | Context builder | 3-4 hrs | High |
| 6 | Frontend hook | 2-3 hrs | High |
| 7 | Migration & testing | 2-3 hrs | High |
| 8 | Documentation | 2-3 hrs | Medium |
| **TOTAL** | **All phases** | **12-18 hrs** | |

### Detailed Time Estimates

**Optimistic** (experienced dev, no blockers): **12 hours**
- Step API: 3 hrs
- Context builder: 3 hrs
- Frontend hook: 2 hrs
- Migration/testing: 2 hrs
- Documentation: 2 hrs

**Realistic** (normal pace, some debugging): **15 hours**
- Step API: 3.5 hrs
- Context builder: 3.5 hrs
- Frontend hook: 2.5 hrs
- Migration/testing: 2.5 hrs
- Documentation: 3 hrs

**Pessimistic** (blockers, extensive debugging): **18 hours**
- Step API: 4 hrs
- Context builder: 4 hrs
- Frontend hook: 3 hrs
- Migration/testing: 3 hrs
- Documentation: 4 hrs

---

## Value Proposition

### Why Complete This?

**Benefits**:
1. **No code deployments** to change workflows
   - Tweak prompts, steps, artifacts without pushing code
   - Faster iteration on workflow improvements

2. **Enable UI workflow builder** (future)
   - Non-technical users can create/modify workflows
   - Product team can experiment without engineering

3. **Centralized workflow management**
   - All 18 workflows in database
   - Easier to maintain consistency
   - Version control built-in

4. **Dynamic workflow creation**
   - Generate workflows programmatically
   - A/B test different workflows
   - Customer-specific workflow variations

5. **Better analytics**
   - Track which steps users complete
   - Measure step execution times
   - Identify bottlenecks

6. **Reduced code complexity**
   - 16,820 lines of TypeScript configs → Database records
   - Easier to understand and maintain

### Trade-offs

**Pros**:
- ✅ More flexible
- ✅ Easier to change
- ✅ Enables non-technical workflow editing
- ✅ Better analytics

**Cons**:
- ❌ More complex architecture
- ❌ Database migrations required
- ❌ Harder to debug (logic split across DB + code)
- ❌ Need to maintain both systems during migration

---

## When to Complete This?

### Recommended Timeline

**Now (Week 4)**: Deploy pricing optimization to staging, test thoroughly

**Week 5-6**: Complete database workflow system
- Pricing engine validated on staging
- Gives time for thorough testing
- Can bundle both features for prod promotion

**Week 7-8**: Production promotion
- Deploy pricing engine + database workflows together
- Position as major v2.1 release
- Begin migrating remaining 17 workflows

### Alternative Timeline

**Option A: Fast Track** (complete in Week 4)
- Parallel work: One dev on pricing testing, another on workflows
- Risk: Two major features in one release
- Benefit: Faster time to value

**Option B: Staged Rollout** (complete after pricing is in prod)
- Week 4-5: Pricing optimization testing + prod promotion
- Week 6-7: Complete database workflows
- Week 8: Database workflows to staging, test, promote
- Benefit: Lower risk, one major feature at a time

**Option C: Future Phase** (complete in Q2)
- Focus on pricing optimization MVP now
- Revisit database workflows after v2.1 is stable
- Benefit: Simplest path, lowest risk
- Trade-off: Manual workflow management continues

### My Recommendation

**Option B: Staged Rollout**
- Pricing optimization is the core value prop → prioritize getting that to production
- Database workflow system is architectural improvement → less urgent
- Gives time to validate pricing engine with real users before adding complexity
- Allows learning from pricing rollout to inform workflow system design

---

## Risks & Mitigation

### Risk 1: Migration Conflicts
**Issue**: Existing migrations may conflict with new schema changes

**Mitigation**:
- Review existing migrations carefully
- Modify new migration to work with existing schema
- Test on local database before applying to staging
- Have rollback plan ready

### Risk 2: LLM Integration Complexity
**Issue**: LLM prompt resolution and output parsing can be tricky

**Mitigation**:
- Start with mock LLM mode for testing
- Test with simple prompts first
- Add extensive logging for debugging
- Build in retry logic for LLM failures

### Risk 3: Performance Issues
**Issue**: Database lookups + LLM calls could be slow

**Mitigation**:
- Add database indexes on commonly queried fields
- Cache workflow templates (they don't change often)
- Set reasonable timeouts for LLM calls
- Add loading states in UI

### Risk 4: Backward Compatibility
**Issue**: Need to support both hardcoded and database workflows during migration

**Mitigation**:
- Keep existing workflow system intact
- Add conditional logic: if `templateId` exists, use database system
- Migrate one workflow at a time
- Run both systems in parallel for 1-2 months

---

## Success Criteria

**Phase 4-8 Complete When**:
- [ ] Database migration applied successfully
- [ ] 3-Prepare workflow migrated and in database
- [ ] Step execution API working with mock LLM
- [ ] Step execution API working with real LLM (OpenAI or Anthropic)
- [ ] Context builder fetches all required data
- [ ] Frontend hook loads and manages workflow
- [ ] TaskModeFullscreen renders database workflow
- [ ] End-to-end test: Create execution → Execute 3 steps → Complete workflow
- [ ] Template variable resolution tested (10+ test cases)
- [ ] Step output chaining works (outputs from step 1 used in step 2)
- [ ] Artifacts render correctly
- [ ] Documentation complete with migration guide
- [ ] No regressions in existing hardcoded workflows

---

## Next Steps

### Immediate (Once Ready to Start)

**1. Verify Prerequisites** (15 min):
- [ ] Pricing optimization deployed to staging
- [ ] Pricing optimization tested and validated
- [ ] 15 hours available for development
- [ ] OpenAI or Anthropic API key available

**2. Resolve Migration Conflicts** (1 hour):
- [ ] Review `20251028000000_workflow_template_system.sql`
- [ ] Check for conflicts with existing schema
- [ ] Modify migration if needed
- [ ] Test on local database

**3. Start Phase 4** (Step Execution API):
- [ ] Create API route file structure
- [ ] Implement request handling
- [ ] Wire up services
- [ ] Test with mock LLM

**4. Progress Through Phases 5-8**:
- Follow checklist in HANDOFF_CHECKLIST.md
- Test thoroughly at each phase
- Document as you go

---

## Questions?

**Q: Is this worth the effort?**
A: If you plan to build UI workflow builders or need frequent workflow changes, yes. If workflows are stable and code changes are okay, maybe defer.

**Q: Can we do just part of it?**
A: Yes, could complete Phases 4-6 (API + frontend) and skip migration guide initially. Minimum viable: ~10 hours.

**Q: Will this break existing workflows?**
A: No, existing hardcoded workflows continue to work. Database system is additive.

**Q: How long to migrate all 18 workflows?**
A: 3-Prepare is done. Each remaining workflow: 2-4 hours. Total: 40-80 hours. Can be done incrementally.

**Q: What if LLM is too slow or expensive?**
A: Can tune prompt complexity, use cheaper models (GPT-3.5), or cache common outputs. System supports mock mode for development.

---

## Summary

**What**: Database-driven workflow template system for dynamic workflow management

**Status**: 40% complete, solid foundation built

**Effort**: 12-18 hours to complete Phases 4-8

**Value**: Enables dynamic workflows, UI builders, faster iteration

**Recommendation**: Complete in Week 5-6 after pricing optimization is validated

**Risk**: Low (additive feature, doesn't affect existing workflows)

**Next Step**: Resolve migration conflicts, start Phase 4 (Step Execution API)

---

Ready to proceed? See `HANDOFF_CHECKLIST.md` for detailed implementation steps.
