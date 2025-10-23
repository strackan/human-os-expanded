# Roadmap

**Last Updated:** 2025-10-23
**Current Phase:** Phase 3 - Database-Driven Workflows

---

## Recent Changes
- **2025-10-23:** Phase 3F Dashboard Integration completed
- **2025-10-23:** Added Zen Dashboard Modernization plan
- **2025-10-23:** Initial roadmap creation
- **2025-10-23:** Documentation consolidation completed
- **2025-10-22:** Step-level actions 90% complete

---

## Current Phase: Phase 3 (Oct 2025)

### Completed ✅
- Database-driven workflows (Phase 3C)
- Template hydration system
- Multi-tenant support
- Step-level actions (database & service - Phase 3E)
- Contract terms separation
- Dashboard integration (Phase 3F)
  - ContractTermsCard component
  - WorkflowStatePanel component
  - NotificationBanner component
  - WorkflowAnalyticsDashboard component
- Documentation consolidation

### In Progress 🔄
- Zen Dashboard Modernization
- Step-level actions UI integration (90%)
- AI email generation

---

## Q4 2025 (Current Quarter)

### October
- ✅ Phase 3 database-driven workflows
- ✅ Step-level actions foundation
- ✅ Contract terms table
- ✅ Phase 3F Dashboard Integration (~1,200 lines)
- ✅ Documentation consolidation
- 🔄 Complete step-level actions UI (5% remaining)

### November
- **Zen Dashboard Modernization** (Priority)
  - Clone zen-dashboard aesthetic (preserve CSS)
  - Integrate Phase 3F components with zen styling
  - Database-driven workflows (replace hardcoded data)
  - Create `/dashboard` as single source of truth
  - Archive old dashboard versions
- AI-powered email generation
- Workflow sequences (chain multiple workflows)

### December
- Version cleanup (archive -v2, -v3 versions)
- Performance optimizations
- Mobile responsive improvements

---

## Zen Dashboard Modernization Plan

### Overview
Modernize zen-dashboard with Phase 3F features while preserving the zen aesthetic.

### Design Philosophy
- ✅ Clean, minimal, centered design
- ✅ Gradient background (gray-50 to purple-50)
- ✅ Simple greeting with time-based message
- ✅ Focus on primary action
- ✅ Spacious, breathing room
- ✅ Soft shadows, rounded corners

### Implementation Steps

#### Step 1: Create Zen-Styled Phase 3F Components
**Files to Create:**
1. `src/components/dashboard/zen/ZenNotificationBanner.tsx`
   - Wrapper around NotificationBanner with zen styling
2. `src/components/dashboard/zen/ZenWorkflowStateTabs.tsx`
   - Simplified WorkflowStatePanel for zen aesthetic
3. `src/components/dashboard/zen/ZenQuickInsights.tsx`
   - Analytics highlights in zen style
4. `src/components/dashboard/zen/ZenAnalyticsDashboard.tsx`
   - Wrapper around WorkflowAnalyticsDashboard with zen styling

**Estimated Time:** 2-3 hours

#### Step 2: Update Existing Components
**Files to Modify:**
1. `src/components/dashboard/TodaysWorkflows.tsx`
   - Add database integration
   - Fetch from WorkflowQueryService
2. `src/components/dashboard/PriorityWorkflowCard.tsx`
   - Fetch real priority workflow from database
   - Show actual due dates, ARR, etc.

**Estimated Time:** 1-2 hours

#### Step 3: Create Modern Zen Dashboard Page
**File:** `src/app/dashboard/page.tsx`

**Structure:**
```tsx
<div className="gradient-background">
  {/* Notifications (collapsible) */}
  <ZenNotificationBanner userId={userId} />

  {/* Greeting */}
  <ZenGreeting />

  {/* Priority workflow */}
  <PriorityWorkflowCard />

  {/* Workflow states - zen style */}
  <ZenWorkflowStateTabs userId={userId} />

  {/* Two columns */}
  <div className="grid-cols-2">
    <TodaysWorkflows workflows={...} />
    <ZenQuickInsights userId={userId} />
  </div>

  <WhenYouReReady />

  {/* Optional analytics (below fold) */}
  <ZenAnalyticsDashboard userId={userId} />
</div>
```

**Features:**
- Use zen-dashboard layout
- Add Phase 3F components (zen-styled)
- Database-driven data
- Keep zen aesthetic

**Estimated Time:** 1 hour

#### Step 4: Deprecate Old Versions
**Actions:**
1. Add deprecation notice to `/zen-dashboard`
2. Add deprecation notice to `/obsidian-black`
3. Redirect `/demo-dashboard` to `/dashboard`
4. Update documentation

**Estimated Time:** 30 minutes

### Migration Strategy

**Phase 1: Build (Week 1)**
1. ✅ Create zen-styled Phase 3F components
2. ✅ Update TodaysWorkflows with database integration
3. ✅ Create `/dashboard` page with new structure
4. ✅ Test with real data

**Phase 2: Transition (Week 2)**
1. ✅ Deploy `/dashboard` as primary entry point
2. ✅ Add deprecation notices to old pages
3. ✅ Update all internal links
4. ✅ Monitor usage

**Phase 3: Archive (Week 3)**
1. ✅ Move `/zen-dashboard` to `/_archive/zen-dashboard-2024-10-23`
2. ✅ Move `/obsidian-black` to `/_archive/obsidian-black-2024-10-23`
3. ✅ Clean up unused code
4. ✅ Update documentation

### Success Criteria

**User Experience:**
- ✅ Maintains zen aesthetic (clean, minimal, breathing room)
- ✅ Adds Phase 3F functionality (workflows, notifications, analytics)
- ✅ Database-driven (real data, not hardcoded)
- ✅ Single source of truth (`/dashboard`)

**Technical:**
- ✅ No version suffixes (-v2, -v3)
- ✅ All Phase 3F services integrated
- ✅ Reusable zen-styled components
- ✅ Easy to maintain

**Design:**
- ✅ Consistent with current zen-dashboard look
- ✅ Purple gradient background
- ✅ Soft shadows, rounded corners
- ✅ Spacious layout with breathing room

**Estimated Total Time:** 4-6 hours

---

## Q1 2026

### Phase 4: Visual Workflow Builder
- Drag-and-drop slide sequencing
- Context editor
- Template variable picker
- Preview mode
- Version control

### Additional Features
- Custom slide creator
- Multi-workflow orchestration
- Predictive analytics

---

## Long-Term (2026+)

- Integration marketplace
- White-label support
- Advanced AI recommendations
- Mobile native apps
- Workflow marketplace

---

## Feature Status

| Feature | Status | Target |
|---------|--------|--------|
| Database-Driven Workflows | ✅ Complete | Oct 2025 |
| Phase 3F Dashboard Integration | ✅ Complete | Oct 2025 |
| Step-Level Actions | 🔄 90% | Oct 2025 |
| Contract Terms | ✅ Complete | Oct 2025 |
| Doc Consolidation | ✅ Complete | Oct 2025 |
| Zen Dashboard Modernization | 🔄 In Progress | Nov 2025 |
| AI Email Generation | 📅 Planned | Nov 2025 |
| Workflow Sequences | 📅 Planned | Nov 2025 |
| Visual Builder | 📅 Planned | Q1 2026 |
| Integration Marketplace | 📅 Planned | 2026 |

---

## Related Documentation

- [Changelog](CHANGELOG.md) - What changed when
- [System Overview](../product/SYSTEM-OVERVIEW.md) - Product vision
- [Architecture Guide](../technical/ARCHITECTURE.md) - Technical details

