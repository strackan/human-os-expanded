# Workflow Template System - Migration Plan

**Release**: InHerSight 0.1.9
**Status**: Dual-mode deployment (legacy + template system in parallel)
**Strategy**: New workflows in template system only, legacy frozen, gradual migration

---

## 🎯 Migration Strategy

### Dual-Mode Deployment

**Both systems run in parallel**:
- **Legacy Mode**: Existing hardcoded TypeScript workflow configs (frozen - no new workflows)
- **Template Mode**: Database-driven WorkflowCompilationService (all new workflows)

**Controlled by feature flag**: `USE_WORKFLOW_TEMPLATE_SYSTEM`
- Default: `false` (uses legacy)
- Set to `true` in `.env.local` to enable template system
- Instant rollback capability

### Key Principle: **FREEZE LEGACY, BUILD IN NEW**

✅ **DO**: Create all new workflows in the template system
❌ **DON'T**: Add any new hardcoded TypeScript workflow files
⚠️ **WHY**: Avoid compounding technical debt while proving out new architecture

---

## 📊 Current State (0.1.9)

### Template System (NEW)
- ✅ Database schema created (`workflow_templates`, `workflow_modifications`)
- ✅ Compilation service (`WorkflowCompilationService`)
- ✅ 3 base templates seeded:
  - `renewal_base` (9 steps)
  - `contact_recovery` (4 steps)
  - `contact_crisis` (4 steps)
- ✅ 5 modifications created:
  - Global: At-risk freebie intervention (3 steps when risk_score > 60)
  - Global: Skip concerns for healthy accounts
  - InHerSight: Brand exposure analysis step
- ✅ API endpoint: `/api/workflows/compile`
- ✅ Tested with Obsidian Black (12 steps compiled correctly)

### Legacy System (FROZEN)
- Existing workflows remain functional
- No new workflows to be added
- Will be deprecated in future release (0.2.x)

---

## 🚀 Rollout Phases

### Phase 1: Parallel Deployment (0.1.9 - Current)

**Goal**: Prove template system with Obsidian Black

**Actions**:
- [x] Feature flag added (`USE_WORKFLOW_TEMPLATE_SYSTEM`)
- [ ] Workflow orchestrator supports dual-mode
- [ ] Track workflow source in executions (`template` vs `legacy`)
- [ ] End-to-end test with Obsidian Black

**Flag Status**: `false` (disabled by default)

**Test Customer**: Obsidian Black
- Template: `renewal_base`
- Modifications: At-risk freebie (risk_score: 64)
- Expected: 12 steps (9 base + 3 freebie)

---

### Phase 2: Expand to InHerSight (0.1.10)

**Goal**: All InHerSight workflows use template system

**Actions**:
- [ ] Convert Grace's remaining workflows to templates:
  - Meeting prep → `meeting_prep_base`
  - 120-day at-risk → Modification on `renewal_base`
  - Contact workflows → Use existing `contact_*` templates
- [ ] Enable flag for `company_id = InHerSight`
- [ ] Monitor performance and user feedback
- [ ] Build admin UI for template/modification management

**Flag Status**: `true` for InHerSight company only

---

### Phase 3: Global Rollout (0.2.0)

**Goal**: All customers use template system

**Actions**:
- [ ] Convert remaining legacy workflows to templates
- [ ] Enable flag globally
- [ ] Deprecation notice for legacy code
- [ ] Documentation complete

**Flag Status**: `true` by default

---

### Phase 4: Remove Legacy (0.2.1+)

**Goal**: Template system is the only system

**Actions**:
- [ ] Delete hardcoded workflow TypeScript files
- [ ] Remove feature flag
- [ ] Remove legacy orchestrator code
- [ ] Celebrate! 🎉

**Flag Status**: Removed (template system mandatory)

---

## 🔧 Implementation Guide

### For Developers: Creating a New Workflow

**❌ OLD WAY (Do NOT do this)**:
```typescript
// DON'T create new files like this anymore!
export const MyNewWorkflow: WorkflowConfig = {
  customer: { name: '{{customer.name}}' },
  sidePanel: { steps: [...] },
  // ... 500+ lines of hardcoded config
};
```

**✅ NEW WAY (Do this)**:

1. **Create base template** (if new workflow type):
```sql
INSERT INTO workflow_templates (name, display_name, category, base_steps, base_artifacts)
VALUES (
  'my_workflow_base',
  'My Workflow',
  'opportunity',
  '[{"step_id": "step1", "step_name": "First Step", ...}]'::jsonb,
  '[{"artifact_id": "artifact1", ...}]'::jsonb
);
```

2. **Add modifications** (for variations):
```sql
-- Global modification: Add step when opportunity_score > 80
INSERT INTO workflow_modifications (
  workflow_template_id,
  scope_type,
  scope_criteria,
  modification_type,
  target_position,
  modification_data,
  priority,
  reason
) VALUES (
  (SELECT id FROM workflow_templates WHERE name = 'my_workflow_base'),
  'global',
  '{"opportunity_score": {"$gt": 80}}'::jsonb,
  'add_step',
  3,
  '{"step_id": "expansion_deep_dive", "step_name": "Expansion Analysis", ...}'::jsonb,
  100,
  'High-opportunity accounts need expansion analysis'
);
```

3. **Trigger compilation**:
```typescript
// In your orchestrator code
const response = await fetch('/api/workflows/compile', {
  method: 'POST',
  body: JSON.stringify({
    templateName: 'my_workflow_base',
    customerId: customer.id,
    userId: user.id,
    triggerContext: { opportunity_score: customer.opportunity_score }
  })
});

const { data } = await response.json();
const { compiledWorkflow, executionId } = data;
```

### For Admins: Using the Feature Flag

**Enable template system**:
```bash
# .env.local
NEXT_PUBLIC_USE_WORKFLOW_TEMPLATE_SYSTEM=true
```

**Disable (rollback to legacy)**:
```bash
# .env.local
NEXT_PUBLIC_USE_WORKFLOW_TEMPLATE_SYSTEM=false
```

**Check flag status**:
```typescript
import { isFeatureEnabled } from '@/lib/constants/feature-flags';

if (isFeatureEnabled('USE_WORKFLOW_TEMPLATE_SYSTEM')) {
  // Use template compilation
} else {
  // Use legacy hardcoded configs
}
```

---

## 📋 Workflow Source Tracking

To monitor which system is being used, we track the source in `workflow_executions`:

```typescript
// When creating execution
await supabase.from('workflow_executions').insert({
  workflow_template_id: templateId,    // NULL for legacy
  compiled_config: compiledConfig,     // NULL for legacy
  metadata: {
    workflow_source: isFeatureEnabled('USE_WORKFLOW_TEMPLATE_SYSTEM')
      ? 'template'
      : 'legacy',
    feature_flag_state: FEATURE_FLAGS.USE_WORKFLOW_TEMPLATE_SYSTEM
  }
});
```

**Analytics queries**:
```sql
-- Count workflows by source
SELECT
  metadata->>'workflow_source' as source,
  COUNT(*) as total
FROM workflow_executions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY source;

-- Find issues in template workflows
SELECT *
FROM workflow_executions
WHERE metadata->>'workflow_source' = 'template'
  AND status = 'failed';
```

---

## ✅ Testing Checklist

### Before Enabling Flag
- [ ] Database migration applied (`20250117000001_workflow_template_system.sql`)
- [ ] Templates seeded (`npx tsx scripts/seed-workflow-templates.ts`)
- [ ] Modifications seeded (`npx tsx scripts/seed-workflow-modifications.ts`)
- [ ] API endpoint tested (`/api/workflows/compile`)
- [ ] Compilation test passes (`npx tsx scripts/test-obsidian-black-workflow.ts`)

### After Enabling Flag
- [ ] Obsidian Black workflow triggers correctly
- [ ] 12 steps appear in UI (9 base + 3 freebie)
- [ ] Artifacts hydrate with customer data
- [ ] Tasks created correctly
- [ ] Workflow state persists
- [ ] No errors in console/logs
- [ ] Rollback works (set flag to false)

### Production Monitoring
- [ ] Track workflow_source in analytics
- [ ] Monitor compilation errors
- [ ] Compare template vs legacy success rates
- [ ] Gather user feedback (Grace)
- [ ] No performance degradation

---

## 🐛 Troubleshooting

### Issue: Compilation fails with "Template not found"
**Solution**: Run seed script:
```bash
NEXT_PUBLIC_SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." \
  npx tsx scripts/seed-workflow-templates.ts
```

### Issue: No modifications applied
**Check**:
1. Modifications are active: `is_active = true`
2. Scope criteria matches customer data
3. Priority order is correct (lower = applied first)

**Debug query**:
```sql
SELECT
  m.modification_type,
  m.scope_type,
  m.scope_criteria,
  m.priority,
  m.is_active
FROM workflow_modifications m
WHERE m.workflow_template_id = '...'
  AND m.is_active = true
ORDER BY m.priority;
```

### Issue: Workflow UI shows errors
**Check**:
1. `compiled_config` structure matches expected WorkflowConfig format
2. May need adapter layer for UI compatibility
3. Check browser console for specific errors

### Issue: Need to rollback
**Immediate fix**:
```bash
# .env.local
NEXT_PUBLIC_USE_WORKFLOW_TEMPLATE_SYSTEM=false
```

Restart app, workflows will use legacy system.

---

## 📚 Related Documentation

- **Architecture**: `docs/workflow-template-system-handoff.md`
- **Scoring System**: `docs/inhersight-scoring-experiments.md`
- **Release Summary**: `docs/release-0.1.9-inhersight-summary.md`
- **Feature Flags**: `src/lib/constants/feature-flags.ts`

---

## 🎯 Success Criteria

**Template system is ready for full rollout when**:

✅ All criteria met:
- [ ] 30+ days of Obsidian Black workflows without issues
- [ ] All InHerSight workflows migrated and working
- [ ] Grace confirms template system is superior to legacy
- [ ] Performance metrics equal or better than legacy
- [ ] Admin UI available for template management
- [ ] Documentation complete
- [ ] Team trained on new system

**Then we can deprecate legacy in 0.2.x**

---

**Last Updated**: 2025-01-17
**Status**: Phase 1 (Parallel Deployment) - Ready for Obsidian Black testing
