# Renubu MCP Server

Model Context Protocol server for Renubu workflow operations.

## Purpose

Provides 8 core operations for AI agents to interact with Renubu workflows, tasks, and check-ins. Designed for token efficiency and progressive disclosure.

## Operations

### Workflow Operations

1. **listSnoozedWorkflows** - List all snoozed workflows (minimal data)
2. **getWorkflowDetails** - Get full workflow with tasks and actions (verbose)
3. **snoozeWorkflow** - Snooze workflow until date/condition
4. **wakeWorkflow** - Wake snoozed workflow back to active

### Task Operations

5. **listTasks** - List tasks with filtering (status, customer, due date)
6. **updateTaskStatus** - Update task status with notes

### Check-In Operations

7. **createWorkflowExecution** - Start new workflow
8. **logCheckIn** - Record Human OS check-in (what worked, what didn't)

## Configuration

### Environment Variables

Required:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

### MCP Configuration

Add to `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "renubu": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "servers/renubu",
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

## Development

### Build

```bash
npm run build
```

### Run in Development

```bash
npm run dev
```

### Test Connection

```bash
npm start
```

The server communicates via stdio (standard input/output).

## Architecture

- **Progressive Disclosure**: List operations return minimal data, detail operations return full data
- **Token Efficiency**: Designed to minimize token usage for AI agents
- **Type Safety**: Full TypeScript type definitions
- **Error Handling**: All operations include proper error handling

## Security

- Uses Supabase Row Level Security (RLS)
- Anonymous key only (user context via RLS)
- All operations filtered by user ID
- No direct database access exposed

## Future

Phase 0.2 will add:
- Google Calendar operations
- Slack operations
- Email operations
- Pattern detection for Human OS

## Related Documentation

- [docs/MCP.md](../../docs/MCP.md) - MCP architecture and strategy
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - System architecture
