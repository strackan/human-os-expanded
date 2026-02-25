# Database Schema Reference

**Last Updated:** 2025-10-23
**Schema Version:** Phase 3.2
**Database:** Supabase/PostgreSQL

> **Note:** For architecture context, see [Architecture Guide](ARCHITECTURE.md).
> For implementation patterns, see [Guides](../guides/).

---

## Recent Changes
- **2025-10-23:** Initial consolidated version from CONTRACT-TERMS-GUIDE.md
- **2025-10-23:** Added contract_terms table documentation
- **2025-10-22:** Added workflow_step_states and workflow_step_actions tables
- **2025-10-15:** Added workflow_definitions table (Phase 3)

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Workflow Tables](#workflow-tables)
3. [Customer & Contract Tables](#customer--contract-tables)
4. [Common Queries](#common-queries)
5. [Migrations](#migrations)

---

## Quick Reference

### Core Workflow Tables
- **workflow_definitions** - Workflow templates (reusable)
- **workflow_executions** - Workflow runs (individual)
- **workflow_step_states** - Step status (snoozed/skipped)
- **workflow_step_actions** - Audit log (all actions)

### Customer Tables
- **customers** - Customer master data
- **contracts** - Contract lifecycle
- **contract_terms** - Business terms (NEW!)
- **renewals** - Renewal opportunities

### Supporting Tables
- **users** / **profiles** - Authentication
- **tasks** - To-do items
- **events** - Customer timeline
- **notes** - Contextual information

---

## Workflow Tables

### workflow_definitions

Stores reusable workflow templates.

```sql
CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL UNIQUE,     -- 'obsidian-black-renewal'
  name TEXT NOT NULL,                    -- 'Renewal Planning for Obsidian Black'
  workflow_type TEXT NOT NULL,           -- 'renewal', 'expansion', 'risk'
  description TEXT,
  slide_sequence TEXT[] NOT NULL,        -- ['intro', 'account-overview', ...]
  slide_contexts JSONB,                  -- Per-slide configuration
  settings JSONB,
  is_stock_workflow BOOLEAN DEFAULT false,
  company_id UUID,                       -- NULL for stock workflows
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_company FOREIGN KEY (company_id)
    REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_definitions_workflow_id
  ON workflow_definitions(workflow_id);
CREATE INDEX idx_workflow_definitions_company_id
  ON workflow_definitions(company_id);
```

**Example Row:**
```json
{
  "workflow_id": "obsidian-black-renewal",
  "name": "Renewal Planning for Obsidian Black",
  "workflow_type": "renewal",
  "slide_sequence": [
    "intro-slide",
    "account-overview",
    "pricing-strategy",
    "prepare-quote",
    "email-draft",
    "summary-slide"
  ],
  "slide_contexts": {
    "pricing-strategy": {
      "variables": {
        "recommendationText": "We recommend an 8% increase...",
        "buttons": [
          { "id": "accept", "label": "Accept Recommendation" }
        ]
      }
    }
  },
  "is_stock_workflow": true,
  "company_id": null
}
```

**Usage:**
```typescript
const { data } = await supabase
  .from('workflow_definitions')
  .select('*')
  .eq('workflow_id', 'obsidian-black-renewal')
  .is('company_id', null)
  .single();
```

---

### workflow_executions

Tracks individual workflow runs.

```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_config_id TEXT NOT NULL,      -- References workflow_definitions.workflow_id
  workflow_name TEXT NOT NULL,
  workflow_type TEXT NOT NULL,
  customer_id UUID,
  user_id UUID NOT NULL,
  assigned_csm_id UUID,
  status TEXT DEFAULT 'in_progress',     -- 'in_progress', 'completed', 'snoozed', 'skipped'
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  completion_percentage INTEGER DEFAULT 0,
  has_snoozed_steps BOOLEAN DEFAULT false,
  next_due_step_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_customer FOREIGN KEY (customer_id)
    REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_executions_user_id
  ON workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_customer_id
  ON workflow_executions(customer_id);
CREATE INDEX idx_workflow_executions_status
  ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_has_snoozed_steps
  ON workflow_executions(has_snoozed_steps)
  WHERE has_snoozed_steps = true;
```

**Example Row:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "workflow_config_id": "obsidian-black-renewal",
  "workflow_name": "Renewal Planning for Obsidian Black",
  "workflow_type": "renewal",
  "customer_id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "user-uuid",
  "status": "in_progress",
  "current_step": 2,
  "total_steps": 6,
  "completion_percentage": 33,
  "has_snoozed_steps": true,
  "next_due_step_date": "2025-10-25T10:00:00Z",
  "started_at": "2025-10-23T09:00:00Z"
}
```

**Usage:**
```typescript
const { data } = await supabase
  .from('workflow_executions')
  .insert({
    workflow_config_id: 'obsidian-black-renewal',
    workflow_name: 'Renewal Planning for Obsidian Black',
    workflow_type: 'renewal',
    customer_id: customerId,
    user_id: userId,
    total_steps: 6
  })
  .select()
  .single();
```

---

### workflow_step_states

Tracks state of individual steps (NEW! Oct 2025).

```sql
CREATE TABLE workflow_step_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL,
  step_index INTEGER NOT NULL,
  step_id TEXT NOT NULL,
  step_label TEXT NOT NULL,
  status TEXT NOT NULL,                  -- 'snoozed', 'skipped', 'completed'
  snoozed_until TIMESTAMPTZ,
  snooze_count INTEGER DEFAULT 0,
  skip_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_execution FOREIGN KEY (execution_id)
    REFERENCES workflow_executions(id) ON DELETE CASCADE,
  CONSTRAINT unique_execution_step
    UNIQUE(execution_id, step_index)
);

CREATE INDEX idx_workflow_step_states_execution_id
  ON workflow_step_states(execution_id);
CREATE INDEX idx_workflow_step_states_status
  ON workflow_step_states(status);
```

**Example Row:**
```json
{
  "execution_id": "550e8400-e29b-41d4-a716-446655440002",
  "step_index": 2,
  "step_id": "pricing-strategy",
  "step_label": "Pricing Analysis",
  "status": "snoozed",
  "snoozed_until": "2025-10-25T10:00:00Z",
  "snooze_count": 1
}
```

**Usage:**
```typescript
const { data } = await supabase
  .from('workflow_step_states')
  .upsert({
    execution_id: executionId,
    step_index: 2,
    step_id: 'pricing-strategy',
    step_label: 'Pricing Analysis',
    status: 'snoozed',
    snoozed_until: '2025-10-25 10:00:00'
  });
```

---

### workflow_step_actions

Audit log of all step actions (NEW! Oct 2025).

```sql
CREATE TABLE workflow_step_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL,
  step_index INTEGER NOT NULL,
  action_type TEXT NOT NULL,             -- 'snooze', 'skip', 'resume', 'complete'
  reason TEXT,
  performed_by UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_execution FOREIGN KEY (execution_id)
    REFERENCES workflow_executions(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (performed_by)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_step_actions_execution_id
  ON workflow_step_actions(execution_id);
CREATE INDEX idx_workflow_step_actions_action_type
  ON workflow_step_actions(action_type);
```

**Example Row:**
```json
{
  "execution_id": "550e8400-e29b-41d4-a716-446655440002",
  "step_index": 2,
  "action_type": "snooze",
  "reason": "Waiting for finance approval",
  "performed_by": "user-uuid",
  "metadata": {
    "snoozed_until": "2025-10-25T10:00:00Z",
    "selected_duration": "2_days"
  },
  "created_at": "2025-10-23T14:30:00Z"
}
```

**Usage:**
```typescript
const { data } = await supabase
  .from('workflow_step_actions')
  .insert({
    execution_id: executionId,
    step_index: 2,
    action_type: 'snooze',
    reason: 'Waiting for finance approval',
    performed_by: userId,
    metadata: { snoozed_until: snoozeDate }
  });
```

---

## Customer & Contract Tables

### contracts

Basic contract lifecycle data.

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  contract_number TEXT UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  term_months INTEGER GENERATED ALWAYS AS (
    EXTRACT(YEAR FROM AGE(end_date, start_date)) * 12 +
    EXTRACT(MONTH FROM AGE(end_date, start_date))
  ) STORED,                              -- Auto-calculated
  arr DECIMAL(12, 2) NOT NULL,
  seats INTEGER,
  status TEXT DEFAULT 'active',          -- 'draft', 'active', 'expired', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_customer FOREIGN KEY (customer_id)
    REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
```

**Key Features:**
- `term_months` auto-calculated from dates
- Lifecycle tracked via `status`
- Business terms in separate `contract_terms` table

---

### contract_terms

Business and legal terms (NEW! Oct 2025).

**Purpose:** Separate terms (rarely change) from lifecycle events (change frequently).

```sql
CREATE TABLE contract_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL UNIQUE,

  -- Pricing
  pricing_model TEXT,                    -- 'per_seat', 'usage_based', 'custom'
  discount_percent NUMERIC(5, 2),
  volume_discounts JSONB,                -- {tier: discount_percent}
  payment_terms TEXT,                    -- 'net_30', 'net_60'
  invoicing_schedule TEXT,               -- 'monthly', 'quarterly', 'annual'

  -- Renewal
  auto_renewal BOOLEAN DEFAULT true,
  auto_renewal_notice_days INTEGER DEFAULT 60,
  renewal_price_cap_percent NUMERIC(5, 2),

  -- Service
  sla_uptime_percent NUMERIC(5, 2),
  support_tier TEXT,                     -- 'standard', 'premium', 'white_glove'
  response_time_hours INTEGER,
  support_hours TEXT,                    -- '24x7', 'business_hours'
  dedicated_csm BOOLEAN DEFAULT false,

  -- Legal
  liability_cap TEXT,                    -- 'unlimited', '12_months_fees', 'custom'
  liability_cap_amount DECIMAL(12, 2),
  data_residency TEXT[],                 -- ['us', 'eu', 'uk']
  data_retention_days INTEGER,

  -- Features
  included_features TEXT[],
  excluded_features TEXT[],
  usage_limits JSONB,
  overage_pricing JSONB,

  -- Custom
  custom_terms JSONB,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_contract FOREIGN KEY (contract_id)
    REFERENCES contracts(id) ON DELETE CASCADE
);

CREATE INDEX idx_contract_terms_contract_id ON contract_terms(contract_id);
CREATE INDEX idx_contract_terms_pricing_model ON contract_terms(pricing_model);
CREATE INDEX idx_contract_terms_support_tier ON contract_terms(support_tier);
```

**Example Usage:**

See [Contract Terms Guide](../guides/CONTRACT-TERMS.md) for detailed examples.

**Quick Example:**
```typescript
// Create contract
const { data: contract } = await supabase
  .from('contracts')
  .insert({
    customer_id: customerId,
    start_date: '2025-01-01',
    end_date: '2027-01-01',
    arr: 500000,
    seats: 200
  })
  .select()
  .single();

// Add terms
await supabase.from('contract_terms').insert({
  contract_id: contract.id,
  pricing_model: 'custom',
  discount_percent: 20,
  auto_renewal: true,
  auto_renewal_notice_days: 120,
  sla_uptime_percent: 99.99,
  support_tier: 'white_glove',
  liability_cap: 'unlimited',
  data_residency: ['us', 'eu']
});
```

---

## Common Queries

### Find Active Workflow Executions for User

```sql
SELECT
  we.id,
  we.workflow_name,
  we.customer_id,
  c.name as customer_name,
  we.current_step,
  we.total_steps,
  we.has_snoozed_steps,
  we.started_at
FROM workflow_executions we
JOIN customers c ON c.id = we.customer_id
WHERE we.user_id = 'user-uuid'
  AND we.status = 'in_progress'
ORDER BY we.started_at DESC;
```

---

### Find Snoozed Steps Due Today

```sql
SELECT
  wss.execution_id,
  wss.step_index,
  wss.step_label,
  wss.snoozed_until,
  we.workflow_name,
  c.name as customer_name
FROM workflow_step_states wss
JOIN workflow_executions we ON we.id = wss.execution_id
JOIN customers c ON c.id = we.customer_id
WHERE wss.status = 'snoozed'
  AND wss.snoozed_until <= NOW()
  AND we.user_id = 'user-uuid'
ORDER BY wss.snoozed_until;
```

---

### Get Step Action Audit Trail

```sql
SELECT
  wsa.action_type,
  wsa.step_index,
  wsa.reason,
  wsa.created_at,
  p.email as performed_by_email
FROM workflow_step_actions wsa
JOIN profiles p ON p.id = wsa.performed_by
WHERE wsa.execution_id = 'execution-uuid'
ORDER BY wsa.created_at DESC;
```

---

### Find Contracts in Auto-Renewal Window

```sql
SELECT
  c.id,
  c.contract_number,
  cust.name as customer_name,
  c.arr,
  c.end_date,
  DATE_PART('day', c.end_date - CURRENT_DATE) as days_until_expiration,
  ct.auto_renewal_notice_days
FROM contracts c
JOIN customers cust ON cust.id = c.customer_id
JOIN contract_terms ct ON ct.contract_id = c.id
WHERE c.status = 'active'
  AND ct.auto_renewal = true
  AND DATE_PART('day', c.end_date - CURRENT_DATE) <= ct.auto_renewal_notice_days
ORDER BY c.end_date;
```

---

### Get Contract with Terms (Join)

```sql
SELECT
  c.*,
  ct.pricing_model,
  ct.auto_renewal,
  ct.auto_renewal_notice_days,
  ct.support_tier,
  ct.liability_cap
FROM contracts c
LEFT JOIN contract_terms ct ON ct.contract_id = c.id
WHERE c.id = 'contract-uuid';
```

---

## Migrations

### Migration History

**Location:** `supabase/migrations/`

**Recent Migrations:**
- `20251023000001_add_contract_terms.sql` - Contract terms table
- `20251023000000_add_contract_term_months.sql` - Auto-calculated term_months
- `20251022000007_step_level_actions.sql` - Step states & actions
- `20251015000000_workflow_definitions.sql` - Database-driven workflows

### Migration Pattern

```sql
-- Example: Adding new table
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_new_table_field ON new_table(field);

-- Add RLS policies
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON new_table FOR SELECT
  USING (auth.uid() = user_id);

-- Add triggers (if needed)
CREATE TRIGGER update_updated_at
  BEFORE UPDATE ON new_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Running Migrations

```bash
# Local development
npx supabase db reset

# Apply specific migration
npx supabase migration up --file 20251023000001_add_contract_terms.sql

# Check migration status
npx supabase migration list
```

---

## Database Triggers

### Auto-Update workflow_executions Flags

**Purpose:** Automatically set `has_snoozed_steps` and `next_due_step_date` when steps are snoozed.

```sql
CREATE OR REPLACE FUNCTION update_workflow_execution_flags()
RETURNS TRIGGER AS $$
BEGIN
  -- Update parent execution record
  UPDATE workflow_executions
  SET
    has_snoozed_steps = (
      SELECT COUNT(*) > 0
      FROM workflow_step_states
      WHERE execution_id = NEW.execution_id
        AND status = 'snoozed'
    ),
    next_due_step_date = (
      SELECT MIN(snoozed_until)
      FROM workflow_step_states
      WHERE execution_id = NEW.execution_id
        AND status = 'snoozed'
    )
  WHERE id = NEW.execution_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_workflow_flags
  AFTER INSERT OR UPDATE ON workflow_step_states
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_execution_flags();
```

---

## Related Documentation

- **[Architecture Guide](ARCHITECTURE.md)** - System design context
- **[Contract Terms Guide](../guides/CONTRACT-TERMS.md)** - Detailed contract_terms examples
- **[Step Actions Guide](../guides/STEP-ACTIONS.md)** - Using workflow_step_states
- **[Workflow Guide](../guides/WORKFLOWS.md)** - Using workflow_definitions

---

**Questions?** See [Documentation Hub](../README.md) or contact the engineering team.
