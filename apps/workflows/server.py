"""
Human OS Workflows - FastMCP Server with Prefect Orchestration

This server provides:
- Weekly review workflow (scheduled, human-in-the-loop)
- Task escalation workflow (scheduled, monitors due dates)
- MCP tools to trigger workflows and check task status
"""

import os
from datetime import datetime, date, timedelta
from typing import Optional
from fastmcp import FastMCP
from prefect import flow, task
from prefect.states import Completed, Failed
from supabase import create_client, Client

# Initialize FastMCP server
mcp = FastMCP(
    "human-os-workflows",
    instructions="""
    Human OS Workflows server. Use these tools to:
    - Check urgent tasks and their escalation status
    - Add new tasks with due dates
    - Run the weekly review workflow
    - Mark tasks complete

    IMPORTANT: When session starts, check get_urgent_tasks to see if anything needs attention.
    If there are critical or overdue tasks, mention them FIRST before anything else.
    """
)

# Supabase client
def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required")
    return create_client(url, key)


# =============================================================================
# MCP TOOLS
# =============================================================================

@mcp.tool()
async def get_urgent_tasks(include_upcoming: bool = True) -> dict:
    """
    Get tasks that need attention, ordered by urgency.

    Returns tasks that are:
    - overdue (past due date)
    - critical (due today)
    - urgent (due in 1-2 days)
    - upcoming (due in 3-7 days, if include_upcoming=True)

    IMPORTANT: If any tasks are 'critical' or 'overdue',
    tell Justin about them IMMEDIATELY at session start.
    """
    supabase = get_supabase()

    result = supabase.rpc(
        'get_urgent_tasks',
        {'p_include_upcoming': include_upcoming}
    ).execute()

    tasks = result.data or []

    # Build summary
    summary = {
        'overdue': [],
        'critical': [],
        'urgent': [],
        'upcoming': [],
    }

    for t in tasks:
        urgency = t.get('urgency', 'normal')
        if urgency in summary:
            summary[urgency].append({
                'id': t['id'],
                'title': t['title'],
                'assignee': t.get('assignee_name', 'You'),
                'due_date': t.get('due_date'),
                'days_until_due': t.get('days_until_due'),
                'message': t.get('escalation_message'),
            })

    # Generate attention message
    attention_needed = []
    if summary['overdue']:
        attention_needed.append(f"🚨 {len(summary['overdue'])} OVERDUE task(s)")
    if summary['critical']:
        attention_needed.append(f"⚠️ {len(summary['critical'])} task(s) due TODAY")
    if summary['urgent']:
        attention_needed.append(f"📅 {len(summary['urgent'])} urgent task(s) due soon")

    return {
        'attention_needed': attention_needed,
        'tasks': summary,
        'total_requiring_attention': len(tasks),
    }


@mcp.tool()
async def add_task(
    title: str,
    due_date: str,
    assignee_name: Optional[str] = None,
    description: Optional[str] = None,
) -> dict:
    """
    Add a new task with a due date.

    Args:
        title: What needs to be done (e.g., "Submit renewal notice")
        due_date: When it's due (YYYY-MM-DD format)
        assignee_name: Who should do it (e.g., "Lisa", or None for Justin)
        description: Optional details

    The task will automatically escalate as the due date approaches.
    """
    supabase = get_supabase()

    # Parse and validate due date
    try:
        parsed_date = datetime.strptime(due_date, '%Y-%m-%d').date()
    except ValueError:
        return {'error': f'Invalid date format: {due_date}. Use YYYY-MM-DD.'}

    # Insert task
    result = supabase.table('tasks').insert({
        'title': title,
        'description': description,
        'due_date': due_date,
        'assignee_name': assignee_name,
        'layer': 'founder:justin',
    }).execute()

    task_data = result.data[0] if result.data else {}

    return {
        'success': True,
        'task_id': task_data.get('id'),
        'title': title,
        'due_date': due_date,
        'assignee': assignee_name or 'You',
        'urgency': task_data.get('urgency', 'normal'),
        'message': f"Task '{title}' added. Will escalate as {due_date} approaches.",
    }


@mcp.tool()
async def complete_task(task_id: str) -> dict:
    """
    Mark a task as completed.

    Args:
        task_id: The UUID of the task to complete
    """
    supabase = get_supabase()

    result = supabase.table('tasks').update({
        'status': 'completed',
        'completed_at': datetime.now().isoformat(),
    }).eq('id', task_id).execute()

    if result.data:
        task = result.data[0]
        return {
            'success': True,
            'message': f"✅ Task '{task.get('title')}' marked complete!",
        }
    else:
        return {'error': 'Task not found'}


@mcp.tool()
async def list_all_tasks(status: str = 'pending') -> dict:
    """
    List all tasks with a given status.

    Args:
        status: Filter by status (pending, in_progress, blocked, completed, cancelled)
    """
    supabase = get_supabase()

    result = supabase.table('tasks')\
        .select('id, title, assignee_name, due_date, urgency, status, created_at')\
        .eq('status', status)\
        .order('due_date', desc=False)\
        .execute()

    tasks = result.data or []

    return {
        'status_filter': status,
        'count': len(tasks),
        'tasks': tasks,
    }


# =============================================================================
# PREFECT WORKFLOWS
# =============================================================================

@task(retries=2)
def fetch_current_state() -> dict:
    """Fetch current state from Supabase storage."""
    supabase = get_supabase()

    result = supabase.storage.from_('contexts').download('justin/state/current.md')
    content = result.decode('utf-8') if result else ''

    return {'content': content}


@task(retries=2)
def fetch_urgent_tasks_sync() -> list:
    """Fetch urgent tasks (sync version for Prefect)."""
    supabase = get_supabase()

    result = supabase.rpc(
        'get_urgent_tasks',
        {'p_include_upcoming': True}
    ).execute()

    return result.data or []


@task
def escalate_task(task_data: dict) -> dict:
    """Record an escalation event for a task."""
    supabase = get_supabase()

    task_id = task_data['id']
    message = task_data.get('escalation_message', 'Task escalated')

    supabase.rpc('record_task_escalation', {
        'p_task_id': task_id,
        'p_message': message,
    }).execute()

    return {'task_id': task_id, 'escalated': True, 'message': message}


@flow(name="task-escalation-check", log_prints=True)
def task_escalation_check():
    """
    Scheduled flow to check for tasks needing escalation.

    Run this daily to:
    1. Update urgency levels based on current date
    2. Record escalation events for critical/overdue tasks
    3. Optionally notify support person for overdue items
    """
    print("🔍 Checking for tasks needing escalation...")

    tasks = fetch_urgent_tasks_sync()

    escalated = []
    for t in tasks:
        urgency = t.get('urgency')
        if urgency in ('critical', 'overdue'):
            result = escalate_task(t)
            escalated.append(result)
            print(f"⚠️ Escalated: {t.get('title')} ({urgency})")

    print(f"✅ Escalation check complete. {len(escalated)} task(s) escalated.")

    return {
        'checked': len(tasks),
        'escalated': len(escalated),
        'details': escalated,
    }


@flow(name="weekly-review", log_prints=True)
def weekly_review():
    """
    Weekly review workflow.

    This flow:
    1. Fetches current state
    2. Gets all pending tasks
    3. Identifies wins from the week
    4. Prompts for priority updates

    Returns data for Claude to use in the review conversation.
    """
    print("📋 Starting weekly review...")

    # Get current state
    state = fetch_current_state()

    # Get all pending tasks
    tasks = fetch_urgent_tasks_sync()

    # Build review summary
    review = {
        'current_state': state.get('content', ''),
        'pending_tasks': tasks,
        'overdue_count': len([t for t in tasks if t.get('urgency') == 'overdue']),
        'critical_count': len([t for t in tasks if t.get('urgency') == 'critical']),
        'questions': [
            "What were your biggest wins this week?",
            "What didn't go as planned?",
            "What's the ONE most important thing for next week?",
            "Any tasks to add, complete, or deprioritize?",
            "Energy check: How are you feeling about the workload?",
        ],
    }

    print(f"📊 Found {len(tasks)} pending tasks")
    print(f"  - {review['overdue_count']} overdue")
    print(f"  - {review['critical_count']} critical")

    return review


@mcp.tool()
async def run_weekly_review() -> dict:
    """
    Trigger the weekly review workflow.

    This starts a guided review session that:
    1. Shows current state and pending tasks
    2. Asks about wins and challenges
    3. Helps set priorities for next week

    The review is conversational - Claude will guide you through it.
    """
    try:
        result = weekly_review()
        return {
            'success': True,
            'review_data': result,
            'message': "Weekly review started. Let's go through this together.",
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


@mcp.tool()
async def run_escalation_check() -> dict:
    """
    Manually trigger the task escalation check.

    This is normally run on a schedule, but you can trigger it manually
    to update urgency levels and record escalations.
    """
    try:
        result = task_escalation_check()
        return {
            'success': True,
            'result': result,
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    mcp.run()
