# REVISED Deployment Plan - January 29, 2025

## ✅ CORRECTED UNDERSTANDING

**Critical Discovery**: After updating local `main` branch, confirmed that:
- `main` branch: commit `735c856` (feat: implement workspace invitation system - Phase 2)
- `justin-strackany` branch: commit `735c856` (SAME COMMIT)
- **Prod and staging are ALREADY IN SYNC** ✅

### What This Means
- ✅ All 110 commits from justin-strackany have ALREADY been merged to main
- ✅ Production is up-to-date with zen dashboard, workspace invitations, etc.
- ✅ NO staging→prod promotion needed
- ✅ Can proceed directly to deploying new pricing work to staging

---

## Current Situation

### Infrastructure
- **Production**: Vercel project pointing to `main` branch
- **Staging**: Vercel project pointing to `justin-strackany` branch
- **Prod Database**: Supabase project (separate instance)
- **Staging Database**: Supabase project (separate instance)

### Git Status
```
main:              735c856 (production)
justin-strackany:  735c856 (staging) - SAME AS MAIN ✅
feature/component-based-workflows: Has new pricing work (not yet committed)
```

### New Work Waiting to Deploy (Weeks 1-3)
**Location**: `feature/component-based-workflows` branch (stashed changes)
**Size**: ~4,500 lines of new code
**Components**:
1. **Atomic Components** (~700 lines) - 5 reusable UI building blocks
2. **Pricing Engine** (~2,000 lines) - Database functions, TypeScript service, API
3. **Composite Components** (~1,000 lines) - 3 feature-rich UI sections
4. **Testing Infrastructure** (~800 lines) - Test page, E2E tests, documentation

**Database Migration**: `supabase/migrations/20250128000001_pricing_optimization_engine.sql`
- 6 PostgreSQL functions for pricing algorithm
- `pricing_recommendations` table

---

## SIMPLIFIED Deployment Path

Since prod and staging are in sync, the path is straightforward:

### Step 1: Commit New Work ✅
Commit pricing optimization work to `feature/component-based-workflows`

### Step 2: Merge to Staging ✅
Merge new work into `justin-strackany` (staging branch)

### Step 3: Deploy to Staging ✅
Push `justin-strackany` to trigger Vercel staging deployment

### Step 4: Apply Database Migration ✅
Run migration on staging Supabase database

### Step 5: UI Testing Checkpoint ✅
Follow testing guide to validate new features

### Step 6: (Future) Promote to Production ⏳
After thorough testing, merge to `main` for production release

---

## Detailed Deployment Steps

### Phase 1: Commit New Pricing Work (5 minutes)

```bash
# Restore stashed changes
git stash pop

# Review what will be committed
git status

# Add new files
git add supabase/migrations/20250128000001_pricing_optimization_engine.sql
git add src/components/workflows/library/atomic/
git add src/components/workflows/library/composite/
git add src/lib/workflows/services/
git add src/app/api/workflows/pricing/
git add src/app/test-pricing/
git add tests/e2e/pricing-optimization-complete.test.tsx
git add docs/technical/PRICING_OPTIMIZATION_ENGINE.md
git add docs/technical/PRICING_ENGINE_IMPLEMENTATION.md
git add docs/technical/COMPONENT_WORKFLOW_ARCHITECTURE.md
git add docs/testing/UI_TESTING_CHECKPOINT_1.md
git add docs/testing/QUICK_START_UI_TESTING.md
git add docs/CHECKPOINT_1_COMPLETE.md

# Create commit
git commit -m "$(cat <<'EOF'
feat: implement pricing optimization engine and component library (Weeks 1-3)

## What Was Built

### Week 1: Atomic Components (~700 lines)
- MetricDisplay: KPIs, health scores, ARR metrics
- ScenarioCard: Pricing scenarios with pros/cons
- DataCard: Key-value pairs for contextual data
- AlertBox: Alerts, warnings, success messages
- FormField: Universal form input handling

Reusability: 88% (27 uses across 3 composite components)

### Week 2: Pricing Optimization Engine (~2,000 lines)

#### Database Functions (PostgreSQL)
- calculate_stickiness_score(): Switching cost analysis (0-100)
- calculate_value_leverage_index(): Value vs. price ratio (0.95-1.05)
- get_market_position_adjustment(): Peer benchmark comparison (-2 to +3)
- calculate_risk_multiplier(): Churn risk impact (0.5-1.1)
- calculate_trend_adjustment(): Momentum indicators (-2 to +2)
- calculate_pricing_recommendation(): Master orchestration function

#### TypeScript Service Layer
- PricingOptimizationService: Type-safe API wrapper
- Full input/output type definitions
- Error handling and validation

#### API Endpoints
- POST /api/workflows/pricing/recommend: Calculate recommendation
- GET /api/workflows/pricing/recommend: Get acceptance metrics
- PATCH /api/workflows/pricing/outcome: Update outcomes

#### Algorithm
Base Increase = (Stickiness/100 * 8) + ((ValueIndex - 1) * 100) + MarketAdj + TrendAdj
Recommended Increase = Base Increase * Risk Multiplier
Apply CSM constraints (price cap, risk tolerance)
Generate 3 scenarios: Conservative, Recommended, Aggressive

Target: >70% pricing recommendation acceptance rate

### Week 3: Composite Components (~1,000 lines)

#### PricingRecommendation
- Displays 3 pricing scenarios
- Confidence score and data quality warnings
- Interactive scenario selection
- Pricing factors breakdown
- Algorithm transparency

#### HealthDashboard
- Overall health score (0-100)
- 7 key health metrics
- Risk factor analysis
- Usage details and engagement tracking
- Urgent action alerts

#### StakeholderMap
- Groups stakeholders by role (Champions, Decision Makers, Influencers, Blockers, Users)
- Influence score and sentiment tracking
- Relationship strength metrics
- Interactive stakeholder cards

### Testing Infrastructure
- Test page: /test-pricing
- E2E test suite (needs Jest setup)
- Comprehensive test checklist
- 5-minute quick start guide

### Documentation
- Pricing engine specification
- Implementation guide
- Component architecture
- Testing guides

## MVP Progress
- Checkpoint 1 Complete: 50% of MVP
- Next: Week 4-5 Step Templates, Week 6 Integration

## Core Value Proposition
Full-stack pricing optimization system that:
- Analyzes 5 factors (stickiness, value, market, risk, trends)
- Generates data-driven recommendations with confidence scores
- Tracks acceptance rates to validate model accuracy
- Provides full algorithmic transparency

This is what sets Renubu apart from competitors! 🚀

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Phase 2: Merge to Staging Branch (2 minutes)

```bash
# Switch to staging branch
git checkout justin-strackany

# Merge new pricing work
git merge feature/component-based-workflows

# Review merge
git log --oneline -5

# Push to trigger staging deployment
git push origin justin-strackany
```

**Expected**: Vercel staging deployment will automatically trigger

### Phase 3: Apply Database Migration (3 minutes)

**On Staging Supabase:**

1. Go to Supabase Dashboard → Select staging project
2. Click "SQL Editor" → "New query"
3. Copy contents of `supabase/migrations/20250128000001_pricing_optimization_engine.sql`
4. Paste and click "Run"
5. Verify success:
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE 'calculate_%';
   ```
   Should see 6 functions listed

### Phase 4: Create Test Customer (1 minute)

**Run in Staging Supabase SQL Editor:**

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

**Save the returned customer ID!**

### Phase 5: Update Test Page (1 minute)

1. Open `src/app/test-pricing/page.tsx`
2. Replace line 10:
   ```typescript
   const [customerId] = useState('PASTE_YOUR_CUSTOMER_ID_HERE');
   ```
3. Commit and push:
   ```bash
   git add src/app/test-pricing/page.tsx
   git commit -m "chore: configure test page with customer ID"
   git push origin justin-strackany
   ```

### Phase 6: UI Testing Checkpoint (20-30 minutes)

**Follow**: `docs/testing/QUICK_START_UI_TESTING.md`

**Test URL**: https://your-staging-url.vercel.app/test-pricing

**Success Criteria**:
- [ ] All 3 composite components render without errors
- [ ] Pricing recommendation displays 3 scenarios correctly
- [ ] Scenario selection works (click scenarios, see feedback)
- [ ] All pricing factors and data quality indicators display
- [ ] HealthDashboard shows all metrics and risk factors
- [ ] StakeholderMap groups stakeholders by role correctly
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] API returns recommendations in <5 seconds
- [ ] No critical errors in console

---

## Timeline Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Commit New Work | 5 min | ⏳ Pending |
| Phase 2: Merge to Staging | 2 min | ⏳ Pending |
| Phase 3: Database Migration | 3 min | ⏳ Pending |
| Phase 4: Create Test Customer | 1 min | ⏳ Pending |
| Phase 5: Update Test Page | 1 min | ⏳ Pending |
| Phase 6: UI Testing | 20-30 min | ⏳ Pending |
| **TOTAL** | **~35 minutes** | |

---

## Rollback Plan

If anything breaks in staging:

### Quick Rollback (Vercel)
1. Go to Vercel staging dashboard
2. Find previous deployment (commit `735c856`)
3. Click "Promote" or "Redeploy"
4. Takes ~2 minutes

### Git Rollback
```bash
git checkout justin-strackany
git reset --hard 735c856
git push origin justin-strackany --force
```

### Database Rollback
Staging database can be restored from Supabase backup if needed.

---

## Risk Assessment

### Very Low Risk ✅
- **Deploying to staging only** (not production)
- **New isolated features** (won't break existing functionality)
- **Separate database** (staging only)
- **Easy rollback** (Vercel one-click rollback)

### Medium Risk ⚠️
- **Database migration** - Test queries before applying
- **New API endpoints** - Verify they don't conflict with existing routes

### No Risk to Production ✅
- **Production untouched** - main branch stays at 735c856
- **Can test thoroughly on staging** before any prod promotion

---

## Production Promotion Plan (Future)

**After thorough staging testing** (1-2 weeks):

### Option A: Direct Merge (Simple)
```bash
git checkout main
git merge justin-strackany
git push origin main
```

Then apply database migration to production Supabase.

### Option B: Release Branch (Professional)
```bash
git checkout -b release/v2.1.0 main
git merge justin-strackany
git push origin release/v2.1.0
# Test release branch
git checkout main
git merge release/v2.1.0
git tag v2.1.0
git push origin main v2.1.0
```

**Recommendation**: Use Option B for production - gives extra testing layer.

---

## Next Steps

**Immediate (Today)**:
1. ✅ Commit new pricing work
2. ✅ Merge to justin-strackany
3. ✅ Deploy to staging
4. ✅ Apply database migration
5. ✅ UI Testing Checkpoint 1

**Week 4-5 (After Testing)**:
1. Build step templates that orchestrate components
2. Wire into workflow pages
3. UI Testing Checkpoint 2

**Week 6 (MVP Complete)**:
1. Final integration
2. Performance optimization
3. Production promotion

---

## Questions Before Proceeding?

Before we start deployment, confirm:
- [ ] Ready to deploy to staging now?
- [ ] Have access to staging Supabase dashboard?
- [ ] Staging Vercel project is connected to justin-strackany branch?
- [ ] 35 minutes available for full deployment + testing?

If yes to all, let's proceed with Phase 1! 🚀
