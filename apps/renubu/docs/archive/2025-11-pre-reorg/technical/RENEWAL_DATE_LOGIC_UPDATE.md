# Renewal Date Logic Update

## Overview
Updated the customer seeding script to use deterministic renewal dates calculated as `CURRENT_DATE + INTERVAL 'X days'`, providing a good cross-sampling of urgency scenarios for realistic customer workflow testing.

## Changes Made

### 1. Updated `supabase/seed.sql`
- **Before**: Fixed renewal dates (e.g., '2024-08-15') that could be in the past
- **After**: Deterministic renewal dates using `CURRENT_DATE + INTERVAL 'X days'`

### 2. Logic Implementation
```sql
CURRENT_DATE + INTERVAL '75 days'  -- Example for Acme Corporation
```

### 3. How It Works
- **Deterministic**: Each customer gets a specific number of days offset from current date
- **Future-proof**: All dates are guaranteed to be in the future
- **Realistic range**: 12-195 days provides good coverage of urgency scenarios

## Customer Renewal Distribution

The seeding script now provides a variety of renewal scenarios with deterministic day offsets:

| Customer | Days Offset | Renewal Scenario | Urgency Level |
|----------|-------------|------------------|---------------|
| Horizon Systems | 12 days | ~2 weeks | 🔴 Very Urgent |
| StartupXYZ | 18 days | ~2.5 weeks | 🔴 Urgent |
| FusionWare | 22 days | ~3 weeks | 🔴 Urgent |
| RiskyCorp | 25 days | ~1 month | 🔴 Urgent |
| Apex Media | 65 days | ~2 months | 🟡 Warning |
| Acme Corporation | 75 days | ~2.5 months | 🟡 Warning |
| Quantum Soft | 85 days | ~3 months | 🟡 Warning |
| TechStart Inc | 95 days | ~3 months | 🟢 Good |
| BetaWorks | 105 days | ~3.5 months | 🟢 Good |
| Global Solutions | 125 days | ~4 months | 🟢 Good |
| Stellar Networks | 135 days | ~4.5 months | 🟢 Good |
| Nimbus Analytics | 155 days | ~5 months | 🟢 Good |
| Dynamic Ventures | 165 days | ~5.5 months | 🟢 Good |
| Venture Partners | 185 days | ~6 months | 🟢 Good |
| Prime Holdings | 195 days | ~6.5 months | 🟢 Good |

## Testing

### 1. JavaScript Test Script
Run the test script to verify the logic:
```bash
node scripts/test-renewal-dates.js
```

### 2. SQL Test Script
Run the SQL test directly in your database:
```bash
# Copy the contents of scripts/test-renewal-logic.sql and run in your database
```

### 3. Expected Results
- All renewal dates should be in the future
- No dates should be more than 1 year away
- Variety of urgency levels (urgent, warning, good)

## Benefits

1. **Realistic Workflows**: Customer workflows are now truly determined by days until renewal
2. **No Past Dates**: Eliminates the issue of renewal dates being in the past
3. **Consistent Logic**: Same logic applied to all customers
4. **Variety**: Maintains different urgency levels for testing different scenarios
5. **Future-Proof**: Logic automatically adjusts as time passes

## Usage

To apply the updated seeding:

```bash
# Run the updated seed script
node scripts/run-seed.js

# Or test the renewal logic first
node scripts/test-renewal-dates.js
```

## Files Modified

1. `supabase/seed.sql` - Updated customer insertion with dynamic renewal dates
2. `scripts/test-renewal-dates.js` - New test script (created)
3. `scripts/test-renewal-logic.sql` - New SQL test script (created)
4. `RENEWAL_DATE_LOGIC_UPDATE.md` - This documentation (created)
