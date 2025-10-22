# Obsidian Black V3 - Database-Driven Demo

## 🎯 Purpose

This demo shows the **Phase 3 database-driven workflow system in action** by creating a fully functional page that loads workflows from the database instead of hardcoded config files.

**URL:** `/obsidian-black-v3`

---

## 📊 Version Comparison

| Feature | V1 (/obsidian-black) | V2 (/obsidian-black-v2) | V3 (/obsidian-black-v3) |
|---------|---------------------|-------------------------|-------------------------|
| **Workflow Source** | Hardcoded config file | Hardcoded config file | **Database** |
| **Slide Library** | ❌ No | 🟡 Partial | ✅ Yes |
| **Multi-Tenant** | ❌ No | ❌ No | ✅ Ready |
| **Customizable** | ❌ No (requires code changes) | ❌ No | ✅ Yes (via DB) |
| **Chat Integration** | ❌ No | ❌ No | ✅ Infrastructure ready |
| **Real-time Updates** | ❌ No | ❌ No | ✅ Yes (DB changes reflect immediately) |
| **Workflow Builder Ready** | ❌ No | ❌ No | ✅ Yes |

---

## 🔥 What Makes V3 Special

### 1. **Server-Side Database Fetch**
```typescript
// page.tsx (Server Component)
const config = await composeFromDatabase(
  'obsidian-black-renewal', // Workflow ID from database
  null,                     // Company ID (null = stock)
  customerContext,          // Data for hydration
  supabase
);
```

**What happens:**
1. Server fetches from `workflow_definitions` table
2. Gets `slide_sequence`: `['greeting', 'review-account', 'pricing-analysis', ...]`
3. Gets `slide_contexts`: `{ greeting: { urgency: 'high' }, ... }`
4. Loads slides from `SLIDE_LIBRARY`
5. Hydrates with customer data
6. Returns complete `WorkflowConfig`

### 2. **Real Database Integration**
The workflow is stored in Supabase:

```sql
SELECT * FROM workflow_definitions
WHERE workflow_id = 'obsidian-black-renewal'
AND company_id IS NULL; -- Stock workflow
```

Returns:
- `slide_sequence`: Array of slide IDs
- `slide_contexts`: JSONB contexts
- `is_stock_workflow`: true
- Ready to be cloned for custom company workflows

### 3. **Fallback Safety**
If database load fails, gracefully falls back to hardcoded config:

```typescript
try {
  config = await composeFromDatabase(...);
} catch (err) {
  // Fallback to obsidian-black-pricing
  config = obsidianBlackPricingConfig;
}
```

### 4. **Visual Indicators**
The page shows you what's happening:

- **Green badge**: "V3: Fully Database-Driven"
- **DB Live indicator**: Shows when loaded from database
- **Status panel**: Explains the architecture
- **Error banner**: Shows if fallback is used

---

## 🧪 Testing the Demo

### Option 1: With Database (Working)
1. Navigate to `/obsidian-black-v3`
2. Should see "✅ DB Live" badge
3. Click "Launch Workflow"
4. Workflow loaded from database!

### Option 2: Test Multi-Tenancy
```typescript
// Try fetching a company-specific workflow
const config = await composeFromDatabase(
  'obsidian-black-renewal',
  'company-uuid-here', // Specific company
  customerContext,
  supabase
);
```

Would return company's custom version or fall back to stock.

### Option 3: Test Workflow Updates
1. Update workflow in database:
   ```sql
   UPDATE workflow_definitions
   SET slide_sequence = ['greeting', 'pricing-analysis', 'workflow-summary']
   WHERE workflow_id = 'obsidian-black-renewal';
   ```

2. Refresh `/obsidian-black-v3`
3. Workflow immediately reflects changes!

---

## 🏗️ Architecture Flow

```
┌─────────────────────────────────────────────┐
│  User navigates to /obsidian-black-v3       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  page.tsx (Server Component)                │
│  - Calls composeFromDatabase()              │
│  - Fetches from Supabase                    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Database: workflow_definitions             │
│  {                                          │
│    workflow_id: 'obsidian-black-renewal',   │
│    slide_sequence: [                        │
│      'greeting',                            │
│      'review-account',                      │
│      'pricing-analysis',                    │
│      ...                                    │
│    ],                                       │
│    slide_contexts: { ... }                  │
│  }                                          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  db-composer.ts                             │
│  - Maps slide IDs to SLIDE_LIBRARY          │
│  - Applies slide contexts                   │
│  - Hydrates with customer data              │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  SLIDE_LIBRARY                              │
│  - greeting → greetingSlide()               │
│  - review-account → reviewAccountSlide()    │
│  - pricing-analysis → pricingStrategySlide()│
│  - Each builds a WorkflowSlide              │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Composed WorkflowConfig                    │
│  {                                          │
│    slides: [                                │
│      { id: 'greeting', title: '...', ...}, │
│      { id: 'review', title: '...', ...},   │
│      ...                                    │
│    ]                                        │
│  }                                          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  ObsidianBlackV3Client (Client Component)   │
│  - Receives composed config as prop         │
│  - Renders dashboard                        │
│  - Launches TaskMode with DB config         │
└─────────────────────────────────────────────┘
```

---

## 🎯 What This Demonstrates

### ✅ Phase 3A: Database Schema
- `workflow_definitions` table is live
- Multi-tenant columns working (`company_id`, `is_stock_workflow`)
- Slide data stored as JSONB

### ✅ Phase 3B: Workflow Seeding
- 6 workflows in database
- `obsidian-black-renewal` ready to use
- Seed scripts working

### ✅ Phase 3C: Database Composer
- `composeFromDatabase()` working end-to-end
- Slide library integration successful
- Customer context hydration working

### ✅ Phase 3D: Chat Infrastructure
- Chat tables exist and ready
- ChatService + LLMService created
- APIs ready for UI integration

### 🚧 Still To Build
- **Phase 3E:** Saved Actions (snooze, skip, escalate)
- **Phase 3F:** Execution Flow (start/complete APIs)
- **Phase 3G:** Chat UI Integration
- **Phase 3H:** Testing & Validation

---

## 🔍 Code Highlights

### Server Component (page.tsx)
```typescript
// This runs on the server, fetches from DB
export default async function ObsidianBlackDashboardV3() {
  const supabase = await createClient();

  const config = await composeFromDatabase(
    'obsidian-black-renewal',
    null,
    customerContext,
    supabase
  );

  return <ObsidianBlackV3Client initialWorkflowConfig={config} />;
}
```

### Database Composer
```typescript
// src/lib/workflows/db-composer.ts
export async function composeFromDatabase(
  workflowId: string,
  companyId: string | null,
  customerContext?: any,
  supabase?: SupabaseClient
) {
  // 1. Fetch from workflow_definitions
  const workflowDef = await fetchWorkflowDefinition(workflowId, companyId, supabase);

  // 2. Build composition
  const composition = {
    id: workflowDef.workflow_id,
    slideSequence: workflowDef.slide_sequence,
    slideContexts: workflowDef.slide_contexts,
  };

  // 3. Use slide library
  return buildWorkflowConfig(composition, customerContext, SLIDE_LIBRARY);
}
```

---

## 🎓 Learning Outcomes

This demo proves:

1. **Database-driven workflows work** - No code changes needed to update workflows
2. **Slide library is functional** - Reusable building blocks compose workflows
3. **Multi-tenancy ready** - Architecture supports company-specific customization
4. **Server Components + DB** - Next.js 15 server components work with Supabase
5. **Graceful fallbacks** - System handles errors elegantly

---

## 🚀 Next Steps

### For Testing
1. Visit `/obsidian-black-v3`
2. Verify "DB Live" badge appears
3. Launch workflow and test functionality
4. Compare to `/obsidian-black` and `/obsidian-black-v2`

### For Development
1. **Add more workflows** - Seed additional workflows in database
2. **Test customization** - Clone a workflow for a company
3. **Add chat UI** - Integrate ChatService into slides
4. **Build workflow builder** - Create UI to edit slide_sequence

---

## 📁 Files Created

- `/src/app/obsidian-black-v3/page.tsx` - Server component
- `/src/app/obsidian-black-v3/ObsidianBlackV3Client.tsx` - Client component
- `/docs/OBSIDIAN-BLACK-V3-DEMO.md` - This documentation

---

**Status:** ✅ Working Demo
**Phase 3 Progress:** 50% Complete (4/8 phases)
**Database Integration:** Fully Functional
