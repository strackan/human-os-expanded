# HumanOS — Gaps

Honest accounting of what's built, what's designed, and what's missing. Updated February 2026.

## Status Legend

- **Working** — deployed or running locally, tested, used regularly
- **Designed** — architecture exists, interfaces defined, not yet wired
- **Planned** — documented intent, no implementation
- **Missing** — not yet considered, but needed

---

## 10 Technical Gaps

### 1. No unified auth/identity across products

**Status:** Missing

Each product handles auth independently. Renubu uses Supabase Auth with magic links. GoodHang uses its own Supabase Auth. GFT has no auth (local-first). FounderOS relies on API keys. There is no single sign-on, no shared session, no "log into HumanOS and access everything."

**Impact:** Users create separate accounts per product. Context that should flow between products requires manual configuration.

**Effort:** ~40h for shared auth service + migration scripts

### 2. Entity deduplication incomplete

**Status:** Designed (package exists, unwired)

`@human-os/entity-resolution` has semantic matching with confidence scores and OpenAI embeddings. But it's not called from any product's entity creation flow. GFT creates `person` entities from LinkedIn. Renubu creates `person` entities from customer imports. Same person, two records.

**Impact:** Knowledge graph has duplicate nodes. Relationship queries return incomplete results.

**Effort:** ~8h to wire into entity creation hooks

### 3. Renubu → HumanOS integration planned but not built

**Status:** Designed (Phase 0.2, ~16h estimated)

`renubu-mcp` exists and can pull enrichment data, opinions, and transcripts from HumanOS. But Renubu's web app doesn't call it. The renewal workflow doesn't pull entity context from the knowledge graph. Customer health scores don't reflect interaction history stored in HumanOS.

**Impact:** Renubu operates as a standalone SaaS instead of a context-powered one. The core value proposition — "renewal strategies informed by full relationship context" — isn't realized yet.

**Effort:** ~16h for initial integration (entity sync + context panel in Renubu UI)

### 4. Fancy Robot → Renubu trigger path doesn't exist

**Status:** Planned

When ARI detects a brand's AI visibility score dropping, there's no mechanism to trigger a Renubu workflow ("schedule a check-in with that customer"). The data exists in both systems but there's no event bridge.

**Impact:** Intelligence and action are disconnected. The Know → Act flywheel doesn't turn automatically.

**Effort:** ~12h for event-based trigger system

### 5. PowerPak ↔ GoodHang bridge is conceptual only

**Status:** Planned

PowerPak has expert profiles (SKILL.md). GoodHang has talent assessment scoring. The obvious product: "match assessed candidates to expert requirements." But there's no integration — they're separate codebases with different data stores (Neo4j vs Supabase).

**Impact:** Two products that should reinforce each other don't. Expert matching is manual.

**Effort:** ~20h for shared scoring interface + query layer

### 6. Two FounderOS implementations need consolidation

**Status:** Designed

`human-os-expanded/apps/founder-os/mcp/` (the canonical 28+ tool MCP) and `powerpak/packages/founder-os-server/` (a PowerPak fork). Both define FounderOS tools. The PowerPak version is older and divergent.

**Impact:** Tool definitions may conflict. Maintenance burden doubled. Unclear which is source of truth.

**Effort:** ~4h to deprecate PowerPak version and redirect

### 7. Creativity Journal disconnected from HumanOS context

**Status:** Designed

`@human-os/journal` package exists in core with Plutchik emotion integration. The standalone `creativity-journal/creativityjournal` app uses Prisma + SQLite locally. They don't talk to each other. Journal entries in the app never reach the HumanOS knowledge graph.

**Impact:** Daily reflections — a rich source of personal context — stay siloed in a local SQLite file.

**Effort:** ~12h for Supabase migration + journal service integration

### 8. No shared event bus for cross-product reactivity

**Status:** Missing

Products communicate through shared database reads, not events. When Renubu marks a customer at-risk, nothing notifies FounderOS to create a task. When GFT imports a new contact, nothing triggers entity resolution.

**Impact:** All cross-product workflows require manual orchestration or polling.

**Effort:** ~24h for lightweight event system (Supabase Realtime or simple pub/sub)

### 9. MCP servers not centrally registered

**Status:** Missing (resolved by `.mcp-registry.json` in this restructure)

Ten+ MCP servers exist across the codebase. Each is configured independently in Claude Desktop's `claude_desktop_config.json` or product-specific configs. No single inventory of what servers exist, what tools they expose, or which are active.

**Impact:** Onboarding a new product or debugging MCP issues requires reading multiple config files. No way to programmatically discover available tools.

**Effort:** ~2h for registry file + validation script

### 10. human-os vs human-os-expanded split

**Status:** Resolved by this restructure

Two git repos for the same system. `human-os` (original, fewer features) and `human-os-expanded` (canonical, actively developed). Both exist at `~/dev/` level. Confusing for anyone (including AI agents) navigating the codebase.

**Impact:** Eliminated. `human-os-expanded` becomes `human-os/core/`. Original archived.

---

## 5 Naming / Location Incongruencies

### 1. "Titus context" referenced but unused

Renubu documentation references "titus context" — an internal codename for a specific context template pattern. The term appears in CLAUDE.md files but maps to no code in HumanOS core. Either rename to match current architecture or remove the references.

### 2. Two PowerPak locations (resolved)

`~/dev/powerpak/` (canonical git repo) and `~/dev/renubu/powerpak/` (stale copy inside the renubu monorepo). The renubu copy is archived by this restructure.

### 3. better-chatbot identity

`powerpak/packages/better-chatbot` runs on port 4300 under the `powerpak` namespace. It's an Electron foundation fork that has evolved past its original purpose. The name "better-chatbot" doesn't communicate what it does (it's closer to a "PowerPak demo dashboard"). Consider renaming.

### 4. GoodHang desktop/web split (resolved)

`goodhang-desktop` lived inside `human-os-expanded/apps/` while `goodhang-web` lived at `~/dev/goodhang/`. Same product family, different parent directories. Resolved: both now under `~/dev/human-os/goodhang/`.

### 5. renewal-planner as standalone vs Renubu module

`renewal-planner` is a standalone Next.js app at `~/dev/renewal-planner/` that does a subset of what Renubu does (generate renewal strategies with Claude). It could be a Renubu route instead of a separate app. Currently moved under `renubu/` in the new structure, but the long-term question is whether it should merge into Renubu's codebase entirely.
