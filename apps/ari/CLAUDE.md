# ARI (AI Recommendation Index)

## Project Overview

ARI measures "Does AI recommend your brand?" by querying multiple AI models with a prompt matrix and calculating recommendation scores (0-100).

**Vision:** Become the Rotten Tomatoes of AI discoverability.

## Location

Now lives inside the HumanOS monorepo at `core/apps/ari/`. Managed via pm2:
- **Backend:** `dev start ari` → `fancyrobot:ari-backend` (port 4250)
- **Frontend:** `dev start ari` → `fancyrobot:ari-frontend` (port 4202)

## Quick Start

```bash
# Backend
cd apps/ari/backend
uv sync  # or: pip install -r requirements.txt
cp .env.example .env  # Add API keys
dev start ari          # Starts both frontend + backend via pm2

# Frontend (standalone, if needed)
cd apps/ari/frontend
npm install
dev start ari
```

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, Supabase (PostgreSQL)
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
- **AI Providers:** OpenAI, Anthropic, Perplexity, Google Gemini

## Project Structure

```
ari/
├── backend/app/           # FastAPI application
│   ├── models/            # Pydantic data models
│   ├── services/          # Business logic (prompt runner, parser, scoring)
│   │   └── ai_providers/  # AI model integrations
│   ├── storage/           # Database access
│   ├── routers/           # API endpoints
│   └── prompts/           # Prompt templates (YAML)
├── frontend/src/          # React dashboard
│   └── components/        # UI components
```

## Key Concepts

### ARI Score (0-100)
- **Position scoring:** 1st=100, 2nd=80, 3rd=60, 4th=40, 5th=20
- **Recommendation type:** explicit=100, ranked=85, mentioned=50, not_mentioned=0
- **Final ARI:** Weighted average across all prompts and models, normalized to 0-100

### Entity Types
- `person` - Thought leaders, experts (Rick Smith, Dorothy York)
- `company` - Brands, services (NewsUSA, NAPS)
- `product` - Specific products

### Prompt Matrix
- ~30 prompts per category
- Variations: list size (1, 3, 5), intent (best, recommend, compare), specificity
- Category: content_syndication (for Rick demo)

## Current Phase: Phase 1 (Rick Demo)

**Goal:** Demo showing NewsUSA vs NAPS and Rick Smith vs Dorothy York.

**Demo entities:**
- NewsUSA (company) - Rick's company
- NAPS (company) - Competitor (North American Precis Syndicate)
- Rick Smith (person) - NewsUSA founder
- Dorothy York (person) - NAPS President & CEO

## API Endpoints

```
POST /api/v1/entities                       # Create entity
POST /api/v1/scores/calculate/{id}          # Trigger ARI calculation
GET  /api/v1/scores/calculate/{job}/status  # Poll progress
GET  /api/v1/scores/{id}                    # Get ARI score
GET  /api/v1/scores/compare                 # Compare entities
GET  /api/v1/responses/{id}/samples         # Get example AI responses
```

## Environment Variables

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...
GOOGLE_API_KEY=...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
```

## Development Guidelines

### Backend
- Use async/await for all AI API calls
- Implement retry with exponential backoff for API calls
- Store raw responses for later re-parsing
- Use Pydantic models for all data validation

### Frontend
- Use React Query for API data fetching
- Framer Motion for score animations
- Tailwind for styling (no custom CSS unless necessary)

### Prompts
- Keep prompts in YAML files for easy editing
- Weight important prompts higher (head-to-head = 1.3x)
- Test prompts manually before adding to matrix

## Scoring Algorithm

```python
# Per-prompt score
def score_mention(position: int, rec_type: str) -> float:
    position_score = {1: 100, 2: 80, 3: 60, 4: 40, 5: 20}.get(position, 10)
    rec_score = {"explicit": 100, "ranked": 85, "mentioned": 50}.get(rec_type, 0)
    return max(position_score, rec_score)

# Aggregate ARI
def calculate_ari(scores: list[float], weights: list[float]) -> float:
    weighted_sum = sum(s * w for s, w in zip(scores, weights))
    max_possible = sum(100 * w for w in weights)
    return (weighted_sum / max_possible) * 100
```

## Database Schema

Key tables:
- `entities` - Companies, people, products to track
- `prompt_templates` - The prompt matrix templates
- `prompt_runs` - Individual analysis jobs
- `ai_responses` - Raw and parsed AI responses
- `ari_scores` - Calculated scores

## Future Phases

- **Phase 2:** ARI+ Intelligence Layer (follow-up questions, actionable insights)
- **Phase 3:** Semantic Query Layer (searchable response database)
- **Phase 4:** Public API
- **Phase 5:** Continuous Monitoring ("The Farm")
- **Phase 6:** Public Index (ari.com)
