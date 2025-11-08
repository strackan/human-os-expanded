# API - Renubu API Reference

**Last Updated:** 2025-11-07
**Version:** 0.1
**Audience:** Internal (Engineers)

---

## Overview

This document catalogs all API endpoints, authentication methods, request/response formats, and rate limiting policies.

---

## API Architecture

### Technology
- **Framework:** Next.js API Routes + Server Actions
- **Location:** `app/api/` for REST endpoints
- **Authentication:** Supabase Auth (JWT in cookies)
- **Authorization:** RLS policies + service-level checks

### Base URL
- **Development:** `http://localhost:3000`
- **Production:** `https://app.renubu.com`

---

## Authentication

### Session-Based Auth
```typescript
// Headers automatically include session cookie
// No manual Authorization header needed
```

### Getting Current User
```typescript
import { createServerClient } from '@/lib/supabase/server';

const supabase = createServerClient();
const { data: { user } } = await supabase.auth.getUser();
```

---

## API Endpoints

### Authentication

#### POST `/api/auth/signin`
**Purpose:** Sign in with email/password or OAuth
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "user": { "id": "...", "email": "..." },
  "session": { "access_token": "..." }
}
```

#### POST `/api/auth/signout`
**Purpose:** Sign out current user
**Response:** 204 No Content

### Customers

#### GET `/api/customers`
**Purpose:** List all customers for current user
**Query Params:**
- `search` - Filter by name
- `risk_min` - Minimum risk score (1-5)
- `renewal_before` - ISO date

**Response:**
```json
{
  "customers": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "arr": 50000,
      "renewal_date": "2025-12-31",
      "risk_score": 3
    }
  ]
}
```

#### GET `/api/customers/[id]`
**Purpose:** Get customer details
**Response:**
```json
{
  "customer": {
    "id": "uuid",
    "name": "Acme Corp",
    "arr": 50000,
    "contacts": [...],
    "workflows": [...]
  }
}
```

### Workflows

#### GET `/api/workflows/executions`
**Purpose:** List workflow executions
**Query Params:**
- `status` - Filter by status
- `customer_id` - Filter by customer

**Response:**
```json
{
  "executions": [
    {
      "id": "uuid",
      "workflow_type": "renewal",
      "status": "in_progress",
      "current_slide_index": 2
    }
  ]
}
```

#### POST `/api/workflows/executions`
**Purpose:** Create new workflow execution
**Request:**
```json
{
  "workflow_type": "renewal",
  "customer_id": "uuid",
  "context": { ... }
}
```

#### GET `/api/workflows/executions/[id]`
**Purpose:** Get workflow execution details
**Response:**
```json
{
  "execution": {
    "id": "uuid",
    "workflow_type": "renewal",
    "status": "in_progress",
    "slides": [...],
    "tasks": [...],
    "actions": [...]
  }
}
```

#### POST `/api/workflows/executions/[id]/advance`
**Purpose:** Move to next slide in workflow
**Request:**
```json
{
  "slide_data": { ... }
}
```

### Tasks

#### GET `/api/workflows/tasks`
**Purpose:** List tasks for current user
**Query Params:**
- `status` - pending, in_progress, completed
- `assigned_to` - User ID

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Review contract",
      "status": "pending",
      "due_date": "2025-11-15"
    }
  ]
}
```

#### PATCH `/api/workflows/tasks/[id]`
**Purpose:** Update task status or details
**Request:**
```json
{
  "status": "completed",
  "notes": "Reviewed and approved"
}
```

#### POST `/api/workflows/tasks/[id]/snooze`
**Purpose:** Snooze a task
**Request:**
```json
{
  "snoozed_until": "2025-11-20T09:00:00Z",
  "snooze_reason": "Waiting for customer response"
}
```

---

## Server Actions

### Workflow Actions

#### `advanceWorkflowSlide(executionId, slideData)`
**Location:** `app/(dashboard)/workflows/[id]/actions.ts`
**Purpose:** Server action to advance workflow
**Usage:**
```typescript
import { advanceWorkflowSlide } from './actions';

await advanceWorkflowSlide(executionId, {
  answers: { ... }
});
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": { ... }
  }
}
```

### Common Error Codes
- `UNAUTHENTICATED` - No valid session
- `UNAUTHORIZED` - Insufficient permissions
- `NOT_FOUND` - Resource doesn't exist
- `VALIDATION_ERROR` - Invalid input
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting

### Current Limits (Phase 0)
- No rate limiting implemented yet

### Planned Limits (Phase 1+)
- **Per User:** 100 req/min
- **Per IP:** 1000 req/hour
- **Burst:** 20 req/sec

---

## API Versioning

### Current Strategy
- No versioning (pre-1.0)
- Breaking changes allowed with migration plan

### Future Strategy (Post-1.0)
- URL-based versioning (`/api/v1/`, `/api/v2/`)
- Deprecation period: 6 months minimum

---

## MCP Operations (Phase 0.1+)

### Overview
MCP (Model Context Protocol) provides programmatic access to Renubu operations for AI agents.

See [MCP.md](./MCP.md) for complete MCP documentation.

**Core Operations:**
- `listSnoozedWorkflows(userId)`
- `getWorkflowDetails(workflowId)`
- `snoozeWorkflow(workflowId, until, condition)`
- `wakeWorkflow(workflowId)`
- `listTasks(userId, filters)`
- `updateTaskStatus(taskId, status)`

---

## Testing APIs

### Using curl
```bash
# Sign in
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# List customers (with session cookie)
curl http://localhost:3000/api/customers \
  -H "Cookie: sb-access-token=..."
```

### Using Postman
1. Import Postman collection: `postman/renubu-api.json` (TODO)
2. Set environment variables (base_url, auth_token)
3. Run requests

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [MCP.md](./MCP.md) - MCP operations
- [DEV-GUIDE.md](./DEV-GUIDE.md) - Development guide

---

**Note:** This is a living document. Update as APIs are added or changed.
