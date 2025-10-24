# Contract Terms Guide

## Overview

The `contract_terms` table stores business and legal terms that remain constant during a contract's lifecycle but vary between contracts.

## Data Model

```
contracts (basic facts)
  ├── start_date, end_date, arr, seats
  └── term_months (auto-calculated from dates)

contract_terms (business terms - 1:1 relationship)
  ├── Pricing: pricing_model, discounts, payment_terms
  ├── Renewal: auto_renewal, notice periods, price caps
  ├── Service: SLA, support tier, response times
  ├── Legal: liability caps, data residency, indemnification
  └── Features: included/excluded features, usage limits
```

## Common Use Cases

### 1. Enterprise Contract with Custom Terms

```typescript
// Create contract
const { data: contract } = await supabase
  .from('contracts')
  .insert({
    customer_id: customerId,
    start_date: '2025-01-01',
    end_date: '2027-01-01', // 24 months
    arr: 500000,
    seats: 200,
    status: 'active'
  })
  .select()
  .single();

// Add contract terms
await supabase.from('contract_terms').insert({
  contract_id: contract.id,

  // Pricing
  pricing_model: 'custom',
  discount_percent: 20,
  volume_discounts: {
    '100-200': 15,
    '200-500': 20,
    '500+': 25
  },
  payment_terms: 'net_60',
  invoicing_schedule: 'quarterly',

  // Renewal
  auto_renewal: true,
  auto_renewal_notice_days: 120, // 4 months notice
  renewal_price_cap_percent: 8, // Max 8% increase

  // Service
  sla_uptime_percent: 99.99,
  support_tier: 'white_glove',
  response_time_hours: 1,
  support_hours: '24x7',
  dedicated_csm: true,

  // Legal
  liability_cap: 'unlimited',
  data_residency: ['us', 'eu'],
  data_retention_days: 365,

  // Features
  included_features: [
    'api_access',
    'sso',
    'custom_integrations',
    'advanced_analytics',
    'white_label'
  ],
  usage_limits: {
    api_calls_per_month: 10000000,
    storage_gb: 2000,
    concurrent_users: 1000
  },
  overage_pricing: {
    api_calls_per_1000: 0.05,
    storage_gb_per_month: 3.00
  },

  // Custom
  custom_terms: {
    quarterly_business_reviews: true,
    annual_roadmap_input: true,
    dedicated_slack_channel: true,
    custom_feature_development_hours: 40
  }
});
```

### 2. Standard SMB Contract

```typescript
await supabase.from('contract_terms').insert({
  contract_id: contract.id,

  pricing_model: 'per_seat',
  payment_terms: 'net_30',
  invoicing_schedule: 'monthly',

  auto_renewal: true,
  auto_renewal_notice_days: 30,

  sla_uptime_percent: 99.9,
  support_tier: 'standard',
  response_time_hours: 24,
  support_hours: 'business_hours',

  liability_cap: '12_months_fees',
  data_residency: ['us'],

  included_features: ['api_access', 'basic_analytics'],
  usage_limits: {
    api_calls_per_month: 100000,
    storage_gb: 50
  }
});
```

### 3. Usage-Based Contract

```typescript
await supabase.from('contract_terms').insert({
  contract_id: contract.id,

  pricing_model: 'usage_based',
  payment_terms: 'net_30',
  invoicing_schedule: 'monthly',

  auto_renewal: true,
  auto_renewal_notice_days: 60,

  sla_uptime_percent: 99.95,
  support_tier: 'premium',

  liability_cap: '12_months_fees',

  // No hard limits, just overage pricing
  usage_limits: {
    included_api_calls: 500000,
    included_storage_gb: 100
  },
  overage_pricing: {
    api_calls_per_1000: 0.10,
    storage_gb_per_month: 5.00,
    overage_discount_percent: 10 // Volume discount on overages
  }
});
```

## Querying Examples

### Find Contracts in Auto-Renewal Window

```sql
SELECT *
FROM contract_matrix
WHERE in_renewal_window = true
ORDER BY days_until_renewal ASC;
```

### Find High-Value Contracts with Unlimited Liability

```sql
SELECT
  customer_name,
  arr,
  liability_cap,
  support_tier
FROM contract_matrix
WHERE arr > 100000
  AND liability_cap = 'unlimited'
ORDER BY arr DESC;
```

### Find Contracts with Custom Pricing

```typescript
const { data } = await supabase
  .from('contract_terms')
  .select(`
    *,
    contract:contracts(
      arr,
      seats,
      end_date,
      customer:customers(name)
    )
  `)
  .eq('pricing_model', 'custom')
  .order('contract.arr', { ascending: false });
```

### Check Auto-Renewal Status

```typescript
// Using helper function
const { data: isInWindow } = await supabase
  .rpc('is_in_auto_renewal_window', { contract_id_param: contractId });

if (isInWindow) {
  console.log('Contract is in auto-renewal window!');
}
```

### Get Contracts Needing Renewal Notice

```sql
-- Contracts where auto-renewal notice deadline is approaching
SELECT
  customer_name,
  contract_number,
  end_date,
  auto_renewal_notice_days,
  days_until_renewal,
  days_until_renewal - auto_renewal_notice_days as days_until_notice_deadline
FROM contract_matrix
WHERE auto_renewal = true
  AND days_until_renewal <= auto_renewal_notice_days + 7 -- 1 week buffer
  AND days_until_renewal > 0
ORDER BY days_until_renewal ASC;
```

## Common Term Values

### Pricing Models
- `per_seat` - Standard per-user pricing
- `usage_based` - Pay for actual usage
- `tiered` - Volume-based tiers
- `custom` - Negotiated pricing
- `flat_fee` - Fixed annual fee

### Payment Terms
- `net_30` - Payment due in 30 days
- `net_60` - Payment due in 60 days
- `prepaid_annual` - Full year paid upfront
- `quarterly` - Quarterly payments

### Support Tiers
- `standard` - Basic support
- `premium` - Enhanced support
- `enterprise` - Enterprise-grade support
- `white_glove` - Dedicated support team

### Liability Caps
- `unlimited` - No liability cap
- `12_months_fees` - Capped at 12 months of fees
- `6_months_fees` - Capped at 6 months of fees
- `custom` - Custom amount (see liability_cap_amount)

### Auto-Renewal Notice Periods
- `30` - 30 days notice
- `60` - 60 days notice (most common)
- `90` - 90 days notice
- `120` - 120 days notice (enterprise)

## Best Practices

1. **Always create contract_terms with contracts**: Use transactions to ensure both are created together

2. **Use JSONB for flexible data**: Store complex structures like volume_discounts and usage_limits as JSON

3. **Document custom terms**: Use the `notes` field or `custom_terms` JSON to explain unique clauses

4. **Set reasonable defaults**: Auto-renewal notice should be 60 days unless negotiated otherwise

5. **Track renewal windows**: Use the `contract_matrix` view or helper function to monitor renewal timing

## Migration

The migration file is: `supabase/migrations/20251023000001_add_contract_terms.sql`

This creates:
- ✅ `contract_terms` table
- ✅ Indexes for common queries
- ✅ `contract_matrix` view
- ✅ `is_in_auto_renewal_window()` helper function
- ✅ Auto-update trigger for `updated_at`

## Related Tables

- `contracts` - Basic contract facts (dates, ARR, seats)
- `contract_terms` - Business terms (this table)
- `contract_assessments` - Time-series assessments (future)
- `renewals` - Renewal opportunities
