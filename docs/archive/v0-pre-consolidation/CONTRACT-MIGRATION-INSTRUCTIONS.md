# Contract Migration Instructions

## Overview

This migration adds contract terms to properly store business details like auto-renewal periods, liability caps, and SLA levels.

## What's Being Added

1. **`term_months` column** - Auto-calculated from `start_date` and `end_date`
2. **`contract_terms` table** - Business and legal terms for each contract
3. **`contract_matrix` view** - Convenient view of contracts with all their terms
4. **Obsidian Black contract terms** - Migrated from artifact to database

## Step 1: Run the Migration

1. Go to your Supabase SQL Editor:
   **https://supabase.com/dashboard/project/ezkjzbqxnnczovgmmqhw/sql/new**

2. Copy and paste the contents of:
   **`scripts/manual-contract-migration.sql`**

3. Click **Run**

4. You should see verification results showing:
   - ✅ Contract with term_months (24 months for Obsidian Black)
   - ✅ Contract Terms (premium support, 90 days notice, etc.)
   - ✅ Contract Matrix (full contract view)

## Step 2: Verify in UI

After running the migration, verify that contract details still display correctly:

### Check These Areas:

1. **Obsidian Black Contract Display**
   - Navigate to the Obsidian Black workflow/artifact
   - Confirm contract details show:
     - ARR: $185,000
     - Seats: 45
     - Term: 24 months (should auto-calculate from 2024-01-15 to 2026-01-15)
     - Auto-renewal: Yes, 90 days notice

2. **Contract Terms (New)**
   - Support Tier: Premium
   - SLA: 99.9%
   - Liability Cap: 12 months fees
   - Included Features: API, SSO, Advanced Analytics, etc.

## Step 3: Update Code to Use New Fields

### Before (calculating manually):
```typescript
const termMonths = Math.round(
  (new Date(endDate).getTime() - new Date(startDate).getTime()) /
  (1000 * 60 * 60 * 24 * 30)
);
```

### After (using database column):
```typescript
const termMonths = contract.term_months; // Auto-calculated!
```

### Accessing Contract Terms:
```typescript
// Query contract with terms
const { data } = await supabase
  .from('contract_matrix')
  .select('*')
  .eq('customer_id', customerId)
  .single();

// Now you have everything:
console.log(data.term_months);              // 24
console.log(data.auto_renewal_notice_days); // 90
console.log(data.support_tier);             // "premium"
console.log(data.liability_cap);            // "12_months_fees"
```

## What Was Migrated for Obsidian Black

Based on the seed data and typical enterprise contracts:

```javascript
{
  // Contract basics (already existed)
  arr: 185000,
  seats: 45,
  start_date: '2024-01-15',
  end_date: '2026-01-15',
  term_months: 24, // NEW - auto-calculated

  // Contract terms (NEW)
  pricing_model: 'per_seat',
  discount_percent: 18,  // They're at 32nd percentile
  auto_renewal: true,
  auto_renewal_notice_days: 90,
  renewal_price_cap_percent: 20,
  support_tier: 'premium',
  sla_uptime_percent: 99.9,
  response_time_hours: 4,
  dedicated_csm: true,
  liability_cap: '12_months_fees',
  included_features: [
    'api_access',
    'sso',
    'advanced_analytics',
    'custom_integrations',
    'priority_support'
  ],
  usage_limits: {
    api_calls_per_month: 2000000,
    storage_gb: 250,
    concurrent_users: 100
  }
}
```

## Verification Queries

### Check term_months is calculating correctly:
```sql
SELECT
  customer_name,
  start_date,
  end_date,
  term_months
FROM contract_matrix
WHERE customer_name ILIKE '%obsidian%';
```

### Check contract terms were added:
```sql
SELECT * FROM contract_terms
WHERE contract_id IN (
  SELECT id FROM contracts
  WHERE contract_number = 'OBSBLK-CONTRACT-2024'
);
```

### Check contracts in auto-renewal window:
```sql
SELECT
  customer_name,
  days_until_renewal,
  auto_renewal_notice_days,
  in_renewal_window
FROM contract_matrix
WHERE in_renewal_window = true;
```

## Rollback (if needed)

If something goes wrong, you can rollback:

```sql
DROP VIEW IF EXISTS public.contract_matrix;
DROP FUNCTION IF EXISTS public.is_in_auto_renewal_window;
DROP TABLE IF EXISTS public.contract_terms CASCADE;
ALTER TABLE public.contracts DROP COLUMN IF EXISTS term_months;
```

## Files Reference

- **Migration SQL**: `scripts/manual-contract-migration.sql`
- **Data model docs**: `docs/CONTRACT-TERMS-GUIDE.md`
- **Migration files**:
  - `supabase/migrations/20251023000000_add_contract_term_months.sql`
  - `supabase/migrations/20251023000001_add_contract_terms.sql`

## Support

If you see any issues:
1. Check the browser console for errors
2. Run the verification queries above
3. Confirm the `contract_matrix` view returns data
4. Verify `term_months` is showing correct values
