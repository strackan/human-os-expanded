# Good Hang 100-Person Network Demo

Demonstrates semantic search across a trusted network in 4 modes, showcasing the power vs LinkedIn, Google, or Claude.

## Quick Start

```bash
cd apps/goodhang

# 1. Set environment variables
export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
export OPENAI_API_KEY=your_openai_key
export ANTHROPIC_API_KEY=your_anthropic_key  # Optional but recommended

# 2. Seed 100 synthetic profiles
npx tsx scripts/demo/generate-profiles.ts --count 100 --seed 42

# 3. Generate network connections
npx tsx scripts/demo/generate-network.ts --seed 42

# 4. Generate embeddings (takes ~5 min for 100 profiles)
npx tsx scripts/demo/generate-embeddings.ts --all

# 5. Run the demo
npx tsx scripts/demo/run-demo.ts
```

## What This Demonstrates

### The Problem
- **LinkedIn**: Keyword-only search, no personality matching, InMail spam
- **Google**: Broad search, no network context, no trust weighting
- **Claude**: No persistent network, session-only knowledge, no action execution

### The Solution: Good Hang Network Search
Multi-dimensional semantic search with:
- Deep personality data (D&D attributes, alignment, enneagram)
- Trust-weighted network graph
- Actionable follow-ups (not just search results)
- Connection path finding

## Four Search Modes

### 1. Thought Leadership
Find people by ideas and expertise.

```
Query: "Who has interesting takes on AI agents?"
Returns: People with relevant posts, frameworks, and hot takes
Actions: Draft intro request, save to list
```

### 2. Social
Find compatible people for hangouts.

```
Query: "Find hiking buddies in Denver with good vibes"
Returns: People matched by interests + personality compatibility
Actions: Suggest hangout, schedule meeting
```

### 3. Professional
Find people for career/business networking.

```
Query: "VP of Engineering in fintech with scaling experience"
Returns: People matched by role, industry, and skills
Actions: Request intro, save to hiring list
```

### 4. GuyForThat
Find someone who can help with a specific need.

```
Query: "Someone who can help with Series A pitch deck"
Returns: People with relevant expertise, trust-weighted
Actions: Draft intro via mutual connection
```

## Architecture

### Data Model

```
┌─────────────────────────────────────────────────────────────┐
│                     Per-Profile Data                        │
├─────────────────────────────────────────────────────────────┤
│ global.entities        │ Core identity (name, linkedin_url) │
│ member_characters      │ D&D attributes, class, alignment   │
│ identity_packs         │ Professional, interests, social    │
│ gft.contacts           │ CRM data (title, company, labels)  │
│ entity_links           │ Network connections                │
│ global.entity_embeddings│ pgvector semantic embeddings      │
└─────────────────────────────────────────────────────────────┘
```

### Embedding Types (5 per person)

| Type | Source | Use Case |
|------|--------|----------|
| `profile` | Full synthesis | General search |
| `thought_leadership` | Posts + frameworks + hot takes | Idea search |
| `interests` | Hobbies + activities | Social compatibility |
| `professional` | Work experience + skills | Career search |
| `personality` | D&D attributes as narrative | Compatibility matching |

### Search Flow

```
1. Query → Generate embedding (OpenAI text-embedding-3-small)
2. Vector search (pgvector) against relevant embedding types
3. Load full profile data
4. Apply mode-specific ranking:
   - Attribute boosts (high INT for thought_leadership, high CHA for social)
   - Alignment compatibility
   - Trust weighting (connection degree)
5. Enrich with network context (connection paths, mutual connections)
6. Generate explanations (Claude Haiku)
7. Add actionable follow-ups
```

## Files

### Scripts
- `generate-profiles.ts` - Generate 100 synthetic profiles
- `generate-network.ts` - Create network connections
- `generate-embeddings.ts` - Generate semantic embeddings
- `run-demo.ts` - Run the demo scenarios

### Library
- `lib/demo/search.ts` - Hybrid search engine
- `lib/demo/actions.ts` - Tool actions (draft_intro, schedule_meeting, etc.)
- `lib/demo/index.ts` - Exports

### API Routes
- `POST /api/network-search` - Main search endpoint
- `POST /api/demo/actions` - Execute actions
- `GET /api/demo/seed` - Seeding documentation

## CLI Options

### generate-profiles.ts
```bash
--count <n>    # Number of profiles (default: 100)
--seed <n>     # Random seed for reproducibility (default: 42)
--clear        # Clear existing demo data first
```

### generate-network.ts
```bash
--seed <n>     # Random seed (default: 42)
--clear        # Clear existing connections
```

### generate-embeddings.ts
```bash
--all              # Generate all embedding types
--type <type>      # Generate specific type only
--profile-id <id>  # Generate for specific profile
--batch-size <n>   # Batch size (default: 20)
```

### run-demo.ts
```bash
(no args)          # Run all 4 scenarios
--scenario <n>     # Run specific scenario (1-4)
--interactive      # Interactive mode for custom queries
```

## Network Clusters

The synthetic profiles are organized into clusters:

| Cluster | Size | Density | Description |
|---------|------|---------|-------------|
| YC Mafia | 15 | 60% | Startup founders |
| Ex-Stripe | 12 | 50% | Ex-Stripe employees |
| NYC Tech | 18 | 40% | NYC tech community |
| AI/ML Community | 15 | 50% | AI/ML practitioners |
| Good Hang OGs | 10 | 80% | Original members |
| Climate Tech | 10 | 40% | Climate/sustainability |
| Indie Hackers | 12 | 30% | Solo founders |
| Random | 8 | 10% | Misc connections |

Plus 15 "bridge" profiles that connect multiple clusters.

## API Usage

### Search
```typescript
// POST /api/network-search
const response = await fetch('/api/network-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Find someone who knows about pricing strategy',
    mode: 'guy_for_that',
    filters: { location: 'San Francisco' },
    limit: 10,
  }),
});

const { results, totalMatches, executionTimeMs } = await response.json();
```

### Actions
```typescript
// POST /api/demo/actions
const response = await fetch('/api/demo/actions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'draft_intro',
    data: {
      targetId: 'uuid',
      targetName: 'David Park',
      introducerName: 'Sarah Kim',
    },
    context: {
      userId: 'your-user-id',
      userName: 'Your Name',
      searchQuery: 'pricing strategy help',
    },
  }),
});

const { message, subject } = await response.json();
// message: "Hey Sarah, would you be open to introducing me to David?..."
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `OPENAI_API_KEY` | Yes | For embedding generation |
| `ANTHROPIC_API_KEY` | Recommended | For profile enhancement & explanations |

## Database Requirements

The demo requires these tables/schemas:
- `global.entities` - Core identity
- `global.entity_embeddings` - pgvector embeddings
- `identity_packs` - Multi-dimensional identity
- `member_characters` - D&D character data
- `gft.contacts` - CRM data (optional)
- `entity_links` - Network connections (optional)

Run existing migrations if these don't exist.

## Extending

### Add New Search Mode
1. Add mode to `SearchMode` type in `lib/demo/search.ts`
2. Define embedding types in `getEmbeddingTypesForMode()`
3. Add boost factors in `getModeBoostFactors()`
4. Update API documentation

### Add New Action
1. Add type to `ActionType` in `lib/demo/actions.ts`
2. Implement method in `ActionEngine` class
3. Add case to API route switch statement
4. Update API documentation

### Customize Profile Generation
Edit constants in `generate-profiles.ts`:
- `INDUSTRIES` - Industry verticals
- `ROLES` - Role distribution
- `LOCATIONS` - Geographic distribution
- `CLUSTERS` - Network clusters
