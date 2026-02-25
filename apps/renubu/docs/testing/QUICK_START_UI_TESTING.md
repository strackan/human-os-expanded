# Quick Start: UI Testing

## 🚀 5-Minute Setup Guide

Follow these steps to start testing the pricing optimization UI:

---

## Step 1: Apply Database Migration (2 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Run Migration**
   - Open: `supabase/migrations/20250128000001_pricing_optimization_engine.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - Check that functions were created:
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE 'calculate_%';
   ```
   - You should see 6 functions listed

---

## Step 2: Create Test Customer (1 minute)

**Run this SQL in Supabase SQL Editor:**

```sql
INSERT INTO customers (
  name,
  current_arr,
  seat_count,
  feature_adoption,
  integration_count,
  data_volume_tb,
  active_users,
  customization_count,
  usage_growth,
  value_perception,
  peer_benchmark,
  churn_risk_score,
  budget_pressure,
  competitive_threat,
  relationship_strength,
  usage_trend,
  support_trend,
  sentiment_trend,
  created_at
) VALUES (
  'Acme Corp (Test)',
  100000,
  100,
  75,
  3,
  5.0,
  85,
  2,
  12.5,
  'increasing',
  1200,
  30,
  'low',
  'loyal',
  8,
  10.0,
  'decreasing',
  'improving',
  NOW() - INTERVAL '2 years'
)
RETURNING id, name, current_arr;
```

**IMPORTANT:** Copy the returned `id` (UUID) - you'll need it in Step 3!

Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## Step 3: Update Test Page (30 seconds)

1. **Open file:** `src/app/test-pricing/page.tsx`

2. **Find line 9:**
   ```typescript
   const [customerId] = useState('REPLACE_WITH_YOUR_CUSTOMER_ID');
   ```

3. **Replace with your customer ID:**
   ```typescript
   const [customerId] = useState('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
   ```

4. **Save the file**

---

## Step 4: Start Development Server (30 seconds)

```bash
npm run dev
```

Wait for server to start (usually ~10 seconds)

---

## Step 5: Open Test Page (30 seconds)

**Navigate to:** http://localhost:3000/test-pricing

**Expected:**
- Page loads with "Loading pricing recommendation..."
- After 1-5 seconds, pricing UI appears
- Three pricing scenarios display
- Health dashboard shows customer metrics
- Stakeholder map displays team members

**If you see an error:**
- Read the error message carefully
- Check the troubleshooting checklist on the error page
- See full testing guide: `docs/testing/UI_TESTING_CHECKPOINT_1.md`

---

## Step 6: Run Through Tests (10-20 minutes)

**Open the full test checklist:**
`docs/testing/UI_TESTING_CHECKPOINT_1.md`

**Test each component:**
1. ✅ PricingRecommendation - Click scenarios, check factors, verify data quality
2. ✅ HealthDashboard - Check all metrics, risk factors, usage details
3. ✅ StakeholderMap - Verify stakeholders grouped by role, click cards
4. ✅ Responsive Design - Resize browser to test mobile/tablet
5. ✅ Edge Cases - Test with different data profiles

**Document any issues you find!**

---

## Common Issues & Solutions

### Error: "Customer not found"
- ✅ Check that you replaced the customer ID in test page
- ✅ Verify customer exists: `SELECT * FROM customers WHERE id = 'your-id'`

### Error: "Failed to calculate pricing recommendation"
- ✅ Database migration not applied → Go back to Step 1
- ✅ Customer missing required fields → Check customer has `current_arr`, `seat_count`

### Error: "API error: 404"
- ✅ API endpoint doesn't exist → Check `src/app/api/workflows/pricing/recommend/route.ts` exists
- ✅ Development server not running → Run `npm run dev`

### Components not rendering
- ✅ Check browser console (F12) for errors
- ✅ Verify all atomic component files exist in `src/components/workflows/library/atomic/`
- ✅ Verify composite component files exist in `src/components/workflows/library/composite/`

### Pricing recommendation is 0% or unrealistic
- ✅ Customer data quality issue → Check customer has reasonable values for all fields
- ✅ Algorithm issue → Check database functions are calculating correctly (see full test guide)

---

## Testing Different Scenarios

Want to test how the algorithm handles different customer profiles?

### Test High-Risk Customer

```sql
UPDATE customers
SET
  churn_risk_score = 85,
  budget_pressure = 'high',
  competitive_threat = 'active_evaluation',
  usage_growth = -15,
  support_trend = 'increasing',
  sentiment_trend = 'declining'
WHERE id = 'your-customer-id';
```

Reload page → Should see very conservative recommendation (<3%)

### Test Underpriced Customer

```sql
UPDATE customers
SET
  peer_benchmark = 1500,  -- Market pays $1500/seat, customer pays $1000
  feature_adoption = 85,
  integration_count = 5,
  churn_risk_score = 20
WHERE id = 'your-customer-id';
```

Reload page → Should see aggressive recommendation with +3% market adjustment

### Reset to Original

```sql
UPDATE customers
SET
  churn_risk_score = 30,
  budget_pressure = 'low',
  competitive_threat = 'loyal',
  usage_growth = 12.5,
  support_trend = 'decreasing',
  sentiment_trend = 'improving',
  peer_benchmark = 1200
WHERE id = 'your-customer-id';
```

---

## Next Steps After Testing

Once all tests pass:

1. **Week 4-5:** Build step templates that orchestrate these components
2. **Integrate with workflows:** Wire components into actual workflow pages
3. **UI Testing Checkpoint 2:** Test complete workflow execution end-to-end

---

## Quick Reference

**Test Page URL:** http://localhost:3000/test-pricing

**Full Test Checklist:** `docs/testing/UI_TESTING_CHECKPOINT_1.md`

**Components Location:**
- Atomic: `src/components/workflows/library/atomic/`
- Composite: `src/components/workflows/library/composite/`

**API Endpoint:** `src/app/api/workflows/pricing/recommend/route.ts`

**Database Migration:** `supabase/migrations/20250128000001_pricing_optimization_engine.sql`

---

## Support

If you encounter issues:

1. Check browser console (F12) for error messages
2. Check Supabase logs for database errors
3. Review full testing guide for detailed troubleshooting
4. Document the issue with screenshots

Happy Testing! 🎉
