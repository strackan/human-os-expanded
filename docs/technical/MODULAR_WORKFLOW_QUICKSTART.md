# Modular Workflow System - Quick Start Guide

## Overview

The modular workflow system allows you to create workflows by composing reusable patterns and stages instead of writing monolithic configuration files.

## Quick Example

### Before (Monolithic - 1,249 lines)
```typescript
export const dynamicChatSlides: WorkflowSlide[] = [
  {
    id: 'initial-contact',
    slideNumber: 1,
    // ... 600 lines of config
    artifacts: {
      sections: [
        {
          id: 'pricing-analysis',
          title: 'Pricing Analysis',
          // ... 80 lines of pricing config
        },
        {
          id: 'contract-review',
          // ... 45 lines of contract config
        },
        // ... more hardcoded artifacts
      ]
    }
  },
  // ... more slides
];
```

### After (Modular - ~150 lines)
```typescript
import { WorkflowComposition } from '@/workflows/types';

export const renewalComposition: WorkflowComposition = {
  customer: { name: 'Dynamic Corp' },
  slides: [
    {
      id: 'initial-contact',
      slideNumber: 1,
      title: 'Renewals',
      artifactStages: [
        { id: 'pricingAnalysis' },    // Reusable!
        { id: 'contractReview' },     // Reusable!
        { id: 'emailComposer' },      // Reusable!
      ],
      chat: { /* chat config */ }
    }
  ]
};

// Build it
const builder = new WorkflowBuilder();
const slides = builder.build(renewalComposition);
```

---

## Available Reusable Stages

### 1. Pricing Analysis
```typescript
{
  id: 'pricingAnalysis',
  config: {
    customerName: 'Acme Corp',
    currentPrice: 500000,
    pricePerUnit: 5.00,
    // ... see pricingAnalysis.stage.ts for full config
  }
}
```

**Use Cases:** Renewals, upsells, pricing reviews

### 2. Contract Review
```typescript
{
  id: 'contractReview',
  config: {
    contractId: 'ACME-2024-001',
    customerName: 'Acme Corp',
    contractValue: 500000,
    // ... see contractReview.stage.ts for full config
  }
}
```

**Use Cases:** Renewals, contract negotiations, legal reviews

### 3. Email Composer
```typescript
{
  id: 'emailComposer',
  config: {
    to: 'customer@example.com',
    subject: 'Your Custom Subject',
    body: 'Email body with {{variables}}',
  }
}
```

**Use Cases:** Any workflow needing email drafting

### 4. Workflow Summary
```typescript
{
  id: 'workflowSummary',
  config: {
    customerName: 'Acme Corp',
    completedActions: ['Action 1', 'Action 2'],
    nextSteps: ['Step 1', 'Step 2'],
    // ... see workflowSummary.stage.ts for full config
  }
}
```

**Use Cases:** Any workflow completion/summary

### 5. Planning Checklist
```typescript
{
  id: 'planningChecklist',
  config: {
    description: 'Checklist for...',
    items: [
      { id: 'step-1', label: 'First step', completed: false },
      { id: 'step-2', label: 'Second step', completed: false },
    ]
  }
}
```

**Use Cases:** Multi-step workflows, onboarding, planning

---

## Creating a New Workflow

### Step 1: Define Your Composition

```typescript
// src/workflows/templates/onboarding/index.ts
import { WorkflowComposition } from '@/workflows/types';

export const onboardingComposition: WorkflowComposition = {
  customer: {
    name: 'New Customer'
  },
  slides: [
    {
      id: 'welcome',
      slideNumber: 1,
      title: 'Welcome',
      description: 'Welcome new customer',
      label: 'Welcome',
      stepMapping: 'welcome',

      // Reference reusable stages
      artifactStages: [
        { id: 'planningChecklist' },
        { id: 'emailComposer', config: {
          subject: 'Welcome to our platform!',
          // Override specific fields
        }}
      ],

      // Define chat flow
      chat: {
        initialMessage: {
          text: "Welcome! Let's get you started.",
          buttons: [
            { label: 'Begin', value: 'begin' }
          ]
        },
        branches: {
          'begin': {
            response: "Great! Here's your onboarding checklist.",
            actions: ['showArtifact'],
            artifactId: 'planning-checklist-renewal'
          }
        }
      }
    }
  ]
};
```

### Step 2: Build the Workflow

```typescript
import { WorkflowBuilder } from '@/workflows/composers/WorkflowBuilder';
import { onboardingComposition } from '@/workflows/templates/onboarding';

const builder = new WorkflowBuilder();

// Validate first (optional but recommended)
const validation = builder.validate(onboardingComposition);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}

// Build the workflow
const onboardingSlides = builder.build(onboardingComposition);

// Use in your WorkflowConfig
export const onboardingWorkflow: WorkflowConfig = {
  customer: { name: 'New Customer' },
  slides: onboardingSlides,
  // ... rest of config
};
```

### Step 3: Integrate with Feature Flag (Optional)

```typescript
import { FEATURE_FLAGS } from '@/lib/constants/feature-flags';

function getOnboardingSlides(): WorkflowSlide[] {
  if (FEATURE_FLAGS.USE_MODULAR_WORKFLOW_CONFIGS) {
    const builder = new WorkflowBuilder();
    return builder.build(onboardingComposition);
  }
  return legacyOnboardingSlides;
}
```

---

## Creating Custom Stages

### Step 1: Define the Stage

```typescript
// src/workflows/stages/custom/myCustomStage.stage.ts

export interface MyCustomStageConfig {
  title: string;
  data: any;
}

export function createMyCustomStage(config: MyCustomStageConfig) {
  return {
    id: 'my-custom-stage',
    title: config.title,
    type: 'custom' as const,
    visible: false,
    content: config.data
  };
}

export const defaultMyCustomConfig: MyCustomStageConfig = {
  title: 'Default Title',
  data: { /* default data */ }
};
```

### Step 2: Register in StageComposer

```typescript
// src/workflows/composers/StageComposer.ts

import { createMyCustomStage, defaultMyCustomConfig } from '../stages/custom/myCustomStage.stage';

const stageRegistry = {
  // ... existing stages
  'myCustom': {
    factory: createMyCustomStage,
    defaultConfig: defaultMyCustomConfig
  }
};
```

### Step 3: Use in Workflow

```typescript
{
  artifactStages: [
    { id: 'myCustom', config: { title: 'Custom Title' } }
  ]
}
```

---

## Best Practices

### 1. Always Use Default Configs
```typescript
// ✅ Good
export const defaultPricingConfig: PricingAnalysisConfig = {
  customerName: 'Default Customer',
  currentPrice: 0,
  // ... all required fields
};

// ❌ Bad - no defaults
export function createPricingStage(config: PricingAnalysisConfig) {
  // If config is partial, this will break
}
```

### 2. Validate Before Building
```typescript
// ✅ Good
const validation = builder.validate(composition);
if (!validation.valid) {
  throw new Error(`Invalid composition: ${validation.errors.join(', ')}`);
}
const slides = builder.build(composition);

// ❌ Bad - no validation
const slides = builder.build(composition); // Might fail at runtime
```

### 3. Use Config Overrides Sparingly
```typescript
// ✅ Good - override only what's needed
{
  id: 'emailComposer',
  config: {
    subject: 'Custom Subject'  // Just override subject
  }
}

// ❌ Bad - duplicating entire config
{
  id: 'emailComposer',
  config: {
    to: 'default@example.com',
    subject: 'Custom Subject',
    body: 'Default body',
    editable: true
    // Why duplicate all this?
  }
}
```

### 4. Keep Chat Flows in Templates
```typescript
// ✅ Good - chat flow defined in template
export const mySlide: SlideTemplate = {
  id: 'my-slide',
  chat: {
    initialMessage: { /* ... */ },
    branches: { /* ... */ }
  }
};

// ❌ Bad - trying to extract chat flow patterns
// (Chat flows are usually workflow-specific, not reusable)
```

---

## Troubleshooting

### Build Fails with Module Not Found

**Problem:** Modular imports fail when feature flag is false

**Solution:** Use lazy loading
```typescript
if (FEATURE_FLAGS.USE_MODULAR_WORKFLOW_CONFIGS) {
  const { WorkflowBuilder } = require('@/workflows/composers/WorkflowBuilder');
  // This only runs when flag is true
}
```

### Stage Not Found Error

**Problem:** `Stage 'myStage' not found in registry`

**Solution:** Ensure stage is registered in `StageComposer.ts`
```typescript
const stageRegistry = {
  'myStage': {
    factory: createMyStage,
    defaultConfig: defaultMyStageConfig
  }
};
```

### Config Validation Fails

**Problem:** `builder.validate()` returns errors

**Solution:** Check error messages
```typescript
const validation = builder.validate(composition);
if (!validation.valid) {
  console.log('Validation errors:', validation.errors);
  // Fix the errors in your composition
}
```

---

## Reference

### File Locations
- **Patterns:** `src/workflows/patterns/`
- **Stages:** `src/workflows/stages/`
- **Composers:** `src/workflows/composers/`
- **Templates:** `src/workflows/templates/`
- **Types:** `src/workflows/types.ts`

### Key Classes
- `WorkflowBuilder` - Main orchestrator
- `StageComposer` - Resolves stage references
- `SlideComposer` - Builds complete slides

### Key Types
- `WorkflowComposition` - Full workflow definition
- `SlideTemplate` - Single slide definition
- `StageReference` - Reference to a stage

---

## Examples

See these files for complete examples:
- Renewal Workflow: `src/workflows/templates/renewal/`
- Pricing Stage: `src/workflows/stages/pricing/pricingAnalysis.stage.ts`
- Email Stage: `src/workflows/stages/email/emailComposer.stage.ts`

---

**Ready to build modular workflows!** 🚀
