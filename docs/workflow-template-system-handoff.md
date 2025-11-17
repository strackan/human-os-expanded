# Workflow Template System - Implementation Handoff

**Status**: Architecture designed, ready for implementation
**Test Case**: Obsidian Black renewal workflow
**Context**: Building InHerSight 0.1.9 release

---

## 🎯 What We're Building

A **database-driven workflow template system** with inheritance and modifications, replacing hardcoded TypeScript workflow configs.

### The Problem We Solved
- ❌ Creating `InHerSight120DayAtRisk.ts` files per customer/workflow = bloat
- ❌ 90% duplicate code across similar workflows
- ❌ Not leveraging existing `task_templates` and `workflow_executions` tables

### The Solution
- ✅ **Base templates** for core journeys (renewal, contact recovery, expansion)
- ✅ **Global modifications** for system defaults (at-risk → freebie step)
- ✅ **Company modifications** for customization (InHerSight → brand analysis)
- ✅ **Customer modifications** for edge cases (BuildRight → custom pricing)
- ✅ **Runtime compilation** that merges template + mods + customer data

---

## 📐 Architecture

### Database Schema

```sql
-- ============================================================================
-- 1. WORKFLOW TEMPLATES (Base journeys)
-- ============================================================================
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,              -- "renewal_base"
  display_name TEXT NOT NULL,             -- "Renewal Planning"
  description TEXT,
  category TEXT,                          -- "renewal", "expansion", "contact"

  -- Base configuration (JSONB)
  base_steps JSONB NOT NULL,              -- Array of step definitions
  base_artifacts JSONB NOT NULL,          -- Artifact templates
  default_triggers JSONB,                 -- When to auto-trigger

  -- Metadata
  estimated_time_minutes INTEGER,
  pain_score INTEGER,                     -- From user feedback (1-10)
  impact_score INTEGER,                   -- Business impact (1-10)

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. WORKFLOW MODIFICATIONS (Inheritance & overrides)
-- ============================================================================
CREATE TABLE workflow_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_template_id UUID REFERENCES workflow_templates(id) ON DELETE CASCADE,

  -- Scope: Who/what gets this modification?
  scope_type TEXT NOT NULL CHECK (scope_type IN (
    'global',        -- System-wide default (e.g., all at-risk get freebie)
    'company',       -- All customers for a company (e.g., InHerSight)
    'customer',      -- Specific customer override
    'industry',      -- All in industry (e.g., Healthcare)
    'segment'        -- Custom criteria (e.g., ARR > $100K)
  )),
  scope_id UUID,                          -- customer_id, company_id, etc.
  scope_criteria JSONB,                   -- For segment/global conditions

  -- Modification type
  modification_type TEXT NOT NULL CHECK (modification_type IN (
    'add_step',                           -- Insert new step
    'remove_step',                        -- Skip step
    'replace_step',                       -- Swap step entirely
    'modify_step',                        -- Change step properties
    'add_artifact',                       -- Add artifact to step
    'remove_artifact',                    -- Remove artifact
    'change_branch_logic',                -- Alter decision tree
    'add_task_template'                   -- Link additional task
  )),

  -- What to modify
  target_step_id TEXT,                    -- Which step (if applicable)
  target_position INTEGER,                -- For add_step: insertion index

  -- The actual modification (JSONB)
  modification_data JSONB NOT NULL,

  -- Priority (application order)
  priority INTEGER DEFAULT 100,           -- Global: 100, Company: 200, Customer: 300

  -- Metadata
  reason TEXT,                            -- Why this modification exists
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_mods_template ON workflow_modifications(workflow_template_id);
CREATE INDEX idx_workflow_mods_scope ON workflow_modifications(scope_type, scope_id);
CREATE INDEX idx_workflow_mods_priority ON workflow_modifications(priority);

-- ============================================================================
-- 3. ENHANCE WORKFLOW_EXECUTIONS (Link to templates)
-- ============================================================================
ALTER TABLE workflow_executions
  ADD COLUMN IF NOT EXISTS workflow_template_id UUID REFERENCES workflow_templates(id);
ALTER TABLE workflow_executions
  ADD COLUMN IF NOT EXISTS applied_modifications UUID[];  -- Track which mods applied
ALTER TABLE workflow_executions
  ADD COLUMN IF NOT EXISTS compiled_config JSONB;         -- Cache final config
```

---

## 🏗️ Planned Base Templates

1. **`renewal_base`** - Core renewal journey
   - Covers: 90-day, 120-day, 60-day, 30-day variations via mods
   - Steps: Plan → Review → Engage → Close
   - Mods add freebie (at-risk), skip concerns (healthy), expedite (urgent)

2. **`contact_recovery`** - Lost/changed contact
   - Steps: Identify issue → Search → Reconnect → Establish relationship

3. **`contact_crisis`** - Angry/frustrated contact
   - Steps: Assess situation → Acknowledge → Fix → Rebuild trust

4. **`contact_onboarding`** - New contact (promotion/replacement)
   - Steps: Introduce → Educate → Establish cadence

5. **`expansion`** - Growth opportunities
   - Steps: Identify opportunity → Analyze → Propose → Close

6. **`customer_onboarding`** - New customer setup
   - Steps: Kickoff → Setup → Train → Launch

---

## 🧪 Test Case: Obsidian Black

**Why Obsidian Black?**
- Already has demo data seeded
- Complex scenario (at-risk, high value, operation failures)
- Good test of freebie intervention logic
- Existing workflow we can compare against

**Test Flow**:
1. Create `renewal_base` template with 9 core steps
2. Create global mod: `risk_score > 60` → add freebie intervention (3 steps)
3. Trigger workflow for Obsidian Black (risk_score: 42, but we can adjust)
4. Verify compilation produces 12-step workflow
5. Execute workflow, verify artifacts generate with customer data
6. Confirm tasks created from task_templates
7. Test workflow state persistence

---

## 🔄 Compilation Algorithm

```typescript
/**
 * Compile workflow template into executable configuration
 */
async function compileWorkflow(
  templateId: string,
  customerId: string,
  triggerContext: {
    risk_score?: number,
    days_to_renewal?: number,
    health_score?: number
  }
) {
  // 1. Load base template
  const template = await db.workflow_templates.findOne({
    where: { id: templateId, is_active: true }
  });

  // 2. Get customer context
  const customer = await db.customers.findOne({
    where: { id: customerId },
    include: ['company', 'contracts', 'contacts', 'engagement_metrics']
  });

  // 3. Find applicable modifications (ordered by priority)
  const modifications = await db.workflow_modifications.findAll({
    where: {
      workflow_template_id: templateId,
      is_active: true,
      OR: [
        // Global mods (condition-based)
        {
          scope_type: 'global',
          scope_criteria: matchesCriteria(triggerContext)
        },
        // Company mods
        {
          scope_type: 'company',
          scope_id: customer.company_id
        },
        // Customer-specific mods
        {
          scope_type: 'customer',
          scope_id: customerId
        },
        // Industry mods
        {
          scope_type: 'industry',
          scope_criteria: { industry: customer.industry }
        },
        // Segment mods
        {
          scope_type: 'segment',
          scope_criteria: matchesCriteria(customer)
        }
      ]
    },
    order: [['priority', 'ASC']]  // Apply low priority first
  });

  // 4. Apply modifications in order
  let compiledSteps = [...template.base_steps];
  let compiledArtifacts = [...template.base_artifacts];

  for (const mod of modifications) {
    switch (mod.modification_type) {
      case 'add_step':
        compiledSteps.splice(
          mod.target_position,
          0,
          mod.modification_data
        );
        break;

      case 'remove_step':
        compiledSteps = compiledSteps.filter(
          s => s.step_id !== mod.target_step_id
        );
        break;

      case 'modify_step':
        const idx = compiledSteps.findIndex(
          s => s.step_id === mod.target_step_id
        );
        if (idx >= 0) {
          compiledSteps[idx] = {
            ...compiledSteps[idx],
            ...mod.modification_data
          };
        }
        break;

      case 'add_artifact':
        const step = compiledSteps.find(
          s => s.step_id === mod.target_step_id
        );
        if (step) {
          step.shows_artifacts = [
            ...(step.shows_artifacts || []),
            mod.modification_data
          ];
        }
        break;

      // ... other modification types
    }
  }

  // 5. Hydrate templates with customer data
  const hydratedConfig = hydrateTemplates(
    {
      steps: compiledSteps,
      artifacts: compiledArtifacts
    },
    customer
  );

  // 6. Create workflow execution record
  const execution = await db.workflow_executions.create({
    workflow_template_id: templateId,
    customer_id: customerId,
    applied_modifications: modifications.map(m => m.id),
    compiled_config: hydratedConfig,
    status: 'not_started',
    current_step: hydratedConfig.steps[0].step_id
  });

  return execution;
}

/**
 * Hydrate template placeholders with customer data
 */
function hydrateTemplates(config: any, customer: any) {
  const data = {
    customer: {
      name: customer.name,
      current_arr: customer.current_arr,
      renewal_date: customer.renewal_date,
      health_score: customer.health_score,
      // ... all customer fields
    },
    // ... other data sources
  };

  return deepReplace(config, /\{\{([\w.]+)\}\}/g, data);
}
```

---

## 📝 Example: Obsidian Black Compilation

**Input**:
- Template: `renewal_base` (9 steps)
- Customer: Obsidian Black (risk_score: 64, ARR: $185K)
- Trigger: 90 days before renewal

**Applicable Modifications**:
1. **Global mod** (priority: 100): risk_score > 60 → add freebie steps
2. **Company mod** (priority: 200): N/A (not InHerSight)
3. **Customer mod** (priority: 300): N/A

**Output**:
```json
{
  "workflow_execution_id": "uuid-123",
  "workflow_template_id": "renewal_base",
  "customer_id": "obsidian-black-id",
  "applied_modifications": ["global-freebie-mod-id"],
  "compiled_config": {
    "steps": [
      {"step_id": "identify-concerns", "step_name": "Identify Concerns", ...},
      {"step_id": "review-data", "step_name": "Review Performance Data", ...},
      {"step_id": "prepare-freebie", "step_name": "Prepare Freebie", ...},  // ← Added
      {"step_id": "deliver-freebie", "step_name": "Deliver Freebie", ...},  // ← Added
      {"step_id": "measure-impact", "step_name": "Measure Impact", ...},    // ← Added
      {"step_id": "initial-meeting", "step_name": "Schedule Meeting", ...},
      {"step_id": "renewal-meeting", "step_name": "Renewal Discussion", ...},
      {"step_id": "recommendation", "step_name": "Create Recommendation", ...},
      {"step_id": "followup", "step_name": "Send Follow-up", ...},
      {"step_id": "negotiate", "step_name": "Negotiate & Close", ...}
    ],
    // Steps: 9 base + 3 freebie = 12 total
  }
}
```

---

## 🎯 Implementation Checklist

### Phase 1: Database Setup
- [ ] Create migration: `20250117000001_workflow_template_system.sql`
- [ ] Add `workflow_templates` table
- [ ] Add `workflow_modifications` table
- [ ] Alter `workflow_executions` to link templates
- [ ] Create indexes
- [ ] Test migration on dev database

### Phase 2: Compilation Service
- [ ] Create `src/lib/services/WorkflowCompilationService.ts`
- [ ] Implement `compileWorkflow()` function
- [ ] Implement modification application logic
- [ ] Implement template hydration with customer data
- [ ] Add unit tests

### Phase 3: Base Templates
- [ ] Create `renewal_base` template (9 core steps)
  - identify-concerns
  - review-data
  - identify-opportunities
  - prepare-meeting-deck
  - schedule-meeting
  - conduct-meeting
  - create-recommendation
  - send-followup
  - negotiate

### Phase 4: Global Modifications
- [ ] Create global mod: At-risk freebie intervention
  - Condition: risk_score > 60
  - Add 3 steps: prepare-freebie, deliver-freebie, measure-impact
  - Insert after position 2 (after review-data)

### Phase 5: InHerSight Customization
- [ ] Create company mod: InHerSight brand analysis
  - Scope: company_id = InHerSight
  - Add step: brand-exposure-deep-dive
  - Add artifact: brand_exposure_report
  - Insert after position 1 (after identify-concerns)

### Phase 6: Obsidian Black Test
- [ ] Adjust Obsidian Black risk_score to 64 (trigger freebie)
- [ ] Trigger renewal workflow compilation
- [ ] Verify 12 steps generated (9 base + 3 freebie)
- [ ] Execute first 3 steps manually
- [ ] Verify artifacts hydrate with Obsidian Black data
- [ ] Verify tasks created from task_templates
- [ ] Test workflow state persistence
- [ ] Compare to old hardcoded workflow behavior

### Phase 7: Integration
- [ ] Update workflow orchestrator to use compilation
- [ ] Update workflow API endpoints
- [ ] Update frontend to consume compiled workflows
- [ ] Add admin UI for viewing/editing templates
- [ ] Add admin UI for creating modifications

---

## 📚 Key Files Created (InHerSight 0.1.9)

**Already Built**:
- ✅ `supabase/migrations/20250117000000_inhersight_integration.sql` - Schema
- ✅ `src/lib/services/InHerSightScoringService.ts` - Scoring experiments
- ✅ `src/app/api/scoring/experiment/route.ts` - Scoring API
- ✅ `src/app/api/import/inhersight/upload/route.ts` - CSV import
- ✅ `src/app/api/import/inhersight/process/route.ts` - CSV processing
- ✅ `src/app/api/import/inhersight/status/[batchId]/route.ts` - Import status
- ✅ `scripts/setup-inhersight-user.ts` - Grace's account setup
- ✅ `scripts/seed-inhersight-demo-data.ts` - 5 demo customers
- ✅ `docs/inhersight-scoring-experiments.md` - Scoring analysis
- ✅ `docs/release-0.1.9-inhersight-summary.md` - Release guide
- ✅ `src/components/artifacts/workflows/config/artifactTemplates.ts` - Brand exposure artifact

**To Build**:
- ⏳ `supabase/migrations/20250117000001_workflow_template_system.sql`
- ⏳ `src/lib/services/WorkflowCompilationService.ts`
- ⏳ Seed scripts for base templates and modifications

---

## 🔑 Key Decisions Made

1. **Base templates for core journeys** (renewal, contact, expansion) - NOT per-customer
2. **Modification system with priority** (global < company < customer)
3. **Runtime compilation** instead of pre-generated configs
4. **Test with Obsidian Black** before rolling out to InHerSight
5. **Scoring strategy**: Rule-based primary, Claude hybrid for <120 days OR top 20% ARR
6. **Budget approved**: Claude API ($10-30/month), LinkedIn not approved yet

---

## 💡 Next Session Priorities

1. **Create the migration** with workflow_templates and workflow_modifications tables
2. **Build WorkflowCompilationService** with modification application logic
3. **Seed renewal_base template** with 9 core steps
4. **Create global at-risk mod** (freebie intervention)
5. **Test with Obsidian Black** workflow execution
6. **Document any issues** for iteration

---

## 📊 Current State

**Release 0.1.9 Progress**: ~80% complete
- ✅ Database schema for InHerSight metrics
- ✅ CSV import system
- ✅ Scoring engine (4 experiments)
- ✅ User setup scripts
- ✅ Demo data (5 customers)
- ✅ Documentation
- ⏳ Workflow template system (new architecture in progress)

**Estimated Remaining**: 2-3 days of implementation + testing

---

## 🎯 Success Criteria

- [ ] Obsidian Black workflow compiles correctly (12 steps)
- [ ] Artifacts hydrate with customer data
- [ ] Tasks created from task_templates
- [ ] Workflow state persists across sessions
- [ ] No hardcoded customer data in templates
- [ ] New templates added via database inserts (no code changes)
- [ ] Modifications apply in correct priority order

---

**Ready to implement in next session!**
