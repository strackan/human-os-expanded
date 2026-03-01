# Claude Prompt for Generating AI Visibility Deliverables

Use this prompt when you have a completed customer intake and data files ready.

---

## The Prompt

```
I need to create an AI visibility analysis and content strategy deliverables package for a new customer.

## Customer Context
{{PASTE COMPLETED CUSTOMER_INTAKE.md HERE}}

## Data Files Location
- Mentions data: customers/{{CUSTOMER_SLUG}}/mentions-{{ID}}.csv
- Sources data: customers/{{CUSTOMER_SLUG}}/sources-{{ID}}.csv
- Questions/prompts: customers/{{CUSTOMER_SLUG}}/questions_export.csv
- Publication network: customers/{{CUSTOMER_SLUG}}/NewsUSA_AI_Influence_Analysis.csv
  (or use the shared file at customers/_templates/ if using standard network)

## Instructions

Follow the methodology in customers/_templates/METHODOLOGY.md to create these deliverables:

1. **Analyze the Gumshoe data** - Read the mentions and sources CSV files to extract:
   - Overall visibility percentage
   - Model-by-model breakdown
   - Persona performance table
   - Topic performance table
   - Source citation analysis
   - What AI says when they DO mention the customer

2. **Identify strategic opportunities** based on:
   - Which personas have existing traction (build on these)
   - Which personas are blind spots (0% visibility)
   - Which topics align with customer differentiators
   - Which models already mention customer (prioritize web-searching models)

3. **Design 3-5 articles** targeting the best opportunities:
   - Use the article type templates (Expert Guide, Consumer Guide, How-To, Feature, Trend)
   - Each article needs: headline, target persona, target topic, key angle, publication targets
   - Write FULL DRAFTS of 1,000-1,800 words each, not just outlines
   - Include SEO keywords, CTAs, and all standard elements

4. **Map publications** from the network CSV to each article:
   - Segment by AI Impact Tier (prioritize Tier 1)
   - Match topical relevance
   - Consider geographic/demographic alignment
   - Calculate cost efficiency where relevant

5. **Generate all deliverables** in customers/{{CUSTOMER_SLUG}}/deliverables/:
   - 01-client-proposal.md
   - 02-full-analysis.md
   - 03-article-drafts.md (with FULL article text, not placeholders)
   - 04-publication-mapping.md
   - README.md

Use the templates in customers/_templates/ as structural guides, but fill in all content completely based on the actual data.

IMPORTANT:
- Read the actual CSV data files, don't make up numbers
- Write complete article drafts, not outlines or placeholders
- Use the customer's actual name and differentiators throughout
- Map real publications from the network file to each article
```

---

## Pre-Prompt Checklist

Before running the prompt, ensure:

- [ ] Customer intake form is completed
- [ ] All Gumshoe data files are in the customer folder
- [ ] Publication network CSV is available
- [ ] Customer folder exists: `customers/{{customer_slug}}/`

---

## Expected Output

Claude should produce 5 files in `customers/{{customer_slug}}/deliverables/`:

1. **01-client-proposal.md** (~800 words)
   - Executive summary for client presentation
   - Key metrics and competitor comparison
   - Article recommendations table
   - Expected outcomes

2. **02-full-analysis.md** (~2,000 words)
   - Complete data tables
   - Model-by-model breakdown
   - Persona and topic matrices
   - Source analysis
   - Measurement plan

3. **03-article-drafts.md** (~7,000-9,000 words)
   - 3-5 complete article drafts
   - Each article 1,000-1,800 words
   - Full text, not outlines
   - SEO keywords and CTAs included

4. **04-publication-mapping.md** (~1,500 words)
   - Article-by-article outlet tables
   - Priority matrix
   - Regional breakdowns
   - Cost optimization notes

5. **README.md** (~400 words)
   - Index of deliverables
   - Key metrics summary
   - Execution sequence

---

## Troubleshooting

**If Claude doesn't read the CSV files:**
- Explicitly say "Read the file at [path]"
- Break into steps: "First, read mentions-X.csv and tell me the visibility metrics"

**If articles are too short or outline-only:**
- Emphasize "Write FULL DRAFTS of 1,000-1,800 words each"
- "Do not use placeholders or outlines - write the complete article text"

**If publication mapping is generic:**
- Ask Claude to read the specific publication CSV first
- "List the top 20 Tier 1 publications from the CSV by AI score"

**If competitor data is wrong:**
- Verify competitor names match exactly what's in the Gumshoe data
- Provide competitor list explicitly in intake

---

## Iteration

After initial generation, you may need to:

1. **Refine articles** - "Expand Article 3 to include more detail on [topic]"
2. **Adjust targeting** - "Add more Florida publications for Article 3 given retiree focus"
3. **Update metrics** - "I re-ran the analysis, update the visibility numbers to X%"
4. **Add articles** - "Add a 6th article targeting [persona] on [topic]"

---

## Example Run

```
User: I need to create AI visibility deliverables for Acme Gold Dealers.

[Pastes completed intake form]

Data files are in customers/acme-gold/

Claude: I'll analyze the data and create the deliverables. Let me start by reading the mentions data...

[Claude reads files, analyzes, generates all 5 deliverables]

User: The articles look good but Article 2 needs more emphasis on their mobile app. Can you revise?

Claude: [Revises Article 2 with mobile app focus]
```
