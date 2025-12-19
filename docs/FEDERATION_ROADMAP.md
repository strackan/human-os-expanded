# Human-OS Federation Roadmap

**Version:** 0.1 Draft
**Date:** December 2024
**Status:** Planning

---

## Vision

Evolve Human-OS from "Justin's personal operating system" to "A federated platform for personal operating systems" that enables:

1. **Individual forests** - Each person owns their context, relationships, and skills
2. **Company integration** - Businesses can query permitted forests for enrichment
3. **Skills inheritance** - User preferences override company defaults override public standards
4. **Privacy by design** - Data stays in forests, only flows via explicit permission grants

---

## Architecture Evolution

### Current State (v1.0)

```
┌─────────────────────────────────────┐
│ Human-OS (Single Tenant)            │
│                                     │
│ • Justin's forest only              │
│ • founder-os MCP server             │
│ • renubu-mcp (hardcoded bridge)     │
│ • Single Supabase project           │
└─────────────────────────────────────┘
```

### Target State (v2.0)

```
┌─────────────────────────────────────────────────────────────────┐
│ Human-OS Platform                                               │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Federation Layer                                            │ │
│ │ • Registry (forests, companies, permissions)                │ │
│ │ • Router (cross-forest queries)                             │ │
│ │ • Skills Resolver (layered inheritance)                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                  │
│     ┌────────────────────────┼────────────────────────┐        │
│     ▼                        ▼                        ▼        │
│ ┌─────────┐            ┌─────────┐            ┌─────────┐      │
│ │Justin's │            │Sarah's  │            │ Mike's  │      │
│ │ Forest  │            │ Forest  │            │ Forest  │      │
│ └─────────┘            └─────────┘            └─────────┘      │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Shared Resources                                            │ │
│ │ • Public skills library                                     │ │
│ │ • LinkedIn intelligence (GFT)                               │ │
│ │ • Company news feeds                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
      ┌──────────┐     ┌──────────┐     ┌──────────┐
      │ Renubu   │     │ Company  │     │ Company  │
      │ (Acme)   │     │    B     │     │    C     │
      └──────────┘     └──────────┘     └──────────┘
```

---

## Phase 1: Multi-Tenancy Foundation

**Timeline:** 2-3 weeks
**Goal:** Schema and infrastructure for multiple forests

### 1.1 Schema Changes

```sql
-- Forest registry
create table platform.forests (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- 'founder:justin', 'founder:sarah'
  display_name text not null,
  owner_email text not null,
  status text default 'active',        -- active, suspended, archived
  mcp_endpoint text,                   -- Optional custom endpoint
  config jsonb default '{}',           -- Forest-specific settings
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Federation permission grants
create table platform.federation_grants (
  id uuid primary key default gen_random_uuid(),
  grantor_forest text not null references platform.forests(slug),
  grantee_type text not null,          -- 'forest' or 'company'
  grantee_id text not null,            -- 'founder:sarah' or 'renubu:acme'
  permission text not null,            -- 'read_enrichment', 'read_relationship', 'read_skills'
  scope jsonb default '{}',            -- Optional filters (entity_types, etc.)
  granted_at timestamptz default now(),
  expires_at timestamptz,
  revoked_at timestamptz,

  unique(grantor_forest, grantee_type, grantee_id, permission)
);

-- Company registry (external consumers)
create table platform.companies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- 'renubu:acme-corp'
  display_name text not null,
  api_key_hash text not null,
  status text default 'active',
  config jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index idx_grants_grantor on platform.federation_grants(grantor_forest);
create index idx_grants_grantee on platform.federation_grants(grantee_type, grantee_id);
create index idx_grants_active on platform.federation_grants(grantor_forest)
  where revoked_at is null and (expires_at is null or expires_at > now());
```

### 1.2 Layer Scoping Update

Update existing tables to support forest isolation:

```sql
-- Add forest_id to core tables (or use layer prefix consistently)
alter table entities add column forest_slug text;
alter table context_files add column forest_slug text;
alter table relationship_context add column forest_slug text;

-- RLS policies enforce forest isolation
create policy "users_own_forest" on entities
  for all using (forest_slug = current_setting('app.current_forest'));
```

### 1.3 Deliverables

- [ ] Platform schema (forests, grants, companies)
- [ ] Migration scripts
- [ ] RLS policies for forest isolation
- [ ] Forest provisioning function
- [ ] Basic admin queries

---

## Phase 2: Federation MCP Server

**Timeline:** 2-3 weeks
**Goal:** Cross-forest query routing and aggregation

### 2.1 Federation MCP Server

```typescript
// apps/federation-mcp/src/index.ts

/**
 * Federation MCP Server
 *
 * Routes queries across multiple forests based on permission grants.
 * Aggregates and dedupes results.
 */

const federationTools: Tool[] = [
  {
    name: 'federated_enrich_contact',
    description: 'Enrich a contact from all permitted forests',
    inputSchema: {
      type: 'object',
      properties: {
        contact_identifier: { type: 'string' },  // email, linkedin URL, or name
        company_slug: { type: 'string' },        // Requesting company
      },
      required: ['contact_identifier', 'company_slug'],
    },
  },
  {
    name: 'federated_search',
    description: 'Search across all permitted forests',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        company_slug: { type: 'string' },
        entity_types: { type: 'array', items: { type: 'string' } },
      },
      required: ['query', 'company_slug'],
    },
  },
  {
    name: 'list_permitted_forests',
    description: 'List forests this company can query',
    inputSchema: {
      type: 'object',
      properties: {
        company_slug: { type: 'string' },
      },
      required: ['company_slug'],
    },
  },
];
```

### 2.2 Query Router

```typescript
// apps/federation-mcp/src/router.ts

interface ForestEndpoint {
  slug: string;
  endpoint: string;
  permissions: string[];
}

async function routeQuery(
  companySlug: string,
  queryType: string,
  params: Record<string, unknown>
): Promise<AggregatedResult> {
  // 1. Get permitted forests for this company
  const forests = await getPermittedForests(companySlug, queryType);

  // 2. Fan out queries to each forest's MCP
  const results = await Promise.allSettled(
    forests.map(forest =>
      callForestMCP(forest.endpoint, queryType, params)
    )
  );

  // 3. Aggregate results
  return aggregateResults(results, queryType);
}

function aggregateResults(
  results: PromiseSettledResult<ForestResult>[],
  queryType: string
): AggregatedResult {
  const successful = results
    .filter((r): r is PromiseFulfilledResult<ForestResult> => r.status === 'fulfilled')
    .map(r => r.value);

  // Merge strategy depends on query type
  switch (queryType) {
    case 'enrich_contact':
      return mergeEnrichment(successful);
    case 'search':
      return mergeSearch(successful);
    default:
      return { results: successful };
  }
}
```

### 2.3 Merge Strategies

```typescript
// apps/federation-mcp/src/merge.ts

/**
 * Merge enrichment results from multiple forests
 *
 * Priority: Most recent data wins, personal context preserved per-source
 */
function mergeEnrichment(results: ForestResult[]): EnrichmentResult {
  return {
    // Public data: latest wins
    linkedin: pickLatest(results, 'linkedin'),
    company_info: pickLatest(results, 'company_info'),

    // Personal context: preserve attribution
    relationship_context: results
      .filter(r => r.relationship_context)
      .map(r => ({
        source_forest: r.forest_slug,
        context: r.relationship_context,
      })),

    // Aggregated signals
    shared_connections: dedupeConnections(results),

    // Metadata
    sources: results.map(r => r.forest_slug),
    queried_at: new Date().toISOString(),
  };
}
```

### 2.4 Deliverables

- [ ] federation-mcp server
- [ ] Query router with fan-out
- [ ] Merge strategies (enrichment, search)
- [ ] Permission checking middleware
- [ ] Rate limiting per company

---

## Phase 3: Skills Inheritance

**Timeline:** 2 weeks
**Goal:** Layered skills resolution (user → company → public)

### 3.1 Skills Layers

```
Resolution order (first match wins):
1. User layer      → founder:justin/skills/notion.md
2. Company layer   → company:acme/skills/notion.md
3. Public layer    → public/skills/notion.md
```

### 3.2 Schema

```sql
-- Skills can exist at multiple layers
create table platform.skills (
  id uuid primary key default gen_random_uuid(),
  domain text not null,              -- 'notion', 'salesforce', 'slack'
  layer text not null,               -- 'founder:justin', 'company:acme', 'public'
  skill_type text not null,          -- 'tool', 'program', 'workflow'
  name text not null,
  description text,
  content jsonb not null,            -- Skill definition (Anthropic format)
  version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(domain, layer, skill_type, name)
);

-- Index for layered lookup
create index idx_skills_lookup on platform.skills(domain, skill_type, name, layer);
```

### 3.3 Resolution Function

```sql
-- Get skill with inheritance
create or replace function resolve_skill(
  p_domain text,
  p_skill_type text,
  p_name text,
  p_user_layer text,
  p_company_layer text default null
) returns jsonb as $$
declare
  v_result jsonb;
begin
  -- Try user layer first
  select content into v_result
  from platform.skills
  where domain = p_domain
    and skill_type = p_skill_type
    and name = p_name
    and layer = p_user_layer;

  if v_result is not null then return v_result; end if;

  -- Try company layer
  if p_company_layer is not null then
    select content into v_result
    from platform.skills
    where domain = p_domain
      and skill_type = p_skill_type
      and name = p_name
      and layer = p_company_layer;

    if v_result is not null then return v_result; end if;
  end if;

  -- Fall back to public
  select content into v_result
  from platform.skills
  where domain = p_domain
    and skill_type = p_skill_type
    and name = p_name
    and layer = 'public';

  return v_result;
end;
$$ language plpgsql;
```

### 3.4 MCP Tool

```typescript
{
  name: 'get_skill',
  description: 'Get a skill definition with layer inheritance',
  inputSchema: {
    type: 'object',
    properties: {
      domain: { type: 'string' },
      skill_type: { enum: ['tool', 'program', 'workflow'] },
      name: { type: 'string' },
      // Layers resolved automatically from auth context
    },
    required: ['domain', 'skill_type', 'name'],
  },
}
```

### 3.5 Deliverables

- [ ] Skills schema with layers
- [ ] Resolution function
- [ ] MCP tool for skill lookup
- [ ] Public skills library (starter set)
- [ ] Skills admin UI (optional)

---

## Phase 4: Forest Provisioning

**Timeline:** 2-3 weeks
**Goal:** Self-service forest creation and management

### 4.1 Provisioning API

```typescript
// apps/platform-api/src/routes/forests.ts

/**
 * Create a new forest for a user
 */
async function createForest(params: {
  ownerEmail: string;
  displayName: string;
  template?: 'founder' | 'minimal' | 'enterprise';
}): Promise<Forest> {
  const slug = `founder:${slugify(params.displayName)}`;

  // 1. Create forest record
  const forest = await db.forests.create({
    slug,
    display_name: params.displayName,
    owner_email: params.ownerEmail,
    config: getTemplateConfig(params.template),
  });

  // 2. Initialize schema for forest
  await initializeForestSchema(forest.id, params.template);

  // 3. Create default layers
  await createDefaultLayers(forest.id);

  // 4. Generate MCP endpoint
  const endpoint = await provisionMCPEndpoint(forest);

  return { ...forest, mcp_endpoint: endpoint };
}
```

### 4.2 Forest Templates

```typescript
const forestTemplates = {
  founder: {
    // Full Human-OS experience
    features: ['context_engine', 'knowledge_graph', 'gft', 'tasks', 'glossary'],
    default_layers: ['identity', 'state', 'protocols', 'voice'],
    mcp_tools: 'all',
  },
  minimal: {
    // Just enrichment and skills
    features: ['context_engine', 'skills'],
    default_layers: ['identity'],
    mcp_tools: ['get_session_context', 'enrich_contact', 'get_skill'],
  },
  enterprise: {
    // Team-focused, no personal stuff
    features: ['context_engine', 'knowledge_graph', 'skills'],
    default_layers: ['team', 'processes'],
    mcp_tools: ['search', 'enrich_contact', 'get_skill', 'list_team'],
  },
};
```

### 4.3 Onboarding Flow

```
1. User signs up → Create forest with template
2. Connect LinkedIn → Seed GFT with their network
3. Import existing notes → Populate context files
4. Grant permissions → Choose what to share with companies
5. Generate MCP config → For Claude Desktop / other clients
```

### 4.4 Deliverables

- [ ] Forest provisioning API
- [ ] Templates (founder, minimal, enterprise)
- [ ] Onboarding flow
- [ ] MCP endpoint generation
- [ ] Forest admin dashboard

---

## Phase 5: External Triggers (Push Events)

**Timeline:** 2 weeks
**Goal:** Human-OS pushes events to subscribed companies

### 5.1 Event Types

```typescript
type ExternalTrigger =
  | { type: 'contact_job_change'; contact_id: string; old_title: string; new_title: string; new_company: string }
  | { type: 'company_funding'; company_id: string; round: string; amount: string }
  | { type: 'contact_activity_spike'; contact_id: string; activity_type: string; count: number }
  | { type: 'relationship_decay'; contact_id: string; days_since_interaction: number }
  | { type: 'shared_connection_discovered'; contact_id: string; mutual_contact_id: string };
```

### 5.2 Subscription Model

```sql
create table platform.event_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_slug text not null references platform.companies(slug),
  event_type text not null,
  filter jsonb default '{}',          -- Optional filters
  webhook_url text not null,
  secret_hash text not null,
  status text default 'active',
  created_at timestamptz default now()
);
```

### 5.3 Event Publisher

```typescript
// Background job that checks for events and pushes to subscribers

async function publishEvents() {
  // 1. Check for new events (job changes, funding, etc.)
  const events = await detectEvents();

  // 2. For each event, find subscribers with permission
  for (const event of events) {
    const subscribers = await getSubscribers(event.type, event.entity_id);

    // 3. Push to webhook
    for (const sub of subscribers) {
      await pushWebhook(sub.webhook_url, event, sub.secret);
    }
  }
}
```

### 5.4 Deliverables

- [ ] Event detection jobs
- [ ] Subscription management API
- [ ] Webhook publisher
- [ ] Retry logic and dead letter queue
- [ ] Event history/audit log

---

## Summary Timeline

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| **Phase 1**: Multi-Tenancy | 2-3 weeks | Forest isolation, permission grants |
| **Phase 2**: Federation MCP | 2-3 weeks | Cross-forest queries |
| **Phase 3**: Skills Inheritance | 2 weeks | Layered skill resolution |
| **Phase 4**: Provisioning | 2-3 weeks | Self-service forest creation |
| **Phase 5**: Push Events | 2 weeks | External trigger webhooks |

**Total: ~10-13 weeks for full platform**

---

## Migration Path

### For Justin (existing user)

1. Current data stays in place
2. Add `forest_slug = 'founder:justin'` to existing records
3. Create forest registry entry
4. Existing MCP servers continue to work
5. Optionally migrate to new federation-mcp

### For New Users

1. Sign up → Forest provisioned automatically
2. Choose template
3. Get MCP config for Claude Desktop
4. Start using

### For Companies (Renubu)

1. Register as company in platform
2. Request permission grants from individual forests
3. Switch from renubu-mcp to federation-mcp
4. Subscribe to push events (Phase 5)

---

## Open Questions

1. **Hosting model**: Single Supabase with RLS isolation, or separate projects per forest?
2. **Pricing**: Per-forest? Per-query? Free tier?
3. **MCP hosting**: User runs their own, or platform-hosted?
4. **Data residency**: EU forests in EU region?

---

## Next Steps

1. Review and refine this roadmap
2. Prioritize phases based on Renubu timeline
3. Spike on Phase 1 schema changes
4. Decide hosting model

