# Release 1.4: Event-Driven Automation & String-Tie - Executive Summary

**Status:** Approved for Implementation
**Timeline:** Feb 2 - Mar 20, 2026 (6+ weeks)
**Total Effort:** ~120 hours
**Prerequisites:** Releases 1.1, 1.2, 1.3 complete

---

## What is Release 1.4?

Release 1.4 introduces **proactive automation** to the platform through three focused features:

1. **Event-Driven Workflow Launcher** - Automatically create workflows when external events occur
2. **String-Tie Standalone** - Voice-first, LLM-powered personal reminders (separate from workflows)
3. **Review Rejection Enhancement** - Complete review workflow with rejection capability

---

## The Pivot: From Flow Control Enhancement to Proactive Automation

### Original Proposal (Rejected)
- Add event triggers to Snooze/Skip/Review (extending existing features)
- Complex nested logic (AND/OR operators)
- Trigger editing capabilities
- Real-time webhook evaluation

**Why Changed:** This was "overkill" - adding complexity to existing features when what's really needed is **automatic workflow initiation**.

### New Direction (Approved)
- **Workflow Launcher:** "When [event] happens → Launch [workflow]" (proactive)
- **String-Tie:** Lightweight reminders without full workflow overhead
- **Review Rejection:** Complete the review cycle with formal rejection process

**Philosophy:** Move from "user drives everything" to "system works for user"

---

## Feature 1: Event-Driven Workflow Launcher (50 hours)

### Core Concept
**"When [person/company] does [event] → Launch [workflow]"**

**Examples:**
- "When Sarah (CFO) sends me an email → Launch 'Executive Outreach' workflow"
- "When customer hasn't logged in for 7 days → Launch 'At-Risk Customer' workflow"
- "When deal stage changes to 'Negotiation' → Launch 'Contract Prep' workflow"

### Event Sources (6 Types)
1. **SQL Query** - Custom database queries (e.g., "no logins in 7 days")
2. **Slack** (MCP) - Messages, mentions, DMs, reactions
3. **Gmail** - New emails, replies, specific senders
4. **Calendar** - Events start/end, attendee responses
5. **CRM** - Field changes, deal stages, ownership
6. **Email** (IMAP/SMTP) - General email conditions

### Logic Capabilities
- **Simple 2-Condition Max** (no nesting)
- **AND or OR operator** (not both)
- Example: "Gmail from Sarah AND Calendar meeting scheduled"

### Key Features
- **Automation Rules Dashboard** (`/automation-rules`) - Manage all automation rules
- **Visual Rule Builder** - Select event sources, configure conditions, preview logic
- **Active/Inactive Toggle** - Enable/disable rules without deleting
- **Audit Trail** - Track every workflow launched by automation
- **Integration with Scoring** - Automated workflows tagged with trigger source

### Evaluation Strategy
- **Cron-Based:** SQL queries evaluated every 5-15 minutes
- **Webhook-Based:** Real-time events (< 5 seconds latency) for Slack, Gmail, Calendar, CRM
- **Fault Tolerance:** Retry logic, fallback polling, monitoring

---

## Feature 2: String-Tie Standalone (50 hours)

### Core Concept
**Lightweight reminder system** - "Tie a string around your finger"

**Key Principles:**
- Separate from workflows (own dashboard page: `/string-ties`)
- Voice-first interface (microphone dictation)
- LLM parses natural language
- NO follow-up questions (uses defaults)

### Magic Snippet: "TIE_A_STRING"
- **Global recognition** in any chat/conversation
- Type "TIE_A_STRING" → automatically opens reminder creation
- LLM parses subsequent text
- Works everywhere in the system

### Examples
**Voice Input:** *"Remind me to call Sarah next week"*
- LLM parses → "Call Sarah" in 7 days

**Text Input:** *"follow up with client tomorrow"*
- LLM parses → "Follow up with client" in 1 day

**Magic Snippet:** *"TIE_A_STRING check on project status"*
- LLM parses → "Check on project status" in [default time]

### Technical Features
- **Voice Dictation:** Web Speech API (browser native) or third-party service
- **LLM Parsing:** Anthropic Claude Sonnet extracts reminder text and time offset
- **Default Time:** User-configurable (15 min, 1 hour, 1 day, etc.)
- **Notifications:** In-app banner, email (optional), browser push, Slack DM
- **Snooze/Dismiss:** Simple actions to manage reminders

### UI Components
- **String-Tie Dashboard** - List of active/dismissed reminders
- **Creation Modal** - Large microphone button (primary), text input (secondary)
- **User Settings** - Default time, notification preferences
- **Magic Snippet Listener** - Global JavaScript detection

---

## Feature 3: Review Rejection Enhancement (20 hours)

### Current State (Phase 1.2)
- Workflow escalated to reviewer
- Reviewer can only "Approve" → resumes workflow
- **Gap:** No rejection option

### Enhancement: Complete the Cycle

**Rejection Flow:**
1. Reviewer sees "Approve" and "Reject" buttons
2. Click "Reject" → Required comments modal
3. Workflow returns to original user (still suspended) with rejection details
4. Original user addresses feedback and clicks "Re-Submit"
5. Workflow increments iteration counter and goes back to reviewer
6. Reviewer sees iteration history and can approve/reject again

**Features:**
- **Rejection Comments** - Required feedback from reviewer
- **Iteration Tracking** - Counter shows how many review cycles
- **Rejection History** - Full audit trail of all rejections
- **Notifications** - Email + in-app on rejection and re-submission
- **UI Indicators** - Badges, banners, history accordion

**Benefits:**
- Formal feedback loop
- No external communication needed
- Transparency and accountability
- Quality improvement through iteration

---

## Business Value

### Current State (Post 1.3)
✅ Manual workflow creation
✅ Snooze/Skip/Review with basic triggers
✅ Automatic scoring for prioritization
❌ No automatic workflow initiation
❌ No lightweight reminder system
❌ No formal review rejection process

### Release 1.4 Value
✅ **Proactive Automation** - System creates workflows for you
✅ **Event-Driven** - Connects external systems to workflow actions
✅ **Lightweight Reminders** - Quick personal tasks without workflow overhead
✅ **Complete Review Cycle** - Formal rejection with feedback and iteration

**Result:** Transform from "user manages everything" to "system works for user"

---

## Example Use Cases

### Automation Rule: Executive Engagement
```
When: Gmail from sarah.chen@company.com
AND: Calendar meeting scheduled
→ Launch: "Executive Outreach" workflow
Assign to: Me
```

### Automation Rule: At-Risk Customer
```
When: SQL query returns TRUE
  (SELECT COUNT(*) = 0 FROM logins
   WHERE user_id = 'X' AND created_at > NOW() - INTERVAL '7 days')
→ Launch: "At-Risk Customer Intervention" workflow
Assign to: Customer Success Manager
```

### String-Tie: Voice Reminder
**Voice Input:** *"Remind me to prep for the board meeting on Friday morning"*
**System:** Creates reminder for Friday 9:00 AM → "Prep for board meeting"

### String-Tie: Magic Snippet
**In Slack Chat:** `TIE_A_STRING call vendor about invoice`
**System:** Opens modal, parses as reminder in [default time]

### Review Rejection: Workflow Iteration
1. User escalates "Enterprise Deal Prep" to manager for review
2. Manager rejects: "Missing budget approval documentation"
3. User adds budget docs, clicks "Re-Submit"
4. Manager approves → Workflow resumes
**Iteration:** 2 cycles, formal feedback loop

---

## Timeline

**Total Duration:** 6+ weeks (Feb 2 - Mar 20, 2026)

### Week 1: Database & Foundation
- Create all database tables (automation_rules, string_ties, review rejection columns)
- Type definitions and interfaces
- Migration scripts

### Week 2-3: Event-Driven Workflow Launcher - Backend
- AutomationRuleService with CRUD and evaluation
- Event evaluators (SQL, Slack, Gmail, Calendar, CRM, Email)
- API endpoints and webhook receivers
- Supabase Edge Function for cron evaluation

### Week 3-4: Event-Driven Workflow Launcher - Frontend
- Automation Rules Dashboard
- Rule Builder Modal with event source configuration
- Visual preview and logic builder
- Integration tests

### Week 4-5: String-Tie - Backend
- StringTieParser LLM integration
- StringTieService with create/list/dismiss/snooze
- API endpoints
- Supabase Edge Function for reminder evaluation

### Week 5-6: String-Tie - Frontend
- String-Tie Dashboard page
- Creation Modal with voice dictation
- Magic snippet global listener
- User settings integration
- Notification system

### Week 6: Review Rejection Enhancement
- WorkflowEscalateService updates (reject/resubmit methods)
- API endpoints for rejection flow
- EnhancedEscalateModal updates (Reject button, iteration badge, history)
- TaskModeFullscreen updates (rejection banner, re-submit button)
- End-to-end testing

### Week 7-8: Polish & Testing
- Comprehensive integration testing
- Performance optimization
- Bug fixes and edge cases
- Documentation (user guides, developer docs, video tutorials)

---

## Success Metrics

### Event-Driven Workflow Launcher

**Functional:**
- ✅ All 6 event sources working
- ✅ 2-condition AND/OR logic correct
- ✅ Workflows launch automatically
- ✅ < 5 min latency (cron), < 1 min (webhooks)
- ✅ Complete audit trail

**Usage (3 months post-release):**
- 30% of users create ≥1 automation rule
- 50 rules per 100 active users
- Gmail most popular event source
- 80% use single condition (simplicity wins)

### String-Tie Standalone

**Functional:**
- ✅ Voice creates reminder in < 3 seconds
- ✅ LLM parsing 90%+ accurate
- ✅ Magic snippet works globally
- ✅ Reminders surface on time (< 1 min accuracy)
- ✅ No follow-up questions

**Usage (3 months post-release):**
- 60% of users create ≥1 string tie
- Avg 5 string ties per user per week
- 70% created via voice
- 15% via magic snippet
- 85% dismissed within 1 hour (high engagement)

### Review Rejection Enhancement

**Functional:**
- ✅ Reject with comments works
- ✅ Workflows return to original user
- ✅ Re-submission increments iteration
- ✅ History preserved and visible
- ✅ Notifications sent

**Usage (3 months post-release):**
- 25% of reviews result in rejection (healthy iteration)
- 90% re-submitted within 24 hours
- Avg 1.3 iterations per workflow
- < 5% require 3+ iterations

---

## Risk Mitigation

**High Risk: LLM Parsing Accuracy**
- *Mitigation:* Preview before save, user can edit, fallback to defaults

**High Risk: Webhook Reliability**
- *Mitigation:* Retry logic, fallback polling, monitoring/alerts

**Medium Risk: Voice Browser Support**
- *Mitigation:* Feature detection, fallback to text, consider third-party service

**Medium Risk: Performance at Scale**
- *Mitigation:* Indexed queries, batch processing, caching

---

## Database Changes

### New Tables

**automation_rules:**
- `id`, `user_id`, `workflow_template_id`
- `name`, `description`
- `event_conditions` (JSONB - max 2)
- `logic_operator` (AND/OR)
- `assign_to_user_id`
- `is_active`, `trigger_count`, `last_triggered_at`

**automation_rule_executions:**
- Audit trail for every triggered workflow
- `automation_rule_id`, `workflow_execution_id`
- `triggered_at`, `trigger_conditions`, `success`

**string_ties:**
- `id`, `user_id`
- `content` (original input), `reminder_text` (LLM parsed)
- `remind_at`, `reminded`, `dismissed_at`
- `source` (manual/chat_magic_snippet/voice)

### Extended Tables

**workflow_executions & workflow_step_states:**
- Add `review_iteration` (integer, default 1)
- Add `review_rejection_history` (JSONB array)

**user_settings:**
- Add `string_tie_default_offset_minutes` (integer, default 60)

---

## Documentation Deliverables

**User Guides:**
1. Getting Started with Automation Rules
2. Event Sources Explained (deep dive on 6 types)
3. String-Tie Quick Start (voice-first tutorial)
4. Review Workflow: Approval & Rejection

**Developer Docs:**
1. Automation Rule Architecture
2. Webhook Integration Guide (per-service setup)
3. String-Tie LLM Parser (prompts, extending)
4. API Reference Updates (all new endpoints)

**Video Tutorials:**
1. Creating your first automation rule (3 min)
2. Using String-Tie voice reminders (2 min)
3. Review workflow iteration (4 min)

---

## Post-Release

**Week 1-2:** Monitoring (automation success rate, LLM accuracy, webhook delivery), hot fixes
**Week 3-4:** Performance tuning, LLM prompt optimization, UI improvements
**Month 2-3:** Usage analytics, identify popular patterns, plan templates for 1.5+

---

## Future Enhancements (Beyond 1.4)

**Not Included:**
- Automation rule templates/presets
- 3+ condition logic (nested complexity)
- Custom webhook endpoints
- String-tie recurring reminders
- Team-level automation rules
- ML-powered automation suggestions
- String-tie → workflow conversion
- Review analytics dashboard

**May be prioritized for 1.5+** based on usage data and feedback.

---

## Approval Status

**Prepared By:** Claude (AI Development Agent)
**Date:** November 13, 2025
**Status:** ✅ Approved for Implementation

**Scope Confirmed:**
- ✅ Event-Driven Workflow Launcher (not trigger extensions)
- ✅ String-Tie as standalone (not integrated with existing flows)
- ✅ Review rejection completes workflow
- ✅ 6+ week timeline
- ✅ ~120 hour effort

**Next Steps:**
1. ✅ Update planning documents (complete)
2. ⏳ Update SQL script with new features
3. ⏳ Commit and push documentation
4. ⏳ Begin Phase 1: Database & Foundation
5. ⏳ Deploy using agentification strategy

---

**Full Proposal:** `docs/releases/RELEASE_1_4_PROPOSAL.md` (1200+ lines)
**SQL Script:** `scripts/add-release-1-4.sql` (to be updated)
