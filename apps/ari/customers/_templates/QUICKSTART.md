# AI Visibility Deliverables - Quick Start Guide

## 5-Minute Setup for New Customer

### 1. Create Customer Folder
```
customers/
  {customer-slug}/
    mentions-{id}.csv      <- from Gumshoe
    sources-{id}.csv       <- from Gumshoe
    questions_export.csv   <- from Gumshoe
```

### 2. Complete Intake Form
Copy `_templates/CUSTOMER_INTAKE.md` to customer folder and fill in:
- Company name, URL, industry
- 3-5 competitors
- 3-5 key differentiators
- Target personas

### 3. Run Claude Prompt
Use the prompt from `_templates/CLAUDE_PROMPT.md`:

```
I need to create AI visibility deliverables for [CUSTOMER].

## Customer Context
[Paste completed intake]

## Data Files
customers/{slug}/mentions-{id}.csv
customers/{slug}/sources-{id}.csv
customers/{slug}/questions_export.csv

## Instructions
Follow customers/_templates/METHODOLOGY.md to create all deliverables.
```

### 4. Review & Refine
- Check metrics match source data
- Verify article drafts are complete (not outlines)
- Confirm publication mapping uses real outlets

---

## File Reference

| File | Purpose |
|------|---------|
| `METHODOLOGY.md` | Complete process documentation |
| `CUSTOMER_INTAKE.md` | Information gathering template |
| `CLAUDE_PROMPT.md` | Prompt to generate deliverables |
| `01-TEMPLATE-*.md` | Document structure templates |

---

## Deliverables Checklist

- [ ] `01-client-proposal.md` - Executive summary (~800 words)
- [ ] `02-full-analysis.md` - Full data analysis (~2,000 words)
- [ ] `03-article-drafts.md` - Complete articles (~7,000 words)
- [ ] `04-publication-mapping.md` - Outlet targeting (~1,500 words)
- [ ] `README.md` - Deliverables index

---

## Key Metrics to Extract

From **mentions CSV**:
- Total mentions / total slots = visibility %
- Mentions by model
- Mentions by persona
- Mentions by topic
- Average rank when mentioned

From **sources CSV**:
- Total citations
- Top domains cited
- Source type distribution
- Model-specific source preferences

---

## Article Formula

Each article needs:
1. **Headline** - SEO-optimized, matches AI queries
2. **Target persona** - From Gumshoe analysis
3. **Target topic** - From Gumshoe analysis
4. **Differentiator angle** - What competitors can't claim
5. **Publication targets** - Matched to audience
6. **Full draft** - 1,000-1,800 words with CTA
