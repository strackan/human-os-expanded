# Weekly Planner - Complete Development Plan

**Project:** Renubu Labs - AI-Powered Weekly Planner
**Branch:** `renubu.lab.weeklyplanner`
**Timeline:** 8-10 weeks total
**Last Updated:** 2025-11-03

---

## 🎯 Executive Summary

Transform Renubu from a customer success platform into an intelligent "Chief of Staff" system. The weekly planner automatically surfaces work commitments (renewals, snoozed tasks, priorities) and uses AI to schedule everything optimally.

**Key Innovation:** Planning doesn't start from scratch—your work is already there, just needs to be organized.

---

## 📋 PHASE 1: Core Weekly Planning (Weeks 1-5)

### **Week 1: Foundation & Infrastructure** ✅ COMPLETE

#### Database Migration
- [x] **COMPLETE** - Create 7 tables for Phase 1
  - `user_work_context` - Goals, projects, focus areas
  - `weekly_plans` - Planning session tracking
  - `weekly_commitments` - Individual commitments with outcomes
  - `recurring_workflows` - Schedule recurring planning
  - `user_calendar_integrations` - OAuth tokens (encrypted)
  - `user_calendar_preferences` - Work hours, focus blocks, energy mapping
  - `scheduled_tasks` - Tasks scheduled via findNextOpening()
  - File: `supabase/migrations/20251102140000_weekly_planner_phase1.sql`

#### WorkloadAnalysisService
- [x] **COMPLETE** - Implement workload integration service (582 lines)
  - `getUpcomingWorkload()` - Pull all work commitments
  - `getSnoozedWorkflows()` - Tasks due to resurface
  - `getUpcomingRenewals()` - Customers renewing soon
  - `getHighPriorityCustomers()` - Risk/opportunity scoring
  - `getIncompleteWorkflowTasks()` - Pending tasks
  - `categorizeWorkload()` - Urgent/important/routine/suggested
  - File: `src/lib/services/WorkloadAnalysisService.ts`

#### CalendarService Foundation
- [x] **COMPLETE** - `findNextOpening()` algorithm (600+ lines)
  - Multi-factor scoring (0-100): task type, energy levels, focus blocks, buffer time
  - Context switching penalties
  - Human-readable reasoning
  - Timezone handling
  - File: `src/lib/services/CalendarService.ts`
- [x] **COMPLETE** - Test infrastructure
  - Test API: `src/app/api/test/calendar/route.ts`
  - Test page: `src/app/test/calendar/page.tsx`

#### Workflow Composition
- [x] **COMPLETE** - Weekly planning workflow definition
  - 5-slide sequence defined
  - Slide contexts configured
  - Recurring workflow settings
  - File: `src/lib/workflows/compositions/weeklyPlannerComposition.ts`

#### Workflow Slides
- [x] **COMPLETE** - All 5 slides created (not yet tested)
  - `weeklyReflectionSlide.ts` - Retrospective questions
  - `contextGatheringWorkloadSlide.ts` - Auto-surface work commitments
  - `forwardPlanningSlide.ts` - AI auto-scheduling with findNextOpening()
  - `commitmentFinalizationSlide.ts` - Lock in top priorities
  - `weeklySummarySlide.ts` - Display artifacts and completion
  - Directory: `src/lib/workflows/slides/planner/`

#### Documentation
- [x] **COMPLETE** - Comprehensive project docs
  - `WEEKLY-PLANNER-OVERVIEW.md` - Architecture and vision
  - `TESTING-GUIDE.md` - Verification queries
  - `DEMO-MODE-TESTING.md` - Local testing guide

#### Demo Mode (Bonus)
- [x] **COMPLETE** - Safe demo mode for local testing
  - Auto-enables on localhost, force-disables on production
  - Visual indicator (amber badge)
  - Service role key protection
  - **Status:** Ready to merge to main (not yet merged)

#### Test Data
- [x] **COMPLETE** - Seed files created
  - `seed_weekly_planner_test_data.sql` - Generic test data
  - `seed_justin_test_data.sql` - Justin-specific calendar preferences
  - **Status:** Not yet run against staging database

**Week 1 Status:** ✅ 100% Complete (exceeds plan - completed some Week 2 & 3 work early)

---

### **Week 2: Calendar Integration** 🔴 NOT STARTED

#### Google Calendar OAuth
- [ ] **NOT STARTED** - OAuth 2.0 flow implementation
  - Use `google-auth-library` for OAuth
  - Store tokens in `user_calendar_integrations` table
  - Handle token refresh automatically
  - Scope: `calendar.readonly`, `calendar.events` (write)

#### Microsoft Graph OAuth
- [ ] **NOT STARTED** - Microsoft 365 calendar integration
  - Use `@microsoft/microsoft-graph-client`
  - Support both personal and work accounts
  - Token storage and refresh
  - Same scope as Google (read + write)

#### Calendar Event Fetching
- [ ] **NOT STARTED** - Read calendar events
  - Fetch events for date range
  - Parse into internal format
  - Handle recurring events
  - Timezone conversion
  - Update `CalendarService.getWeeklyAvailability()` to use real events

#### Calendar Event Writing
- [ ] **NOT STARTED** - Create calendar events
  - Create events when user commits to plan
  - Update events if plan changes
  - Delete events if tasks deferred
  - Handle calendar conflicts

#### Integration with findNextOpening()
- [ ] **NOT STARTED** - Connect real calendar to scheduling
  - Pass real events to `findNextOpening()`
  - Check actual availability (not simulated)
  - Score slots based on real conflicts
  - Test with Justin's actual Google Calendar

**Week 2 Status:** 🔴 0% Complete

---

### **Week 3: Weekly Planning Workflow** 🟡 PARTIALLY COMPLETE

#### Workflow Definition in Database
- [ ] **NOT STARTED** - Seed `weekly-planning` workflow
  - Add to `workflow_definitions` table
  - Configure trigger (recurring, Sunday 6pm)
  - Set up workflow metadata
  - Link to slide sequence

#### Frontend Workflow UI Integration
- [ ] **NOT STARTED** - Wire slides to UI components
  - Connect `weeklyPlannerComposition` to workflow renderer
  - Implement slide navigation
  - Handle user responses
  - Store conversation state

#### Context Gathering Implementation
- [x] **COMPLETE** - Slides created (backend)
- [ ] **NEEDS TESTING** - Data fetching from WorkloadAnalysisService
- [ ] **NOT STARTED** - Frontend artifact display
  - Show snoozed workflows
  - Display customer priorities
  - List incomplete tasks
  - Present in spa-aesthetic UI

#### Forward Planning Implementation
- [x] **COMPLETE** - Slide logic created
- [ ] **NOT STARTED** - AI auto-scheduling integration
  - Call `findNextOpening()` for each task
  - Display proposed schedule with scores
  - Allow manual adjustments
  - Validate capacity (not overbooked)

#### Action Handlers
- [ ] **NOT STARTED** - Implement workflow actions
  - `saveReflection` - Store reflection data
  - `saveSchedule` - Persist scheduled tasks
  - `saveCommitments` - Record final commitments
  - `createCalendarEvents` - Generate calendar entries
  - `scheduleCheckIns` - Set up daily/weekly prompts
  - `showScheduleArtifact` - Display calendar view
  - `completeWorkflow` - Mark planning session done

**Week 3 Status:** 🟡 30% Complete (slides created, integration pending)

---

### **Week 4: Artifacts & Pattern Recognition** 🔴 NOT STARTED

#### Artifact Components
- [ ] **NOT STARTED** - `WeeklyPlanArtifact`
  - Day-by-day breakdown
  - Time blocks visualization
  - Task cards with priorities
  - Interactive drag-and-drop (optional)

- [ ] **NOT STARTED** - `FocusDocumentArtifact`
  - Top 3-5 priorities display
  - Success criteria for each
  - Context and dependencies
  - Progress indicators (during week)

- [ ] **NOT STARTED** - `WorkloadDashboardArtifact`
  - Customer timeline view
  - Renewal dates highlighted
  - Risk indicators
  - Snoozed task summary

- [ ] **NOT STARTED** - `PatternAnalysisArtifact`
  - Commitment trends chart
  - Completion rate graphs
  - Energy pattern insights
  - Recommendations display

#### WeeklyPlanningService
- [ ] **NOT STARTED** - Service implementation
  - `createWeeklyPlan()` - Start new planning session
  - `updateCommitments()` - Store user commitments
  - `trackCompletion()` - Record actual vs planned
  - `generateSummary()` - Create weekly summary
  - File: `src/lib/services/WeeklyPlanningService.ts`

#### Pattern Recognition Engine
- [ ] **NOT STARTED** - Historical analysis
  - `analyzeCommitmentPatterns()` - Over/under committing
  - `analyzeCompletionRates()` - Success rates by task type
  - `analyzeEnergyPatterns()` - Best times for different work
  - `analyzeCustomerCadence()` - Engagement frequency
  - `generateInsights()` - Natural language recommendations

#### Pattern Display
- [ ] **NOT STARTED** - Show insights in weekly reflection
  - "You typically commit to X but complete Y"
  - "Your best deep work time is 9-11am"
  - "You over-commit on Mondays"
  - Recommendations for realistic planning

**Week 4 Status:** 🔴 0% Complete

---

### **Week 5: Recurring Workflows & Polish** 🔴 NOT STARTED

#### RecurringWorkflowService
- [ ] **NOT STARTED** - Service implementation
  - `scheduleRecurringWorkflow()` - Set up recurring trigger
  - `triggerWorkflow()` - Launch workflow at scheduled time
  - `updateSchedule()` - Modify recurrence pattern
  - `pauseRecurring()` - Temporarily disable
  - File: `src/lib/services/RecurringWorkflowService.ts`

#### Cron Job System
- [ ] **NOT STARTED** - Scheduled triggers
  - Use Vercel Cron or Supabase pg_cron
  - Check for due recurring workflows
  - Launch workflow instances
  - Send notifications (if user missed)
  - Handle failures and retries

#### Daily Check-Ins
- [ ] **NOT STARTED** - Morning prompts
  - "What are you focusing on today?"
  - Show today's commitments
  - Quick reschedule if needed
  - Track energy levels

#### Mid-Week Check-In
- [ ] **NOT STARTED** - Wednesday progress check
  - "How's your week going?"
  - Commitment completion status
  - Adjust remaining tasks
  - Identify blockers

#### User Settings UI
- [ ] **NOT STARTED** - Preferences management
  - Configure recurring schedule (day/time)
  - Set work hours
  - Define focus blocks
  - Map energy levels
  - Calendar integration settings
  - Notification preferences

#### End-to-End Testing
- [ ] **NOT STARTED** - Full workflow testing
  - Run complete weekly planning flow
  - Verify data persistence
  - Test calendar integration
  - Validate artifact generation
  - Check pattern analysis

#### Documentation
- [ ] **NOT STARTED** - User guides
  - Getting started guide
  - Calendar integration setup
  - Workload integration explanation
  - Pattern insights interpretation
  - Troubleshooting guide

#### Demo Preparation
- [ ] **NOT STARTED** - Demo scenarios
  - "Founder's chaotic week" scenario
  - Sample data for impressive results
  - Screen recording walkthrough
  - Internal team presentation

**Week 5 Status:** 🔴 0% Complete

---

## 🎯 Phase 1 Success Criteria

By end of Week 5, users should be able to:

- [x] ✅ Install and configure (database migration complete)
- [ ] ⏳ Connect Google/Microsoft calendar
- [ ] ⏳ Run weekly planning every Sunday evening
- [ ] ⏳ See all work commitments surfaced automatically
- [ ] ⏳ Auto-schedule tasks with one click
- [ ] ⏳ View weekly plan artifact
- [ ] ⏳ View patterns from previous weeks
- [ ] ⏳ Receive daily check-in prompts
- [ ] ⏳ Export weekly plan

**Phase 1 Progress:** 🟡 25% Complete

---

## 🔮 PHASE 2: Advanced Automation (Weeks 6-9)

### **Week 6: File Upload & Document Parsing** 🔴 NOT STARTED

#### Supabase Storage Setup
- [ ] **NOT STARTED** - Configure storage buckets
  - Create `project-uploads` bucket
  - Set up RLS policies
  - Configure file size limits (10MB)
  - Enable virus scanning

#### Document Upload UI
- [ ] **NOT STARTED** - Drag-and-drop interface
  - Support Excel (.xlsx, .xls)
  - Support PDF
  - Support CSV/TSV
  - Support Word (.docx)
  - Progress indicators
  - Error handling

#### Excel Parser
- [ ] **NOT STARTED** - Parse Excel to tasks
  - Use `xlsx` library
  - Detect task lists (patterns like: task, due date, owner)
  - Extract timelines
  - Identify dependencies
  - Handle multiple sheets

#### PDF Parser
- [ ] **NOT STARTED** - Extract tasks from PDFs
  - Use `pdf-parse` library
  - OCR for scanned documents
  - Detect project plans
  - Extract dates and assignments

#### CSV/TSV Parser
- [ ] **NOT STARTED** - Simple tabular format
  - Parse CSV structure
  - Map columns to task fields
  - Handle date formats
  - Import bulk tasks

**Week 6 Status:** 🔴 0% Complete

---

### **Week 7: Workflow Generation from Projects** 🔴 NOT STARTED

#### Project-to-Workflow Converter
- [ ] **NOT STARTED** - Generate workflows from uploads
  - Create workflow definition from tasks
  - Generate slides for each project phase
  - Set up task dependencies
  - Schedule initial tasks
  - Assign to user

#### Mermaid Diagram Parser
- [ ] **NOT STARTED** - Convert diagrams to workflows
  - Parse mermaid syntax
  - Extract nodes as tasks
  - Map edges as dependencies
  - Generate workflow structure
  - Visual workflow preview

#### Template Library
- [ ] **NOT STARTED** - Pre-built workflow templates
  - "Product Launch" template
  - "Customer Onboarding" template
  - "Quarterly Planning" template
  - "Event Planning" template
  - "Home Renovation" template
  - Template customization

#### Visual Workflow Editor
- [ ] **NOT STARTED** - Edit generated workflows
  - Drag-and-drop workflow builder
  - Add/remove/reorder slides
  - Edit task properties
  - Preview workflow
  - Save as template

**Week 7 Status:** 🔴 0% Complete

---

### **Week 8: Multi-Party Scheduling** 🔴 NOT STARTED

#### Email Service Integration
- [ ] **NOT STARTED** - Choose and integrate email service
  - Evaluate: SendGrid, Resend, AWS SES
  - Set up SMTP configuration
  - Create email templates
  - Handle bounces and unsubscribes
  - Track email opens/clicks

#### Multi-Party Availability Finder
- [ ] **NOT STARTED** - Find mutual availability
  - `findNextOpening(multi)` implementation
  - Collect participant calendars
  - Find overlapping free time
  - Score slots by convenience
  - Handle timezone differences

#### Email Coordination
- [ ] **NOT STARTED** - Automated scheduling emails
  - Send availability proposals
  - "Are any of these times good?"
  - Track responses
  - Confirm final time
  - Send calendar invites
  - Handle declines and reschedules

#### Excel Export
- [ ] **NOT STARTED** - Generate weekly plan spreadsheet
  - Use `xlsx` library
  - Day-by-day breakdown sheet
  - Task list with times
  - Priority matrix
  - Goal progress tracking
  - Chart visualizations

**Week 8 Status:** 🔴 0% Complete

---

### **Week 9: Integration & Polish** 🔴 NOT STARTED

#### Workflow System Integration
- [ ] **NOT STARTED** - Connect project workflows to main system
  - Import as workflow definitions
  - Trigger from weekly planning
  - Track progress across workflows
  - Show in dashboard

#### End-to-End Testing
- [ ] **NOT STARTED** - Full Phase 2 testing
  - Upload project plan
  - Generate workflow
  - Schedule tasks
  - Multi-party scheduling
  - Excel export

#### Documentation
- [ ] **NOT STARTED** - Phase 2 guides
  - Project upload guide
  - Template library documentation
  - Multi-party scheduling guide
  - API documentation
  - Developer guide

#### Enhanced Demo
- [ ] **NOT STARTED** - Phase 2 demo scenarios
  - "Wedding planning" scenario (project upload)
  - "Strategic planning" scenario (mermaid conversion)
  - "Multi-stakeholder meeting" scenario
  - Customer case studies

**Week 9 Status:** 🔴 0% Complete

---

## 📊 Overall Project Status

### Completion Summary:

| Phase | Status | Complete | In Progress | Not Started |
|-------|--------|----------|-------------|-------------|
| **Week 1** | ✅ Complete | 100% | 0% | 0% |
| **Week 2** | 🔴 Not Started | 0% | 0% | 100% |
| **Week 3** | 🟡 Partial | 30% | 0% | 70% |
| **Week 4** | 🔴 Not Started | 0% | 0% | 100% |
| **Week 5** | 🔴 Not Started | 0% | 0% | 100% |
| **Phase 1 Total** | 🟡 In Progress | **25%** | **5%** | **70%** |
| **Week 6** | 🔴 Not Started | 0% | 0% | 100% |
| **Week 7** | 🔴 Not Started | 0% | 0% | 100% |
| **Week 8** | 🔴 Not Started | 0% | 0% | 100% |
| **Week 9** | 🔴 Not Started | 0% | 0% | 100% |
| **Phase 2 Total** | 🔴 Not Started | **0%** | **0%** | **100%** |
| **OVERALL PROJECT** | 🟡 In Progress | **15%** | **3%** | **82%** |

---

## 🎯 Immediate Next Steps (Week 2 Focus)

### Priority 1: Test Existing Work
1. **Run seed files** - Populate justin@renubu.com with test data
2. **Test API endpoints** - Verify WorkloadAnalysisService and CalendarService
3. **Validate database** - Confirm all tables working with RLS

### Priority 2: Calendar Integration
1. **Google Calendar OAuth** - Set up OAuth 2.0 flow
2. **Fetch real events** - Connect to Justin's actual calendar
3. **Test findNextOpening()** - With real calendar data
4. **Calendar event writing** - Create events when user commits

### Priority 3: Merge Demo Mode
1. **Cherry-pick to main** - Merge demo mode improvements
2. **Test on staging** - Verify production safety
3. **Document for team** - Share demo mode usage

---

## 📁 Key Deliverables by Phase

### Phase 1 Deliverables:
- ✅ Database schema (7 tables)
- ✅ WorkloadAnalysisService (complete)
- 🟡 CalendarService (algorithm done, OAuth pending)
- 🟡 Workflow slides (created, not integrated)
- ⏳ Artifact components (not started)
- ⏳ Pattern recognition (not started)
- ⏳ Recurring workflow engine (not started)
- ⏳ User settings UI (not started)

### Phase 2 Deliverables:
- ⏳ File upload system
- ⏳ Document parsers (Excel, PDF, CSV)
- ⏳ Workflow generator
- ⏳ Template library
- ⏳ Multi-party scheduler
- ⏳ Email coordination
- ⏳ Excel export

---

## 🎬 Demo Scenarios

### Scenario 1: Founder's Chaotic Week (Phase 1)
**Setup:** Multiple customers renewing, snoozed workflows, scattered commitments
**Flow:** Run weekly planning → Everything surfaced → AI schedules optimally
**Result:** Organized, realistic week in 5 minutes

### Scenario 2: Wedding Planning (Phase 2)
**Setup:** Upload wedding planning Excel with 50+ tasks
**Flow:** Upload → Generate workflow → Auto-schedule → Set reminders
**Result:** Static plan becomes active system

### Scenario 3: Board Meeting Coordination (Phase 2)
**Setup:** Need to schedule with 5 busy stakeholders
**Flow:** Request meeting → AI finds mutual slots → Emails proposals → Books meeting
**Result:** Meeting scheduled in hours vs days

---

## 🚦 Risk & Mitigation

### Technical Risks:
| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| OAuth complexity | High | Use proven libraries, extensive testing | ⏳ Pending |
| Calendar API rate limits | Medium | Implement caching, batch requests | ⏳ Pending |
| Pattern recognition accuracy | Medium | Start simple, iterate with user feedback | ⏳ Pending |
| Document parsing reliability | High | Support multiple formats, manual fallback | ⏳ Pending |

### Timeline Risks:
| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| OAuth taking longer than planned | High | Week 2 buffer built in | ⏳ Monitoring |
| Artifact UI complexity | Medium | Use existing component patterns | ⏳ Pending |
| Multi-party scheduling complexity | High | Phase 2, can defer if needed | ⏳ Pending |

---

## 💰 Resource Requirements

### Development Time:
- **Phase 1:** 4-5 weeks (1 developer full-time)
- **Phase 2:** 3-4 weeks (1 developer full-time)
- **Total:** 8-10 weeks

### External Services:
- Google Calendar API (free)
- Microsoft Graph API (free)
- Email service (SendGrid/Resend) - ~$10-50/month
- Supabase storage - ~$5-20/month

### Testing Resources:
- Real Google/Microsoft calendars for testing
- Sample project files (Excel, PDF)
- Beta testers (3-5 users)

---

## 📞 Team Communication

### Weekly Status Updates:
- Every Friday: Progress report
- Blockers identified early
- Timeline adjustments as needed

### Milestones:
- **Week 2 End:** Calendar integration complete
- **Week 3 End:** Workflow UI functional
- **Week 5 End:** Phase 1 MVP complete
- **Week 9 End:** Phase 2 complete

---

**Document Owner:** Claude Code Assistant
**Last Updated:** 2025-11-03
**Branch:** `renubu.lab.weeklyplanner`
**Next Review:** End of Week 2
