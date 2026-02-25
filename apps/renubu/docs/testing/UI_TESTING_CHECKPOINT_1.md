# UI Testing Checkpoint 1 - Pricing Optimization Components

## Overview

This is our **first UI testing checkpoint** at approximately **50% completion** of the MVP build. We've completed:
- ✅ 5 Atomic Components (Week 1)
- ✅ Pricing Optimization Engine (Week 2)
- ✅ 3 Composite Components (Week 3)

**What to Test:** Pricing optimization flow from database to UI components.

**Goal:** Validate that components render correctly, interact properly, and display accurate pricing recommendations.

---

## Pre-Test Setup

### 1. Database Migration

First, apply the pricing optimization engine to your Supabase database:

```bash
# Navigate to Supabase dashboard: https://supabase.com/dashboard
# Go to SQL Editor
# Copy contents of: supabase/migrations/20250128000001_pricing_optimization_engine.sql
# Run the migration
```

**Verify migration success:**
- Check that functions exist: `calculate_pricing_recommendation`, `calculate_stickiness_score`, etc.
- Check that `pricing_recommendations` table exists

### 2. Create Test Customer

We need at least one customer in the database to test pricing recommendations.

**Run this SQL in Supabase SQL Editor:**

```sql
-- Insert a test customer with complete data
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
  sentiment_trend
) VALUES (
  'Acme Corp (Test)',
  100000,           -- $100K ARR
  100,              -- 100 seats
  75,               -- 75% feature adoption
  3,                -- 3 integrations
  5.0,              -- 5 TB data
  85,               -- 85 active users
  2,                -- 2 customizations
  12.5,             -- +12.5% usage growth
  'increasing',     -- Value perception increasing
  1200,             -- Market benchmark $1200/seat (customer pays $1000)
  30,               -- Low churn risk (30/100)
  'low',            -- Low budget pressure
  'loyal',          -- Loyal (no competitive threat)
  8,                -- Strong relationship (8/10)
  10.0,             -- +10% usage trend
  'decreasing',     -- Fewer support tickets
  'improving'       -- Sentiment improving
)
RETURNING id;
```

**Save the returned customer ID** - you'll need it for testing.

### 3. Create Test Page

Create a test page to render the components:

**File:** `src/app/test-pricing/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { PricingRecommendation } from '@/components/workflows/library/composite/PricingRecommendation';
import { HealthDashboard } from '@/components/workflows/library/composite/HealthDashboard';
import { StakeholderMap } from '@/components/workflows/library/composite/StakeholderMap';

export default function TestPricingPage() {
  const [customerId] = useState('YOUR_TEST_CUSTOMER_ID_HERE'); // Replace with your test customer ID
  const [pricingData, setPricingData] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPricing() {
      try {
        setLoading(true);
        const response = await fetch('/api/workflows/pricing/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            csmInputs: {
              risk_tolerance: 'moderate'
            },
            storeRecommendation: false // Don't store during testing
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        setPricingData(data.recommendation);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch pricing:', err);
      } finally {
        setLoading(false);
      }
    }

    if (customerId) {
      fetchPricing();
    }
  }, [customerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing recommendation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg">
          <h2 className="text-red-800 font-bold text-lg mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-gray-600 mt-4">
            Check console for details. Make sure:
            <ul className="list-disc ml-5 mt-2">
              <li>Database migration is applied</li>
              <li>Test customer exists</li>
              <li>Customer ID is correct</li>
              <li>API endpoint is working</li>
            </ul>
          </p>
        </div>
      </div>
    );
  }

  if (!pricingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No pricing data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pricing Optimization - UI Test
          </h1>
          <p className="text-gray-600">
            Testing composite components with live pricing data
          </p>
        </div>

        {/* PricingRecommendation Component */}
        <div className="bg-white rounded-lg shadow p-6">
          <PricingRecommendation
            recommendation={pricingData}
            currentARR={100000}
            customerName="Acme Corp (Test)"
            selectedScenario={selectedScenario}
            onSelectScenario={setSelectedScenario}
            showFactors
            showDataQuality
          />
        </div>

        {/* HealthDashboard Component */}
        <div className="bg-white rounded-lg shadow p-6">
          <HealthDashboard
            customerName="Acme Corp (Test)"
            overallHealth={75}
            metrics={{
              usageGrowth: 12.5,
              featureAdoption: 75,
              userAdoption: { active: 85, total: 100 },
              supportTickets: { current: 3, trend: 'decreasing' },
              sentimentScore: 78,
              engagementTrend: 'up'
            }}
            riskFactors={{
              churnRiskScore: 30,
              budgetPressure: 'low',
              competitiveThreat: 'loyal',
              contractDaysRemaining: 60
            }}
            usage={{
              lastLoginDays: 2,
              activeFeatures: 18,
              totalFeatures: 25
            }}
          />
        </div>

        {/* StakeholderMap Component */}
        <div className="bg-white rounded-lg shadow p-6">
          <StakeholderMap
            stakeholders={[
              {
                name: 'Sarah Johnson',
                title: 'VP of Operations',
                role: 'champion',
                influence: 9,
                sentiment: 'positive',
                engagement: 'high',
                department: 'Operations',
                notes: 'Strong advocate for our platform'
              },
              {
                name: 'Michael Chen',
                title: 'CFO',
                role: 'decision_maker',
                influence: 10,
                sentiment: 'neutral',
                engagement: 'medium',
                department: 'Finance',
                notes: 'Budget holder, focused on ROI'
              },
              {
                name: 'Emily Rodriguez',
                title: 'Head of IT',
                role: 'influencer',
                influence: 7,
                sentiment: 'positive',
                engagement: 'high',
                department: 'IT'
              }
            ]}
            customerName="Acme Corp (Test)"
            relationshipStrength={8}
          />
        </div>

        {/* Selection Summary */}
        {selectedScenario && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-2">
              Selected Scenario: {selectedScenario}
            </h3>
            <p className="text-blue-700">
              Scenario selection is working! In a real workflow, this would be saved
              to the execution context.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## UI Test Checklist

### Test 1: PricingRecommendation Component Display

**Navigate to:** `http://localhost:3000/test-pricing`

#### Visual Checks:
- [ ] Page loads without errors
- [ ] "Pricing Recommendation" header is visible
- [ ] Customer name "Acme Corp (Test)" is displayed
- [ ] Confidence score badge shows in top-right corner
- [ ] Confidence score is a number between 0-100

#### Recommended Pricing Section:
- [ ] Blue gradient section displays "Recommended Pricing"
- [ ] Three metric cards show:
  - [ ] Current ARR ($100,000)
  - [ ] Target ARR (higher than current, with green up arrow)
  - [ ] Revenue Increase (dollar amount with percentage)
- [ ] All numbers are formatted correctly (commas, $ signs)

#### Three Scenarios:
- [ ] Three scenario cards are displayed side-by-side
- [ ] Cards are labeled: "Conservative", "Recommended", "Aggressive"
- [ ] "Recommended" card has a green "Recommended" badge at the top
- [ ] Each card shows:
  - [ ] Target price (formatted as currency)
  - [ ] Increase percentage (colored: green/blue/purple)
  - [ ] Acceptance probability bar (visual progress bar)
  - [ ] Pros list (with green bullets)
  - [ ] Cons list (with red bullets)
- [ ] Conservative has highest probability
- [ ] Recommended has medium probability
- [ ] Aggressive has lowest probability

#### Interaction Tests:
- [ ] **Click on Conservative card** - Card should highlight with blue border and checkmark icon appears
- [ ] **Click on Recommended card** - Previous selection clears, Recommended highlights
- [ ] **Click on Aggressive card** - Previous selection clears, Aggressive highlights
- [ ] Blue summary box appears at bottom showing "Selected Scenario: [name]"

#### Pricing Factors Card:
- [ ] "Pricing Factors" card displays on left side
- [ ] Shows 5 factors:
  - [ ] Stickiness Score (0-100 format)
  - [ ] Value Leverage (percentage format)
  - [ ] Market Position (with +/- sign)
  - [ ] Risk Multiplier (decimal with 'x')
  - [ ] Trend Adjustment (with +/- sign)
- [ ] Factors have descriptive text (e.g., "Very Sticky ✓" for high stickiness)

#### Data Quality Card:
- [ ] "Data Quality" card displays on right side
- [ ] Shows 4 data categories:
  - [ ] Usage Data
  - [ ] Financial Data
  - [ ] Risk Data
  - [ ] Competitive Data
- [ ] Each shows status: "✓ Complete", "⚠ Partial", or "✗ Missing"

#### Algorithm Explanation:
- [ ] Blue info alert box at bottom
- [ ] Explains how recommendation was calculated
- [ ] Mentions all 5 factors with actual values

---

### Test 2: HealthDashboard Component Display

**Scroll down to Health Dashboard section**

#### Header:
- [ ] "Customer Health Dashboard" title visible
- [ ] Customer name displayed
- [ ] Emoji indicator in top-right (should be ✓ or 🎉 for healthy customer)
- [ ] Health status text (e.g., "Good")

#### Overall Health Score:
- [ ] Large green gradient card displays
- [ ] "Overall Health Score" label
- [ ] Score shows as 75 (or similar)
- [ ] Heart icon displays
- [ ] Up arrow trend indicator shows

#### Key Metrics Grid (6 metrics):
- [ ] **Usage Growth** - Shows +12.5% with green color and up arrow
- [ ] **Feature Adoption** - Shows 75% with appropriate color
- [ ] **User Adoption** - Shows 85% (85 of 100 users)
- [ ] **Support Tickets** - Shows 3 with down arrow (decreasing is good)
- [ ] **Sentiment Score** - Shows 78
- [ ] **Contract Days Left** - Shows 60 days

#### Risk Factors Card:
- [ ] Shows "Risk Factors" title with warning icon
- [ ] Displays:
  - [ ] Churn Risk: 30/100 (Low Risk)
  - [ ] Days Until Renewal: 60 days
  - [ ] Budget Pressure: 🟢 Low
  - [ ] Competitive Threat: ✓ Loyal

#### Usage Details Card:
- [ ] Shows "Usage Details" title
- [ ] Displays:
  - [ ] Last Login: 2 days ago (✓ Active)
  - [ ] Active Features: 18 of 25
  - [ ] Feature Coverage: 72%
  - [ ] User Adoption: 85 of 100 users

#### Health Score Explanation:
- [ ] Blue info alert at bottom explains calculation
- [ ] Mentions score of 75/100
- [ ] Explains what score means

---

### Test 3: StakeholderMap Component Display

**Scroll down to Stakeholder Map section**

#### Header:
- [ ] "Stakeholder Map" title visible
- [ ] Customer name displayed
- [ ] Relationship Strength metric in top-right shows 8/10 with green color

#### Key Metrics Grid:
- [ ] Shows 4 metrics:
  - [ ] Champions: 1 (green)
  - [ ] Decision Makers: 1 (purple)
  - [ ] Positive Sentiment: percentage
  - [ ] Blockers: 0 (green - none is good)

#### Stakeholder Cards:

**Champions Section:**
- [ ] Shows "⭐ Champions (1)" header
- [ ] Description: "Internal advocates who promote your solution"
- [ ] Sarah Johnson card displays:
  - [ ] Name and title visible
  - [ ] VP of Operations title
  - [ ] Green/positive color scheme
  - [ ] "positive" sentiment badge (green)
  - [ ] Influence: 9/10
  - [ ] Department: Operations
  - [ ] High Engagement label (green text)
  - [ ] Notes visible

**Decision Makers Section:**
- [ ] Shows "👑 Decision Makers (1)" header
- [ ] Michael Chen card displays:
  - [ ] Name and CFO title
  - [ ] Purple color scheme
  - [ ] "neutral" sentiment badge (gray)
  - [ ] Influence: 10/10 (highest)
  - [ ] Department: Finance
  - [ ] Medium Engagement label

**Influencers Section:**
- [ ] Shows "💡 Influencers (1)" header
- [ ] Emily Rodriguez card displays:
  - [ ] Name and Head of IT title
  - [ ] Blue color scheme
  - [ ] "positive" sentiment badge
  - [ ] Influence: 7/10
  - [ ] High Engagement

#### Relationship Analysis Card:
- [ ] Shows summary statistics:
  - [ ] Total Stakeholders: 3
  - [ ] Average Influence: (calculated average)
  - [ ] Champions: 1 (with checkmark or warning)
  - [ ] Blockers: 0 (✓ None)
  - [ ] Positive Sentiment: ratio
  - [ ] High Engagement: count

#### Interaction Tests:
- [ ] **Hover over stakeholder cards** - Cards should show hover effect
- [ ] If you added `onStakeholderClick` handler, clicking should work

---

### Test 4: Responsive Design

**Resize browser window** to test mobile/tablet layouts:

#### Desktop (>1024px):
- [ ] 3 scenario cards side-by-side
- [ ] Factor and Data Quality cards side-by-side
- [ ] All metrics grids show 2-3 columns

#### Tablet (768px - 1024px):
- [ ] Scenario cards may stack to 2 columns or remain 3
- [ ] Metrics grids adapt to 2 columns
- [ ] Everything remains readable

#### Mobile (<768px):
- [ ] All cards stack vertically (single column)
- [ ] Scenario cards display one at a time
- [ ] Text remains readable
- [ ] Touch targets are large enough
- [ ] No horizontal scrolling

---

### Test 5: Data Quality Warnings

**This test requires modifying the test customer to have incomplete data.**

**Run this SQL to create a customer with minimal data:**

```sql
INSERT INTO customers (
  name,
  current_arr,
  seat_count,
  feature_adoption
  -- Most fields NULL/undefined
) VALUES (
  'Minimal Data Corp (Test)',
  50000,
  50,
  50
)
RETURNING id;
```

**Update test page** to use this new customer ID.

**Expected behavior:**
- [ ] Yellow warning alert appears: "Limited Data Available"
- [ ] Warning message explains data is incomplete
- [ ] Data Quality card shows multiple "✗ Missing" indicators
- [ ] Confidence score is lower (<50)
- [ ] Recommendation still generates (doesn't crash)

---

### Test 6: Edge Cases

#### Test 6A: Very High Confidence
- Modify test customer to have complete data (all fields populated)
- [ ] Confidence score should be >80
- [ ] "Very High" or "High" confidence label shows
- [ ] Green color on confidence badge
- [ ] No data quality warnings

#### Test 6B: High Risk Customer
- Set `churn_risk_score` to 85
- Set `budget_pressure` to 'high'
- [ ] Recommended increase should be very low (<3%)
- [ ] Risk multiplier should be <0.75
- [ ] Conservative scenario becomes even more conservative
- [ ] Red warning may appear for urgent action

#### Test 6C: Underpriced Customer
- Set `peer_benchmark` to 1500 (customer pays $1000/seat)
- [ ] Market adjustment should be +3%
- [ ] Recommended increase should be higher
- [ ] Factor breakdown should highlight market opportunity

---

### Test 7: API Integration

**Open browser DevTools (F12) → Network tab**

#### Check API Call:
- [ ] Reload page
- [ ] `/api/workflows/pricing/recommend` POST request appears
- [ ] Request status is 200 OK
- [ ] Response time is <5 seconds
- [ ] Response payload contains:
  - [ ] `success: true`
  - [ ] `recommendation` object with all fields
  - [ ] No error messages

#### Check Console:
- [ ] No error messages in console
- [ ] No warning messages (or only expected warnings)

---

### Test 8: Database Verification

**In Supabase SQL Editor, run these queries:**

#### Test pricing functions exist:
```sql
SELECT proname
FROM pg_proc
WHERE proname LIKE 'calculate_%' OR proname LIKE 'get_%';
```

**Expected results:**
- [ ] `calculate_stickiness_score`
- [ ] `calculate_value_leverage_index`
- [ ] `get_market_position_adjustment`
- [ ] `calculate_risk_multiplier`
- [ ] `calculate_trend_adjustment`
- [ ] `calculate_pricing_recommendation`

#### Test recommendation calculation directly:
```sql
SELECT calculate_pricing_recommendation(
  'YOUR_CUSTOMER_ID_HERE'::UUID
);
```

**Expected:**
- [ ] Returns JSONB object
- [ ] Contains `targetPrice`, `increasePercent`, `confidence`, `scenarios`, `factors`
- [ ] No errors

---

## Issues Tracking

Document any issues you encounter:

| # | Component | Issue | Severity | Screenshots |
|---|-----------|-------|----------|-------------|
| 1 |  |  | High/Medium/Low |  |
| 2 |  |  |  |  |

**Severity Levels:**
- **High** - Blocks testing, crashes, or data issues
- **Medium** - UI issues, formatting problems, missing features
- **Low** - Minor styling, typos, enhancement requests

---

## Success Criteria

To pass this checkpoint, all of the following must be true:

- [ ] All 3 composite components render without errors
- [ ] PricingRecommendation displays 3 scenarios correctly
- [ ] Scenario selection interaction works
- [ ] All pricing factors and data quality indicators display
- [ ] HealthDashboard shows all metrics and risk factors
- [ ] StakeholderMap groups and displays stakeholders by role
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] API endpoint returns recommendations in <5 seconds
- [ ] Database functions calculate correctly
- [ ] No critical errors in console

**Current Status:** ⏳ READY TO TEST

---

## Next Steps After Testing

Once this checkpoint passes:

1. **Week 4-5**: Build step templates that orchestrate these components
2. **Create workflow pages** that use step templates
3. **Wire up workflow execution** to database
4. **UI Testing Checkpoint 2** at 75% completion

---

## Notes

Use this space for observations, feedback, or questions:

```
[Add your notes here during testing]
```
