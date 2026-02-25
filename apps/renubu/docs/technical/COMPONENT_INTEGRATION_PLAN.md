# Component Integration Plan

## Overview

This document outlines the integration strategy for the new atomic and composite components into the existing workflow system.

## Current State

### Committed Components

**Atomic Components** (`src/components/workflows/library/atomic/`):
- `MetricDisplay` - KPIs, health scores, ARR metrics
- `ScenarioCard` - Pricing scenarios with pros/cons
- `DataCard` - Key-value pairs for contextual data
- `AlertBox` - Alerts, warnings, success messages
- `FormField` - Universal form input handling

**Composite Components** (`src/components/workflows/library/composite/`):
- `HealthDashboard` - Customer health overview with risk factors
- `PricingRecommendation` - 3-scenario pricing display with factor breakdown

**Backend Services**:
- `PricingOptimizationService` - TypeScript wrapper for pricing engine
- API endpoints: `/api/workflows/pricing/recommend`, `/api/workflows/pricing/outcome`
- PostgreSQL functions in `supabase/migrations/20250128000001_pricing_optimization_engine.sql`

### Existing Workflow System

The Phase 3 Modular Slide Library uses:
- `SlideDefinitionV2` format with template-based chat and artifact configurations
- `ComponentRegistry` for artifact component resolution
- `artifactComponents.ts` for registering components

---

## Integration Steps

### Step 1: Register Composite Components in Artifact Registry

**File**: `src/lib/workflows/components/artifactComponents.ts`

```typescript
// Add imports
import { HealthDashboard } from '@/components/workflows/library/composite/HealthDashboard';
import { PricingRecommendation } from '@/components/workflows/library/composite/PricingRecommendation';

// Add to artifactComponents
export const artifactComponents = {
  // ... existing components

  'artifact.health-dashboard': {
    component: HealthDashboard,
    displayName: 'Health Dashboard',
    description: 'Customer health overview with metrics and risk factors',
  },
  'artifact.pricing-recommendation': {
    component: PricingRecommendation,
    displayName: 'Pricing Recommendation',
    description: 'AI-powered pricing recommendation with 3 scenarios',
  },
};
```

### Step 2: Create a Pricing Recommendation Slide

**File**: `src/lib/workflows/slides/renewal/pricingRecommendationSlide.ts`

This slide will:
1. Call the pricing API to get recommendation
2. Display the `PricingRecommendation` component as an artifact
3. Allow CSM to select a scenario
4. Store the selection in workflow context

```typescript
import type { SlideBuilderV2, SlideDefinitionV2, SlideContext } from '../baseSlide';

export const pricingRecommendationSlide: SlideBuilderV2 = (context?: SlideContext): SlideDefinitionV2 => {
  return {
    id: 'pricing-recommendation',
    title: 'AI Pricing Recommendation',
    description: 'Review AI-generated pricing scenarios',
    label: 'AI Pricing',
    stepMapping: 'pricing-recommendation',
    category: 'renewal',
    estimatedMinutes: 5,
    checklistTitle: 'Review AI pricing recommendation',
    requiredFields: ['customer.id', 'pricing.currentARR'],

    chat: {
      initialMessage: {
        text: 'I\'ve analyzed {{customer.name}}\'s data and generated pricing recommendations. Review the three scenarios below and select the approach that best fits your strategy.',
        buttons: [
          { label: 'Use Conservative', value: 'select-conservative' },
          { label: 'Use Recommended', value: 'select-recommended' },
          { label: 'Use Aggressive', value: 'select-aggressive' },
        ],
        nextBranches: {
          'select-conservative': 'conservative',
          'select-recommended': 'recommended',
          'select-aggressive': 'aggressive',
        },
      },
      branches: {
        'conservative': {
          response: 'Good choice for risk-sensitive situations. I\'ll use the conservative scenario.',
          storeAs: 'pricing.selectedScenario',
          storeValue: 'Conservative',
          actions: ['nextSlide'],
        },
        'recommended': {
          response: 'The balanced approach. I\'ll use the recommended scenario.',
          storeAs: 'pricing.selectedScenario',
          storeValue: 'Recommended',
          actions: ['nextSlide'],
        },
        'aggressive': {
          response: 'Maximizing value capture. I\'ll use the aggressive scenario.',
          storeAs: 'pricing.selectedScenario',
          storeValue: 'Aggressive',
          actions: ['nextSlide'],
        },
      },
    },

    artifacts: {
      sections: [
        {
          id: 'pricing-recommendation',
          type: 'component',
          componentRef: 'artifact.pricing-recommendation',
          title: 'Pricing Recommendation',
          visible: true,
          props: {
            recommendation: '{{pricing.recommendation}}',
            currentARR: '{{pricing.currentARR}}',
            customerName: '{{customer.name}}',
            showFactors: true,
            showDataQuality: true,
          },
        },
      ],
    },
  };
};
```

### Step 3: Create a Health Dashboard Slide

**File**: `src/lib/workflows/slides/renewal/healthDashboardSlide.ts`

```typescript
import type { SlideBuilderV2, SlideDefinitionV2, SlideContext } from '../baseSlide';

export const healthDashboardSlide: SlideBuilderV2 = (context?: SlideContext): SlideDefinitionV2 => {
  return {
    id: 'health-dashboard',
    title: 'Customer Health',
    description: 'Review customer health metrics',
    label: 'Health',
    stepMapping: 'health-dashboard',
    category: 'renewal',
    estimatedMinutes: 2,
    checklistTitle: 'Review customer health metrics',
    requiredFields: ['customer.name', 'health.overallScore'],

    chat: {
      initialMessage: {
        text: 'Here\'s the health dashboard for {{customer.name}}. Overall health score is {{health.overallScore}}/100.',
        buttons: [
          { label: 'Continue', value: 'continue' },
          { label: 'Flag Concerns', value: 'flag' },
        ],
        nextBranches: {
          'continue': 'continue',
          'flag': 'flag',
        },
      },
      branches: {
        'continue': {
          response: 'Great, moving to the next step.',
          actions: ['nextSlide'],
        },
        'flag': {
          response: 'What concerns do you want to note?',
          nextBranchOnText: 'store-concerns',
        },
        'store-concerns': {
          response: 'I\'ve noted your concerns. Moving forward.',
          storeAs: 'health.concerns',
          actions: ['nextSlide'],
        },
      },
    },

    artifacts: {
      sections: [
        {
          id: 'health-dashboard',
          type: 'component',
          componentRef: 'artifact.health-dashboard',
          title: 'Health Dashboard',
          visible: true,
          props: {
            customerName: '{{customer.name}}',
            overallHealth: '{{health.overallScore}}',
            metrics: '{{health.metrics}}',
            riskFactors: '{{health.riskFactors}}',
            usage: '{{health.usage}}',
          },
        },
      ],
    },
  };
};
```

### Step 4: Add Data Fetching to Workflow Context

The pricing recommendation requires an API call. This should happen in the workflow orchestrator or a data fetcher:

**Option A**: Pre-fetch in `dataFetcher.ts`
```typescript
// In dataFetcher.ts, add pricing recommendation fetch
if (workflowType === 'renewal' || workflowType === 'pricing') {
  const pricingResponse = await fetch('/api/workflows/pricing/recommend', {
    method: 'POST',
    body: JSON.stringify({ customerId: context.customer.id }),
  });
  context.pricing.recommendation = await pricingResponse.json();
}
```

**Option B**: Lazy fetch in slide action
```typescript
// In slide definition, add an onEnter action
onEnter: ['fetchPricingRecommendation'],
```

### Step 5: Update Slide Index

**File**: `src/lib/workflows/slides/index.ts`

```typescript
// Add exports
export { pricingRecommendationSlide } from './renewal/pricingRecommendationSlide';
export { healthDashboardSlide } from './renewal/healthDashboardSlide';
```

### Step 6: Register in Database

Add new slide definitions to the `workflow_slide_library` table:

```sql
INSERT INTO workflow_slide_library (slug, name, category, description, definition)
VALUES
  ('pricing-recommendation', 'AI Pricing Recommendation', 'renewal',
   'AI-powered pricing recommendation with 3 scenarios',
   '{"builder": "pricingRecommendationSlide", "version": "v2"}'::jsonb),
  ('health-dashboard', 'Customer Health Dashboard', 'renewal',
   'Customer health overview with metrics and risk factors',
   '{"builder": "healthDashboardSlide", "version": "v2"}'::jsonb);
```

---

## Migration Checklist

- [ ] Register `HealthDashboard` in `artifactComponents.ts`
- [ ] Register `PricingRecommendation` in `artifactComponents.ts`
- [ ] Create `pricingRecommendationSlide.ts`
- [ ] Create `healthDashboardSlide.ts`
- [ ] Export slides in `slides/index.ts`
- [ ] Add data fetching for pricing recommendation
- [ ] Run pricing engine migration on staging database
- [ ] Insert slide definitions into `workflow_slide_library`
- [ ] Test with a renewal workflow
- [ ] Update any existing workflows to use new slides

---

## Database Migration

The pricing engine SQL migration needs to be applied:

```bash
# On staging
npx supabase db push

# Or manually run the migration
psql $DATABASE_URL < supabase/migrations/20250128000001_pricing_optimization_engine.sql
```

---

## Testing Plan

1. **Unit Tests**: Test each component renders correctly with mock data
2. **Integration Tests**: Test slide renders in workflow context
3. **API Tests**: Test pricing endpoint returns valid recommendations
4. **E2E Tests**: Test full workflow with pricing recommendation selection

---

## Notes

- The atomic components are designed for reuse across multiple composite components
- The `PricingRecommendation` component expects data from `PricingOptimizationService`
- The pricing engine requires customer data in the database (feature_adoption, integration_count, etc.)
- Target acceptance rate: >70% for pricing recommendations
