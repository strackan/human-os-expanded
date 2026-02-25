# Database Schema Reference for Config Builder

## Overview
This document outlines all database tables and fields available for dynamic workflow config generation.

## Core Tables

### 1. `customers` Table
**Purpose:** Core customer information

| Field | Type | Description | Config Usage |
|-------|------|-------------|--------------|
| `id` | UUID | Primary key | Customer identification |
| `name` | TEXT | Customer company name | NOT NULL - used as `{{CUSTOMER_NAME}}` |
| `domain` | TEXT | Company domain (e.g., "acme.com") | Used as display name |
| `industry` | TEXT | Industry classification | Context for AI, filtering |
| `health_score` | INTEGER | Overall health (0-100) | Status indicators, risk assessment |
| `current_arr` | DECIMAL(12,2) | Annual Recurring Revenue | Pricing, metrics, quotes |
| `renewal_date` | DATE | Next renewal date | Urgency, timeline calculations |
| `assigned_to` | UUID | CSM user ID | Workflow assignment |
| `company_id` | UUID | Multi-tenant company | Tenant isolation |
| `created_at` | TIMESTAMPTZ | Creation timestamp | N/A |
| `updated_at` | TIMESTAMPTZ | Last update | N/A |

**Required Fields for Config Builder:**
- `name` or `domain` (at least one)
- `current_arr` (for pricing workflows)
- `renewal_date` (for renewal workflows)

---

### 2. `customer_properties` Table
**Purpose:** Extended customer metrics and signals

| Field | Type | Description | Config Usage |
|-------|------|-------------|--------------|
| `id` | UUID | Primary key | N/A |
| `customer_id` | UUID | FK to customers | Join key |
| `usage_score` | INTEGER | Product usage score (0-100) | Opportunity detection, metrics |
| `health_score` | INTEGER | Customer health (0-100) | Risk assessment, status colors |
| `nps_score` | INTEGER | Net Promoter Score | Sentiment, risk |
| `current_arr` | DECIMAL(12,2) | ARR (redundant with customers) | Fallback if customers.current_arr null |
| `revenue_impact_tier` | INTEGER | Revenue tier (1-5) | Priority scoring, segmentation |
| `churn_risk_score` | INTEGER | Churn risk (1-5) | Risk workflows, priority |

**Note:** Many workflow-specific fields (utilization_percent, market_percentile, etc.) are missing from current schema but referenced in configs. See "Missing Fields" section below.

---

### 3. `contacts` Table
**Purpose:** Customer stakeholders and decision-makers

| Field | Type | Description | Config Usage |
|-------|------|-------------|--------------|
| `id` | UUID | Primary key | N/A |
| `first_name` | TEXT | First name | NOT NULL |
| `last_name` | TEXT | Last name | NOT NULL |
| `email` | TEXT | Email address | NOT NULL - used in emails, quotes |
| `phone` | TEXT | Phone number | Contact info |
| `title` | TEXT | Job title (e.g., "VP Engineering") | Personalization, addressing |
| `customer_id` | UUID | FK to customers | Join key |
| `is_primary` | BOOLEAN | Primary contact flag | Filter for main contact |

**Query Pattern:**
```sql
SELECT * FROM contacts
WHERE customer_id = ? AND is_primary = true
LIMIT 1
```

**Fallback:** If no primary contact, use first contact ordered by `created_at`.

---

### 4. `contracts` Table
**Purpose:** Contract terms and pricing history

| Field | Type | Description | Config Usage |
|-------|------|-------------|--------------|
| `id` | UUID | Primary key | N/A |
| `customer_id` | UUID | FK to customers | Join key |
| `contract_number` | TEXT | Contract ID | Reference in documents |
| `start_date` | DATE | Contract start | Timeline context |
| `end_date` | DATE | Contract end | Renewal urgency |
| `arr` | DECIMAL(12,2) | Contract ARR | NOT NULL - pricing analysis |
| `seats` | INTEGER | License seats | Quote line items, pricing |
| `contract_type` | TEXT | Type (subscription, etc.) | Terms generation |
| `status` | TEXT | active/expired/pending | Contract state |
| `auto_renewal` | BOOLEAN | Auto-renew flag | Renewal workflow logic |
| `terms_url` | TEXT | Terms document link | Reference |
| `notes` | TEXT | Additional notes | Context |

**Query Pattern:**
```sql
SELECT * FROM contracts
WHERE customer_id = ? AND status = 'active'
ORDER BY end_date DESC
LIMIT 1
```

---

### 5. `renewals` Table (implied from migration)
**Purpose:** Renewal-specific tracking

Expected fields (not fully defined in migrations):
- `customer_id` (UUID)
- `contract_id` (UUID)
- `renewal_date` (DATE)
- `status` (TEXT)
- `proposed_arr` (DECIMAL)
- etc.

---

### 6. `workflow_definitions` Table
**Purpose:** Workflow type metadata

| Field | Type | Description | Config Usage |
|-------|------|-------------|--------------|
| `id` | UUID | Primary key | N/A |
| `name` | TEXT | Workflow display name | NOT NULL |
| `workflow_type` | TEXT | Type: opportunity/risk/strategic/renewal/custom | Template selection |
| `description` | TEXT | Description | UI display |
| `trigger_conditions` | JSONB | Trigger logic | Signal interpretation |
| `priority_weight` | INTEGER | Base priority (500-900) | Queue sorting |
| `is_active` | BOOLEAN | Enabled flag | Filtering |
| `is_demo` | BOOLEAN | Demo workflow flag | Demo mode |

**Valid workflow_types:**
- `opportunity` (priority: 800)
- `risk` (priority: 900)
- `strategic` (priority: 700)
- `renewal` (priority: 600)
- `custom` (priority: 500)

---

### 7. `workflow_executions` Table
**Purpose:** Workflow instance tracking

| Field | Type | Description | Config Usage |
|-------|------|-------------|--------------|
| `id` | UUID | Primary key | Execution tracking |
| `workflow_definition_id` | UUID | FK to workflow_definitions | Template selection |
| `customer_id` | UUID | FK to customers | Data fetching |
| `assigned_csm_id` | UUID | Assigned CSM | Queue filtering |
| `status` | TEXT | not_started/underway/completed/snoozed/skipped | State management |
| `priority_score` | INTEGER | Calculated priority | Queue sorting |
| `execution_data` | JSONB | Workflow state/progress | Resume capability |
| `snooze_until` | TIMESTAMPTZ | Snooze resume time | Snooze logic |
| `started_at` | TIMESTAMPTZ | Start time | Analytics |
| `completed_at` | TIMESTAMPTZ | Completion time | Analytics |

---

## Missing Fields (Referenced in Existing Configs)

These fields are used in current workflow configs but **not present** in database schema:

### From `customer_properties` (needed):
- `utilization_percent` (INTEGER) - % of license capacity used
- `market_percentile` (INTEGER) - Pricing percentile (1-100)
- `yoy_growth` (DECIMAL) - Year-over-year growth %
- `last_month_growth` (DECIMAL) - Month-over-month growth %
- `adoption_rate` (INTEGER) - Feature adoption %
- `license_count` (INTEGER) - Number of licenses
- `relationship_strength` (TEXT) - strong/medium/weak
- `opportunity_score` (INTEGER) - Expansion opportunity score

### Migration Needed:
```sql
ALTER TABLE public.customer_properties
ADD COLUMN utilization_percent INTEGER,
ADD COLUMN market_percentile INTEGER CHECK (market_percentile BETWEEN 0 AND 100),
ADD COLUMN yoy_growth DECIMAL(5,2),
ADD COLUMN last_month_growth DECIMAL(5,2),
ADD COLUMN adoption_rate INTEGER CHECK (adoption_rate BETWEEN 0 AND 100),
ADD COLUMN license_count INTEGER,
ADD COLUMN relationship_strength TEXT CHECK (relationship_strength IN ('strong', 'medium', 'weak')),
ADD COLUMN opportunity_score INTEGER CHECK (opportunity_score BETWEEN 0 AND 10);
```

---

## Data Fetching Queries

### Full Customer Context (recommended approach):
```sql
SELECT
  c.*,
  cp.*,
  array_agg(DISTINCT jsonb_build_object(
    'id', co.id,
    'name', co.first_name || ' ' || co.last_name,
    'email', co.email,
    'title', co.title,
    'is_primary', co.is_primary
  )) as contacts,
  ct.contract_number,
  ct.arr as contract_arr,
  ct.seats as contract_seats,
  ct.end_date as contract_end_date
FROM customers c
LEFT JOIN customer_properties cp ON c.id = cp.customer_id
LEFT JOIN contacts co ON c.id = co.customer_id
LEFT JOIN contracts ct ON c.id = ct.customer_id AND ct.status = 'active'
WHERE c.id = $1
GROUP BY c.id, cp.id, ct.id;
```

### Performance Consideration:
- Use prepared statements
- Cache for 15 minutes
- Index on `customers.id`, `customer_id` foreign keys

---

## Default Values (when data missing)

| Field | Default |
|-------|---------|
| `customer.name` | `customer.domain` or "Unknown Customer" |
| `current_arr` | 0 |
| `health_score` | 50 |
| `utilization_percent` | NULL (don't show metric if missing) |
| `primary_contact.name` | "Unknown Contact" |
| `primary_contact.email` | "" (empty, user must fill) |
| `contract_seats` | 1 |

---

## Validation Rules

Before building config, validate:
1. ✅ Customer exists
2. ✅ Customer has at least `name` or `domain`
3. ⚠️ Warn if missing `current_arr` (pricing workflows)
4. ⚠️ Warn if missing `renewal_date` (renewal workflows)
5. ⚠️ Warn if no contacts (email workflows)
6. ⚠️ Warn if no `license_count` (quote generation)

---

## Next Steps

1. **Add missing columns** to `customer_properties` via migration
2. **Seed test data** for at least 3 customers with full context
3. **Create type definitions** in `src/lib/types/database.ts`
4. **Build data fetcher** with caching and error handling
