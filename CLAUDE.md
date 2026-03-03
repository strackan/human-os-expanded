# HumanOS Platform

Contextual intelligence platform — a unified context layer that makes AI useful by giving it real professional context, deployed across every workflow that matters.

**Read first:** [ARCHITECTURE.md](ARCHITECTURE.md) · [VISION.md](VISION.md) · [GAPS.md](GAPS.md) · [ROADMAP.md](ROADMAP.md)

## Directory Structure

```
~/dev/human-os/                    # PLATFORM ROOT
├── core/                          # HumanOS core infrastructure (git repo)
│   ├── apps/
│   │   ├── api/                   # REST gateway (port 4401)
│   │   ├── code-mcp/             # Async code orchestration
│   │   ├── search-mcp/           # Federated search (arXiv, recall, docs)
│   │   ├── renubu-mcp/           # CS enrichment bridge
│   │   ├── send-mcp/             # Outbound comms (Slack)
│   │   ├── think-mcp/            # Structured reasoning
│   │   ├── voice-packs/          # Writing engine templates
│   │   ├── fancy-robot/          # Marketing + snapshot UI (port 4200)
│   │   └── ari/                  # ARI scoring engine (ports 4202/4250)
│   ├── packages/
│   │   ├── core/                  # Context engine, knowledge graph, privacy
│   │   ├── services/              # Task, queue, alias, transcript services
│   │   ├── tools/                 # Unified tool registry (defineTool)
│   │   ├── analysis/              # Emotion, interview, archetype scoring
│   │   ├── voice/                 # VoiceOS — 10 Commandments engine
│   │   ├── entity-resolution/     # Semantic entity matching
│   │   └── ...                    # aliases, journal, mcp-server, etc.
│   ├── contexts/                  # Base context templates
│   ├── skills/                    # Skills files (voice, founder-os profiles)
│   └── supabase/                  # Core schema + migrations
│
├── renubu/                        # PRODUCT: Workflow SaaS
│   ├── web/                       # Main app (port 4000) — git repo
│   └── renewal-planner/           # Strategy generator (port 4001)
│
├── fancy-robot/                   # PRODUCT: AI Visibility (legacy — now in core/apps/)
│   └── cloud/                     # Docker infra (PostgreSQL, Qdrant) — git repo
│
├── gft/                           # PRODUCT: Network Intelligence — git repo
│   ├── crm-web/                   # CRM dashboard (port 4502)
│   ├── linkedin-extension-v2/     # Chrome extension
│   ├── enrichment-worker/         # Contact enrichment
│   └── prompt-sandbox/            # Voice + prompt testing
│
├── goodhang/                      # PRODUCT: Talent Assessment
│   ├── web/                       # Assessment + community (port 4100) — git repo
│   ├── roadtrip/                  # Event planning (port 4101) — git repo
│   └── desktop/                   # Tauri desktop app (port 4102)
│
├── powerpak/                      # PRODUCT: Expert Knowledge — git repo
│   ├── packages/                  # MCP servers, knowledge graph, etc.
│   ├── skills/                    # Expert SKILL.md files (tiered)
│   └── docs/                      # Demo + presentation materials
│
├── founder-os/                    # PRODUCT: Personal Productivity
│   ├── mcp/                       # FounderOS MCP (28+ tools)
│   ├── web/                       # FounderOS web app (port 4400)
│   └── creativityjournal/         # Creativity Journal (port 4501)
│
├── ARCHITECTURE.md                # System diagrams, data flow, integration matrix
├── VISION.md                      # Business case, market positioning, GTM
├── GAPS.md                        # 10 technical gaps, 5 naming issues
├── ROADMAP.md                     # Phased plan (Phase 0–4)
├── .mcp-registry.json             # Machine-readable MCP server inventory
└── ecosystem.config.js            # PM2 config for all apps
```

## Dev Server Management

All apps managed by pm2 via `ecosystem.config.js`. Use the `dev` CLI from `~/dev/human-os/`:

```bash
dev list                 # Show all apps with ports
dev start renubu         # Start renubu apps
dev start ari            # Start ARI frontend + backend
dev start --all          # Start everything
dev stop --all           # Stop everything
dev logs goodhang        # Tail logs
```

## Port Registry

| App | PM2 Name | Dev | Type | Path |
|-----|----------|-----|------|------|
| renubu-web | humanos:renubu-web | 4000 | Next.js | `renubu/web` |
| renewal-planner | humanos:renewal-planner | 4001 | Next.js | `renubu/renewal-planner` |
| goodhang-web | humanos:goodhang-web | 4100 | Next.js | `goodhang/web` |
| roadtrip | humanos:roadtrip | 4101 | Next.js | `goodhang/roadtrip` |
| goodhang-desktop | humanos:goodhang-desktop | 4102 | Vite+Tauri | `goodhang/desktop` |
| fancy-robot | fancyrobot:fancy-robot | 4200 | Next.js | `core/apps/fancy-robot` |
| ari-frontend | fancyrobot:ari-frontend | 4202 | Vite | `core/apps/ari/frontend` |
| ari-backend | fancyrobot:ari-backend | 4250 | FastAPI | `core/apps/ari/backend` |
| better-chatbot | humanos:better-chatbot | 4300 | Next.js | `powerpak/packages/better-chatbot` |
| founder-os-web | humanos:founder-os-web | 4400 | Next.js | `core/apps/founder-os/web` |
| human-os-api | humanos:api | 4401 | Express | `core/apps/api` |
| creativity-journal | humanos:journal | 4501 | Next.js | `core/apps/founder-os/creativityjournal` |
| gft-crm | humanos:gft-crm | 4502 | Next.js | `gft/crm-web` |

## Infrastructure Services

| Service | Port(s) | Notes |
|---------|---------|-------|
| Supabase (unified) | 54321–54329 | Single instance, schema-namespaced |
| Neo4j (PowerPak) | 7474, 7687 | Knowledge graph |
| PostgreSQL (ARI) | 5432 | Docker via fancy-robot/cloud |
| Qdrant (ARI) | 6333 | Docker via fancy-robot/cloud |

## Supabase Schema Namespacing

All apps share one Supabase instance. Each product uses a dedicated PostgreSQL schema via `db: { schema: '<name>' }` in client config. Auth stays on `public` (automatic).

| Schema | Product | Key Tables |
|--------|---------|------------|
| `public` | shared | auth.users, activation keys, RPC wrappers |
| `human_os` | core | entities, context_files, journal, voice_profiles |
| `renubu` | renubu-web | customers, contracts, renewals, workflows |
| `goodhang` | goodhang-web | profiles, applications, events, assessments |
| `fancyrobot` | fancy-robot | snapshots, analyses, articles, publications |
| `founder_os` | founder-os | interview_sessions, priorities |
| `gft` | gft-crm | contacts, enrichment, li_posts |
| `crm` | shared | campaigns, outreach_queue |
| `global` | cross-product | global entities, verified contacts |

## Shared API Keys

Keep in sync across all apps that use them:
- **ANTHROPIC_API_KEY** — renubu-web, renewal-planner, goodhang-web, fancy-robot, ari-backend, better-chatbot, core API
- **OPENAI_API_KEY** — ari-backend, better-chatbot, powerpak
- **RESEND_API_KEY** — goodhang-web, fancy-robot

## Rules

1. **Always use `dev` CLI or pm2** to start dev servers — never `npm run dev` directly
2. **Never hardcode ports** — use `PORT` env var or pm2 config
3. **Check port registry** before adding new apps
4. **Entity-first data model** — products write to the shared entity spine, not their own tables
5. **Privacy by architecture** — always pass `ServiceContext` (userId, layer, supabase) to service calls
6. **Single implementation** — define capabilities in `@human-os/services`, expose via MCP + REST + alias
