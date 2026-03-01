# AI Visibility Analysis & Content Strategy
## Reusable Methodology

This document outlines the standardized process for creating AI visibility analysis and content strategy deliverables for any customer.

---

## Overview

**Goal:** Analyze a customer's visibility in AI-generated responses and create a targeted content strategy to improve their AI recommendation rate.

**Deliverables:**
1. Client-facing proposal document
2. Full analysis document
3. Article drafts (3-5 articles)
4. Publication mapping

**Timeline:** 2-4 hours with data in hand

---

## Required Inputs

### 1. Gumshoe Analysis Data
Export from Gumshoe platform:
- `mentions-{id}.csv` - Raw AI response mentions data
- `sources-{id}.csv` - Source citations from AI responses
- `questions_export.csv` - Prompts used in analysis

### 2. Publication Network
- `NewsUSA_AI_Influence_Analysis.csv` - Publication list with AI scores

### 3. Customer Context (gather via intake)
- Company name and URL
- Industry/category
- Primary competitors (3-5)
- Key differentiators (what makes them unique)
- Target customer personas
- Existing marketing messaging/positioning
- Any specific goals or concerns

---

## Process Steps

### Step 1: Analyze Gumshoe Data

**Extract key metrics from mentions data:**
```
- Total prompts tested
- Total AI models tested
- Total answer slots (prompts × models)
- Customer mention count and percentage
- Competitor mention counts and percentages
- Model-by-model breakdown
- Persona performance breakdown
- Topic performance breakdown
```

**Extract from sources data:**
```
- Total source citations
- Top cited domains
- Source type distribution
- Model-specific source preferences
```

**Key calculations:**
```python
# Overall visibility
visibility_pct = (customer_mentions / total_slots) * 100

# Per-model visibility
model_visibility = customer_mentions_for_model / prompts_for_model

# Competitor gap
gap = competitor_visibility - customer_visibility
```

### Step 2: Identify Strategic Opportunities

**Find leverage points:**
1. Which personas show any customer visibility? (build on existing presence)
2. Which personas show 0% visibility? (blind spots to address)
3. Which topics align with customer differentiators?
4. Which AI models already mention customer? (prioritize web-searching models)
5. What do AI models say when they DO mention customer? (message to amplify)

**Prioritize by:**
- Existing traction (easier to improve from 5% to 15% than 0% to 10%)
- Competitive weakness (topics where competitors are also weak)
- Customer differentiation (unique angles competitors can't claim)
- Commercial value (which personas have highest customer lifetime value)

### Step 3: Design Article Strategy

**For each recommended article, define:**
1. Headline (SEO-optimized, query-matching)
2. Target persona (from Gumshoe analysis)
3. Target topic (from Gumshoe analysis)
4. Target AI models (web-searching models prioritized)
5. Key content angle (tied to customer differentiator)
6. Publication targets (matched to audience)
7. SEO keywords to include

**Article types that work:**
- Expert guides (leverage customer expertise)
- Consumer protection/education (trust-building)
- How-to guides (practical, evergreen)
- Trend pieces (newsworthy, shareable)
- Comparison guides (positions customer among known entities)

### Step 4: Map Publications

**Segment publication network by:**
1. AI Impact Tier (prioritize Tier 1)
2. Topical relevance (finance, lifestyle, tech, etc.)
3. Geographic relevance (regional demographics)
4. Audience alignment (persona match)
5. Cost efficiency (AI Score per dollar)

**For each article, identify:**
- Primary distribution (50-100 Tier 1 outlets)
- Secondary distribution (100-200 Tier 2 outlets)
- Specialist outlets (niche but high-value)

### Step 5: Generate Deliverables

Use templates to create:
1. `01-client-proposal.md` - Executive summary for client
2. `02-full-analysis.md` - Complete data and rationale
3. `03-article-drafts.md` - Full article content
4. `04-publication-mapping.md` - Outlet targeting
5. `README.md` - Index of deliverables

---

## Quality Checklist

### Analysis Quality
- [ ] All Gumshoe data correctly interpreted
- [ ] Competitor comparisons are accurate
- [ ] Persona/topic breakdowns match source data
- [ ] Source citation analysis included
- [ ] Model-by-model breakdown present

### Strategy Quality
- [ ] Articles target customer's real differentiators
- [ ] Personas prioritized by opportunity size
- [ ] Web-searching AI models (Perplexity, Google AI Overview) prioritized
- [ ] Publication targeting matches article audiences
- [ ] SEO keywords reflect actual AI query patterns

### Deliverable Quality
- [ ] Client proposal is executive-friendly (no jargon)
- [ ] Full analysis has all supporting data
- [ ] Article drafts are publication-ready (1,000-1,800 words each)
- [ ] Publication mapping has specific outlet recommendations
- [ ] All documents use customer's actual name/brand consistently

### Content Guidelines (for AI pickup)
- [ ] Use exact query language in articles
- [ ] Name customer explicitly (full name + URL)
- [ ] Include all key differentiators
- [ ] Position customer alongside known competitors
- [ ] Use structured format (bullets, numbered lists, headers)
- [ ] Cite authoritative sources (BBB, certifications, etc.)
- [ ] Keep content evergreen (avoid date-specific references)

---

## File Naming Convention

```
customers/
  {customer_slug}/
    # Source data
    mentions-{id}.csv
    sources-{id}.csv
    questions_export.csv
    NewsUSA_AI_Influence_Analysis.csv  (or link to shared)

    # Deliverables
    deliverables/
      README.md
      01-client-proposal.md
      02-full-analysis.md
      03-article-drafts.md
      04-publication-mapping.md
```

---

## Template Files

See companion template files:
- `CUSTOMER_INTAKE.md` - Questions to gather customer context
- `01-TEMPLATE-client-proposal.md` - Client proposal template
- `02-TEMPLATE-full-analysis.md` - Analysis document template
- `03-TEMPLATE-article-drafts.md` - Article structure template
- `04-TEMPLATE-publication-mapping.md` - Publication mapping template

---

## Prompt for Claude

When you have the data ready, use this prompt:

```
I need to create an AI visibility analysis and content strategy for [CUSTOMER].

## Customer Context
- Company: [name]
- Industry: [category]
- Competitors: [list]
- Key differentiators: [list]
- Target personas: [list]

## Data Files
- Mentions data: [path]
- Sources data: [path]
- Questions/prompts: [path]
- Publication network: [path]

## Instructions
1. Analyze the Gumshoe data to extract visibility metrics
2. Identify strategic opportunities based on persona/topic performance
3. Design 3-5 articles targeting the best opportunities
4. Map publications from the network to each article
5. Generate all four deliverable documents using the templates

Follow the methodology in customers/_templates/METHODOLOGY.md
```
