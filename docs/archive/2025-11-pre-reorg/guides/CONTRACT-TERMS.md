# Contract Terms Guide

**Last Updated:** 2025-10-23
**Feature:** Business terms separation
**Table:** contract_terms

> **Note:** For database schema, see [Database Reference](../technical/DATABASE.md#contract-terms).

---

## Recent Changes
- **2025-10-23:** Consolidated from CONTRACT-TERMS-GUIDE.md
- **2025-10-23:** Added contract_terms table

---

## Overview

The `contract_terms` table stores business and legal terms that remain constant during a contract's lifecycle but vary between contracts.

**Separation:**
- `contracts` table: Lifecycle data (dates, status, ARR)
- `contract_terms` table: Business terms (pricing model, SLA, support tier)

---

## Usage

### Create Contract with Terms

```typescript
// 1. Create contract
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

// 2. Add terms
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

## Common Patterns

### Enterprise Contract
- `pricing_model`: 'custom'
- `support_tier`: 'white_glove'
- `auto_renewal_notice_days`: 120
- `sla_uptime_percent`: 99.99

### SMB Contract
- `pricing_model`: 'per_seat'
- `support_tier`: 'standard'
- `auto_renewal_notice_days`: 30
- `sla_uptime_percent`: 99.9

### Usage-Based
- `pricing_model`: 'usage_based'
- `overage_pricing`: { api_calls_per_1000: 0.10 }
- `usage_limits`: { included_api_calls: 500000 }

---

## Queries

### Find Contracts in Renewal Window

```sql
SELECT
  c.id,
  cust.name,
  c.arr,
  c.end_date,
  DATE_PART('day', c.end_date - CURRENT_DATE) as days_until,
  ct.auto_renewal_notice_days
FROM contracts c
JOIN customers cust ON cust.id = c.customer_id
JOIN contract_terms ct ON ct.contract_id = c.id
WHERE c.status = 'active'
  AND ct.auto_renewal = true
  AND DATE_PART('day', c.end_date - CURRENT_DATE) <= ct.auto_renewal_notice_days;
```

---

## Related Documentation

- [Database Reference](../technical/DATABASE.md#contract-terms)
- [Architecture Guide](../technical/ARCHITECTURE.md)

