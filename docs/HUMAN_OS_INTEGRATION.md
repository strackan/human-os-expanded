# Human OS Integration Guide

**Last Updated:** 2025-12-10
**Version:** 1.0
**Audience:** Internal (Engineers, Technical Leads)

---

## Overview

Human OS is a standalone platform that provides context management, knowledge graph, and entity tracking capabilities. Renubu integrates with Human OS as an external service to power features like Human OS Check-Ins, pattern detection, and relationship intelligence.

**Key Decision:** Renubu consumes Human OS APIs rather than building these capabilities internally. This reduces Human OS Check-Ins implementation from 64h to 32h while enabling cross-product intelligence.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Human OS Platform                        │
├─────────────────────────────────────────────────────────────────┤
│  REST API (apps/api)           │  MCP Servers                   │
│  ├── /v1/context               │  ├── @human-os/mcp-server      │
│  ├── /v1/graph                 │  └── @human-os/founder-os-base │
│  ├── /v1/entities              │                                 │
│  ├── /v1/voice                 │  Packages                       │
│  └── /v1/experts               │  ├── @human-os/core            │
│                                │  └── @human-os/commercial      │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ API Calls (Bearer Token Auth)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Renubu Platform                          │
├─────────────────────────────────────────────────────────────────┤
│  Layer: renubu:tenant-{tenantId}                                │
│                                                                  │
│  Use Cases:                                                      │
│  ├── Workflow completion storage                                │
│  ├── Check-in data & patterns                                   │
│  ├── Entity tracking (people, companies)                        │
│  └── Relationship graph for recommendations                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Convention

Renubu uses the `renubu:tenant-{tenantId}` layer pattern for multi-tenant isolation.

```
renubu:tenant-abc123/
├── check-ins/
│   ├── workflow-123.md         # Check-in for specific workflow
│   └── workflow-456.md
├── workflows/
│   ├── onboarding-complete.md  # Workflow completion records
│   └── quarterly-review.md
├── people/
│   ├── scott-leese.md          # Contact records
│   └── jane-doe.md
└── companies/
    ├── acme-corp.md            # Company records
    └── founding-labs.md
```

**Privacy:** Each tenant's data is completely isolated. Tenant A cannot access Tenant B's data.

---

## API Reference

### Authentication

All API calls require a Bearer token:

```bash
Authorization: Bearer hk_live_renubu_xxx
```

API keys are created in the `api_keys` table with scopes:
- `context:renubu:*:read` - Read context files
- `context:renubu:*:write` - Write context files
- `graph:read` - Query knowledge graph
- `entities:read` - Read entities
- `entities:write` - Create/update entities

### Context API

**Create/Update Context File:**
```typescript
POST /v1/context
{
  "layer": "renubu:tenant-abc123",
  "folder": "check-ins",
  "slug": "workflow-123",
  "content": `---
workflow_id: "123"
completed_at: "2025-12-10T10:30:00Z"
success_rating: 4
---

# Workflow Check-In

## What worked well?
The [[Scott Leese]] meeting prep was perfect. Used the [[Quarterly Review]] template.

## What would you do differently?
Start earlier next time.
`
}
```

**Read Context File:**
```typescript
GET /v1/context/renubu:tenant-abc123/check-ins/workflow-123

Response:
{
  "filePath": "renubu:tenant-abc123/check-ins/workflow-123.md",
  "frontmatter": {
    "workflow_id": "123",
    "completed_at": "2025-12-10T10:30:00Z",
    "success_rating": 4
  },
  "content": "# Workflow Check-In\n\n## What worked well?...",
  "entityId": "uuid-of-entity"
}
```

**Search Context Files:**
```typescript
GET /v1/context/search?query=quarterly+review&limit=10

Response:
{
  "results": [
    {
      "filePath": "renubu:tenant-abc123/check-ins/workflow-456.md",
      "frontmatter": { ... },
      "snippet": "...used the Quarterly Review template..."
    }
  ]
}
```

### Graph API

**Get Connections:**
```typescript
GET /v1/graph/connections/scott-leese?direction=both&linkTypes=wiki_link,mentions

Response:
{
  "edges": [
    {
      "sourceSlug": "workflow-123",
      "targetSlug": "scott-leese",
      "linkType": "wiki_link",
      "strength": 1.0
    }
  ],
  "nodes": [
    {
      "slug": "scott-leese",
      "name": "Scott Leese",
      "entityType": "person"
    }
  ]
}
```

**Find Related Entities:**
```typescript
GET /v1/graph/related?slugs=workflow-123,workflow-456&limit=5

Response:
{
  "related": [
    {
      "slug": "quarterly-review",
      "name": "Quarterly Review",
      "entityType": "project"
    }
  ]
}
```

**Traverse Graph:**
```typescript
GET /v1/graph/traverse/user-justin?maxDepth=2&entityTypes=person,company

Response:
{
  "nodes": [...],
  "edges": 15,
  "paths": [
    ["user-justin", "scott-leese", "founding-labs"]
  ]
}
```

**Get Backlinks:**
```typescript
GET /v1/graph/backlinks/scott-leese

Response:
{
  "backlinks": [
    {
      "sourceSlug": "workflow-123",
      "linkType": "wiki_link",
      "linkText": "Scott Leese"
    }
  ]
}
```

### Entity API

**Create Entity:**
```typescript
POST /v1/entities
{
  "entityType": "person",
  "name": "Scott Leese",
  "slug": "scott-leese",
  "email": "scott@example.com",
  "metadata": {
    "company": "Founding Labs",
    "role": "Product Manager"
  },
  "privacyScope": "tenant"
}
```

**Search Entities:**
```typescript
GET /v1/entities/search?query=scott&entityType=person&limit=10

Response:
{
  "results": [
    {
      "id": "uuid",
      "slug": "scott-leese",
      "name": "Scott Leese",
      "entityType": "person",
      "email": "scott@example.com"
    }
  ]
}
```

---

## Integration Patterns

### 1. Storing Workflow Completions

When a user completes a workflow, store the completion data in Human OS:

```typescript
// In WorkflowExecutionService.complete()
async function storeCompletionInHumanOS(execution: WorkflowExecution) {
  const content = `---
workflow_id: "${execution.workflow_id}"
user_id: "${execution.user_id}"
completed_at: "${new Date().toISOString()}"
duration_minutes: ${execution.duration_minutes}
---

# Workflow Completion: ${execution.workflow.name}

## Summary
${execution.summary}

## Entities Involved
${execution.mentions.map(m => `- [[${m}]]`).join('\n')}
`;

  await fetch(`${HUMAN_OS_API}/v1/context`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUMAN_OS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      layer: `renubu:tenant-${execution.tenant_id}`,
      folder: 'workflow-completions',
      slug: execution.id,
      content
    })
  });
}
```

### 2. Check-In Data Storage

Store check-in responses with wiki links for automatic relationship indexing:

```typescript
async function storeCheckIn(checkIn: CheckInData) {
  const content = `---
workflow_execution_id: "${checkIn.executionId}"
completed_at: "${checkIn.completedAt}"
success_rating: ${checkIn.successRating}
would_repeat: ${checkIn.wouldRepeat}
---

# Check-In: ${checkIn.workflowName}

## What worked well?
${checkIn.whatWorked}

## What would you do differently?
${checkIn.whatDifferent}

## People Involved
${checkIn.people.map(p => `- [[${p}]]`).join('\n')}
`;

  await humanOSClient.createContext({
    layer: `renubu:tenant-${checkIn.tenantId}`,
    folder: 'check-ins',
    slug: checkIn.executionId,
    content
  });
}
```

### 3. Pattern Detection via Graph Queries

Find patterns in user's workflow history:

```typescript
async function findSimilarWorkflows(userId: string, workflowSlug: string) {
  // Get all workflows this user has completed
  const userWorkflows = await humanOSClient.traverse({
    startSlug: `user-${userId}`,
    maxDepth: 2,
    linkTypes: ['wiki_link', 'owns']
  });

  // Find related workflows based on shared entities
  const related = await humanOSClient.getRelatedEntities(
    userWorkflows.nodes.map(n => n.slug),
    { limit: 5, excludeTypes: ['person'] }
  );

  return related;
}
```

### 4. "This Worked for YOU Before" Recommendations

Use backlinks to find previous successful patterns:

```typescript
async function getWhatWorkedBefore(entitySlug: string, userId: string) {
  // Find all check-ins that mention this entity
  const backlinks = await humanOSClient.getBacklinks(entitySlug);

  // Filter to this user's check-ins with high success ratings
  const userCheckIns = backlinks.backlinks.filter(bl =>
    bl.sourceSlug.startsWith(`user-${userId}`) &&
    bl.linkType === 'wiki_link'
  );

  // Load full check-in content to extract recommendations
  const recommendations = await Promise.all(
    userCheckIns.map(async (checkIn) => {
      const content = await humanOSClient.getContext(
        `renubu:tenant-${tenantId}`,
        'check-ins',
        checkIn.sourceSlug
      );
      return {
        workflowName: content.frontmatter.workflow_name,
        whatWorked: extractSection(content.content, 'What worked well?'),
        successRating: content.frontmatter.success_rating
      };
    })
  );

  return recommendations.filter(r => r.successRating >= 4);
}
```

### 5. Auto-Creating Entities from Mentions

When wiki links are detected, ensure entities exist:

```typescript
async function ensureEntitiesExist(mentions: string[], tenantId: string) {
  for (const mention of mentions) {
    const slug = slugify(mention);

    // Check if entity exists
    const existing = await humanOSClient.searchEntities({
      query: mention,
      limit: 1
    });

    if (existing.results.length === 0) {
      // Create new entity
      await humanOSClient.createEntity({
        entityType: 'person', // or infer from context
        name: mention,
        slug,
        privacyScope: 'tenant'
      });
    }
  }
}
```

---

## Environment Variables

```bash
# Human OS API Configuration
HUMAN_OS_API_URL=https://api.human-os.io  # or localhost:3000 for dev
HUMAN_OS_API_KEY=hk_live_renubu_xxx       # Renubu's API key

# Per-tenant keys (if using tenant-specific keys)
# Stored in database, not env vars
```

---

## Error Handling

```typescript
class HumanOSClient {
  async request(endpoint: string, options: RequestInit) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();

      if (response.status === 401) {
        throw new HumanOSAuthError('Invalid API key');
      }
      if (response.status === 403) {
        throw new HumanOSScopeError(`Missing scope: ${error.required}`);
      }
      if (response.status === 404) {
        throw new HumanOSNotFoundError(error.error);
      }
      if (response.status === 429) {
        throw new HumanOSRateLimitError('Rate limit exceeded');
      }

      throw new HumanOSError(error.error || 'Unknown error');
    }

    return response.json();
  }
}
```

---

## Testing

### Local Development

1. Run Human OS locally:
   ```bash
   cd ../human-os
   pnpm dev  # Starts API on localhost:3000
   ```

2. Create test API key:
   ```sql
   INSERT INTO api_keys (id, owner_id, name, scopes, is_active)
   VALUES (
     'hk_test_renubu_local',
     'system',
     'Renubu Local Dev',
     ARRAY['context:renubu:*:read', 'context:renubu:*:write', 'graph:read', 'entities:*'],
     true
   );
   ```

3. Configure Renubu:
   ```bash
   HUMAN_OS_API_URL=http://localhost:3000
   HUMAN_OS_API_KEY=hk_test_renubu_local
   ```

### Integration Tests

```typescript
describe('Human OS Integration', () => {
  it('stores and retrieves check-in data', async () => {
    const checkIn = {
      tenantId: 'test-tenant',
      executionId: 'test-execution',
      workflowName: 'Test Workflow',
      successRating: 5,
      whatWorked: 'Everything!'
    };

    await storeCheckIn(checkIn);

    const result = await humanOSClient.getContext(
      'renubu:tenant-test-tenant',
      'check-ins',
      'test-execution'
    );

    expect(result.frontmatter.success_rating).toBe(5);
  });

  it('finds related workflows via graph', async () => {
    // Setup: Create two workflows mentioning same person
    // ...

    const related = await humanOSClient.getRelatedEntities(
      ['workflow-1', 'workflow-2'],
      { limit: 5 }
    );

    expect(related.related).toContainEqual(
      expect.objectContaining({ slug: 'shared-person' })
    );
  });
});
```

---

## Migration Plan

### Phase 0.2: Foundation (16h)

1. **API Client Setup (4h)**
   - Create `HumanOSClient` service class
   - Configure authentication
   - Implement error handling

2. **Workflow Completion Storage (4h)**
   - Store completions in Human OS on workflow finish
   - Extract mentions for wiki linking
   - Create entities for new mentions

3. **Entity Sync (4h)**
   - Sync existing customers/contacts to Human OS entities
   - Map Renubu user IDs to Human OS user slugs
   - Handle tenant isolation

4. **Testing & Validation (4h)**
   - Integration tests
   - Performance validation (<500ms)
   - Error scenario testing

### Phase 3: Human OS Check-Ins (32h)

1. **Check-In UI (8h)**
   - Post-completion prompt
   - Success rating
   - What worked/different fields
   - Entity mention autocomplete

2. **Pattern Detection (8h)**
   - Graph queries for similar workflows
   - Backlink analysis for recommendations
   - Confidence scoring

3. **Recommendation Display (8h)**
   - "This worked for YOU before" cards
   - Workflow suggestions based on history
   - Entity relationship insights

4. **Testing & Refinement (8h)**
   - User testing with design partners
   - Performance optimization
   - Edge case handling

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture (Decision 5)
- [FEATURES.md](./FEATURES.md) - Human OS Check-Ins feature spec
- [MCP.md](./MCP.md) - MCP integration patterns
- Human OS Codebase: `../human-os/`

---

**Note:** This is a living document. Update as the integration evolves.
