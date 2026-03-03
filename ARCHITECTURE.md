# HumanOS Platform Architecture

## System Overview

HumanOS is a contextual intelligence platform. At its core: a knowledge graph, a privacy model, and a set of services that let AI operate on your real professional context. Every product in the portfolio is a different lens on the same data spine.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DELIVERY LAYER                              │
│   MCP Protocol  ·  REST API (/v1/*)  ·  Natural Language (do())   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────────┐
│                      PRODUCTS                                       │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │  Renubu  │  │ Fancy Robot  │  │   GFT   │  │    GoodHang     │ │
│  │ Workflow │  │ + ARI        │  │ Network │  │   Assessment    │ │
│  │   SaaS   │  │ AI Visibility│  │  Intel  │  │   + Community   │ │
│  └────┬─────┘  └──────┬───────┘  └────┬────┘  └───────┬─────────┘ │
│       │               │               │               │            │
│  ┌────┴───┐     ┌─────┴─────┐   ┌─────┴────┐   ┌─────┴──────┐   │
│  │PowerPak│     │ FounderOS │   │Creativity│   │  Roadtrip   │   │
│  │ Expert │     │ Personal  │   │ Journal  │   │   Events    │   │
│  │Knowledge│    │Productivity│  │          │   │             │   │
│  └────┬───┘     └─────┬─────┘  └────┬─────┘  └─────────────┘   │
│       │               │              │                            │
└───────┴───────────────┴──────────────┴────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────────┐
│                     CONTEXT LAYER (HumanOS Core)                    │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │Context Engine│  │Knowledge     │  │  Privacy Model           │  │
│  │ Markdown +   │  │  Graph       │  │  Layer-based access      │  │
│  │ Wiki Links   │  │ Entity ↔     │  │  public · tenant ·      │  │
│  │              │  │  Relations   │  │  founder · prompts       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Services     │  │ Tools        │  │  Analysis                │  │
│  │ Task · Queue │  │ defineTool() │  │  Emotion · Interview ·   │  │
│  │ Alias ·      │  │ → MCP + REST │  │  Archetype · GoodHang   │  │
│  │ Transcript   │  │ + do() + alias│ │  scoring                │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────────┐
│                     STORAGE LAYER                                   │
│                                                                     │
│  Supabase PostgreSQL          Supabase Storage       Neo4j          │
│  ├── public.entities          (markdown contexts,    (PowerPak      │
│  ├── public.context_files      transcripts,           knowledge     │
│  ├── public.entity_links       raw content)           graph)        │
│  ├── public.interactions                                            │
│  ├── public.identity_packs                          SQLite          │
│  ├── human_os.tasks                                 (GFT local,     │
│  ├── human_os.queue_items                            Creativity     │
│  ├── human_os.aliases                                Journal)       │
│  └── human_os.transcripts                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### How Context Moves Between Products

```
LinkedIn Profile                   Call Recording
      │                                  │
      ▼                                  ▼
┌──────────┐                    ┌──────────────────┐
│   GFT    │──── entity ────→  │  TranscriptService │
│ Extension│   (person,        │  (ingest → index   │
│ + CRM    │    company)       │   → sentiment)     │
└──────────┘                   └────────┬───────────┘
      │                                 │
      ▼                                 ▼
┌──────────────────────────────────────────────────┐
│              ENTITY SPINE                         │
│                                                   │
│  person ←→ company ←→ project ←→ goal            │
│     ↕          ↕          ↕         ↕             │
│  expert    interaction  task    relationship      │
│                                                   │
│  Every product reads from and writes to the same  │
│  entity graph. Privacy layers control visibility. │
└────────────────────┬─────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐ ┌─────────┐ ┌──────────┐
   │ Renubu  │ │  ARI    │ │ GoodHang │
   │ Context │ │ Scores  │ │ Assess-  │
   │ for CS  │ │ as meta │ │ ment     │
   │workflows│ │ on ents │ │ scoring  │
   └─────────┘ └─────────┘ └──────────┘
```

### Natural Language Routing

Every MCP tool, REST endpoint, and alias pattern is registered through `defineTool()`. A single request flows through:

```
"add refactor auth to my queue"
         │
         ▼
  ┌──────────────┐
  │ AliasResolver │  exact → fuzzy → semantic
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │  Variable    │  { title: "refactor auth" }
  │  Extraction  │
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │ AliasExecutor│  resolve entities → execute action
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │ QueueService │  insert into human_os.queue_items
  └──────────────┘
```

## Integration Matrix

| Source → Target | Mechanism | Status |
|----------------|-----------|--------|
| GFT → Entity spine | Direct DB writes (SQLite → Supabase sync) | Designed |
| Renubu → HumanOS context | renubu-mcp (enrichment, opinions, transcripts) | Working |
| ARI → Entity metadata | API scores stored as entity metadata | Planned |
| GoodHang → Entity scoring | Analysis package (14 dimensions) | Working |
| PowerPak → Expert profiles | MCP resources (SKILL.md → tools) | Working |
| FounderOS → All services | MCP meta-router (28+ tool modules) | Working |
| Creativity Journal → HumanOS | Journal package (Plutchik emotions) | Designed |
| Transcripts → Entities | Async indexer (ingest → analyze → link) | Working |
| Search MCP → arXiv + recall | Federated search (arXiv API + entity recall) | Working |
| Send MCP → Slack | Slack Web API (channels, threads) | Working |
| Think MCP → Reasoning chains | Stateless structured reasoning | Working |
| Code MCP → GitHub worktrees | Async task orchestration | Working |

## Entity Model

The shared spine across all products. Every entity has a `slug`, `entity_type`, `privacy_scope`, and belongs to a `tenant`.

```
┌─────────────────────────────────────────────────┐
│                  entities                        │
│                                                  │
│  id · slug · entity_type · name · email          │
│  metadata (JSONB) · owner_id · tenant_id         │
│  privacy_scope · source_system · source_id       │
└───────────────────┬─────────────────────────────┘
                    │
    ┌───────────────┼───────────────────┐
    │               │                   │
    ▼               ▼                   ▼
┌────────┐   ┌──────────────┐   ┌──────────────┐
│context │   │ entity_links │   │ interactions │
│_files  │   │              │   │              │
│        │   │ source_slug  │   │ entity_id    │
│layer   │   │ target_slug  │   │ type · title │
│file_   │   │ link_type    │   │ sentiment    │
│path    │   │ strength     │   │ occurred_at  │
└────────┘   └──────────────┘   └──────────────┘
```

**Entity types:** `person` · `company` · `project` · `goal` · `task` · `expert` · `relationship` · `interaction`

**Link types:** `wiki_link` · `mentions` · `child_of` · `related_to` · `works_at` · `contacts` · `owns` · `assigned_to` · `part_of`

**Privacy layers:**
- `public` — anyone can read
- `powerpak-published` — subscribers
- `renubu:tenant-{id}` — scoped to one tenant
- `founder:{userId}` — personal data
- `prompts:{system|userId}` — prompt templates

## Port Registry

### Platform Products

| App | PM2 Name | Dev | Staging | Demo | Type | Path |
|-----|----------|-----|---------|------|------|------|
| renubu-web | humanos:renubu-web | 4000 | 4010 | 4020 | Next.js | `renubu/web` |
| renewal-planner | humanos:renewal-planner | 4001 | 4011 | 4021 | Next.js | `renubu/renewal-planner` |
| goodhang-web | humanos:goodhang-web | 4100 | 4110 | 4120 | Next.js | `goodhang/web` |
| roadtrip | humanos:roadtrip | 4101 | 4111 | 4121 | Next.js | `goodhang/roadtrip` |
| goodhang-desktop | humanos:goodhang-desktop | 4102 | 4112 | 4122 | Vite+Tauri | `goodhang/desktop` |
| fancy-robot | humanos:fancy-robot | 4200 | 4210 | 4220 | Next.js | `fancy-robot/web` |
| ari-frontend | humanos:ari-frontend | 4202 | 4212 | 4222 | Vite | `fancy-robot/ari/frontend` |
| ari-backend | humanos:ari-backend | 4250 | 4260 | 4270 | FastAPI | `fancy-robot/ari/backend` |
| better-chatbot | humanos:better-chatbot | 4300 | 4310 | 4320 | Next.js | `powerpak/packages/better-chatbot` |
| human-os-api | humanos:api | 4401 | 4411 | 4421 | Express | `core/apps/api` |
| justinstrackany | standalone:justinstrackany | 4500 | 4510 | 4520 | Next.js | `(~/dev/justinstrackany)` |
| creativity-journal | humanos:journal | 4501 | 4511 | 4521 | Next.js | `founder-os/journal` |
| gft-crm | humanos:gft-crm | 4502 | 4512 | 4522 | Next.js | `gft/crm-web` |

### Infrastructure Services

| Service | Port(s) | Notes |
|---------|---------|-------|
| Supabase (core) | 54321–54329 | HumanOS core schema |
| Supabase (renubu) | 54330–54339 | Renubu tenant data |
| Neo4j (PowerPak) | 7474, 7687 | Knowledge graph |
| PostgreSQL (ARI) | 5432 | Docker |
| Qdrant (Fancy Robot) | 6333 | Vector store |

## MCP Server Inventory

### Core Infrastructure MCPs

| Server | Product | Tools | Protocol |
|--------|---------|-------|----------|
| **code-mcp** | core | `code_start` · `code_status` · `code_list` · `code_merge` · `code_discard` | stdio |
| **search-mcp** | core | `arxiv_search` · `arxiv_paper` · `arxiv_citations` · `doc_search` · `doc_read` · `doc_list` · `recall_person` · `recall_company` · `recall_project` · `recall_expert` · `recall_journal` · `recall_search` · `recall_connections` | stdio |
| **send-mcp** | core | `slack_send` · `slack_channels` · `slack_thread` | stdio |
| **think-mcp** | core | `think_step` · `think_branch` · `think_compare` · `think_conclude` · `think_status` · `think_reset` | stdio |
| **renubu-mcp** | core | `enrich_contact` · `enrich_company` · `enrich_batch` · `get_contact_opinions` · `upsert_opinion` · `delete_opinion` · `search_opinions` · `get_opinion_summary` · `skills_list` · `skills_read` · `skills_search` · `skills_tools` · `skills_discover` · `transcript_list` · `transcript_read` · `team_intel_trends` · `team_intel_signals` | stdio |

### Product MCPs

| Server | Product | Tools (categories) | Protocol |
|--------|---------|-------|----------|
| **founder-os-mcp** | founder-os | 28+ modules: `do` · `recall_*` · `session_*` · task mgmt · queue mgmt · projects · OKRs · glossary · transcripts · relationships · journal · emotions · voice · skills · context · identity · code · CRM · email · priorities · moods · conductor · demo · GFT ingestion | stdio |
| **powerpak-server** | powerpak | Expert profiles as MCP resources · semantic search · hiring · messaging · meeting booking | stdio |
| **justin-voice-server** | powerpak | Voice profile tools | stdio |
| **universal-messenger** | powerpak | Cross-platform messaging | stdio |

### Core MCP Package

| Server | Product | Tools | Protocol |
|--------|---------|-------|----------|
| **@human-os/mcp-server** | core (package) | `context_read` · `context_write` · `entity_create` · `entity_update` · `graph_connections` + more | stdio |

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15–16, React 19, Vite, TailwindCSS 3–4, Radix UI |
| Backend (Node) | Express, tsx, TypeScript 5 |
| Backend (Python) | FastAPI, Uvicorn, Pydantic |
| Database | Supabase (PostgreSQL + Storage + RLS), SQLite (local-first apps), Neo4j (knowledge graph) |
| AI | Anthropic Claude (primary), OpenAI (embeddings), Perplexity, Google Gemini (ARI multi-model) |
| Protocol | MCP (Model Context Protocol) — stdio transport |
| Desktop | Electron (GFT), Tauri (GoodHang Desktop) |
| Build | Turbo (monorepos), pnpm (core), npm (products) |
| Auth | Supabase Auth (magic links), API keys with scoped access |
| Email | Resend (transactional) |

## Key Architectural Patterns

### Single Implementation, Triple Delivery

Every service is defined once in `@human-os/services` and exposed three ways:

1. **MCP tool** — Claude calls it directly via protocol
2. **REST endpoint** — External clients hit `/v1/*`
3. **Natural language** — `do()` routes "add X to queue" → `QueueService.add()`

The `defineTool()` function in `@human-os/tools` makes this automatic:

```typescript
defineTool({
  name: 'add_task',
  input: z.object({ title: z.string(), priority: z.enum(['low','medium','high']) }),
  handler: (ctx, input) => TaskService.add(ctx, input),
  rest: { method: 'POST', path: '/v1/tasks' },
  alias: { pattern: 'add {title} to my tasks', platform: 'founder' }
})
```

### Privacy by Architecture

Access control isn't bolted on — it's the first parameter to every operation. `ServiceContext` carries `userId`, `layer`, and `supabase` client. The `PrivacyModel` resolves what data is visible before any query runs. RLS policies enforce at the database level as a second guard.

### Entity-First Design

Products don't define their own data models. They write entities to the shared spine and read entities back through the graph. A `person` created by GFT's LinkedIn extension is the same `person` that Renubu tracks for renewal context and GoodHang scores for talent fit.
