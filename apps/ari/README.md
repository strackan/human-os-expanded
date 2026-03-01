# ARI - AI Recommendation Index

**Does AI recommend your brand?**

ARI measures how often AI models (ChatGPT, Claude, Perplexity, Gemini) recommend your brand, company, or personal brand when asked relevant questions.

## Quick Start

### Backend

```bash
cd backend

# Install dependencies (using uv - recommended)
uv sync

# Or using pip
pip install -e .

# Copy environment file and add your API keys
cp ../.env.example .env

# Run the server
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit http://localhost:5173 to see the dashboard.

## Project Structure

```
ari/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── models/         # Pydantic data models
│   │   ├── services/       # Business logic
│   │   │   └── ai_providers/  # AI model integrations
│   │   ├── routers/        # API endpoints
│   │   └── storage/        # Database layer
│   └── pyproject.toml
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # React Query hooks
│   │   └── api/           # API client
│   └── package.json
├── CLAUDE.md              # AI assistant context
└── README.md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/entities` | GET | List all entities |
| `/api/v1/entities` | POST | Create entity |
| `/api/v1/entities/{id}` | GET | Get entity by ID |
| `/api/v1/scores/{entity_id}` | GET | Get ARI score |
| `/api/v1/scores/calculate/{entity_id}` | POST | Trigger calculation |
| `/api/v1/scores/compare` | GET | Compare two entities |
| `/api/v1/prompts/templates` | GET | List prompt templates |

## Environment Variables

Create a `.env` file in the project root:

```env
# AI Provider API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...
GOOGLE_API_KEY=...

# Supabase (optional for MVP)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
```

## ARI Score Calculation

The ARI score (0-100) is calculated based on:

1. **Position Scoring**: Where entity appears in AI's list
   - 1st position: 100 points
   - 2nd position: 80 points
   - 3rd position: 60 points
   - etc.

2. **Recommendation Type**: How entity is mentioned
   - Explicit recommendation: 100 points
   - Ranked in list: 85 points
   - Listed as option: 60 points
   - Just mentioned: 40 points

3. **Aggregation**: Weighted average across all prompts and models

## Demo Entities

For the Rick demo, we track:

- **NewsUSA** (company) - Content syndication service
- **NAPS** (company) - North American Precis Syndicate (competitor)
- **Rick Smith** (person) - NewsUSA founder
- **Dorothy York** (person) - NAPS CEO

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, Pydantic
- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Charts**: Recharts
- **Data Fetching**: TanStack React Query
- **AI Providers**: OpenAI, Anthropic, Perplexity, Google Gemini
- **Database**: Supabase (PostgreSQL)

## Development

```bash
# Run both backend and frontend
# Terminal 1
cd backend && uvicorn app.main:app --reload

# Terminal 2
cd frontend && npm run dev
```

## Future Phases

- **Phase 2**: ARI+ Intelligence Layer (follow-up questions, actionable insights)
- **Phase 3**: Semantic Query Layer (searchable response database)
- **Phase 4**: Public API
- **Phase 5**: Continuous Monitoring ("The Farm")
- **Phase 6**: Public Index (ari.com)

## License

Proprietary - All rights reserved.
