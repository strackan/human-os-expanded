# Release 0.1.8 Test Plan - Production Readiness Validation

**Release:** 0.1.8 (includes 0.1.6, 0.1.7, 0.1.8)
**Date:** 2025-11-15
**Environment:** Staging → Production
**Tester:** _______________
**Status:** 🟡 In Progress

---

## 🎯 Testing Objectives

Validate that all three releases (0.1.6, 0.1.7, 0.1.8) are production-ready:
- **0.1.6**: Parking Lot System for workflow event detection
- **0.1.7**: Skip and Review trigger systems
- **0.1.8**: String-Tie natural language reminders

**Success Criteria:**
- ✅ All critical paths work without errors
- ✅ Data persists correctly to database
- ✅ LLM integrations function properly
- ✅ User experience is intuitive and performant
- ✅ No security vulnerabilities or data leaks
- ✅ RLS policies protect customer data

---

## 📋 Pre-Flight Checklist

### Environment Setup
- [ ] Staging environment is accessible
- [ ] Database migration `string_ties` table applied
- [ ] All environment variables configured (ANTHROPIC_API_KEY, etc.)
- [ ] RLS policies enabled on all new tables
- [ ] Test user account created/accessible

### Deployment Verification
- [ ] Vercel build completed successfully
- [ ] No console errors on page load
- [ ] All static assets loading correctly
- [ ] Navigation working across all routes

---

## 🧪 Release 0.1.8 - String-Tie Reminders

### Critical Path 1: Quick Capture Flow (Text Input)

**User Story:** *As a CS manager, I want to quickly capture a reminder while on a customer call*

**Test Steps:**
1. Click bookmark icon in header (Quick Capture popover)
2. Type: "follow up with Acme Corp about renewal in 2 hours"
3. Click "Create Reminder"

**Expected Results:**
- [ ] Popover opens without delay
- [ ] Input field accepts text
- [ ] LLM parses correctly: text="follow up with Acme Corp about renewal", offset=120 minutes
- [ ] Success message displays "Reminder created!"
- [ ] Popover closes after 2 seconds
- [ ] Reminder appears in database with correct `remind_at` timestamp

**Edge Cases:**
- [ ] Test with very long input (500+ characters)
- [ ] Test with special characters: "email John@acme.com about $25k deal"
- [ ] Test with empty input (should show error)

---

### Critical Path 2: Voice Dictation

**User Story:** *As a CS rep driving between meetings, I want to use voice to create reminders hands-free*

**Test Steps:**
1. Open Quick Capture popover
2. Click microphone button
3. Speak: "remind me to call Sarah tomorrow at 9am"
4. Wait for auto-stop after silence (5 seconds)
5. Click "Create Reminder"

**Expected Results:**
- [ ] Microphone button turns red when listening
- [ ] Speech-to-text accurately captures spoken words
- [ ] Listening stops automatically after 5 seconds of silence
- [ ] Transcription appears in input field
- [ ] LLM parses voice input correctly
- [ ] Reminder created successfully

**Edge Cases:**
- [ ] Test in noisy environment (background noise)
- [ ] Test with unclear speech or mumbling
- [ ] Test browser permission denial for microphone
- [ ] Test on non-Chrome browsers (should show graceful fallback)

---

### Critical Path 3: Business Day Intelligence

**User Story:** *As a CS manager, I want reminders to respect business hours so I don't get pinged on weekends*

**Test Cases:**

| Input | Current Time | Expected remind_at | Pass/Fail |
|-------|-------------|-------------------|-----------|
| "in 2 hours" | Fri 4:30 PM | Fri 6:30 PM | [ ] |
| "tomorrow" | Fri 4:30 PM | Mon 9:30 AM | [ ] |
| "next week" | Wed 2:00 PM | Wed (next week) 9:30 AM | [ ] |
| "in a couple days" | Thu 5:00 PM | Mon 9:30 AM | [ ] |
| "Saturday" (explicit) | Thu 2:00 PM | Sat 9:30 AM | [ ] |
| "Monday at 2pm" (explicit) | Fri 1:00 PM | Mon 2:00 PM | [ ] |

**Validation:**
- [ ] Implicit dates use 9:30 AM default
- [ ] Explicit dates honor user-specified times
- [ ] Weekends are skipped for implicit dates
- [ ] "Next week" correctly interprets as following week's Tu-Thu

---

### Critical Path 4: Test Page Full Workflow

**Test Steps:**
1. Navigate to `/test-string-tie`
2. Click test case: "remind me to call Sarah in 2 hours"
3. Click "1. Parse with LLM"
4. Verify parse result
5. Click "2. Create Reminder"

**Expected Results:**
- [ ] Page loads without errors
- [ ] Test cases are clickable and populate input
- [ ] Parse button triggers LLM call
- [ ] Parse result displays correctly with:
  - Reminder text (cleaned)
  - Time offset in minutes
  - Calculated reminder time
- [ ] Create button saves to database
- [ ] Success message shows with reminder ID
- [ ] Can refresh page and reminder persists

---

### Database Validation

**SQL Queries to Run:**
```sql
-- Check string_ties table exists
SELECT * FROM string_ties LIMIT 1;

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'string_ties';

-- Check recent reminders
SELECT id, user_id, content, reminder_text, remind_at, reminded, created_at
FROM string_ties
ORDER BY created_at DESC
LIMIT 5;

-- Test RLS (switch to different user context)
-- Should only see own reminders, not other users'
```

**Expected:**
- [ ] Table exists with all columns
- [ ] RLS is enabled (`rowsecurity = true`)
- [ ] Created reminders appear
- [ ] `remind_at` timestamps are accurate
- [ ] `reminded` flag is false initially

---

## 🧪 Release 0.1.7 - Skip/Review Triggers

### Critical Path 1: Skip Trigger Creation

**User Story:** *As a CS manager, I want to automatically skip certain renewal workflows during holiday periods*

**Test Steps:**
1. Navigate to `/test-skip`
2. Create a test workflow (if not exists)
3. Click "Skip Workflow"
4. Select trigger: "Skip until [date]"
5. Choose date: 7 days from now
6. Add reason: "Customer on vacation"
7. Submit

**Expected Results:**
- [ ] Modal opens with trigger options
- [ ] Date picker allows future date selection
- [ ] Reason field accepts text
- [ ] Workflow status changes to "skipped"
- [ ] Trigger record created in `workflow_skip_triggers` table
- [ ] Workflow appears in "Skipped Workflows" list

---

### Critical Path 2: Review (Escalate) Trigger

**User Story:** *As a CS rep, I want to escalate a complex renewal to my manager if no progress after 48 hours*

**Test Steps:**
1. Navigate to `/test-escalate`
2. Create/select a workflow
3. Click "Review Workflow"
4. Set trigger: "Escalate if no activity for 2 days"
5. Add notes: "Complex contract negotiation"
6. Submit

**Expected Results:**
- [ ] Review modal displays correctly
- [ ] Trigger options include time-based and event-based
- [ ] Notes field saves context
- [ ] Workflow marked for review
- [ ] Trigger evaluation scheduled for 2 days from now

---

### Critical Path 3: Trigger Evaluation (Automated)

**Test Steps:**
1. Create a skip trigger with date = 1 minute from now
2. Wait 2 minutes
3. Check if cron job evaluated the trigger
4. Verify workflow was auto-activated

**Expected Results:**
- [ ] Cron job runs every 5 minutes (check logs)
- [ ] Trigger identified as "due"
- [ ] Workflow status updated automatically
- [ ] Notification created for user

**Manual Trigger Evaluation Test:**
```bash
# Call the cron endpoint manually
curl -X POST https://[staging-url]/api/cron/evaluate-skip-triggers
curl -X POST https://[staging-url]/api/cron/evaluate-escalate-triggers
```

- [ ] Returns success status
- [ ] Triggers evaluated correctly
- [ ] Database updated

---

### Database Validation

```sql
-- Check skip triggers
SELECT * FROM workflow_skip_triggers ORDER BY created_at DESC LIMIT 5;

-- Check review triggers
SELECT * FROM workflow_review_triggers ORDER BY created_at DESC LIMIT 5;

-- Verify trigger evaluation
SELECT * FROM workflow_skip_triggers WHERE evaluated = true;
```

**Expected:**
- [ ] Triggers persist correctly
- [ ] `evaluated` flag updates after cron job
- [ ] Workflow foreign keys are valid

---

## 🧪 Release 0.1.6 - Parking Lot System

### Critical Path 1: Parking Lot Item Creation

**User Story:** *As a CS manager, I want to quickly capture an idea during standup without creating a full workflow*

**Test Steps:**
1. Navigate to `/parking-lot`
2. Click "+" or "Capture Idea" button
3. Type: "Explore partnership opportunity with TechCorp"
4. Select mode: "Quick Capture" or "Detailed"
5. Submit

**Expected Results:**
- [ ] Parking lot page loads
- [ ] Capture modal opens
- [ ] Text input accepts content
- [ ] Mode selection available
- [ ] Item created successfully
- [ ] Appears in parking lot list
- [ ] Timestamps are accurate

---

### Critical Path 2: LLM-Powered Brainstorm

**User Story:** *As a CS strategist, I want Claude to help me expand a vague idea into actionable steps*

**Test Steps:**
1. Open an existing parking lot item
2. Click "Brainstorm" or "Expand"
3. Answer LLM-generated questions
4. Review synthesized analysis
5. Save or convert to workflow

**Expected Results:**
- [ ] Brainstorm questions are contextual and relevant
- [ ] Can save answers and return later
- [ ] LLM synthesis provides actionable insights
- [ ] Can convert to workflow with pre-populated data

---

### Critical Path 3: Event Detection

**User Story:** *As a CS ops lead, I want the system to automatically flag workflows that need attention*

**Test Steps:**
1. Create workflows with various states
2. Let some workflows sit idle for extended periods
3. Check parking lot for auto-detected items
4. Verify scoring and categorization

**Expected Results:**
- [ ] Event detection identifies stale workflows
- [ ] Health scores calculated correctly
- [ ] Items categorized appropriately
- [ ] Notifications created for high-priority items

---

### Database Validation

```sql
-- Check parking lot items
SELECT * FROM parking_lot_items ORDER BY created_at DESC LIMIT 10;

-- Verify event detection
SELECT * FROM parking_lot_items WHERE source = 'event_detection';

-- Check scoring
SELECT id, title, category, priority FROM parking_lot_items
WHERE priority = 'high';
```

**Expected:**
- [ ] Items persist with all metadata
- [ ] Event-detected items have proper source
- [ ] Categories and priorities set correctly

---

## 🔒 Security Testing

### RLS (Row Level Security) Validation

**Test Steps:**
1. Create reminders/parking lot items as User A
2. Switch to User B account
3. Attempt to view User A's data

**Expected Results:**
- [ ] User B cannot see User A's string_ties
- [ ] User B cannot see User A's parking lot items
- [ ] User B cannot modify User A's workflows
- [ ] API returns 403/404 for unauthorized access

### SQL Injection Testing

**Test Inputs:**
- `'; DROP TABLE string_ties; --`
- `<script>alert('xss')</script>`
- `../../../etc/passwd`

**Expected:**
- [ ] Inputs sanitized/escaped
- [ ] No SQL errors in logs
- [ ] No XSS execution

---

## ⚡ Performance Testing

### Load Time Benchmarks

| Page | Target Load Time | Actual | Pass/Fail |
|------|-----------------|--------|-----------|
| `/parking-lot` | < 2s | ___ | [ ] |
| `/test-string-tie` | < 1.5s | ___ | [ ] |
| `/test-skip` | < 1.5s | ___ | [ ] |
| Quick Capture Popover | < 300ms | ___ | [ ] |

### LLM Response Times

| Operation | Target | Actual | Pass/Fail |
|-----------|--------|--------|-----------|
| String-Tie Parse | < 5s | ___ | [ ] |
| Parking Lot Brainstorm | < 10s | ___ | [ ] |
| Event Detection | Background | N/A | [ ] |

---

## 📱 Cross-Browser Testing

| Browser | Version | String-Tie | Skip/Review | Parking Lot | Notes |
|---------|---------|-----------|-------------|-------------|-------|
| Chrome | Latest | [ ] | [ ] | [ ] | Voice works |
| Firefox | Latest | [ ] | [ ] | [ ] | Voice fallback? |
| Safari | Latest | [ ] | [ ] | [ ] | iOS Safari |
| Edge | Latest | [ ] | [ ] | [ ] | |

---

## 🐛 Known Issues / Workarounds

_Document any issues found during testing:_

| Issue | Severity | Workaround | Fix Required? |
|-------|----------|------------|---------------|
| | | | |
| | | | |

---

## ✅ Sign-Off

### Staging Validation
- [ ] All critical paths tested
- [ ] Database integrity verified
- [ ] Security checks passed
- [ ] Performance acceptable
- [ ] Cross-browser compatibility confirmed

**Tester Signature:** _______________
**Date:** _______________

### Production Deployment Approval
- [ ] Stakeholder approval received
- [ ] Rollback plan documented
- [ ] Customer communication prepared (if needed)
- [ ] Monitoring alerts configured

**Approved By:** _______________
**Date:** _______________

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Backup production database
- [ ] Verify environment variables in production
- [ ] Test database migration on production copy
- [ ] Communicate deployment window to team

### Deployment
- [ ] Run migrations on production
- [ ] Deploy code to production
- [ ] Verify build success
- [ ] Run smoke tests

### Post-Deployment
- [ ] Monitor error logs for 30 minutes
- [ ] Check key metrics (response times, error rates)
- [ ] Test critical user flows in production
- [ ] Send deployment summary to team

---

## 📊 Test Results Summary

**Total Test Cases:** 50+
**Passed:** ___
**Failed:** ___
**Blocked:** ___
**Success Rate:** ___%

**Recommendation:**
- [ ] ✅ **APPROVED** for production deployment
- [ ] ⚠️ **APPROVED WITH CAVEATS** (document below)
- [ ] ❌ **NOT APPROVED** (must fix critical issues)

**Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________
