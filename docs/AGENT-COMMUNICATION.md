# Agent Communication Protocol

**Last Updated:** 2025-11-05
**Owner:** Engineering Team
**Purpose:** Establish clear communication patterns for AI agent & human collaboration

---

## Overview

Renubu development uses **agentified development** - AI agents (like Claude Code) work alongside human developers to accelerate feature development. Clear communication protocols ensure smooth collaboration, prevent blockers, and maintain code quality.

**Expected Velocity Boost:** 22-36% (per Q4-2025-DEVELOPMENT-PLAN.md)

---

## 🎯 Communication Principles

1. **Async-First** - Don't wait for responses, document decisions
2. **Context-Rich** - Provide full context in every message
3. **Transparent** - Document what's done, what's blocked, what's next
4. **Proactive** - Raise issues early, don't wait for them to escalate
5. **Respectful** - Agents and humans are partners, not adversaries

---

## 📡 Communication Channels

### 1. Google Chat Space: "Renubu Dev Sync"
**Purpose:** Daily updates, quick questions, non-blocking communication

**When to Use:**
- Daily status updates
- Completed task announcements
- Quick clarifications
- FYI announcements
- Non-urgent questions

**Response Time:** Within 2 hours during business hours (9am-5pm ET)

**Format:**
```
📅 Daily Update - 2025-11-05
✅ Completed: [Tasks completed today]
🔄 In Progress: [Current work and % done]
🚧 Blockers: [Any issues blocking progress]
📊 Hours: [Hours logged] / [Hours estimated today]
```

**Example:**
```
📅 Daily Update - 2025-11-05

✅ Completed:
- Created DEPLOYMENT-STRATEGY.md (1.5h)
- Created GIT-WORKFLOW.md (1h)
- Validated production Vercel deployment

🔄 In Progress:
- Agent communication protocol (50% done, 0.5h remaining)
- Current state documentation (not started)

🚧 Blockers:
- None currently

📊 Hours: 3h / 8h planned today

Next: Complete agent onboarding docs, then start current state audit
```

### 2. GitHub Issues
**Purpose:** Task tracking, feature planning, bug reports

**When to Use:**
- Create issues for each task from Q4 plan
- Track bugs discovered during development
- Feature requests from design partners
- Technical debt items

**Labels:**
- `priority:high` - Blocking or critical
- `priority:medium` - Important but not blocking
- `priority:low` - Nice to have
- `type:bug` - Something broken
- `type:feature` - New functionality
- `type:docs` - Documentation work
- `type:refactor` - Code improvement
- `status:blocked` - Waiting on something
- `agent-friendly` - Good for AI agent work
- `human-required` - Needs human judgment

**Issue Template:**
```markdown
## Description
Clear description of the task or bug

## Context
Why is this needed? What's the bigger picture?

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests passing
- [ ] Documentation updated

## Technical Notes
Any relevant technical details, gotchas, or dependencies

## Estimated Time
2-4 hours

## Related Issues
#123, #456
```

### 3. GitHub Pull Requests
**Purpose:** Code review, merge requests, discussion of implementation details

**When to Use:**
- All code changes (no direct commits to main/staging/dev)
- Request code review
- Discuss implementation approaches
- Get approval before merging

**PR Guidelines:**
- Use PR templates (see GIT-WORKFLOW.md)
- Link related issues
- Provide screenshots/demos for UI changes
- Request specific reviewers
- Respond to review comments within 24 hours

### 4. Code Comments & Documentation
**Purpose:** Inline context, architecture decisions, complex logic explanations

**When to Use:**
- Complex algorithms (explain the "why")
- Non-obvious code patterns
- Temporary hacks (with TODO)
- Architecture decisions
- Edge case handling

**Format:**
```typescript
/**
 * findNextOpening() - THE MAGIC ALGORITHM
 *
 * Finds the next available calendar slot with intelligent scoring based on:
 * - Work hours and availability
 * - Energy levels (morning vs afternoon)
 * - Task type alignment (deep work needs longer blocks)
 * - Focus block preferences
 * - Buffer time around meetings
 * - Context switching minimization
 *
 * @param options - Configuration for slot finding
 * @returns Best available time slot or null if none found
 */
static async findNextOpening(options: FindOpeningOptions): Promise<TimeSlot | null> {
  // ... implementation
}
```

---

## 📋 Daily Update Format

### For AI Agents (Claude Code, etc.)

**When:** End of each work session (typically end of day)
**Where:** Google Chat Space "Renubu Dev Sync"

**Template:**
```
🤖 Agent Update - [Date] - [Agent Name]

📝 Session Summary:
- Duration: [X hours]
- Branch: [branch-name]
- Focus: [What I worked on]

✅ Completed:
- [Task 1] - [Link to PR/commit if applicable]
- [Task 2] - [Link to PR/commit if applicable]

🔄 In Progress:
- [Task 3] - [Current state, % done, estimated time remaining]

🚧 Blockers:
- [Blocker 1] - [Why blocked, what's needed to unblock]
- OR: None currently

💭 Questions/Decisions Needed:
- [Question 1] - [Context and options]
- OR: None currently

📊 Velocity:
- Estimated: [X hours]
- Actual: [Y hours]
- Variance: [+/- Z hours] ([reason if significant])

🔗 Links:
- PRs: [PR #1], [PR #2]
- Issues closed: [#123], [#456]
- Documentation: [Link to new docs]

🎯 Next Session Plan:
- [Task to start next]
- [Estimated time]
```

### For Human Developers

**When:** End of each work day
**Where:** Google Chat Space "Renubu Dev Sync"

**Template (more concise):**
```
👤 Update - [Date] - [Your Name]

✅ Today:
- [What I completed]

🔄 Tomorrow:
- [What I'm planning to work on]

🚧 Blockers:
- [Any blockers or concerns]
```

---

## 🚨 Escalation Protocol

### Level 1: Question (Non-Blocking)
**Response Time:** Within 2 hours during business hours

**Format:**
```
❓ Quick Question - [Topic]

Context: [Brief context]
Question: [Specific question]
Impact: [What's blocked if not answered]

Options considered:
1. [Option A]
2. [Option B]

Preference: [Your suggested approach]
```

**Where:** Google Chat Space or GitHub PR comment

### Level 2: Blocker (Work Stopped)
**Response Time:** Within 1 hour during business hours, 4 hours after hours

**Format:**
```
🚧 BLOCKER - [Issue]

What's blocked: [Specific task or feature]
Root cause: [Why it's blocked]
Impact: [How this affects timeline]
Workarounds considered: [What alternatives you tried]
Need: [Specifically what you need to proceed]

@mention [Specific person who can unblock]
```

**Where:** Google Chat Space with @mention

### Level 3: Critical Issue (Production Down)
**Response Time:** Immediate

**Format:**
```
🔥 CRITICAL - [Issue]

Severity: [Production down / Major customer impact / etc.]
What's broken: [Specific problem]
Customer impact: [How many customers affected]
Error details: [Error message, logs, screenshots]
Attempted fixes: [What you've tried]
Rollback possible: [Yes/No - if yes, what's the command]

@mention [Tech Lead / On-call person]
```

**Where:** Google Chat Space + Phone call if no response in 5 minutes

---

## 🤝 Code Review Protocol

### Requesting Review

**When:** PR is ready (not a draft)

**Process:**
1. Create PR with clear description (use template)
2. Self-review the PR first (catch obvious issues)
3. Assign specific reviewers based on expertise
4. Add labels (priority, type, estimated review time)
5. Link related issues
6. Post in Google Chat if urgent

**Google Chat Announcement:**
```
📝 PR Ready for Review

Title: [PR title]
Link: [PR URL]
Type: [feature/bugfix/refactor]
Size: [Small <100 lines / Medium <500 lines / Large >500 lines]
Priority: [high/medium/low]
Reviewers: @[person1] @[person2]
Context: [Brief description]
Urgency: [When do you need this merged?]
```

### Providing Review

**Response Time:**
- Small PRs (<100 lines): Within 4 hours
- Medium PRs (<500 lines): Within 24 hours
- Large PRs (>500 lines): Within 48 hours

**Review Checklist:**
- [ ] Code follows project conventions
- [ ] Tests included and passing
- [ ] No obvious bugs
- [ ] Performance implications considered
- [ ] Security checked
- [ ] Documentation updated
- [ ] Breaking changes flagged

**Feedback Format:**
- ✅ **Approve** - LGTM, ready to merge
- 💬 **Comment** - Suggestions but not blocking
- 🚫 **Request Changes** - Must address before merging

**Comment Types:**
```
🔴 [blocker] - Must fix before merging
🟡 [suggestion] - Nice to have, not required
🔵 [question] - Clarification needed
💡 [idea] - Consider for future iteration
```

**Example:**
```
🔴 [blocker] Missing error handling on line 45
If the API call fails, this will crash. Please add try/catch.

🟡 [suggestion] Consider extracting this into a helper function
Lines 100-150 could be a reusable utility. Not blocking though.

🔵 [question] Why did we change the approach here?
Previous implementation used X, now it's Y. What's the reasoning?
```

### Responding to Review

**Response Time:** Within 24 hours

**Process:**
1. Address all 🔴 blockers
2. Consider 🟡 suggestions (implement if easy)
3. Answer 🔵 questions with context
4. Push updates to the same PR
5. Comment "@reviewer ready for re-review"

**If Disagreeing:**
```
Thanks for the feedback! Regarding [specific comment]:

Context: [Why you made the original choice]
Trade-offs: [Pros/cons of your approach vs suggested approach]
Proposal: [Your suggested resolution]

Open to discussing synchronously if needed.
```

---

## 📊 Velocity Tracking

### Weekly Velocity Report

**When:** Every Friday end of day
**Where:** Google Chat Space + Update velocity spreadsheet

**Format:**
```
📊 Weekly Velocity Report - Week of [Date]

🎯 Planned Work:
- [Task 1]: 8h estimated
- [Task 2]: 4h estimated
- [Task 3]: 6h estimated
Total planned: 18h

✅ Completed:
- [Task 1]: 10h actual (DONE)
- [Task 2]: 3h actual (DONE)
Total completed: 13h (72% of plan)

🔄 In Progress:
- [Task 3]: 4h spent, 3h remaining (67% done)

🚧 Blocked:
- [Task 4]: Waiting on design partner feedback

📈 Metrics:
- Velocity: 72% (10/13 completed)
- Accuracy: 92% (actual vs estimated)
- Agent-assisted tasks: 80% completion rate
- Human-required tasks: 60% completion rate

💭 Insights:
- [What went well]
- [What slowed us down]
- [Adjustments for next week]

🎯 Next Week Plan:
- [Task A]: 6h
- [Task B]: 8h
- [Task C]: 4h
Total: 18h
```

### Task Time Tracking

**For Each Task:**
- Estimated hours (before starting)
- Actual hours (after completion)
- Variance (actual - estimated)
- Reason for variance (if >25%)

**Categories:**
- **Agent-Friendly** (70-85% completion rate expected)
  - OAuth implementation
  - Database queries
  - Component structure
  - API routes
  - Test writing
  - Documentation

- **Human-Required** (review and guidance needed)
  - UX/UI design decisions
  - Complex state management
  - Performance optimization
  - Security review
  - Product direction

---

## 🔄 Handoff Protocol

### Agent → Human Handoff

**When:** Agent completes work, needs human review/decision

**Format:**
```
🤝 Handoff to Human - [Task Name]

✅ What I Completed:
- [List of deliverables]
- [Link to PR]
- [Link to documentation]

🧪 Testing Done:
- [Tests written]
- [Manual testing performed]
- [Edge cases considered]

💭 Decisions Made:
- [Decision 1]: Chose X over Y because [reason]
- [Decision 2]: Implemented Z approach

❓ Decisions Needed:
- [Decision 1]: Should we do A or B? [context and trade-offs]
- [Decision 2]: Is this UX acceptable? [screenshot]

📋 Next Steps:
1. [Human should review X]
2. [Human should decide on Y]
3. [Then agent can proceed with Z]

🔗 Context:
- Issue: #123
- PR: #456
- Related docs: [links]
```

### Human → Agent Handoff

**When:** Human defines task, agent executes

**Format:**
```
🎯 Task for Agent - [Task Name]

📝 Goal:
[Clear description of what needs to be done]

🎨 Requirements:
- [Requirement 1]
- [Requirement 2]
- [Acceptance criteria]

📚 Context:
- Why: [Business context]
- Related: [Related features/systems]
- Constraints: [Technical constraints]

🗺️ Implementation Hints:
- File to modify: [path/to/file.ts]
- Pattern to follow: [reference another file]
- Edge cases: [list edge cases to handle]

✅ Definition of Done:
- [ ] Tests passing
- [ ] Documentation updated
- [ ] PR created
- [ ] No console errors

⏱️ Estimated Time: [X hours]

🔗 References:
- Design: [Figma link]
- Spec: [Doc link]
- Similar work: [PR #123]
```

---

## 🎯 Daily Standup (Async)

**When:** Every morning by 10am ET
**Where:** Google Chat Space
**Format:** Short, focused updates

**Template:**
```
🌅 Standup - [Date] - [Your Name]

Yesterday:
- [What I completed]

Today:
- [What I'm working on]

Blockers:
- [Any blockers or None]
```

**Example:**
```
🌅 Standup - 2025-11-05 - Claude Agent

Yesterday:
- Completed deployment strategy docs
- Completed git workflow docs
- Started agent communication protocol

Today:
- Finish agent communication protocol
- Start agent onboarding guide
- Create current state audit

Blockers:
- None
```

---

## 📞 Synchronous Communication

### When to Go Sync

- **Quick Questions** - Use chat first, escalate to call if complex
- **Blockers** - If async response taking too long
- **Pair Programming** - Complex refactoring or debugging
- **Architecture Decisions** - Major technical decisions
- **Conflict Resolution** - Disagreements on PR reviews

### Scheduling

**For Scheduled Calls:**
```
📅 Meeting Request - [Topic]

Purpose: [What we'll discuss]
Duration: [15/30/60 minutes]
Attendees: [Who needs to be there]
Agenda:
1. [Item 1]
2. [Item 2]
3. [Item 3]

Proposed times:
- Option 1: [Date/Time]
- Option 2: [Date/Time]
- Option 3: [Date/Time]

Prep: [What to review beforehand]
```

---

## 🎨 Documentation Standards

### Code Documentation

**When to Document:**
- Complex algorithms
- Non-obvious patterns
- Architecture decisions
- External API integrations
- Security-sensitive code

**Format:**
```typescript
/**
 * [Function Purpose]
 *
 * [Detailed explanation of what this does and why]
 *
 * @param {Type} paramName - Description
 * @returns {Type} Description
 * @throws {ErrorType} When/why this throws
 *
 * @example
 * const result = await functionName(param);
 */
```

### Markdown Documentation

**File Structure:**
```markdown
# Title

**Last Updated:** YYYY-MM-DD
**Owner:** Team/Person Name
**Status:** Draft/Active/Archived

---

## Overview
[2-3 sentence summary]

---

## Section 1
[Content]

---

## Related Documentation
- [Link 1]
- [Link 2]

---

**Document Status:** [Status]
**Next Review:** [Date or milestone]
```

---

## ❓ FAQ

**Q: What if I disagree with a code review comment?**
A: Respond with context and reasoning. Discuss asynchronously first, escalate to sync call if needed. Defer to tech lead if no consensus.

**Q: How do I know if a task is agent-friendly?**
A: Clear requirements, existing patterns to follow, no ambiguous decisions = agent-friendly. UI/UX choices, architecture decisions = human required.

**Q: What if I miss a daily update?**
A: Post a catch-up update when you can. If you'll be unavailable for multiple days, announce it in advance.

**Q: How detailed should commit messages be?**
A: Follow conventional commits. Subject line = what changed. Body = why it changed (if not obvious).

**Q: What if an agent makes a mistake?**
A: Review PR before merging, provide feedback in PR comments. Agent will learn and improve. Mistakes are expected and okay.

---

## 🔗 Related Documentation

- `docs/GIT-WORKFLOW.md` - Branch and merge strategies
- `docs/DEPLOYMENT-STRATEGY.md` - Environment setup
- `docs/AGENT-ONBOARDING.md` - Getting started guide for agents
- `docs/VELOCITY-TRACKING.md` - How we measure progress

---

**Document Status:** v0 Sprint 0
**Next Review:** After first week of agent collaboration
