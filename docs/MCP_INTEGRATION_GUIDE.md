# MCP Integration Guide

## Overview

This guide covers the MCP (Model Context Protocol) integration in Renubu, which enables AI-powered database queries, conversation memory, and advanced analytics.

## Phase 1: Foundation (Current)

### Implemented Features

1. **Supabase MCP Client**
   - Direct AI queries to customer database
   - Natural language → SQL translation
   - Support for filters, ordering, pagination
   - Insert, update, delete operations

2. **PostgreSQL MCP Client**
   - Advanced SQL analytics queries
   - Read-only query enforcement
   - Pre-built analytics queries for renewals, customers, health scores
   - Transaction support

3. **Memory MCP Client**
   - Persistent conversation context across sessions
   - Tag-based memory organization
   - Context-aware memory retrieval
   - Automatic access tracking

## Setup

### 1. Environment Configuration

The MCP configuration has been added to `.env.local`:

```bash
# Enable MCP
MCP_ENABLED=true
MCP_LOG_LEVEL=info

# Phase 1 Servers
MCP_ENABLE_SUPABASE=true
MCP_ENABLE_POSTGRESQL=true
MCP_ENABLE_MEMORY=true

# PostgreSQL Connection
MCP_POSTGRES_CONNECTION_STRING=postgresql://...

# Memory Storage
MCP_MEMORY_STORAGE_TYPE=database
MCP_MEMORY_TABLE=mcp_memory
MCP_MEMORY_TTL=86400
```

### 2. Initialize MCP Manager

The MCP Manager is automatically initialized when the LLMService is instantiated:

```typescript
import { initializeMCPManager } from '@/lib/mcp/MCPManager';
import { getMCPClientConfigs } from '@/lib/mcp/config/mcp-registry';

// Initialize
const mcpManager = await initializeMCPManager({
  clients: getMCPClientConfigs(),
});
```

## Usage

### API Endpoints

#### Query MCP Server
```bash
POST /api/mcp/query
Content-Type: application/json

{
  "server": "supabase",
  "action": "query",
  "parameters": {
    "table": "customers",
    "filter": {
      "renewal_status": "at-risk"
    },
    "limit": 10
  }
}
```

#### Health Check
```bash
GET /api/mcp/health

# Response
{
  "enabled": true,
  "servers": [
    {
      "server": "supabase",
      "status": "healthy",
      "latency": 45
    }
  ],
  "metrics": [...]
}
```

#### Get Tool Definitions
```bash
GET /api/mcp/tools

# Response
{
  "enabled": true,
  "count": 8,
  "tools": [
    {
      "name": "mcp_supabase_query",
      "description": "Query data from Supabase database tables",
      "parameters": {...}
    }
  ]
}
```

### Programmatic Usage

#### Query Customers via Supabase MCP
```typescript
import { getMCPManager } from '@/lib/mcp/MCPManager';

const mcpManager = getMCPManager();

const result = await mcpManager.query({
  server: 'supabase',
  action: 'query',
  parameters: {
    table: 'customers',
    filter: {
      renewal_date: {
        operator: 'gte',
        value: new Date().toISOString()
      },
      health_score: {
        operator: 'lt',
        value: 50
      }
    },
    order: {
      column: 'renewal_date',
      ascending: true
    },
    limit: 20
  }
});

if (result.success) {
  console.log('At-risk customers:', result.data);
}
```

#### Execute Analytics Query via PostgreSQL MCP
```typescript
const analyticsResult = await mcpManager.query({
  server: 'postgresql',
  action: 'query',
  parameters: {
    sql: `
      SELECT
        DATE_TRUNC('month', renewal_date) as month,
        COUNT(*) as renewal_count,
        SUM(arr) as total_arr,
        AVG(health_score) as avg_health
      FROM customers
      WHERE renewal_date >= NOW()
      GROUP BY DATE_TRUNC('month', renewal_date)
      ORDER BY month ASC
    `,
    params: []
  }
});

if (analyticsResult.success) {
  console.log('Renewal forecast:', analyticsResult.data);
}
```

#### Store and Retrieve Conversation Memory
```typescript
// Store memory
await mcpManager.query({
  server: 'memory',
  action: 'store',
  parameters: {
    key: 'customer_acme_pricing_discussion',
    value: {
      customer: 'Acme Corp',
      topic: 'pricing negotiation',
      notes: 'Considering 15% discount for 2-year commitment',
      stakeholders: ['CFO', 'VP Engineering']
    },
    metadata: {
      context: 'renewal',
      tags: ['pricing', 'negotiation', 'acme-corp']
    }
  }
});

// Retrieve memory
const memoryResult = await mcpManager.query({
  server: 'memory',
  action: 'retrieve',
  parameters: {
    context: 'renewal',
    tags: ['acme-corp'],
    limit: 5
  }
});

console.log('Previous discussions:', memoryResult.data);
```

## LLM Integration

The MCP tools are automatically available to the AI in workflow chats:

### Example AI Conversation

**User:** "Show me customers renewing in the next 30 days with health scores below 60"

**AI uses `mcp_supabase_query` tool:**
```json
{
  "table": "customers",
  "filter": {
    "renewal_date": {
      "operator": "between",
      "value": ["2025-01-21", "2025-02-20"]
    },
    "health_score": {
      "operator": "lt",
      "value": 60
    }
  },
  "order": {
    "column": "renewal_date",
    "ascending": true
  }
}
```

**AI Response:** "I found 7 customers renewing in the next 30 days with health scores below 60:

1. RiskyRenovations - Renewal: Jan 25, Health: 42
2. AtRisk Corp - Renewal: Feb 3, Health: 55
..."

## Monitoring

### Health Checks

MCP Manager runs automatic health checks every 60 seconds. View status:

```bash
curl http://localhost:3000/api/mcp/health
```

### Metrics

Track MCP usage:

```typescript
const metrics = mcpManager.getMetrics();
// Returns: requestCount, successCount, errorCount, averageLatency
```

### Logging

Set log level in `.env.local`:

```bash
MCP_LOG_LEVEL=debug  # debug | info | warn | error
```

## Troubleshooting

### MCP Not Enabled

**Error:** `MCP_DISABLED: MCP is not enabled`

**Solution:** Set `MCP_ENABLED=true` in `.env.local`

### Connection Errors

**Error:** `PostgreSQL connection string is required`

**Solution:** Set `MCP_POSTGRES_CONNECTION_STRING` in `.env.local`

### Tool Not Found

**Error:** `Unknown MCP server: xyz`

**Solution:** Check that the server is enabled in `.env.local`:
```bash
MCP_ENABLE_SUPABASE=true
```

### Query Fails

**Error:** `Write operation denied`

**Solution:** PostgreSQL MCP only allows read-only queries. Use Supabase MCP for write operations.

## Architecture

### Directory Structure
```
src/lib/mcp/
├── clients/
│   ├── SupabaseMCPClient.ts
│   ├── PostgreSQLMCPClient.ts
│   └── MemoryMCPClient.ts
├── config/
│   ├── mcp-registry.ts
│   └── mcp-connections.ts
├── types/
│   └── mcp.types.ts
├── MCPManager.ts
└── ...
```

### Request Flow

1. **User Message** → LLMService
2. **LLMService** → Gets MCP tool definitions
3. **LLM** → Decides to use MCP tool
4. **LLMService** → Executes MCP tool via MCPManager
5. **MCPManager** → Routes to specific MCP client
6. **MCP Client** → Executes action (query, store, etc.)
7. **Result** → Returns to LLM
8. **LLM** → Incorporates result into response

## Next Steps (Future Phases)

### Phase 2: Communication
- Email MCP (Mailgun/SendGrid)
- Slack MCP
- Google Calendar MCP

### Phase 3: Integrations
- GitHub MCP
- Linear/Jira MCP
- Stripe MCP
- Twilio MCP

### Phase 4: Documents
- Playwright MCP
- OCR MCP

## Support

For issues or questions:
1. Check the [MCP Types](src/lib/mcp/types/mcp.types.ts) for API reference
2. Review [MCP Registry](src/lib/mcp/config/mcp-registry.ts) for configuration
3. Test with `/api/mcp/health` endpoint
4. Enable `MCP_LOG_LEVEL=debug` for detailed logs

## References

- [Model Context Protocol Specification](https://github.com/modelcontextprotocol)
- [Supabase MCP Documentation](https://github.com/modelcontextprotocol/servers/tree/main/supabase)
- [PostgreSQL MCP Best Practices](https://github.com/modelcontextprotocol/servers/tree/main/postgresql)
