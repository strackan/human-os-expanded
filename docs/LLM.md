# LLM - AI Strategy & Implementation

**Last Updated:** 2025-11-07
**Version:** 0.1
**Audience:** Internal (Engineers, AI Team, Product)

---

## Overview

This document describes Renubu's Large Language Model (LLM) strategy, including model selection, chaining principles, agentification approach, and future roadmap.

---

## Current LLM Setup

### Provider
**Anthropic Claude** (via Claude Code + Anthropic API)

### Models in Use

#### Claude Sonnet 4.5
- **Model ID:** `claude-sonnet-4-5-20250929`
- **Use Cases:** General-purpose development, complex reasoning, workflow design
- **Strengths:** Balanced speed/quality, strong coding ability
- **Cost:** $$
- **When to Use:** Default for most tasks

#### Claude Haiku (Future)
- **Model ID:** TBD
- **Use Cases:** Simple tasks, fast responses, high-volume operations
- **Strengths:** Very fast, low cost
- **Cost:** $
- **When to Use:** Task status updates, simple queries, high-frequency operations

#### Claude Opus (Future)
- **Model ID:** TBD
- **Use Cases:** Complex reasoning, strategic decisions, difficult bugs
- **Strengths:** Highest capability
- **Cost:** $$$
- **When to Use:** Rare, only when Sonnet fails or task requires deep reasoning

---

## Model Selection Strategy

### Task Complexity Matrix

**Simple Tasks → Haiku:**
- Update task status
- List workflows
- Format data
- Template filling

**Medium Tasks → Sonnet:**
- Code implementation
- API integration
- Workflow design
- Bug fixing (standard)

**Complex Tasks → Opus:**
- Architecture design
- Complex debugging
- Strategic planning
- Novel algorithm development

### Selection Logic
```typescript
function selectModel(task: Task): Model {
  if (task.requiresReasoning && task.complexity > 8) {
    return 'claude-opus';
  }
  if (task.isHighVolume || task.latencyTarget < 2000) {
    return 'claude-haiku';
  }
  return 'claude-sonnet'; // Default
}
```

---

## Chaining Principles

### Sequential Chaining
**Pattern:** Task A → Task B → Task C
**Use Case:** Dependent tasks (output of A needed for B)

**Example:**
```
1. Research component (Sonnet)
2. Design architecture (Sonnet)
3. Implement code (Sonnet)
4. Write tests (Haiku)
```

### Parallel Chaining
**Pattern:** [Task A, Task B, Task C] → Merge
**Use Case:** Independent tasks that can run simultaneously

**Example:** Phase 0.2 Agentification
```
Agent 1: Database constants (parallel)
Agent 2: Status enums (parallel)
Agent 3: API routes (parallel)
    ↓
Merge results
```

### Map-Reduce Pattern
**Pattern:** Split → [Process A, Process B, ...] → Combine
**Use Case:** Large tasks that can be divided

**Example:**
```
Split: 50 files to migrate
Map: 5 agents × 10 files each (parallel)
Reduce: Combine results, verify consistency
```

---

## Agentification Strategy

### Proven Approach (Phase 0.2)

**Architecture:**
```
Human (User)
    ↓
Queen Bee Agent (Claude - you)
    ↓
├─ Worker Agent 1 (git worktree, independent branch)
├─ Worker Agent 2 (git worktree, independent branch)
└─ Worker Agent 3 (git worktree, independent branch)
    ↓
Queen Bee merges results
```

**Key Components:**

1. **Git Worktrees** - Perfect isolation during agent work
2. **Task Decomposition** - Clear boundaries, no coordination needed
3. **Parallel Execution** - All agents work simultaneously
4. **Sequential Merging** - Queen Bee merges one at a time
5. **Conflict Resolution** - Queen Bee resolves (proven 7.7% conflict rate)

**Velocity Gains:**
- Phase 0.2: 45 minutes vs 24-35 hours traditional (32-47x with agents)
- Expected Phase 1: 2-3x human-equivalent throughput
- With MCP: 3x more agents (10 vs 3) = potential 3-10x total

### Communication Protocol

**Agent Update Format:**
```
Agent N: [Status] [Task] [Progress]

Examples:
Agent 1: ✅ Complete - Database constants - 8 files migrated
Agent 2: 🔄 In Progress - Status enums - 5/11 files complete
Agent 3: ⏸️ Blocked - API routes - Waiting for Agent 1 merge
```

**Queen Bee Coordination:**
- Assign clear, independent tasks
- Monitor progress
- Merge sequentially (one at a time)
- Resolve conflicts
- Verify TypeScript compilation after each merge

---

## Claude Code Integration

### Current Setup
- **IDE:** Claude Code (official Anthropic CLI)
- **Model:** Claude Sonnet 4.5
- **Context:** Full codebase access
- **Tools:** File operations, bash commands, web search, task management

### Skills System
Renubu leverages Claude Code skills for specialized workflows:
- Systematic debugging
- Test-driven development
- Code review
- Feature planning

See `.claude/skills/` for active skills.

---

## Anthropic API Usage

### Direct API Calls (Future)
For runtime AI features (not development):

**Use Cases:**
- Workflow AI assistance (in-app)
- Smart suggestions
- Content generation
- Pattern analysis (Phase 3: Human OS Check-Ins)

**Implementation Pattern:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'Analyze this renewal risk...' }
  ],
});
```

---

## Future LLM Roadmap

### Phase 1 (Q4 2025)
- MCP integration for 10x agent parallelization
- Deno sandbox for safe code execution
- Token usage optimization (90%+ reduction)

### Phase 2-3 (Q1 2026)
- In-app AI features (workflow assistance)
- Pattern recognition (Human OS Check-Ins)
- Learning loop foundation

### Post-Q1 2026
- Fine-tuned models for Renubu-specific tasks?
- Multi-model strategy (Anthropic + others)
- Agent-to-agent communication
- Autonomous workflow execution

---

## Custom Models

### Current Status
**No custom models** - Using Anthropic's pre-trained Claude models

### Future Consideration
**When to consider fine-tuning:**
- Repetitive, domain-specific tasks
- Performance ceiling with pre-trained models
- Cost optimization for high-volume operations
- Specific Renubu terminology/patterns

**Blockers for now:**
- Not enough training data
- Pre-trained models perform well
- Fine-tuning cost/complexity not justified

---

## Prompt Engineering Best Practices

### For Agents (Development)

**Good Prompts:**
- Clear, specific task definitions
- Expected output format specified
- Success criteria defined
- Context provided (but not excessive)

**Example:**
```
Task: Implement listSnoozedWorkflows MCP operation

Requirements:
1. Query workflow_executions table where status = 'snoozed'
2. Return array of workflow summaries (id, name, snoozed_until)
3. Enforce RLS (user can only see own workflows)
4. TypeScript types from existing patterns

Success Criteria:
- Compiles without errors
- Returns correct data structure
- RLS enforced via Supabase client
```

### For In-App AI (Future)

**User-Facing Prompts:**
- Conversational tone
- Business context (not technical)
- Actionable outputs

**System Prompts:**
- Role definition: "You are a customer success expert..."
- Constraints: "Only suggest actions available in Renubu..."
- Format: "Return structured JSON for UI rendering..."

---

## Monitoring & Optimization

### Current Tracking
- Agent execution time (manual)
- Merge conflict rate (7.7% in Phase 0.2)
- TypeScript compilation success rate (100% in Phase 0.2)

### Planned Metrics (Phase 1+)
- Token usage per operation (target: 90%+ reduction)
- Agent parallelization count (target: 10 simultaneous)
- Task completion velocity (hours saved)
- Error rate by model/task type

### Cost Management
- Development (Claude Code): Included in Anthropic subscription
- Production API calls: Monitor usage, set budgets
- Model selection optimization (use Haiku when possible)

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [MCP.md](./MCP.md) - MCP integration
- [DEV-GUIDE.md](./DEV-GUIDE.md) - Development guide with agent instructions
- [WORKFLOWS.md](./WORKFLOWS.md) - Workflow system

---

**Note:** This is a living document. Update as AI strategy evolves.