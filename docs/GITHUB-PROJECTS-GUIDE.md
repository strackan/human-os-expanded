# GitHub Projects Quick-Start Guide

**Last Updated:** 2025-11-05
**For:** Justin (Human Lead)
**Purpose:** How to use GitHub Projects with AI agents

---

## 📋 What Is GitHub Projects?

Think of it as **Trello inside GitHub** - a visual board where:
- Each card = a task (GitHub Issue)
- Columns = status (Todo, In Progress, Review, Done)
- Agents can update via API
- You update via web UI (drag and drop)

**Your role:** Strategic oversight, not task management

---

## ⏱️ Time Investment

### Daily: 5-10 Minutes

**Morning (5 min):**
1. Open board: https://github.com/Renew-Boo/renubu/projects/[NUMBER]
2. Glance at columns (what's moving?)
3. Read Google Chat updates
4. That's it - back to your work

**As Needed (0-5 min):**
- Respond to 0-2 agent questions in chat
- Reprioritize a card (drag to top of Todo)

### Weekly: 15-20 Minutes

**Friday End of Day (15 min):**
1. Review velocity report in Google Chat
2. Check Done column (what shipped this week?)
3. Glance at next week's Todo column
4. Adjust priorities if customer needs changed

### Monthly: 30 Minutes

**First Monday of Month (30 min):**
1. Review overall progress vs plan
2. Celebrate wins with team
3. Adjust roadmap if needed
4. Plan next month's priorities

### Quarterly: 2 Hours

**End of Quarter (2h):**
1. Full retrospective
2. Velocity analysis
3. Process improvements
4. Next quarter planning

---

## 🚀 Initial Setup (One-Time, 20 Minutes)

### Step 1: Create the Project (5 min)

1. Go to https://github.com/Renew-Boo/renubu
2. Click "Projects" tab
3. Click "New project"
4. Choose "Board" template
5. Name it "Renubu Q4 2025"
6. Click "Create"

### Step 2: Configure Columns (5 min)

**Rename/add columns to:**
- Backlog (later)
- Todo (next up)
- In Progress (active work)
- Review (PR created)
- Done (merged)

**Drag to reorder:** Backlog → Todo → In Progress → Review → Done

### Step 3: Add Custom Fields (5 min)

Click "⋮" menu → "Settings" → "Fields"

**Add these fields:**

1. **Estimate** (Number)
   - Description: "Hours estimated"
   - Show on cards

2. **Priority** (Single select)
   - Options: High, Medium, Low
   - Color code: High=red, Medium=yellow, Low=green

3. **Agent-Friendly** (Single select)
   - Options: Yes, Needs Human
   - Color code: Yes=green, Needs Human=orange

4. **Phase** (Single select)
   - Options: 0.1, 1, 2, etc.

### Step 4: Set Up Automation (5 min)

Click "⋮" menu → "Workflows"

**Enable these:**
- ✅ "Item added to project" → Set Status to Backlog
- ✅ "Pull request merged" → Set Status to Done
- ✅ "Item closed" → Set Status to Done

**Add custom:**
- When PR created → Set Status to Review
- When assigned → Set Status to In Progress

**Done! Project is ready.**

---

## 📊 How to Read the Board

### The Board View

```
┌───────────────────────────────────────────────────────────┐
│  Backlog    │  Todo      │  In Progress  │  Review  │ Done│
├─────────────┼────────────┼───────────────┼──────────┼─────┤
│             │            │               │          │     │
│ #54 Future  │ #47 Next   │ #45 Agent1    │ #43 PR#3 │ #40 │
│ 8h │High    │ 4h │High   │ 6h │In progress│ Review   │ ✅  │
│             │            │               │          │     │
│ #55 Future  │ #48 Next   │ #46 Agent2    │          │ #41 │
│ 6h │Med     │ 8h │High   │ 8h │50% done   │          │ ✅  │
│             │            │               │          │     │
│ #56 Future  │ #49 Ready  │               │          │ #42 │
│ 4h │Low     │ 3h │Med    │               │          │ ✅  │
│             │            │               │          │     │
└─────────────┴────────────┴───────────────┴──────────┴─────┘
```

### What Each Card Shows

**Card #47 (click to see details):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ #47 Implement SnoozeDialog Component    │
├─────────────────────────────────────────┤
│ 📋 Description:                         │
│ Create dialog for snoozing workflows    │
│ with date picker and condition selector │
│                                         │
│ ✅ Acceptance Criteria:                 │
│ • Date picker works                     │
│ • Condition selector works              │
│ • Form validation                       │
│ • Mobile responsive                     │
│ • Tests passing                         │
│                                         │
│ 🏷️ Labels: phase-0.1, priority-high    │
│ ⏱️ Estimate: 4 hours                    │
│ 👤 Assigned: Agent 1                    │
│ 🔗 Linked PR: #3 (ready for review)    │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Color Coding (Visual Cues)

**Priority:**
- 🔴 Red = High (do this week)
- 🟡 Yellow = Medium (do next week)
- 🟢 Green = Low (nice to have)

**Phase:**
- 🔵 Blue = Phase 0.1 (MCP setup)
- 🟣 Purple = Phase 1 (Workflow Snoozing)
- 🟠 Orange = Phase 2 (future)

**Agent-Friendly:**
- ✅ Green = Agent can do alone
- ⚠️ Orange = Needs human input

---

## 🎯 Your Daily Routine

### Every Morning (5 Minutes)

**9:00 AM - Open Google Chat "Renubu Dev Sync"**

Read Queen Bee's daily update:
```
🤖 Queen Bee Update - 2025-11-13

✅ Completed Yesterday:
- #47: SnoozeDialog (Agent 1) → PR #3 ready
- #48: API routes (Agent 2) → PR #4 ready

🔄 Starting Today:
- #49: WorkflowDashboard (Agent 1, 6h)
- #50: Intel integration (Agent 2, 8h)

🚧 Blockers: None

📊 Velocity: 135% (ahead of schedule)
🎯 On track for Phase 1 Week 1 completion
```

**9:05 AM - Quick board check:**
1. Click board link
2. See 2 cards in "Review" (PRs ready)
3. See 2 cards in "In Progress" (agents working)
4. Everything looks good

**9:06 AM - Reply in chat:**
```
👍 Looks good! Will review PRs this afternoon.
```

**You're done. Back to your work.**

---

## ❓ When to Take Action

### Scenario 1: Agent Asks Question (30 seconds)

**Google Chat:**
```
❓ Quick Question - Agent 1

Context: Implementing date picker
Question: Native <input type="date"> or react-datepicker library?

Options:
1. Native - Simple, smaller bundle
2. Library - Better UX, 50KB added

Preference: Native for MVP

Your call?
```

**You reply:**
```
Go with native. Can upgrade if users complain.
```

**Done. 30 seconds.**

---

### Scenario 2: Reprioritize Work (2 minutes)

**Situation:** Customer just asked for urgent demo feature

**What you do:**
1. Open board
2. Find relevant card in Backlog (e.g., #54)
3. Drag it to top of Todo column
4. Comment: "Priority bump - customer demo next week"
5. Post in Google Chat: "@QueenBee reprioritized #54 for customer demo"

**Queen Bee sees it, adjusts assignments.**

**Done. 2 minutes.**

---

### Scenario 3: Agent Blocked (1-5 minutes)

**Google Chat:**
```
🚧 BLOCKER - Agent 2

What's blocked: WorkflowConditionService (#50)
Root cause: Foreign key constraint error
Impact: 8h work stopped
Need: Database schema review

@Justin
```

**Option A - You know answer (1 min):**
```
Foreign key should reference workflows.id not workflow_executions.id.
Check migration line 47.
```

**Option B - You don't know (1 min):**
```
@QueenBee investigate this. Check if related to workflow-level
vs task-level abstraction.
```

**Queen Bee handles it.**

**Done. 1-5 minutes.**

---

### Scenario 4: Review PR (Optional, 10-20 min)

**When:** Queen Bee reviewed, wants human sign-off

**Google Chat:**
```
✅ Code Review Complete - PR #3

Queen Bee approved: SnoozeDialog looks good
- All tests passing
- Code quality: 8/8 dimensions
- No security concerns

Human review optional (low risk component)
Link: https://github.com/Renew-Boo/renubu/pull/3
```

**You can:**
- **Option A:** Trust Queen Bee, approve via chat: "👍 Looks good, merge it"
- **Option B:** Review yourself (10-20 min if you want)

**Most of time, Queen Bee approval is enough.**

---

## 📅 Weekly Check-In (15 Minutes)

### Friday End of Day

**Read weekly velocity report in chat:**
```
📊 Weekly Velocity Report - Week of Nov 13

🎯 Planned: 25h
✅ Completed: 27h (108% velocity)

Tasks Done:
- #47 SnoozeDialog (4h est, 3.5h actual)
- #48 API Routes (4h est, 4h actual)
- #49 WorkflowDashboard (6h est, 6h actual)
- #50 Intel Integration (8h est, 9h actual)
- #51 Testing (3h est, 2.5h actual)

📈 Metrics:
- Velocity: 108%
- Accuracy: 92% (estimates vs actual)
- Quality: 90% (7.2/8 dimensions avg)
- Conflict Rate: 0% (git worktrees working!)

💭 Insights:
- Intel integration took extra time (edge cases)
- SnoozeDialog came in under (reused components)
- Zero merge conflicts - worktrees are awesome

🎯 Next Week Plan:
- Advanced conditions (10h)
- Polish & launch prep (10h)
- Demo materials (5h)
Total: 25h
```

**You respond:**
```
Great week! Intel integration complexity makes sense.
Keep up the momentum for launch prep.
```

**Open board, glance at Done column - see 5 completed tasks.**

**Done. 15 minutes.**

---

## 🎨 How to Use the Board (Web UI)

### View the Board

1. Go to https://github.com/Renew-Boo/renubu
2. Click "Projects" tab
3. Click "Renubu Q4 2025"
4. See the board!

### Move a Card

**Drag and drop:**
- Click card
- Hold and drag to new column
- Drop it
- Auto-saves

### Filter Cards

**Top right, click "Filter":**
- Show only: `assignee:agent-1`
- Show only: `label:priority-high`
- Show only: `status:in-progress`

### Add a Comment

**Click card → Comment box at bottom:**
```
Let's prioritize this for the customer demo on Friday.
Need it by Thursday afternoon.
```

**Agents see comments, adjust accordingly.**

### Create a Card (Rare)

**Usually Queen Bee creates cards, but if you want to:**

1. Click "+ Add item" at bottom of column
2. Click "⋮" → "Convert to issue"
3. Fill in:
   - Title: "Add export feature to dashboard"
   - Description: "Customers want CSV export of reports"
   - Estimate: 6h
   - Priority: High
   - Agent-Friendly: Yes
4. Click "Create"
5. Queen Bee sees it, will decompose and assign

---

## 🚫 What NOT to Do

**Don't:**
- ❌ Micromanage agents (check board every hour)
- ❌ Reassign cards constantly (let Queen Bee handle)
- ❌ Create super detailed subtasks (Queen Bee does this)
- ❌ Track time manually (automated)
- ❌ Worry about In Progress cards moving slowly (agents coordinate)

**Do:**
- ✅ Trust the system
- ✅ Focus on your strategic work
- ✅ Check board once daily
- ✅ Respond to questions promptly
- ✅ Celebrate wins

---

## 🎯 Success Patterns

### Week 1 (Learning)
- Check board 2-3x per day (curiosity)
- Answer lots of questions (agents learning preferences)
- Time investment: 30 min/day

### Week 2-3 (Settling)
- Check board 1x per day (morning routine)
- Fewer questions (agents know patterns)
- Time investment: 10-15 min/day

### Week 4+ (Smooth)
- Check board 1x per day (quick glance)
- Rare questions (only real blockers)
- Time investment: 5-10 min/day

**Goal:** System runs itself, you focus on business

---

## 📱 Mobile Access (Optional)

**GitHub Mobile App:**
1. Download from App Store / Play Store
2. Sign in
3. Navigate to project
4. See board on phone
5. Comment, move cards

**Use case:** Respond to urgent blockers while away from desk

---

## 🔗 Related Docs

- `PLAN.md` - Current roadmap and phases
- `AGENT-GUIDE.md` - How agents use GitHub Projects
- `STATE.md` - What's currently built

---

## ❓ FAQ

**Q: Do I need to assign tasks to agents?**
A: No. Queen Bee assigns work. You only reassign if you have specific reason.

**Q: What if I disagree with Queen Bee's approach?**
A: Comment on the issue or mention in Google Chat. Queen Bee will explain reasoning, adjust if needed.

**Q: Can I create issues directly?**
A: Yes, but usually better to tell Queen Bee what you want and let it decompose into proper tasks.

**Q: What if agents are moving too slow?**
A: Check velocity report. If below target (80%), Queen Bee will diagnose and adjust. Trust the metrics.

**Q: What if I'm traveling and unavailable?**
A: Agents keep working. Queen Bee handles day-to-day. You catch up when back.

**Q: How do I know if we're on track?**
A: Weekly velocity report shows % of plan completed. Green = on track, yellow = slight delay, red = major issue.

---

**Your Role Summary:**
- 🎯 Strategic: Set priorities, answer business questions
- 👀 Observer: Monitor progress, celebrate wins
- 🚫 NOT: Micromanager, task creator, hour tracker

**Time Investment:**
- Daily: 5-10 minutes
- Weekly: 15-20 minutes
- Monthly: 30 minutes

**The system works for you, not the other way around.**

---

**Document Status:** Living document (update as you learn preferences)
**Next Update:** After Phase 0.1 (Nov 22) with real usage insights
