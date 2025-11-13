# Release 1.4: Flow Mode Extended Functionality - Proposal

**Version:** 1.4
**Name:** Flow Mode Extended Functionality
**Status:** Proposed
**Proposed Timeline:** Feb 2 - Feb 27, 2026 (4 weeks)
**Prerequisites:** Releases 1.1, 1.2, 1.3 must be complete

---

## Executive Summary

Release 1.4 extends the trigger-based flow control system (Snooze/Skip/Escalate) with advanced capabilities: event-based triggers, complex logical operators (AND/OR), trigger editing, and real-time evaluation. This represents the completion of the **comprehensive flow control vision** started in Phase 1.0.

By the end of 1.4, users will be able to:
- Set triggers based on real-world events (Gmail, Slack, Calendar, CRM changes)
- Combine conditions with complex logic: "Snooze until next Monday AND customer responds"
- Edit triggers on existing flows without waking them
- Get sub-minute response times via webhook-based evaluation

---

## Strategic Rationale

### Why 1.4 Makes Sense After 1.3

**Release Progression:**
- **1.0** ✓ Snooze with basic date triggers
- **1.1** → Skip with all 4 trigger conventions (DATE, EVENT, AND, OR)
- **1.2** → Escalate with all 4 trigger conventions
- **1.3** → String-Tie (LLM natural language for all three)
- **1.4** → **Extended functionality for ALL THREE methods**

By 1.4, all three flow control methods (Snooze, Skip, Escalate) will have basic trigger support from 1.1-1.2. Release 1.4 adds the sophisticated, production-grade capabilities that transform them from "working" to "powerful":

1. **Event Triggers** - Move beyond dates to real-world events
2. **Complex Logic** - Professional-grade condition combinations
3. **Trigger Editing** - Flexibility without disruption
4. **Real-time Evaluation** - Responsiveness that matters

### Business Value

**Current State (Post 1.3):**
- All three methods support basic triggers
- Date-based conditions work
- String-Tie provides natural language interface

**Gap:**
Users still can't:
- "Wake me when Sarah replies to my email" (event-based)
- "Skip until Friday OR customer upgrades" (complex logic)
- "Oh wait, change that to next Monday" (editing)
- Get immediate response when conditions fire (real-time)

**1.4 Value Proposition:**
Transform flow control from "basic automation" to "intelligent orchestration" - the kind of sophistication that justifies premium pricing and creates sticky product usage.

---

## Features

### Feature 1: Event-Based Triggers (Cross-Method)
**Effort:** 32 hours
**Priority:** 1 (Highest)

Enable all three flow control methods (Snooze, Skip, Escalate) to wake/trigger based on real-world events from integrated services.

**Supported Events:**

**Gmail Integration:**
- New email received from specific contact
- Email received matching subject/body keywords
- Reply received to specific thread
- Email forwarded by contact

**Slack Integration:**
- Message posted in channel
- Direct message received from user
- Mention in channel
- Reaction added to message

**Google Calendar Integration:**
- Event starts/ends
- Event canceled
- Attendee responds (accept/decline)
- New event created matching criteria

**CRM Integration (Salesforce/HubSpot):**
- Field value changes (e.g., deal stage)
- Record updated by user
- Note/activity added
- Ownership changed

**Implementation Approach:**
- Extend existing `WakeTrigger` interface with event trigger types
- Create webhook receivers for each integration
- Store webhook signatures for security
- Evaluate event triggers in real-time (see Feature 3)
- Add event trigger UI components to existing modals

**Deliverables:**
- Event trigger data models and types
- Webhook receiver endpoints (4 services)
- Event matching logic (TriggerEvaluator extension)
- UI: Event picker component for modals
- Tests: Event trigger evaluation suite
- Documentation: Event trigger setup guide

---

### Feature 2: Complex Trigger Logic (AND/OR Operators)
**Effort:** 24 hours
**Priority:** 2

Support complex logical combinations of triggers using AND/OR operators, enabling sophisticated multi-condition flows.

**Examples:**

**Snooze Use Cases:**
- "Snooze until next Monday AND customer responds to email"
- "Snooze until contract renewal date OR customer requests demo"
- "Snooze until (Sarah replies to Slack OR adds calendar event) AND it's after Feb 1"

**Skip Use Cases:**
- "Skip if customer hasn't responded by Friday OR deal closed"
- "Skip if (ARR < $50k AND no executive sponsor)"

**Escalate Use Cases:**
- "Escalate if no response within 48 hours AND deal value > $100k"
- "Escalate if (health score drops below 60 OR churn risk flagged) AND CSM unresponsive"

**Logic Engine Design:**
```typescript
interface TriggerLogicNode {
  type: 'trigger' | 'and' | 'or';
  trigger?: WakeTrigger;        // If type === 'trigger'
  children?: TriggerLogicNode[]; // If type === 'and' | 'or'
}

// Example: "Date trigger AND (Event1 OR Event2)"
{
  type: 'and',
  children: [
    { type: 'trigger', trigger: dateTrigger },
    {
      type: 'or',
      children: [
        { type: 'trigger', trigger: event1 },
        { type: 'trigger', trigger: event2 }
      ]
    }
  ]
}
```

**UI Approach:**
- Visual logic builder (drag-and-drop blocks)
- Parentheses grouping visualization
- Natural language summary of logic tree
- Validation for circular logic

**Deliverables:**
- `TriggerLogicNode` type system
- Logic tree evaluator
- UI: Visual logic builder component
- Database: Store logic trees as JSONB
- Migration: Update wake_triggers schema
- Tests: Logic evaluation test suite
- Documentation: Logic builder user guide

---

### Feature 3: Real-Time Trigger Evaluation
**Effort:** 20 hours
**Priority:** 3

Replace daily cron evaluation with real-time webhook-based evaluation for sub-minute trigger response times.

**Current State (Phase 1.0):**
- Triggers evaluated once per day via Supabase Edge Function
- Maximum latency: 24 hours
- Acceptable for date-based triggers only

**Target State:**
- Event triggers evaluated within seconds
- Date triggers still evaluated via cron (but more frequently)
- Webhook-based architecture for instant response

**Architecture:**

**Webhook Receivers:**
- `/api/webhooks/gmail` - Gmail notifications
- `/api/webhooks/slack` - Slack events
- `/api/webhooks/calendar` - Google Calendar notifications
- `/api/webhooks/crm` - Salesforce/HubSpot webhooks

**Evaluation Flow:**
1. External service sends webhook
2. Receiver validates signature
3. Extract event data
4. Query workflows with matching event triggers
5. Evaluate trigger logic tree
6. Surface workflows if conditions met
7. Send notification to user

**Performance:**
- Target: < 5 second latency from event to workflow surface
- Use Redis for caching active trigger subscriptions
- Batch database queries for efficiency

**Deliverables:**
- Webhook receiver infrastructure
- Signature validation for each service
- Real-time evaluation service
- Redis caching layer (optional)
- Monitoring: Webhook delivery tracking
- Documentation: Webhook setup guide

---

### Feature 4: Trigger Editing (Bonus - If Time Permits)
**Effort:** 16 hours
**Priority:** 4 (Nice-to-have)

Allow users to modify triggers on snoozed/skipped/escalated items without waking them.

**Current Limitation:**
- Once item is snoozed/skipped/escalated, triggers are locked
- Must wake item, then re-snooze with new triggers
- Loses context and timing information

**Proposed UX:**
- "Edit Triggers" button on snoozed/skipped items
- Opens modal pre-filled with current triggers
- Save updates triggers without changing workflow state
- Show "Last modified" timestamp on trigger cards

**Implementation:**
- API: `PATCH /api/workflows/[id]/triggers`
- API: `PATCH /api/workflows/executions/[id]/steps/[stepId]/triggers`
- UI: Edit mode in modals
- Validation: Ensure logical consistency
- Audit log: Track trigger modifications

**Deliverables:**
- Edit trigger API endpoints
- UI: Edit mode in EnhancedSnoozeModal
- Audit logging for trigger changes
- Tests: Trigger modification suite
- Documentation: Editing guide

---

## Technical Scope

### Database Changes

**Extend `workflow_executions` table:**
```sql
-- Already exists from Phase 1.0:
-- wake_triggers JSONB
-- last_evaluated_at TIMESTAMPTZ
-- trigger_fired_at TIMESTAMPTZ
-- fired_trigger_type TEXT

-- New in 1.4:
ALTER TABLE workflow_executions
  ADD COLUMN trigger_logic_tree JSONB, -- Store AND/OR logic
  ADD COLUMN trigger_modified_at TIMESTAMPTZ, -- Track editing
  ADD COLUMN trigger_modified_by UUID REFERENCES users(id);
```

**New table: `webhook_subscriptions`**
```sql
CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
  service TEXT NOT NULL, -- 'gmail', 'slack', 'calendar', 'crm'
  event_type TEXT NOT NULL,
  filter_config JSONB,
  subscription_id TEXT, -- External service subscription ID
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_subscriptions_workflow
  ON webhook_subscriptions(workflow_execution_id);

CREATE INDEX idx_webhook_subscriptions_service
  ON webhook_subscriptions(service, event_type);
```

### Service Layer

**Extend `TriggerEvaluator`:**
- `evaluateEventTrigger()` - Check if event matches trigger conditions
- `evaluateLogicTree()` - Evaluate complex AND/OR logic
- `subscribeToWebhooks()` - Register webhook subscriptions
- `unsubscribeWebhooks()` - Clean up when workflow completes

**New `WebhookService`:**
- `handleGmailWebhook()` - Process Gmail notifications
- `handleSlackWebhook()` - Process Slack events
- `handleCalendarWebhook()` - Process Calendar notifications
- `handleCRMWebhook()` - Process CRM webhooks
- `validateSignature()` - Security validation per service

### API Routes

**New Endpoints:**
- `POST /api/webhooks/gmail` - Gmail webhook receiver
- `POST /api/webhooks/slack` - Slack webhook receiver
- `POST /api/webhooks/calendar` - Calendar webhook receiver
- `POST /api/webhooks/crm` - CRM webhook receiver
- `PATCH /api/workflows/[id]/triggers` - Edit workflow triggers
- `PATCH /api/workflows/executions/[id]/steps/[stepId]/triggers` - Edit step triggers

### UI Components

**New Components:**
- `EventTriggerPicker` - Select event type and configure filters
- `LogicTreeBuilder` - Visual builder for AND/OR logic
- `TriggerLogicPreview` - Human-readable logic summary
- `TriggerEditMode` - Edit existing triggers on snoozed items

**Updated Components:**
- `EnhancedSnoozeModal` - Add event triggers and logic builder
- `StepSnoozeModal` - Same enhancements
- `SnoozedWorkflowCard` - Show logic tree and edit button
- `WorkflowStepProgress` - Indicate complex trigger logic

---

## Dependencies & Integration Points

### External Services

**Gmail API:**
- Gmail Push Notifications (Pub/Sub)
- Watch requests for inbox changes
- Message parsing and filtering

**Slack API:**
- Events API subscription
- Socket Mode for real-time events
- Message history API for context

**Google Calendar API:**
- Push notifications via Pub/Sub
- Event change notifications
- Calendar access permissions

**Salesforce API:**
- Streaming API for real-time updates
- Outbound Messages
- Platform Events

**HubSpot API:**
- Webhooks for record updates
- Contact/Deal change notifications
- Timeline events

### Internal Dependencies

**Must complete before 1.4:**
- Release 1.1: Skip Enhanced (event trigger foundation)
- Release 1.2: Escalate Enhanced (trigger patterns established)
- Release 1.3: String-Tie (LLM context for natural language)

**Leverages existing:**
- Phase 1.0 trigger infrastructure
- Supabase Edge Functions
- OAuth integration for service auth
- WorkflowSnoozeService

---

## Timeline & Milestones

**Total Duration:** 4 weeks (Feb 2 - Feb 27, 2026)

### Week 1: Event Triggers Foundation (Feb 2-8)
- [ ] Design event trigger data models
- [ ] Implement webhook receivers (Gmail, Slack)
- [ ] Create event matching logic
- [ ] Build EventTriggerPicker UI
- **Milestone:** Gmail and Slack event triggers working

### Week 2: Complex Logic & More Events (Feb 9-15)
- [ ] Implement logic tree evaluator
- [ ] Build LogicTreeBuilder UI component
- [ ] Add Calendar and CRM webhook receivers
- [ ] Extend modals with logic builder
- **Milestone:** Complex AND/OR logic working for all services

### Week 3: Real-Time Evaluation (Feb 16-22)
- [ ] Build webhook processing infrastructure
- [ ] Implement real-time evaluation service
- [ ] Add Redis caching (if needed)
- [ ] Performance testing and optimization
- **Milestone:** Sub-5-second event-to-surface latency

### Week 4: Trigger Editing & Polish (Feb 23-27)
- [ ] Implement trigger editing APIs
- [ ] Add edit mode to modals
- [ ] Comprehensive testing across all flows
- [ ] Documentation and user guides
- **Milestone:** Release 1.4 complete, all flow control methods extended

---

## Success Metrics

### Functional Metrics
- ✅ All 3 flow control methods support event triggers
- ✅ Users can create AND/OR logic with 3+ conditions
- ✅ 95%+ webhook delivery success rate
- ✅ < 5 second latency for event-based triggers
- ✅ Trigger editing works without workflow disruption

### Usage Metrics (Target: 3 months post-release)
- 40% of triggers include event-based conditions
- 25% of triggers use complex logic (AND/OR)
- 15% of users edit triggers post-creation
- 80% reduction in "why didn't this wake?" support tickets

### Technical Metrics
- 99.9% webhook receiver uptime
- < 500ms database query time for trigger evaluation
- Zero data loss in webhook processing
- < 5% error rate in event matching

---

## Risk Assessment

### High Risk
**Webhook Reliability:** External services may have unreliable delivery
- *Mitigation:* Implement retry logic and fallback polling

**Performance at Scale:** Evaluating complex logic trees for 1000+ workflows
- *Mitigation:* Redis caching, indexed queries, batch processing

### Medium Risk
**Event Matching Complexity:** Users may create unmatchable conditions
- *Mitigation:* Validation rules, clear UI feedback, examples

**OAuth Token Expiration:** Service tokens expire, breaking webhooks
- *Mitigation:* Token refresh flow, user notifications

### Low Risk
**UI Complexity:** Logic builder may confuse non-technical users
- *Mitigation:* String-Tie natural language alternative (completed in 1.3)

---

## Effort Breakdown

### Feature 1: Event-Based Triggers - 32 hours
- Event trigger data models: 4h
- Webhook receivers (4 services): 12h
- Event matching logic: 6h
- UI components: 6h
- Testing: 4h

### Feature 2: Complex Logic (AND/OR) - 24 hours
- Logic tree type system: 4h
- Logic evaluator: 8h
- Visual logic builder UI: 8h
- Testing: 4h

### Feature 3: Real-Time Evaluation - 20 hours
- Webhook infrastructure: 6h
- Real-time evaluation service: 6h
- Signature validation: 4h
- Monitoring/debugging: 4h

### Feature 4: Trigger Editing (Bonus) - 16 hours
- Edit APIs: 4h
- Edit UI mode: 6h
- Audit logging: 3h
- Testing: 3h

**Total:** 92 hours (primary features) + 16 hours (bonus) = **108 hours**

**Note:** Estimate assumes 1.1-1.3 foundations are solid. If significant rework needed, add 20% contingency.

---

## Testing Strategy

### Unit Tests
- Logic tree evaluation correctness
- Event matching against filter configs
- Webhook signature validation

### Integration Tests
- End-to-end webhook delivery
- Multi-service event triggers
- Complex logic evaluation with real data

### User Acceptance Tests
- Create event trigger on all 3 flow control methods
- Build complex logic with 4+ conditions
- Edit triggers on existing flows
- Verify sub-5-second latency

### Load Tests
- 1000 concurrent webhook deliveries
- 5000 active trigger subscriptions
- Complex logic evaluation at scale

---

## Documentation Deliverables

1. **User Guides:**
   - "Setting Up Event Triggers" (with screenshots)
   - "Building Complex Logic" (with examples)
   - "Editing Triggers Without Waking Workflows"

2. **Developer Docs:**
   - Webhook Integration Guide (per service)
   - Logic Tree Data Structure Reference
   - Real-Time Evaluation Architecture

3. **API Documentation:**
   - Webhook receiver endpoints
   - Trigger editing endpoints
   - Event trigger schemas

---

## Database Migration Plan

**Release 1.4 Migration Script:** `supabase/migrations/20260202000000_release_1_4_extended_functionality.sql`

```sql
-- Add logic tree support
ALTER TABLE workflow_executions
  ADD COLUMN trigger_logic_tree JSONB,
  ADD COLUMN trigger_modified_at TIMESTAMPTZ,
  ADD COLUMN trigger_modified_by UUID REFERENCES users(id);

-- Same for workflow_step_states
ALTER TABLE workflow_step_states
  ADD COLUMN trigger_logic_tree JSONB,
  ADD COLUMN trigger_modified_at TIMESTAMPTZ,
  ADD COLUMN trigger_modified_by UUID REFERENCES users(id);

-- Webhook subscriptions table
CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  event_type TEXT NOT NULL,
  filter_config JSONB,
  subscription_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_subscriptions_workflow
  ON webhook_subscriptions(workflow_execution_id);
CREATE INDEX idx_webhook_subscriptions_service
  ON webhook_subscriptions(service, event_type);

-- RLS policies
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workflow subscriptions"
  ON webhook_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_executions we
      WHERE we.id = webhook_subscriptions.workflow_execution_id
      AND we.user_id = auth.uid()
    )
  );

-- Service role can manage all
CREATE POLICY "Service role can manage webhook subscriptions"
  ON webhook_subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

---

## Post-Release Support Plan

### Week 1-2 (Feb 28 - Mar 13)
- Daily monitoring of webhook delivery rates
- User feedback collection on logic builder UX
- Performance tuning based on production load
- Hot fixes for critical bugs

### Week 3-4 (Mar 14 - Mar 27)
- Comprehensive documentation updates
- Video tutorials for event triggers
- Support article: Common trigger patterns
- Gather feature requests for 1.5+

---

## Future Enhancements (Beyond 1.4)

**Not included in 1.4 scope:**
- Custom webhook triggers (user-defined endpoints)
- Trigger templates/presets for common patterns
- Machine learning trigger suggestions
- Multi-user trigger coordination (team triggers)
- Trigger analytics dashboard

These may be considered for 1.5+ based on user feedback and usage patterns.

---

## Approval & Sign-Off

**Prepared By:** Claude (AI Development Agent)
**Date:** November 13, 2025
**Status:** Awaiting approval

**Stakeholder Sign-Off:**
- [ ] Product Owner (Wes)
- [ ] Engineering Lead
- [ ] Design Review
- [ ] Release Manager

---

## Appendix: Example Use Cases

### Use Case 1: Complex Renewal Management
**Scenario:** High-value enterprise renewal approaching

**Trigger Logic:**
```
Snooze until:
  (Date trigger: 60 days before renewal)
  AND
  (
    (Gmail: Reply from CFO)
    OR
    (Calendar: Executive alignment meeting scheduled)
  )
```

**Business Value:** Automatically surfaces at optimal time when stakeholder engagement confirmed

### Use Case 2: Escalation with Fallback
**Scenario:** At-risk customer needs immediate attention

**Trigger Logic:**
```
Escalate if:
  (Date: 48 hours passed)
  AND
  (
    (Slack: No response from assigned CSM)
    OR
    (CRM: Health score dropped below 50)
  )
```

**Business Value:** Ensures no customer falls through cracks, automatic escalation path

### Use Case 3: Smart Skip Logic
**Scenario:** Low-priority follow-up task

**Trigger Logic:**
```
Skip if:
  (Date: Friday 5pm)
  OR
  (
    (CRM: Deal marked closed-lost)
    AND
    (Gmail: Out of office auto-reply received)
  )
```

**Business Value:** Reduces busy work, focuses attention on active opportunities

---

**End of Proposal**
