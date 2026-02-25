# InHerSight Workflows - REVISED Implementation Plan

**Created**: 2025-01-24 (Revised)
**Status**: Ready to Implement
**Priority**: High
**Estimated Time**: 4-6 hours (much less than original estimate!)

## Key Realizations ✅

After reviewing the codebase more carefully:

1. **Planning Checklist EXISTS** - It's built into the `greetingSlide` with `showPlanningChecklist` flag
2. **Brand Exposure Report EXISTS** - `createBrandExposureReportArtifact` already in artifactTemplates
3. **Most artifacts are just DOCUMENTS** - Use `createDocumentArtifact`, not new types
4. **Meeting Deck is COMPLEX** - Save for last, may need new artifact type

## What Actually Exists

✅ **Artifact Templates Available**:
- `createEmailArtifact` - For all emails
- `createDocumentArtifact` - For generic documents (most artifacts!)
- `createPlanningChecklistArtifact` - For checklists
- `createBrandExposureReportArtifact` - For InHerSight metrics!
- `createContractArtifact` - For contract reviews
- `createPricingAnalysisArtifact` - For opportunity analysis
- `createWorkflowSummaryArtifact` - For summaries
- `createQuoteArtifact` - For quotes

✅ **Existing Slides**:
- `greeting` (with planning checklist support!)
- `review-account`
- `prepare-quote`
- `draft-email`
- `schedule-call`
- `review-contract-terms`
- `pricing-strategy`
- `workflow-summary`

## What Actually Needs to Be Built

### Phase 1: Core Slides (3-4 hours)

Most of these are just **slide builders that use existing artifact templates**!

#### 1.1 Review Brand Performance Slide ✅ Easy
**File**: `src/lib/workflows/slides/inhersight/reviewBrandPerformanceSlide.ts`
**Artifact**: Use `createBrandExposureReportArtifact` (already exists!)
**Work**: Just create the slide builder wrapper
**Time**: 30 minutes

#### 1.2 Identify Opportunities Slide ✅ Easy
**File**: `src/lib/workflows/slides/renewal/identifyOpportunitiesSlide.ts`
**Artifact**: Use `createPricingAnalysisArtifact` (already exists!)
**Work**: Just create the slide builder wrapper
**Time**: 30 minutes

#### 1.3 Meeting Debrief Slide ✅ Easy
**File**: `src/lib/workflows/slides/renewal/meetingDebriefSlide.ts`
**Artifact**: Use `createDocumentArtifact` (generic document!)
**Work**: Just create the slide builder with meeting notes template
**Time**: 30 minutes

#### 1.4 Create Recommendation Slide ✅ Easy
**File**: `src/lib/workflows/slides/renewal/createRecommendationSlide.ts`
**Artifact**: Use `createDocumentArtifact` (generic document!)
**Work**: Just create the slide builder with recommendation template
**Time**: 30 minutes

#### 1.5 Negotiation Guide Slide ✅ Easy
**File**: `src/lib/workflows/slides/renewal/negotiationGuideSlide.ts`
**Artifact**: Use `createDocumentArtifact` (generic document!)
**Work**: Just create the slide builder with negotiation template
**Time**: 30 minutes

### Phase 2: At-Risk Slides (2-3 hours)

#### 2.1 Identify Concerns Slide ⚠️ Medium
**File**: `src/lib/workflows/slides/risk/identifyConcernsSlide.ts`
**Artifact**: Use `createDocumentArtifact` (generic document!)
**Work**: Slide builder with button options for concern types
**Time**: 45 minutes

#### 2.2 Prepare Freebie Slide ⚠️ Medium
**File**: `src/lib/workflows/slides/inhersight/prepareFreebieSlide.ts`
**Artifact**: Use `createDocumentArtifact` (generic document!)
**Work**: Slide builder with button options for freebie types
**Time**: 45 minutes

#### 2.3 Deliver Freebie Slide ✅ Easy
**File**: `src/lib/workflows/slides/inhersight/deliverFreebieSlide.ts`
**Artifact**: Use `createDocumentArtifact` (generic document!)
**Work**: Just create the slide builder with tracking template
**Time**: 30 minutes

#### 2.4 Measure Freebie Impact Slide ⚠️ Medium
**File**: `src/lib/workflows/slides/inhersight/measureFreebieImpactSlide.ts`
**Artifact**: Use `createDocumentArtifact` (generic document!)
**Work**: Slide builder with button options for results quality
**Time**: 45 minutes

### Phase 3: Meeting Deck (SKIP FOR NOW)

**Meeting Deck** is the ONLY potentially complex one. Let's use a simple document for now and enhance later if needed.

#### 3.1 Prepare Meeting Deck Slide (Simple Version) ✅ Easy
**File**: `src/lib/workflows/slides/renewal/prepareMeetingDeckSlide.ts`
**Artifact**: Use `createDocumentArtifact` (markdown document!)
**Work**: Just create the slide builder with deck template
**Time**: 30 minutes

**OR** - Skip entirely and use `draft-email` slide in its place for now.

## Simplified Implementation Sequence

### Day 1: Core Renewal Slides (2 hours)
1. ✅ **30 min**: Review Brand Performance Slide (use BrandExposureReport)
2. ✅ **30 min**: Identify Opportunities Slide (use PricingAnalysis)
3. ✅ **30 min**: Meeting Debrief Slide (document)
4. ✅ **30 min**: Create Recommendation Slide (document)

### Day 2: Negotiation + At-Risk Start (2 hours)
5. ✅ **30 min**: Negotiation Guide Slide (document)
6. ⚠️ **45 min**: Identify Concerns Slide (document with buttons)
7. ⚠️ **45 min**: Prepare Freebie Slide (document with buttons)

### Day 3: Complete At-Risk (1.5 hours)
8. ✅ **30 min**: Deliver Freebie Slide (document)
9. ⚠️ **45 min**: Measure Freebie Impact Slide (document with buttons)
10. ✅ **15 min**: Register all slides in index.ts

### Day 4: Test & Refine (1 hour)
- Update workflow definitions with new slide sequences
- Test workflows end-to-end
- Fix any issues

## File Structure (Actual)

```
src/lib/workflows/slides/
├── inhersight/
│   ├── reviewBrandPerformanceSlide.ts      (NEW - uses BrandExposureReport)
│   ├── prepareFreebieSlide.ts              (NEW - document)
│   ├── deliverFreebieSlide.ts              (NEW - document)
│   └── measureFreebieImpactSlide.ts        (NEW - document)
├── renewal/
│   ├── identifyOpportunitiesSlide.ts       (NEW - uses PricingAnalysis)
│   ├── prepareMeetingDeckSlide.ts          (NEW - document, simple version)
│   ├── meetingDebriefSlide.ts              (NEW - document)
│   ├── createRecommendationSlide.ts        (NEW - document)
│   └── negotiationGuideSlide.ts            (NEW - document)
└── risk/
    └── identifyConcernsSlide.ts            (NEW - document with buttons)
```

**Total New Files**: 10 slides (all using existing artifact templates!)

## Simplified Slide Template

Since most slides just use `createDocumentArtifact`, here's the pattern:

```typescript
/**
 * [Slide Name] Slide
 * Uses: createDocumentArtifact (generic document)
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const [slideName]Slide: UniversalSlideBuilder = (context) => ({
  id: '[slide-id]',
  version: 2,
  name: '[Slide Name]',
  category: 'renewal', // or 'risk'

  structure: {
    id: '[slide-id]',
    title: '[Slide Title]',
    description: '[Brief description]',
    label: '[Short label]',

    chat: {
      initialMessage: {
        text: context?.variables?.message || "Default message...",
        buttons: [
          { label: 'Continue', value: 'continue' },
        ],
      },
      branches: {
        continue: {
          response: 'Great! Moving forward...',
          actions: ['nextSlide'],
        },
      },
    },

    artifacts: {
      sections: [
        {
          id: '[artifact-id]',
          type: 'document',
          title: '[Artifact Title]',
          content: `# {{customer.name}} - [Document Name]

Document content with {{variables}}
          `,
          editable: true,
          visible: true,
        },
      ],
    },
  },
});
```

## Artifact Type Decision Matrix

| Artifact | Static Config Type | Actual Type to Use | Why |
|----------|-------------------|-------------------|-----|
| Planning Checklist | planning-checklist | **greeting slide flag** | Already exists! |
| Brand Exposure Report | document | **BrandExposureReport** | Already exists! |
| Contract Review | contract | **Contract** | Already exists! |
| Opportunity Analysis | pricing | **PricingAnalysis** | Already exists! |
| Meeting Deck | document | **document** | Simple for now, enhance later |
| Meeting Email | email | **Email** | Already exists! |
| Meeting Notes | document | **document** | Generic document |
| Concern Analysis | document | **document** | Generic document |
| Freebie Strategy | document | **document** | Generic document |
| Freebie Tracker | document | **document** | Generic document |
| Freebie Results | document | **document** | Generic document |
| Recommendation | document | **document** | Generic document |
| Follow-up Email | email | **Email** | Already exists! |
| Negotiation Guide | document | **document** | Generic document |
| Summary | workflow-summary | **WorkflowSummary** | Already exists! |

**Key Insight**: 10 out of 15 artifacts are just generic documents with different content templates!

## Success Criteria (Realistic)

Implementation is complete when:

1. ✅ 10 new slide files created
2. ✅ All slides registered in SLIDE_LIBRARY
3. ✅ Workflow definitions updated with full sequences
4. ✅ Can launch workflows from customer view
5. ✅ All artifacts render (even if simple documents)
6. ✅ Basic branching works (buttons trigger next slides)
7. ✅ Customer data hydrates into templates

**NOT Required Initially**:
- ❌ Perfect branching logic (can enhance incrementally)
- ❌ Complex meeting deck visualization (use simple doc first)
- ❌ Rich freebie strategy component (use simple doc first)

## Next Steps

1. **Start here**: `reviewBrandPerformanceSlide.ts` - Uses existing BrandExposureReport artifact
2. **Then**: Work through Day 1 list (all use existing artifacts!)
3. **Finally**: Register in index.ts and update database sequences

---

**The big realization**: We're not building new artifact TYPES, we're just building SLIDES that use existing artifact templates. This is much simpler than the original plan suggested!
