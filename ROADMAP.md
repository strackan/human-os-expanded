# HumanOS — Roadmap

**Strategy:** ARI-Led Barbell (Path 7). ARI gets 80% of engineering time. Renubu gets 20% (context integration + design partner maintenance). Everything else sequences behind.

**Last reconciled:** 2026-03-04. Aligned with Strategic Brief v2, codebase audit, git reality, and Context Layer architecture decision.

---

## How to Read This

**Sprints** are sequenced work with clear deliverables and exit criteria. They are the commitment.

**Exploration budget** is explicitly allocated time for the creative energy that produces features like ARI publication scoring, GFT voice dictation, and GoodHang Wispr Flow. These features are real value — they just need to happen *after* the sprint commitment is met, not instead of it. See [Energy Framework](#energy-framework) at the bottom.

---

## Phase 0 — Foundation Completion (Days, not weeks)

**Goal:** Finish what's 70% done. The monorepo convergence is creating dual-repo confusion that will bite us during ARI development. Fix it now.

| Task | Status | Notes |
|------|--------|-------|
| Directory restructure → `~/dev/human-os/` | **Done** | Products are under platform root |
| Archive `human-os` original | **Done** | Replaced by `core/` |
| Archive duplicate PowerPak and GFT copies | **Done** | Cleaned |
| Archive legacy chatbot-ui | **Done** | Superseded |
| Write ARCHITECTURE.md | **Done** | Needs corrections (see [Doc Corrections](#doc-corrections-needed)) |
| Write VISION.md | **Done** | GTM funnel needs update (see [Doc Corrections](#doc-corrections-needed)) |
| Write GAPS.md | **Done** | Close gaps #9, #10; update bridge code statuses |
| Create `.mcp-registry.json` | **Done** | 10 servers registered |
| Rewrite `ecosystem.config.js` | **Done** | Canonical config at `~/dev/ecosystem.config.js`. Inner config deprecated. |
| Resolve dual-repo commits | **Done** | ARCHIVED.md in 6 stale dirs. PM2 paths point at `core/apps/`. `.vercel/project.json` removed from stale locations. |
| Retire inner `ecosystem.config.js` | **Done** | `~/dev/ecosystem.config.js` is canonical. Inner one deprecated. |
| Rewrite root `CLAUDE.md` | **Done** | Updated with canonical paths, git repo map, archive statuses, PM2 names |
| Track platform docs in git | **Done** | ROADMAP, VISION, ARCHITECTURE, GAPS, CLAUDE, Strategic Brief all committed to core repo |
| Delete nested duplicate directories | **Done** | Removed `goodhang/web/goodhang-web/` (391 files) and `goodhang/roadtrip/roadtrip/` (19 files) |
| Update per-product CLAUDE.md files | **Deferred** | Low priority — apps work without it. Do as encountered. |
| Verify all git repos intact | **Done** | All 10 repos verified, `git log` works in each |
| Verify PM2 starts for all apps | **Done** | 18/20 apps online. `powerpak-demo` stopped (known). `ari-backend` has historical restarts (known). |

**Phase 0 complete.** Exit criteria met: `dev start --all` succeeds, no dual-repo commits, one ecosystem.config.js is authoritative, docs match reality. Per-product CLAUDE.md updates deferred as low-priority — they don't block Sprint 1.

---

## Context Layer — Platform Intelligence Primitive (Parallel track, ~12h across sprints)

**Goal:** A shared contextual intelligence pipeline that assembles multi-source data for any entity and delivers it to a conversational reasoning agent. This is not a separate sprint — it weaves into Sprints 1–3 as infrastructure that accelerates each.

**Origin:** Started as renewal-planner optimization (Mar 4). Analysis revealed the intelligence gathering pattern (entity → parallel data assembly → scoring → structured brief → reasoning agent) is universal across all products. Built as platform primitive instead of CS-specific feature.

**Architecture:** Two-agent pattern.
- **Back of House** gathers intelligence in parallel (ARI, Brave Search, GFT, entity spine, narrative analysis). No user interaction. Returns a `ContextBrief`.
- **Front of House** receives the brief, adopts a domain persona, and advises the user conversationally. Delivered via MCP tools (founder), web chat component (end users), or product-specific pages.

### What's Done

| Task | Status | Location |
|------|--------|----------|
| Back of House intelligence pipeline | **Done** | `renubu/renewal-planner/lib/gatherers/` |
| Type definitions (IntelligenceBrief) | **Done** | `renubu/renewal-planner/lib/types/` |
| Scoring engine (extracted, modular) | **Done** | `renubu/renewal-planner/lib/gatherers/scoring.ts` |
| Gatherers: ARI, Brave, GFT, entity spine, narrative | **Done** | 5 parallel gatherers with independent error handling |
| API endpoint (`POST /api/gather-intelligence`) | **Done** | `renubu/renewal-planner/app/api/gather-intelligence/` |
| Hardcoded API key removed from generate-strategy | **Done** | Security fix |

### What's Next (sequenced into sprints below)

| Task | Effort | When | GitHub |
|------|--------|------|--------|
| Generalize types (`ContextBrief<TEntity, TScores>`) | ~2h | Before Sprint 2 | #171 |
| Front of House MCP tools (`gather_intelligence`, `advise_on_entity`) | ~3h | Sprint 2 | #172 |
| ARI domain adapter (visibility strategist persona) | ~3h | Sprint 1 M4 | #173 |
| Move gatherers to `core/packages/` during absorption | ~5h | Sprint 3a | #174 |
| GFT domain adapter (relationship strategist) | ~4h | Post-Sprint 1 | #173 |
| FounderOS domain adapter (executive coach) | ~5h | Post-Sprint 1 | #173 |

### Cross-Product Impact

The Context Layer front-loads integration work that the Compound Phase (Months 3–6) was going to do piecemeal:

| Compound Phase Task | Without Context Layer | With Context Layer | Savings |
|---|---|---|---|
| Renubu → HumanOS context wiring | ~24-32h | ~8-10h | ~16-22h |
| GoodHang → entity enrichment | ~8h | ~5h | ~3h |
| FounderOS multi-user groundwork | ~16h | ~14h | ~2h |
| **Total** | ~48-56h | ~27-29h | **~21-27h** |

### Where the UI Lives

The intelligence gathering is a service in `core/packages/`. The conversational UI adapts to where the user already is:

- **For the founder (now):** MCP tools in Claude Desktop. Zero UI to build.
- **For ARI free tier (Sprint 1):** Product page with chat interface.
- **For Renubu CSMs (Sprint 3a+):** Embedded panel in customer view.
- **For GFT users (post-Sprint 1):** "Prepare for this person" in contact view.

---

## Sprint 1 — ARI Paid Tier (Weeks 1–4, ~60h)

**Goal:** Revenue. A stranger can find ARI, check their score for free, and pay for ongoing monitoring. This is the #1 priority. Nothing else matters until this ships.

### Milestone 1: Payment Infrastructure (~16h)
| Task | Effort | Notes |
|------|--------|-------|
| Design pricing tiers (self-serve + API) | ~2h | $49–199/mo monitoring, $299–999/mo API |
| Stripe integration (checkout, subscriptions) | ~8h | Use Stripe Checkout, not custom forms |
| Webhook handling (subscription lifecycle) | ~4h | Create, update, cancel, failed payment |
| Gate monitoring features behind subscription | ~2h | Free = snapshot only. Paid = history + alerts |

### Milestone 2: Monitoring Dashboard (~20h)
| Task | Effort | Notes |
|------|--------|-------|
| Dashboard UI (score history, trend lines) | ~8h | Show score over time per model |
| Alert configuration (score drops, threshold) | ~4h | Email alerts when score changes significantly |
| Multi-brand management (for agencies) | ~4h | One account, multiple brands tracked |
| Competitive comparison view | ~4h | "Your score vs. competitors" |

### Milestone 3: Historical Score Tracking (~12h)
| Task | Effort | Notes |
|------|--------|-------|
| Score delta tracking (daily/weekly snapshots) | ~4h | Cron job or Supabase scheduled function |
| Trend analysis and scoring methodology | ~4h | Rolling averages, model-weighted scores |
| Data retention and migration for existing scores | ~4h | Backfill from existing snapshot data |

### Milestone 4: LinkedIn Content Engine + Landing Page (~16h, partially parallel non-engineering work)
| Task | Effort | Notes |
|------|--------|-------|
| Content calendar (first 30 days) | ~2h | "Does AI recommend your brand?" angle |
| Draft first 10 posts | ~4h | Use VoiceOS for Justin's voice |
| Establish posting cadence + measure engagement | ~2h | 3x/week minimum |
| Free snapshot landing page optimization | ~4h | Conversion-focused, captures email |
| ARI Context Layer adapter (visibility strategist) | ~3h | Free snapshot as conversation, not just a number. Uses Context Layer Back of House + ARI-specific Front of House prompt. Major conversion differentiator. (#173) |

**Exit criteria:** A user can sign up, check a free snapshot, see a "upgrade to monitor" CTA, pay with Stripe, and access a monitoring dashboard with historical scores. LinkedIn content is posting weekly.

**Guard rail:** Features like publication scoring, article pipeline, and promo codes are *exploration budget* items — they don't count toward this sprint. They're valuable but they don't generate revenue.

---

## Sprint 2 — Platform Demo (Week 2–3, ~7h, overlaps Sprint 1)

**Goal:** The "I have a platform, not seven products" demo. Now powered by the Context Layer — instead of scripted MCP calls, the demo shows a working product feature.

| Task | Effort | Status |
|------|--------|--------|
| ARI → Entity spine bridge | ~0h | **Already working.** `find_or_create_entity()` and `update_entity_ari_score()` in `core/apps/ari/backend/app/storage/supabase_entities.py` |
| GFT → Entity spine (goals) | ~0h | **Already working.** `syncGoalToEntity()` in `gft/crm-web/src/lib/entity-sync.ts` |
| Extend GFT sync to contacts + companies | ~2h | Same pattern as goal sync, different entity types |
| Verify ARI bridge fires on score completion | ~0.5h | May already be triggered — check ARI save path |
| Generalize Context Layer types | ~2h | `ContextBrief<TEntity, TScores>`, entity type routing, scoring adapter pattern (#171) |
| Front of House MCP tools | ~3h | `gather_intelligence` + `advise_on_entity` as MCP tools. This IS the demo. (#172) |
| Script and rehearse demo | ~1.5h | Updated demo script below |

**Demo script (updated):**
1. "Help me think about Acme's renewal" → Context Layer assembles ARI + GFT + journal + market data in 3 seconds
2. Front of House surfaces top 3 findings: "Their ARI score dropped 8 points, your champion Sarah posted about 'new opportunities,' and there's a leadership change at Acme per recent news"
3. "Who else do I know there?" → relationship context already in the brief, names decision makers and warm intros
4. "Draft a re-engagement email to Sarah" → Front of House drafts using VoiceOS + full context
5. One command, four products, contextual intelligence, not manual lookup.

**What changed:** The "compose cross-product recall query" task (~1h) is replaced by the Context Layer MCP tools (~3h + 2h for type generalization). Net +4h, but the demo shows a real product feature in a browser/Claude Desktop, not a scripted sequence. Materially better fundraising pitch.

**Exit criteria:** The demo runs end-to-end in Claude Desktop using `gather_intelligence` and `advise_on_entity` MCP tools. Context assembles from ARI, GFT, entity spine, and Brave Search. Recorded for advisor/investor conversations.

---

## Sprint 3 — Portfolio Simplification + Adventure Migration (~21h)

**Goal:** Reduce cognitive overhead AND consolidate the adventure game into GoodHang where it belongs architecturally.

### 3a. Portfolio Simplification (~10h)

| Task | Effort | Notes |
|------|--------|-------|
| Absorb renewal-planner: move gatherers to `core/packages/intelligence/` | ~5h | Intelligence pipeline becomes shared platform infrastructure. Renubu gets `/customers/[id]/strategy` route that imports from shared package. CS scoring adapter stays domain-specific. (#174) |
| Absorb Creativity Journal into FounderOS | ~2h | Core already has `@human-os/journal` package with Plutchik emotions. Journal entries become a gatherer source for FounderOS's "help me decide" feature. Delete standalone app. |
| Rename better-chatbot → powerpak-demo | ~1h | Package.json, PM2 config, directory name. Cosmetic but removes a narrative liability. |
| Archive GoodHang Tauri desktop | ~0.5h | Remove from PM2 config. Leave code in place but stop investing. |
| Update PM2 config + CLAUDE.md | ~1.5h | Reflect the simplified portfolio |

**What changed from original plan:** Renewal-planner absorption is +2h (~3h → ~5h) because we move gatherers to `core/packages/` as shared infrastructure instead of copying into Renubu. The extra 2h buy a platform primitive that every product can use, and save ~21-27h in the Compound Phase.

### 3b. Adventure Game → GoodHang (~13h)

The adventure game from `gtm.consulting/adventure/` merges into GoodHang web as a route group at `app/(adventure)/adventure/`. This is an assessment in game form — same DNA as GoodHang's 14-dimension scoring. GoodHang already has Claude SDK, Supabase client, assessment scoring, and leaderboard infrastructure.

| Task | Effort | Notes |
|------|--------|-------|
| Convert 10 JSX/JS → TSX/TS components | ~3h | Terminal, GhostChat, ScoreCard, GameEngine, CommandExecutor, etc. |
| Convert 6 edge functions → Next.js API routes | ~3h | ghost-chat, score, lookup, create-visitor, leaderboard, phone-message |
| Supabase migration (adventure tables, goodhang schema) | ~2h | `adventure_visitors` + `adventure_sessions` on unified instance |
| Entity creation on play | ~2h | Upsert to `human_os.entities` with `source_system: 'goodhang-adventure'`. Match to GFT contacts via email/LinkedIn. |
| Move content files + adventure CSS | ~1h | Scenario JSON + terminal retro aesthetic (coexists with Tailwind) |
| Update API client to hit local `/api/adventure/*` | ~1h | Replace raw `fetch()` to edge function URLs |
| Remove `powerpak:gtm-adventure` from PM2 config | ~0.5h | Adventure now served by `goodhang:goodhang-web` on 4100 |
| gtm.consulting marketing site update | ~0.5h | Point at GoodHang for game backend |

**PowerPak code stays put.** The `gtm.consulting/skills/` and `gtm.consulting/packages/powerpak-server/` are already duplicated in the `powerpak/` repo (which has evolved further). Nothing to move.

**Entity integration:** When someone plays the adventure, they're created as an entity in `human_os.entities`. If their LinkedIn URL is present, entity resolution links them to their GFT contact. "Recall people who played the adventure" works via search-mcp. Eventually, renubu.com can embed the game too — it hits GoodHang's API regardless of which domain hosts the frontend.

**Result:** The portfolio goes from "seven products + a journal + a planner + a chatbot + a standalone game" to **"four products and a platform"** — ARI, Renubu, GFT, GoodHang (now with adventure/games) + HumanOS core (FounderOS, PowerPak, and services live inside the platform).

**Exit criteria:** `dev list` shows the simplified set. Adventure is playable at `/adventure/` on GoodHang. Entity creation fires on play. Archived apps don't appear. Docs reflect reality.

---

## Ongoing — Renubu Design Partners (~2h/week)

**This is a relationship commitment, not an engineering commitment.**

| Activity | Cadence | Notes |
|----------|---------|-------|
| Design partner check-in calls | Weekly/biweekly | Grace + 3–5 additional partners sought |
| Feedback collection and logging | After each call | Log in FounderOS, not in a spreadsheet |
| Feature request management | As received | Default response: "I hear you, it's on the roadmap — let me show you what the context layer unlocks first." |
| Context integration planning | Monthly | Plan the Renubu → HumanOS wiring for Month 3+ |

**Guard rail:** Design partners will request features. The discipline is relationship maintenance, not feature development. No Renubu engineering sprints until Month 3+.

---

## Months 3–6 — Compound Phase

Sequenced after ARI has revenue flowing. Priorities shift based on data from Sprint 1.

**Context Layer impact:** The intelligence pipeline built in Sprints 1–3 front-loads much of the integration work. Each product gets a domain adapter (~3-5h) on top of shared gatherers, instead of custom wiring per product.

| Task | Effort (original) | Effort (with Context Layer) | Trigger |
|------|---|---|---------|
| Renubu → HumanOS context wiring | ~24-32h | **~8-10h** | Design partners validate the context value prop |
| ARI API tier for agencies | ~20h | ~18h | Self-serve tier has proven conversion |
| FounderOS multi-user groundwork | ~16h | ~14h | MCP directories maturing, organic pull signals |
| GoodHang → entity enrichment | ~8h | **~5h** | When assessment data has downstream consumers |
| Entity deduplication (wire existing package) | ~8h | ~6h | When entity count creates real duplication |

**This is NOT a commitment.** This is a menu. Pick based on what Sprint 1 teaches you.

---

## Decision Gate — Month 6–9: Bootstrap or Raise?

**Inputs required:**
- ARI revenue data (MRR, conversion rate, churn)
- Renubu design partner validation (do they want to pay?)
- Platform demo reception (does it impress advisors?)
- Solo founder energy levels (is this sustainable?)

**If raising:**
> "Four products sharing one **contextual intelligence layer** that assembles multi-source intelligence for any entity in 3 seconds and advises users conversationally. Here's the live demo — I ask about a customer, and it pulls ARI visibility data, GFT relationship context, market news, and my interaction history, then helps me build a strategy. The same pipeline powers every product. I need two engineers to add domain adapters, not to build integration from scratch."

First two hires: (1) full-stack engineer to build domain adapters and web components on the Context Layer, (2) growth engineer to scale ARI's self-serve funnel.

**If bootstrapping:**
Continue ARI scaling + selective integration. FounderOS packaging if MCP directories show organic pull. Renubu enterprise motion only if design partners convert.

---

## FounderOS Timing Framework

FounderOS is not marketed now. It positions for MCP market maturity.

| Period | MCP Ecosystem | FounderOS Action |
|--------|--------------|-----------------|
| Now (Q1–Q2 2026) | Claude Desktop has millions of users. Directories forming. | Build multi-user support (small lift). No marketing. |
| Late 2026 | Directories discoverable. "Install this MCP server" is natural. | Get listed. Monitor organic pull. |
| 2027 | Marketplace dynamics emerge. Extension stores form. | If pull appears, invest in packaging/onboarding. |

---

## Doc Corrections Needed

These documents have known misalignments with the codebase and resolved strategy. Flag for Justin to update in his voice:

### VISION.md — GTM Funnel (Line 94–117)

**Current:**
```
Free Snapshot → Renubu Workflows → GFT Network Intelligence → Platform
```

**Should reflect Path 7:**
```
Free ARI Snapshot → ARI Paid Monitoring → ARI API (agencies)
                                        ↘
                  Renubu (sequenced, context-enriched by spine)
```

The current funnel implies Renubu is the immediate upsell from the free snapshot. The resolved strategy monetizes ARI directly first, with Renubu sequenced after the spine is enriched.

### ARCHITECTURE.md — Integration Matrix

| Integration | ARCHITECTURE.md Says | Reality |
|-------------|---------------------|---------|
| Renubu → HumanOS context | "Working" | **Designed** — renubu-mcp exists but UI doesn't call it |
| ARI → Entity metadata | "Planned" | **Working** — bridge code is implemented and integrated |
| GFT → Entity spine | "Designed" | **Working** — `syncGoalToEntity()` is implemented |

### ARCHITECTURE.md — Paths and Ports

Several paths reference the pre-monorepo layout (`fancy-robot/web` instead of `core/apps/fancy-robot`). PM2 names use `humanos:` prefix in the new ecosystem.config.js, not the mixed namespace from root config.

### GAPS.md — Status Updates

| Gap | Current Status | Should Be |
|-----|---------------|-----------|
| #3 (Renubu → HumanOS) | Designed (~16h) | Designed (~24-32h per Strategic Brief) |
| ARI → Entity | Not listed separately | **Working** — bridge code exists and is integrated |
| GFT → Entity | "Planned" in roadmap | **Working** for goals, ~2h to extend to contacts/companies |

---

## Energy Framework

**The problem:** Justin's ENTP 7w8 + ADHD energy generates brilliant features (ARI publication scoring, GFT voice dictation, GoodHang Wispr Flow) but these features don't advance the revenue timeline. The energy is aimed at the right products but the wrong features.

**The solution is not "stop building fun stuff."** That kills the energy that makes everything work. The solution is structured freedom.

### The 80/15/5 Rule

| Allocation | What | Examples |
|------------|------|---------|
| **80%** | Sprint commitment | ARI Stripe, monitoring dashboard, historical tracking |
| **15%** | Adjacent exploration | ARI publication scoring, scoring methodology refinements, new model integrations |
| **5%** | Wild card | Whatever is intellectually exciting — GFT features, GoodHang experiments, new MCP tools |

### Daily Practice

1. **Start the day with the sprint.** First engineering block (2-3 hours) is always sprint work. Non-negotiable.
2. **Earn the exploration.** After hitting the day's sprint target, build whatever you want. The creativity isn't the problem — doing it first is.
3. **Weekly checkpoint.** Every Monday: "What did I ship toward the sprint? What did I explore? Am I on track for the sprint exit criteria?"

### What "On Track" Looks Like

| Week | Sprint 1 Progress | On Track? |
|------|-------------------|-----------|
| Week 1 | Stripe checkout working, basic subscription flow | Yes if payments process |
| Week 2 | Monitoring dashboard shows score history | Yes if a user can see their data |
| Week 3 | Alerts + competitive comparison | Yes if the product feels complete |
| Week 4 | Landing page live, first LinkedIn posts, first paid user | Yes if someone pays |

### What "Off Track" Looks Like

- Week 2 and you've built a new ARI feature instead of the monitoring dashboard
- Week 3 and Stripe isn't connected but you've added three new MCP tools
- You can articulate what you built this week but not how it advances Sprint 1

**The test:** Can a stranger go from "What's my AI visibility score?" to "Take my money for monitoring" by end of Week 4? If yes, the sprint succeeded regardless of what else got built. If no, exploration ate the sprint.

---

## Reference: Effort Estimates

| Item | Hours | Source |
|------|-------|--------|
| Phase 0 completion | ~4-6h | Codebase audit |
| Context Layer Back of House | **~7h (done)** | Mar 4 session — types, gatherers, API |
| Context Layer type generalization | ~2h | Mar 4 planning |
| Context Layer Front of House (MCP) | ~3h | Mar 4 planning |
| Context Layer domain adapters (ARI, GFT, FounderOS) | ~12h | Mar 4 planning |
| ARI paid tier (Sprint 1) | ~63h | Strategic Brief v2 + ARI adapter (+3h) |
| Platform demo (Sprint 2) | ~7h | Revised up from 5h — Context Layer MCP tools replace scripted queries |
| Portfolio simplification (Sprint 3a) | ~10h | +2h for proper architecture (gatherers → core/packages/) |
| Adventure → GoodHang migration (Sprint 3b) | ~13h | Codebase audit, Mar 3 planning session |
| Renubu design partner maintenance | ~2h/week | Strategic Brief v2 |
| Renubu → HumanOS context wiring | **~8-10h** | Down from 24-32h — Context Layer front-loads integration |
| Full integration (all products → spine) | **~120-150h** | Down from 180-220h — shared gatherers, domain adapters |
| Unified auth (SSO across products) | ~60-80h | Strategic Brief v2 (unchanged) |

---

## Phase 3–4 (Deferred, Decision-Gated)

The original roadmap had Phase 3 (Network Effects) and Phase 4 (Platform) as scheduled work. These are now **decision-gated milestones**, not scheduled phases. They activate based on revenue data, fundraising outcomes, and organic pull — not calendar dates.

### Phase 3 — Network Effects (activates if: platform demo drives fundraising, or organic cross-product queries emerge)

| Task | Effort | Trigger |
|------|--------|---------|
| Cross-product graph queries (multi-hop) | ~16h | Platform demo proves the concept |
| PowerPak ↔ GoodHang expert matching | ~20h | Expert supply exists |
| Unified search across all entity types | ~12h | Entity count justifies it |
| Shared auth implementation (SSO) | ~60-80h | Multi-user products require it |
| Cross-project MCP (one config, all tools) | ~8h | MCP directories mature |

### Phase 4 — Platform (activates if: raised seed round, or ARI revenue justifies engineering investment)

| Task | Effort | Trigger |
|------|--------|---------|
| Public REST API with docs | ~24h | External developers request access |
| API key self-service | ~16h | API tier has paying customers |
| Rate limiting and usage metering | ~12h | Scale requires it |
| MCP marketplace | ~24h | MCP ecosystem supports it |
| Multi-tenant platform onboarding | ~32h | Multiple organizations need access |
