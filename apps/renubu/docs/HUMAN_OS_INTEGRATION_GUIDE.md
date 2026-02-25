# Human-OS Integration Developer Guide

**Document Version:** 2.0
**Last Updated:** December 2024
**Applies To:** Renubu 0.2.0+

---

## Executive Summary

This guide explains how the Human-OS integration changes Renubu's 0.2.0 release scope and provides implementation guidance for the development team. The key insight: **Renubu remains a self-contained platform** while Human-OS provides **external enrichment** via MCP.

### What Changed

| Original Plan | Revised Architecture |
|---------------|---------------------|
| "Human OS Check-In System" built into Renubu | Human-OS is a separate system providing external data |
| Intelligence files stored in Renubu DB | Skills files stored in Human-OS with layer-based access |
| Single-source context | Triangulated context (internal + external) |

### The Win

Renubu gets the best of both worlds:
- **Internal intelligence**: User feedback, agent analysis, CRM data (stays in Renubu)
- **External intelligence**: Public LinkedIn data, funding news, career changes (from Human-OS)
- **Triangulated recommendations**: "User says stingy, but GFT says they just raised $50M"

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Scope Changes for 0.2.0](#2-scope-changes-for-020)
3. [Implementation Checklist](#3-implementation-checklist)
4. [FastMCP 2.0 Integration](#4-fastmcp-20-integration)
5. [String-Tie Integration](#5-string-tie-integration)
6. [Parking Lot Integration](#6-parking-lot-integration)
7. [External Wake Triggers](#7-external-wake-triggers)
8. [HumanOSClient Implementation](#8-humanosclient-implementation)
9. [Data Model Changes](#9-data-model-changes)
10. [Building New Context Features](#10-building-new-context-features)
11. [API Reference](#11-api-reference)
12. [Migration Path](#12-migration-path)

---

## 1. Architecture Overview

### The Triangle (Data Flow)

```
┌─────────────────────────────────────────────────────────────────────┐
│  RENUBU (Self-Contained - Own Supabase DB)                          │
│                                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                │
│  │    USER     │   │   CONTACT   │   │   COMPANY   │                │
│  │  (internal) │   │  (internal) │   │  (internal) │                │
│  │             │   │             │   │             │                │
│  │ Agent       │   │ User says:  │   │ Deal        │                │
│  │ reports:    │   │ "stingy"    │   │ history     │                │
│  │ work style, │   │ "slow"      │   │ Contract    │                │
│  │ patterns,   │   │             │   │ terms       │                │
│  │ energy      │   │ Agent sees: │   │             │                │
│  │             │   │ response    │   │             │                │
│  │             │   │ patterns    │   │             │                │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘                │
│         │                 │                 │                       │
│         └────────────┬────┴────────────────┘                        │
│                      │                                              │
│            TRIANGULATED RECOMMENDATIONS                             │
│                      │                                              │
└──────────────────────┼──────────────────────────────────────────────┘
                       │
          MCP Call: get_full_enrichment
                       │
┌──────────────────────┴──────────────────────────────────────────────┐
│  HUMAN-OS (External Enrichment Only)                                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  GFT Schema (Public/External Intelligence)                  │    │
│  │                                                             │    │
│  │  Contact:                    Company:                       │    │
│  │  - LinkedIn profile          - Funding rounds               │    │
│  │  - Headlines, about          - News, growth signals         │    │
│  │  - Recent posts              - Industry data                │    │
│  │  - Job changes               - Known contacts               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Relationship Context (Layer-Scoped Opinions)               │    │
│  │                                                             │    │
│  │  - Private opinions attached to GFT contact IDs             │    │
│  │  - Layer-based privacy (renubu:tenant-acme)                 │    │
│  │  - Types: work_style, trust, communication, etc.            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Skills Files (Anthropic Format)                            │    │
│  │                                                             │    │
│  │  - Tools: Defined capabilities                              │    │
│  │  - Programs: Multi-step workflows                           │    │
│  │  - Frontmatter: Structured metadata                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ❌ BLOCKED: founder_os.*, powerpak.*, founder:* layers            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Permission Boundaries

Human-OS uses **API key scoping** to control Renubu's access:

```sql
-- Renubu's scopes
ARRAY[
  'gft:contacts:read',        -- LinkedIn profiles
  'gft:companies:read',       -- Company data
  'relationship:renubu:*:*',  -- Full access to renubu layer opinions
  'skills:public:read',       -- Public skills files
  'skills:renubu:*:read'      -- Renubu-scoped skills files
]

-- Explicitly BLOCKED
-- 'founder_os:*'             -- Personal founder context
-- 'powerpak:*'               -- Expert configurations
-- 'relationship:founder:*'   -- Private founder opinions
```

---

## 2. Scope Changes for 0.2.0

### Original RELEASE_NOTES.md Plan

```
0.2.0 - "Human OS Check-In System"
- Daily/weekly user check-ins
- Pattern recognition across user behavior
- Personalized workflow suggestions
- Adaptive reminder timing
- Relationship strength tracking
- Longitudinal intelligence files
```

### Revised Scope

| Feature | Location | Notes |
|---------|----------|-------|
| **User check-in system** | ✅ Renubu | Coffee check-ins, onboarding feedback |
| **User context/preferences** | ✅ Renubu | Agents report on user patterns |
| **Contact context (internal)** | ✅ Renubu | User feedback + agent analysis |
| **Intelligence files** | ✅ Renubu | `IntelligenceFile` type stays |
| **Relationship strength tracking** | ✅ Renubu | Based on internal signals |
| **Pattern recognition** | ✅ Renubu | Across sessions |
| **Public LinkedIn data** | 🔄 Human-OS | Via `enrich_contact` |
| **Public company data** | 🔄 Human-OS | Via `enrich_company` |
| **Cross-system opinions** | 🔄 Human-OS | Via `relationship_context` |
| **Skills/tools definitions** | 🔄 Human-OS | Via `skills_files` |
| **Personal founder context** | ❌ Removed | Not accessible to Renubu |
| **PowerPak integration** | ❌ Removed | Not accessible to Renubu |

---

## 3. Implementation Checklist

### Current Gaps (Must Implement)

- [ ] **HumanOSClient not implemented** - Create `src/lib/mcp/clients/HumanOSClient.ts`
- [ ] **MCPManager registry not updated** - Add Human-OS to MCP server registry
- [ ] **Environment variables not configured** - Add `MCP_ENABLE_HUMAN_OS`, etc.
- [ ] **Workflow context initialization not updated** - Add enrichment to workflow init

### FastMCP 2.0 Enhancements (Should Implement)

- [ ] **Mid-workflow LLM sampling** - Use `ctx.sample()` for string-tie enrichment
- [ ] **Progress reporting** - Use `ctx.report_progress()` for parking lot operations
- [ ] **External trigger types** - Add Human-OS event triggers

### Documentation Gaps

- [x] FastMCP 2.0 capabilities documented (this guide)
- [x] String-tie/parking lot integration points documented (this guide)

---

## 4. FastMCP 2.0 Integration

FastMCP 2.0 introduces three key capabilities that enhance the Human-OS integration:

### 4.1 Mid-Workflow LLM Sampling (`ctx.sample()`)

**Use Case**: Enriching string-tie reminders that mention contacts with LinkedIn data.

```python
# In Human-OS MCP server (fastMCP 2.0 style)
@server.tool()
async def enrich_string_tie_reminder(
    ctx: Context,
    reminder_text: str,
    contact_name: Optional[str] = None
) -> str:
    """
    Enrich a string-tie reminder with external context.
    Uses mid-workflow sampling to generate triangulated insights.
    """
    # 1. Extract contact mentions if not provided
    if not contact_name:
        extraction = await ctx.sample(
            f"Extract any person names from this reminder: '{reminder_text}'. "
            "Return JSON: {\"names\": [...]}"
        )
        names = json.loads(extraction.text).get("names", [])
        contact_name = names[0] if names else None

    if not contact_name:
        return json.dumps({"enriched": False, "reason": "No contact detected"})

    # 2. Get GFT enrichment
    enrichment = await get_contact_enrichment(contact_name)

    # 3. Use ctx.sample() to triangulate insights
    if enrichment.get("found"):
        insight = await ctx.sample(
            f"Given this reminder: '{reminder_text}' and this LinkedIn data: "
            f"{json.dumps(enrichment)}, generate a brief insight (1-2 sentences) "
            "that could help the user. Focus on timing, context, or opportunity."
        )
        return json.dumps({
            "enriched": True,
            "original_reminder": reminder_text,
            "contact_data": enrichment,
            "insight": insight.text
        })

    return json.dumps({"enriched": False, "reason": "Contact not found in GFT"})
```

**Renubu Integration Point** (`src/lib/services/StringTieService.ts`):

```typescript
// When a string-tie reminder fires
async enrichReminder(stringTie: StringTie): Promise<EnrichedReminder> {
  if (!this.mcpManager.isEnabled(MCPServer.HUMAN_OS)) {
    return { original: stringTie, enriched: false };
  }

  try {
    const result = await this.mcpManager.humanOS.call('enrich_string_tie_reminder', {
      reminder_text: stringTie.reminder_text,
    });

    return {
      original: stringTie,
      enriched: result.enriched,
      insight: result.insight,
      contactData: result.contact_data,
    };
  } catch (error) {
    // Graceful degradation
    return { original: stringTie, enriched: false };
  }
}
```

### 4.2 Progress Reporting (`ctx.report_progress()`)

**Use Case**: Real-time feedback during parking lot expansion/brainstorm operations (10-30 seconds).

```python
# In Human-OS MCP server
@server.tool()
async def expand_parking_lot_idea(
    ctx: Context,
    idea_text: str,
    customer_context: Optional[dict] = None
) -> str:
    """
    Expand a parking lot idea with full analysis.
    Reports progress for long-running LLM operations.
    """
    await ctx.report_progress(0.1, "Analyzing idea structure...")

    # Step 1: Extract entities
    entities = await extract_entities(idea_text)
    await ctx.report_progress(0.3, "Extracting key entities...")

    # Step 2: Get relevant enrichment
    enrichment = {}
    if entities.get("customers"):
        await ctx.report_progress(0.4, "Fetching company data...")
        for customer in entities["customers"][:3]:
            enrichment[customer] = await get_company_enrichment(customer)

    if entities.get("contacts"):
        await ctx.report_progress(0.5, "Fetching contact data...")
        for contact in entities["contacts"][:3]:
            enrichment[contact] = await get_contact_enrichment(contact)

    await ctx.report_progress(0.6, "Generating expansion...")

    # Step 3: Generate full expansion with LLM
    expansion = await ctx.sample(
        f"Expand this idea with the following context:\n"
        f"Idea: {idea_text}\n"
        f"Enrichment: {json.dumps(enrichment)}\n"
        f"Customer context: {json.dumps(customer_context)}\n\n"
        "Generate: background, opportunities, risks, action_plan, objectives."
    )

    await ctx.report_progress(0.9, "Finalizing analysis...")

    return json.dumps({
        "expansion": parse_expansion(expansion.text),
        "enrichment_used": list(enrichment.keys()),
    })
```

**Renubu Integration Point** (`src/lib/services/ParkingLotLLMService.ts`):

```typescript
// Subscribe to progress updates in UI
async expandIdea(
  item: ParkingLotItem,
  onProgress?: (progress: number, message: string) => void
): Promise<ExpandedAnalysis> {
  if (this.mcpManager.isEnabled(MCPServer.HUMAN_OS)) {
    // Use Human-OS with progress reporting
    const result = await this.mcpManager.humanOS.callWithProgress(
      'expand_parking_lot_idea',
      {
        idea_text: item.raw_input,
        customer_context: await this.getCustomerContext(item),
      },
      onProgress // Progress callback
    );

    return {
      ...result.expansion,
      enrichmentSources: result.enrichment_used,
    };
  }

  // Fallback to local expansion
  return this.expandLocally(item);
}
```

### 4.3 External Trigger Types

FastMCP 2.0 enables new wake conditions based on Human-OS events. See [Section 7](#7-external-wake-triggers) for details.

---

## 5. String-Tie Integration

### Overview

String-ties are voice-first reminders ("tie a string around your finger"). When a string-tie mentions a contact, Human-OS can enrich it with external context.

### Integration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  User creates string-tie: "Remind me to follow up with Sarah"       │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  StringTieParser (existing) → Extracts reminder text + time         │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  NEW: HumanOSClient.enrichStringTie()                               │
│  - Detects "Sarah" is a contact                                     │
│  - Queries GFT for Sarah's LinkedIn profile                         │
│  - Uses ctx.sample() to generate insight                            │
│  - Returns: "Sarah just posted about expansion plans"               │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  String-tie reminder fires with enriched context                    │
│  "Follow up with Sarah" + "💡 Sarah posted about expansion plans"  │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation

**New types** (`src/types/string-ties.ts`):

```typescript
// Add to existing types
export interface EnrichedStringTie extends StringTie {
  enrichment?: {
    contact_name?: string;
    linkedin_headline?: string;
    recent_activity?: string;
    insight?: string;
    enriched_at?: string;
  };
}
```

**Service update** (`src/lib/services/StringTieService.ts`):

```typescript
import { HumanOSClient } from '@/lib/mcp/clients/HumanOSClient';

export class StringTieService {
  private humanOS?: HumanOSClient;

  // Call when reminder fires
  async enrichReminder(stringTie: StringTie): Promise<EnrichedStringTie> {
    if (!this.humanOS?.isEnabled()) {
      return stringTie;
    }

    try {
      const enrichment = await this.humanOS.enrichStringTie(
        stringTie.reminder_text
      );

      if (enrichment.enriched) {
        return {
          ...stringTie,
          enrichment: {
            contact_name: enrichment.contact_data?.name,
            linkedin_headline: enrichment.contact_data?.headline,
            recent_activity: enrichment.contact_data?.recent_posts?.[0]?.content,
            insight: enrichment.insight,
            enriched_at: new Date().toISOString(),
          },
        };
      }
    } catch (error) {
      console.warn('String-tie enrichment failed:', error);
    }

    return stringTie;
  }
}
```

---

## 6. Parking Lot Integration

### Overview

The parking lot is an intelligent idea capture system with LLM enhancement. Human-OS integration adds:
- External context during expansion
- Progress reporting for long operations
- External wake triggers

### Integration Points

#### 6.1 Expansion with Human-OS Context

When expanding a parking lot idea, pull in GFT data for mentioned entities:

```typescript
// src/lib/services/ParkingLotLLMService.ts
async expandWithHumanOS(
  item: ParkingLotItem,
  onProgress?: ProgressCallback
): Promise<ExpandedAnalysis> {
  const humanOS = this.mcpManager.getClient<HumanOSClient>('human-os');

  if (!humanOS?.isEnabled()) {
    return this.expandLocally(item);
  }

  // Extract entities from idea
  const entities = item.extracted_entities;

  // Enrich with Human-OS data
  const enrichment: Record<string, unknown> = {};

  onProgress?.(0.2, 'Fetching external context...');

  // Get company data
  if (entities.customers?.length) {
    for (const customer of entities.customers.slice(0, 3)) {
      const data = await humanOS.enrichCompany({ company_name: customer });
      if (data.found) enrichment[customer] = data.company;
    }
  }

  onProgress?.(0.4, 'Fetching contact data...');

  // Get contact data
  if (entities.contacts?.length) {
    for (const contact of entities.contacts.slice(0, 3)) {
      const data = await humanOS.enrichContact({ contact_name: contact });
      if (data.found) enrichment[contact] = data.contact;
    }
  }

  onProgress?.(0.6, 'Generating expansion...');

  // Generate expansion with enriched context
  const expansion = await this.generateExpansion(item, enrichment);

  onProgress?.(1.0, 'Complete');

  return {
    ...expansion,
    enrichmentSources: Object.keys(enrichment),
  };
}
```

#### 6.2 Progress Reporting UI

Update `ParkingLotExpansionView.tsx` to show progress:

```tsx
// src/components/parking-lot/ParkingLotExpansionView.tsx
const [progress, setProgress] = useState({ value: 0, message: '' });
const [isExpanding, setIsExpanding] = useState(false);

const handleExpand = async () => {
  setIsExpanding(true);
  setProgress({ value: 0, message: 'Starting expansion...' });

  try {
    const result = await parkingLotService.expandWithHumanOS(
      item,
      (value, message) => setProgress({ value, message })
    );
    setExpansion(result);
  } finally {
    setIsExpanding(false);
  }
};

// In render
{isExpanding && (
  <div className="expansion-progress">
    <Progress value={progress.value * 100} />
    <span>{progress.message}</span>
  </div>
)}
```

---

## 7. External Wake Triggers

### New Trigger Types from Human-OS

Human-OS can fire wake triggers based on external events:

| Trigger Type | Source | Description |
|--------------|--------|-------------|
| `company_funding_event` | GFT | Company announces funding round |
| `contact_job_change` | GFT | Contact changes jobs/gets promoted |
| `linkedin_activity_spike` | GFT | Contact becomes unusually active |
| `company_news_event` | GFT | Company in the news |
| `relationship_opinion_added` | Human-OS | New opinion added about contact |

### Schema Update

Add to `src/types/wake-triggers.ts`:

```typescript
// New external event types from Human-OS
export type ExternalEventType =
  | 'company_funding_event'
  | 'contact_job_change'
  | 'linkedin_activity_spike'
  | 'company_news_event'
  | 'relationship_opinion_added';

export interface ExternalEventConfig {
  eventType: ExternalEventType;

  // For company events
  companyId?: string;
  companyName?: string;

  // For contact events
  contactEntityId?: string;
  contactName?: string;

  // Thresholds
  activityThreshold?: number;  // For linkedin_activity_spike
  fundingMinAmount?: number;   // For company_funding_event

  // Human-OS layer for opinion events
  layer?: string;
}

// Add to existing EventTriggerConfig union
export type EventTriggerConfig =
  | WorkflowActionCompletedConfig
  | UsageThresholdConfig
  | ManualEventConfig
  | ExternalEventConfig;  // NEW
```

### TriggerEvaluator Update

Add to `src/lib/services/TriggerEvaluator.ts`:

```typescript
// New method for external event evaluation
private static async evaluateExternalEvent(
  config: ExternalEventConfig,
  workflowExecutionId: string,
  supabase: SupabaseClient,
  humanOS: HumanOSClient
): Promise<{ triggered: boolean; reason?: string }> {
  if (!humanOS.isEnabled()) {
    return { triggered: false, reason: 'Human-OS not enabled' };
  }

  switch (config.eventType) {
    case 'company_funding_event':
      return humanOS.checkFundingEvent(
        config.companyId || config.companyName!,
        config.fundingMinAmount
      );

    case 'contact_job_change':
      return humanOS.checkJobChange(
        config.contactEntityId || config.contactName!
      );

    case 'linkedin_activity_spike':
      return humanOS.checkActivitySpike(
        config.contactEntityId || config.contactName!,
        config.activityThreshold || 3 // Default: 3x normal
      );

    case 'company_news_event':
      return humanOS.checkCompanyNews(
        config.companyId || config.companyName!
      );

    case 'relationship_opinion_added':
      return humanOS.checkNewOpinion(
        config.contactEntityId!,
        config.layer || 'renubu:*'
      );

    default:
      return { triggered: false, reason: `Unknown external event: ${config.eventType}` };
  }
}
```

### Webhook Integration

Human-OS can push events to Renubu via webhook:

```typescript
// src/app/api/webhooks/human-os/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TriggerEvaluator } from '@/lib/services/TriggerEvaluator';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-human-os-signature');

  // Verify webhook signature
  if (!verifySignature(signature, await req.text())) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = await req.json();

  // Event types from Human-OS
  switch (event.type) {
    case 'contact.job_changed':
      await TriggerEvaluator.fireExternalEvent('contact_job_change', {
        contactEntityId: event.data.entity_id,
        contactName: event.data.name,
      });
      break;

    case 'company.funding_announced':
      await TriggerEvaluator.fireExternalEvent('company_funding_event', {
        companyId: event.data.company_id,
        companyName: event.data.name,
        fundingAmount: event.data.amount,
      });
      break;

    case 'contact.activity_spike':
      await TriggerEvaluator.fireExternalEvent('linkedin_activity_spike', {
        contactEntityId: event.data.entity_id,
        activityLevel: event.data.activity_multiplier,
      });
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## 8. HumanOSClient Implementation

### Full Client Implementation

Create `src/lib/mcp/clients/HumanOSClient.ts`:

```typescript
/**
 * Human-OS MCP Client
 *
 * Provides typed access to Human-OS enrichment and context tools.
 * Implements graceful degradation when Human-OS is unavailable.
 */

import { MCPClient, MCPCallOptions } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface EnrichContactParams {
  contact_name?: string;
  contact_email?: string;
  contact_linkedin_url?: string;
  company_name?: string;
}

export interface EnrichCompanyParams {
  company_name?: string;
  company_domain?: string;
  company_linkedin_url?: string;
}

export interface ContactEnrichmentResult {
  found: boolean;
  contact?: {
    name: string;
    linkedin_url?: string;
    headline?: string;
    about?: string;
    company?: string;
    recent_posts?: Array<{
      content: string;
      posted_at: string;
      engagement?: { likes: number; comments: number };
    }>;
  };
}

export interface CompanyEnrichmentResult {
  found: boolean;
  company?: {
    name: string;
    industry?: string;
    employee_count?: number;
    domain?: string;
    known_contacts?: Array<{ name: string; title: string }>;
    recent_funding?: {
      amount: number;
      date: string;
      round: string;
    };
  };
}

export interface FullEnrichmentResult {
  contact: ContactEnrichmentResult;
  company: CompanyEnrichmentResult;
  triangulation_hints: {
    shared_connections: string[];
    industry_context: string;
    relationship_signals: string[];
  };
}

export interface OpinionParams {
  contact_entity_id: string;
  layer: string;
  opinion_type?: string;
  content?: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
  confidence?: 'low' | 'medium' | 'high';
}

export interface OpinionSummary {
  has_opinions: boolean;
  opinion_types: string[];
  overall_sentiment?: string;
  key_points: string[];
}

export interface ProgressCallback {
  (progress: number, message: string): void;
}

// ============================================================================
// CLIENT
// ============================================================================

export class HumanOSClient implements MCPClient {
  name = 'human-os';
  private enabled: boolean;
  private baseClient: MCPBaseClient;

  constructor(mcpBaseClient: MCPBaseClient) {
    this.baseClient = mcpBaseClient;
    this.enabled = process.env.MCP_ENABLE_HUMAN_OS === 'true';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // ============================================================================
  // ENRICHMENT TOOLS
  // ============================================================================

  async enrichContact(params: EnrichContactParams): Promise<ContactEnrichmentResult> {
    if (!this.enabled) {
      return { found: false };
    }

    return this.call('enrich_contact', params);
  }

  async enrichCompany(params: EnrichCompanyParams): Promise<CompanyEnrichmentResult> {
    if (!this.enabled) {
      return { found: false };
    }

    return this.call('enrich_company', params);
  }

  async getFullEnrichment(
    params: EnrichContactParams & EnrichCompanyParams
  ): Promise<FullEnrichmentResult> {
    if (!this.enabled) {
      return {
        contact: { found: false },
        company: { found: false },
        triangulation_hints: {
          shared_connections: [],
          industry_context: '',
          relationship_signals: [],
        },
      };
    }

    return this.call('get_full_enrichment', params);
  }

  // ============================================================================
  // RELATIONSHIP CONTEXT TOOLS
  // ============================================================================

  async getContactOpinions(contactEntityId: string, layer: string): Promise<Opinion[]> {
    if (!this.enabled) return [];
    return this.call('get_contact_opinions', {
      contact_entity_id: contactEntityId,
      layer,
    });
  }

  async upsertOpinion(params: OpinionParams): Promise<{ success: boolean; id?: string }> {
    if (!this.enabled) return { success: false };
    return this.call('upsert_opinion', params);
  }

  async searchOpinions(
    query: string,
    layer: string,
    limit?: number
  ): Promise<Opinion[]> {
    if (!this.enabled) return [];
    return this.call('search_opinions', { query, layer, limit });
  }

  async getOpinionSummary(contactEntityId: string, layer: string): Promise<OpinionSummary> {
    if (!this.enabled) {
      return { has_opinions: false, opinion_types: [], key_points: [] };
    }
    return this.call('get_opinion_summary', {
      contact_entity_id: contactEntityId,
      layer,
    });
  }

  // ============================================================================
  // SKILLS TOOLS
  // ============================================================================

  async listSkillsFiles(layer?: string, sourceSystem?: string) {
    if (!this.enabled) return { files: [], total: 0 };
    return this.call('list_skills_files', { layer, source_system: sourceSystem });
  }

  async getSkillsFile(fileId: string) {
    if (!this.enabled) return null;
    return this.call('get_skills_file', { file_id: fileId });
  }

  async searchSkillsByTool(toolName: string, layer?: string) {
    if (!this.enabled) return { results: [] };
    return this.call('search_skills_by_tool', { tool_name: toolName, layer });
  }

  // ============================================================================
  // STRING-TIE ENRICHMENT (FastMCP 2.0)
  // ============================================================================

  async enrichStringTie(reminderText: string): Promise<{
    enriched: boolean;
    contact_data?: ContactEnrichmentResult['contact'];
    insight?: string;
  }> {
    if (!this.enabled) {
      return { enriched: false };
    }

    return this.call('enrich_string_tie_reminder', {
      reminder_text: reminderText,
    });
  }

  // ============================================================================
  // PARKING LOT EXPANSION (FastMCP 2.0 with progress)
  // ============================================================================

  async expandParkingLotIdea(
    ideaText: string,
    customerContext?: Record<string, unknown>,
    onProgress?: ProgressCallback
  ): Promise<{
    expansion: ExpandedAnalysis;
    enrichment_used: string[];
  }> {
    if (!this.enabled) {
      throw new Error('Human-OS not enabled');
    }

    return this.callWithProgress(
      'expand_parking_lot_idea',
      { idea_text: ideaText, customer_context: customerContext },
      onProgress
    );
  }

  // ============================================================================
  // EXTERNAL EVENT CHECKS (for wake triggers)
  // ============================================================================

  async checkFundingEvent(
    companyIdOrName: string,
    minAmount?: number
  ): Promise<{ triggered: boolean; reason?: string }> {
    if (!this.enabled) return { triggered: false, reason: 'Human-OS not enabled' };
    return this.call('check_funding_event', {
      company: companyIdOrName,
      min_amount: minAmount,
    });
  }

  async checkJobChange(contactIdOrName: string): Promise<{ triggered: boolean; reason?: string }> {
    if (!this.enabled) return { triggered: false, reason: 'Human-OS not enabled' };
    return this.call('check_job_change', { contact: contactIdOrName });
  }

  async checkActivitySpike(
    contactIdOrName: string,
    threshold?: number
  ): Promise<{ triggered: boolean; reason?: string }> {
    if (!this.enabled) return { triggered: false, reason: 'Human-OS not enabled' };
    return this.call('check_activity_spike', {
      contact: contactIdOrName,
      threshold,
    });
  }

  async checkCompanyNews(companyIdOrName: string): Promise<{ triggered: boolean; reason?: string }> {
    if (!this.enabled) return { triggered: false, reason: 'Human-OS not enabled' };
    return this.call('check_company_news', { company: companyIdOrName });
  }

  async checkNewOpinion(
    contactEntityId: string,
    layer: string
  ): Promise<{ triggered: boolean; reason?: string }> {
    if (!this.enabled) return { triggered: false, reason: 'Human-OS not enabled' };
    return this.call('check_new_opinion', {
      contact_entity_id: contactEntityId,
      layer,
    });
  }

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================

  private async call<T>(tool: string, params: Record<string, unknown>): Promise<T> {
    try {
      return await this.baseClient.callTool(this.name, tool, params);
    } catch (error) {
      console.error(`[HumanOSClient] Error calling ${tool}:`, error);
      throw error;
    }
  }

  private async callWithProgress<T>(
    tool: string,
    params: Record<string, unknown>,
    onProgress?: ProgressCallback
  ): Promise<T> {
    try {
      return await this.baseClient.callToolWithProgress(
        this.name,
        tool,
        params,
        onProgress
      );
    } catch (error) {
      console.error(`[HumanOSClient] Error calling ${tool} with progress:`, error);
      throw error;
    }
  }
}
```

### MCPManager Update

Add to `src/lib/mcp/MCPManager.ts`:

```typescript
import { HumanOSClient } from './clients/HumanOSClient';

export enum MCPServer {
  // ... existing servers
  HUMAN_OS = 'human-os',
}

// In the registry initialization
const humanOSClient = new HumanOSClient(this.baseClient);

this.registry.set(MCPServer.HUMAN_OS, {
  server: MCPServer.HUMAN_OS,
  enabled: process.env.MCP_ENABLE_HUMAN_OS === 'true',
  client: humanOSClient,
});

// Typed accessor
get humanOS(): HumanOSClient {
  return this.getClient<HumanOSClient>(MCPServer.HUMAN_OS)!;
}
```

### Environment Configuration

Add to `.env.local`:

```bash
# Human-OS Integration
MCP_ENABLE_HUMAN_OS=true
HUMAN_OS_SUPABASE_URL=https://your-human-os.supabase.co
HUMAN_OS_SUPABASE_SERVICE_KEY=your-service-key

# Default tenant layer for relationship context
RENUBU_TENANT_LAYER=renubu:tenant-default

# Optional: Default owner for opinions
DEFAULT_OWNER_ID=uuid-for-opinion-ownership

# Webhook secret for Human-OS events
HUMAN_OS_WEBHOOK_SECRET=your-webhook-secret
```

---

## 9. Data Model Changes

### Human-OS Tables (Reference Only)

These tables exist in Human-OS, not Renubu:

```sql
-- relationship_context: Private opinions about contacts
CREATE TABLE relationship_context (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL,
  contact_entity_id UUID NOT NULL,
  gft_contact_id UUID,
  opinion_type TEXT NOT NULL,
  content TEXT NOT NULL,
  sentiment TEXT,
  confidence TEXT DEFAULT 'medium',
  evidence TEXT[],
  layer TEXT NOT NULL,
  source_system TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- context_files: Enhanced for skills files
ALTER TABLE context_files ADD COLUMN file_type TEXT;
ALTER TABLE context_files ADD COLUMN frontmatter JSONB;
ALTER TABLE context_files ADD COLUMN tools_count INTEGER;
ALTER TABLE context_files ADD COLUMN programs_count INTEGER;

-- skills_tools: Normalized tool definitions
CREATE TABLE skills_tools (
  id UUID PRIMARY KEY,
  context_file_id UUID REFERENCES context_files(id),
  name TEXT NOT NULL,
  description TEXT,
  parameters JSONB
);

-- skills_programs: Normalized program definitions
CREATE TABLE skills_programs (
  id UUID PRIMARY KEY,
  context_file_id UUID REFERENCES context_files(id),
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB
);
```

### Renubu Schema Updates

Add to `src/types/wake-triggers.ts` (external event types already covered in Section 7).

Optional: Add Human-OS entity link to IntelligenceFile:

```typescript
// src/types/talent.ts
export interface IntelligenceFile {
  // ... existing fields

  // NEW: Link to Human-OS for cross-system enrichment
  humanOsEntityId?: string;
  humanOsLastEnriched?: string;
}
```

---

## 10. Building New Context Features

### Pattern: Adding Industry Context

When building new context features (e.g., "Industries"), follow this pattern:

#### 1. Define the Human-OS Schema

```sql
-- In Human-OS migrations
CREATE TABLE industry_context (
  id UUID PRIMARY KEY,
  industry_code TEXT NOT NULL,
  industry_name TEXT NOT NULL,
  market_size JSONB,
  growth_rate NUMERIC,
  key_trends TEXT[],
  major_players TEXT[],
  compliance_requirements TEXT[],
  typical_renewal_cycles TEXT,
  common_objections TEXT[],
  success_metrics TEXT[],
  layer TEXT NOT NULL,
  source_system TEXT NOT NULL,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

#### 2. Add MCP Tools in Human-OS

See `human-os/apps/renubu-mcp/` for examples.

#### 3. Update Renubu's HumanOSClient

```typescript
// In HumanOSClient
async getIndustryContext(industryCode: string) {
  if (!this.enabled) return null;
  return this.call('get_industry_context', { industry_code: industryCode });
}
```

#### 4. Integrate into Workflows

```typescript
async initializeWorkflowContext(customerId: string) {
  const customer = await loadCustomer(customerId);

  let industryContext = null;
  if (customer.industryCode && this.humanOS.isEnabled()) {
    industryContext = await this.humanOS.getIndustryContext(customer.industryCode);
  }

  return { customer, industryContext };
}
```

### Checklist for New Context Features

- [ ] Define schema in Human-OS with appropriate layer support
- [ ] Create tool functions in `human-os/apps/renubu-mcp/src/tools/`
- [ ] Add MCP tool definitions with input schemas
- [ ] Add handlers in the switch statement
- [ ] Update Renubu's HumanOSClient with new methods
- [ ] Add API key scopes for the new resource
- [ ] Integrate into relevant workflows
- [ ] Add graceful degradation (feature works without Human-OS)
- [ ] Document in INSTRUCTIONS.md

---

## 11. API Reference

### Available MCP Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `enrich_contact` | LinkedIn profile data | `contact_name` OR `contact_email` OR `contact_linkedin_url` |
| `enrich_company` | Company data | `company_name` OR `company_domain` OR `company_linkedin_url` |
| `get_full_enrichment` | Complete enrichment | At least one contact or company identifier |
| `get_contact_opinions` | All opinions for a contact | `contact_entity_id`, `layer` |
| `upsert_opinion` | Create/update opinion | `contact_entity_id`, `opinion_type`, `content`, `layer` |
| `delete_opinion` | Remove opinion | `opinion_id`, `layer` |
| `search_opinions` | Keyword search | `query`, `layer` |
| `get_opinion_summary` | Quick summary | `contact_entity_id`, `layer` |
| `list_skills_files` | List skills files | (optional) `layer`, `source_system` |
| `get_skills_file` | Full skills file detail | `file_id` |
| `search_skills_by_tool` | Find by tool name | `tool_name` |
| `get_entity_skills` | Skills for person | `entity_id` |
| `list_available_tools` | Discovery | (optional) `layer` |

### FastMCP 2.0 Tools (New)

| Tool | Description | Progress Reporting |
|------|-------------|-------------------|
| `enrich_string_tie_reminder` | Enrich reminder with contact data | No (fast) |
| `expand_parking_lot_idea` | Full idea expansion with context | Yes (10-30s) |
| `check_funding_event` | Wake trigger: company funding | No |
| `check_job_change` | Wake trigger: contact job change | No |
| `check_activity_spike` | Wake trigger: LinkedIn activity | No |
| `check_company_news` | Wake trigger: company in news | No |
| `check_new_opinion` | Wake trigger: new opinion added | No |

---

## 12. Migration Path

### Phase 1: Foundation (Week 1)

1. Create `HumanOSClient.ts` with full implementation
2. Add to MCP manager registry
3. Add environment variables
4. Test connection

### Phase 2: Workflow Integration (Week 2)

1. Add enrichment to workflow initialization
2. Implement triangulation logic
3. Update UI to show external insights
4. Add graceful degradation

### Phase 3: String-Tie + Parking Lot (Week 3)

1. Add string-tie enrichment on reminder fire
2. Add parking lot expansion with progress
3. Update UI components

### Phase 4: External Wake Triggers (Week 4)

1. Add new trigger types to TriggerEvaluator
2. Set up Human-OS webhook endpoint
3. Test trigger flows

### Testing at Each Phase

```typescript
describe('Human-OS Integration', () => {
  it('should enrich contact from Human-OS', async () => {
    const result = await humanOS.enrichContact({
      contact_name: 'Jane Smith',
      company_name: 'Acme Corp',
    });
    expect(result.found).toBe(true);
  });

  it('should gracefully handle Human-OS unavailable', async () => {
    process.env.MCP_ENABLE_HUMAN_OS = 'false';
    const context = await workflow.initializeContext(customerId);
    expect(context.internal).toBeDefined();
    expect(context.external).toBeNull();
  });

  it('should enrich string-tie with contact data', async () => {
    const enriched = await stringTieService.enrichReminder({
      reminder_text: 'Follow up with Sarah about the proposal',
    });
    expect(enriched.enrichment?.contact_name).toBe('Sarah');
  });

  it('should report progress during parking lot expansion', async () => {
    const progressUpdates: number[] = [];
    await parkingLot.expandWithHumanOS(
      item,
      (progress) => progressUpdates.push(progress)
    );
    expect(progressUpdates).toContain(0.6);
    expect(progressUpdates).toContain(1.0);
  });
});
```

---

## Appendix: Quick Reference

### Files to Create in Renubu

```
src/lib/mcp/clients/HumanOSClient.ts    # Full MCP client
src/lib/mcp/types/humanOS.ts            # Type definitions
src/app/api/webhooks/human-os/route.ts  # Webhook handler
```

### Files to Modify in Renubu

```
src/lib/mcp/MCPManager.ts                           # Add Human-OS to registry
src/lib/services/StringTieService.ts                # Add enrichment
src/lib/services/ParkingLotLLMService.ts            # Add Human-OS expansion
src/lib/services/TriggerEvaluator.ts                # Add external events
src/types/wake-triggers.ts                          # Add external event types
src/components/parking-lot/ParkingLotExpansionView.tsx  # Progress UI
.env.local                                          # Environment config
```

### Human-OS MCP Server Location

```
human-os/apps/renubu-mcp/
├── src/
│   ├── index.ts                        # MCP server entry (13 tools)
│   └── tools/
│       ├── enrichment.ts               # Contact/company enrichment
│       ├── relationship.ts             # Opinion CRUD
│       └── skills.ts                   # Skills file queries
├── INSTRUCTIONS.md                     # Usage documentation
└── package.json
```

### Key Environment Variables

```bash
# Required
MCP_ENABLE_HUMAN_OS=true
HUMAN_OS_SUPABASE_URL=https://xxx.supabase.co
HUMAN_OS_SUPABASE_SERVICE_KEY=eyJxxx

# Optional
RENUBU_TENANT_LAYER=renubu:tenant-default
DEFAULT_OWNER_ID=uuid-for-opinions
HUMAN_OS_WEBHOOK_SECRET=your-secret
```

---

## Questions?

For architecture questions, refer to the Human-OS plan document:
`human-os/.claude/plans/spicy-stargazing-raccoon.md`

For MCP tool details, see:
`human-os/apps/renubu-mcp/INSTRUCTIONS.md`
