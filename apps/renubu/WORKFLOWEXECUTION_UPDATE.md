# WorkflowExecutionService Update for Phase 1.0

## Changes Required

Update the `snoozeWorkflow` method in `src/lib/services/WorkflowExecutionService.ts` to accept optional triggers parameter.

### Current Implementation (lines 377-398)

```typescript
/**
 * Snooze a workflow until a specific time
 */
static async snoozeWorkflow(params: {
  executionId: string;
  snoozeUntil: Date;
}, supabaseClient?: SupabaseClient): Promise<void> {
  const supabase = supabaseClient || createClient();

  const { error } = await supabase
    .from(DB_TABLES.WORKFLOW_EXECUTIONS)
    .update({
      [DB_COLUMNS.STATUS]: WorkflowExecutionStatus.SNOOZED,
      [DB_COLUMNS.SNOOZED_UNTIL]: params.snoozeUntil.toISOString()
    })
    .eq(DB_COLUMNS.ID, params.executionId);

  if (error) {
    console.error('Error snoozing workflow:', error);
    throw new Error(`Failed to snooze workflow: ${error.message}`);
  }
}
```

### Updated Implementation (Phase 1.0)

```typescript
/**
 * Snooze a workflow until a specific time
 *
 * Phase 1.0: Enhanced to support optional wake triggers
 * If triggers are provided, they will be stored in the wake_triggers column
 */
static async snoozeWorkflow(params: {
  executionId: string;
  snoozeUntil: Date;
  triggers?: any[]; // WakeTrigger[] from wake-triggers.ts
}, supabaseClient?: SupabaseClient): Promise<void> {
  const supabase = supabaseClient || createClient();

  // Build update object
  const updateData: any = {
    [DB_COLUMNS.STATUS]: WorkflowExecutionStatus.SNOOZED,
    [DB_COLUMNS.SNOOZED_UNTIL]: params.snoozeUntil.toISOString()
  };

  // If triggers are provided, add them to the update
  // This enables the new trigger-based snoozing (Phase 1.0)
  if (params.triggers && params.triggers.length > 0) {
    updateData.wake_triggers = params.triggers;
    updateData.last_evaluated_at = null; // Reset evaluation timestamp
    updateData.trigger_fired_at = null; // Clear any previous trigger
    updateData.fired_trigger_type = null;
  }

  const { error } = await supabase
    .from(DB_TABLES.WORKFLOW_EXECUTIONS)
    .update(updateData)
    .eq(DB_COLUMNS.ID, params.executionId);

  if (error) {
    console.error('Error snoozing workflow:', error);
    throw new Error(`Failed to snooze workflow: ${error.message}`);
  }
}
```

## Backward Compatibility

The `triggers` parameter is optional, so all existing code that calls `snoozeWorkflow` without triggers will continue to work.

Example usage:

```typescript
// Old way (still works)
await WorkflowExecutionService.snoozeWorkflow({
  executionId: 'abc123',
  snoozeUntil: new Date('2025-12-01')
});

// New way (Phase 1.0)
await WorkflowExecutionService.snoozeWorkflow({
  executionId: 'abc123',
  snoozeUntil: new Date('2025-12-01'),
  triggers: [
    {
      id: 'trigger1',
      type: 'date',
      config: { date: '2025-12-01T10:00:00Z' },
      createdAt: new Date().toISOString()
    }
  ]
});
```
