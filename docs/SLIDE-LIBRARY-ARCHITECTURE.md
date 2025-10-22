# Slide Library Architecture

## Overview

The workflow system uses a **Slide Library + Composition** architecture that decouples reusable slides from workflow-specific logic.

## Core Concept

**Slides are building blocks. Workflows are compositions.**

- ✅ A "Prepare Quote" slide can be reused in Renewal, Expansion, AND Risk workflows
- ✅ Same slide, different context = different behavior
- ✅ workflow_type (risk/opportunity/strategic/renewal) is for **scoring**, not structure
- ✅ No code changes needed to create new workflows—just compose existing slides

---

## Architecture

### 1. Slide Library (`src/lib/workflows/slides/`)

**Categories:**
- `common/` - Used across all workflows (greeting, review-account, etc.)
- `action/` - Reusable actions (prepare-quote, draft-email, schedule-call, etc.)
- `risk/` - Risk-specific slides
- `opportunity/` - Opportunity-specific slides
- `strategic/` - Strategic-specific slides
- `renewal/` - Renewal-specific slides

**Each slide is a builder function:**
```typescript
export const prepareQuoteSlide: SlideBuilder = (context?) => {
  // Context customizes behavior
  const quoteType = context?.purpose; // 'renewal', 'expansion', 'retention'

  return {
    id: 'prepare-quote',
    structure: { /* slide content */ }
  };
};
```

### 2. Workflow Compositions (`src/lib/workflows/compositions/`)

**Workflows = Slide Sequence + Contexts**

```typescript
export const standardRenewalComposition: WorkflowComposition = {
  id: 'standard-renewal',
  category: 'renewal', // For scoring only!

  // Sequence of slide IDs
  slideSequence: [
    'greeting',
    'review-contract-terms',
    'review-account',
    'prepare-quote', // ← Reused from other workflows!
    'draft-email',
    'workflow-summary'
  ],

  // Context for each slide
  slideContexts: {
    'prepare-quote': {
      purpose: 'renewal', // vs 'expansion' or 'retention'
      variables: {
        quote_type: 'renewal',
        allow_editing: true
      }
    }
  }
};
```

### 3. Database Schema

**workflow_definitions table:**
```sql
CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY,
  name TEXT, -- "Standard Renewal"
  workflow_type TEXT, -- 'renewal' (for scoring)
  template_file_id TEXT, -- 'standard-renewal' (references composition)

  -- NEW COLUMNS:
  slide_sequence TEXT[], -- ['greeting', 'review-account', ...]
  slide_contexts JSONB,  -- {greeting: {purpose: '...'}, ...}

  trigger_conditions JSONB,
  priority_weight INTEGER
);
```

---

## Example: Quote Slide Reuse

### Same Slide, 3 Different Workflows:

**1. Renewal Workflow uses prepare-quote:**
```typescript
slideContexts: {
  'prepare-quote': {
    purpose: 'renewal',
    variables: { quote_type: 'renewal' }
  }
}
```
Result: "I've prepared a **renewal quote** for {{customer}}..."

**2. Expansion Workflow uses prepare-quote:**
```typescript
slideContexts: {
  'prepare-quote': {
    purpose: 'expansion',
    variables: { quote_type: 'expansion' }
  }
}
```
Result: "Here's an **expansion quote** for {{customer}}..."

**3. Risk Workflow uses prepare-quote:**
```typescript
slideContexts: {
  'prepare-quote': {
    purpose: 'retention',
    variables: { quote_type: 'retention_offer', include_discount: true }
  }
}
```
Result: "I've drafted a **retention offer** for {{customer}}..."

### Code Reuse:
- ✅ 1 slide implementation
- ✅ 3+ workflow uses
- ✅ Different behavior via context
- ✅ No code duplication

---

## Benefits

### 1. DRY (Don't Repeat Yourself)
- Common slides (greeting, account review, summary) written once
- Action slides (quote, email, call) written once, reused everywhere
- Bug fixes/improvements apply to all workflows automatically

### 2. Flexibility
- Easy to create new workflows by mixing existing slides
- Easy to A/B test different slide orderings
- Easy to add workflow variants (e.g., "Quick Renewal" vs "Strategic Renewal")

### 3. Database-Driven
- No code deployment needed for new workflows
- Just add a row to `workflow_definitions` with slide_sequence
- Non-engineers can create workflows via admin UI

### 4. Maintainability
- Each slide is independently testable
- Clear separation of concerns
- Easy to understand what each slide does

---

## Workflow Creation Process

### Option A: Code-Based (for complex workflows)
```typescript
// 1. Create composition file
export const myNewWorkflow: WorkflowComposition = {
  id: 'my-new-workflow',
  category: 'risk',
  slideSequence: ['greeting', 'custom-slide', 'prepare-quote', 'summary'],
  slideContexts: { /* ... */ }
};

// 2. Register in database
INSERT INTO workflow_definitions (template_file_id, slide_sequence, slide_contexts)
VALUES ('my-new-workflow', ARRAY['greeting', ...], '{"greeting": {...}}');
```

### Option B: Database-Only (for simple variations)
```sql
-- No code needed! Just insert database row:
INSERT INTO workflow_definitions (
  name,
  workflow_type,
  slide_sequence,
  slide_contexts
) VALUES (
  'Quick Renewal',
  'renewal',
  ARRAY['greeting', 'review-account', 'prepare-quote', 'summary'],
  '{"greeting": {"purpose": "renewal_preparation", "urgency": "medium"}}'::jsonb
);
```

---

## Implementation Status

### ✅ Completed:
- Base slide architecture (`baseSlide.ts`)
- Slide library registry (`slides/index.ts`)
- 3 common slides:
  - `greeting` - Universal workflow intro
  - `review-account` - Account health review
  - `prepare-quote` - Quote generation
- 2 composition examples:
  - `executiveContactLostComposition` - Risk workflow
  - `standardRenewalComposition` - Renewal workflow

### 🚧 In Progress:
- Additional common slides (email, call, summary)
- Category-specific slides (risk, opportunity, strategic, renewal)

### 📋 TODO:
- Workflow composer (turns composition → WorkflowConfig)
- Data hydrator (fills placeholders with customer data)
- Database schema updates (add slide_sequence, slide_contexts columns)
- Admin UI for creating workflows from existing slides

---

## Next Steps

1. ✅ **Phase 1.1 Complete**: Base architecture created
2. **Phase 1.2 (Current)**: Create remaining common slides
   - draft-email
   - schedule-call
   - workflow-summary
   - update-crm
3. **Phase 1.3**: Create category-specific slides
4. **Phase 1.4**: Build workflow composer
5. **Phase 2**: Build template hydrator
6. **Phase 3**: Database migrations
7. **Phase 4**: Multi-workflow queue
8. **Phase 5**: Testing & docs

---

## Key Files

```
src/lib/workflows/
├── slides/
│   ├── baseSlide.ts              ← Core types & utilities
│   ├── index.ts                  ← Slide library registry
│   ├── common/
│   │   ├── greetingSlide.ts      ← Universal greeting
│   │   └── reviewAccountSlide.ts ← Account health review
│   ├── action/
│   │   ├── prepareQuoteSlide.ts  ← Quote generation
│   │   ├── draftEmailSlide.ts    ← (TODO)
│   │   └── scheduleCallSlide.ts  ← (TODO)
│   ├── risk/
│   │   └── (TODO)
│   ├── opportunity/
│   │   └── (TODO)
│   └── renewal/
│       └── (TODO)
└── compositions/
    ├── executiveContactLostComposition.ts   ← Example: Risk workflow
    └── standardRenewalComposition.ts        ← Example: Renewal workflow
```

---

## Questions?

- **Q: Can I still create workflow-specific slides?**
  - A: Yes! Put them in the appropriate category folder (`risk/`, `opportunity/`, etc.)

- **Q: How do I know which slides to reuse vs create new?**
  - A: If 2+ workflows need similar functionality, make it reusable. If it's truly unique, create a specific slide.

- **Q: Can I have different slide orderings for the same workflow type?**
  - A: Yes! Create multiple compositions with different slide_sequences. They can share the same `workflow_type` for scoring.

- **Q: How do I handle workflow variants (Quick vs Deep)?**
  - A: Different slide_sequences. "Quick Renewal" might be 4 slides, "Strategic Renewal" might be 8 slides.
