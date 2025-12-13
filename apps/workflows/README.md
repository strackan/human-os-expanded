# Human OS Workflows

FastMCP server with Prefect orchestration for scheduled and escalating workflows.

## Features

### MCP Tools

| Tool | Description |
|------|-------------|
| `get_urgent_tasks` | Get tasks needing attention, ordered by urgency |
| `add_task` | Add a new task with due date and assignee |
| `complete_task` | Mark a task as completed |
| `list_all_tasks` | List all tasks with a given status |
| `run_weekly_review` | Trigger the weekly review workflow |
| `run_escalation_check` | Manually trigger urgency escalation check |

### Prefect Workflows

| Flow | Schedule | Description |
|------|----------|-------------|
| `task-escalation-check` | Daily | Updates urgency levels, records escalations |
| `weekly-review` | Weekly | Guided review with human-in-the-loop |

## Urgency Escalation Model

```
Days Until Due    │ Urgency Level    │ Behavior
──────────────────┼──────────────────┼─────────────────────────────
> 7 days          │ normal           │ Listed in tasks
3-7 days          │ upcoming         │ Mentioned in session context
1-2 days          │ urgent           │ Prominent warning at session start
Due today         │ critical         │ BLOCKS other work, first thing Claude says
Overdue           │ overdue          │ Escalates to support person notification
```

## Setup

### 1. Install dependencies

```bash
cd apps/workflows
pip install -e .
# or
pip install -r requirements.txt
```

### 2. Set environment variables

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# For Prefect Cloud (optional)
export PREFECT_API_URL="https://api.prefect.cloud/api/accounts/{account_id}/workspaces/{workspace_id}"
export PREFECT_API_KEY="your-prefect-api-key"
```

### 3. Run the MCP server

```bash
# Direct run
python server.py

# Or via FastMCP
fastmcp run server.py
```

### 4. Configure Claude Desktop

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "human-os-workflows": {
      "command": "python",
      "args": ["-m", "fastmcp", "run", "/path/to/apps/workflows/server.py"],
      "env": {
        "SUPABASE_URL": "...",
        "SUPABASE_SERVICE_ROLE_KEY": "..."
      }
    }
  }
}
```

## Usage Examples

### Adding a task with escalation

```
You: "Lisa needs to submit the renewal notice by May 30th"

Claude uses: add_task(
  title="Submit renewal notice",
  due_date="2025-05-30",
  assignee_name="Lisa"
)
```

### Checking urgent tasks

```
You: "What's urgent right now?"

Claude uses: get_urgent_tasks()

Response: "🚨 1 OVERDUE task: The renewal notice was due 2 days ago and Lisa STILL hasn't completed it"
```

### Weekly review

```
You: "Let's do my weekly review"

Claude uses: run_weekly_review()

[Guided conversation about wins, challenges, and next week's priorities]
```

## Scheduling with Prefect

To run the escalation check on a schedule:

```python
from prefect import serve
from server import task_escalation_check

if __name__ == "__main__":
    task_escalation_check.serve(
        name="daily-escalation-check",
        cron="0 8 * * *",  # Every day at 8am
    )
```

Or deploy to Prefect Cloud for managed scheduling.
