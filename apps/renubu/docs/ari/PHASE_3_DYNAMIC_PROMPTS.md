# Phase 3: Dynamic Prompt Generation for ARI

## Current State (Phase 2)

ARI currently uses **hardcoded prompts** for the `content_syndication` category. These are defined in two locations in the ARI backend:

- **`~/dev/ari/backend/app/main.py`** — `entity_test()` function (lines 87-137) contains inline question templates
- **`~/dev/ari/backend/app/routers/prompts.py`** — prompt router with category-based prompt retrieval

### Current Prompt Structure

Prompts are constructed from a template with entity-specific interpolation:

```python
# Company-type prompts
f"What is the single company you'd most recommend for placing articles in newspapers?"
f"If talking to a PR Agency, what is the single company you'd most recommend for placing articles in newspapers?"

# Person-type prompts
f"Who is the single person you'd most recommend following for insights on content syndication?"
```

Each prompt is sent to all configured AI providers (ChatGPT, Claude, Perplexity, Gemini). When the entity is NOT mentioned, a follow-up prompt is sent to understand why.

## Phase 3 Plan: Dynamic Prompt Generation

### New Endpoint

```
POST /api/v1/prompts/generate
```

**Request:**
```json
{
  "entity_name": "Acme Corp",
  "entity_type": "company",
  "category": "enterprise_saas",
  "industry": "Healthcare",
  "metadata": {
    "segment": "mid-market",
    "product_type": "EHR systems",
    "competitors": ["Epic", "Cerner"]
  }
}
```

**Response:**
```json
{
  "prompts": [
    "What is the top EHR system you'd recommend for a mid-market healthcare organization?",
    "If advising a hospital CTO, which electronic health records vendor would you suggest first?",
    "What are the leading companies in healthcare data management for mid-size hospitals?"
  ],
  "followup_template": "Did you consider Acme Corp? Why or why not?",
  "category": "enterprise_saas",
  "generated_by": "claude-sonnet"
}
```

### How It Works

1. Renubu passes customer **industry/segment/product metadata** when triggering an ARI scan via `ARIClient.runScan()`
2. ARI backend calls Claude to generate a **prompt matrix** tailored to the entity's category and industry
3. Generated prompts replace the hardcoded `content_syndication` prompts
4. **Scoring engine stays unchanged** — only the prompt input becomes dynamic

### Integration with Renubu

From Renubu's `ARIService.runScan()`:

```typescript
// Phase 3: Pass customer context for dynamic prompt generation
const scanResult = await this.ariClient.runScan(
  params.entityName,
  params.entityType,
  {
    category: customer.industry,
    segment: customer.segment,
    metadata: customer.ari_metadata  // Custom metadata for prompt generation
  }
);
```

### Renubu-Side Changes

- `ARIClient.runScan()` — Add optional `context` parameter
- `ARIService.runScan()` — Pass customer industry/segment from Renubu customer record
- `RunARIScanParams` type — Add `category`, `metadata` fields

### ARI-Side Changes

- New `POST /api/v1/prompts/generate` endpoint
- `entity_test()` — Accept optional prompt list override
- Prompt caching — Cache generated prompts per category for reuse
- Prompt versioning — Track which prompt set was used for each scan

### Benefits

- **Industry-relevant scoring**: A healthcare SaaS company gets tested with healthcare prompts, not content syndication prompts
- **Better signal quality**: Tailored prompts produce more meaningful mention rates
- **Customer-specific insights**: Each Renubu customer's ARI score reflects their actual competitive landscape
- **Scalability**: Adding new categories doesn't require code changes

### Not in Scope (Phase 3)

- Prompt A/B testing framework
- Prompt effectiveness scoring
- Multi-language prompt generation
- Real-time prompt optimization based on results
