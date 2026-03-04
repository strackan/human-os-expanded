# Sprint 1 Plan — ARI Paid Tier

**Duration:** 4 weeks (~76h)
**Goal:** A stranger can find ARI, check their score for free, and pay — either for ongoing monitoring (Pro $99/mo) or a one-time deep competitive intelligence report (Elite $299).
**Exit test:** Can someone go from "What's my AI visibility score?" to "Take my money" by end of Week 4?

---

## Current State (What Exists)

**Fancy Robot** (`core/apps/fancy-robot/`) — Next.js 16 marketing site
- Homepage with hero, pricing display (3 tiers), contact form, FAQ
- `/snapshot` flow: domain input → SSE analysis → gated results → email capture → PDF
- Promo code system (validation via ARI backend)
- Share pages (`/snapshot/share/[jobId]`)
- HumanOS entity context panel (graceful degradation)
- Resend email integration (report delivery + founder notifications)
- Supabase: `fancyrobot.snapshot_runs`, `crm.contact_submissions`

**ARI Backend** (`core/apps/ari/backend/`) — FastAPI
- Multi-model scoring across 5 providers (OpenAI, Claude, Gemini, Perplexity, xAI)
- 30+ weighted prompts for content syndication category
- Full audit pipeline with SSE streaming (10 phases)
- Lite report pipeline (fast snapshot)
- PDF/PPTX generation
- SQLite local persistence + Supabase cloud persistence
- Entity spine bridge (`find_or_create_entity`, `update_entity_ari_score`)
- Cost tracking (per-run, not billed)
- Event emitter (exists, not wired to billing)

**What does NOT exist:**
- No user accounts or authentication
- No Stripe integration
- No subscription management
- No monitoring dashboard (score history, trends)
- No alerting system
- No multi-brand management
- No competitive comparison over time

---

## Architecture Decisions

### 1. Auth: Supabase Auth (not custom JWT)

Supabase Auth is already running on the shared instance. Use it for:
- Email/password signup + magic link login
- Session management via `@supabase/ssr` in Next.js
- Row-level security on `fancyrobot.*` tables using `auth.uid()`
- No need for a separate auth service

**Why not NextAuth or custom JWT?** Supabase Auth is already configured, RLS policies are the standard pattern across the platform, and it avoids adding another dependency.

### 2. Payments: Stripe Checkout + Webhooks (not custom forms)

Per the roadmap: use Stripe Checkout, not custom payment forms.
- Stripe Checkout Session for initial subscription
- Stripe Customer Portal for self-service (upgrade, cancel, billing)
- Webhooks for lifecycle events → update `fancyrobot.subscriptions` table
- Store `stripe_customer_id` on the user profile

### 3. Where the dashboard lives: Fancy Robot (not ARI frontend)

The paying user interacts with Fancy Robot (the Next.js site at port 4200). The ARI frontend (Vite at port 4202) stays as the internal analysis tool. The monitoring dashboard is a new route group in Fancy Robot: `/dashboard`.

### 4. Score storage: Supabase (not just SQLite)

Historical scores need to be queryable for dashboards and alerts. Move from SQLite-only to Supabase as the source of truth for paid-tier data:
- `fancyrobot.score_history` — one row per score run per brand
- `fancyrobot.monitored_brands` — brands a user is tracking
- SQLite stays for the ARI backend's operational cache

### 5. Scoring cadence: Daily cron via Supabase

Paid users get daily score snapshots. Use a Supabase scheduled function (pg_cron) or a simple cron job on the ARI backend that:
1. Queries `fancyrobot.monitored_brands` for active subscriptions
2. Runs the scoring engine for each brand
3. Stores results in `fancyrobot.score_history`
4. Fires alerts if thresholds are crossed

---

## Database Schema (New Tables)

All in `fancyrobot` schema, protected by RLS.

```sql
-- User profiles (extends auth.users)
create table fancyrobot.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  company text,
  stripe_customer_id text unique,
  plan text not null default 'free',  -- free | pro
  plan_status text not null default 'active', -- active | past_due | canceled
  billing_interval text, -- monthly | annual (null for free)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subscriptions (synced from Stripe webhooks)
create table fancyrobot.subscriptions (
  id text primary key, -- stripe subscription id
  user_id uuid not null references fancyrobot.profiles(id),
  stripe_price_id text not null,
  plan text not null, -- pro
  status text not null, -- active | past_due | canceled | trialing
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Brands a user is monitoring
create table fancyrobot.monitored_brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references fancyrobot.profiles(id),
  domain text not null,
  company_name text,
  entity_id uuid, -- FK to human_os.entities
  is_primary boolean default false, -- the user's own brand
  competitors text[] default '{}', -- domains to compare against
  alert_threshold int, -- score drop triggers alert (e.g. 5 points)
  created_at timestamptz default now(),
  unique(user_id, domain)
);

-- Historical scores (one row per brand per scoring run)
create table fancyrobot.score_history (
  id uuid primary key default gen_random_uuid(),
  monitored_brand_id uuid not null references fancyrobot.monitored_brands(id),
  user_id uuid not null references fancyrobot.profiles(id),
  domain text not null,
  overall_score numeric(5,2),
  mention_rate numeric(5,4),
  provider_scores jsonb, -- {"openai": 48.5, "anthropic": 42.1, ...}
  total_prompts int,
  mentions_count int,
  run_id text, -- reference to ARI analysis_runs.id
  scored_at timestamptz default now()
);

-- Elite report runs (one-time purchases)
-- Elite report runs (one-time or annual purchases)
create table fancyrobot.elite_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references fancyrobot.profiles(id),
  primary_domain text not null,
  primary_company_name text,
  competitor_domains text[] not null default '{}', -- up to 3
  status text not null default 'pending', -- pending | running | complete | failed
  -- Gumshoe data
  gumshoe_report_id text, -- Gumshoe report ID
  gumshoe_run_ordinal int,
  gumshoe_visibility jsonb, -- parsed visibility scores
  gumshoe_citations jsonb, -- top cited sources
  gumshoe_raw jsonb, -- full raw data
  -- ARI data
  primary_audit_id text, -- FK to audit_runs
  primary_companion_id text, -- companion scan run ID
  competitor_audit_ids text[] default '{}', -- FK to audit_runs for each competitor
  -- Fusion
  fusion_report jsonb, -- composed report sections
  fusion_pdf_url text,
  -- Scores summary
  primary_ari_score numeric(5,2),
  primary_gumshoe_score numeric(5,2),
  competitor_scores jsonb, -- [{domain, ari_score}]
  -- Cost tracking
  gumshoe_cost_usd numeric(8,2) default 68.00,
  ari_cost_usd numeric(8,2),
  total_cost_usd numeric(8,2),
  -- Stripe
  stripe_payment_intent_id text,
  -- Timestamps
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Alert log
create table fancyrobot.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references fancyrobot.profiles(id),
  monitored_brand_id uuid not null references fancyrobot.monitored_brands(id),
  alert_type text not null, -- score_drop | threshold_crossed | competitor_change
  message text not null,
  details jsonb,
  sent_at timestamptz default now(),
  read_at timestamptz
);

-- RLS policies
alter table fancyrobot.profiles enable row level security;
alter table fancyrobot.subscriptions enable row level security;
alter table fancyrobot.monitored_brands enable row level security;
alter table fancyrobot.score_history enable row level security;
alter table fancyrobot.alerts enable row level security;

-- Users can only see their own data
create policy "Users see own profile" on fancyrobot.profiles
  for all using (auth.uid() = id);
create policy "Users see own subscriptions" on fancyrobot.subscriptions
  for all using (auth.uid() = user_id);
create policy "Users see own brands" on fancyrobot.monitored_brands
  for all using (auth.uid() = user_id);
create policy "Users see own scores" on fancyrobot.score_history
  for all using (auth.uid() = user_id);
create policy "Users see own alerts" on fancyrobot.alerts
  for all using (auth.uid() = user_id);
create policy "Users see own elite runs" on fancyrobot.elite_runs
  for all using (auth.uid() = user_id);
```

---

## Pricing Tiers

Standard 3-column pricing page. Free on left, Pro (highlighted) in center, Elite on right.
Toggle at top: **Ad-hoc | Annual** — switches prices across all columns.

### Pricing Matrix

| | Free | Pro | Elite |
|---|---|---|---|
| **Ad-hoc price** | Free | $99/mo | $299/report |
| **Annual price** | Free | $69/mo ($828/yr) | $199/yr |
| | | | |
| AI Visibility Snapshot | Unlimited | Unlimited | Included |
| Save & track results | Login to save | Yes | Yes |
| Models queried | 1 (Lite: 20 prompts) | 5 (Full Audit: 60 prompts, 4-factor) | 5 + Gumshoe |
| Scoring depth | Overall ARI + mention rate | 4-factor (mention freq, position, narrative, founder) + anti-patterns | 4-factor + anti-patterns + companion gap analysis |
| Historical scores | — | 90 days | — |
| Daily monitoring | — | Yes | — |
| Brands tracked | — | 1 | 1 + 3 competitors |
| Quarterly competitive insights | — | Yes (3 competitors) | — |
| Gumshoe citation analysis | — | — | Primary brand |
| ARI Companion scan | — | — | Primary brand |
| Competitor deep audits | — | Quarterly snapshot | 3 full audits |
| Alerts | — | Email (score drops, thresholds) | — |
| Fusion report (PDF) | — | — | Yes (all 4 brands) |
| Shareable reports | Yes | Yes | Yes |

### Ad-hoc vs. Annual Toggle

The pricing page has a single toggle that switches all prices. When "Annual" is selected:

| Tier | Ad-hoc | Annual | Discount | Annual Margin |
|---|---|---|---|---|
| Pro | $99/mo | $69/mo ($828/yr) | 30% off | ~79-84% |
| Elite | $299/report | $199/yr (1 report) | 33% off | ~56% |

**Future conversion lever (not at launch):** Annual Pro subscribers could get one free Elite report per year as a bonus. Costs ~$88 to generate on $828/yr revenue — still ~71% margin. Hold this in reserve to boost Pro annual conversion if needed.

### Free Tier

The free snapshot is always available — no signup required. Users can **login to save their results** and view past snapshots. This is the top of funnel: run your scan, see your number, feel the pain.

- 1 AI model (Anthropic Haiku), 20 prompts, 7 dimensions
- Results in ~30 seconds
- Gated: full findings behind email capture
- Login optional: creates a profile, saves snapshot history
- No monitoring, no daily updates, no alerts

### Pro Tier — The Highlighted Middle Column

The "you should pick this one" tier. Full deep audit + daily monitoring + quarterly competitive insights.

**Ad-hoc:** $99/mo | **Annual:** $69/mo ($828/yr, 30% off)

**What Pro includes:**
- **Full ARI Audit on signup:** 5 providers, 60 prompts, 8 dimensions, 4-factor scoring, anti-pattern detection, gap analysis — the whole thing
- **Daily monitoring:** Automated daily scoring runs, trend charts, provider breakdown
- **1 brand tracked** with dashboard (score history, trend direction, rolling averages)
- **Quarterly competitive insights:** Every 90 days, the system runs full audits on 3 competitors and generates a competitive comparison report
- **Email alerts:** Score drops, threshold crossings, competitor movements
- **Full audit PDF:** Downloadable report, refreshed monthly

**Pro economics:**
| Cost Component | Annual |
|---|---|
| Daily monitoring (cheap models, 365 runs) | ~$55 |
| Monthly full audit refreshes (12 runs) | ~$48 |
| Quarterly competitor audits (4 × 3 competitors) | ~$48 |
| **Total annual cost** | **~$150** |
| Revenue (ad-hoc) | $1,188/yr |
| Revenue (annual) | $828/yr |
| **Margin (ad-hoc / annual)** | **~87% / ~82%** |

### Elite Tier — The Full Picture

The "hire a consultant" option — a comprehensive competitive intelligence report combining external market data (Gumshoe) with ARI's proprietary scoring and diagnosis.

**Ad-hoc:** $299/report | **Annual:** $199/yr (1 report)

**What the customer gets:** A single fused PDF covering their brand + 3 competitors across every dimension that matters for AI visibility.

**What runs under the hood:**

| Component | Target | Provider | Est. Cost |
|---|---|---|---|
| Gumshoe Report | Primary brand | Gumshoe API | $68 |
| ARI Full Audit | Primary brand | 5 AI providers, 60 prompts, 4-factor scoring | ~$3-5 |
| ARI Companion Scan | Primary brand | Prompts designed to cover what Gumshoe doesn't | ~$2-3 |
| ARI Full Audit | Competitor 1 | 5 AI providers, 60 prompts | ~$3-5 |
| ARI Full Audit | Competitor 2 | 5 AI providers, 60 prompts | ~$3-5 |
| ARI Full Audit | Competitor 3 | 5 AI providers, 60 prompts | ~$3-5 |
| Fusion Report | All 4 brands | LLM synthesis pass | ~$1 |
| **Total hard cost** | | | **~$83-93** |

| | Ad-hoc | Annual |
|---|---|---|
| Price | $299 | $199/yr |
| Hard cost | ~$88 | ~$88 |
| Margin | ~71% | ~56% |

### Gumshoe Integration

Gumshoe API (Bearer token auth, key prefix `gsorg_`) provides:
- **Visibility scores** per AI model, per topic, per persona
- **Citation/source tracking** — which URLs AI models cite when discussing the brand
- **Mention ranking** — where the brand appears in each AI response (rank + reason)
- **Raw data** — every question asked, every answer received, every mention extracted

**API flow:**
1. Create/retrieve a Gumshoe report for the primary brand's domain
2. Poll `GET /v1/reports/{id}/runs/latest?status=complete` until ready
3. Fetch raw data: `GET /v1/reports/{id}/runs/{ordinal}/raw`
4. Extract: visibility scores, citation domains, persona coverage, model coverage

**Environment:** `GUMSHOE_API_KEY` (starts with `gsorg_`) added to ARI backend `.env`

### ARI Companion Scan (New Prompt Set)

The companion scan is a **new prompt set specifically designed to ask what Gumshoe doesn't.** Gumshoe covers visibility (are you mentioned?) and citations (what sources back you up?). The companion covers the diagnostic layer Gumshoe misses:

| Dimension | Why Gumshoe Misses It | Companion Prompt Examples |
|---|---|---|
| **Founder/Leadership Retrieval** | Gumshoe tracks brand mentions, not people | "Who founded {company}?", "Who is the CEO of {company}?", "What is {founder}'s background?" |
| **Narrative Accuracy** | Gumshoe checks IF you're mentioned, not WHETHER the facts are right | "Describe {company}'s main product", "What differentiates {company} from competitors?" — then score factual accuracy against brand profile |
| **Head-to-Head Comparison** | Gumshoe runs open queries, not forced comparisons | "{company} vs {competitor} — which is better for {use_case}?", "Compare {company} and {competitor}" |
| **Adjacent Category Reach** | Gumshoe scopes to declared topics | "Best {adjacent_category} providers" — does the brand show up in neighboring categories? |
| **Sentiment & Recommendation Type** | Gumshoe tracks mention rank but not sentiment or recommendation strength | Same prompts but parsed for: explicit recommendation vs. listed vs. mentioned, positive vs. cautionary vs. negative |
| **Anti-Pattern Detection** | Not in Gumshoe's scope | Run ARI's 10 named anti-patterns (Kleenex Effect, Premium Tax, Founder Invisibility, etc.) using full audit infrastructure |

**Estimated:** ~20 additional prompts across 5 providers = ~100 LLM calls for the companion scan.

### Fusion Report

The fusion report merges all data streams into a single deliverable:

```
1. Executive Summary
   - Overall ARI score (from full audit)
   - Gumshoe visibility score
   - Combined assessment / severity band

2. AI Visibility Landscape
   - Gumshoe: visibility by model, by topic, by persona
   - ARI: mention rate, position quality, recommendation types
   - Delta: where Gumshoe and ARI agree/disagree (validates findings)

3. Citation & Source Analysis (Gumshoe-exclusive)
   - Top cited sources when AI discusses the brand
   - Source categories (news, review sites, company content, Wikipedia)
   - Content strategy implications

4. Competitive Intelligence Matrix
   - Primary brand vs. 3 competitors across all dimensions
   - Per-model comparison (which AI favors whom)
   - Head-to-head results from companion scan

5. Diagnostic Analysis (ARI-exclusive)
   - 4-factor scoring breakdown (mention freq, position, narrative accuracy, founder retrieval)
   - Anti-pattern detection for all 4 brands
   - Gap analysis with prioritized fixes
   - Zero-mention diagnostic probes

6. Founder & Leadership Visibility (Companion-exclusive)
   - Does AI know your leadership?
   - Founder retrieval accuracy across models
   - Comparison: do competitor founders have better AI presence?

7. Recommendations
   - Prioritized action plan (from ARI gap analysis)
   - Content strategy informed by Gumshoe citation data
   - Quick wins vs. long-term investments
```

**Generation:** Single LLM synthesis pass (Claude editorial model) that ingests all data streams and produces the narrative. PDF generated via existing ARI pdf_generator.

---

## Milestone 1: Auth + Payment Infrastructure (Week 1, ~16h)

### 1.1 Supabase Auth Setup (~3h)

**Files to create/modify in `core/apps/fancy-robot/`:**

| Task | Details |
|------|---------|
| Install `@supabase/ssr` | Add to package.json |
| Create `lib/supabase-browser.ts` | Client-side Supabase with cookie-based auth |
| Create `lib/supabase-middleware.ts` | Middleware for session refresh |
| Create `middleware.ts` | Next.js middleware: refresh session, protect `/dashboard/*` routes |
| Create `app/(auth)/login/page.tsx` | Login page (email + magic link) |
| Create `app/(auth)/signup/page.tsx` | Signup page (email/password) |
| Create `app/(auth)/callback/route.ts` | Auth callback handler |
| Create `app/actions/auth.ts` | Server actions: login, signup, logout |
| Run Supabase migration | Create `fancyrobot.profiles` table + trigger to auto-create on signup |

**Auth flow:**
1. User signs up → Supabase creates `auth.users` row
2. Database trigger creates `fancyrobot.profiles` row (plan: `free`)
3. Free users can login to save snapshot results and view past scans
4. Pro users land on `/dashboard` with full audit + daily monitoring
5. Unauthenticated users hitting `/dashboard/*` redirect to `/login`
6. Free users hitting `/dashboard` see their saved snapshots + upgrade CTA

### 1.2 Stripe Integration (~8h)

**Files to create/modify:**

| Task | Details |
|------|---------|
| Install `stripe` | Add to package.json |
| Create `lib/stripe.ts` | Stripe client init (server-side only) |
| Create Stripe products | 4 prices: Pro monthly ($99/mo), Pro annual ($69/mo billed yearly at $828), Elite ad-hoc ($299 one-time), Elite annual ($199/yr recurring) |
| Create `app/api/stripe/checkout/route.ts` | Create Checkout Session → redirect to Stripe |
| Create `app/api/stripe/portal/route.ts` | Create Customer Portal session → redirect |
| Create `app/api/stripe/webhook/route.ts` | Handle Stripe webhook events |
| Add `STRIPE_SECRET_KEY` to .env | Plus `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Update `components/v2/pricing.tsx` | Wire "Get Started" buttons to checkout flow |

**Webhook events to handle:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create subscription record, update profile plan |
| `customer.subscription.updated` | Sync plan/status changes |
| `customer.subscription.deleted` | Mark canceled, downgrade to free |
| `invoice.payment_failed` | Mark past_due, send warning email |
| `invoice.paid` | Clear past_due if applicable |

**Checkout flow:**
1. User clicks "Get Started" on pricing → hits `/api/stripe/checkout`
2. Server creates Stripe Checkout Session (with `client_reference_id = user_id`)
3. User redirected to Stripe Checkout
4. On success → Stripe fires webhook → server creates subscription record
5. User redirected back to `/dashboard?welcome=true`

### 1.3 Subscription Gating (~2h)

| Task | Details |
|------|---------|
| Create `lib/subscription.ts` | Helper: `getUserPlan(userId)` → returns plan + limits |
| Update snapshot flow | If logged in, auto-save snapshot to profile. If not, prompt login to save. |
| Create `components/upgrade-prompt.tsx` | "Go Pro" CTA on free user dashboard |
| Gate `/dashboard` routes | Free users see saved snapshots + upgrade CTA. Pro users see full dashboard. |

### 1.4 Database Migration (~3h)

| Task | Details |
|------|---------|
| Create migration file | All new tables from schema above |
| Create profile trigger | `on auth.users insert → fancyrobot.profiles insert` |
| Create RLS policies | Per schema above |
| Test locally | Verify with Supabase local dev |
| Apply to cloud | Run migration on `zulowgscotdrqlccomht` |

**Week 1 exit criteria:** A user can sign up, see pricing with Ad-hoc/Annual toggle, pay through Stripe Checkout (Pro or Elite), and land on a `/dashboard` page that acknowledges their subscription. Free users can run unlimited snapshots and login to save results.

---

## Milestone 2: Monitoring Dashboard (Week 2, ~20h)

### 2.1 Brand Setup Flow (~4h)

**New route: `app/(dashboard)/dashboard/page.tsx`**

| Task | Details |
|------|---------|
| Create dashboard layout | `app/(dashboard)/layout.tsx` — sidebar nav, user menu |
| Create brand onboarding | "Add your brand" form: domain, company name, competitors |
| Create `app/actions/brands.ts` | Server actions: addBrand, removeBrand, updateBrand |
| Wire entity creation | On brand add → call ARI backend to discover + create entity |
| Initial score run | Trigger first score calculation on brand creation |

**Brand setup flow:**
1. New paid user lands on `/dashboard` → sees "Add your first brand"
2. User enters domain → ARI discovers company info (reuse lite-report discovery)
3. User confirms company name, adds up to N competitors
4. System triggers first full scoring run
5. Dashboard populates as scores come in

### 2.2 Score History Dashboard (~8h)

**New route: `app/(dashboard)/dashboard/[brandId]/page.tsx`**

| Component | Details |
|-----------|---------|
| `ScoreOverview` | Current ARI score (large gauge), last scored date, score delta |
| `ScoreTrendChart` | Line chart of overall score over time (recharts or chart.js) |
| `ProviderBreakdown` | Bar chart showing score per AI provider |
| `MentionRateChart` | Mention rate trend over time |
| `RecentChanges` | List of notable score changes with dates |

**Data flow:**
- Dashboard reads from `fancyrobot.score_history` via Supabase client
- Charts show data points from daily scoring runs
- Initial view may have only 1-2 data points (grows over time)

### 2.3 Competitive Comparison View (~4h)

**Component on brand detail page**

| Component | Details |
|-----------|---------|
| `CompetitorTable` | Side-by-side scores: your brand vs. competitors |
| `CompetitorTrendChart` | Overlaid line charts (your score + competitor scores) |
| `CompetitorInsights` | "You lead CompanyX by 12 points on Anthropic" highlights |

**How competitors work:**
- When user adds competitors, system creates monitored_brand entries for them too
- Competitor scores run on the same daily cadence
- Competitor data is read-only (user can't see competitor's dashboard)

### 2.4 Alert Configuration (~4h)

**New route: `app/(dashboard)/dashboard/alerts/page.tsx`**

| Task | Details |
|------|---------|
| Alert settings UI | Per-brand: threshold (points), frequency (immediate/daily digest) |
| Create `app/actions/alerts.ts` | Server actions: updateAlertConfig, markAlertRead |
| Alert list view | Show recent alerts with read/unread state |
| Email alert template | Use Resend for alert emails (reuse existing integration) |

**Alert types:**
- **Score drop:** "Your ARI score dropped 8 points (from 62 to 54)"
- **Threshold crossed:** "Your ARI score fell below your 50-point threshold"
- **Competitor change:** "CompetitorX passed you on Anthropic (their 71 vs your 65)"

**Week 2 exit criteria:** A paid user can add their brand + competitors, see a dashboard with score history chart, provider breakdown, and competitive comparison. Alert configuration is in place.

---

## Milestone 3: Elite Tier — Gumshoe + Companion + Fusion (Week 3, ~16h)

### 3.1 Gumshoe API Client (~4h)

**New files in `core/apps/ari/backend/`:**

| Task | Details |
|------|---------|
| Create `app/services/gumshoe_client.py` | API client: auth, create/list reports, poll for completion, fetch raw data |
| Create `app/models/gumshoe.py` | Pydantic models for Gumshoe API responses (report, run, visibility, raw data) |
| Add `GUMSHOE_API_KEY` to config | `gsorg_*` key in `.env` and `config.py` |
| Create `app/storage/supabase_elite.py` | Store Elite run results in `fancyrobot.elite_runs` |

**Gumshoe client flow:**
1. Check if a Gumshoe report already exists for the domain (via `GET /v1/reports`)
2. If not, trigger one (may require manual creation in Gumshoe dashboard initially — check if API supports report creation)
3. Poll `GET /v1/reports/{id}/runs/latest?status=complete`
4. Fetch visibility data + raw question/answer data
5. Parse into structured format for fusion

**Note:** The Gumshoe API is read-only (list reports, get runs, get raw data). Report creation may need to happen in the Gumshoe dashboard first. If so, the Elite flow would be: (a) check if report exists, (b) if not, create it in Gumshoe and wait, (c) once available, pull data. We should confirm whether there's a report creation endpoint not listed in the public docs.

### 3.2 ARI Companion Prompt Set (~4h)

**New files in `core/apps/ari/backend/`:**

| Task | Details |
|------|---------|
| Create `app/services/companion_prompt_generator.py` | Generate ~20 prompts covering Gumshoe gaps |
| Create `app/services/companion_runner.py` | Run companion prompts through all 5 providers |
| Create `app/models/companion.py` | CompanionResult model with per-dimension scores |

**Companion prompt dimensions (~20 prompts):**

| Dimension | # Prompts | Examples |
|---|---|---|
| Founder/Leadership | 4 | "Who founded {company}?", "Who is the CEO?", "{founder}'s background", "Leadership team at {company}" |
| Narrative Accuracy | 4 | "Describe {company}'s main product", "What differentiates {company}?", "What does {company} do?", "What is {company} known for?" |
| Head-to-Head | 4 | "{company} vs {competitor_1}", "{company} vs {competitor_2}", "Compare {company}, {comp_1}, {comp_2}" , "Which is better for {top_use_case}?" |
| Adjacent Categories | 4 | "Best {adjacent_cat_1} providers", "Top {adjacent_cat_2} companies", "Who should I use for {adjacent_use_case}?", "{adjacent_cat} recommendations" |
| Sentiment Probes | 4 | "What are the downsides of {company}?", "Criticisms of {company}", "Is {company} worth it?", "Problems with {company}" |

**Scoring:** Reuse existing ARI scoring infrastructure (position, recommendation type, sentiment, confidence). Add new `founder_retrieval_accuracy` and `narrative_accuracy` scores using LLM-as-judge pattern (compare response to known brand profile).

### 3.3 Elite Pipeline Orchestrator (~4h)

**New files:**

| Task | Details |
|------|---------|
| Create `app/routers/elite.py` | `POST /api/v1/elite/analyze` — SSE streaming endpoint |
| Create `app/services/elite_runner.py` | Orchestrates all components |
| Create `app/services/fusion_report_composer.py` | Merges all data into unified report narrative |

**Elite pipeline phases (SSE streaming):**
```
Phase 1: Discovery (reuse existing)
  → Brand profile for primary + 3 competitors

Phase 2: Gumshoe Data Pull
  → Fetch Gumshoe report for primary brand
  → Parse visibility, citations, raw mentions

Phase 3: ARI Full Audit — Primary Brand
  → 60 prompts × 5 providers, 4-factor scoring, anti-patterns

Phase 4: ARI Companion Scan — Primary Brand
  → 20 prompts × 5 providers, founder/narrative/H2H/adjacent/sentiment

Phase 5: ARI Full Audit — Competitor 1
Phase 6: ARI Full Audit — Competitor 2
Phase 7: ARI Full Audit — Competitor 3
  → 60 prompts × 5 providers each

Phase 8: Fusion
  → Merge all data streams
  → LLM synthesis → consultant narrative
  → Generate PDF

Phase 9: Complete
  → Return report URL
```

**Parallelism:** Phases 3-7 can run concurrently (primary audit + companion + 3 competitor audits). Total wall-clock time: ~3-5 minutes (audit time) + Gumshoe poll time.

**Estimated total LLM calls per Elite run:**
- Primary audit: ~300 calls (60 × 5)
- Companion scan: ~100 calls (20 × 5)
- Competitor audits: ~900 calls (60 × 5 × 3)
- Synthesis: ~3 calls
- **Total: ~1,300 LLM calls**

### 3.4 Elite Checkout + Delivery (~4h)

**New files in `core/apps/fancy-robot/`:**

| Task | Details |
|------|---------|
| Create `app/(dashboard)/dashboard/elite/page.tsx` | Elite order form: primary domain + 3 competitor domains |
| Create `app/(dashboard)/dashboard/elite/[runId]/page.tsx` | Elite report viewer + PDF download |
| Create `app/api/stripe/checkout-elite/route.ts` | One-time Stripe Checkout Session for $299 |
| Create `app/actions/elite.ts` | Server actions: createEliteRun, getEliteStatus |
| Update pricing component | Add Elite tier card with "One-Time Deep Dive" positioning |

**Elite purchase flow:**
1. User sees Elite on pricing page → "The Full Picture — $299"
2. Clicks "Get Your Elite Report" → enters primary domain + 3 competitors
3. Redirected to Stripe Checkout (one-time payment, `mode: 'payment'`, $299)
4. On webhook `checkout.session.completed` → create `fancyrobot.elite_runs` record
5. Trigger Elite pipeline on ARI backend
6. User sees progress page with SSE streaming phases
7. On completion → email with report link + PDF download
8. Report page is shareable (like snapshot share pages)

**Week 3 exit criteria:** A user can purchase an Elite report, the pipeline runs Gumshoe + ARI audit + companion scan + 3 competitor audits, and delivers a fused PDF report.

---

## Milestone 4: Historical Score Tracking + Automation (Week 3-4, ~12h)

### 4.1 Daily Scoring Cron (~4h)

| Task | Details |
|------|---------|
| Create scoring scheduler | ARI backend endpoint: `POST /api/v1/scores/schedule-daily` |
| Query active brands | Read `fancyrobot.monitored_brands` where user has active subscription |
| Run scores | Call existing `ScoringEngine` for each brand |
| Store results | Write to `fancyrobot.score_history` via Supabase |
| Fire alerts | Compare new score to previous, check thresholds |
| Cron trigger | `pg_cron` job or system cron hitting the endpoint daily at 6am UTC |

**Rate limiting:** With 5 providers and ~30 prompts, each brand takes ~15 seconds. Batch processing with concurrency limits prevents API rate limit issues. Process max 10 brands concurrently.

**Quarterly competitive insights (Pro tier):**
- Every 90 days, run full audits on the Pro user's 3 configured competitors
- Generate a competitive comparison report (competitor scores vs. user's brand)
- Email the report + surface it in dashboard
- Trigger: `pg_cron` quarterly job or date check in the daily scoring run

### 4.2 Trend Analysis (~4h)

| Task | Details |
|------|---------|
| Rolling averages | 7-day and 30-day rolling average calculations |
| Score delta tracking | Per-provider deltas (not just overall) |
| Trend direction | "Improving", "Stable", "Declining" badges on dashboard |
| Model-weighted scoring | Optional weighting by model market share |

**Implementation:** These are SQL queries / computed values on the score_history table. No new infrastructure needed — just dashboard components that query the right aggregations.

### 4.3 Backfill Existing Data (~4h)

| Task | Details |
|------|---------|
| Migrate SQLite runs | Script to copy existing `analysis_runs` → `fancyrobot.score_history` |
| Migrate snapshot data | Copy relevant `snapshot_runs` scores into history |
| Entity linking | Ensure all migrated data links to `human_os.entities` |
| Verify data integrity | Spot-check scores match between SQLite and Supabase |

**Milestone 4 exit criteria:** Scores update daily for all paid users. Trend lines show meaningful data. Alerts fire on score changes. Existing historical data is migrated.

---

## Milestone 5: Landing Page + LinkedIn Content (Week 4, ~12h)

### 5.1 Landing Page Optimization (~4h)

| Task | Details |
|------|---------|
| Update hero copy | Lead with the free score check, not the platform pitch |
| Conversion-focused CTA | "Check Your AI Visibility Score — Free" above the fold |
| Social proof section | Add any early user testimonials / case studies |
| Email capture on snapshot results | More prominent "Get monitoring" upsell after free snapshot |
| SEO metadata | Title, description, OG tags optimized for "AI visibility score" |
| Update pricing component | Wire to actual Stripe checkout (from Milestone 1) |

**Landing page flow:**
```
Hero: "Does AI recommend your brand?"
  ↓ [Check Your Score Free]
Snapshot result (gated)
  ↓ "Your score is 47/100. Your competitors average 62."
  ↓ [Go Pro — $99/mo]  or  [Get the Full Picture — $299]
Stripe Checkout
  ↓
Dashboard (Pro) or Elite report (Elite)
```

### 5.2 Snapshot → Upgrade Funnel (~4h)

| Task | Details |
|------|---------|
| Post-snapshot upgrade CTA | After results: "Track how this changes over time" |
| Competitor tease | Show competitor scores in snapshot, "Monitor all of them for $99/mo" |
| Email drip setup | After email capture: 3-email sequence pushing to paid |
| Login-to-save prompt | After results: "Login to save your results and track over time" |

### 5.3 LinkedIn Content (Non-Engineering, ~4h)

| Task | Details |
|------|---------|
| Content calendar | 30-day plan: "Does AI recommend your brand?" angle |
| First 10 posts drafted | Use VoiceOS for Justin's voice |
| Posting cadence | 3x/week minimum |
| Track engagement | Note which angles drive traffic to the snapshot tool |

**Content angles:**
- "I checked whether ChatGPT recommends [well-known brand]. The answer surprised me."
- "Your SEO is great. But does AI recommend you? That's a different question."
- "We scored 50 companies in [industry]. Here's what the data shows."
- "AI visibility is the new SEO. Here's how to measure yours."

---

## Sprint Exit Criteria

A stranger can:
1. Land on fancyrobot.com → see "Check your AI visibility score"
2. Enter their domain → get a free snapshot with their ARI score (1 model, 20 prompts)
3. Optionally login to save their results and view past snapshots
4. See their score vs. competitors → feel the pain of low visibility
5. **Path A — Pro:** Click "Go Pro" → sign up → pay $99/mo via Stripe → full deep audit + dashboard with daily tracking + quarterly competitive insights + alerts
6. **Path B — Elite:** Click "Get the Full Picture" → pay $299 one-time → receive a fusion report combining Gumshoe citation data + ARI 4-factor scoring + companion gap analysis + 3 competitor deep audits
7. Come back the next day (Pro) → see new data points on trend charts
8. Get email alerts when scores change significantly (Pro)

LinkedIn content is posting 3x/week driving traffic to the free snapshot.

### Two Revenue Paths from One Free Snapshot

```
Free Snapshot (1 model, 20 prompts, 30 seconds)
  │  ↳ login to save results
  │
  ├─→ "Go Pro"              → $99/mo or $69/mo annual
  │     (full audit, daily monitoring, quarterly competitor insights)
  │
  └─→ "Get the Full Picture" → $299 or $199/yr annual
        (Gumshoe + ARI fusion + 3 competitor deep audits)
```

---

## File Structure (New/Modified)

```
core/apps/fancy-robot/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          NEW
│   │   ├── signup/page.tsx         NEW
│   │   └── callback/route.ts      NEW
│   ├── (dashboard)/
│   │   ├── layout.tsx              NEW — dashboard shell (sidebar, nav)
│   │   └── dashboard/
│   │       ├── page.tsx            NEW — brand list / onboarding
│   │       ├── [brandId]/
│   │       │   └── page.tsx        NEW — score history, trends, competitors
│   │       ├── elite/
│   │       │   ├── page.tsx        NEW — Elite order form (domain + 3 competitors)
│   │       │   └── [runId]/
│   │       │       └── page.tsx    NEW — Elite report viewer + progress + PDF
│   │       ├── alerts/
│   │       │   └── page.tsx        NEW — alert config + history
│   │       └── settings/
│   │           └── page.tsx        NEW — account, billing (Stripe portal link)
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts   NEW — Pro subscription ($99/mo)
│   │   │   ├── checkout-elite/route.ts NEW — Elite one-time payment ($299)
│   │   │   ├── portal/route.ts     NEW
│   │   │   └── webhook/route.ts    NEW — handles both subscription + one-time events
│   │   └── health/route.ts         EXISTS
│   ├── actions/
│   │   ├── contact.ts              EXISTS
│   │   ├── auth.ts                 NEW
│   │   ├── brands.ts               NEW
│   │   ├── alerts.ts               NEW
│   │   └── elite.ts                NEW — createEliteRun, getEliteStatus
│   ├── snapshot/                    EXISTS (modify for gating + upgrade CTA)
│   └── page.tsx                     EXISTS (update hero + pricing wiring)
├── components/
│   ├── dashboard/
│   │   ├── ScoreOverview.tsx        NEW
│   │   ├── ScoreTrendChart.tsx      NEW
│   │   ├── ProviderBreakdown.tsx    NEW
│   │   ├── CompetitorTable.tsx      NEW
│   │   ├── CompetitorTrendChart.tsx NEW
│   │   ├── AlertList.tsx            NEW
│   │   ├── BrandCard.tsx            NEW
│   │   ├── UpgradePrompt.tsx        NEW
│   │   └── EliteProgress.tsx        NEW — SSE progress viewer for Elite pipeline
│   └── v2/
│       └── pricing.tsx              MODIFY — wire to Stripe checkout, add Elite card
├── lib/
│   ├── supabase-browser.ts         NEW
│   ├── supabase-middleware.ts      NEW
│   ├── stripe.ts                   NEW
│   ├── subscription.ts            NEW
│   └── elite-client.ts            NEW — SSE client for Elite pipeline
├── middleware.ts                    NEW
└── .env.local                      MODIFY — add Stripe keys

core/apps/ari/backend/
├── app/
│   ├── routers/
│   │   ├── scores.py               MODIFY — add /schedule-daily endpoint
│   │   └── elite.py                NEW — POST /api/v1/elite/analyze (SSE)
│   ├── services/
│   │   ├── gumshoe_client.py       NEW — Gumshoe API client
│   │   ├── companion_prompt_generator.py NEW — 20 gap-filling prompts
│   │   ├── companion_runner.py     NEW — run companion through 5 providers
│   │   ├── elite_runner.py         NEW — orchestrate full Elite pipeline
│   │   └── fusion_report_composer.py NEW — merge all data → narrative
│   ├── models/
│   │   ├── gumshoe.py              NEW — Gumshoe API response models
│   │   ├── companion.py            NEW — CompanionResult model
│   │   └── elite_report.py          NEW — EliteRun, FusionReport models
│   └── storage/
│       ├── supabase_score_history.py NEW — write to fancyrobot.score_history
│       └── supabase_elite.py       NEW — write to fancyrobot.elite_runs
└── .env                             MODIFY — add GUMSHOE_API_KEY, ensure SUPABASE_KEY

core/supabase/migrations/
└── YYYYMMDD_ari_paid_tier.sql       NEW — all new tables + RLS (incl. elite_runs)
```

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scoring 5 providers daily per brand could hit API rate limits | Scores fail or get throttled | Stagger runs, add retry logic, track costs |
| Low initial data (1-2 days of history) looks empty | Dashboard feels underwhelming | Show "data collecting" state, backfill any existing snapshots |
| Stripe webhook reliability | Subscription state drift | Idempotent handlers, daily sync job as backup |
| Free snapshot abuse | Cost of running 1 provider per free scan adds up | Rate limit by IP (e.g. 10/day), consider requiring email before first snapshot |
| Auth adds friction to the free snapshot | Conversion drops | Keep snapshot anonymous — auth only required for dashboard |
| Scope creep into exploration features | Sprint deadline missed | Stick to the guard rail: publication scoring, article pipeline, promo codes are exploration budget |
| Gumshoe API doesn't support report creation | Can't fully automate Elite | Pre-create reports in Gumshoe dashboard, or contact Gumshoe about creation endpoint |
| Gumshoe report not available for a domain | Elite fails for that customer | Graceful fallback: run Elite without Gumshoe data, discount to $149, or refund Gumshoe portion |
| ~1,300 LLM calls per Elite run takes too long | Bad UX waiting 10+ minutes | Run phases in parallel, show granular progress via SSE, send email when complete |
| Elite hard cost ($83-93) leaves thin margin if API prices rise | Margin squeeze | Track costs per run, alert if cost exceeds $100, adjust pricing if needed |

---

## What's Explicitly OUT of Sprint 1

Per the roadmap guard rail, these are exploration budget — valuable but don't generate revenue:

- Publication scoring and distribution network features
- Article writing pipeline improvements
- New prompt categories beyond content syndication
- White-label / custom branding for agencies
- API key self-service (future Agency/Enterprise tier)
- Promo code management dashboard
- Mobile-responsive dashboard (do it, but don't gold-plate it)
- Multi-user teams / org management

---

## Daily Practice (from Energy Framework)

- First 2-3 hour block each day: Sprint 1 work only
- After hitting the day's sprint target: explore whatever's exciting
- Monday check-in: "What did I ship toward Sprint 1? Am I on track?"

| Week | Target | "On Track" Test |
|------|--------|-----------------|
| 1 | Auth + Stripe working (both tiers, both intervals) | Can a user sign up and pay for Pro or Elite (ad-hoc or annual)? |
| 2 | Dashboard shows score data | Can a user see their brand's score history + competitors? |
| 3 | Elite pipeline + daily scoring | Can an Elite report run end-to-end? Do daily scores update? |
| 4 | Landing page live, first paid user | Has someone given you money? |
