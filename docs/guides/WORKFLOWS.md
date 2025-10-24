# Workflow System Guide

**Last Updated:** 2025-10-23
**Feature:** Database-driven workflow creation
**Phase:** 3 (Current)

> **Note:** For architecture details, see [Architecture Guide](../technical/ARCHITECTURE.md).
> For database schema, see [Database Reference](../technical/DATABASE.md#workflow-definitions).

---

## Recent Changes
- **2025-10-23:** Initial guide creation
- **2025-10-15:** Phase 3 database-driven workflows launched

---

## Overview

Workflows are stored in the `workflow_definitions` table and composed at runtime using the slide library.

**Benefits:**
- No code deploys for new workflows
- Multi-tenant support
- A/B testing enabled
- Template-based customization

---

## Creating a Workflow

### Step 1: Define Workflow

```sql
INSERT INTO workflow_definitions (
  workflow_id,
  name,
  workflow_type,
  description,
  slide_sequence,
  slide_contexts,
  is_stock_workflow
) VALUES (
  'my-new-workflow',
  'My New Workflow',
  'renewal',
  'Description of what this workflow does',
  ARRAY['intro-slide', 'account-overview', 'summary-slide'],
  '{
    "pricing-strategy": {
      "variables": {
        "recommendationText": "We recommend...",
        "buttons": [
          {"id": "accept", "label": "Accept"}
        ]
      }
    }
  }'::jsonb,
  true
);
```

### Step 2: Use in Code

```typescript
const config = await composeFromDatabase(
  'my-new-workflow',
  null, // company_id
  {
    customer: { name: 'Acme Corp', ... },
    pricing: { currentARR: 250000, ... }
  }
);
```

---

## Available Slides

See `src/lib/workflows/slides/` for all available slides.

**Common Slides:**
- `intro-slide` - Introduction
- `account-overview` - Customer metrics
- `pricing-strategy` - Pricing analysis
- `prepare-quote` - Quote builder
- `email-draft` - Email composer
- `summary-slide` - Completion summary

---

## Customization

### Slide Contexts

Customize individual slides using `slide_contexts`:

```json
{
  "slide_contexts": {
    "pricing-strategy": {
      "variables": {
        "recommendationText": "Custom message",
        "defaultIncrease": 10,
        "buttons": [...]
      }
    }
  }
}
```

### Template Variables

Use placeholders that get filled at runtime:

```
"Good {{timeOfDay}}, {{userName}}. {{customerName}}'s renewal..."
```

---

## Multi-Tenant

**Stock Workflows:** `company_id = NULL`
**Custom Workflows:** `company_id = 'company-uuid'`

System prioritizes company-specific over stock.

---

## Related Documentation

- [Architecture Guide](../technical/ARCHITECTURE.md#database-driven-workflows)
- [Database Reference](../technical/DATABASE.md#workflow-definitions)
- [System Overview](../product/SYSTEM-OVERVIEW.md)

