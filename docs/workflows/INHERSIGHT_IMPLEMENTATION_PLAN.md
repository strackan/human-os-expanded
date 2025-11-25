# InHerSight Workflows - Complete Implementation Plan

**Created**: 2025-01-24
**Status**: Ready to Implement
**Priority**: High
**Estimated Time**: 12-16 hours

## Overview

This document provides a complete implementation plan to build all the slides and artifacts needed for the InHerSight 90-day and 120-day renewal workflows as defined in the original static configs.

## What's Already Working

✅ **Infrastructure**:
- Customer view uses `composeFromDatabase()`
- Workflow definitions seeded in database
- Workflow selection logic based on customer context

✅ **Existing Slides** (from SLIDE_LIBRARY):
- `greeting` - Workflow introduction
- `review-account` - Account review
- `prepare-quote` - Quote preparation
- `workflow-summary` - Final summary
- `draft-email` - Email drafting
- `schedule-call` - Call scheduling
- `review-contract-terms` - Contract review
- `pricing-strategy` - Pricing analysis

## What Needs to Be Built

### Phase 1: Core InHerSight Slides (Priority: High)

These slides are specific to InHerSight workflows and need to be created:

#### 1.1 Brand Performance Review Slide
**File**: `src/lib/workflows/slides/inhersight/reviewBrandPerformanceSlide.ts`
**Artifact**: Brand Exposure Report (document with InHerSight-specific metrics)
**Purpose**: Show brand impressions, profile views, apply clicks, etc.

```typescript
// Artifact structure needed:
{
  id: 'brand-exposure-report',
  type: 'document',
  title: 'Brand Exposure Report',
  content: `# {{customer.name}} - Brand Performance Report

## Key Metrics
- Brand Impressions: {{customer.brand_impressions}}
- Profile Views: {{customer.profile_views}}
- Apply Clicks: {{customer.apply_clicks}}
...
  `
}
```

**Estimated Time**: 1.5 hours

#### 1.2 Planning Checklist Slide
**File**: `src/lib/workflows/slides/common/showChecklistSlide.ts`
**Artifact**: Planning Checklist (interactive checklist component)
**Purpose**: Show workflow steps overview

```typescript
// Artifact structure needed:
{
  id: 'renewal-checklist',
  type: 'planning-checklist',
  title: '90-Day Renewal Checklist',
  items: [
    { id: 'review-performance', label: 'Review performance data', completed: false },
    { id: 'review-contract', label: 'Review contract terms', completed: false },
    ...
  ]
}
```

**Estimated Time**: 1 hour

#### 1.3 Identify Opportunities Slide
**File**: `src/lib/workflows/slides/renewal/identifyOpportunitiesSlide.ts`
**Artifact**: Opportunity Analysis (pricing analysis format)
**Purpose**: Analyze expansion opportunities based on usage

**Estimated Time**: 1 hour

#### 1.4 Prepare Meeting Deck Slide
**File**: `src/lib/workflows/slides/renewal/prepareMeetingDeckSlide.ts`
**Artifact**: Meeting Deck (document)
**Purpose**: Create performance review presentation

**Estimated Time**: 1 hour

#### 1.5 Meeting Debrief Slide
**File**: `src/lib/workflows/slides/renewal/meetingDebriefSlide.ts`
**Artifact**: Meeting Notes (document)
**Purpose**: Capture meeting sentiment and takeaways

**Estimated Time**: 1 hour

#### 1.6 Create Recommendation Slide
**File**: `src/lib/workflows/slides/renewal/createRecommendationSlide.ts`
**Artifact**: Renewal Recommendation (document)
**Purpose**: Draft renewal recommendation based on feedback

**Estimated Time**: 1 hour

#### 1.7 Negotiation Guide Slide
**File**: `src/lib/workflows/slides/renewal/negotiationGuideSlide.ts`
**Artifact**: Negotiation Guide (document, read-only)
**Purpose**: Provide talking points and pricing flexibility

**Estimated Time**: 1 hour

### Phase 2: At-Risk Specific Slides (Priority: High)

These slides are unique to the 120-day at-risk workflow:

#### 2.1 Identify Concerns Slide
**File**: `src/lib/workflows/slides/risk/identifyConcernsSlide.ts`
**Artifact**: Concern Analysis (document)
**Purpose**: Analyze root causes of at-risk status

**Buttons**:
- Primary KPI not met
- Low engagement/usage
- Support issues/frustration
- Budget/pricing concerns
- Multiple issues

**Estimated Time**: 1.5 hours

#### 2.2 Prepare Freebie Slide
**File**: `src/lib/workflows/slides/inhersight/prepareFreebieSlide.ts`
**Artifact**: Freebie Strategy (document, editable)
**Purpose**: Select value-add offering to rebuild trust

**Buttons**:
- Featured article placement
- Profile optimization session
- Social media campaign
- Premium job posting credits
- Custom package

**Estimated Time**: 2 hours

#### 2.3 Schedule Urgent Meeting Slide
**File**: `src/lib/workflows/slides/risk/scheduleUrgentMeetingSlide.ts`
**Artifact**: Initial Meeting Email (email)
**Purpose**: Draft meeting request positioning freebie

**Estimated Time**: 1 hour

#### 2.4 Deliver Freebie Slide
**File**: `src/lib/workflows/slides/inhersight/deliverFreebieSlide.ts`
**Artifact**: Freebie Tracker (document, editable)
**Purpose**: Track freebie execution and quality

**Estimated Time**: 1 hour

#### 2.5 Measure Freebie Impact Slide
**File**: `src/lib/workflows/slides/inhersight/measureFreebieImpactSlide.ts`
**Artifact**: Freebie Impact Report (document)
**Purpose**: Gather performance data from freebie

**Buttons**:
- Freebie showed strong results
- Results were okay
- Results disappointing

**Estimated Time**: 1.5 hours

#### 2.6 Prepare Renewal Deck Slide (At-Risk)
**File**: `src/lib/workflows/slides/risk/prepareRenewalDeckSlide.ts`
**Artifact**: Renewal Presentation (document)
**Purpose**: Create deck with freebie results

**Estimated Time**: 1 hour

### Phase 3: Enhanced Artifacts & Components (Priority: Medium)

#### 3.1 Brand Exposure Report Component
**File**: `src/lib/workflows/components/BrandExposureReportComponent.tsx`
**Purpose**: Rich component for InHerSight-specific metrics visualization

**Features**:
- Metric cards with trend indicators
- Charts for brand visibility over time
- Job posting performance breakdown
- Content engagement metrics

**Estimated Time**: 3 hours

#### 3.2 Freebie Strategy Component
**File**: `src/lib/workflows/components/FreebieStrategyComponent.tsx`
**Purpose**: Interactive freebie selection and tracking

**Features**:
- Freebie option cards with value estimates
- Timeline and impact projections
- Status tracking (proposed → approved → delivered → measured)

**Estimated Time**: 2-3 hours

### Phase 4: Enhanced Branching Logic (Priority: Low)

The static configs have rich branching with button options. Current slide system supports this, but needs:

#### 4.1 Dynamic Branch Builder
**Purpose**: Helper to create complex branches from config
**File**: `src/lib/workflows/slides/utils/branchBuilder.ts`

**Estimated Time**: 1-2 hours

## Implementation Sequence

### Week 1: Core Functionality (8 hours)
1. ✅ **Day 1** (Done): Infrastructure + basic workflow definitions
2. **Day 2** (2 hours): Phase 1.1 - Brand Performance Review Slide
3. **Day 3** (2 hours): Phase 1.2 + 1.3 - Checklist + Opportunities
4. **Day 4** (2 hours): Phase 1.4 + 1.5 - Meeting Deck + Debrief
5. **Day 5** (2 hours): Phase 1.6 + 1.7 - Recommendation + Negotiation

### Week 2: At-Risk Workflow (8 hours)
1. **Day 1** (2 hours): Phase 2.1 + 2.2 - Concerns + Freebie
2. **Day 2** (2 hours): Phase 2.3 + 2.4 - Meeting + Delivery
3. **Day 3** (2 hours): Phase 2.5 + 2.6 - Impact + Renewal Deck
4. **Day 4** (2 hours): Testing and refinement

### Optional Week 3: Polish (6 hours)
1. **Day 1-2** (4 hours): Phase 3 - Rich artifact components
2. **Day 3** (2 hours): Phase 4 - Enhanced branching

## File Structure

```
src/lib/workflows/slides/
├── inhersight/
│   ├── reviewBrandPerformanceSlide.ts
│   ├── prepareFreebieSlide.ts
│   ├── deliverFreebieSlide.ts
│   └── measureFreebieImpactSlide.ts
├── renewal/
│   ├── identifyOpportunitiesSlide.ts
│   ├── prepareMeetingDeckSlide.ts
│   ├── meetingDebriefSlide.ts
│   ├── createRecommendationSlide.ts
│   └── negotiationGuideSlide.ts
├── risk/
│   ├── identifyConcernsSlide.ts
│   ├── scheduleUrgentMeetingSlide.ts
│   └── prepareRenewalDeckSlide.ts
└── common/
    └── showChecklistSlide.ts

src/lib/workflows/components/
├── BrandExposureReportComponent.tsx
└── FreebieStrategyComponent.tsx
```

## Slide Template (Copy-Paste Starter)

```typescript
/**
 * [Slide Name] Slide
 *
 * Purpose: [Description]
 * Used in: [InHerSight 90-day / 120-day at-risk]
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const [slideName]Slide: UniversalSlideBuilder = (context) => ({
  id: '[slide-id]',
  version: 2,
  name: '[Slide Name]',
  category: 'renewal', // or 'risk' or 'inhersight'

  structure: {
    id: '[slide-id]',
    title: '[Slide Title]',
    description: '[Brief description]',
    label: '[Short label]',
    stepMapping: '[slide-id]',
    showSideMenu: true,

    chat: {
      initialMessage: {
        text: context?.variables?.customMessage || "Default message here...",
        buttons: [
          {
            label: 'Continue',
            value: 'continue',
            'label-background': 'bg-blue-600',
            'label-text': 'text-white',
          },
        ],
      },
      branches: {
        continue: {
          response: 'Great! Moving forward...',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'I understand. How can I help?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: '[artifact-id]',
          type: 'document', // or 'email', 'planning-checklist', etc.
          title: '[Artifact Title]',
          content: `# {{customer.name}} - [Artifact Name]

Content goes here with {{variable}} placeholders
          `,
          editable: true,
          visible: true,
        },
      ],
    },

    sidePanel: {
      enabled: true,
      title: {
        text: 'Progress',
        subtitle: 'Workflow steps',
        icon: 'checklist',
      },
      steps: [], // Usually populated by workflow composition
      progressMeter: {
        currentStep: 0,
        totalSteps: 0,
        progressPercentage: 0,
        showPercentage: true,
        showStepNumbers: true,
      },
      showProgressMeter: true,
      showSteps: true,
    },

    onComplete: {
      nextSlide: undefined,
      updateProgress: true,
    },
  },
});
```

## Testing Checklist

For each slide created:

- [ ] Slide exports properly from file
- [ ] Slide registered in `src/lib/workflows/slides/index.ts`
- [ ] Artifact renders correctly
- [ ] Buttons trigger correct branches
- [ ] Variables hydrate from customer context
- [ ] Side panel shows progress
- [ ] Next slide navigation works
- [ ] Can be composed from database workflow definition

## Database Workflow Updates

Once slides are created, update the workflow definitions:

### 90-Day Workflow Full Sequence
```sql
UPDATE workflow_definitions
SET slide_sequence = ARRAY[
  'greeting',
  'show-checklist',
  'review-brand-performance',
  'review-contract-terms',
  'identify-opportunities',
  'prepare-meeting-deck',
  'draft-email',
  'meeting-debrief',
  'create-recommendation',
  'draft-email', -- follow-up
  'negotiation-guide',
  'workflow-summary'
]
WHERE workflow_id = 'inhersight-90day-renewal';
```

### 120-Day At-Risk Full Sequence
```sql
UPDATE workflow_definitions
SET slide_sequence = ARRAY[
  'greeting',
  'identify-concerns',
  'review-brand-performance',
  'prepare-freebie',
  'schedule-urgent-meeting',
  'deliver-freebie',
  'measure-freebie-impact',
  'draft-email', -- renewal meeting request
  'prepare-renewal-deck',
  'create-recommendation',
  'draft-email', -- follow-up
  'negotiation-guide',
  'workflow-summary'
]
WHERE workflow_id = 'inhersight-120day-atrisk';
```

## Success Metrics

Implementation is complete when:

1. ✅ All Phase 1 slides created and working
2. ✅ All Phase 2 slides created and working
3. ✅ Workflows launch from customer view without errors
4. ✅ All artifacts render correctly
5. ✅ Branching logic preserved from static configs
6. ✅ InHerSight-specific metrics display properly
7. ✅ Freebie strategy workflow executes end-to-end
8. ✅ Can complete full 90-day workflow
9. ✅ Can complete full 120-day at-risk workflow

## Resources

- **Reference**: Original static configs in `src/components/artifacts/workflows/configs/workflows/`
- **Examples**: Existing slides in `src/lib/workflows/slides/`
- **Standard**: `docs/workflows/WORKFLOW_SYSTEM_STANDARD.md`
- **Migration Guide**: `docs/workflows/INHERSIGHT_WORKFLOW_MIGRATION.md`

---

**Start with Phase 1.1 (Brand Performance Review Slide)** - it's the most InHerSight-specific and will set the pattern for others.
