# Schema Consolidation Analysis

Cross-project table inventory from 4 Supabase instances. For each table: intent, active usage assessment, and consolidation recommendation.

## Legend

- **KEEP (app)** — App-specific, move to its schema
- **KEEP (shared)** — Used by multiple apps, stays in `public` or moves to `human_os`
- **DUPLICATE** — Exists in multiple places, consolidate into one
- **DROP** — Unused, deprecated, or superseded
- **ALREADY THERE** — Already in the target schema on human-os instance

---

## 1. Good Hang (standalone instance → `goodhang` schema)

| Table | Cols | Intent | Active? | Recommendation |
|-------|------|--------|---------|----------------|
| `admin_notifications` | 7 | Admin alerts for member activity | Yes | **KEEP (app)** → `goodhang.admin_notifications` |
| `applications` | 12 | Membership applications | Yes | **KEEP (app)** → `goodhang.applications` |
| `assessment_badges` | 7 | CS assessment badge definitions | Yes | **KEEP (app)** → `goodhang.assessment_badges` |
| `beacon_pings` | 4 | Proximity beacon pings | Low | **KEEP (app)** — beacon feature set |
| `beacon_responses` | 5 | Responses to beacon pings | Low | **KEEP (app)** — beacon feature set |
| `beacons` | 13 | Location beacons ("I'm here") | Low | **KEEP (app)** — beacon feature set |
| `contacts` | 13 | Invite contacts for members | Yes | **KEEP (app)** → `goodhang.contacts` (different from renubu/gft contacts) |
| `cs_assessment_sessions` | 35 | Cultural Sculptor assessments | Yes (core feature) | **DUPLICATE** — also in human-os `public`. GH version has extra cols (personality_type, lightning_round, absurdist). Merge into `human_os.cs_assessment_sessions` with superset columns |
| `email_subscribers` | 4 | Marketing email list | Yes | **KEEP (app)** → `goodhang.email_subscribers` |
| `events` | 14 | Community events | Yes | **KEEP (app)** → `goodhang.events` |
| `favor_blocks` | 4 | Block list for favor system | Low | **KEEP (app)** — favor feature set |
| `favor_listings` | 7 | Favors available to trade | Low | **KEEP (app)** — favor feature set |
| `favor_messages` | 7 | Messages within favor trades | Low | **KEEP (app)** — favor feature set |
| `favor_proposals` | 8 | Proposals for favor trades | Low | **KEEP (app)** — favor feature set |
| `favor_tokens` | 12 | NFT-style favor tokens | Low | **KEEP (app)** — favor feature set |
| `favors` | 15 | Active favor exchanges | Low | **KEEP (app)** — favor feature set |
| `invite_codes` | 8 | Membership invite codes | Yes | **KEEP (app)** → `goodhang.invite_codes` |
| `lightning_round_questions` | 7 | Assessment rapid-fire questions | Yes | **KEEP (app)** → `goodhang.lightning_round_questions` |
| `member_characters` | 21 | D&D-style character sheets | Yes | **KEEP (app)** → `goodhang.member_characters` |
| `member_characters_for_breakouts` | 23 | Denormalized view for breakout rooms | View? | **DROP if view** — can be recreated as a view on `member_characters` |
| `pending_invites` | 8 | Outstanding invitations | Yes | **KEEP (app)** → `goodhang.pending_invites` |
| `prague_underground_claims` | 7 | Prague event scavenger hunt | One-off event | **DROP** — event-specific, data can be archived |
| `prague_underground_users` | 6 | Prague event participants | One-off event | **DROP** — event-specific |
| `profiles` | 19 | Member profiles | Yes (core) | **DUPLICATE** — conflicts with human-os `public.profiles`. GH version has assessment_status, beacon fields, membership_tier. Move to `goodhang.profiles`, keep `human_os.users` as canonical identity |
| `public_profiles` | 19 | Published assessment profiles | Yes | **KEEP (app)** → `goodhang.public_profiles` |
| `regions` | 6 | Geographic regions/chapters | Yes | **KEEP (app)** → `goodhang.regions` |
| `roadtrip_interests` | 20 | Roadtrip stop interest signups | Yes (roadtrip) | **KEEP (app)** → `goodhang.roadtrip_interests` |
| `roadtrip_messages` | 5 | Roadtrip contact messages | Yes (roadtrip) | **KEEP (app)** → `goodhang.roadtrip_messages` |
| `rsvps` | 7 | Event RSVPs | Yes | **KEEP (app)** → `goodhang.rsvps` |

**Summary:** 29 tables. ~25 keep as `goodhang.*`, 2 drop (prague, member_characters_for_breakouts if view), 2 duplicates to resolve (profiles, cs_assessment_sessions).

---

## 2. Renubu Production (standalone instance → `renubu` schema)

| Table | Cols | Intent | Active? | Recommendation |
|-------|------|--------|---------|----------------|
| `account_plan_activities` | 17 | Account plan action items | Yes | **KEEP (app)** → `renubu.account_plan_activities` |
| `action_executions` | 8 | Workflow action execution log | Yes | **KEEP (app)** → `renubu.action_executions` |
| `active_workflows` | 11 | View: currently running workflows | View | **DROP** — recreate as view |
| `adventure_messages` | 5 | GTM Adventure chat messages | Yes (GTM) | **WRONG DB** — belongs in powerpak/GTM, not renubu. Move to `public` or separate |
| `adventure_sessions` | 15 | GTM Adventure game sessions | Yes (GTM) | **WRONG DB** — same as above |
| `adventure_visitors` | 16 | GTM Adventure visitor profiles | Yes (GTM) | **WRONG DB** — same as above |
| `alerts` | 10 | CS platform alerts | Yes | **KEEP (app)** → `renubu.alerts` |
| `app_settings` | 4 | Key-value app config | Yes | **KEEP (app)** → `renubu.app_settings` |
| `automation_rule_executions` | 8 | Automation rule run log | Yes | **KEEP (app)** → `renubu.automation_rule_executions` |
| `automation_rules` | 6 | User-defined automation rules | Yes | **KEEP (app)** → `renubu.automation_rules` |

**Note:** Renubu prod dump only returned 10 tables (the query may have been truncated or this is a partial export). The staging `demo.*` schema shows the fuller picture with: account_plans, alerts, companies, contacts, contract_terms, contracts, customer_features, customer_properties, customers.

**Expected full renubu table set** (from staging + migrations):

| Table | Intent | Recommendation |
|-------|--------|----------------|
| `account_plans` | Renewal account plans | **KEEP (app)** |
| `companies` | Customer companies | **KEEP (app)** — renubu-specific company data (could link to `human_os.entities`) |
| `contacts` | Customer contacts | **KEEP (app)** — different from GH/GFT contacts (has role_type, engagement_level) |
| `contract_terms` | Contract clause details | **KEEP (app)** |
| `contracts` | SaaS contracts (ARR, seats, dates) | **KEEP (app)** |
| `customer_features` | Feature adoption tracking | **KEEP (app)** |
| `customer_properties` | Health/NPS/churn scores | **KEEP (app)** |
| `customers` | Core customer entities | **KEEP (app)** — could FK to `human_os.entities` |
| `workflow_definitions` | Workflow templates | **KEEP (app)** |
| `workflow_executions` | Workflow run history | **KEEP (app)** |
| `pricing_*` | Pricing models | **KEEP (app)** |

---

## 3. Renubu Staging (separate instance, `demo` schema)

All 9 tables are a subset of renubu prod, already namespaced under `demo.*`. This is seed data for demos.

**Recommendation:** **DROP the entire staging instance.** Use branch-based Vercel previews + seed scripts instead. The `demo` schema concept can live as a seed migration in the consolidated DB if needed.

---

## 4. Human-OS (consolidated instance — ALREADY the target)

This is the target database. Tables are already organized into schemas. Here's the audit:

### `crm.*` (13 tables) — GFT CRM pipeline

| Table | Cols | Intent | Active? | Recommendation |
|-------|------|--------|---------|----------------|
| `account_context` | 17 | Account enrichment data | Yes | **ALREADY THERE** |
| `campaign_activities` | 11 | Campaign touchpoint log | Yes | **ALREADY THERE** |
| `campaign_members` | 14 | Contacts in a campaign | Yes | **ALREADY THERE** |
| `campaigns` | 16 | Outreach campaigns | Yes | **ALREADY THERE** |
| `contact_submissions` | 9 | Inbound contact forms | Yes | **ALREADY THERE** |
| `goal_activities` | 6 | Goal progress activities | Yes | **ALREADY THERE** |
| `goals` | 17 | Sales/relationship goals | Yes | **ALREADY THERE** |
| `hot_list` | 6 | View: hottest contacts | View | **ALREADY THERE** |
| `opportunities` | 24 | Sales pipeline opportunities | Yes | **ALREADY THERE** |
| `opportunity_activities` | 9 | Opp touchpoint log | Yes | **ALREADY THERE** |
| `opportunity_line_items` | 9 | Opp product lines | Yes | **ALREADY THERE** |
| `pipeline_stages` | 11 | Pipeline stage definitions | Yes | **ALREADY THERE** |
| `products` | 13 | CRM product catalog | Yes | **ALREADY THERE** |

### `fancyrobot.*` (15 tables) — ARI scoring engine

All 15 tables are **ALREADY THERE** and active:
- `article_publications`, `article_runs` — article pipeline
- `audit_prompt_results`, `audit_runs` — AI audit scoring
- `brand_cache`, `snapshot_*` — brand intelligence
- `distributors`, `publications`, `publication_*` — distribution network
- `gumshoe_payloads` — audit payload cache
- `promo_codes` — gating

### `founder_os.*` (28 tables) — Personal productivity

All 28 tables are **ALREADY THERE**. Key groups:
- **Planning:** check_ins, daily_plans, priorities, tasks, goals, okr_goals, projects, milestones
- **Relationships:** relationships, relationship_contexts, messages, missive_bridge, missive_contact_map
- **Identity:** identity_profiles, onboarding_state, emotion_analyses, persona_fingerprints (wait — also in `human_os`)
- **Productivity:** production_sessions, transcripts, claude_queue
- **Moods:** mood_categories, mood_category_mappings (wait — also in `human_os`)

### `gft.*` (12 tables) — Network intelligence

All 12 tables are **ALREADY THERE**:
- `contacts` (53 cols!) — massive LinkedIn enrichment
- `companies` — company profiles
- `activities` — outreach log
- `personas` — ICP definitions
- `li_posts`, `li_post_engagements`, `post_engagement` — LinkedIn engagement tracking
- `regions` — geographic targeting
- `expert_*` — expert marketplace (4 tables)

### `global.*` (3 tables) — Shared entity layer

- `entities` — canonical person/company records
- `entity_embeddings` — vector embeddings
- `entity_signals` — behavioral signals

### `human_os.*` (45 tables) — Core platform

The platform spine. All active. Key groups:
- **Identity:** users, entities, entity_links, entity_products, access_grants
- **Context:** context, context_files, context_shares, aliases, execution_logs
- **Journal:** journal_entries, journal_entry_moods, journal_entity_mentions, journal_leads
- **Voice:** voice_profiles, voice_commandments, voice_input_sources
- **Assessment:** cs_assessment_sessions (duplicate!), persona_fingerprints (duplicate!), work_style_fingerprints, identity_profiles
- **Mood:** mood_categories, mood_category_mappings, mood_definitions (duplicates with founder_os!)
- **MCP:** mcp_provider_registry, user_mcp_providers, mcp_extraction_log
- **Commerce:** subscriptions, payment_history, products, user_products, activation_keys, api_keys
- **Analytics:** interactions, usage_events, onboarding_progress, user_frameworks, framework_chunks, transcripts

### `x_human.*` (2 tables) — Legacy/migration staging

- `activation_keys`, `user_products` — **DROP** — superseded by `human_os.activation_keys` and `human_os.user_products`

### `public.*` (38 tables) — Mixed bag, needs triage

This is where the mess is. Tables in `public` on the human-os instance that should be moved:

| Table | Intent | Should be in | Notes |
|-------|--------|-------------|-------|
| `activation_keys` | Key redemption | `human_os` | **DUPLICATE** of `human_os.activation_keys` — different schema |
| `api_key_usage` | API analytics | `human_os` | Pair with `human_os.api_keys` |
| `api_keys` | API key management | `human_os` | **DUPLICATE** of `human_os.api_keys` — different columns |
| `campaigns` | Simplified campaign table | **DROP** | Superseded by `crm.campaigns` (richer) |
| `claude_capture_queue` | Claude output capture | `human_os` | Move |
| `claude_conversations` | Conversation history | `human_os` | Move |
| `contacts` | LinkedIn contacts | `gft` | **DUPLICATE** of `gft.contacts` — simpler version, likely legacy |
| `context_files` | Context file index | `human_os` | **DUPLICATE** of `human_os.context_files` — different columns |
| `conversation_turns` | Conversation messages | `human_os` | Pair with claude_conversations |
| `cs_assessment_sessions` | Cultural Sculptor | `human_os` | **DUPLICATE** — exists in goodhang AND human_os schema |
| `entities` | Entity records | `human_os` | **DUPLICATE** of `human_os.entities` — different columns (has slug, privacy_scope) |
| `entity_answers` | Q&A for entities | `human_os` | Move |
| `entity_dimensions` | Computed dimensions | `human_os` | Move |
| `entity_links` | Entity relationships | `human_os` | **DUPLICATE** of `human_os.entity_links` — different columns |
| `entity_scorecard` | Completion scores | `human_os` | Move (view?) |
| `glossary` | Term definitions | `human_os` | Move |
| `identity_packs` | Exported identity bundles | `human_os` | Move |
| `intel_requests` | Intel request queue | `human_os` | Move |
| `journal_entity_mentions` | Journal → entity links | `human_os` | **DUPLICATE** of `human_os.journal_entity_mentions` |
| `journal_entries` | Journal entries | `human_os` | **DUPLICATE** of `human_os.journal_entries` |
| `journal_entry_moods` | Journal mood tags | `human_os` | **DUPLICATE** of `human_os.journal_entry_moods` |
| `journal_leads` | Journal-discovered leads | `human_os` | **DUPLICATE** of `human_os.journal_leads` |
| `li_post_engagements` | LinkedIn engagement | `gft` | **DUPLICATE** of `gft.li_post_engagements` |
| `li_posts` | LinkedIn posts | `gft` | **DUPLICATE** of `gft.li_posts` |
| `mcp_tool_calls` | Tool call log | `human_os` | Move |
| `mood_definitions` | Mood definitions | `human_os` | **DUPLICATE** of `human_os.mood_definitions` |
| `outreach_queue` | Outreach message queue | `crm` or `gft` | Move |
| `pitch_messages` | Pitch/meeting requests | `crm` | Move |
| `profiles` | User profiles | `human_os` | **DUPLICATE** — conflicts with goodhang `profiles`. Merge into `human_os.users` |
| `question_set_progress` | Q-set completion | `human_os` | Move (likely a view) |
| `question_set_questions` | Q-set membership | `human_os` | Move |
| `question_sets` | Assessment question sets | `human_os` | Move |
| `questions` | Assessment questions | `human_os` | Move |
| `relationship_context` | Relationship intel | `human_os` | Move |
| `sculptor_responses` | Sculptor conversation | `human_os` | Move |
| `sculptor_sessions` | Sculptor sessions | `human_os` | Move |
| `sculptor_templates` | Sculptor templates | `human_os` | Move |
| `skills_programs` | SKILL.md programs | `human_os` | Move |
| `skills_tools` | SKILL.md tools | `human_os` | Move |
| `user_preferences` | User prefs | `human_os` | Move |
| `user_tenants` | Multi-tenancy | `human_os` | Move |

---

## Key Conflicts to Resolve

### 1. `profiles` (3 versions!)
- **goodhang:** 19 cols — membership_tier, beacon fields, assessment_status
- **human-os public:** 10 cols — email, full_name, avatar_url, role
- **human-os human_os.users:** 12 cols — slug, display_name, auth_id, entity_id

**Resolution:** `human_os.users` is canonical identity. goodhang.profiles extends with app-specific fields (FK to `human_os.users.id`). Drop `public.profiles` — merge any unique fields into `human_os.users`.

### 2. `cs_assessment_sessions` (3 versions!)
- **goodhang:** 35 cols — has personality_type, lightning_round, absurdist questions
- **human-os public:** 28 cols — has character_profile, attributes, signals, matching
- **human-os human_os:** (via emotion_analyses) — different approach

**Resolution:** Merge into `human_os.cs_assessment_sessions` with superset of all columns. GH and public versions have different extra columns — both are needed.

### 3. `contacts` (4 versions!)
- **goodhang:** 13 cols — invite-focused (invite_code, source)
- **renubu:** 14 cols — customer-focused (role_type, engagement_level)
- **gft:** 53 cols — LinkedIn-focused (massive enrichment)
- **human-os public:** 19 cols — simplified version

**Resolution:** These serve genuinely different purposes. Keep as app-specific:
- `goodhang.contacts` — member invites
- `renubu.contacts` — customer stakeholders
- `gft.contacts` — LinkedIn network
- Drop `public.contacts` (legacy, use `gft.contacts`)
- All can FK to `global.entities` or `human_os.entities` for cross-app linking

### 4. `mood_*` tables (duplicate in human_os + founder_os)
- `mood_categories` in both `human_os` and `founder_os`
- `mood_category_mappings` in both
- `mood_definitions` in `human_os` + `public`

**Resolution:** Keep only in `human_os` — these are reference data. `founder_os` tables FK to `human_os.mood_*`.

### 5. `journal_*` tables (duplicate in human_os + public)
- All 4 journal tables exist in both `human_os.*` and `public.*`

**Resolution:** Keep only `human_os.*` versions. Drop `public.*` duplicates.

### 6. `entity/entity_links` (duplicate in human_os + public + global)
- `human_os.entities` — platform entities (entity_type, slug, metadata)
- `public.entities` — richer (has privacy_scope, source_system, name_embedding)
- `global.entities` — canonical (linkedin_url, confidence_score)

**Resolution:** Merge into one. `human_os.entities` should absorb all unique columns from `public.entities` and `global.entities`. The `global` schema might still serve as a cross-app view.

---

## Migration Priority

1. **Quick wins (Phase 4.2):** Move renubu tables → `renubu.*` schema, goodhang tables → `goodhang.*` schema
2. **Dedup (Phase 4.3):** Resolve the 6 conflicts above by merging column supersets
3. **Cleanup (Phase 4.4):** Drop `public.*` duplicates, `x_human.*`, renubu-staging instance
4. **Client update (Phase 4.5):** Update Supabase clients with `db.schema` option

## Table Counts by Schema (Target State)

| Schema | Tables | Purpose |
|--------|--------|---------|
| `human_os` | ~55 | Platform core (identity, context, journal, voice, commerce, analytics) |
| `goodhang` | ~25 | Community, events, assessments, favors, beacons |
| `renubu` | ~15 | CS platform (customers, contracts, workflows, pricing) |
| `fancyrobot` | 15 | ARI scoring, articles, publications |
| `founder_os` | ~22 | Personal productivity (tasks, goals, projects, relationships) |
| `gft` | 12 | Network intelligence (contacts, companies, LinkedIn) |
| `crm` | 13 | Sales pipeline (opportunities, campaigns) |
| `global` | 3 | Cross-app entity resolution |
| `public` | ~15 | Assessment framework (questions, sculptor, skills) + auth |
