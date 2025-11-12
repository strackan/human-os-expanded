# MCP - Model Context Protocol Integration

**Last Updated:** 2025-11-07
**Version:** 0.1
**Audience:** Internal (Engineers, AI Team)

---

## Overview

This document describes Renubu's Model Context Protocol (MCP) architecture, server registry, security model, and integration strategy.

**What is MCP?**
The Model Context Protocol enables AI agents to interact with Renubu's operations through a standardized interface, reducing token usage by 90%+ and enabling 10+ parallel agents.

---

## Architecture Decisions

### Decision: Walled Garden (Marketplace-Only)

**Approved:** November 7, 2025
**Rationale:**
- Renubu is a **hub platform with privileged access** (different threat model than local-only tools like Claude Desktop)
- Custom MCP servers = high malicious actor risk
- Users will blame us regardless of warnings
- Security > flexibility in Phase 0-1

**Policy:**
- ✅ **Renubu marketplace servers ONLY** (pre-vetted, tested)
- ❌ **NO custom user-added MCP servers** (not now, not Phase 0.2, not Phase 0.3)
- 🔮 **Custom servers = future feature** (backlog, post-Q1 2026)

---

## MCP Server Registry

### Internal Server: Renubu Operations

**Status:** Active (Phase 0.1)
**Location:** `servers/renubu/`
**Technology:** TypeScript SDK (@modelcontextprotocol/sdk)
**Operations:** 8 core operations (workflows, tasks, check-ins)

**Configuration:**
```json
// .claude/mcp.json
{
  "mcpServers": {
    "renubu": {
      "command": "node",
      "args": ["servers/renubu/dist/index.js"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
      }
    }
  }
}
```

### External Servers (Planned)

**Phase 0.2:** MCP registry infrastructure
**Phase 0.3:** Marketplace expansion

**Must-Have Servers (Phase 1):**
- Google Email (Gmail API)
- Google Calendar
- Slack

**Nice-to-Have Servers:**
- HubSpot
- Salesforce
- Notion
- Airtable
- Pendo
- Microsoft Teams / Outlook
- Google Chat
- Gainsight

**Explicitly Excluded:**
- ❌ GitHub (source code = security risk, no business case)
- ❌ Custom user URLs (malicious server risk)

---

## Renubu MCP Operations

### Workflow Operations

#### `listSnoozedWorkflows(userId: string)`
**Purpose:** Get all snoozed workflows for user
**Returns:** Array of workflow summaries
**Security:** RLS-enforced (user's workflows only)

#### `getWorkflowDetails(workflowId: string)`
**Purpose:** Get full workflow details including tasks and history
**Returns:** Complete workflow object
**Security:** RLS-enforced

#### `snoozeWorkflow(workflowId: string, until: Date, condition?: string)`
**Purpose:** Snooze workflow until date or condition
**Returns:** Success confirmation
**Security:** Owner-only

#### `wakeWorkflow(workflowId: string)`
**Purpose:** Wake snoozed workflow manually
**Returns:** Success confirmation
**Security:** Owner-only

### Task Operations

#### `listTasks(userId: string, filters?: TaskFilters)`
**Purpose:** Get tasks with optional filters (status, assigned_to, etc.)
**Returns:** Array of tasks
**Security:** RLS-enforced

#### `updateTaskStatus(taskId: string, status: TaskStatus)`
**Purpose:** Update task status
**Returns:** Updated task
**Security:** Assignee or admin only

### Check-In Operations (Phase 3)

#### `createWorkflowExecution(userId: string, data: CreateWorkflowInput)`
**Purpose:** Create new workflow execution
**Returns:** New execution ID
**Security:** User must be authenticated

#### `logCheckIn(workflowId: string, outcome: CheckInData)`
**Purpose:** Log completion check-in for learning loop
**Returns:** Success confirmation
**Security:** Workflow owner only

### Google Calendar Operations (Phase 0.2)

#### `calendar.listEvents(userId: string, startDate?, endDate?, maxResults?)`
**Purpose:** List calendar events for a date range
**Returns:** Array of calendar events with times, attendees, locations
**Security:** User's calendar only (RLS-enforced)

#### `calendar.createEvent(userId: string, event: CalendarEvent)`
**Purpose:** Create a new calendar event with title, time, attendees
**Returns:** Created event object with event ID
**Security:** User's calendar only

#### `calendar.updateEvent(userId: string, eventId: string, updates: Partial<CalendarEvent>)`
**Purpose:** Update an existing calendar event (time, title, attendees)
**Returns:** Updated event object
**Security:** User's events only

#### `calendar.deleteEvent(userId: string, eventId: string)`
**Purpose:** Delete a calendar event
**Returns:** Success confirmation
**Security:** User's events only

#### `calendar.findNextOpening(userId: string, durationMinutes: number, afterDate: string, options?)`
**Purpose:** Find next available time slot(s) in calendar
**Algorithm:**
1. Fetch calendar events for next 7 days
2. Build "busy slots" array from events
3. Iterate through business hours in 15-min increments
4. Find slots where [slot_start, slot_start + duration] has no overlap
5. Return requested number of available slots

**Options:**
- `workingHours`: `{start: "09:00", end: "17:00"}` (default)
- `businessDaysOnly`: `true` (skip weekends)
- `returnMultipleOptions`: Number of slots to return (default: 1)

**Returns:** Array of time slots `[{start: ISO8601, end: ISO8601}]`
**Security:** User's calendar only

**Example:**
```typescript
// Find next 3 available 30-minute slots after 2pm
await calendar.findNextOpening(userId, 30, '2025-11-12T14:00:00Z', {
  returnMultipleOptions: 3
});
// Returns: [
//   { start: '2025-11-12T15:30:00Z', end: '2025-11-12T16:00:00Z' },
//   { start: '2025-11-13T09:00:00Z', end: '2025-11-13T09:30:00Z' },
//   { start: '2025-11-13T11:00:00Z', end: '2025-11-13T11:30:00Z' }
// ]
```

#### `calendar.getUpcomingEvents(userId: string, count?)`
**Purpose:** Get upcoming events starting from now
**Returns:** Next N events (default: 5)
**Security:** User's calendar only

### Gmail Operations (Phase 0.2)

#### `gmail.sendEmail(userId: string, params: SendEmailParams)`
**Purpose:** Send an email via Gmail
**Params:** `{to, subject, body, cc?, bcc?, replyTo?, html?}`
**Returns:** Sent message object with message ID
**Security:** User's Gmail account only

#### `gmail.listMessages(userId: string, query?, maxResults?)`
**Purpose:** List/search Gmail messages
**Query:** Gmail search syntax (e.g., `"is:unread"`, `"from:user@example.com"`)
**Returns:** Array of message summaries
**Security:** User's Gmail only

#### `gmail.getMessage(userId: string, messageId: string, format?)`
**Purpose:** Get full details of a specific email message
**Format:** `full`, `metadata`, `minimal`, or `raw` (default: `full`)
**Returns:** Complete message object with headers, body, attachments
**Security:** User's messages only

#### `gmail.getUnreadCount(userId: string)`
**Purpose:** Get count of unread emails in inbox
**Returns:** `{count: number}`
**Security:** User's Gmail only

#### `gmail.markAsRead(userId: string, messageId: string)`
**Purpose:** Mark an email message as read
**Returns:** Updated message object
**Security:** User's messages only

#### `gmail.markAsUnread(userId: string, messageId: string)`
**Purpose:** Mark an email message as unread
**Returns:** Updated message object
**Security:** User's messages only

#### `gmail.getProfile(userId: string)`
**Purpose:** Get Gmail account profile information
**Returns:** `{emailAddress, messagesTotal, threadsTotal}`
**Security:** User's account only

### Slack Operations (Phase 0.2)

#### `slack.postMessage(userId: string, message: SlackMessage)`
**Purpose:** Post a message to a Slack channel
**Message:** `{channel, text, blocks?, thread_ts?, username?, icon_emoji?}`
**Returns:** `{ts: timestamp, channel: channelId}` for message reference
**Security:** User's connected workspace only

#### `slack.updateMessage(userId: string, channel: string, ts: string, text: string, blocks?)`
**Purpose:** Update an existing Slack message
**Returns:** Success confirmation
**Security:** User's messages only

#### `slack.deleteMessage(userId: string, channel: string, ts: string)`
**Purpose:** Delete a Slack message
**Returns:** Success confirmation
**Security:** User's messages only

#### `slack.listChannels(userId: string, types?, limit?)`
**Purpose:** List channels in the Slack workspace
**Types:** `'public_channel,private_channel'` (default)
**Returns:** Array of channel objects with names and IDs
**Security:** User's workspace only

#### `slack.getChannelInfo(userId: string, channel: string)`
**Purpose:** Get detailed information about a specific Slack channel
**Returns:** Channel object with metadata
**Security:** User's workspace only

#### `slack.sendDirectMessage(userId: string, slackUserId: string, text: string)`
**Purpose:** Send a direct message (DM) to a Slack user
**Returns:** `{ts, channel}` for message reference
**Security:** User's workspace only

#### `slack.listUsers(userId: string, limit?)`
**Purpose:** List users in the Slack workspace
**Returns:** Array of user objects with names, emails, profiles
**Security:** User's workspace only

#### `slack.getUserInfo(userId: string, slackUserId: string)`
**Purpose:** Get detailed information about a specific Slack user
**Returns:** User object with profile details
**Security:** User's workspace only

#### `slack.addReaction(userId: string, channel: string, timestamp: string, emoji: string)`
**Purpose:** Add an emoji reaction to a Slack message
**Emoji:** Name without colons (e.g., `"thumbsup"`, `"rocket"`)
**Returns:** Success confirmation
**Security:** User's workspace only

#### `slack.getWorkspaceInfo(userId: string)`
**Purpose:** Get information about the connected Slack workspace
**Returns:** `{user_id, team_id, team, url}`
**Security:** User's connected workspace only

---

## Security Model

### Permission Boundaries

**✅ ALLOWED - Read Operations (Renubu Data):**
- List/get workflows (own data, RLS)
- List/get tasks (own data, RLS)
- Query execution history (own data)

**✅ ALLOWED - Write Operations (Renubu Data):**
- Create workflow executions
- Snooze/wake workflows (own workflows only)
- Update task status (assigned tasks only)
- Log check-ins (own workflows only)

**✅ ALLOWED - External Actions (With User Confirmation):**
- Send emails (user confirms)
- Create/update calendar events (user confirms)
- Update Salesforce (approved numbers: forecasted ARR, activities)

**❌ RESTRICTED - Customer CRUD:**
- ❌ Cannot create customers (not our system of record)
- ❌ Cannot delete customers
- ❌ Cannot modify customer core data
- ✅ CAN read customer data (view-only)

**❌ DENIED - Dangerous Operations:**
- Delete workflows (destructive)
- Execute arbitrary SQL
- Modify RLS policies
- Access other users' data
- Direct schema changes

### Deno Sandbox

**Execution Environment:**
```bash
deno run \
  --allow-net=your-supabase-url \
  --allow-env=SUPABASE_URL,SUPABASE_ANON_KEY \
  --no-allow-read \
  --no-allow-write \
  --no-allow-run \
  code.ts
```

**Security Properties:**
- ✅ Network access to Supabase only
- ✅ Environment variables allowed
- ❌ No filesystem reads/writes
- ❌ No subprocess execution
- ✅ Timeout enforcement (30s max)

**Threat Model:**
- **Protected Against:** Accidental mistakes, runaway processes
- **NOT Protected Against:** Sophisticated attacks (but audited)
- **Real Protection:** Queen Bee code review + dry-run mode + audit logs

---

## Token Reduction Strategy

### Before MCP (150K tokens)
```
Agent receives:
- Full codebase context
- Complete database schema
- All service implementations
- Historical data

Total: ~150,000 tokens per task
```

### After MCP (15K tokens)
```
Agent writes:
await listSnoozedWorkflows(userId)

MCP returns:
[{ id: '123', name: 'Renewal prep', ... }]

Total: ~15,000 tokens per task
90%+ reduction
```

### Progressive Disclosure
- Agent sees list of available operations (minimal tokens)
- Agent calls specific operation (only returns needed data)
- Agent requests details on demand (not upfront)

**Result:** 10 agents working simultaneously (vs 3 before)

---

## Marketplace Architecture (Phase 0.2+)

### Database Schema

**Implementation:** See `20251112000000_mcp_registry_infrastructure.sql`

#### Table: `mcp_integrations`
Registry of available marketplace integrations (Google Calendar, Slack, Gmail, etc.)

```sql
CREATE TABLE mcp_integrations (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,            -- 'google-calendar', 'slack'
  name TEXT NOT NULL,                   -- 'Google Calendar'
  category TEXT NOT NULL,               -- 'calendar', 'communication', 'email'
  connection_type TEXT NOT NULL,        -- 'oauth2', 'api_key', 'webhook'
  oauth_provider TEXT,                  -- 'google', 'slack'
  oauth_scopes TEXT[],                  -- Required OAuth scopes
  status TEXT DEFAULT 'disabled',       -- 'disabled', 'enabled', 'deprecated'
  approval_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
```

#### Table: `user_integrations`
Tracks which users have which integrations installed

```sql
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  integration_id UUID REFERENCES mcp_integrations(id),
  status TEXT DEFAULT 'pending',        -- 'pending', 'active', 'error', 'revoked'
  installed_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  config JSONB,                         -- User-specific config
  error_message TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
```

#### Table: `oauth_tokens`
Encrypted storage for OAuth tokens (AES-256 via pgcrypto)

```sql
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY,
  user_integration_id UUID REFERENCES user_integrations(id),
  user_id UUID REFERENCES auth.users(id),
  access_token_encrypted BYTEA NOT NULL,
  refresh_token_encrypted BYTEA,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
```

**Security:**
- All tokens encrypted at rest using `pgp_sym_encrypt()`
- Helper functions: `encrypt_oauth_token()`, `decrypt_oauth_token()`
- RLS policies ensure users only access their own tokens
- Encryption key stored in environment variables (never in database)

### Admin Approval Workflow
```
Renubu adds Slack to marketplace (via migration)
    ↓
Auto-appears in mcp_integrations table
    ↓
Status: DISABLED (default, approval_required=true)
    ↓
Admin reviews capabilities in Admin UI
    ↓
Admin sets status='enabled' → Available to all users
    ↓
Users can install via marketplace
    ↓
OAuth flow stores encrypted tokens in oauth_tokens
    ↓
Admin can set status='disabled' anytime
```

### Server Tiers (Future)

**Tier 1: Renubu Marketplace (Verified ✅)**
- Pre-vetted by Renubu team
- Published by known vendors
- Auto-add as DISABLED
- Admin enables with one click

**Tier 2: Community Marketplace (Reviewed 🔍)**
- Phase 0.3+
- Published by third parties
- Renubu reviews but doesn't maintain

**Tier 3: Custom Servers (⚠️)**
- Post-Q1 2026
- User provides URL
- Heavy security warnings
- Restricted permissions

---

## Integration Testing

### Test MCP Server
```bash
# Build server
cd servers/renubu
npm run build

# Test server discovery
npx @modelcontextprotocol/inspector servers/renubu/dist/index.js

# Test operation
node -e "
const { createMCPClient } = require('@modelcontextprotocol/sdk');
const client = createMCPClient({ ... });
const result = await client.callTool('listSnoozedWorkflows', { userId: '...' });
console.log(result);
"
```

### Benchmark Token Usage
```typescript
// Measure before/after
const beforeTokens = countTokens(fullContext);
const afterTokens = countTokens(mcpResponse);
const reduction = ((beforeTokens - afterTokens) / beforeTokens) * 100;
console.log(`Token reduction: ${reduction.toFixed(1)}%`);
```

---

## Phase Roadmap

### Phase 0.1 (This Week) ✅
- Internal Renubu MCP server only
- 8 core operations
- TypeScript SDK + Deno sandbox
- Walled garden security model

### Phase 0.2 (Complete) ✅
- ✅ MCP registry tables (`mcp_integrations`, `user_integrations`, `oauth_tokens`)
- ✅ OAuth token encryption (pgcrypto)
- ✅ RLS policies for multi-tenant security
- ✅ OAuth flow implementation (authorization + callback routes)
- ✅ Google Calendar MCP operations (6 operations)
- ✅ Gmail MCP operations (7 operations)
- ✅ Slack MCP operations (10 operations)
- ⏳ Admin UI for enable/disable (future)

### Phase 0.3 (Before Phase 1)
- Marketplace expansion (HubSpot, Salesforce, Notion, etc.)
- Admin approval workflow
- Usage analytics

### Post-Q1 2026
- Custom server support (Tier 3)
- Auto-registration protocol
- Advanced sandboxing

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API.md](./API.md) - API reference
- [LLM.md](./LLM.md) - AI strategy
- [SCHEMA.md](./SCHEMA.md) - Database schema

---

**Note:** This is a living document. Update as MCP architecture evolves.
