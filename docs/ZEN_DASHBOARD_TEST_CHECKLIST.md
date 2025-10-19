# zen-dashboard Manual Test Checklist

**Purpose:** Verify zen-dashboard works identically before and after refactor
**Last Updated:** 2025-10-15

---

## Pre-Test Setup

- [ ] Server running on http://localhost:3000
- [ ] Database connected (check Supabase status)
- [ ] Browser console open (watch for errors)
- [ ] Git commit clean (note current commit hash: ________)

---

## Test Suite 1: Basic Dashboard Load

### Test 1.1: Dashboard Renders
- [ ] Navigate to http://localhost:3000/zen-dashboard
- [ ] Dashboard loads without errors
- [ ] "Good morning" greeting displays
- [ ] Priority workflow card shows "Complete Strategic Account Plan for Obsidian Black"
- [ ] "Today's Workflows" section shows 4 workflows
- [ ] "Quick Actions" section shows 3 actions
- [ ] No console errors

**Expected:** Clean dashboard with all sections visible

---

## Test Suite 2: Priority Workflow Launch

### Test 2.1: Launch Modal
- [ ] Click "Start Planning" button on priority card
- [ ] Modal opens fullscreen
- [ ] Modal has draggable header
- [ ] Modal has resizable edges
- [ ] Customer metrics visible (top-left)
- [ ] Chat interface visible (left side)
- [ ] Initial AI greeting displays
- [ ] No console errors

**Expected:** Modal opens with proper layout

### Test 2.2: Workflow Metadata
- [ ] Workflow title: "Strategic Account Planning - Obsidian Black"
- [ ] Customer name: "Obsidian Black"
- [ ] Step indicators visible (if present)
- [ ] Progress shows step 1 of 7 (or similar)

**Expected:** Correct metadata displays

---

## Test Suite 3: Workflow Sequence (3 Workflows)

### Workflow 1: Obsidian Black - Strategic Account Planning

**Step 1: Greeting**
- [ ] Planning checklist artifact displays (right panel)
- [ ] AI message: "It's time to do the annual planning for Obsidian Black"
- [ ] Buttons: "Start Planning", "Snooze", "Skip"
- [ ] Click "Start Planning"

**Step 2: Assessment**
- [ ] Assessment artifact opens
- [ ] 3 questions: Opportunity Score, Risk Score, Year Overview
- [ ] Sliders work (1-10 scale)
- [ ] "Why?" text fields accept input
- [ ] Fill in: Opportunity=7, Risk=3, Overview="Strong partnership"
- [ ] Click "Submit Assessment" or similar

**Step 3: Overview**
- [ ] Account Overview artifact displays
- [ ] 3 tabs: Contract, Contacts, Pricing
- [ ] Contract tab shows dates, terms
- [ ] Contacts tab shows stakeholders
- [ ] Pricing tab shows ARR, seats, value metrics
- [ ] Navigate through tabs
- [ ] Click "Continue" or similar

**Step 4: Recommendation**
- [ ] Recommendation artifact displays
- [ ] Strategy: "INVEST Strategy" (or similar based on scores)
- [ ] Confidence score: ~92%
- [ ] 4-5 reasons listed with icons
- [ ] Click "Accept Recommendation"

**Step 5: Strategic Plan**
- [ ] Strategic Account Plan artifact displays
- [ ] 9 phases with day markers (Day 30, Day 60, etc.)
- [ ] Expandable sections
- [ ] Each phase has description + action items
- [ ] Click through a few phases
- [ ] Click "Continue"

**Step 6: Next Actions**
- [ ] Plan Summary artifact displays
- [ ] "Tasks Initiated" section (4 items)
- [ ] "Key Accomplishments" section (5 items)
- [ ] "I'll Handle" section (3 AI tasks, blue cards)
- [ ] "You'll Need To" section (2 user tasks, checkboxes)
- [ ] System status: CRM Synced ✓, Reminders Active ✓
- [ ] Click "Next Customer" button

**Expected:** Complete workflow 1, advance to workflow 2

---

### Workflow 2: TechFlow - Expansion Opportunity

**Step 1: Greeting**
- [ ] Customer name changes to "TechFlow Industries"
- [ ] AI message about growth opportunity
- [ ] Click "Start Analysis"

**Step 2: Growth Assessment**
- [ ] Growth assessment form displays
- [ ] Usage metrics show 140% utilization
- [ ] Fill in assessment
- [ ] Submit

**Step 3: Overview**
- [ ] Expansion overview artifact
- [ ] Current contract details (100 licenses @ $6.50)
- [ ] Market comparison (underpriced vs $10.20 average)
- [ ] Click "Continue"

**Step 4: Scenarios**
- [ ] 3 expansion scenarios display:
  - Conservative (+50 seats)
  - Balanced (+100 seats)
  - Aggressive (+150 seats)
- [ ] Each shows ARR impact
- [ ] Select "Balanced" scenario
- [ ] Click "Generate Proposal"

**Step 5: Proposal**
- [ ] Expansion proposal artifact
- [ ] Shows selected scenario details
- [ ] Pricing breakdown
- [ ] ROI justification
- [ ] Click "Continue"

**Step 6: Summary**
- [ ] Next actions summary
- [ ] AI tasks + User tasks split
- [ ] Click "Next Customer"

**Expected:** Complete workflow 2, advance to workflow 3

---

### Workflow 3: Obsidian Black - Executive Engagement

**Step 1: Greeting**
- [ ] Customer returns to "Obsidian Black"
- [ ] AI message about Marcus Castellan escalation
- [ ] Click "Start Strategy"

**Step 2: Strategy**
- [ ] Executive engagement strategy artifact
- [ ] Stakeholder analysis
- [ ] Engagement approach
- [ ] Click "Review Profiles"

**Step 3: Profiles**
- [ ] Stakeholder profile artifact
- [ ] Marcus Castellan profile:
  - Role: COO
  - Relationship: weak
  - Concerns listed
  - Leverage points listed
- [ ] Dr. Elena Voss profile
- [ ] Click "Prepare Talking Points"

**Step 4: Talking Points**
- [ ] Talking points artifact
- [ ] Organized by theme (reliability, partnership, etc.)
- [ ] Specific points for Marcus
- [ ] Click "Draft Email"

**Step 5: Email**
- [ ] Email artifact displays
- [ ] To: Marcus Castellan
- [ ] Subject line pre-filled
- [ ] Body content generated
- [ ] Professional tone, not campy
- [ ] Click "Review Summary"

**Step 6: Summary**
- [ ] Plan summary
- [ ] AI tasks + User tasks
- [ ] Click "Complete" or "Close"

**Expected:** Complete workflow 3, modal closes or shows completion

---

### Sequence Completion

- [ ] Modal closes after last workflow
- [ ] Returns to dashboard
- [ ] No errors in console
- [ ] Can re-launch workflows

**Expected:** Clean completion, no crashes

---

## Test Suite 4: Sequence Navigation

### Test 4.1: URL Parameter Launch
- [ ] Navigate to http://localhost:3000/zen-dashboard?sequence=bluesoft-demo-2025
- [ ] Dashboard loads
- [ ] "Today's Workflows" shows 4 workflows from sequence
- [ ] Workflows have indicators (Day 1, Day 2, Day 3, Day 4)
- [ ] Launch first workflow
- [ ] Works as expected

**Expected:** Sequence loads from URL parameter

### Test 4.2: Progress Tracking
- [ ] Complete first workflow
- [ ] Check if workflow marked complete (if feature exists)
- [ ] Second workflow shows as active
- [ ] Can navigate back to dashboard without losing progress (if supported)

**Expected:** Progress tracked through sequence

---

## Test Suite 5: Edge Cases

### Test 5.1: Close Modal Mid-Workflow
- [ ] Launch workflow
- [ ] Complete 2 steps
- [ ] Click X to close modal (or press Escape)
- [ ] Confirmation dialog appears (if implemented)
- [ ] Close modal
- [ ] Re-open workflow
- [ ] Check if progress saved (if supported)

**Expected:** Graceful closure, optional progress save

### Test 5.2: Skip/Snooze Actions
- [ ] Launch workflow
- [ ] Click "Snooze" button
- [ ] Modal closes
- [ ] Workflow removed from queue (or snoozed)

**Expected:** Skip/snooze works without errors

### Test 5.3: Browser Resize
- [ ] Launch workflow
- [ ] Resize browser window to narrow width
- [ ] Layout adjusts responsively
- [ ] Resize to wide width
- [ ] Layout adjusts back

**Expected:** Responsive design works

---

## Test Suite 6: Performance

### Test 6.1: Load Time
- [ ] Hard refresh page (Ctrl+Shift+R)
- [ ] Dashboard loads in <2 seconds
- [ ] No visible lag

**Expected:** Fast load times

### Test 6.2: Modal Rendering
- [ ] Launch workflow
- [ ] Modal opens in <1 second
- [ ] Artifacts render smoothly
- [ ] No flashing or layout shifts

**Expected:** Smooth transitions

---

## Test Suite 7: Console Errors

### During Entire Test Run
- [ ] No JavaScript errors in console
- [ ] No 404 errors (missing assets)
- [ ] No failed API calls (or graceful fallbacks)
- [ ] Warnings acceptable, errors not

**Expected:** Clean console (no red errors)

---

## Comparison Checklist (Old vs New System)

Test both `/zen-dashboard` (old) and `/zen-dashboard-v2` (new) and compare:

| Feature | Old System | New System | Match? |
|---------|-----------|------------|--------|
| Dashboard loads | ☐ Works | ☐ Works | ☐ Yes ☐ No |
| Priority card displays | ☐ Works | ☐ Works | ☐ Yes ☐ No |
| Modal opens | ☐ Works | ☐ Works | ☐ Yes ☐ No |
| Workflow 1 completes | ☐ Works | ☐ Works | ☐ Yes ☐ No |
| Workflow 2 completes | ☐ Works | ☐ Works | ☐ Yes ☐ No |
| Workflow 3 completes | ☐ Works | ☐ Works | ☐ Yes ☐ No |
| Sequence navigates | ☐ Works | ☐ Works | ☐ Yes ☐ No |
| Modal closes cleanly | ☐ Works | ☐ Works | ☐ Yes ☐ No |
| No console errors | ☐ Clean | ☐ Clean | ☐ Yes ☐ No |

**Parity Achieved:** ☐ Yes ☐ No

**If No, document differences:**
________________________________________
________________________________________
________________________________________

---

## Sign-Off

**Tested By:** ________________
**Date:** ________________
**System Version:** ☐ Old (zen-dashboard) ☐ New (zen-dashboard-v2)
**Git Commit:** ________________
**Result:** ☐ Pass ☐ Fail

**Notes:**
________________________________________
________________________________________
________________________________________

---

## Regression Test (After Cutover)

After switching to new system, re-run all tests above and confirm:
- [ ] All tests pass
- [ ] Performance unchanged or improved
- [ ] No new bugs introduced
- [ ] User experience identical

**Final Approval:** ☐ Approved for production ☐ Needs fixes

---

**Use this checklist for every test run. Keep a log of all test results.**
