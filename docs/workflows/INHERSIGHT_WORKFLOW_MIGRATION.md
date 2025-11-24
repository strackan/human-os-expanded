# InHerSight Workflows Migration Guide

**Status**: 🔄 Migration Required
**Priority**: High
**Updated**: 2025-01-24

## Overview

The InHerSight 90-day and 120-day workflows are currently defined as **static TypeScript config files** but need to be migrated to the **Phase 3 Modular Slide Library System** stored in the database.

## Current State

### Static Config Files (Legacy System 3)
- **90-Day Workflow**: `src/components/artifacts/workflows/configs/workflows/InHerSight90DayRenewal.ts`
- **120-Day At-Risk**: `src/components/artifacts/workflows/configs/workflows/InHerSight120DayAtRisk.ts`

These files define complete `WorkflowConfig` objects with:
- Rich `chat.dynamicFlow.branches` for conversation flows
- Multiple artifacts (emails, reports, checklists)
- Complex branching logic
- Side panel configurations

### Problems
1. **Not in Database**: Can't be customized per company
2. **Not Modular**: Can't reuse slides across workflows
3. **Hard to Maintain**: Changes require code deployments
4. **Inconsistent**: Different system than Obsidian Black workflows

## Migration Path

### Step 1: Analyze Existing Workflows

Review the static configs to understand:
- ✅ What slides/steps are needed
- ✅ What artifacts are used
- ✅ What branching logic exists
- ✅ What customer data is needed

### Step 2: Create Modular Slides

For each step in the InHerSight workflows, either:

**A) Use Existing Slides from SLIDE_LIBRARY**
- Check `src/lib/workflows/slides/` for reusable slides
- Example: `greeting`, `review-account`, `prepare-quote`

**B) Create New Slides** (if needed)
- Location: `src/lib/workflows/slides/`
- Follow the slide builder pattern
- Make them generic/reusable for future workflows

Example slide structure:
```typescript
// src/lib/workflows/slides/renewal/scheduleRenewalMeeting.ts
export const scheduleRenewalMeeting: UniversalSlideBuilder = (context) => ({
  id: 'schedule-renewal-meeting',
  version: 2,
  name: 'Schedule Renewal Meeting',
  category: 'communication',

  structure: {
    id: 'schedule-renewal-meeting',
    title: 'Schedule Renewal Meeting',
    description: 'Send meeting request to customer',
    label: 'Schedule Meeting',

    chat: {
      initialMessage: {
        text: "Let me draft a meeting request email...",
        buttons: [
          { label: 'Send Email', value: 'send' },
          { label: 'Edit First', value: 'edit' },
        ],
      },
      branches: {
        send: {
          response: '✅ Meeting request sent!',
          actions: ['nextSlide'],
        },
      },
    },

    artifacts: {
      sections: [{
        id: 'meeting-email',
        type: 'email',
        title: 'Meeting Request',
        // Use component reference for rich email editing
        data: {
          componentType: 'EmailArtifact',
          props: {
            to: '{{customer.primary_contact_email}}',
            subject: 'Renewal Discussion - {{customer.name}}',
            body: '{{template:renewal-meeting-request}}',
          },
        },
      }],
    },
  },
});
```

### Step 3: Create Workflow Definitions

Create entries in `workflow_definitions` table:

```typescript
// scripts/seed-inhersight-workflows.ts
import { createClient } from '@/lib/supabase/client';

async function seedInHerSightWorkflows() {
  const supabase = createClient();

  // 90-Day Renewal Workflow
  await supabase.from('workflow_definitions').insert({
    workflow_id: 'inhersight-90day-renewal',
    name: 'InHerSight 90-Day Renewal',
    workflow_type: 'renewal',
    description: "Grace's 90-day renewal workflow with performance review",
    is_stock_workflow: true,
    company_id: null,

    slide_sequence: [
      'greeting',
      'show-checklist',
      'review-performance',
      'review-contract',
      'identify-opportunities',
      'prepare-meeting-deck',
      'schedule-meeting',
      'conduct-meeting',
      'create-recommendation',
      'send-followup',
      'negotiate',
      'workflow-complete',
    ],

    slide_contexts: {
      greeting: {
        variables: {
          urgency: 'high',
          timeEstimate: '15-20 minutes',
        },
      },
      'review-performance': {
        variables: {
          metricsToShow: ['brand_impressions', 'profile_views', 'apply_clicks'],
          reportType: 'brand-exposure',
        },
      },
      // ... contexts for other slides
    },

    trigger_conditions: {
      days_to_renewal: { operator: '<=', value: 90 },
      workflow_type: 'renewal',
    },

    priority_weight: 80,
    version: 1,
  });

  // 120-Day At-Risk Workflow
  await supabase.from('workflow_definitions').insert({
    workflow_id: 'inhersight-120day-atrisk',
    name: 'InHerSight 120-Day At-Risk Recovery',
    workflow_type: 'risk',
    description: "Grace's at-risk customer recovery workflow with freebie strategy",
    is_stock_workflow: true,
    company_id: null,

    slide_sequence: [
      'greeting-urgent',
      'identify-concerns',
      'review-data',
      'prepare-freebie',
      'initial-meeting',
      'deliver-freebie',
      'measure-impact',
      'renewal-meeting',
      'renewal-deck',
      'recommendation',
      'followup',
      'negotiate',
    ],

    slide_contexts: {
      'greeting-urgent': {
        variables: {
          urgency: 'critical',
          riskLevel: 'high',
          timeEstimate: '30-40 minutes',
        },
      },
      'prepare-freebie': {
        variables: {
          freebieOptions: [
            'featured-article',
            'profile-optimization',
            'social-campaign',
            'job-credits',
          ],
        },
      },
      // ... contexts for other slides
    },

    trigger_conditions: {
      days_to_renewal: { operator: '<=', value: 120 },
      health_score: { operator: '<', value: 70 },
      workflow_type: 'risk',
    },

    priority_weight: 95, // Higher priority for at-risk
    version: 1,
  });
}
```

### Step 4: Test Workflow Composition

Test that workflows can be loaded:

```typescript
// Test script
import { composeFromDatabase } from '@/lib/workflows/db-composer';

async function testInHerSightWorkflows() {
  const mockCustomer = {
    name: 'Test Company',
    current_arr: 50000,
    health_score: 65,
    renewal_date: '2025-04-15',
    days_to_renewal: 85,
    brand_impressions: '125K',
    profile_views: '3.2K',
  };

  // Test 90-day workflow
  const workflow90 = await composeFromDatabase(
    'inhersight-90day-renewal',
    null,
    mockCustomer
  );
  console.log('90-day workflow loaded:', workflow90);

  // Test 120-day workflow
  const workflow120 = await composeFromDatabase(
    'inhersight-120day-atrisk',
    null,
    mockCustomer
  );
  console.log('120-day workflow loaded:', workflow120);
}
```

### Step 5: Update Customer View (Already Done ✅)

The customer view page (`src/app/customers/view/[id]/page.tsx`) has been updated to:
- Use `composeFromDatabase()` instead of API compilation
- Select workflow based on customer context
- Handle InHerSight workflow IDs

### Step 6: Remove Legacy Files

Once migration is complete and tested:

1. **Archive** (don't delete immediately):
   - Move static configs to `docs/archive/legacy-workflows/`
   - Keep for reference during migration

2. **Mark as Deprecated**:
   - Add deprecation notices to old files
   - Update any imports to use new system

3. **Eventually Remove**:
   - After confirming everything works
   - Remove static config files
   - Remove `WorkflowConfigTransformer` if no longer needed

## Workflow Mapping

### InHerSight 90-Day Renewal

| Static Config Step | Slide Library Slide | Status |
|--------------------|---------------------|--------|
| Greeting | `greeting` | ✅ Exists |
| Show Checklist | `show-planning-checklist` | 🔄 Create |
| Review Performance | `review-brand-performance` | 🔄 Create (IHS-specific) |
| Review Contract | `review-contract` | ✅ Exists |
| Identify Opportunities | `identify-expansion-opportunities` | ✅ Exists |
| Prepare Meeting Deck | `prepare-presentation` | 🔄 Create |
| Schedule Meeting | `schedule-meeting` | ✅ Exists |
| Conduct Meeting | `meeting-debrief` | 🔄 Create |
| Create Recommendation | `create-renewal-recommendation` | ✅ Exists |
| Send Follow-up | `send-followup-email` | ✅ Exists |
| Negotiate | `negotiate-terms` | ✅ Exists |

### InHerSight 120-Day At-Risk

| Static Config Step | Slide Library Slide | Status |
|--------------------|---------------------|--------|
| Greeting (Urgent) | `greeting-urgent` | 🔄 Create |
| Identify Concerns | `identify-risk-concerns` | 🔄 Create |
| Review Data | `review-performance-data` | ✅ Exists |
| Prepare Freebie | `prepare-value-add-offer` | 🔄 Create (IHS-specific) |
| Initial Meeting | `schedule-urgent-meeting` | 🔄 Create |
| Deliver Freebie | `track-freebie-delivery` | 🔄 Create (IHS-specific) |
| Measure Impact | `measure-freebie-impact` | 🔄 Create (IHS-specific) |
| Renewal Meeting | `schedule-renewal-meeting` | ✅ Exists |
| Renewal Deck | `prepare-renewal-deck` | ✅ Exists |
| Recommendation | `create-renewal-recommendation` | ✅ Exists |
| Follow-up | `send-followup-email` | ✅ Exists |
| Negotiate | `negotiate-save-terms` | ✅ Exists |

## Artifacts to Migrate

### Common Artifacts (Already in Component Registry)
- ✅ Email drafts → `EmailArtifact`
- ✅ Contract reviews → `ContractArtifact`
- ✅ Pricing analysis → `PricingAnalysisArtifact`
- ✅ Planning checklists → `PlanningChecklistArtifact`

### InHerSight-Specific Artifacts (Need Creation)
- 🔄 Brand Exposure Report → `BrandExposureArtifact`
- 🔄 Freebie Options → `FreebieStrategyArtifact`
- 🔄 Freebie Tracker → `FreebieTrackerArtifact`
- 🔄 Freebie Results → `FreebieResultsArtifact`

## Timeline Estimate

- **Slide Creation**: 4-6 hours (create ~8 new slides)
- **Database Seeding**: 1 hour (write seed script)
- **Testing**: 2-3 hours (test both workflows)
- **Cleanup**: 1 hour (archive old files)

**Total**: ~8-11 hours of development work

## Next Steps

1. ✅ Customer view updated to use standard system
2. ✅ Documentation created
3. 🔄 Create missing slides (high priority)
4. 🔄 Create seed script for workflow definitions
5. 🔄 Test end-to-end workflow launch
6. 🔄 Archive legacy static config files

## Success Criteria

Migration complete when:
- ✅ Customer view uses `composeFromDatabase()`
- ⏳ InHerSight workflows exist in `workflow_definitions` table
- ⏳ All slides exist in `SLIDE_LIBRARY`
- ⏳ Workflows launch and run correctly from customer view
- ⏳ Same artifacts render as before
- ⏳ Same branching logic preserved
- ⏳ Static config files archived

---

**Note**: The customer view page is already updated to use the standard system. The workflows just need to be defined in the database and any missing slides need to be created.
