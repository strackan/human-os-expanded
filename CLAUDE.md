# HumanOS Platform

Contextual intelligence platform — a unified context layer that makes AI useful by giving it real professional context, deployed across every workflow that matters.

**Strategy:** ARI-Led Barbell (Path 7). ARI gets 80% of engineering time. See [ROADMAP.md](ROADMAP.md) for current sprint priorities.

**Read also:** [ARCHITECTURE.md](ARCHITECTURE.md) · [VISION.md](VISION.md) · [GAPS.md](GAPS.md) · [STRATEGIC_BRIEF.md](STRATEGIC_BRIEF.md)

## Directory Structure

```
~/dev/human-os/                    # PLATFORM ROOT (not a git repo)
├── core/                          # HumanOS core monorepo (git: strackan/human-os-expanded)
│   ├── apps/
│   │   ├── renubu/               # Renubu web app (port 4000) ← CANONICAL
│   │   ├── goodhang/             # GoodHang web app (port 4100) ← CANONICAL
│   │   ├── fancy-robot/          # Fancy Robot marketing UI (port 4200) ← CANONICAL
│   │   ├── ari/                  # ARI scoring engine (ports 4202/4250) ← CANONICAL
│   │   ├── founder-os/           # FounderOS web + MCP + journal
│   │   ├── goodhang-desktop/     # GoodHang Tauri app (port 4102, archived)
│   │   ├── api/                  # REST gateway (port 4401)
│   │   ├── code-mcp/             # Async code orchestration
│   │   ├── search-mcp/           # Federated search (arXiv, recall, docs)
│   │   ├── renubu-mcp/           # CS enrichment bridge
│   │   ├── send-mcp/             # Outbound comms (Slack)
│   │   ├── think-mcp/            # Structured reasoning
│   │   └── voice-packs/          # Writing engine templates
│   ├── packages/
│   │   ├── core/                  # Context engine, knowledge graph, privacy
│   │   ├── services/              # Task, queue, alias, transcript services
│   │   ├── tools/                 # Unified tool registry (defineTool)
│   │   ├── analysis/              # Emotion, interview, archetype scoring
│   │   ├── voice/                 # VoiceOS — 10 Commandments engine
│   │   ├── entity-resolution/     # Semantic entity matching
│   │   └── ...                    # aliases, journal, mcp-server, etc.
│   ├── supabase/                  # Core schema + migrations
│   ├── ROADMAP.md                 # ← Tracked here (reconciled 2026-03-03)
│   ├── VISION.md                  # ← Tracked here
│   ├── ARCHITECTURE.md            # ← Tracked here
│   └── ecosystem.config.js        # Copy of canonical PM2 config
│
├── renubu/                        # ARCHIVED — see core/apps/renubu/
│   ├── web/                       # Hollowed out 2026-03-02, has ARCHIVED.md
│   └── renewal-planner/           # Strategy generator (port 4001, to be absorbed)
│
├── fancy-robot/                   # ARCHIVED — see core/apps/fancy-robot/ and core/apps/ari/
│   └── cloud/                     # Docker infra (PostgreSQL, Qdrant) — still active
│
├── gft/                           # PRODUCT: Network Intelligence (git: strackan/guyforthat)
│   ├── crm-web/                   # CRM dashboard (port 4502)
│   ├── linkedin-extension-v2/     # Chrome extension
│   ├── enrichment-worker/         # Contact enrichment
│   └── prompt-sandbox/            # Voice + prompt testing
│
├── goodhang/                      # ARCHIVED — see core/apps/goodhang/
│   ├── web/                       # Has ARCHIVED.md, PM2 points at core/apps/goodhang/
│   └── roadtrip/                  # Event planning (port 4101) — still standalone
│
├── powerpak/                      # PRODUCT: Expert Knowledge (git: strackan/powerpak)
│   ├── packages/                  # MCP servers, knowledge graph, etc.
│   ├── skills/                    # Expert SKILL.md files (tiered)
│   └── docs/                      # Demo + presentation materials
│
├── founder-os/                    # ARCHIVED MCP copy — see core/apps/founder-os/
│
├── CLAUDE.md                      # THIS FILE (not tracked — copy in core/ is tracked)
├── ROADMAP.md                     # Symlink target (canonical copy in core/)
├── ecosystem.config.js            # Inner config (DEPRECATED — use ~/dev/ecosystem.config.js)
└── .mcp-registry.json             # MCP server inventory
```

## Dev Server Management

**Canonical PM2 config:** `~/dev/ecosystem.config.js` (the outer one). The inner `human-os/ecosystem.config.js` is deprecated.

```bash
dev list                 # Show all apps with ports
dev start renubu         # Start renubu apps
dev start ari            # Start ARI frontend + backend
dev start --all          # Start everything
dev stop --all           # Stop everything
dev logs goodhang        # Tail logs
```

## Port Registry

| App | PM2 Name | Dev | Type | Path (canonical) |
|-----|----------|-----|------|------|
| renubu-web | renubu:renubu-web | 4000 | Next.js | `core/apps/renubu` |
| renewal-planner | renubu:renewal-planner | 4001 | Next.js | `renubu/renewal-planner` |
| goodhang-web | goodhang:goodhang-web | 4100 | Next.js | `core/apps/goodhang` |
| roadtrip | goodhang:roadtrip | 4101 | Next.js | `goodhang/roadtrip` |
| goodhang-desktop | goodhang:goodhang-desktop | 4102 | Vite+Tauri | `core/apps/goodhang-desktop` (archived) |
| fancy-robot | fancyrobot:fancy-robot | 4200 | Next.js | `core/apps/fancy-robot` |
| ari-frontend | fancyrobot:ari-frontend | 4202 | Vite | `core/apps/ari/frontend` |
| ari-backend | fancyrobot:ari-backend | 4250 | FastAPI | `core/apps/ari/backend` |
| powerpak-demo | powerpak:powerpak-demo | 4300 | Next.js | `powerpak/packages/better-chatbot` |
| gtm-adventure | powerpak:gtm-adventure | 4301 | Vite | `gtm.consulting/adventure` (migrating to goodhang) |
| founder-os-web | humanos:founder-os-web | 4400 | Next.js | `core/apps/founder-os/web` |
| human-os-api | humanos:api | 4401 | Express | `core/apps/api` |
| gft-crm | gft:gft-crm | 4502 | Next.js | `gft/crm-web` |

## Infrastructure Services

| Service | Port(s) | Notes |
|---------|---------|-------|
| Supabase (unified) | 54321–54329 | Single instance, schema-namespaced |
| Neo4j (PowerPak) | 7474, 7687 | Knowledge graph |
| PostgreSQL (ARI) | 5432 | Docker via fancy-robot/cloud |
| Qdrant (ARI) | 6333 | Docker via fancy-robot/cloud |

## Supabase Schema Namespacing

All apps share one Supabase instance (cloud: `zulowgscotdrqlccomht`). Each product uses a dedicated PostgreSQL schema via `db: { schema: '<name>' }` in client config. Auth stays on `public` (automatic).

| Schema | Product | Key Tables |
|--------|---------|------------|
| `public` | shared | auth.users, activation keys, RPC wrappers |
| `human_os` | core | entities, context_files, journal, voice_profiles |
| `renubu` | renubu-web | customers, contracts, renewals, workflows |
| `goodhang` | goodhang-web | profiles, applications, events, assessments, adventure (planned) |
| `fancyrobot` | fancy-robot | snapshots, analyses, articles, publications |
| `founder_os` | founder-os | interview_sessions, priorities |
| `gft` | gft-crm | contacts, enrichment, li_posts |
| `crm` | shared | campaigns, outreach_queue |
| `global` | cross-product | global entities, verified contacts |

## Git Repositories

| Repo | GitHub | Tracks | Status |
|------|--------|--------|--------|
| `core/` | strackan/human-os-expanded | Core infra + all canonical app code + platform docs | **Active** |
| `gft/` | strackan/guyforthat | GFT CRM + extensions | **Active** |
| `powerpak/` | strackan/powerpak | Expert knowledge + MCP servers | **Active** |
| `goodhang/roadtrip/` | (no remote) | Event planning app | **Minimal** |
| `fancy-robot/cloud/` | tkellogg/fancyrobot-cloud | Docker infra | **Dormant** |
| `renubu/web/` | Renew-Boo/renubu | Legacy, hollowed out | **Archived** |
| `goodhang/web/` | strackan/goodhang-web | Legacy, PM2 redirected | **Archived** |
| `fancy-robot/web/` | strackan/fancy-robot | Legacy, frozen Feb 27 | **Archived** |
| `fancy-robot/ari/` | strackan/ari | Legacy, frozen Feb 28 | **Archived** |
| `founder-os/journal/` | strackan/creativityjournal | Legacy, dormant since Jul 2025 | **Archived** |

## Shared API Keys

Keep in sync across all apps that use them:
- **ANTHROPIC_API_KEY** — renubu-web, renewal-planner, goodhang-web, fancy-robot, ari-backend, powerpak-demo, core API
- **OPENAI_API_KEY** — ari-backend, powerpak-demo, powerpak
- **RESEND_API_KEY** — goodhang-web, fancy-robot

## Rules

1. **Always use `dev` CLI or pm2** to start dev servers — never `npm run dev` directly
2. **Never hardcode ports** — use `PORT` env var or pm2 config
3. **Check port registry** before adding new apps
4. **Entity-first data model** — products write to the shared entity spine, not their own tables
5. **Privacy by architecture** — always pass `ServiceContext` (userId, layer, supabase) to service calls
6. **Single implementation** — define capabilities in `@human-os/services`, expose via MCP + REST + alias
7. **Canonical code lives in `core/apps/`** — do not commit to archived standalone repos
8. **PM2 config lives at `~/dev/ecosystem.config.js`** — the inner one is deprecated
