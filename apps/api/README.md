# Human OS REST API

REST API Gateway for Human OS. Provides the same capabilities as MCP tools for clients that can't use MCP (mobile, web apps, external integrations).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONSUMERS                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  MCP Tools   │  │  REST API    │  │  Mobile App  │           │
│  │  (Desktop)   │  │  (This)      │  │  (Claude)    │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
├─────────┴─────────────────┴─────────────────┴───────────────────┤
│                     @human-os/services                            │
│  Shared implementation layer - single source of truth             │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Setup Environment

```bash
cd apps/api
cp .env.example .env

# Edit .env with your Supabase credentials:
# SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2. Build & Run

```bash
# From monorepo root
pnpm install
pnpm build --filter @human-os/api

# Run the API
pnpm --filter @human-os/api start

# Or development mode
pnpm --filter @human-os/api dev
```

### 3. Create an API Key

```sql
-- In Supabase SQL Editor
INSERT INTO api_keys (id, owner_id, name, scopes, is_active)
VALUES (
  'hk_live_your_key_here',
  'your-user-uuid',
  'Mobile Claude',
  ARRAY['founder-os:read', 'founder-os:write'],
  true
);
```

## API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check (no auth) |
| `/v1/do` | POST | Natural language command router |
| `/v1/do/aliases` | GET | List available aliases |

### Queue (Mobile → Desktop Sync)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/queue` | POST | Add item to queue |
| `/v1/queue` | GET | List pending items |
| `/v1/queue/:id` | GET | Get single item |
| `/v1/queue/:id` | PUT | Update pending item |
| `/v1/queue/process` | POST | Process all pending |
| `/v1/queue/:id/process` | POST | Process single item |

### Tasks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/tasks` | POST | Create task |
| `/v1/tasks` | GET | List tasks (with filters) |
| `/v1/tasks/urgent` | GET | Get urgent tasks |
| `/v1/tasks/:id` | GET | Get single task |
| `/v1/tasks/:id` | PUT | Update task |
| `/v1/tasks/:id/complete` | POST | Mark complete |
| `/v1/tasks/:id` | DELETE | Delete task |

### Aliases

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/aliases` | POST | Create alias |
| `/v1/aliases` | GET | List aliases |
| `/v1/aliases/search?q=` | GET | Search aliases |
| `/v1/aliases/:id` | GET | Get single alias |
| `/v1/aliases/:id` | PUT | Update alias |
| `/v1/aliases/:id/disable` | POST | Disable alias |
| `/v1/aliases/:id/enable` | POST | Enable alias |
| `/v1/aliases/:id` | DELETE | Delete alias |

## Testing

### Using curl

```bash
# Set your API key
export API_KEY="hk_live_your_key_here"
export API_URL="http://localhost:3000"

# Health check
curl $API_URL/health

# Add a task
curl -X POST $API_URL/v1/tasks \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task", "priority": "high"}'

# Get urgent tasks
curl $API_URL/v1/tasks/urgent \
  -H "Authorization: Bearer $API_KEY"

# Add to queue (for mobile sync)
curl -X POST $API_URL/v1/queue \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "intent_type": "task",
    "payload": {"title": "Call John about contract"},
    "notes": "From mobile braindump"
  }'

# Use natural language (do endpoint)
curl -X POST $API_URL/v1/do \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"request": "what'"'"'s urgent"}'
```

### Test Script

```bash
# Create test script
cat > test-api.sh << 'EOF'
#!/bin/bash
API_KEY="${API_KEY:-hk_live_test}"
API_URL="${API_URL:-http://localhost:3000}"

echo "Testing Human OS API..."

# Health
echo -n "Health: "
curl -s $API_URL/health | jq -r '.status'

# Auth test
echo -n "Auth: "
curl -s -w "%{http_code}" -o /dev/null \
  -H "Authorization: Bearer $API_KEY" \
  $API_URL/v1/tasks

# Add task
echo -e "\nAdding task..."
curl -s -X POST $API_URL/v1/tasks \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "API Test Task"}' | jq

echo "Done!"
EOF
chmod +x test-api.sh
./test-api.sh
```

## Claude Mobile Configuration

### Option 1: Custom Instructions (Recommended)

Add to Claude mobile custom instructions:

```
When I ask you to do founder-os tasks (add task, check urgent, queue item, etc.),
use the Human OS REST API at https://your-api-domain.com

API Key: hk_live_xxx (store securely)

Common actions:
- Add task: POST /v1/tasks {"title": "...", "priority": "high|medium|low"}
- Get urgent: GET /v1/tasks/urgent
- Queue for later: POST /v1/queue {"intent_type": "task", "payload": {"title": "..."}}
- Natural command: POST /v1/do {"request": "your natural language request"}

Always use Authorization: Bearer <api_key> header.
```

### Option 2: MCP Proxy (Advanced)

If Claude mobile eventually supports MCP, create a proxy that translates:

```
MCP call → REST API call → MCP response format
```

### Option 3: Claude Projects

Create a Claude Project with:
1. API documentation as context
2. API key in project instructions
3. Example conversations

## Deployment

### Vercel

```bash
vercel deploy --prod
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key |

## Security Notes

1. **API Keys**: Use `hk_live_` prefix for production, `hk_test_` for development
2. **Scopes**: Limit API key scopes to what's needed (`founder-os:read`, `founder-os:write`)
3. **Rate Limiting**: Default 100 requests/minute per API key
4. **HTTPS**: Always use HTTPS in production

## Troubleshooting

### "Invalid API key format"
API key must start with `hk_live_` or `hk_test_`

### "Insufficient permissions"
Check API key scopes in database match required scope

### "User ID not found"
API key's `owner_id` is null - update in database

### Queue items not processing
Check that intent_type matches expected values: `task`, `event`, `decision`, `note`, `memory_edit`
