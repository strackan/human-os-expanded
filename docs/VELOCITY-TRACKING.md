# Velocity Tracking System

**Last Updated:** 2025-11-05
**Purpose:** Measure agentification effectiveness and predict project completion
**Target:** 22-36% velocity boost (per Q4-2025 plan)

---

## Overview

The velocity tracking system measures how quickly we complete work using multi-agent development compared to single-agent or traditional development. This data validates our agentification strategy and helps forecast project timelines.

**Key Metrics:**
- **Velocity Boost** - How much faster we ship vs estimates
- **Accuracy** - Estimated vs actual hours per task
- **Quality Score** - Code quality maintained at high speed
- **Agent Utilization** - Efficiency of parallel execution

---

## 📊 Core Metrics

### 1. Velocity (Primary Metric)

**Definition:**
```
Velocity = (Work Completed) / (Calendar Time) × 100%

Where:
- Work Completed = Sum of estimated hours for completed tasks
- Calendar Time = Actual time elapsed on calendar
```

**Example:**
```
Week 2 Q4 Plan:
- Work estimated: 25 hours
- Calendar time: 1.5 days = 12 calendar hours
- Velocity = 25h / 12h × 100% = 208%
- Boost = 108% faster than planned
```

**Target Ranges:**
- **Conservative (Q4 goal):** 122% (22% boost)
- **Moderate:** 128% (28% boost)
- **Aggressive:** 136% (36% boost)

**Interpretation:**
- 100% = On schedule (no boost)
- 122% = 22% faster than planned (conservative target)
- 200% = Twice as fast (exceptional)
- <100% = Behind schedule (investigate blockers)

### 2. Estimation Accuracy

**Definition:**
```
Accuracy = |Actual Hours - Estimated Hours| / Estimated Hours × 100%

Target: <25% variance
```

**Example:**
```
Task: "Build useWeeklyPlanner hook"
- Estimated: 3 hours
- Actual: 3.5 hours
- Variance: |3.5 - 3| / 3 × 100% = 16.7%
- Status: ✅ Within 25% target
```

**Categories:**
- **Excellent:** <10% variance
- **Good:** 10-25% variance
- **Fair:** 25-50% variance
- **Poor:** >50% variance (needs better estimation)

**Track by:**
- Task type (agent-friendly vs human-required)
- Agent (some agents more accurate than others)
- Complexity (simple, medium, complex)

### 3. Quality Score

**Definition:**
8-dimension code review score (per PR)

**Dimensions:**
1. **Correctness** - Does it work? Tests pass?
2. **Maintainability** - Follows patterns, readable?
3. **Performance** - No obvious bottlenecks?
4. **Security** - No vulnerabilities?
5. **Test Coverage** - >60% for critical paths?
6. **Documentation** - Updated and clear?
7. **Style** - Linted, formatted consistently?
8. **Integration** - Works with other code?

**Scoring:**
```
Quality Score = (Dimensions Passing) / 8 × 100%

Example:
✅ Correctness
✅ Maintainability
✅ Performance
✅ Security
⚠️ Test Coverage (only 45%)
✅ Documentation
✅ Style
✅ Integration

Score = 7/8 × 100% = 87.5%
```

**Target:** >90% average across all PRs

**Interpretation:**
- 100% = Perfect (rare)
- 90-99% = Excellent
- 80-89% = Good
- 70-79% = Acceptable (improvements needed)
- <70% = Poor (require rework)

### 4. Agent Utilization

**Definition:**
```
Utilization = (Agent-Hours Used) / (Agent-Hours Available) × 100%

Where:
- Agent-Hours Used = Actual work completed by agents
- Agent-Hours Available = Agents launched × time available
```

**Example:**
```
Monday work:
- 3 agents launched for full 8-hour day
- Agent-Hours Available = 3 × 8 = 24 hours
- Work completed = 13.5 hours
- Utilization = 13.5 / 24 × 100% = 56%
- Interpretation: Could launch more agents or agents had idle time
```

**Target:** 70-85% utilization

**Interpretation:**
- <50% = Under-utilized (launch more agents or better task sizing)
- 50-70% = Moderate (some idle time acceptable)
- 70-85% = Optimal (agents busy but not overloaded)
- >85% = High (risk of burnout, may indicate too much work)

### 5. Conflict Rate

**Definition:**
```
Conflict Rate = (Merge Conflicts) / (Total Merges) × 100%

Target: 0% (git worktrees should eliminate)
```

**Example:**
```
Week with 15 PRs merged:
- 0 merge conflicts
- Conflict Rate = 0 / 15 × 100% = 0%
- Status: ✅ Git worktrees working perfectly
```

**If >0%:**
- Investigate: Why did conflict occur?
- Common causes:
  - Agents working on same file (should be avoided)
  - Shared configuration files (need better coordination)
  - Database migrations (should be serialized)

---

## 📋 Tracking Templates

### Daily Update Template (Queen Bee)

**Post to Google Chat at EOD:**

```markdown
🤖 Daily Summary - [Date]

✅ Completed ([X] Issues, [Y] PRs merged):
- Issue #[NUM]: [Title] (Agent [X]) - [hours]h - Quality: [score]%
- Issue #[NUM]: [Title] (Agent [Y]) - [hours]h - Quality: [score]%
- ...
Total: [X]h

🔄 In Progress ([N] agents working):
- Issue #[NUM]: [Title] (Agent [X]) - [%] done, ~[hours]h remaining
- ...

🚧 Blockers:
- [Description of blocker] - Waiting on [person/thing]
- OR: None

📊 Velocity:
- Planned for week: [X]h
- Completed today: [Y]h
- Week total so far: [Z]h ([%]% of week in [N] days)
- Trajectory: [On track / Ahead / Behind]

💡 Insights:
- [What went well]
- [What slowed us down]
- [Learnings]

🎯 Tomorrow:
- [Plan for next day]
- [Estimated hours]

🔗 Links:
- Dev environment: [URL]
- PRs merged: #[NUM], #[NUM], ...
- GitHub Projects: [URL]

📈 Metrics:
- Quality avg: [%]
- Utilization: [%]
- Conflicts: [N]
```

**Example:**

```markdown
🤖 Daily Summary - 2025-11-05 (Monday)

✅ Completed (3 Issues, 3 PRs merged):
- Issue #301: WeeklyPlannerWorkflow container (Agent A) - 8h - Quality: 100%
- Issue #302: useWeeklyPlanner hook (Agent B) - 3h - Quality: 100%
- Issue #303: WorkloadAnalysis integration (Agent C) - 2.5h - Quality: 87.5%
Total: 13.5h

🔄 In Progress (2 agents working):
- Issue #304: API routes (Agent D) - 50% done, ~1h remaining
- Issue #305: Integration tests (Agent E) - 30% done, ~2h remaining

🚧 Blockers: None

📊 Velocity:
- Planned for week: 20h
- Completed today: 13.5h
- Week total so far: 13.5h (67% of week in 1 day!)
- Trajectory: Will finish 2 days early

💡 Insights:
- Parallel execution (3 agents) very effective
- Agent C needed 1 round of fixes (type mismatch) - normal
- All merges successful, zero conflicts
- Git worktrees working perfectly

🎯 Tomorrow:
- Agents D, E complete current work (AM)
- Launch Issue #306 (documentation) if time permits
- Integration testing on dev environment

🔗 Links:
- Dev: https://renubu-dev.vercel.app
- PRs: #401, #402, #403
- Board: https://github.com/orgs/Renew-Boo/projects/1

📈 Metrics:
- Quality avg: 95.8%
- Utilization: 56% (could launch more work)
- Conflicts: 0
```

### Weekly Report Template

**Post to Google Chat every Friday:**

```markdown
📊 Weekly Velocity Report - Week of [Date]

🎯 Planned Work:
- [Task 1]: [X]h estimated
- [Task 2]: [Y]h estimated
- [Task 3]: [Z]h estimated
Total planned: [SUM]h

✅ Completed:
- [Task 1]: [X]h actual (DONE) - Quality: [%]
- [Task 2]: [Y]h actual (DONE) - Quality: [%]
Total completed: [SUM]h ([%]% of plan)

🔄 In Progress:
- [Task 3]: [X]h spent, [Y]h remaining ([%]% done)

🚧 Blocked:
- [Task 4]: Waiting on [reason]

📈 Velocity Metrics:
- Planned work: [X]h
- Completed work: [Y]h
- Calendar time: [Z] days
- Velocity: [%]
- Boost vs baseline: [%]

📊 Quality Metrics:
- Average PR quality: [%]
- PRs merged: [N]
- PRs requiring rework: [N] ([%]%)
- Merge conflicts: [N]

⚡ Agent Metrics:
- Agents launched: [N]
- Agent-hours available: [X]h
- Agent-hours used: [Y]h
- Utilization: [%]
- Agent-friendly accuracy: [%] variance
- Human-required accuracy: [%] variance

💰 Cost Analysis:
- API costs: $[X]
- Cost per completed hour: $[Y]
- Estimated savings vs traditional: $[Z]

💭 Insights:
- [What went well this week]
- [What slowed us down]
- [Process improvements identified]
- [Adjustments for next week]

🎯 Next Week Plan:
- [Task A]: [X]h
- [Task B]: [Y]h
- [Task C]: [Z]h
Total: [SUM]h

📸 Screenshots/Demos:
[Links to demos or screenshots of completed work]

🔗 Links:
- GitHub Projects: [URL]
- Staging environment: [URL]
- PRs merged this week: #[NUM]-#[NUM]
```

### Task Estimation Template

**For each GitHub Issue:**

```markdown
---
**Estimated Time:** [X] hours

**Confidence:** [High/Medium/Low]

**Agent-Friendly:** [Yes/No]

**Dependencies:**
- [Task A must complete first]
- [Requires access to X]
- [Needs design approval]
- OR: None

**Complexity:** [Simple/Medium/Complex]

**Risk Factors:**
- [Unknown API behavior]
- [No existing pattern to follow]
- [Multiple integration points]
- OR: Low risk

**Estimation Breakdown:**
- Research/reading: [X]h
- Implementation: [Y]h
- Testing: [Z]h
- Documentation: [W]h
- Buffer (25%): [V]h
---
```

### Task Completion Template

**Agent posts to Issue when done:**

```markdown
✅ **Task Complete**

**Actual Time:** [X] hours
**Quality Self-Assessment:** [X]/8 dimensions

**What Went Well:**
- [Thing 1]
- [Thing 2]

**Challenges:**
- [Challenge 1] - Resolved by [solution]
- [Challenge 2] - Escalated to queen bee

**Learnings:**
- [Learning 1]
- [Learning 2]

**PR:** #[NUM]
**Tests:** [All passing / N failures]
**Documentation:** [Updated / No updates needed]

**Ready for Review:** @queen-bee
```

---

## 📁 Tracking System Implementation

### Option 1: Spreadsheet (Simple - Recommended for Start)

**Google Sheets structure:**

**Sheet 1: Daily Log**
| Date | Issue # | Title | Assigned To | Estimated (h) | Actual (h) | Variance (%) | Quality (%) | Status |
|------|---------|-------|-------------|---------------|------------|--------------|-------------|--------|
| 2025-11-05 | #301 | Workflow container | Agent A | 8 | 8 | 0% | 100% | Complete |
| 2025-11-05 | #302 | useWeeklyPlanner hook | Agent B | 3 | 3.5 | 16.7% | 100% | Complete |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Sheet 2: Weekly Summary**
| Week Start | Week # | Planned (h) | Completed (h) | Velocity (%) | Boost (%) | Avg Quality (%) | Conflicts | Notes |
|------------|--------|-------------|---------------|--------------|-----------|-----------------|-----------|-------|
| 2025-11-04 | Week 2 | 25 | 25 | 208% | 108% | 95.8% | 0 | Excellent week |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Sheet 3: Agent Performance**
| Agent | Tasks Completed | Total Hours | Avg Quality | Avg Accuracy | Notes |
|-------|-----------------|-------------|-------------|--------------|-------|
| Agent A | 5 | 18h | 98% | 8% variance | Excellent |
| Agent B | 4 | 12h | 95% | 12% variance | Good |
| ... | ... | ... | ... | ... | ... |

**Sheet 4: Sprint/Project Summary**
| Sprint | Start Date | End Date | Planned (h) | Actual (h) | Velocity (%) | Budget Status | Notes |
|--------|------------|----------|-------------|------------|--------------|---------------|-------|
| Sprint 0 | 2025-11-04 | 2025-11-08 | 20 | TBD | TBD | TBD | Documentation |
| Week 2 | 2025-11-13 | 2025-11-22 | 20 | TBD | TBD | TBD | UI Integration |
| ... | ... | ... | ... | ... | ... | ... | ... |

### Option 2: GitHub Projects (Automated)

**Custom Fields in GitHub Projects:**
- `Estimated Hours` (number)
- `Actual Hours` (number)
- `Agent Assigned` (single select)
- `Quality Score` (number, 0-100)
- `Confidence` (single select: High/Medium/Low)
- `Agent-Friendly` (single select: Yes/No)
- `Started Date` (date)
- `Completed Date` (date)

**Automation Rules:**
1. When Issue assigned → Set `Started Date` to today
2. When Issue closed → Prompt for `Actual Hours` and `Quality Score`
3. When PR merged → Link to Issue, auto-close
4. Weekly → Calculate velocity, post to discussions

**Views:**
1. **Kanban Board** - Visual task flow
2. **Velocity Dashboard** - Charts and metrics
3. **Agent Workload** - Current assignments
4. **Sprint Timeline** - Gantt-style view

### Option 3: Custom Dashboard (Advanced)

**Tech Stack:**
- Next.js page at `/dashboard/velocity`
- Supabase for data storage
- Recharts for visualizations
- GitHub API for Issue data

**Features:**
- Real-time velocity tracking
- Agent performance analytics
- Burndown charts
- Quality trends
- Cost analysis

**Schema:**
```sql
CREATE TABLE velocity_tracking (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  issue_number INT NOT NULL,
  title TEXT NOT NULL,
  assigned_to TEXT, -- Agent name
  estimated_hours DECIMAL,
  actual_hours DECIMAL,
  quality_score INT, -- 0-100
  agent_friendly BOOLEAN,
  status TEXT, -- 'in_progress', 'completed', 'blocked'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weekly_summaries (
  id UUID PRIMARY KEY,
  week_start DATE NOT NULL,
  week_number INT NOT NULL,
  planned_hours DECIMAL,
  completed_hours DECIMAL,
  velocity_percent DECIMAL,
  avg_quality DECIMAL,
  merge_conflicts INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📈 Velocity Calculations

### Weekly Velocity

```typescript
interface WeekData {
  plannedHours: number;
  completedHours: number;
  calendarDays: number;
}

function calculateVelocity(data: WeekData): number {
  const workDays = data.calendarDays * 8; // Assume 8h work days
  const velocity = (data.completedHours / workDays) * 100;
  return velocity;
}

function calculateBoost(velocity: number): number {
  const boost = velocity - 100;
  return boost;
}

// Example:
const week2 = {
  plannedHours: 25,
  completedHours: 25,
  calendarDays: 1.5, // Finished in 1.5 days
};

const velocity = calculateVelocity(week2);
// velocity = (25 / 12) * 100 = 208%

const boost = calculateBoost(velocity);
// boost = 208 - 100 = 108% boost

console.log(`Velocity: ${velocity}%, Boost: ${boost}%`);
// Output: "Velocity: 208%, Boost: 108%"
```

### Cumulative Project Velocity

```typescript
interface ProjectData {
  totalPlannedHours: number;
  totalCompletedHours: number;
  totalCalendarDays: number;
}

function calculateProjectVelocity(data: ProjectData): {
  velocity: number;
  boost: number;
  projectedCompletion: number;
} {
  const workDays = data.totalCalendarDays * 8;
  const velocity = (data.totalCompletedHours / workDays) * 100;
  const boost = velocity - 100;

  // Remaining work calculation
  const remainingHours = data.totalPlannedHours - data.totalCompletedHours;
  const projectedDays = remainingHours / (velocity / 100) / 8;

  return {
    velocity,
    boost,
    projectedCompletion: projectedDays,
  };
}

// Example: Q4 Project
const q4Project = {
  totalPlannedHours: 177, // From Q4 plan
  totalCompletedHours: 45, // After 2 weeks
  totalCalendarDays: 5, // 5 working days
};

const projectStats = calculateProjectVelocity(q4Project);
console.log(projectStats);
// {
//   velocity: 112.5%,
//   boost: 12.5%,
//   projectedCompletion: 11.7 days (vs 22 days planned)
// }
```

### Agent-Friendly vs Human-Required Accuracy

```typescript
interface TaskData {
  type: 'agent-friendly' | 'human-required';
  estimated: number;
  actual: number;
}

function calculateAccuracyByType(tasks: TaskData[]): {
  agentFriendly: number;
  humanRequired: number;
} {
  const agentTasks = tasks.filter(t => t.type === 'agent-friendly');
  const humanTasks = tasks.filter(t => t.type === 'human-required');

  const avgVariance = (tasks: TaskData[]) => {
    const variances = tasks.map(t =>
      Math.abs(t.actual - t.estimated) / t.estimated
    );
    return variances.reduce((a, b) => a + b, 0) / variances.length * 100;
  };

  return {
    agentFriendly: avgVariance(agentTasks),
    humanRequired: avgVariance(humanTasks),
  };
}

// Example:
const tasks: TaskData[] = [
  { type: 'agent-friendly', estimated: 8, actual: 8.5 },  // 6.25% variance
  { type: 'agent-friendly', estimated: 3, actual: 3.2 },  // 6.67% variance
  { type: 'human-required', estimated: 4, actual: 6 },    // 50% variance
  { type: 'human-required', estimated: 2, actual: 3.5 },  // 75% variance
];

const accuracy = calculateAccuracyByType(tasks);
console.log(accuracy);
// {
//   agentFriendly: 6.46%,  // Excellent accuracy
//   humanRequired: 62.5%,  // Poor accuracy, need better estimation
// }
```

---

## 🎯 Success Criteria

### Sprint 0 (Documentation Phase)
- **Velocity:** N/A (research and planning)
- **Goal:** Complete foundation docs
- **Target:** 20h estimated, ≤25h actual

### Week 2-3 (First Real Work)
- **Velocity:** 120%+ (20% boost minimum)
- **Quality:** >85% average
- **Utilization:** 60-75%
- **Conflicts:** 0

### Week 4-5 (Optimization)
- **Velocity:** 125%+ (25% boost)
- **Quality:** >90% average
- **Utilization:** 70-85%
- **Accuracy:** <20% variance on agent-friendly tasks

### Q4 Overall (Project Success)
- **Velocity:** 122-136% (22-36% boost per plan)
- **Quality:** >90% average maintained
- **Budget:** Ship 177h of work in 120-140 calendar hours
- **Outcome:** Weekly Planner launched Dec 20

---

## 🚨 Alert Thresholds

### Red Flags (Immediate Action)

**Velocity <100%** (Behind schedule)
- **Action:** Daily sync with human
- **Investigate:** What's blocking agents?
- **Adjust:** More agents, better task breakdown, or extend timeline

**Quality <70%** (Poor code quality)
- **Action:** Halt new work, review process
- **Investigate:** Why is quality dropping?
- **Adjust:** More thorough review, better prompts, human pair programming

**Utilization <40%** (Agents idle)
- **Action:** Launch more agents or larger tasks
- **Investigate:** Are tasks too small?
- **Adjust:** Better task sizing, more parallel work

**Conflicts >5%** (Git worktrees failing)
- **Action:** Review task assignment
- **Investigate:** Are agents working on same files?
- **Adjust:** Better task decomposition, clearer boundaries

### Yellow Flags (Monitor Closely)

**Velocity 100-110%** (Minimal boost)
- **Monitor:** Are agents underutilized?
- **Consider:** More parallel work, better orchestration

**Quality 70-85%** (Below target)
- **Monitor:** Specific agents or task types struggling?
- **Consider:** More detailed review, clearer standards

**Utilization >85%** (Agents overloaded)
- **Monitor:** Are agents getting overwhelmed?
- **Consider:** Reduce concurrent agents, better pacing

**Accuracy >25% variance** (Poor estimation)
- **Monitor:** Specific task types inaccurate?
- **Consider:** Adjust estimation formulas, add buffer

---

## 📊 Reporting Cadence

**Daily (EOD):**
- Queen bee posts summary to Google Chat
- Update tracking spreadsheet/GitHub Projects
- Flag any blockers immediately

**Weekly (Friday):**
- Queen bee posts weekly velocity report
- Calculate metrics and trends
- Human reviews and approves next week plan

**Sprint (End of Sprint):**
- Comprehensive sprint retrospective
- Compare planned vs actual across all metrics
- Identify learnings and process improvements
- Adjust strategy for next sprint

**Project (End of Q4):**
- Final project velocity report
- ROI analysis (time saved, cost, quality maintained)
- Document lessons learned
- Share with community

---

## 🔗 Related Documentation

- `docs/AGENTIFICATION-STRATEGY.md` - How we orchestrate agents
- `docs/labs/Q4-2025-DEVELOPMENT-PLAN.md` - Master plan with 22-36% target
- `docs/AGENT-COMMUNICATION.md` - How metrics are reported
- `docs/GIT-WORKFLOW.md` - How work flows through system

---

## ✅ Quick Start

**To start tracking velocity today:**

1. **Create Google Sheet** (easiest)
   - Copy templates above
   - Share with team
   - Update daily

2. **Or use GitHub Projects**
   - Add custom fields (Estimated Hours, Actual Hours, Quality Score)
   - Create views for metrics
   - Automate where possible

3. **Or build custom dashboard** (if engineering time available)
   - Create `/dashboard/velocity` page
   - Connect to GitHub API + Supabase
   - Real-time visualizations

**Recommendation for Sprint 0:**
- Start with Google Sheets (5 minutes setup)
- Migrate to GitHub Projects in Week 2
- Build custom dashboard in Week 4 if needed

---

**Document Status:** ✅ Ready to Use
**Next Steps:** Create tracking spreadsheet and start logging
**Owner:** Queen Bee Agent + Human (shared responsibility)
