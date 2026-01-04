# CS Assessment End-to-End Testing Checklist

**Release:** 0.1.7
**Date:** 2025-11-15
**Tester:** Claude Code
**Server:** http://localhost:3200

## Test Environment

- ✅ Dev server running on port 3200
- ✅ Database migration `20251115000000_cs_assessment_system.sql` applied
- ✅ Anthropic API key configured in `.env.local`
- ✅ All routing conflicts resolved (candidateId → sessionId)

## Test Flow Overview

```
1. Magic Link Signup
   ↓
2. Email Verification & Password Setup
   ↓
3. Auto-start Assessment
   ↓
4. Answer 26 Questions (6 sections)
   ↓
5. Claude AI Scoring (5-10 seconds)
   ↓
6. Results Display
```

---

## Phase 1: Magic Link & Authentication

### Test 1.1: Invite Code Validation
- [ ] Navigate to `/assessment/start`
- [ ] Enter invalid invite code → Should show error
- [ ] Enter valid invite code → Should proceed to email input

### Test 1.2: Email Submission
- [ ] Enter email address
- [ ] Click "Get Started"
- [ ] Verify magic link sent message displayed
- [ ] Check email inbox for magic link

### Test 1.3: Password Setup
- [ ] Click magic link from email
- [ ] Should land on `/auth/set-password`
- [ ] Email should be pre-filled/displayed
- [ ] Enter password (< 8 chars) → Should show validation error
- [ ] Enter mismatched passwords → Should show error
- [ ] Enter valid matching passwords → Should proceed
- [ ] Verify redirect to `/assessment/interview`

---

## Phase 2: Assessment Auto-Start

### Test 2.1: Automatic Session Creation
- [ ] After password setup, verify auto-redirect to interview page
- [ ] Verify `useAssessment` hook calls `/api/assessment/start`
- [ ] Verify new session created in `cs_assessment_sessions` table
- [ ] Verify session has `status = 'in_progress'`
- [ ] Verify `current_section_index = 0` and `current_question_index = 0`

### Test 2.2: Progress Bar Display
- [ ] Verify progress bar shows at top of page
- [ ] Verify section title displayed: "Getting to Know You"
- [ ] Verify progress percentage: "0% Complete" initially

---

## Phase 3: Question Navigation

### Test 3.1: First Question (Background Section)
- [ ] Verify question text displays correctly
- [ ] Verify textarea is empty and editable
- [ ] Verify "Previous" button is disabled
- [ ] Enter answer text
- [ ] Click "Next" button
- [ ] Verify answer saved to database transcript
- [ ] Verify progress to next question

### Test 3.2: Section Transitions
- [ ] Complete all 5 questions in "Getting to Know You" section
- [ ] Verify transition to "Experience & Skills" section
- [ ] Verify transition message displays (if configured)
- [ ] Verify progress percentage updates correctly

### Test 3.3: Backward Navigation
- [ ] Navigate forward 3-4 questions
- [ ] Click "Previous" button
- [ ] Verify previous question displays
- [ ] Verify existing answer is pre-filled in textarea
- [ ] Navigate forward again
- [ ] Verify original answer still present

### Test 3.4: Auto-Save Functionality
- [ ] Answer 5-6 questions
- [ ] Close browser tab (DO NOT complete assessment)
- [ ] Re-open `/assessment/interview`
- [ ] Verify session resumes from last question
- [ ] Verify previous answers are not lost
- [ ] Verify progress bar shows correct percentage

---

## Phase 4: Complete All Questions

### Test 4.1: Answer All 26 Questions
Track progress through all 6 sections:

**Section 1: Getting to Know You (5 questions)**
- [ ] Q1: Tell us about your customer success story
- [ ] Q2: Leadership example
- [ ] Q3: Customer challenge resolution
- [ ] Q4: Current role description
- [ ] Q5: Why customer success

**Section 2: Experience & Skills (5 questions)**
- [ ] Q1: Relevant skills and knowledge
- [ ] Q2: Unique career path
- [ ] Q3: Past role examples
- [ ] Q4: Technical proficiency
- [ ] Q5: Data analysis and reporting

**Section 3: Problem Solving (4 questions)**
- [ ] Q1: Challenging stakeholder situation
- [ ] Q2: Balancing priorities under pressure
- [ ] Q3: Creative problem solving
- [ ] Q4: Mistake and learning

**Section 4: Working Style (4 questions)**
- [ ] Q1: Ideal work environment
- [ ] Q2: Work preference (autonomy vs collaboration)
- [ ] Q3: Recharge and self-care
- [ ] Q4: Career motivators

**Section 5: AI & Innovation (4 questions)**
- [ ] Q1: AI tools used
- [ ] Q2: AI in customer success vision
- [ ] Q3: Adapting to rapid change
- [ ] Q4: Exciting trends

**Section 6: Wrap Up (4 questions)**
- [ ] Q1: What makes you unique
- [ ] Q2: Deal breakers
- [ ] Q3: Dream role description
- [ ] Q4: Why join now

### Test 4.2: Last Question Behavior
- [ ] On question 26, verify button says "Save Answer" (not "Next")
- [ ] Click "Save Answer"
- [ ] Verify completion card displays
- [ ] Verify message: "You've completed all questions!"
- [ ] Verify "Submit & See Results" button appears

---

## Phase 5: Claude AI Scoring

### Test 5.1: Initiate Scoring
- [ ] Click "Submit & See Results" button
- [ ] Verify status changes to `completing`
- [ ] Verify loading screen appears
- [ ] Verify rotating messages display:
  - "Analyzing your responses..."
  - "Calculating your archetype..."
  - "Evaluating your scores across 12 dimensions..."
  - "Preparing your results..."
- [ ] Verify messages rotate every 2 seconds
- [ ] Verify spinner animation displays

### Test 5.2: API Request
- [ ] Verify `/api/assessment/[sessionId]/complete` POST request sent
- [ ] Verify request includes session ID
- [ ] Verify AssessmentScoringService called
- [ ] Verify Claude Sonnet 4.5 API request made
- [ ] Verify scoring completes within 5-10 seconds

### Test 5.3: Database Update
After scoring completes, verify database record updated:
- [ ] `status = 'completed'`
- [ ] `archetype` populated (one of 6 archetypes)
- [ ] `archetype_confidence` set (high/medium/low)
- [ ] `overall_score` populated (0-100)
- [ ] `dimensions` JSONB contains all 12 scores
- [ ] `tier` set (top_1/benched/passed)
- [ ] `flags` JSONB contains green_flags and red_flags arrays
- [ ] `recommendation` text populated
- [ ] `best_fit_roles` array populated
- [ ] `analyzed_at` timestamp set
- [ ] `completed_at` timestamp set

---

## Phase 6: Results Display

### Test 6.1: Auto-Redirect
- [ ] After scoring completes, verify auto-redirect to `/assessment/results/[sessionId]`
- [ ] Verify session ID in URL matches database session

### Test 6.2: Results Page Layout
- [ ] Verify page title: "Your CS Assessment Results"
- [ ] Verify analyzed date displays correctly
- [ ] Verify gradient background styling

### Test 6.3: Overall Score Card
- [ ] Verify overall score (0-100) displays prominently
- [ ] Verify "out of 100" label
- [ ] Verify gradient text styling

### Test 6.4: Tier Badge
- [ ] Verify tier displays with correct label:
  - `top_1` → "Top 1% Candidate" (yellow)
  - `benched` → "Talent Bench" (green)
  - `passed` → "Assessed" (blue)
- [ ] Verify badge color matches tier
- [ ] Verify tier subtitle displays if top_1 or benched

### Test 6.5: Archetype Section
- [ ] Verify archetype name displays (large, bold)
- [ ] Verify confidence level displays (high/medium/low)
- [ ] Verify section styling

### Test 6.6: Dimension Scores
Verify all 12 dimensions display with scores:
- [ ] IQ (0-100)
- [ ] EQ (0-100)
- [ ] Empathy (0-100)
- [ ] Self Awareness (0-100)
- [ ] Technical (0-100)
- [ ] AI Readiness (0-100)
- [ ] GTM (0-100)
- [ ] Personality (0-100)
- [ ] Motivation (0-100)
- [ ] Work History (0-100)
- [ ] Passions (0-100)
- [ ] Culture Fit (0-100)

Each dimension should have:
- [ ] Dimension name (formatted, capitalized)
- [ ] Score value displayed
- [ ] Progress bar with gradient fill
- [ ] Bar width matches percentage

### Test 6.7: Flags Section
- [ ] Verify green flags section displays (if any)
- [ ] Verify red flags section displays (if any)
- [ ] Verify bullet points render correctly
- [ ] Verify color coding (green/red borders)

### Test 6.8: Recommendation Section
- [ ] Verify recommendation text displays
- [ ] Verify text formatting and readability

### Test 6.9: Best Fit Roles
- [ ] Verify roles display as tags
- [ ] Verify pill-style badges
- [ ] Verify proper spacing

### Test 6.10: Navigation
- [ ] Click "Go to Dashboard" button
- [ ] Verify redirect to `/` (dashboard)

---

## Phase 7: Edge Cases & Error Handling

### Test 7.1: Direct URL Access
- [ ] Try accessing `/assessment/interview` while unauthenticated
- [ ] Verify redirect to login or start page
- [ ] Try accessing `/assessment/results/[sessionId]` for someone else's session
- [ ] Verify 403 Forbidden error

### Test 7.2: Session Ownership
- [ ] Create session with User A
- [ ] Sign in as User B
- [ ] Try to access User A's results
- [ ] Verify proper authorization error

### Test 7.3: Invalid Session ID
- [ ] Access `/assessment/results/invalid-uuid`
- [ ] Verify 404 error displays
- [ ] Verify error message is user-friendly

### Test 7.4: Scoring Failure
- [ ] Temporarily disable ANTHROPIC_API_KEY
- [ ] Complete assessment
- [ ] Verify graceful error handling
- [ ] Verify error message displayed to user
- [ ] Re-enable API key

### Test 7.5: Network Interruption
- [ ] Start answering questions
- [ ] Simulate network disconnect (offline mode)
- [ ] Try to submit answer
- [ ] Verify error handling
- [ ] Reconnect network
- [ ] Verify recovery

---

## Phase 8: Data Validation

### Test 8.1: Transcript Format
Query database and verify transcript structure:
```sql
SELECT interview_transcript
FROM cs_assessment_sessions
WHERE id = '[session-id]';
```

Verify format:
- [ ] Array of message objects
- [ ] Messages alternate: assistant (question) → user (answer)
- [ ] Each message has `role`, `content`, `timestamp`
- [ ] Markdown formatting preserved in answers
- [ ] Timestamps in ISO 8601 format

### Test 8.2: RLS Policies
- [ ] Verify users can only see their own sessions
- [ ] Verify users cannot update other users' sessions
- [ ] Verify users cannot delete other users' sessions

---

## Test Results Summary

**Total Tests:** 90+
**Passed:** ___
**Failed:** ___
**Blocked:** ___
**Skipped:** ___

## Issues Found

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| 1  |          |             |        |
| 2  |          |             |        |

## Notes

- [ ] All critical paths tested
- [ ] All edge cases covered
- [ ] Performance acceptable (scoring < 10s)
- [ ] UI/UX smooth and intuitive
- [ ] Error messages clear and helpful
- [ ] Ready for production deployment

---

**Sign-off:**
Tester: _________________
Date: _________________
