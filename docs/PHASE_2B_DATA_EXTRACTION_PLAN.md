# Phase 2B: Data Extraction Plan

**Date:** 2025-10-15
**Branch:** demo/bluesoft-2025
**Status:** Planning Phase

---

## Executive Summary

**Goal:** Replace hardcoded data in TaskModeFullscreen-v2.tsx with database-driven providers

**Current State:**
- 2024-line component with hardcoded data for 3 workflows
- techFlowData: ~80 lines (lines 116-195)
- obsidianBlackStakeholders: ~43 lines (lines 198-241)
- Database has seed data for Obsidian Black but workflows don't use it

**Target State:**
- Data providers fetch from database
- Component receives data via props/hooks
- Zero hardcoded business data in components

---

## Hardcoded Data Inventory

### 1. TechFlow Expansion Data (80 lines)

**Location:** TaskModeFullscreen-v2.tsx lines 116-195

**Data Structure:**
```typescript
const techFlowData = {
  contract: {
    licenseCount: 100,
    pricePerSeat: 6.50,
    annualSpend: 78000,
    renewalDate: '2025-09-15',
    renewalDays: 185,
    term: '12 months',
    autoRenew: true
  },
  usage: {
    activeUsers: 140,
    licenseCapacity: 100,
    utilizationPercent: 140,
    yoyGrowth: 47,
    lastMonthGrowth: 12,
    peakUsage: 152,
    adoptionRate: 94
  },
  market: {
    currentPrice: 6.50,
    marketAverage: 10.20,
    percentile: 18,
    priceGap: 3.70,
    similarCustomerRange: '$8.50 - $12.00',
    opportunityValue: '$290K over 3 years'
  },
  scenarios: [
    { id: 'conservative', name: 'Capacity Catch-Up', ... },
    { id: 'balanced', name: 'Growth & Value Alignment', ... },
    { id: 'aggressive', name: 'Market Rate Optimization', ... }
  ]
};
```

**Database Sources:**
- `contracts` table: licenseCount (seats), pricePerSeat (arr/seats), renewalDate, term, autoRenew
- `customer_properties` table: usage_score → activeUsers calculation
- Market data: TBD (pricing models table?)
- Scenarios: TBD (pricing_scenarios table or calculated on-the-fly)

**Missing Tables:** Need to create pricing_scenarios or calculate dynamically

### 2. Obsidian Black Stakeholders (43 lines)

**Location:** TaskModeFullscreen-v2.tsx lines 198-241

**Data Structure:**
```typescript
const obsidianBlackStakeholders = [
  {
    name: 'Marcus Castellan',
    role: 'Chief Operating Officer',
    email: 'marcus.castellan@obsidianblack.com',
    relationshipStrength: 'weak',
    communicationStyle: '...',
    keyConcerns: ['...'],
    leveragePoints: ['...'],
    recentInteractions: '...',
    notes: ''
  },
  {
    name: 'Elena Voss',
    role: 'VP Technical Operations',
    // ... same structure
  }
];
```

**Database Sources:**
- `contacts` table: name, role (title), email
- Need additional fields:
  - `relationship_strength` (weak/moderate/strong)
  - `communication_style` (TEXT)
  - `key_concerns` (JSONB array)
  - `leverage_points` (JSONB array)
  - `recent_interactions` (TEXT)
  - `notes` (TEXT)

**Decision:** Extend contacts table with relationship metadata

### 3. Greeting Messages (4 lines)

**Location:** TaskModeFullscreen-v2.tsx lines 244-248

**Data Structure:**
```typescript
const fullGreeting = isExecutiveEngagementWorkflow
  ? `Marcus from ${customerName} sent an escalation email...`
  : isExpansionWorkflow
  ? `I noticed ${customerName} is growing rapidly...`
  : `Good morning! I noticed ${customerName}'s renewal...`;
```

**Database Sources:**
- Template-based with dynamic customer name
- Could come from `workflow_templates` table or keep as code (acceptable)

**Decision:** Keep in code (minimal, workflow-specific logic)

---

## Database Schema Extensions Needed

### 1. Extend `contacts` Table

```sql
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS relationship_strength TEXT CHECK (relationship_strength IN ('weak', 'moderate', 'strong'));
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS communication_style TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS key_concerns JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS leverage_points JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS recent_interactions TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS relationship_notes TEXT;
```

### 2. Create `pricing_scenarios` Table (Optional)

```sql
CREATE TABLE IF NOT EXISTS public.pricing_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  scenario_type TEXT CHECK (scenario_type IN ('conservative', 'balanced', 'aggressive')),
  scenario_name TEXT NOT NULL,
  seats_from INTEGER,
  seats_to INTEGER,
  price_from DECIMAL(10,2),
  price_to DECIMAL(10,2),
  arr_from DECIMAL(10,2),
  arr_to DECIMAL(10,2),
  term TEXT,
  positioning TEXT,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  justification JSONB,
  recommended BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Alternative:** Calculate scenarios dynamically based on contract + usage data

### 3. Extend `customer_properties` Table (Market Data)

```sql
ALTER TABLE public.customer_properties ADD COLUMN IF NOT EXISTS market_price_average DECIMAL(10,2);
ALTER TABLE public.customer_properties ADD COLUMN IF NOT EXISTS market_percentile INTEGER;
ALTER TABLE public.customer_properties ADD COLUMN IF NOT EXISTS price_gap DECIMAL(10,2);
```

---

## Data Provider Architecture

### File Structure

```
src/lib/data-providers/
├── index.ts                          # Barrel exports
├── customerProvider.ts               # Customer basic data
├── contractProvider.ts               # Contract + usage data
├── stakeholderProvider.ts            # Contacts + relationship metadata
├── pricingScenarioProvider.ts        # Expansion pricing scenarios
└── workflowContextProvider.ts        # Combines all providers for workflow
```

### Provider Interfaces

#### 1. Contract & Usage Provider

**File:** `src/lib/data-providers/contractProvider.ts`

```typescript
export interface ContractData {
  licenseCount: number;
  pricePerSeat: number;
  annualSpend: number;
  renewalDate: string;
  renewalDays: number;
  term: string;
  autoRenew: boolean;
}

export interface UsageData {
  activeUsers: number;
  licenseCapacity: number;
  utilizationPercent: number;
  yoyGrowth: number;
  lastMonthGrowth: number;
  peakUsage: number;
  adoptionRate: number;
}

export interface MarketData {
  currentPrice: number;
  marketAverage: number;
  percentile: number;
  priceGap: number;
  similarCustomerRange: string;
  opportunityValue: string;
}

export interface ExpansionData {
  contract: ContractData;
  usage: UsageData;
  market: MarketData;
  scenarios: PricingScenario[];
}

export async function fetchExpansionData(customerId: string): Promise<ExpansionData> {
  // Fetch from contracts, customer_properties
  // Calculate scenarios or fetch from pricing_scenarios
}
```

#### 2. Stakeholder Provider

**File:** `src/lib/data-providers/stakeholderProvider.ts`

```typescript
export interface Stakeholder {
  name: string;
  role: string;
  email: string;
  relationshipStrength: 'weak' | 'moderate' | 'strong';
  communicationStyle: string;
  keyConcerns: string[];
  leveragePoints: string[];
  recentInteractions: string;
  notes: string;
}

export async function fetchStakeholders(customerId: string): Promise<Stakeholder[]> {
  // Fetch from contacts table with extended fields
}
```

#### 3. Workflow Context Provider (Master)

**File:** `src/lib/data-providers/workflowContextProvider.ts`

```typescript
export interface WorkflowContext {
  customer: {
    id: string;
    name: string;
    arr: number;
    healthScore: number;
    renewalDate: string;
  };
  expansionData?: ExpansionData;        // Only for expansion workflows
  stakeholders?: Stakeholder[];          // Only for engagement workflows
  loading: boolean;
  error: Error | null;
}

export function useWorkflowContext(
  workflowId: string,
  customerId: string
): WorkflowContext {
  // Determines workflow type from workflowId
  // Fetches appropriate data based on workflow type
  // Returns unified context
}
```

---

## Implementation Strategy

### Phase 2B.1: Database Schema Extensions

**Tasks:**
1. Create migration file for contacts table extensions
2. Create migration file for customer_properties market data
3. Optionally create pricing_scenarios table (or defer to calculation)
4. Seed extended data for Obsidian Black + TechFlow

**Files to Create:**
- `supabase/migrations/20251015000001_extend_contacts_relationships.sql`
- `supabase/migrations/20251015000002_add_market_pricing_data.sql`
- `supabase/scripts/seed_techflow_expansion_data.sql`
- `supabase/scripts/seed_contacts_relationship_data.sql`

**Deliverable:** Database schema supports all hardcoded data

### Phase 2B.2: Create Data Providers

**Tasks:**
1. Create provider directory structure
2. Implement `contractProvider.ts` (expansion data)
3. Implement `stakeholderProvider.ts` (contact + relationships)
4. Implement `workflowContextProvider.ts` (master hook)
5. Add unit tests for providers

**Files to Create:**
- `src/lib/data-providers/index.ts`
- `src/lib/data-providers/contractProvider.ts` (~150 lines)
- `src/lib/data-providers/stakeholderProvider.ts` (~100 lines)
- `src/lib/data-providers/workflowContextProvider.ts` (~200 lines)

**Deliverable:** Reusable data providers with clean interfaces

### Phase 2B.3: Integrate Providers into TaskModeFullscreen-v2

**Tasks:**
1. Add `useWorkflowContext` hook at top of component
2. Replace hardcoded `techFlowData` with context data
3. Replace hardcoded `obsidianBlackStakeholders` with context data
4. Add loading states during data fetch
5. Add error handling for failed fetches

**File Modified:**
- `src/components/workflows/TaskModeFullscreen-v2.tsx`

**Changes:**
```typescript
// OLD (lines 116-241):
const techFlowData = { /* hardcoded */ };
const obsidianBlackStakeholders = [ /* hardcoded */ ];

// NEW:
const { customer, expansionData, stakeholders, loading, error } = useWorkflowContext(
  workflowId,
  customerId
);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorState error={error} />;

// Use expansionData and stakeholders from context
```

**Lines Removed:** ~125 lines of hardcoded data
**Lines Added:** ~20 lines (hook + loading/error)

**Deliverable:** TaskModeFullscreen-v2 is database-driven

### Phase 2B.4: Test Data-Driven Workflows

**Tasks:**
1. Test Obsidian Black Strategic Planning (uses stakeholders)
2. Test TechFlow Expansion (uses expansionData)
3. Test Obsidian Black Executive Engagement (uses stakeholders)
4. Verify zen-dashboard (original) still works with hardcoded data
5. Verify zen-dashboard-v2 (clone) works with database data

**Testing URLs:**
- Original: `http://localhost:3000/zen-dashboard?sequence=bluesoft-demo-2025`
- Clone: `http://localhost:3000/zen-dashboard-v2?sequence=bluesoft-demo-2025`

**Success Criteria:**
- ✅ All 3 workflows load data from database
- ✅ UI looks identical to hardcoded version
- ✅ No console errors during data fetch
- ✅ Loading states show briefly during fetch
- ✅ zen-dashboard (original) still works

**Deliverable:** Database-driven workflows functional

---

## File Size Impact Analysis

### Current State

| File | Lines | Status |
|------|-------|--------|
| TaskModeFullscreen-v2.tsx | 2024 | Has hardcoded data |

### After Phase 2B

| File | Lines | Change | Notes |
|------|-------|--------|-------|
| TaskModeFullscreen-v2.tsx | ~1900 | -125 | Removed hardcoded data |
| contractProvider.ts | ~150 | NEW | Expansion data logic |
| stakeholderProvider.ts | ~100 | NEW | Stakeholder logic |
| workflowContextProvider.ts | ~200 | NEW | Master hook |
| data-providers/index.ts | ~20 | NEW | Barrel exports |

**Total New Code:** ~470 lines (but modular and reusable)
**Net Component Reduction:** 125 lines removed from component

**Analysis:** Small increase in total lines, but:
- Data logic separated from UI
- Reusable across workflows
- Testable in isolation
- Prepared for Phase 2C (orchestrator)

---

## Rollback Plan

### If Data Providers Fail

```bash
# Revert TaskModeFullscreen-v2 changes
git restore src/components/workflows/TaskModeFullscreen-v2.tsx

# Remove data providers
rm -rf src/lib/data-providers

# Revert database migrations
npx supabase db reset
```

### If Database Seeding Fails

```bash
# Rollback specific migrations
npx supabase migration down
```

---

## Risk Assessment

### Low Risk Items

- ✅ Extending contacts table (non-breaking, additive)
- ✅ Creating new data provider files (isolated, no side effects)
- ✅ zen-dashboard (original) protected (uses different component)

### Medium Risk Items

- ⚠️ Modifying TaskModeFullscreen-v2 (clone is experimental)
- ⚠️ Database seeds (need to match hardcoded data exactly)
- ⚠️ Pricing scenario calculation (complex logic)

### Mitigation Strategies

1. **Incremental Integration:** Add providers one at a time (stakeholders first, then expansion)
2. **Fallback Mode:** Keep hardcoded data commented out for quick rollback
3. **Visual Diff Testing:** Screenshot comparison before/after data extraction
4. **Database Verification:** SQL queries to confirm seed data matches hardcoded

---

## Success Criteria

### Phase 2B Complete When:

- [ ] Database schema extended (contacts + market data)
- [ ] Seed data added for TechFlow + Obsidian Black extended fields
- [ ] Data providers created and tested
- [ ] TaskModeFullscreen-v2 integrated with providers
- [ ] All 3 workflows work with database data
- [ ] Loading/error states functional
- [ ] zen-dashboard (original) still works
- [ ] Documentation updated
- [ ] File size review completed

**Target Date:** 2-3 days before demo (leaves buffer for testing)

---

## Next Phase Preview

**Phase 2C: Orchestrator Design**

After data extraction complete, we'll create:
- WorkflowOrchestrator.tsx (~300 lines) - Master coordinator
- Modular workflow definitions (150 lines each)
- Unified data + UI coordination layer

**Key Benefit of 2B → 2C:**
- Providers created in 2B are reused by orchestrator in 2C
- No duplication, clean separation of concerns

---

## Questions for Review

1. **Pricing Scenarios:** Calculate dynamically or create dedicated table?
   - **Recommendation:** Start with calculation (simpler), move to table if needed

2. **Market Data Source:** Where does marketAverage come from?
   - **Options:**
     - Hardcoded by tier (acceptable for MVP)
     - External pricing API (future)
     - Admin-configurable table (best long-term)

3. **Greeting Messages:** Keep hardcoded or templatize?
   - **Recommendation:** Keep hardcoded (workflow-specific, minimal lines)

4. **Testing Priority:** Which workflow to data-extract first?
   - **Recommendation:** Stakeholders first (simpler, single table), then expansion (complex)

---

**Phase 2B Status:** Ready to Begin
**Blockers:** None
**Next Action:** Create database migration files
