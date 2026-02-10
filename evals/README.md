# Human OS Eval Infrastructure

Promptfoo-based evaluation suite for all LLM prompts in the Human OS platform. **37 tests** across 6 suites, with adversarial/defensive coverage.

## Running Evals

```bash
# Run all suites (~$7, ~5 min)
pnpm eval

# Run individual suite
pnpm eval:sculptor
pnpm eval:voice
pnpm eval:tutorial
pnpm eval:production
pnpm eval:assessment
pnpm eval:renubu

# Open results UI
pnpm eval:view

# CI mode (no cache, JSON output)
pnpm eval:ci
```

**Environment setup**: Copy `evals/.env.example` to `evals/.env` and set `ANTHROPIC_API_KEY`.

## Directory Structure

```
evals/
├── .env                          # API key (gitignored)
├── promptfooconfig.yaml          # Root config (shared defaults)
├── shared/
│   ├── providers.yaml            # Shared provider configs
│   └── fixtures/                 # Maya Chen test persona
│       ├── sample-corpus.md
│       ├── sample-executive-report.json
│       ├── sample-fos-interview.json
│       ├── sample-persona-fingerprint.json
│       ├── sample-sculptor-transcript.md
│       ├── sample-voice-feedback.json
│       └── sample-voice-pack/    # 11 voice component files
├── sculptor/                     # Corpus summary + persona scoring
├── voice/                        # Finalize, generate, refine
├── tutorial/                     # Welcome, work questions, report regen
├── production/                   # Chat modes (journal, crisis, brainstorm, post)
├── assessment/                   # Synthesis + FOS extraction
└── renubu/                       # CSM, email, greeting, health, pricing
```

**Test persona**: All fixtures use "Maya Chen" — an anonymized composite founder profile with FlowState AI, Google/Stripe background, and distinct voice patterns (parenthetical humor, double hyphens, curated vulnerability).

**Providers**: Sonnet 4 for generation, Haiku 4.5 for `llm-rubric` grading (cost-saving).

## Promptfoo Gotchas

These are hard-won lessons. Read before writing new evals.

### 1. Multi-line JS assertions need `return`

```yaml
# WRONG — multi-line block, no return
- type: javascript
  value: |
    const words = output.split(/\s+/).length;
    words <= 100

# CORRECT — multi-line block, explicit return
- type: javascript
  value: |
    const words = output.split(/\s+/).length;
    return words <= 100
```

Single-line JS must **NOT** use `return`:

```yaml
# CORRECT — single-line, no return
- type: javascript
  value: "output.length >= 500 && output.length <= 10000"
```

### 2. `&&` chains returning objects need `!!()`

```yaml
# WRONG — returns the object (truthy but not boolean)
- type: javascript
  value: |
    const d = JSON.parse(output);
    return d.executive_report && d.character_profile && d.attributes

# CORRECT — coerce to boolean
- type: javascript
  value: |
    const d = JSON.parse(output);
    return !!(d.executive_report && d.character_profile && d.attributes)
```

### 3. `contains-any` is case-sensitive

```yaml
# WRONG — misses "NOT IN CORPUS" or "Not In Corpus"
- type: contains-any
  value: ["Not in corpus"]

# CORRECT — include all casing variants
- type: contains-any
  value:
    - "Not in corpus"
    - "not in corpus"
    - "Not available"
    - "not available"
    - "NOT IN CORPUS"
```

### 4. LLM graders count "A or B?" as 2 questions

```yaml
# WRONG — grader may fail this because "A or B?" has a question mark
value: "Maximum 1 question"

# CORRECT — clarify compound questions
value: "Maximum 1-2 follow-up questions (a compound 'A or B?' counts as one question)"
```

### 5. Claude wraps JSON in code fences

Use `transform` in `defaultTest` to strip them:

```yaml
defaultTest:
  options:
    transform: "output.replace(/^```json\\n?/g, '').replace(/^```\\n?/g, '').replace(/\\n?```$/g, '').trim()"
```

## Writing New Evals

### Assertion hierarchy (prefer deterministic)

1. **`contains` / `not-contains`** — fastest, cheapest, most reliable
2. **`is-json`** — structural validation
3. **`javascript`** — custom logic, field checks, score ranges
4. **`llm-rubric`** — semantic quality (use sparingly, costs per assertion)

### Template for a new test

```yaml
- description: "Suite - Descriptive test name"
  vars:
    system: "file://prompts/my-system.txt"
    user: "The user input or file://prompts/my-user.txt"
    # Additional vars referenced in the prompt
  assert:
    # Start with deterministic checks
    - type: contains
      value: "expected marker"
    - type: not-contains
      value: "forbidden content"
    # Then structural checks
    - type: is-json
    - type: javascript
      value: |
        const d = JSON.parse(output);
        return d.requiredField !== undefined
    # Finally semantic quality
    - type: llm-rubric
      value: "Clear, specific rubric. Avoid vague criteria. State what SHOULD and SHOULD NOT appear."
```

### Fixture reuse

Shared fixtures in `evals/shared/fixtures/` are referenced with relative paths:

```yaml
vars:
  corpus_data: "file://../shared/fixtures/sample-corpus.md"
  sculptor_transcript: "file://../shared/fixtures/sample-sculptor-transcript.md"
```

## Prompt Source Map

Each eval prompt is derived from a production source. When a production prompt changes, the corresponding eval prompt may need updating.

| Eval Prompt | Production Source | Relationship |
|---|---|---|
| `production/prompts/base-system.txt` | `lib/production/production.md` | Near-copy |
| `production/prompts/journal-mode.txt` | `lib/production/mode-prompts.ts` → journal | Near-copy |
| `production/prompts/crisis-mode.txt` | `lib/production/mode-prompts.ts` → crisis | Near-copy |
| `production/prompts/brainstorm-mode.txt` | `lib/production/mode-prompts.ts` → brainstorm | Near-copy |
| `production/prompts/post-mode.txt` | `lib/production/mode-prompts.ts` → post | Near-copy |
| `tutorial/prompts/welcome-system.txt` | `lib/tutorial/prompts/` + `base.ts` | Simplified |
| `tutorial/prompts/work-questions-system.txt` | `lib/tutorial/prompts/` + `base.ts` | Simplified |
| `tutorial/prompts/report-regen-system.txt` | `lib/tutorial/prompts/` (report step) | Condensed |
| `sculptor/prompts/corpus-summary-*.txt` | `supabase/functions/sculptor-onboard/` | Near-copy |
| `sculptor/prompts/persona-scoring-*.txt` | `supabase/functions/sculptor-gap-final/` | Condensed |
| `voice/prompts/finalize-rc-*.txt` | `app/api/voice/finalize/` | Condensed |
| `voice/prompts/generate-samples-*.txt` | `app/api/voice/generate-samples/` | Condensed |
| `voice/prompts/refine-commandments-*.txt` | `app/api/voice/refine-commandments/` | Condensed |
| `assessment/prompts/synthesis-*.txt` | `lib/assessment/synthesis-prompt.ts` | Simplified (dynamic builder) |
| `assessment/prompts/fos-extraction-*.txt` | `lib/assessment/fos-interview-extraction-prompt.ts` | Condensed |

**Relationship types**:
- **Near-copy**: Production prompt is mirrored; changes should be synced 1:1
- **Simplified**: Dynamic composition (template variables, conditional sections) is flattened for eval
- **Condensed**: Test-specific version with reduced complexity; verify key behaviors still tested

## Temperature Conventions

Temperatures are standardized by task type. See `apps/goodhang/lib/shared/llm-config.ts` for the canonical map.

| Doctype | Temperature | Rationale |
|---|---|---|
| `extraction` | 0.2 | Deterministic data extraction — minimize hallucination |
| `scoring` | 0.3 | Structured scoring/classification — low variance needed |
| `structured-generation` | 0.5 | JSON/structured output — balance accuracy and variety |
| `conversational` | 0.7 | Chat, tutorial, work questions — natural but focused |
| `reflective` | 0.7 | Journal mode, report feedback — thoughtful responses |
| `creative` | 0.8 | Brainstorm mode, voice samples — maximize divergent thinking |
| `theatrical` | 0.9 | Sculptor NPC — maximum personality and improvisation |

**Eval configs** should use temperatures matching their production counterparts. Check `shared/providers.yaml` for provider presets.

## Prompt Change Review Checklist

Before merging prompt changes:

- [ ] Run relevant eval suite locally (`pnpm eval:<suite>`)
- [ ] Check if production prompt changed → consult source map → update eval prompt if needed
- [ ] Verify adversarial/defensive tests still pass
- [ ] No new gotchas (JSON wrapping, question counting, etc.)
- [ ] If adding new tests: follow assertion hierarchy (deterministic first, llm-rubric last)
- [ ] If modifying temperatures: update both production code and eval config
