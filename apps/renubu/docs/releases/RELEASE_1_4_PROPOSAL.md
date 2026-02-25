# Release 1.4: Event-Driven Automation & String-Tie - Proposal

**Version:** 1.4
**Name:** Event-Driven Automation & String-Tie
**Status:** Proposed
**Proposed Timeline:** Feb 2 - Mar 20, 2026 (6+ weeks)
**Prerequisites:** Releases 1.1, 1.2, 1.3 must be complete

---

## Executive Summary

Release 1.4 introduces **two major new capabilities** that extend the platform's automation and workflow management:

1. **Event-Driven Workflow Launcher** - Automatically create workflows when real-world events occur
2. **String-Tie Standalone Reminder System** - Voice-first, LLM-powered personal reminders
3. **Review Rejection Enhancement** - Complete the review workflow with rejection capability

This release shifts focus from enhancing existing flow control (Snooze/Skip/Review) to **proactive automation** - workflows that launch themselves based on conditions, and lightweight reminders that exist independently of workflows.

---

## Strategic Rationale

### Why This Scope?

**The Pivot:**
After reviewing initial proposals for Release 1.4 (event triggers for snooze/skip/escalate), we identified that **automatic workflow launching** provides more value than extending existing flow control methods.

**Vision:**
- **Reactive:** User creates workflow, manually moves through steps
- **Proactive:** System detects conditions and launches workflows automatically
- **Personal:** Lightweight reminders that don't require full workflow overhead

**Example Use Cases:**
- "If Sarah sends me an email, automatically launch 'Executive Outreach' workflow"
- "If customer stops logging in for 7 days, launch 'At-Risk Customer' workflow"
- "Remind me about X" (without creating a full workflow)

### Business Value

**Current State (Post 1.3):**
- Manual workflow creation only
- Automatic scoring provides some prioritization
- No lightweight reminder system

**Gap:**
- Can't trigger workflows based on external events
- No "If this, then that" automation
- Personal reminders require creating full workflows (overkill)

**1.4 Value Proposition:**
- **Proactive automation:** System works for you, not the other way around
- **Integration-driven:** Connects external events to workflow actions
- **Lightweight reminders:** Quick personal tasks without workflow overhead

---

## Features

### Feature 1: Event-Driven Workflow Launcher
**Effort:** 50 hours
**Priority:** 1 (Highest)

Enable automatic workflow creation when specified conditions are met.

#### Core Concept
**Pattern:** "When [person/company] does [event] → Launch [workflow]"

**Examples:**
- "When Sarah (CFO) sends me an email → Launch 'Executive Outreach' workflow"
- "When customer hasn't logged in for 7 days → Launch 'At-Risk Customer' workflow"
- "When deal stage changes to 'Negotiation' → Launch 'Contract Prep' workflow"
- "When mentioned in Slack #escalations → Launch 'Support Triage' workflow"

#### Event Sources

**SQL Query** (Custom Condition)
- User writes SQL query that returns boolean
- Evaluated on schedule (e.g., every 15 minutes)
- Example: "SELECT COUNT(*) = 0 FROM logins WHERE user_id = X AND created_at > NOW() - INTERVAL '7 days'"

**Slack** (via MCP)
- New message in channel
- Direct message received
- Mention in channel/thread
- Reaction added to message

**Gmail**
- New email from specific sender
- Email matching subject/body keywords
- Reply received to thread
- Email forwarded

**Google Calendar**
- Event starts/ends
- New event created
- Attendee responds (accept/decline)
- Event canceled

**CRM** (Salesforce/HubSpot)
- Field value changes (e.g., deal stage)
- Record created/updated
- Note/activity added
- Ownership changed

**Email** (General IMAP/SMTP)
- Generic email conditions
- Multiple account support

#### Logic Capabilities

**Simple 2-Condition Logic:**
- Maximum 2 conditions per automation rule
- Either **AND** or **OR** operator (no nesting)
- Visual preview: "When [Condition 1] AND [Condition 2] → Launch [Workflow]"

**Examples:**
- "Gmail from Sarah AND Calendar meeting scheduled → Launch workflow"
- "SQL query returns true OR Slack message received → Launch workflow"

**Why Limited Complexity?**
- Simpler to understand and debug
- Covers 90% of use cases
- Can create multiple rules for complex scenarios

#### Technical Architecture

**Database Schema:**
```sql
-- Automation rules table
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  workflow_template_id UUID REFERENCES workflow_templates(id),
  name TEXT NOT NULL,
  description TEXT,

  -- Event conditions (max 2, with AND/OR)
  event_conditions JSONB NOT NULL,
  logic_operator TEXT CHECK (logic_operator IN ('AND', 'OR')),

  -- Workflow launch config
  assign_to_user_id UUID REFERENCES users(id), -- Who gets the workflow

  -- Status and tracking
  is_active BOOLEAN DEFAULT true,
  trigger_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trail for triggered workflows
CREATE TABLE automation_rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
  workflow_execution_id UUID REFERENCES workflow_executions(id),
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  trigger_conditions JSONB, -- Snapshot of conditions that fired
  success BOOLEAN,
  error_message TEXT
);

CREATE INDEX idx_automation_rules_user ON automation_rules(user_id);
CREATE INDEX idx_automation_rules_active ON automation_rules(is_active);
CREATE INDEX idx_automation_rule_executions_rule ON automation_rule_executions(automation_rule_id);
```

**Event Condition Schema (JSONB):**
```typescript
interface EventCondition {
  source: 'sql' | 'slack' | 'gmail' | 'calendar' | 'crm' | 'email';
  config: {
    // SQL
    query?: string;

    // Slack
    channel_id?: string;
    message_pattern?: string;

    // Gmail
    sender_email?: string;
    subject_pattern?: string;

    // Calendar
    event_type?: 'start' | 'end' | 'create' | 'cancel';
    calendar_id?: string;

    // CRM
    object_type?: 'deal' | 'contact' | 'company';
    field_name?: string;
    field_value?: string;
  };
}

interface AutomationRule {
  id: string;
  user_id: string;
  workflow_template_id: string;
  name: string;
  description?: string;
  event_conditions: [EventCondition] | [EventCondition, EventCondition];
  logic_operator?: 'AND' | 'OR'; // Only if 2 conditions
  assign_to_user_id?: string;
  is_active: boolean;
  trigger_count: number;
  last_triggered_at?: string;
}
```

**Service Layer:**
```typescript
// src/lib/services/AutomationRuleService.ts
export class AutomationRuleService {
  // CRUD operations
  static async createRule(rule: CreateAutomationRuleInput): Promise<AutomationRule>
  static async updateRule(ruleId: string, updates: Partial<AutomationRule>): Promise<AutomationRule>
  static async deleteRule(ruleId: string): Promise<void>
  static async toggleActive(ruleId: string, isActive: boolean): Promise<void>
  static async listRules(userId: string): Promise<AutomationRule[]>

  // Evaluation and execution
  static async evaluateAllRules(): Promise<EvaluationResult[]> // Cron job
  static async evaluateRuleByEvent(event: ExternalEvent): Promise<void> // Webhook
  static async launchWorkflow(rule: AutomationRule): Promise<WorkflowExecution>

  // Condition evaluation
  static async evaluateSQLCondition(condition: EventCondition): Promise<boolean>
  static async evaluateSlackCondition(condition: EventCondition, event: SlackEvent): Promise<boolean>
  static async evaluateGmailCondition(condition: EventCondition, event: GmailEvent): Promise<boolean>
  static async evaluateCalendarCondition(condition: EventCondition, event: CalendarEvent): Promise<boolean>
  static async evaluateCRMCondition(condition: EventCondition, event: CRMEvent): Promise<boolean>
}
```

**API Endpoints:**
```
POST   /api/automation/rules              Create new automation rule
GET    /api/automation/rules              List user's automation rules
GET    /api/automation/rules/:id          Get specific rule details
PATCH  /api/automation/rules/:id          Update automation rule
DELETE /api/automation/rules/:id          Delete automation rule
POST   /api/automation/rules/:id/toggle   Toggle active status

POST   /api/automation/evaluate           Manual evaluation trigger (admin)
POST   /api/automation/webhooks/slack     Slack event receiver
POST   /api/automation/webhooks/gmail     Gmail event receiver
POST   /api/automation/webhooks/calendar  Calendar event receiver
POST   /api/automation/webhooks/crm       CRM event receiver
```

**UI Components:**

1. **Automation Rules Dashboard** (`/automation-rules`)
   - List of all automation rules
   - Active/Inactive toggle
   - Create button, Edit/Delete actions
   - Trigger count and last triggered timestamp
   - Filter by active status

2. **Automation Rule Builder Modal**
   - Workflow template selector dropdown
   - Condition 1 builder:
     - Event source selector (6 types)
     - Event-specific configuration form
   - "Add Second Condition" button (optional)
   - Logic operator toggle (AND/OR) - only appears if 2 conditions
   - Condition 2 builder (if added)
   - Preview text: "When [condition 1] AND [condition 2] → Launch [workflow]"
   - Assign to user selector (defaults to rule creator)
   - Save/Cancel buttons

3. **Event Source Configuration Forms**
   - SQL: Code editor with syntax highlighting, test query button
   - Slack: Channel picker, message pattern input
   - Gmail: Email address input, subject/body pattern
   - Calendar: Calendar picker, event type selector
   - CRM: Object type, field name, field value
   - Email: Account selector, pattern inputs

**Evaluation Strategy:**

**Cron-Based (SQL, periodic checks):**
- Supabase Edge Function runs every 5-15 minutes
- Evaluates SQL-based conditions
- Checks for event conditions that haven't been evaluated

**Webhook-Based (Real-time events):**
- External services send webhooks to our endpoints
- Signature validation for security
- Immediate evaluation and workflow launch
- Target latency: < 5 seconds from event to workflow

**Integration with Automatic Scoring:**
- Workflows launched via automation get unique trigger ID
- Stored in `workflow_executions.trigger_source = 'automation_rule'`
- `workflow_executions.automation_rule_id` references the rule
- Scoring system can prioritize automated workflows differently

---

### Feature 2: String-Tie Standalone Reminder System
**Effort:** 50 hours
**Priority:** 2

Voice-first, LLM-powered personal reminder system completely separate from workflows.

#### Core Concept

**What is a String Tie?**
A lightweight reminder that "ties a string around your finger" to remember something later.

**Key Principles:**
- Separate from task mode and workflows
- Voice-first interface (but text input supported)
- LLM parses natural language
- NO follow-up questions (use defaults)
- Lives on its own dashboard page

**Magic Snippet: "TIE_A_STRING"**
- Global recognition in any chat/conversation
- Type "TIE_A_STRING" → automatically triggers reminder creation
- Next text gets parsed by LLM as reminder
- Works anywhere in the system

#### Technical Architecture

**Database Schema:**
```sql
-- String ties table
CREATE TABLE string_ties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,

  -- Content
  content TEXT NOT NULL,           -- Original input
  reminder_text TEXT NOT NULL,     -- LLM-parsed reminder description

  -- Timing
  remind_at TIMESTAMPTZ NOT NULL,  -- When to surface the reminder
  reminded BOOLEAN DEFAULT false,  -- Has it been shown?
  dismissed_at TIMESTAMPTZ,        -- When user dismissed it

  -- Metadata
  source TEXT CHECK (source IN ('manual', 'chat_magic_snippet', 'voice')),
  default_offset_minutes INTEGER,  -- User's default (snapshot)

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings for string tie defaults
ALTER TABLE user_settings ADD COLUMN string_tie_default_offset_minutes INTEGER DEFAULT 60;

CREATE INDEX idx_string_ties_user ON string_ties(user_id);
CREATE INDEX idx_string_ties_remind_at ON string_ties(remind_at) WHERE NOT reminded;
CREATE INDEX idx_string_ties_active ON string_ties(user_id, reminded) WHERE NOT reminded;
```

**Type Definitions:**
```typescript
// src/types/string-ties.ts
export interface StringTie {
  id: string;
  user_id: string;
  content: string;           // "Remind me to call Sarah next week"
  reminder_text: string;     // "Call Sarah"
  remind_at: string;         // ISO timestamp
  reminded: boolean;
  dismissed_at?: string;
  source: 'manual' | 'chat_magic_snippet' | 'voice';
  default_offset_minutes: number;
  created_at: string;
}

export interface CreateStringTieInput {
  content: string;
  source: StringTie['source'];
}

export interface ParsedReminder {
  reminderText: string;
  offsetMinutes: number;
}
```

**LLM Integration:**
```typescript
// src/lib/services/StringTieParser.ts
export class StringTieParser {
  /**
   * Parse natural language input into structured reminder
   * Examples:
   *   "remind me to call Sarah in 2 hours" → {reminderText: "call Sarah", offsetMinutes: 120}
   *   "follow up with client tomorrow" → {reminderText: "follow up with client", offsetMinutes: 1440}
   *   "check on project status" → {reminderText: "check on project status", offsetMinutes: <default>}
   */
  static async parse(
    input: string,
    defaultOffsetMinutes: number
  ): Promise<ParsedReminder> {
    const prompt = `Parse this reminder request into structured format.

Input: "${input}"

Extract:
1. reminderText: The action to remember (short phrase, no time info)
2. offsetMinutes: Minutes from now (if not specified, use ${defaultOffsetMinutes})

Time parsing examples:
- "in 2 hours" = 120 minutes
- "tomorrow" = 1440 minutes
- "next week" = 10080 minutes
- "in 30 minutes" = 30 minutes

Return ONLY valid JSON:
{
  "reminderText": "...",
  "offsetMinutes": number
}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    });

    return JSON.parse(response.content[0].text);
  }
}
```

**Service Layer:**
```typescript
// src/lib/services/StringTieService.ts
export class StringTieService {
  static async create(
    userId: string,
    input: CreateStringTieInput
  ): Promise<StringTie> {
    // Get user's default offset
    const userSettings = await getUserSettings(userId);
    const defaultOffset = userSettings.string_tie_default_offset_minutes || 60;

    // Parse with LLM
    const parsed = await StringTieParser.parse(input.content, defaultOffset);

    // Calculate remind_at time
    const remindAt = new Date(Date.now() + parsed.offsetMinutes * 60 * 1000);

    // Insert into database
    return await db.insert('string_ties', {
      user_id: userId,
      content: input.content,
      reminder_text: parsed.reminderText,
      remind_at: remindAt,
      source: input.source,
      default_offset_minutes: defaultOffset
    });
  }

  static async list(userId: string, includeReminded: boolean = false): Promise<StringTie[]>
  static async dismiss(stringTieId: string): Promise<void>
  static async snooze(stringTieId: string, additionalMinutes: number): Promise<StringTie>

  // Cron job: Check for due reminders
  static async evaluateDueReminders(): Promise<void> {
    const dueReminders = await db.query(`
      SELECT * FROM string_ties
      WHERE reminded = false
      AND remind_at <= NOW()
    `);

    // Surface each reminder (notification, dashboard, etc.)
    for (const reminder of dueReminders) {
      await this.surfaceReminder(reminder);
      await db.update('string_ties', reminder.id, { reminded: true });
    }
  }

  static async surfaceReminder(reminder: StringTie): Promise<void> {
    // Show in user's dashboard
    // Send notification (if enabled)
    // Add to "active reminders" queue
  }
}
```

**API Endpoints:**
```
POST   /api/string-ties        Create new string tie
GET    /api/string-ties        List user's string ties
DELETE /api/string-ties/:id    Dismiss string tie
POST   /api/string-ties/:id/snooze  Snooze for additional time
POST   /api/string-ties/parse  Parse natural language (preview)
```

**UI Components:**

1. **String-Tie Dashboard Page** (`/string-ties`)
   - Header: "My String Ties" with tie icon
   - "+ New String Tie" button (prominent, with microphone icon)
   - List of active string ties:
     - Reminder text
     - Remind time (relative: "in 2 hours", absolute: "Mar 15 at 3:00 PM")
     - Dismiss button
     - Snooze dropdown (15 min, 1 hour, 1 day, custom)
   - Tabs: "Active" | "Dismissed" (history)

2. **String-Tie Creation Modal**
   - Large microphone button (primary action)
     - Click to start voice recording
     - Shows waveform while recording
     - Auto-submit when done
   - Text input field (secondary)
     - Placeholder: "Remind me to..."
     - Submit button or Enter key
   - LLM processing indicator:
     - "Parsing your reminder..."
     - Shows spinner
   - Preview before save:
     - "Remind you: [parsed text]"
     - "At: [calculated time]"
     - Edit button (if parsing incorrect)
   - Save/Cancel buttons

3. **Magic Snippet Detection**
   - Global JavaScript listener in chat interfaces
   - Detect "TIE_A_STRING" text
   - Intercept and trigger string-tie modal
   - Pre-fill with subsequent text if present

4. **User Settings Integration**
   - Settings > String-Tie Preferences
   - Default reminder time:
     - Dropdown: 15 min, 30 min, 1 hour, 2 hours, 1 day, 1 week
     - Custom input (minutes)
   - Notification preferences
   - Voice input settings

**Voice Dictation Implementation:**

**Option A: Web Speech API (Browser Native)**
```typescript
// src/lib/hooks/useSpeechRecognition.ts
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const start = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
    };

    recognition.start();
    setIsListening(true);
  };

  return { isListening, transcript, start };
}
```

**Option B: Third-Party Service (Deepgram, AssemblyAI)**
- More accurate, language support
- Additional cost consideration
- Fallback to Option A if service unavailable

**Notification Strategy:**
- In-app: Badge on dashboard, prominent banner
- Email: Optional, configurable per reminder
- Push: Browser notifications (if enabled)
- Slack: Integration to send DM (if connected)

**Edge Cases Handled:**
- Ambiguous time: Use default
- Past time: Default to future (e.g., "tomorrow at 3pm" not "today at 3pm")
- Invalid input: Show error, ask for re-input
- LLM failure: Fall back to treating entire input as reminder text, use default time

---

### Feature 3: Review Rejection Enhancement
**Effort:** 20 hours
**Priority:** 3

Complete the review workflow by adding rejection capability with comments and iteration tracking.

#### Current State (Phase 1.2)

**Review Mode Behavior:**
- Workflow/step escalated to reviewer
- Workflow **stays in original user's ownership** but suspended
- Reviewer can "Approve" → resumes workflow
- NO rejection option currently

**Gap:** What if reviewer doesn't approve?
- Currently must manually communicate outside system
- No formal rejection process
- No iteration tracking

#### Proposed Enhancement

**Rejection Flow:**
1. Reviewer sees "Approve" and "Reject" buttons
2. Click "Reject" → Modal prompts for required comments
3. On reject:
   - Workflow remains in `review_status = 'rejected'` (new status)
   - Returns to original user's queue (still suspended)
   - Rejection comments stored in history
   - Increment `review_iteration` counter
4. Original user sees:
   - Clear indicator: "Rejected by [Reviewer Name]"
   - Rejection comments displayed prominently
   - Button: "Address & Re-Submit for Review"
5. User addresses issues, clicks "Re-Submit"
6. Workflow:
   - `review_status` reset to `pending`
   - `review_iteration` incremented (1 → 2)
   - Re-assigned to same reviewer
7. Reviewer sees "Iteration 2" badge with rejection history

#### Technical Implementation

**Database Schema Changes:**
```sql
-- Add review iteration tracking
ALTER TABLE workflow_executions
  ADD COLUMN review_iteration INTEGER DEFAULT 1,
  ADD COLUMN review_rejection_history JSONB DEFAULT '[]'::jsonb;

ALTER TABLE workflow_step_states
  ADD COLUMN review_iteration INTEGER DEFAULT 1,
  ADD COLUMN review_rejection_history JSONB DEFAULT '[]'::jsonb;

-- Extend review_status enum
ALTER TYPE review_status ADD VALUE IF NOT EXISTS 'rejected';
```

**Rejection History Schema (JSONB):**
```typescript
interface RejectionHistoryEntry {
  iteration: number;
  rejected_at: string; // ISO timestamp
  reviewer_id: string;
  reviewer_name: string;
  comments: string;
}

// Example:
{
  review_rejection_history: [
    {
      iteration: 1,
      rejected_at: "2026-02-15T14:30:00Z",
      reviewer_id: "uuid...",
      reviewer_name: "Sarah Chen",
      comments: "Please add more context about the customer's pain points before proceeding."
    },
    {
      iteration: 2,
      rejected_at: "2026-02-16T09:15:00Z",
      reviewer_id: "uuid...",
      reviewer_name: "Sarah Chen",
      comments: "Budget approval still missing from notes."
    }
  ]
}
```

**Service Layer Updates:**
```typescript
// src/lib/services/WorkflowEscalateService.ts
export class WorkflowEscalateService {
  // ... existing methods ...

  /**
   * Reject workflow with comments, keep in original user's queue
   */
  static async rejectWorkflow(
    workflowId: string,
    reviewerId: string,
    comments: string
  ): Promise<void> {
    const workflow = await db.getWorkflowExecution(workflowId);

    // Append to rejection history
    const rejectionEntry = {
      iteration: workflow.review_iteration,
      rejected_at: new Date().toISOString(),
      reviewer_id: reviewerId,
      reviewer_name: await getUserName(reviewerId),
      comments
    };

    await db.update('workflow_executions', workflowId, {
      review_status: 'rejected',
      reviewed_at: new Date(),
      review_rejection_history: [
        ...(workflow.review_rejection_history || []),
        rejectionEntry
      ]
    });

    // Notify original user
    await NotificationService.send(workflow.user_id, {
      type: 'workflow_rejected',
      workflow_id: workflowId,
      reviewer_name: rejectionEntry.reviewer_name,
      comments
    });
  }

  /**
   * Re-submit workflow after addressing rejection
   */
  static async resubmitWorkflow(workflowId: string): Promise<void> {
    const workflow = await db.getWorkflowExecution(workflowId);

    await db.update('workflow_executions', workflowId, {
      review_status: 'pending',
      review_iteration: workflow.review_iteration + 1,
      reviewed_at: null
    });

    // Notify reviewer of re-submission
    await NotificationService.send(workflow.reviewer_id, {
      type: 'workflow_resubmitted',
      workflow_id: workflowId,
      iteration: workflow.review_iteration + 1
    });
  }

  // Same for step-level
  static async rejectStep(executionId: string, stepId: string, reviewerId: string, comments: string): Promise<void>
  static async resubmitStep(executionId: string, stepId: string): Promise<void>
}
```

**API Endpoints:**
```
POST /api/workflows/:id/review/reject          Reject workflow with comments
POST /api/workflows/:id/review/resubmit        Re-submit after addressing

POST /api/workflows/executions/:executionId/steps/:stepId/review/reject    Reject step
POST /api/workflows/executions/:executionId/steps/:stepId/review/resubmit  Re-submit step
```

**UI Component Updates:**

1. **EnhancedEscalateModal** (Reviewer View)
   - Current: Only "Approve" button
   - Add: "Reject" button (RED theme, secondary action)
   - On click "Reject":
     - Show textarea for required comments
     - Validation: Must enter at least 10 characters
     - Confirm button: "Submit Rejection"
   - Show iteration badge if > 1: "Iteration 2"
   - Show rejection history accordion:
     - Previous rejections listed
     - Reviewer name, date, comments
     - Collapsible to save space

2. **TaskModeFullscreen** (Original User View)
   - When `review_status === 'rejected'`:
     - Show alert banner at top (RED/orange background):
       - "This workflow was rejected by [Reviewer Name]"
       - Display rejection comments prominently
       - Button: "View Rejection History" (if multiple)
     - Replace standard buttons with:
       - Primary: "Address & Re-Submit for Review"
       - Secondary: "Edit Workflow" (if needed)
   - On click "Address & Re-Submit":
     - Confirmation modal:
       - "Are you ready to re-submit for review?"
       - "Make sure you've addressed the reviewer's feedback"
     - Call resubmitWorkflow API
     - Show success toast
     - Workflow stays suspended but marked for re-review

3. **WorkflowCard** (List Views)
   - If rejected:
     - Badge: "Rejected" (RED)
     - Iteration count if > 1: "Iteration 2"
   - If pending review after rejection:
     - Badge: "Re-Submitted" (YELLOW/ORANGE)

4. **Rejection History Component** (Shared)
   - Accordion/expandable list
   - Each entry shows:
     - Iteration number
     - Reviewer name and avatar
     - Rejection date (relative time)
     - Comments (full text)
   - Visual timeline if multiple iterations

**Notification Strategy:**
- **On Rejection:** Email + in-app notification to original user
- **On Re-submission:** Email + in-app notification to reviewer
- **Slack Integration:** Optional DM to notify rejection/resubmission

---

## Implementation Sequence

### Phase 1: Database & Foundation (Week 1)
**Effort:** 16 hours

- [ ] Create automation_rules and automation_rule_executions tables
- [ ] Create string_ties table
- [ ] Add review rejection columns (review_iteration, review_rejection_history)
- [ ] Create type definitions:
  - `src/types/automation-rules.ts`
  - `src/types/string-ties.ts`
  - Update `src/types/escalate-triggers.ts` with rejection types
- [ ] Database migration script: `20260202000000_release_1_4_automation_string_tie.sql`

### Phase 2: Event-Driven Workflow Launcher - Backend (Week 2-3)
**Effort:** 24 hours

- [ ] Build AutomationRuleService:
  - CRUD operations
  - Evaluation engine for SQL conditions
  - Webhook event handlers (Slack, Gmail, Calendar, CRM)
  - Workflow launch logic
- [ ] Create API endpoints:
  - `/api/automation/rules/*` (CRUD)
  - `/api/automation/webhooks/*` (event receivers)
- [ ] Implement event evaluators:
  - SQL query evaluator
  - Slack event matcher
  - Gmail event matcher
  - Calendar event matcher
  - CRM event matcher
- [ ] Create Supabase Edge Function: `daily-automation-evaluation`
- [ ] Unit tests for service layer

### Phase 3: Event-Driven Workflow Launcher - Frontend (Week 3-4)
**Effort:** 26 hours

- [ ] Build Automation Rules Dashboard (`/automation-rules`)
  - List view with active/inactive toggle
  - Create/Edit/Delete actions
  - Trigger count display
- [ ] Build Automation Rule Builder Modal:
  - Workflow template selector
  - Event source selector
  - Condition configuration forms (6 event types)
  - Logic operator toggle (AND/OR)
  - Preview text generation
- [ ] Event source configuration components:
  - SQL query editor with syntax highlighting
  - Slack channel picker
  - Gmail sender/pattern inputs
  - Calendar event type selector
  - CRM field selector
  - Email pattern inputs
- [ ] Integration tests for rule creation flow
- [ ] Polish and error handling

### Phase 4: String-Tie - Backend (Week 4-5)
**Effort:** 20 hours

- [ ] Build StringTieParser LLM integration:
  - Natural language parsing
  - Time offset extraction
  - Default handling
- [ ] Build StringTieService:
  - Create with LLM parsing
  - List active reminders
  - Dismiss and snooze
  - Cron job for evaluation
- [ ] Create API endpoints:
  - `/api/string-ties/*`
- [ ] Supabase Edge Function: `evaluate-string-ties`
- [ ] Unit tests for parser and service

### Phase 5: String-Tie - Frontend (Week 5-6)
**Effort:** 30 hours

- [ ] Build String-Tie Dashboard (`/string-ties`)
  - List view of active reminders
  - Dismissed history tab
  - Reminder actions (dismiss, snooze)
- [ ] Build String-Tie Creation Modal:
  - Microphone button with recording UI
  - Text input alternative
  - LLM processing indicator
  - Preview before save
- [ ] Implement voice dictation:
  - Web Speech API integration
  - Recording UI and controls
  - Error handling and fallbacks
- [ ] Magic snippet detection:
  - Global listener for "TIE_A_STRING"
  - Auto-trigger modal
  - Pre-fill subsequent text
- [ ] User settings for defaults:
  - Default time offset selector
  - Notification preferences
- [ ] Notification integration:
  - In-app banner
  - Email (optional)
  - Browser push (optional)
- [ ] Integration tests for voice → parse → save flow

### Phase 6: Review Rejection Enhancement (Week 6)
**Effort:** 20 hours

- [ ] Update WorkflowEscalateService:
  - `rejectWorkflow()` method
  - `resubmitWorkflow()` method
  - Step-level rejection
- [ ] Create rejection API endpoints
- [ ] Update EnhancedEscalateModal:
  - Add "Reject" button
  - Rejection comments modal
  - Iteration badge
  - Rejection history accordion
- [ ] Update TaskModeFullscreen:
  - Rejection alert banner
  - "Address & Re-Submit" button
  - Re-submission confirmation
- [ ] Update WorkflowCard components:
  - Rejected badge
  - Iteration count display
- [ ] Build RejectionHistory component
- [ ] Notification integration
- [ ] End-to-end testing

### Phase 7: Polish, Testing & Documentation (Week 7-8)
**Effort:** 10 hours

- [ ] Comprehensive integration testing
- [ ] Performance testing (automation rule evaluation at scale)
- [ ] Bug fixes and edge case handling
- [ ] User documentation:
  - Automation rules guide
  - String-tie usage guide
  - Review rejection workflow
- [ ] Developer documentation:
  - API reference updates
  - Webhook integration guide
  - Database schema documentation

---

## Success Metrics

### Event-Driven Workflow Launcher

**Functional:**
- ✅ Can create automation rules with all 6 event sources
- ✅ 2-condition AND/OR logic works correctly
- ✅ Workflows launch automatically when conditions met
- ✅ < 5 minute latency for cron-based evaluation (SQL)
- ✅ < 1 minute latency for webhook-based evaluation (Slack, Gmail, etc.)
- ✅ Audit trail complete for all triggered workflows

**Usage (Target: 3 months post-release):**
- 30% of active users create at least 1 automation rule
- 50 automation rules created per 100 active users
- 80% of automation rules use single condition (simplicity)
- 20% use 2-condition logic
- Most popular event source: Gmail (predicted)

### String-Tie Standalone

**Functional:**
- ✅ Voice dictation creates reminder in < 3 seconds
- ✅ LLM parsing 90%+ accuracy on test set
- ✅ Magic snippet "TIE_A_STRING" works in all chat contexts
- ✅ Reminders surface at correct time (< 1 minute accuracy)
- ✅ No follow-up questions asked (uses defaults)

**Usage (Target: 3 months post-release):**
- 60% of active users create at least 1 string tie
- Average 5 string ties per user per week
- 70% created via voice (vs text)
- 15% created via magic snippet
- 85% dismissed within 1 hour of surfacing (engaged with)

### Review Rejection Enhancement

**Functional:**
- ✅ Reviewers can reject with comments
- ✅ Rejected workflows return to original user correctly
- ✅ Re-submission increments iteration counter
- ✅ Full rejection history preserved and displayed
- ✅ Notifications sent on reject and re-submit

**Usage (Target: 3 months post-release):**
- 25% of reviews result in rejection (healthy iteration)
- 90% of rejected workflows re-submitted within 24 hours
- Average 1.3 iterations per reviewed workflow
- < 5% require 3+ iterations (indicating clear feedback)

---

## Risk Assessment

### High Risk

**LLM Parsing Accuracy (String-Tie):**
- Risk: Users get incorrect reminders due to parsing errors
- Impact: Frustration, loss of trust
- Mitigation:
  - Preview before save (user can edit)
  - Fallback to defaults for ambiguity
  - Feedback loop: Learn from corrections

**Webhook Reliability (Automation):**
- Risk: External services don't deliver webhooks reliably
- Impact: Automations don't fire, workflows not launched
- Mitigation:
  - Fallback polling for critical events
  - Retry logic with exponential backoff
  - Monitoring and alerting for webhook failures

### Medium Risk

**Voice Dictation Browser Support:**
- Risk: Web Speech API not available on all browsers
- Impact: Voice feature unavailable for some users
- Mitigation:
  - Feature detection, graceful fallback to text
  - Consider third-party service for broader support
  - Clear messaging about supported browsers

**Performance at Scale (Automation):**
- Risk: Evaluating 10,000+ automation rules takes too long
- Impact: Slow response times, timeouts
- Mitigation:
  - Indexed database queries
  - Batch processing with concurrency limits
  - Caching for frequently evaluated rules

### Low Risk

**UI Complexity (Automation Builder):**
- Risk: Users find condition builder confusing
- Impact: Low adoption of automation feature
- Mitigation:
  - Simple 2-condition limit
  - Clear examples and templates
  - Help text and tooltips

**Magic Snippet Conflicts:**
- Risk: "TIE_A_STRING" false positives in chat
- Impact: Unexpected modal pop-ups
- Mitigation:
  - Require exact match (case-sensitive)
  - Add confirmation step
  - User can disable in settings

---

## Effort Summary

### Total Effort: ~120 hours (6+ weeks)

**Feature 1: Event-Driven Workflow Launcher - 50 hours**
- Database and types: 6h
- Backend services and API: 24h
- Frontend dashboard and builder: 20h

**Feature 2: String-Tie Standalone - 50 hours**
- LLM integration: 8h
- Backend service and API: 12h
- Frontend dashboard and modal: 20h
- Voice dictation: 8h
- Magic snippet: 2h

**Feature 3: Review Rejection - 20 hours**
- Backend service updates: 6h
- API endpoints: 2h
- Frontend UI updates: 10h
- Testing: 2h

---

## Documentation Deliverables

### User Guides
1. **"Getting Started with Automation Rules"** - Step-by-step guide
2. **"Event Sources Explained"** - Deep dive on each of 6 sources
3. **"String-Tie Quick Start"** - Voice-first reminder tutorial
4. **"Review Workflow: Approval & Rejection"** - Complete review cycle guide

### Developer Docs
1. **Automation Rule Architecture** - Database, services, evaluation
2. **Webhook Integration Guide** - Per-service setup (Slack, Gmail, etc.)
3. **String-Tie LLM Parser** - Prompts, examples, extending
4. **API Reference Updates** - All new endpoints documented

### Video Tutorials
1. Creating your first automation rule (3 min)
2. Using String-Tie voice reminders (2 min)
3. Review workflow iteration (4 min)

---

## Post-Release Support

### Week 1-2 (Launch + Monitoring)
- Daily monitoring of:
  - Automation rule evaluation success rate
  - LLM parsing accuracy for string ties
  - Webhook delivery rates
  - Voice dictation usage and errors
- Hot fixes for critical bugs
- User feedback collection (in-app survey)

### Week 3-4 (Iteration)
- Performance tuning based on production data
- LLM prompt optimization if parsing issues
- UI/UX improvements based on user feedback
- Documentation updates with real-world examples

### Month 2-3 (Analytics & Planning)
- Usage analytics review
- Identify most popular automation patterns
- Consider template automation rules for common use cases
- Plan for 1.5+ based on feedback

---

## Future Enhancements (Beyond 1.4)

**Not included in 1.4 scope:**
- Automation rule templates/presets
- 3+ condition logic (nested complexity)
- Custom webhook endpoints (user-defined events)
- String-tie recurring reminders
- Team-level automation rules
- ML-powered automation suggestions
- String-tie snooze-to-workflow conversion
- Review workflow analytics dashboard

These may be prioritized for Release 1.5+ based on usage data and user feedback.

---

## Dependencies

### External Services
- **Anthropic API:** LLM parsing for String-Tie (Claude Sonnet)
- **Gmail API:** Event webhooks, OAuth
- **Slack API:** Event subscriptions, OAuth
- **Google Calendar API:** Push notifications, OAuth
- **Salesforce/HubSpot API:** Webhooks, OAuth
- **Supabase:** Database, Edge Functions, Auth

### Internal Dependencies
**Must Complete Before 1.4:**
- Release 1.1: Skip Enhanced ✓
- Release 1.2: Escalate Enhanced (now Review) ✓
- Release 1.3: String-Tie planning (scope adjusted)

**Leverages Existing:**
- OAuth integration infrastructure (from Phase 1.0)
- Workflow execution engine
- User settings system
- Notification system

---

## Approval & Sign-Off

**Prepared By:** Claude (AI Development Agent)
**Date:** November 13, 2025
**Status:** Approved for implementation

**Scope Confirmed:**
- ✅ Event-Driven Workflow Launcher (not trigger extensions)
- ✅ String-Tie as standalone (not integrated with existing flows)
- ✅ Review rejection complete workflow
- ✅ 6+ week timeline
- ✅ ~120 hour effort estimate

**Next Steps:**
1. ✅ Update planning documents (this file)
2. ⏳ Update SQL script with new features
3. ⏳ Commit and push documentation updates
4. ⏳ Begin Phase 1: Database & Foundation

---

**End of Proposal**
