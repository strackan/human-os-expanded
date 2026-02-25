# Component Registry & Refactor Candidates

## Component Registry System

### Files
1. **`src/components/artifacts/componentRegistry.ts`** (192 lines)
   - Metadata registry with component info
   - Fields: `name`, `path`, `label`, `category`
   - **26 components registered**
   - No versioning system currently

2. **`src/components/artifacts/componentImports.ts`** (31 lines)
   - Runtime component mapping
   - Pre-imports components to avoid dynamic imports
   - **10 components actually imported** (others commented out as TODO)

### Registered Components by Category

#### Pricing (2)
- PricingRecommendation
- PriceRecommendationFlat

#### Contracts (3)
- ViewContractEnterpriseBasic
- ViewContractEnterprise
- ContractWorkflowAlert
- ViewContractDetails

#### Expansion (1)
- UsageUpsellWorkflow

#### Campaigns (2)
- PlgPriceIncreaseTest
- AutomatedPLGCampaigns

#### Dashboards (4)
- RenewalsDashboard
- ExpansionDashboard-qtr
- TeamForecast-qtr
- CSMDashboard ✅ *Recently refactored*

#### Chat (2)
- ChatTemplate
- ChatQuote

#### Workflows (8)
- TaskModeAdvanced (old system)
- TaskModeCustom (old system)
- RenewalChatWorkflow
- PlanningChecklistArtifact
- PlanningChecklistEnhancedArtifact
- PlanSummaryArtifact

#### Strategy (1)
- ContactStrategyArtifact

#### Artifact Demos (6)
- PlanningChecklistDemo
- ContactStrategyDemo
- ContractOverviewDemo
- PricingAnalysisDemo
- PlanSummaryDemo
- AllArtifactsMasterDemo

---

## 🚨 Issues with Current Registry

### 1. **No Versioning**
- No version tracking for components
- No changelog or deprecation warnings
- Can't track which version is production-ready

### 2. **Mismatch: Registry vs Imports**
- Registry lists 26 components
- Only 10 actually imported in componentImports.ts
- 16 components have TODO comments (not yet imported)

### 3. **Old System Still Registered**
- TaskModeAdvanced (old, should point to new TaskMode)
- TaskModeCustom (old system)
- Demo components point to archived pages

---

## Files Over 500 Lines (Refactor Candidates)

After refactoring TaskMode (1,436 → 458) and CSMDashboard (818 → 278):

### Top 20 Largest Files

| Lines | File | Category | Notes |
|-------|------|----------|-------|
| 1,248 | `workflows/config/configs/DynamicChatFixed.ts` | Config | Config file, may be data-heavy |
| 1,056 | `workflows/TaskModeAdvanced.tsx` | Component | **Old system** - kept for compatibility |
| 968 | `ArtifactGallery.tsx` | Component | Used by `/artifacts/gallery` |
| 907 | `workflows/components/ChatInterface.tsx` | Component | **Refactor candidate** |
| 863 | `workflows/config/configs/DynamicChatFixedTemplated.ts` | Config | Config file |
| 863 | `workflows/config/artifactTemplates.ts` | Config | Templates |
| 817 | `workflows/components/ArtifactsPanel.tsx` | Component | **Refactor candidate** |
| 776 | `customers/CustomerList.tsx` | Component | **Refactor candidate** |
| 769 | `workflows/WorkflowExecutor.tsx` | Component | Core workflow engine |
| 734 | `workflows/config/configs/AllArtifactsMasterDemo.ts` | Config | Demo config |
| 704 | `AccountOverviewArtifact.tsx` | Component | **Refactor candidate** |
| 643 | `chat/ChatQuote.tsx` | Component | **Refactor candidate** |
| 620 | `QuoteArtifact.tsx` | Component | Likely related to ChatQuote |
| 594 | `TaskMode/hooks/useTaskModeState.ts` | Hook | ✅ New modular (already optimized) |
| 565 | `workflows/sections/ChatRenderer.tsx` | Component | **Refactor candidate** |
| 559 | `workflows/artifacts/ArtifactRenderer.tsx` | Component | **Refactor candidate** |
| 547 | `RenewalChatWorkflow.tsx` | Component | **Refactor candidate** |
| 526 | `customers/ImpactEngineersLayout.tsx` | Layout | **Refactor candidate** |
| 526 | `workflows/config/WorkflowConfig.ts` | Config | Type definitions |
| 524 | `workflows/config/configs/PricingAnalysisDemoConfig.ts` | Config | Demo config |

### Recommended Refactor Priority

#### High Priority (Active components > 700 lines)
1. **ChatInterface.tsx** (907 lines)
   - Core chat component
   - Likely has state, UI, and handlers mixed
   - Pattern: Extract state to hook + separate UI

2. **ArtifactsPanel.tsx** (817 lines)
   - Panel for displaying artifacts
   - Similar to TaskMode (should use same pattern)

3. **CustomerList.tsx** (776 lines)
   - Customer listing component
   - Extract data fetching, filtering, pagination logic

4. **AccountOverviewArtifact.tsx** (704 lines)
   - Account overview display
   - Extract data transformation logic

#### Medium Priority (500-700 lines)
5. **ChatQuote.tsx** (643 lines) + **QuoteArtifact.tsx** (620 lines)
   - Related quote components
   - Potential for shared logic extraction

6. **ChatRenderer.tsx** (565 lines)
   - Chat rendering logic
   - Extract rendering strategies

7. **ArtifactRenderer.tsx** (559 lines)
   - Artifact rendering logic
   - Similar to ChatRenderer

8. **RenewalChatWorkflow.tsx** (547 lines)
   - Workflow component
   - Extract workflow state management

#### Lower Priority (Layouts, may be legitimately large)
9. **ImpactEngineersLayout.tsx** (526 lines)
10. Customer layout pages

---

## Recommendation: Add Versioning System

### Proposed Structure
```typescript
export interface ComponentItem {
  name: string;
  path: string;
  label: string;
  category?: string;

  // NEW FIELDS
  version?: string;              // Semantic version (e.g., "2.0.0")
  status?: 'active' | 'deprecated' | 'archived';
  replacedBy?: string;           // If deprecated, what replaces it
  lastUpdated?: string;          // ISO date
  refactoredFrom?: string;       // Link to old version if refactored
}
```

### Example Entry (Updated)
```typescript
{
  name: 'CSMDashboard',
  path: '@/components/artifacts/dashboards/CSMDashboard',
  label: 'CSM Dashboard with Task Mode',
  category: 'Dashboards',
  version: '2.0.0',
  status: 'active',
  lastUpdated: '2025-10-20',
  refactoredFrom: 'archive/refactoring-2025-10-20/CSMDashboard-v1.tsx'
},
{
  name: 'TaskModeAdvanced',
  path: '@/components/artifacts/workflows/TaskModeAdvanced',
  label: 'Task Mode - Advanced Interface',
  category: 'Workflows',
  version: '1.0.0',
  status: 'deprecated',
  replacedBy: 'TaskMode',
  lastUpdated: '2025-10-20'
}
```

---

*Generated: 2025-10-20*
*After TaskMode & CSM Dashboard refactoring*
