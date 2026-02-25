# Q4 2025 Development Plan - Dual-Track Strategy

**Status:** ✅ APPROVED - Ready to Execute
**Approval Date:** 2025-11-03
**Timeline:** Sprint 0 (Nov 6-8) + 5 Weeks (Nov 13 - Dec 20)
**Total Hours:** 177h (20h Sprint 0 + 157h execution)
**Confidence Level:** 80% (with Lane 2 buffer providing additional safety)

---

## 📋 Executive Summary

This consolidated plan represents the agreed-upon development strategy for the Weekly Planner feature through end of year. It incorporates:

- **Dual-track strategy** prioritizing CS Product work while advancing Weekly Planner
- **Lane 2 buffer** (15h) providing flex capacity for customer requests and urgent issues
- **Sprint 0 process setup** establishing agent collaboration infrastructure
- **Strategic scope reductions** focusing on core UX without advanced features
- **Agentification strategy** targeting 22-36% velocity boost through AI assistance

### Key Decisions:
✅ CS Product Priority 1 (81h) - Customer requests, critical fixes
✅ Weekly Planner Priority 2 (59h) - Core workflow without advanced features
✅ Lane 2 flex buffer (15h) - Unplanned work absorption (2h moved to Week 5)
✅ Sprint 0 expanded (20h) - Agent onboarding and process setup
✅ No pattern insights, settings UI, or daily check-ins in Phase 1

### Success Criteria:
- Launch functional weekly planning workflow by Dec 20
- Maintain CS Product velocity and customer satisfaction
- Establish agent collaboration patterns for future features
- Achieve 70%+ task completion rate through agentification

---

## 🎯 Sprint 0: Process & Infrastructure Setup

**Dates:** Nov 6-8, 2025
**Hours:** 20h
**Goal:** Establish agent collaboration infrastructure before feature development begins

### Deliverables:

#### 1. Agent Onboarding Documentation (2h)
**File:** `docs/agent-onboarding.md`
- How to access GitHub Projects workspace
- Communication protocols (Google Chat Space: "Renubu Dev Sync")
- Development environment setup
- Git workflow and branch strategy
- Demo mode usage guide
- Weekly Planner context and goals

#### 2. Communication Protocol (1h)
**File:** `docs/communication-protocol.md`
- Daily update format and timing
- Blocking issue escalation process
- Code review expectations
- Question/clarification channels
- Status reporting cadence

#### 3. GitHub Projects Setup (1h)
- Create Weekly Planner project board
- Configure board views (table, board, roadmap)
- Set up custom fields (hours, priority, status)
- Create initial issues from this plan
- Configure automation rules

#### 4. Velocity Tracking System (0.5h)
**File:** `docs/velocity-tracking.md`
- Estimated vs actual hours spreadsheet
- Agent-friendly vs human-required task categorization
- Weekly velocity calculation
- Confidence level tracking

#### 5. Demo Materials Consolidation (4h)
**File:** `docs/demo-materials.md`
- Organize existing documentation
- Create demo video script
- Screenshot key workflows
- Prepare stakeholder presentation deck

#### 6. Website Hero Implementation (3h)
**Files:** Homepage components
- Design weekly planner hero section
- Implement responsive layout
- Add feature highlights
- Mobile optimization

#### 7. Grace Workflow Definitions (3h)
**File:** `docs/grace-workflows.md`
- Document Grace's workflow patterns
- Create test scenarios
- Define success criteria
- Map to existing infrastructure

#### 8. Architecture Review (3h)
- Review existing CalendarService and WorkloadAnalysisService
- Document OAuth infrastructure status
- Identify integration points
- Create technical debt list

#### 9. Environment Setup & Validation (3h)
- Verify dev environment working
- Test demo mode functionality
- Validate database migrations
- Confirm Supabase access
- Run existing test suite

---

## 📅 Week-by-Week Execution Plan

### Week 1: Nov 13-22, 2025

#### CS Product (Priority 1) - 20h
- Customer feature requests
- Critical bug fixes
- Sales support
- Code reviews

#### Weekly Planner - OAuth Integration - 20h
**Goal:** Complete Google Calendar OAuth implementation

**OAuth Flow Implementation (8h)**
- Google OAuth 2.0 authorization flow (3h)
- Token exchange and storage (2h)
- Token refresh mechanism (2h)
- Error handling and user feedback (1h)

**Database Integration (4h)**
- `user_calendar_integrations` table (already exists)
- Token encryption/decryption (2h)
- Integration status tracking (1h)
- Migration validation (1h)

**CalendarService Enhancement (6h)**
- Complete `initiateOAuth()` implementation (2h)
  - Build authorization URL with correct scopes
  - State parameter for CSRF protection
  - Redirect URI handling
- Complete `handleOAuthCallback()` implementation (2h)
  - Exchange code for access/refresh tokens
  - Store tokens in database
  - Create CalendarIntegration record
- Implement `refreshAccessToken()` (2h)
  - Token expiry detection
  - Automatic refresh before API calls
  - Error handling for revoked tokens

**Testing (2h)**
- OAuth flow end-to-end test
- Token refresh simulation
- Error scenario testing
- Manual QA with real Google account

**Success Criteria:**
- [ ] User can connect Google Calendar
- [ ] Tokens stored securely in database
- [ ] Automatic token refresh working
- [ ] Error states handled gracefully

**Lane 2 Buffer:** 3h available for urgent CS work

---

### Week 2: Nov 25-29, 2025 (SHORT WEEK - Thanksgiving)

#### CS Product (Priority 1) - 12h
- Reduced due to holiday week
- Focus on critical issues only

#### Weekly Planner - UI Integration Foundation - 25h
**Goal:** Build workflow navigation and state management

**Workflow Container Component (8h)**
- Create `WeeklyPlannerWorkflow.tsx` container (3h)
  - Workflow state management (current slide, data)
  - Navigation controls (next/back/save/exit)
  - Progress indicator
  - Error boundary
- Slide transition animations (2h)
- Responsive layout foundation (2h)
- Loading states (1h)

**Data Flow Architecture (8h)**
- Create `useWeeklyPlanner` hook (3h)
  - Slide navigation logic
  - Data persistence to database
  - Loading/error states
  - Optimistic updates
- Database query hooks (2h)
  - `useUserWorkContext`
  - `useWeeklyPlan`
  - `useWeeklyCommitments`
- Form state management (3h)
  - Validation patterns
  - Auto-save logic
  - Dirty state tracking

**Integration with Existing Services (6h)**
- Connect `WorkloadAnalysisService` (2h)
- Connect `CalendarService` (2h)
- API route creation (2h)
  - `/api/weekly-planner/start`
  - `/api/weekly-planner/save`
  - `/api/weekly-planner/complete`

**Testing (3h)**
- Component unit tests
- Integration tests for data flow
- Manual QA of navigation

**Success Criteria:**
- [ ] Workflow container renders and navigates
- [ ] Data persists to database
- [ ] Services integrate correctly
- [ ] Error states handled

**Lane 2 Buffer:** 3h available

---

### Week 3: Dec 2-6, 2025

#### CS Product (Priority 1) - 20h
- Regular sprint work
- Customer support

#### Weekly Planner - Complete All 5 Slides - 20h
**Goal:** Implement all workflow slides with full functionality

**Slide 1: Weekly Reflection (4h)**
- `weeklyReflectionSlide.tsx` (2h)
  - Previous week accomplishments textarea
  - Challenges textarea
  - Lessons learned textarea
- Database integration (1h)
  - Save to `weekly_plans.reflection_notes`
- Validation and UX polish (1h)

**Slide 2: Context Gathering (4h)**
- `contextGatheringWorkloadSlide.tsx` (2h)
  - Display workload analysis from service
  - Project list with hours
  - Meeting commitments display
  - Additional obligations input
- WorkloadAnalysisService integration (1h)
- Auto-fetch calendar data (1h)

**Slide 3: Forward Planning (6h)**
- `forwardPlanningSlide.tsx` (3h)
  - Task input form
  - Duration estimates
  - Priority selection
  - Energy level preferences
- Display `findNextOpening()` suggestions (2h)
- Save to `weekly_commitments` table (1h)

**Slide 4: Commitment Finalization (3h)**
- `commitmentFinalizationSlide.tsx` (2h)
  - Review all commitments
  - Edit/remove functionality
  - Final confirmation
- Calculate total hours vs capacity (1h)

**Slide 5: Weekly Summary (3h)**
- `weeklySummarySlide.tsx` (2h)
  - Display finalized plan
  - Export options (email, calendar)
  - Success messaging
- PDF generation or email template (1h)

**Success Criteria:**
- [ ] All 5 slides functional
- [ ] Data flows between slides
- [ ] WorkloadAnalysisService integrated
- [ ] findNextOpening() displays suggestions
- [ ] User can complete full workflow

**Lane 2 Buffer:** 3h available

---

### Week 4: Dec 9-13, 2025

#### CS Product (Priority 1) - 20h
- Regular sprint work
- Customer support

#### Weekly Planner - Artifacts System - 16h
**Goal:** Build slide library and artifact generation system

**Artifacts Infrastructure (6h)**
- Create `slideLibrary.ts` registry (2h)
  - Register all 5 workflow slides
  - Slide metadata and configuration
  - Versioning support
- Slide loader component (2h)
  - Dynamic slide rendering
  - Props passing
  - Error boundaries
- Artifact generation API (2h)
  - `/api/artifacts/generate`
  - Template system
  - Database storage

**Testing & Polish (6h)**
- E2E workflow testing (3h)
  - Complete workflow from start to finish
  - Data persistence validation
  - Error scenario testing
- Mobile responsive testing (2h)
  - All slides on mobile
  - Touch interactions
  - Layout adjustments
- Performance optimization (1h)
  - Lazy loading slides
  - Query optimization

**Documentation (4h)**
- User guide for weekly planner (2h)
  - How to start workflow
  - What each slide does
  - Tips for effective planning
- Developer documentation (2h)
  - How to add new slides
  - Artifact system architecture
  - Testing guidelines

**Success Criteria:**
- [ ] Slide library system functional
- [ ] Artifacts generate correctly
- [ ] Mobile experience polished
- [ ] Documentation complete

**Lane 2 Buffer:** 4h available

---

### Week 5: Dec 16-20, 2025

#### CS Product (Priority 1) - 9h
- Reduced for final push
- Critical issues only

#### Weekly Planner - Recurring Workflows & Launch Prep - 8h
**Goal:** Polish and prepare for production launch

✅ **APPROVED ADJUSTMENT:** 2h borrowed from Lane 2 buffer to ensure adequate time for cron infrastructure.

**Recurring Workflow System (6h)**
- Create `recurring_workflows` management (2h)
  - Database CRUD operations
  - Workflow scheduling logic
  - Status tracking
- Simple cron or scheduled job setup (4h)
  - Vercel Cron or similar
  - Weekly reminder system
  - Email notifications

**Launch Preparation (2h)**
- Final QA pass (1h)
  - Test all user paths
  - Verify error handling
  - Check mobile experience
- Production deployment checklist (1h)
  - Environment variables
  - Feature flags
  - Monitoring setup

**Success Criteria:**
- [ ] Workflows can be scheduled
- [ ] Reminders working
- [ ] All tests passing
- [ ] Ready for production

**Lane 2 Buffer:** 3h available

---

## 📊 Resource Summary

### Total Hours by Track:
| Track | Hours | Percentage |
|-------|-------|------------|
| Sprint 0 | 20h | 11% |
| CS Product (Priority 1) | 81h | 46% |
| Weekly Planner (Priority 2) | 61h | 34% |
| Lane 2 Buffer | 15h | 9% |
| **TOTAL** | **177h** | **100%** |

### Weekly Breakdown:
| Week | CS Product | Weekly Planner | Lane 2 | Total |
|------|-----------|----------------|---------|--------|
| Sprint 0 | 0h | 20h | 0h | 20h |
| Week 1 | 20h | 20h | 3h | 43h |
| Week 2 | 12h | 25h | 3h | 40h |
| Week 3 | 20h | 20h | 3h | 43h |
| Week 4 | 20h | 16h | 4h | 40h |
| Week 5 | 9h | 8h | 3h | 20h |
| **TOTAL** | **81h** | **109h** | **16h** | **206h** |

*Note: Sprint 0 20h included in Weekly Planner total above*

---

## 🎯 Success Metrics

### Phase 1 (Dec 20) - Must Have:
- [ ] User can authenticate with Google Calendar
- [ ] User can complete 5-slide weekly planning workflow
- [ ] Workload analysis pulls real calendar data
- [ ] `findNextOpening()` provides time slot suggestions
- [ ] Commitments save to database
- [ ] Weekly summary generates
- [ ] Mobile experience functional
- [ ] Recurring workflows can be scheduled

### Phase 1 - Nice to Have (Deferred):
- ⏸️ Pattern insights from historical data
- ⏸️ Settings UI for preferences
- ⏸️ Daily check-in workflows
- ⏸️ Microsoft Outlook integration
- ⏸️ Team collaboration features

### Quality Metrics:
- **Code Coverage:** 60%+ for critical paths
- **Performance:** Workflow completes in <3s
- **Mobile Score:** 80%+ on Lighthouse
- **User Completion Rate:** 70%+ complete workflow

---

## 🛡️ Risk Mitigation

### High Risk Areas:

#### 1. Week 2 UI Integration (25h)
**Risk:** Complex state management and data flow could exceed estimate
**Mitigation:**
- Start with simplest possible architecture
- Use existing patterns from codebase
- Lane 2 buffer (3h) available for overflow
- Can defer advanced features to Phase 2

#### 2. Week 3 Slide Implementation (20h)
**Risk:** 5 slides is aggressive for one week
**Mitigation:**
- Start with MVP version of each slide
- Skip advanced features (drag-and-drop, rich formatting)
- Focus on data flow, polish later
- Can use Week 4 time if needed

#### 3. Week 5 Cron Setup (4h)
**Risk:** Recurring workflow infrastructure may be complex
**Mitigation:**
- ✅ APPROVED: 8h total for Week 5 (borrowed 2h from Lane 2)
- Start with simplest possible scheduler (Vercel Cron)
- Email-based reminders easier than in-app
- Can defer advanced scheduling to Phase 2

#### 4. Lane 2 Unexpected Work
**Risk:** Customer requests or critical bugs consume Lane 2 buffer
**Mitigation:**
- 15h buffer = ~9% of total capacity (after Week 5 adjustment)
- Can defer Weekly Planner tasks if CS Product critical
- Clear priority: CS Product always wins
- Weekly Planner features can slip to Phase 2

---

## 📋 Definition of Done

### For Each Weekly Planner Task:
- [ ] Code written and reviewed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual QA completed
- [ ] Mobile responsive verified
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product owner approved

### For Sprint 0 Deliverables:
- [ ] All documentation files created
- [ ] GitHub Projects workspace configured
- [ ] Agent onboarding complete
- [ ] Velocity tracking spreadsheet live
- [ ] Demo materials organized
- [ ] Website hero deployed
- [ ] Grace workflows documented
- [ ] Architecture reviewed
- [ ] Environment validated

### For Phase 1 Launch (Dec 20):
- [ ] All must-have features complete
- [ ] No critical bugs
- [ ] Performance metrics met
- [ ] Mobile experience polished
- [ ] User documentation published
- [ ] Monitoring and alerts configured
- [ ] Rollback plan documented
- [ ] Stakeholder demo completed

---

## 🚀 Agentification Strategy

### Agent-Friendly Tasks (70-85% completion rate):
- OAuth implementation (clear patterns, good docs)
- Database queries and mutations
- Component structure and layout
- API route creation
- Test writing
- Documentation updates
- Migration scripts

### Human-Required Tasks (review and guidance):
- UX/UI design decisions
- Complex state management architecture
- Performance optimization
- Security review
- Product direction choices
- User testing and feedback
- Final QA and launch approval

### Expected Velocity Boost:
- **Conservative:** 22% (177h effective work in 140h actual time)
- **Moderate:** 28% (177h effective work in 130h actual time)
- **Aggressive:** 36% (177h effective work in 120h actual time)

---

## 📞 Communication Plan

### Daily Updates:
- **Channel:** Google Chat Space "Renubu Dev Sync"
- **Format:**
  ```
  📅 Daily Update - [Date]
  ✅ Completed: [Tasks completed today]
  🔄 In Progress: [Current work and % done]
  🚧 Blockers: [Any issues blocking progress]
  📊 Hours: [Hours logged] / [Hours estimated today]
  ```
- **Timing:** End of day (5-6pm)

### Weekly Check-ins:
- **Frequency:** Every Friday
- **Format:** Velocity report, confidence update, next week plan
- **Duration:** 30 minutes

### Blocking Issues:
- **Escalation:** Immediate message in "Renubu Dev Sync" with @mention
- **Response Time:** Within 2 hours during business hours
- **Resolution:** Pair programming session if needed

---

## 🎓 Lessons from Planning Process

### What We Learned:
1. **OAuth Infrastructure Already Built:** Week 1 setup work eliminated ~4-5h from original estimate
2. **Dual-Track Strategy Essential:** CS Product work cannot pause for feature development
3. **Lane 2 Buffer Critical:** ~10% buffer needed for unpredictable customer work
4. **Agent Collaboration Needs Setup:** Sprint 0 process documentation pays dividends
5. **Scope Discipline Required:** Deferring pattern insights and settings UI keeps timeline realistic

### What We're Betting On:
1. **Agentification Works:** 22-36% velocity boost achievable for agent-friendly tasks
2. **Simple Beats Fancy:** MVP slides ship faster than perfect UX
3. **findNextOpening() Is Key:** Existing algorithm 90% of the value
4. **Mobile-First Pays Off:** Responsive design easier than retrofitting
5. **Demo Mode Accelerates Testing:** Local testing without OAuth saves hours

---

## 📝 Decisions Made

### Pre-Sprint 0 Decisions:
1. ✅ **Week 5 Buffer Adjustment:** APPROVED - 8h for recurring workflows (borrowed 2h from Lane 2)
2. ✅ **Tool Preference:** GitHub Projects for task tracking
3. ✅ **Update Channel:** Google Chat Space "Renubu Dev Sync" for daily updates

### During Sprint 0:
1. Website hero design approval
2. Grace workflow validation
3. Velocity tracking spreadsheet format

---

## ✅ Approval & Sign-Off

**Plan Created By:** Claude Code Assistant
**Reviewed By:** Product Manager (Approved 2025-11-03)
**Approved By:** Justin (Approved 2025-11-03)
**Status:** ✅ Ready to Execute

**Confidence Level:** 80% with Lane 2 buffer
**Next Step:** Sprint 0 kickoff (Nov 6-8)

---

**Document Version:** 1.1 (Finalized with all decisions approved)
**Last Updated:** 2025-11-03
**Location:** `docs/labs/Q4-2025-DEVELOPMENT-PLAN.md`
