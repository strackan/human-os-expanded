# Phase 0.1: MCP Code Execution with Deno - Task Decomposition

**Dates:** Nov 13-15, 2025 (3 days)
**Total Hours:** 12h
**Goal:** Implement MCP code execution for 50-80% velocity boost (10 agents vs 3)

---

## Strategic Context

**Why This Matters:**
- **Token Reduction:** 90%+ reduction (150K → 15K tokens per task)
- **Agent Capacity:** 10 agents working simultaneously vs 3 before
- **Compounding Gains:** Every phase benefits from this infrastructure
- **Future-Proofing:** MCP is the future, build foundation now

**Success Criteria:**
- [ ] Agents write TypeScript code calling Renubu operations
- [ ] 90%+ token reduction measured (150K → 15K tokens)
- [ ] 10 agents can work simultaneously (vs 3 before)
- [ ] Deno permissions block unauthorized access
- [ ] Audit logs capture all operations
- [ ] Ready for Phase 1 with 3x agent capacity

---

## Day 1 (Nov 13): MCP Server Design - 4h

### Task 1.1: Research & Design (2h)

**Research Phase (1h):**
- [ ] Review MCP protocol specification
- [ ] Study existing MCP server examples
- [ ] Review Deno security model and permissions
- [ ] Research FastMCP vs native MCP SDK

**Design Decisions (1h):**
- [ ] Choose MCP implementation approach (FastMCP Python vs TypeScript SDK)
- [ ] Design server directory structure (`servers/renubu/`)
- [ ] Define operation categories:
  - Workflow operations (query, create, snooze, wake, evaluate)
  - Database operations (customers, profiles, tasks)
  - Calendar operations (findOpening, getEvents)
- [ ] Design TypeScript interfaces for all operations
- [ ] Plan progressive disclosure strategy (list operations → detail on demand)

**Deliverable:** `docs/phase-0.1-mcp-design.md` with architecture decisions

### Task 1.2: Project Structure Setup (2h)

**Directory Structure:**
```
servers/
  renubu/
    package.json           # MCP server dependencies
    tsconfig.json          # TypeScript config
    src/
      index.ts             # MCP server entry point
      types/               # TypeScript interfaces
      operations/
        workflows.ts       # Workflow operations
        database.ts        # Database queries
        calendar.ts        # Calendar operations
      utils/
        supabase.ts        # Supabase client wrapper
        validation.ts      # Input validation
        errors.ts          # Error handling
```

**Tasks:**
- [ ] Create `servers/renubu/` directory structure
- [ ] Initialize npm package with MCP dependencies
- [ ] Set up TypeScript configuration
- [ ] Create base type definitions for Renubu domain
- [ ] Set up Supabase client for server-side operations
- [ ] Create error handling utilities

**Deliverable:** Complete project structure with package.json and skeleton files

---

## Day 2 (Nov 14): Core Operations - 4h

### Task 2.1: Workflow Operations (2h)

**Implementation:**
```typescript
// servers/renubu/src/operations/workflows.ts

export async function listWorkflows(userId: string, filters?: {
  status?: WorkflowExecutionStatus;
  limit?: number;
}): Promise<WorkflowSummary[]>

export async function getWorkflow(
  workflowId: string
): Promise<WorkflowDetail>

export async function createWorkflow(
  userId: string,
  data: CreateWorkflowInput
): Promise<Workflow>

export async function snoozeWorkflow(
  workflowId: string,
  snoozedUntil: Date,
  condition?: string
): Promise<void>

export async function wakeWorkflow(
  workflowId: string
): Promise<void>

export async function evaluateConditions(
  userId: string
): Promise<WorkflowToWake[]>
```

**Tasks:**
- [ ] Implement `listWorkflows()` - Query workflow_executions with filters
- [ ] Implement `getWorkflow()` - Get full workflow details with tasks
- [ ] Implement `createWorkflow()` - Insert new workflow execution
- [ ] Implement `snoozeWorkflow()` - Update workflow with snooze date/condition
- [ ] Implement `wakeWorkflow()` - Wake workflow manually
- [ ] Implement `evaluateConditions()` - Check which workflows should wake
- [ ] Add input validation for all functions
- [ ] Add error handling with descriptive messages

**Deliverable:** `workflows.ts` with 6 operations, fully tested

### Task 2.2: Database Operations (1.5h)

**Implementation:**
```typescript
// servers/renubu/src/operations/database.ts

export async function listCustomers(
  userId: string,
  filters?: CustomerFilters
): Promise<CustomerSummary[]>

export async function getCustomer(
  customerId: string
): Promise<CustomerDetail>

export async function listTasks(
  userId: string,
  filters?: TaskFilters
): Promise<TaskSummary[]>

export async function updateTask(
  taskId: string,
  updates: TaskUpdates
): Promise<void>
```

**Tasks:**
- [ ] Implement `listCustomers()` - Query customers with filters (risk, renewal date, etc.)
- [ ] Implement `getCustomer()` - Get full customer details with relationships
- [ ] Implement `listTasks()` - Query workflow tasks with filters
- [ ] Implement `updateTask()` - Update task status, assignee, etc.
- [ ] Ensure all queries respect RLS (Row Level Security)
- [ ] Add proper error handling

**Deliverable:** `database.ts` with 4 core operations

### Task 2.3: MCP Server Entry Point (0.5h)

**Implementation:**
```typescript
// servers/renubu/src/index.ts

import { MCPServer } from '@modelcontextprotocol/sdk';
import * as workflows from './operations/workflows';
import * as database from './operations/database';

const server = new MCPServer({
  name: 'renubu',
  version: '1.0.0',
});

// Register workflow operations
server.tool('listWorkflows', workflows.listWorkflows);
server.tool('getWorkflow', workflows.getWorkflow);
server.tool('createWorkflow', workflows.createWorkflow);
server.tool('snoozeWorkflow', workflows.snoozeWorkflow);
server.tool('wakeWorkflow', workflows.wakeWorkflow);
server.tool('evaluateConditions', workflows.evaluateConditions);

// Register database operations
server.tool('listCustomers', database.listCustomers);
server.tool('getCustomer', database.getCustomer);
server.tool('listTasks', database.listTasks);
server.tool('updateTask', database.updateTask);

server.start();
```

**Tasks:**
- [ ] Set up MCP server instance
- [ ] Register all workflow operations as tools
- [ ] Register all database operations as tools
- [ ] Configure server with proper metadata
- [ ] Add startup logging

**Deliverable:** Working MCP server that exposes Renubu operations

---

## Day 3 (Nov 15): Deno Sandbox & Integration - 4h

### Task 3.1: Deno Execution Wrapper (2h)

**Implementation:**
```typescript
// src/lib/services/DenoExecutionService.ts

export class DenoExecutionService {
  async executeCode(
    code: string,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    // 1. Write code to temp file
    const tempFile = await this.writeTempFile(code);

    // 2. Execute with strict permissions
    const result = await this.runDeno(tempFile, {
      allowNet: true,        // For Supabase/MCP
      allowEnv: true,        // For env vars
      allowRead: false,      // No filesystem reads
      allowWrite: false,     // No filesystem writes
      allowRun: false,       // No subprocess execution
    });

    // 3. Clean up temp file
    await this.cleanupTempFile(tempFile);

    // 4. Log execution
    await this.logExecution(code, result, context);

    return result;
  }
}
```

**Tasks:**
- [ ] Create `DenoExecutionService.ts`
- [ ] Implement temp file creation (with unique IDs)
- [ ] Implement Deno execution with permission flags
- [ ] Implement temp file cleanup (always runs, even on error)
- [ ] Add timeout enforcement (max 30 seconds per execution)
- [ ] Add memory limit enforcement (if possible)
- [ ] Test permission denials (attempt filesystem, subprocess, etc.)

**Security Validation:**
- [ ] Test: Cannot read files outside allowed scope
- [ ] Test: Cannot write files to filesystem
- [ ] Test: Cannot execute subprocess commands
- [ ] Test: Can make network requests to Supabase
- [ ] Test: Can access environment variables
- [ ] Test: Timeout kills runaway processes

**Deliverable:** `DenoExecutionService.ts` with strict permission model

### Task 3.2: Audit Logging (1h)

**Implementation:**
```typescript
// Database table
CREATE TABLE code_execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  agent_id TEXT,
  code_hash TEXT,          -- SHA256 of executed code
  operation TEXT,          -- MCP operation called
  success BOOLEAN,
  error TEXT,
  execution_time_ms INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

// Service method
async logExecution(
  code: string,
  result: ExecutionResult,
  context: ExecutionContext
): Promise<void>
```

**Tasks:**
- [ ] Create migration for `code_execution_logs` table
- [ ] Implement audit logging in `DenoExecutionService`
- [ ] Log: code hash, operation, success/error, timing, tokens
- [ ] Create alerting for repeated errors (>5 failures in 10 min)
- [ ] Create dashboard query to view recent executions

**Deliverable:** Audit logging with error alerting

### Task 3.3: Claude Code Integration (1h)

**Configuration:**
```json
// .claude/mcp.json
{
  "servers": {
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

**Tasks:**
- [ ] Create `.claude/mcp.json` configuration
- [ ] Test MCP server discovery in Claude Code
- [ ] Test progressive disclosure (list tools → see details on demand)
- [ ] Benchmark token usage: before (150K) vs after (15K)
- [ ] Test parallel agent execution (can 10 agents work simultaneously?)
- [ ] Create example agent prompts that use MCP operations

**Token Reduction Test:**
```typescript
// BEFORE MCP (150K tokens):
// Agent receives entire codebase context + all database schema

// AFTER MCP (15K tokens):
// Agent writes: await listWorkflows(userId, { status: 'snoozed' })
// MCP returns: [{ id: '123', name: 'Renewal prep', ... }]
// 90%+ token reduction
```

**Deliverable:** Working Claude Code + MCP integration with measured token savings

---

## Success Criteria Validation

### Pre-Launch Checklist

**Functionality:**
- [ ] All 10+ MCP operations working
- [ ] Deno execution wrapper functional
- [ ] Permissions correctly restricted
- [ ] Audit logging capturing all operations
- [ ] Error handling comprehensive

**Performance:**
- [ ] Token usage: 90%+ reduction measured
- [ ] Can run 10 agents simultaneously
- [ ] Execution time: <1 second per operation
- [ ] No memory leaks in long-running agents

**Security:**
- [ ] Filesystem access blocked
- [ ] Subprocess execution blocked
- [ ] Network access limited to Supabase
- [ ] Audit logs capture suspicious activity
- [ ] Timeouts prevent runaway processes

**Documentation:**
- [ ] MCP server API documented
- [ ] Agent usage guide created
- [ ] Security model documented
- [ ] Troubleshooting guide created

---

## Risk Mitigation

### Risk 1: Deno Permission Escapes
**Mitigation:**
- Use production-grade Deno (used by Netlify, Supabase, Slack)
- Explicit allow-list permissions only
- Queen Bee code review all agent output
- Dry-run mode before actual execution

### Risk 2: Token Savings Don't Materialize
**Mitigation:**
- Benchmark early (Day 3, hour 1)
- If <70% reduction, investigate causes
- May need to refine operation design

### Risk 3: MCP Server Complexity
**Mitigation:**
- Start with 4-5 core operations
- Expand gradually based on need
- Phase 1 doesn't require 100% coverage

### Risk 4: Integration Breaks Existing Workflow
**Mitigation:**
- MCP is additive (doesn't replace existing tools)
- Can fall back to direct tool use
- Test in isolated environment first

---

## Phase 0.1 Deliverables

### Code
- [ ] `servers/renubu/` - Complete MCP server
- [ ] `src/lib/services/DenoExecutionService.ts` - Deno wrapper
- [ ] `.claude/mcp.json` - Claude Code configuration
- [ ] `supabase/migrations/YYYYMMDDHHMMSS_code_execution_logs.sql` - Audit table

### Documentation
- [ ] `docs/phase-0.1-mcp-design.md` - Architecture and design decisions
- [ ] `docs/phase-0.1-agent-guide.md` - How agents use MCP operations
- [ ] `docs/phase-0.1-results.md` - Token benchmarks and learnings

### Validation
- [ ] Token reduction benchmark (target: 90%+)
- [ ] Security validation tests passed
- [ ] 10-agent parallel execution test
- [ ] Phase 1 readiness confirmed

---

## Next Steps After Phase 0.1

**Immediate (Nov 16-24):**
- CS Product work (20h continues in parallel)
- Refine MCP operations based on early usage
- Add more operations as needed for Phase 1

**Phase 1 (Nov 25-Dec 20):**
- Use MCP to power 10-agent parallel execution
- Workflow Snoozing implementation with 3x agent boost
- Continuous refinement of MCP server

---

**Document Status:** Planning document
**Created:** Nov 7, 2025
**For Phase:** 0.1 (Nov 13-15)
**Expected Velocity:** 3x throughput (10 agents vs 3)
