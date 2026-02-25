# WorkflowActionService Update for Phase 1.0

## Changes Required

Update the `snoozeWorkflow` method and `SnoozeOptions` interface in `src/lib/workflows/actions/WorkflowActionService.ts` to support optional triggers.

### Current SnoozeOptions Interface (lines 34-38)

```typescript
export interface SnoozeOptions {
  until: Date;
  reason?: string;
  days?: number;
}
```

### Updated SnoozeOptions Interface (Phase 1.0)

```typescript
export interface SnoozeOptions {
  until: Date;
  reason?: string;
  days?: number;
  triggers?: any[]; // WakeTrigger[] - Phase 1.0
}
```

### Current snoozeWorkflow Implementation (lines 78-124)

```typescript
async snoozeWorkflow(
  executionId: string,
  userId: string,
  options: SnoozeOptions
): Promise<{ success: boolean; actionId?: string; error?: string }> {
  try {
    // Update workflow_executions
    const { error: updateError } = await this.client
      .from('workflow_executions')
      .update({
        status: WorkflowExecutionStatus.SNOOZED,
        snooze_until: options.until.toISOString(),
        snooze_days: options.days,
        snoozed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', executionId);

    if (updateError) throw updateError;

    // Record action
    const { data: action, error: actionError } = await this.client
      .from('workflow_actions')
      .insert({
        execution_id: executionId,
        performed_by: userId,
        action_type: ActionTypeEnum.SNOOZE,
        new_status: WorkflowExecutionStatus.SNOOZED,
        action_data: {
          until: options.until.toISOString(),
          days: options.days,
          reason: options.reason,
        },
        notes: options.reason,
      })
      .select('id')
      .single();

    if (actionError) throw actionError;

    return { success: true, actionId: action.id };
  } catch (error: any) {
    console.error('[WorkflowActionService] Snooze error:', error);
    return { success: false, error: error.message };
  }
}
```

### Updated snoozeWorkflow Implementation (Phase 1.0)

```typescript
async snoozeWorkflow(
  executionId: string,
  userId: string,
  options: SnoozeOptions
): Promise<{ success: boolean; actionId?: string; error?: string }> {
  try {
    // Build update object
    const updateData: any = {
      status: WorkflowExecutionStatus.SNOOZED,
      snooze_until: options.until.toISOString(),
      snooze_days: options.days,
      snoozed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    };

    // Phase 1.0: Add triggers if provided
    if (options.triggers && options.triggers.length > 0) {
      updateData.wake_triggers = options.triggers;
      updateData.last_evaluated_at = null;
      updateData.trigger_fired_at = null;
      updateData.fired_trigger_type = null;
    }

    // Update workflow_executions
    const { error: updateError } = await this.client
      .from('workflow_executions')
      .update(updateData)
      .eq('id', executionId);

    if (updateError) throw updateError;

    // Record action (Phase 1.0: include trigger info)
    const actionData: any = {
      until: options.until.toISOString(),
      days: options.days,
      reason: options.reason,
    };

    if (options.triggers && options.triggers.length > 0) {
      actionData.trigger_count = options.triggers.length;
      actionData.trigger_types = options.triggers.map((t: any) => t.type);
    }

    const { data: action, error: actionError } = await this.client
      .from('workflow_actions')
      .insert({
        execution_id: executionId,
        performed_by: userId,
        action_type: ActionTypeEnum.SNOOZE,
        new_status: WorkflowExecutionStatus.SNOOZED,
        action_data: actionData,
        notes: options.reason,
      })
      .select('id')
      .single();

    if (actionError) throw actionError;

    return { success: true, actionId: action.id };
  } catch (error: any) {
    console.error('[WorkflowActionService] Snooze error:', error);
    return { success: false, error: error.message };
  }
}
```

## Backward Compatibility

The `triggers` field in `SnoozeOptions` is optional, so all existing code that calls `snoozeWorkflow` without triggers will continue to work.

Example usage:

```typescript
// Old way (still works)
await service.snoozeWorkflow('exec123', 'user456', {
  until: new Date('2025-12-01'),
  reason: 'Waiting for customer response'
});

// New way (Phase 1.0)
await service.snoozeWorkflow('exec123', 'user456', {
  until: new Date('2025-12-01'),
  reason: 'Waiting for customer response',
  triggers: [
    {
      id: 'trigger1',
      type: 'date',
      config: { date: '2025-12-01T10:00:00Z' },
      createdAt: new Date().toISOString()
    },
    {
      id: 'trigger2',
      type: 'event',
      config: { eventType: 'customer_login' },
      createdAt: new Date().toISOString()
    }
  ]
});
```
