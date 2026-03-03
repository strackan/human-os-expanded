# HumanOS — Vision

## One-Liner

A contextual intelligence platform that makes AI useful by giving it your real professional context — then deploying that context across every workflow that matters.

## The Problem

Professionals generate a wake of context scattered across tools. Your CRM knows who you emailed. Your calendar knows when you met. Your notes know what you discussed. Your LinkedIn knows who you know. None of these systems talk to each other, and none of them were designed for AI to operate on.

Current enterprise tools — HubSpot, Salesforce, Notion — were built for humans clicking buttons. They store data in proprietary silos optimized for dashboards, not for language models calling APIs. When you ask Claude to "draft a renewal strategy for Acme Corp," it has no idea who your champion is, what their last NPS score was, or that their contract is up in 90 days. You end up copy-pasting context into every conversation. That's the tax.

HumanOS eliminates the tax.

## Three Pillars

### Know — Intelligence Layer

**Fancy Robot + ARI** answer "Does AI recommend your brand?" ARI queries multiple AI models, scores recommendations on a 0-100 index, and tracks visibility over time. Think Rotten Tomatoes for AI discoverability.

**GoodHang** answers "Who should you hire?" A 14-dimension assessment engine scores candidates across IQ, EQ, empathy, leadership, resilience, and more. The same scoring architecture that powers Renubu's health scores.

Together: understand how the world sees you and how to evaluate the people in it.

### Connect — Network Layer

**GFT (GuyForThat)** is a desktop-native contact intelligence system. LinkedIn extension captures profiles, enrichment workers fill in the gaps, and a local-first CRM keeps everything accessible without cloud latency. Your network, your machine, your data.

**PowerPak** turns expert knowledge into AI-native tools. SKILL.md files define what an expert knows, what they charge, and how to engage them. Claude can query an expert's profile, recommend who to hire, and book a meeting — all through MCP protocol.

Together: know who to talk to and what they know before you reach out.

### Act — Execution Layer

**Renubu** is the workflow engine. Customer health scoring, renewal tracking, AI-powered contract analysis, and modular slide generation. Multi-tenant SaaS with RLS. This is where context becomes action — when a renewal is at risk, Renubu knows the full story and can generate the strategy.

**FounderOS** is the personal operating system. 28+ tool modules accessible via natural language: task management, queue prioritization, journaling with emotion tracking, OKR management, and transcript analysis. Say "add refactor auth to my queue" and it happens. No clicking through menus.

**Creativity Journal** is the reflection layer — rich-text journaling with Plutchik emotion wheel integration, designed for daily creative practice.

Together: act on signals with full context, track everything, reflect on outcomes.

## The Flywheel

```
    KNOW                    CONNECT
    ┌────────────┐          ┌────────────┐
    │ Understand │          │ Identify   │
    │ your score,│──────────│ the right  │
    │ assess     │          │ people and │
    │ talent     │          │ experts    │
    └─────┬──────┘          └──────┬─────┘
          │                        │
          │    ┌──────────┐        │
          └────│  CONTEXT │────────┘
               │  SPINE   │
          ┌────│ (HumanOS │────────┐
          │    │   Core)  │        │
          │    └──────────┘        │
          │                        │
    ┌─────┴──────┐          ┌──────┴─────┐
    │ Reflect on │          │ Execute    │
    │ outcomes,  │──────────│ workflows  │
    │ capture    │          │ with full  │
    │ learnings  │          │ context    │
    └────────────┘          └────────────┘
    LEARN                   ACT
```

Every cycle enriches the context spine. ARI scores become entity metadata. GoodHang assessments inform hiring decisions in GFT. Renubu renewal outcomes feed back into health models. The more you use it, the smarter it gets — not through opaque ML, but through accumulating real context that AI can reason about.

## What Makes This Different

**AI-native from day one.** HumanOS wasn't migrated from a CRUD app. The knowledge graph, privacy model, and service layer were designed for language models to operate on. MCP protocol means Claude can call your entire business graph as tools — `recall_person("Sarah Chen")` returns everything you know about her across every product.

**Single implementation, triple delivery.** Every capability is defined once and exposed as an MCP tool, a REST endpoint, and a natural language alias. No translation layer, no sync problems, no "API doesn't support that yet."

**Privacy by architecture, not policy.** Access control is the first parameter to every operation. The `PrivacyModel` resolves data visibility before queries run. RLS enforces at the database level. A Renubu tenant can never see FounderOS data, even if they share the same Supabase instance.

**Entity-first, not product-first.** Products don't own data — the context spine does. A `person` entity created by GFT's LinkedIn extension is the same `person` Renubu tracks for renewals and GoodHang scores for talent fit. No deduplication battles between product teams, because there's one graph.

## Market Context

**Clay** does enrichment + workflow automation. Good at: waterfall enrichment, data orchestration. We diverge: Clay is a data plumbing tool. HumanOS is a context layer that makes enrichment one small piece of a larger intelligence system. Clay doesn't know what you discussed in your last call with a contact.

**HubSpot** is the canonical hub-and-spokes CRM. Good at: broad feature coverage, market penetration. We diverge: HubSpot was built for humans clicking buttons in 2006. Its "AI features" are bolt-on summaries of data that was never structured for AI. We start with the assumption that Claude is the primary user.

**Palantir** builds ontologies for enterprises. Good at: complex data modeling, government contracts. We diverge: Palantir requires a team of forward-deployed engineers. HumanOS is designed for a founder to run solo. Same idea (unified data model), different scale and audience.

**Perplexity** does AI-powered discovery. Good at: real-time search, citation quality. We diverge: Perplexity is a search engine. ARI is a recommendation index — not "what does AI find?" but "what does AI recommend and why?" Different question, different product.

Where we fit: the intersection of Clay's enrichment, HubSpot's workflow engine, and Palantir's ontology — but designed for AI-first teams of 1-50, not enterprises of 5,000.

## Go-to-Market

```
Free Fancy Robot Snapshot
  "Does AI recommend your brand?"
  → Generates curiosity, captures email
         │
         ▼
Renubu Workflows
  "Here's what to do about it"
  → Paid SaaS, multi-tenant
         │
         ▼
GFT Network Intelligence
  "Here's who can help"
  → Expand into contact intelligence
         │
         ▼
Platform
  "Build on the context spine"
  → API access, MCP marketplace
```

The free snapshot is the wedge. It answers a question every marketer is starting to ask ("Am I visible to AI?") and creates a natural upsell: "Now that you know your score, here's a system that helps you act on it." Renubu handles the action. GFT handles the network. PowerPak handles the expertise. Each product reinforces the others.

## The Word

**Context.**

Every product in the portfolio is a different lens on the same idea: making context portable, composable, and actionable through AI. Renubu gives context to customer success. ARI gives context to brand visibility. GFT gives context to your network. GoodHang gives context to hiring. FounderOS gives context to your day.

The platform bet is that whoever owns the context layer wins. Not the data warehouse — those exist. Not the CRM — those exist too. The context layer: the thing that sits between raw data and AI reasoning, that knows what matters, who said it, when it was relevant, and who's allowed to see it.

That's what we're building.
