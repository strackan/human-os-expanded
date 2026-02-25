# Database Migration Instructions

**Status:** CRITICAL - Blocks frontend chat functionality
**Estimated Time:** 5 minutes
**Date:** October 9, 2025

## What This Does

Creates the missing database tables for:
- ✅ Chat threads and messages
- ✅ LLM conversation history
- ✅ Chat branches (fixed buttons + dynamic LLM)
- ✅ Saved actions (snooze, skip, escalate)
- ✅ User preferences (shiftEnterToSubmit, etc.)

## Prerequisites

These tables must already exist in your Supabase database:
- ✅ `workflow_executions`
- ✅ `workflow_tasks`
- ✅ `users` (or using Supabase auth)

*(Frontend confirmed these exist)*

## Step-by-Step Instructions

### Step 1: Run Main Migration (2 min)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy entire contents of `RUN_THIS_MIGRATION.sql`
5. Paste into editor
6. Click **Run**
7. Wait for success message:
   ```
   MIGRATION COMPLETE!
   Created tables:
     - workflows
     - workflow_chat_threads
     - workflow_chat_messages
     - (and 7 more...)
   ```

### Step 2: Seed Essential Data (1 min)

1. Still in **SQL Editor**
2. Click **New Query**
3. Copy entire contents of `SEED_DATA.sql`
4. Paste into editor
5. Click **Run**
6. Wait for success message:
   ```
   SEED DATA COMPLETE!
   Created 6 saved actions:
     ✅ snooze
     ✅ skip
     ✅ escalate
     (and 3 more...)
   ```

### Step 3: Verify (1 min)

Run this query to verify tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'workflow_%'
ORDER BY table_name;
```

**Expected output (at minimum):**
- workflow_chat_branches
- workflow_chat_messages
- workflow_chat_threads
- workflow_executions
- workflow_llm_context
- workflow_llm_tool_calls
- workflow_task_artifacts
- workflow_tasks
- workflow_versions
- workflows

## What Happens Next

Once migrations complete:
- ✅ Frontend can call Chat APIs immediately
- ✅ LLM integration will work (Ollama or mocks)
- ✅ No code changes needed
- ✅ Backend will continue building remaining APIs

## Troubleshooting

**Error: "relation 'workflow_executions' does not exist"**
- Missing prerequisite table
- Need to run earlier migrations first
- Contact backend for help

**Error: "relation 'users' does not exist"**
- If using Supabase auth, modify foreign key references to use `auth.users`
- Or create custom `users` table with migration 003

**Error: "duplicate key value violates unique constraint"**
- Table/data already exists
- Safe to ignore
- Or add `IF NOT EXISTS` to CREATE statements (already done)

## Files

- `RUN_THIS_MIGRATION.sql` - Main migration (creates 10 tables)
- `SEED_DATA.sql` - Seed data (creates 6 saved actions)
- `MIGRATION_INSTRUCTIONS.md` - This file

## Status Tracking

- [ ] Step 1: Run main migration
- [ ] Step 2: Seed essential data
- [ ] Step 3: Verify tables created
- [ ] Notify backend when complete
- [ ] Notify frontend when complete

## Questions?

Contact backend developer.
