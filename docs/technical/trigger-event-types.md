# Trigger Event Types Reference

**Version:** 1.0
**Last Updated:** 2025-11-13
**Applies To:** Snooze (1.0), Skip (1.1), Escalate (1.2)

---

## Overview

This document catalogs all event types that can be used in workflow trigger systems. These event types are **shared across all three flow control actions** (Snooze, Skip, Escalate), providing a unified event framework for conditional workflow behavior.

### Event Trigger Structure

All event triggers follow this base structure:

```typescript
interface EventTrigger {
  id: string;                    // Unique trigger ID
  type: 'event';                 // Always 'event' for event triggers
  config: EventTriggerConfig;
  createdAt: string;             // ISO 8601 timestamp
}

interface EventTriggerConfig {
  eventType: EventType;                    // The event type (see catalog below)
  eventConfig?: Record<string, unknown>;   // Event-specific configuration
}
```

---

## Event Type Catalog

### 1. workflow_action_completed

**Type:** `workflow_action_completed`
**Description:** Triggers when a specific workflow execution completes or a specific action within a workflow completes.

**Use Cases:**
- "Snooze until the onboarding workflow completes"
- "Skip this renewal until the contract signing workflow is done"
- "Escalate if the pricing approval workflow completes"
- Dependency chains between workflows

#### Configuration

```typescript
interface WorkflowActionCompletedConfig {
  workflowExecutionId: string;     // Required: Which workflow to watch
  actionId?: string;               // Optional: Specific action within workflow
  actionType?: string;             // Optional: Type of action (e.g., 'approval', 'submission')
}
```

#### Example

```json
{
  "id": "trigger-event-1700000001",
  "type": "event",
  "config": {
    "eventType": "workflow_action_completed",
    "eventConfig": {
      "workflowExecutionId": "execution-abc-123",
      "actionId": "action-approval-456"
    }
  },
  "createdAt": "2025-11-13T12:00:00Z"
}
```

#### Evaluation Logic

```typescript
async function evaluateWorkflowActionCompleted(
  config: WorkflowActionCompletedConfig,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data: execution } = await supabase
    .from('workflow_executions')
    .select('status')
    .eq('id', config.workflowExecutionId)
    .single();

  if (config.actionId) {
    // Check specific action
    const { data: action } = await supabase
      .from('workflow_actions')
      .select('status')
      .eq('id', config.actionId)
      .single();

    return action?.status === 'completed';
  }

  // Check overall workflow
  return execution?.status === 'completed';
}
```

#### UI Display

**Human-readable:** "When {{workflow_name}} completes"
**Example:** "When Contract Signing workflow completes"

---

### 2. customer_login

**Type:** `customer_login`
**Description:** Triggers when a customer logs into the platform.

**Use Cases:**
- "Snooze until customer logs in"
- "Skip this outreach if customer has logged in"
- "Escalate if customer hasn't logged in by X date"
- Engagement-based workflows

#### Configuration

```typescript
interface CustomerLoginConfig {
  // No additional configuration needed
  // Uses workflow's customer_id automatically
}
```

#### Example

```json
{
  "id": "trigger-event-1700000002",
  "type": "event",
  "config": {
    "eventType": "customer_login"
  },
  "createdAt": "2025-11-13T12:00:00Z"
}
```

#### Evaluation Logic

```typescript
async function evaluateCustomerLogin(
  workflowExecutionId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  // Get customer ID from workflow
  const { data: workflow } = await supabase
    .from('workflow_executions')
    .select('customer_id, snoozed_at')  // or skipped_at, escalated_at
    .eq('id', workflowExecutionId)
    .single();

  if (!workflow) return false;

  // Check if customer logged in after workflow was snoozed/skipped/escalated
  const { data: profile } = await supabase
    .from('profiles')
    .select('last_sign_in_at')
    .eq('customer_id', workflow.customer_id)
    .single();

  if (!profile?.last_sign_in_at) return false;

  // Customer logged in after the action was taken
  return new Date(profile.last_sign_in_at) > new Date(workflow.snoozed_at);
}
```

#### UI Display

**Human-readable:** "When customer logs in"
**Example:** "When customer logs in"

---

### 3. usage_threshold_crossed

**Type:** `usage_threshold_crossed`
**Description:** Triggers when a customer metric crosses a specified threshold.

**Use Cases:**
- "Snooze until ARR exceeds $50k"
- "Skip until health score improves above 60"
- "Escalate when engagement score drops below 30"
- Metric-based workflow decisions

#### Configuration

```typescript
interface UsageThresholdConfig {
  metricName: string;              // Required: Which metric to watch
  threshold: number;               // Required: Threshold value
  operator: '>' | '>=' | '<' | '<=';  // Required: Comparison operator
}
```

**Available Metrics:**
- `arr` - Annual Recurring Revenue
- `health_score` - Customer health score (0-100)
- `engagement_score` - Engagement score (0-100)
- `active_users` - Number of active users
- `api_calls` - API call count
- `feature_adoption` - Feature adoption score
- Custom metrics (defined in `customer_properties`)

#### Example

```json
{
  "id": "trigger-event-1700000003",
  "type": "event",
  "config": {
    "eventType": "usage_threshold_crossed",
    "eventConfig": {
      "metricName": "arr",
      "threshold": 50000,
      "operator": ">="
    }
  },
  "createdAt": "2025-11-13T12:00:00Z"
}
```

#### Evaluation Logic

```typescript
async function evaluateUsageThreshold(
  config: UsageThresholdConfig,
  workflowExecutionId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  // Get customer ID
  const { data: workflow } = await supabase
    .from('workflow_executions')
    .select('customer_id')
    .eq('id', workflowExecutionId)
    .single();

  if (!workflow) return false;

  // Get metric value from customer_properties view
  const { data: properties } = await supabase
    .from('customer_properties')
    .select(config.metricName)
    .eq('customer_id', workflow.customer_id)
    .single();

  if (!properties) return false;

  const actualValue = properties[config.metricName];
  if (actualValue === null || actualValue === undefined) return false;

  // Evaluate threshold
  switch (config.operator) {
    case '>':
      return actualValue > config.threshold;
    case '>=':
      return actualValue >= config.threshold;
    case '<':
      return actualValue < config.threshold;
    case '<=':
      return actualValue <= config.threshold;
    default:
      return false;
  }
}
```

#### UI Display

**Human-readable:** "When {{metricName}} {{operator}} {{threshold}}"
**Examples:**
- "When ARR >= $50,000"
- "When health score > 60"
- "When engagement score <= 30"

---

### 4. manual_event

**Type:** `manual_event`
**Description:** Triggers when manually fired by a user or system process.

**Use Cases:**
- "Snooze until I manually wake this"
- "Skip until sales team confirms pricing"
- "Escalate when manager approves"
- Human-in-the-loop workflows

#### Configuration

```typescript
interface ManualEventConfig {
  eventKey: string;          // Required: Unique identifier for this event
  description?: string;      // Optional: Human-readable description
}
```

#### Example

```json
{
  "id": "trigger-event-1700000004",
  "type": "event",
  "config": {
    "eventType": "manual_event",
    "eventConfig": {
      "eventKey": "pricing_approved",
      "description": "Pricing has been approved by sales leadership"
    }
  },
  "createdAt": "2025-11-13T12:00:00Z"
}
```

#### Evaluation Logic

```typescript
async function evaluateManualEvent(
  config: ManualEventConfig,
  workflowExecutionId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  // Check if manual event has been fired
  const { data: trigger } = await supabase
    .from('workflow_wake_triggers')  // or skip_triggers, escalate_triggers
    .select('is_fired')
    .eq('workflow_execution_id', workflowExecutionId)
    .eq("trigger_config->eventConfig->eventKey", config.eventKey)
    .single();

  return trigger?.is_fired === true;
}
```

#### Firing a Manual Event

**API Endpoint:** `POST /api/workflows/fire-manual-event`

```typescript
{
  workflowId: string;
  eventKey: string;
  firedBy: string;     // User ID who fired the event
  note?: string;       // Optional note
}
```

**UI:**
```tsx
<Button onClick={() => fireManualEvent(workflowId, 'pricing_approved')}>
  Mark Pricing as Approved
</Button>
```

#### UI Display

**Human-readable:** "When {{description}} (manual)"
**Example:** "When pricing approved by sales leadership (manual)"

---

## Adding New Event Types

To add a new event type:

### 1. Define the Event Type

Add to `EventType` union in `src/types/wake-triggers.ts` (and skip/escalate equivalents):

```typescript
type EventType =
  | 'workflow_action_completed'
  | 'customer_login'
  | 'usage_threshold_crossed'
  | 'manual_event'
  | 'new_event_type';  // ← Add here
```

### 2. Define the Config Interface

```typescript
interface NewEventTypeConfig {
  // Event-specific fields
  someField: string;
  anotherField: number;
}
```

### 3. Implement Evaluation Logic

Add method to `TriggerEvaluator.ts` (and Skip/Escalate equivalents):

```typescript
static async evaluateNewEventType(
  config: NewEventTypeConfig,
  workflowExecutionId: string,
  supabase: SupabaseClient
): Promise<{ triggered: boolean; reason?: string }> {
  // Evaluation logic here
  return { triggered: true, reason: 'Event occurred' };
}
```

### 4. Update the Dispatcher

In `evaluateEventTrigger()`:

```typescript
switch (config.eventType) {
  case 'workflow_action_completed':
    return this.evaluateWorkflowActionCompleted(config.eventConfig, ...);
  case 'customer_login':
    return this.evaluateCustomerLogin(...);
  case 'usage_threshold_crossed':
    return this.evaluateUsageThreshold(config.eventConfig, ...);
  case 'manual_event':
    return this.evaluateManualEvent(config.eventConfig, ...);
  case 'new_event_type':  // ← Add here
    return this.evaluateNewEventType(config.eventConfig, ...);
  default:
    throw new Error(`Unknown event type: ${config.eventType}`);
}
```

### 5. Update UI Components

Add to event type dropdown in `TriggerBuilder.tsx`:

```tsx
<Select label="Event Type">
  <option value="workflow_action_completed">Workflow Completes</option>
  <option value="customer_login">Customer Logs In</option>
  <option value="usage_threshold_crossed">Metric Threshold</option>
  <option value="manual_event">Manual Trigger</option>
  <option value="new_event_type">New Event Type</option>  {/* ← Add here */}
</Select>
```

### 6. Add Config Fields Component

Create `NewEventTypeConfigFields.tsx`:

```tsx
function NewEventTypeConfigFields({
  config,
  onChange
}: {
  config: NewEventTypeConfig;
  onChange: (config: NewEventTypeConfig) => void;
}) {
  return (
    <>
      <Input
        label="Some Field"
        value={config.someField}
        onChange={(e) => onChange({ ...config, someField: e.target.value })}
      />
      <Input
        type="number"
        label="Another Field"
        value={config.anotherField}
        onChange={(e) => onChange({ ...config, anotherField: Number(e.target.value) })}
      />
    </>
  );
}
```

### 7. Update Documentation

- Add to this file (Trigger Event Types Reference)
- Add examples to relevant release specs (1.0, 1.1, 1.2)
- Update API documentation

---

## Cross-Action Consistency

### Same Events, Different Actions

Event types work identically across all three flow control actions:

| Event Type | Snooze Example | Skip Example | Escalate Example |
|------------|----------------|--------------|------------------|
| workflow_action_completed | Wake when onboarding completes | Reactivate when contract signed | Escalate when approval workflow completes |
| customer_login | Wake when customer logs in | Reactivate when customer returns | Escalate if customer logs in (unusual case) |
| usage_threshold_crossed | Wake when ARR > $50k | Reactivate when health > 60 | Escalate when ARR > $100k |
| manual_event | Wake on manual trigger | Reactivate on manual approval | Escalate on manual flag |

### Shared Evaluation

All three actions use the same event evaluation logic:

```
TriggerEvaluator.evaluateEventTrigger()
  ├─ Used by: Snooze (via TriggerEvaluator)
  ├─ Used by: Skip (via SkipTriggerEvaluator)
  └─ Used by: Escalate (via EscalateTriggerEvaluator)
```

**Implementation:** Each action-specific evaluator calls the same base evaluation methods, ensuring consistency.

---

## Performance Considerations

### Evaluation Frequency

- Date triggers: Evaluated once per cron run (daily)
- Event triggers: Evaluated once per cron run (daily)
- Manual events: Evaluated immediately on fire

### Caching

Event evaluation results are NOT cached. Each cron run performs fresh evaluation to ensure accuracy.

### Database Queries

- Each event type performs 1-2 database queries
- Batch processing (100 workflows) minimizes connection overhead
- GIN indexes on JSONB fields optimize trigger lookups

### Optimization Tips

1. **Use date triggers when possible** - Simpler, faster evaluation
2. **Limit usage_threshold_crossed metrics** - Joins to customer_properties can be slow
3. **Prefer manual_event for complex logic** - Offload complexity to dedicated services
4. **Combine with AND logic sparingly** - Multiple event triggers = multiple DB queries

---

## Error Handling

### Graceful Degradation

If event evaluation fails:
1. Log error to `workflow_[action]_triggers` table
2. Set `error_message` field
3. Increment `evaluation_count`
4. Continue with next workflow (don't crash batch)
5. Return `triggered: false` (safe default)

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Missing workflow | Workflow deleted during evaluation | Skip evaluation, log warning |
| Missing customer | Customer data not found | Skip evaluation, log warning |
| Invalid metric | Metric doesn't exist in customer_properties | Log error, return false |
| Network timeout | Database query timeout | Retry on next cron run |
| Invalid config | Malformed eventConfig | Fix trigger config, log error |

### Monitoring

Track these metrics:
- Evaluation success rate (target: >99%)
- Average evaluation time per trigger
- Error rate by event type
- Failed trigger count per day

---

## Related Documentation

- [Release 1.0 - Workflow Snoozing](../releases/1.0-workflow-snoozing.md)
- [Release 1.1 - Skip Enhanced](../releases/1.1-skip-enhanced.md)
- [Release 1.2 - Escalate Enhanced](../releases/1.2-escalate-enhanced.md)
- [API Documentation - Triggers](../API.md#triggers)

---

**Document Status:** Live (used in production)
**Maintained By:** Engineering Team
**Review Frequency:** Quarterly or when adding new event types
