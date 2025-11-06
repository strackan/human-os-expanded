# Weekly Planner - Renubu Labs Project

**Status:** 🚧 Phase 1 In Development
**Branch:** `renubu.lab.weeklyplanner`
**Timeline:** 8-10 weeks (Phase 1: 4-5 weeks, Phase 2: 3-4 weeks)
**Last Updated:** 2025-11-02

---

## 🎯 Vision

Build an AI-powered "Chief of Staff" system that transforms Renubu from a customer success platform into an intelligent personal productivity system. The weekly planner integrates work commitments (renewals, workflows, customer priorities) with personal goals to create a unified planning experience.

**Key Innovation:** Rather than treating planning as a separate activity, Renubu automatically surfaces your existing work commitments and intelligently schedules everything using AI.

---

## 💡 Core Features

### Phase 1: Core Weekly Planning (Weeks 1-5)
- **AI-Guided Weekly Planning Workflow** - 4-phase conversational planning
- **Workload Integration** - Auto-surface snoozed tasks, renewals, priorities
- **Calendar Intelligence** - Google/Microsoft integration with read + write
- **`findNextOpening()`** - Automatically schedule tasks in optimal time slots
- **Pattern Recognition** - Learn from past weeks to suggest realistic commitments
- **Spa Aesthetic Artifacts** - Calm, minimal, professional UI

### Phase 2: Advanced Automation (Weeks 6-9)
- **Project-to-Workflow** - Upload Excel/PDF plans → Generate active workflows
- **Mermaid Conversion** - Turn diagrams into executable workflows
- **Multi-Party Scheduling** - AI handles back-and-forth meeting coordination
- **Excel Export** - Generate weekly plan spreadsheets
- **Template Library** - Pre-built workflows for common scenarios

---

## 🏗️ Architecture

### Database Schema

**Phase 1 Tables:**
```
user_work_context - Store goals, projects, focus areas
weekly_plans - Track planning sessions
weekly_commitments - Individual commitments with outcomes
recurring_workflows - Schedule weekly planning
user_calendar_integrations - OAuth tokens
user_calendar_preferences - Work hours, energy mapping
scheduled_tasks - Tasks scheduled via findNextOpening()
```

See: `supabase/migrations/20251102140000_weekly_planner_phase1.sql`

### Service Layer

**WorkloadAnalysisService.ts** ✅ COMPLETE
- Pulls snoozed workflows
- Surfaces upcoming renewals
- Identifies high-priority customers
- Finds incomplete workflow tasks
- Categorizes by urgency (urgent/important/routine/suggested)

**CalendarService.ts** 🚧 IN PROGRESS
- OAuth for Google/Microsoft
- Fetch/create calendar events
- `findNextOpening()` algorithm
- Timezone handling

**WeeklyPlanningService.ts** 📋 PLANNED
- Create/track weekly plans
- Store commitments and outcomes
- Pattern analysis

**RecurringWorkflowService.ts** 📋 PLANNED
- Schedule recurring workflows
- Trigger at specified times
- Manage recurring patterns

### Workflow System

**Weekly Planning Workflow** (`weekly-planning`)

**Slides:**
1. `weeklyReflectionSlide` - "What felt good? What could improve?"
2. `lastWeekReviewSlide` - Commitment vs actual analysis
3. **`contextGatheringWorkloadSlide`** ⭐ - Integrated workload surfacing
4. `forwardPlanningSlide` - Week design with AI prioritization
5. `commitmentFinalizationSlide` - Auto-schedule with `findNextOpening()`
6. `weeklySummarySlide` - Generate artifacts

---

## 🔍 The `findNextOpening()` Algorithm

**Core Innovation:** Automatically find the next available calendar slot for a task.

```typescript
findNextOpening({
  userId: string,
  durationMinutes: number,
  taskType?: 'deep' | 'admin' | 'meeting' | 'personal',
  windowDays?: number, // Default 14
  preferences?: {
    preferredHours?: [number, number],
    avoidDays?: string[],
    minBufferBefore?: number,
    minBufferAfter?: number
  }
}): Promise<TimeSlot | null>
```

**Algorithm Steps:**
1. Fetch calendar events for window
2. Fetch user work hours preferences
3. Calculate all available gaps ≥ duration
4. Filter by preferences (work hours, task type)
5. Score slots (energy alignment, buffer time)
6. Return best slot

**Intelligence Layers:**
- **Energy Mapping** - Don't schedule deep work after long meetings
- **Context Grouping** - Group similar tasks on same day
- **Buffer Respect** - Honor transition time
- **Pattern Learning** - Learn when tasks actually get completed

---

## 🎨 Integrated Workload Analysis

**The Magic:** Weekly planning doesn't start from scratch—it automatically surfaces what needs attention.

### Context Gathering Slide Shows:

```
📋 SNOOZED TASKS (3)
• Obsidian Black renewal prep (snoozed from 2 weeks ago)
• Acme Corp quarterly review (snoozed until this week)
• TechCo expansion proposal (pending since last week)

🚨 CUSTOMER PRIORITIES (5)
• BlueShift Labs - Renewal in 28 days, no recent contact
• DataCore Inc - Risk score: High (usage down 40%)
• Horizon Media - Strategic opportunity, demo scheduled Thu

📊 INCOMPLETE WORKFLOWS (2)
• Strategic Account Plan for Acme (80% complete)
• Renewal workflow for TechCo (quote drafted, not sent)

📅 CALENDAR ANALYSIS
• 18 hours scheduled
• 22 hours available
• 3 focus blocks identified

Which should we prioritize this week?
```

### Data Sources:

**From `workflow_executions`:**
- Snoozed workflows due to resurface
- Status: `snoozed`, `snoozed_until <= current_week`

**From `customers`:**
- Renewals in next 60 days
- High risk scores (>= 4)
- High opportunity scores (>= 4)

**From `workflow_tasks`:**
- Status: `pending` or `in_progress`
- Assigned to user

**From `user_calendar_integrations`:**
- Upcoming events
- Available time blocks
- Focus time identification

---

## 📊 Pattern Recognition

Over time, the system learns:

**Over/Under Committing:**
- "You typically complete 60% of commitments"
- "You over-commit on Mondays"

**Task Type Patterns:**
- "Deep work tasks: 90 min average"
- "Customer check-ins: 30 min average"

**Energy Alignment:**
- "You complete most deep work 9am-12pm"
- "Admin tasks work better in afternoons"

**Customer Engagement:**
- "You typically engage with each customer every 2 weeks"
- "High-value customers get 2x more time"

---

## 🚀 Phase 1 Implementation Plan

### Week 1: Foundation
✅ Create feature branch
✅ Database migration (7 tables)
✅ WorkloadAnalysisService
🚧 CalendarService foundation

### Week 2: Calendar Integration
- Google Calendar OAuth
- Microsoft Graph OAuth
- `findNextOpening()` algorithm
- Calendar write access

### Week 3: Weekly Planning Workflow
- Workflow definition
- Slide library (6 slides)
- **Context gathering with workload integration**
- Forward planning with auto-scheduling

### Week 4: Artifacts & Patterns
- WeeklyPlanArtifact (day-by-day view)
- ReflectionSummaryArtifact (pattern insights)
- FocusDocumentArtifact (top 3 priorities)
- WorkloadDashboardArtifact (customer timeline)
- Pattern recognition engine

### Week 5: Recurring & Polish
- Recurring workflow engine
- Cron job for triggering
- Daily check-ins
- User settings UI
- Testing & documentation
- Demo preparation

---

## 🎯 Success Criteria (Phase 1)

**By Week 5, users should be able to:**
- Run weekly planning every Sunday evening
- See all work commitments surfaced automatically
- Auto-schedule tasks with one click
- View patterns from previous weeks
- Receive daily check-in prompts
- Export weekly plan as artifact

**Metrics to Track:**
- Weekly planning completion rate
- Commitment completion rate (actual vs estimated)
- Time saved vs manual planning
- Number of tasks auto-scheduled
- User satisfaction scores

---

## 🔮 Phase 2: Advanced Features (Weeks 6-9)

### Week 6: File Upload & Parsing
- Supabase Storage setup
- Document parsing (Excel, PDF, CSV, Word)
- Extract task lists, timelines, dependencies

### Week 7: Workflow Generation
- Project-to-workflow conversion
- Mermaid diagram parsing
- Template library (5+ templates)
- Visual workflow editor

### Week 8: Multi-Party Scheduling
- Email service integration (SendGrid/Resend)
- Multi-party availability finder
- Email coordination (proposals, confirmations)
- Excel export for weekly plans

### Week 9: Integration & Polish
- Workflow system integration
- End-to-end testing
- Documentation
- Enhanced demo

---

## 📁 Key Files

### Database
- `supabase/migrations/20251102140000_weekly_planner_phase1.sql`

### Services
- `src/lib/services/WorkloadAnalysisService.ts` ✅
- `src/lib/services/CalendarService.ts` 🚧
- `src/lib/services/WeeklyPlanningService.ts` 📋
- `src/lib/services/RecurringWorkflowService.ts` 📋

### Workflows
- `src/lib/workflows/compositions/weeklyPlannerComposition.ts` 📋
- `src/lib/workflows/slides/planner/` (directory) 📋

### Artifacts
- `src/components/artifacts/planner/` (directory) 📋

### Documentation
- `docs/labs/WEEKLY-PLANNER-OVERVIEW.md` (this file)
- `docs/labs/CALENDAR-INTEGRATION-GUIDE.md` 📋
- `docs/labs/WORKLOAD-INTEGRATION-GUIDE.md` 📋

---

## 🎨 Design Philosophy

**Spa Aesthetic** - Calm, minimal, professional
- No gradients or bright colors
- Small icons (w-4 h-4)
- Cool grays (gray-400, gray-500)
- Subtle highlights (blue-50/50)
- Maximum information density

**AI/User Task Split**
- "I'll Handle" (AI tasks) - blue tint, reassuring
- "You'll Need To" (User tasks) - minimal, actionable
- Reduces cognitive load

See: `docs/archive/v0-pre-consolidation/automation-backup/SPA-AESTHETIC-DESIGN-GUIDE.md`

---

## 🧪 Testing Strategy

### Unit Tests
- WorkloadAnalysisService methods
- Calendar integration
- findNextOpening() algorithm
- Pattern recognition logic

### Integration Tests
- Workflow execution end-to-end
- Calendar OAuth flow
- Database queries with RLS
- Artifact generation

### User Testing
- Weekly planning flow
- Workload surfacing accuracy
- Auto-scheduling usability
- Pattern insight value

---

## 🔐 Security Considerations

**OAuth Tokens:**
- Stored encrypted in database
- Refresh token rotation
- Revocation support
- Minimal scope requests

**Row-Level Security:**
- All tables use RLS
- Users can only access own data
- Cascade deletes for cleanup

**Calendar Permissions:**
- Read-only by default
- Write requires explicit user consent
- User can disable sync anytime

---

## 🚦 Current Status

**Completed (Week 1):**
✅ Feature branch created
✅ Database migration (7 tables)
✅ WorkloadAnalysisService implemented
✅ Project documentation

**In Progress:**
🚧 CalendarService foundation
🚧 OAuth setup (Google/Microsoft)

**Next Steps:**
1. Complete CalendarService with OAuth
2. Implement `findNextOpening()` algorithm
3. Create weekly planning workflow definition
4. Build context gathering slide with workload integration
5. Test workload analysis queries

---

## 📞 Questions & Decisions

**Resolved:**
- ✅ Should workload analysis be integrated? **Yes, Option A: Always included**
- ✅ Phase split? **Phase 1: Core planning, Phase 2: Advanced automation**
- ✅ Include `findNextOpening(multi)` in Phase 1? **No, Phase 2**

**Open:**
- 🤔 Which OAuth library for calendar? (google-auth-library vs @googleapis/calendar)
- 🤔 Email service for Phase 2? (SendGrid vs Resend vs AWS SES)
- 🤔 Should we sync historical calendar data or only forward-looking?

---

## 🎬 Demo Scenarios

**Scenario 1: Founder's Chaotic Week**
- Multiple customers renewing
- Snoozed workflows piling up
- Weekly planning surfaces everything
- AI auto-schedules intelligently
- Result: Organized, realistic week

**Scenario 2: Project Ingestion (Phase 2)**
- Upload wedding planning Excel
- Renubu generates workflow
- Auto-schedules all tasks
- Sends check-in reminders
- Result: Static plan becomes active system

**Scenario 3: Multi-Party Scheduling (Phase 2)**
- Need to schedule renewal call with 3 stakeholders
- AI finds mutual availability
- Sends proposals
- Tracks responses
- Creates meeting automatically
- Result: Meeting scheduled in 2 hours vs 2 days

---

## 📚 Related Documentation

- [Architecture Guide](../technical/ARCHITECTURE.md)
- [Database Reference](../technical/DATABASE.md)
- [Workflow System Guide](../guides/WORKFLOWS.md)
- [Spa Aesthetic Design Guide](../archive/v0-pre-consolidation/automation-backup/SPA-AESTHETIC-DESIGN-GUIDE.md)

---

## 🙋 Contributing

This is a labs project on a feature branch. To contribute:

1. Pull latest from `renubu.lab.weeklyplanner`
2. Make changes following existing patterns
3. Test locally (ensure Supabase is running)
4. Commit with descriptive messages
5. Document any new features

**Code Style:**
- Follow existing service patterns
- Use TypeScript strict mode
- Add JSDoc comments for public methods
- Write meaningful error messages
- Include unit tests for complex logic

---

**Last Updated:** 2025-11-02
**Branch:** `renubu.lab.weeklyplanner`
**Status:** Phase 1 - Week 1 Complete ✅
