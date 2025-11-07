# Weekly Planner - Demo Roadmap Status

**Feature:** Weekly Planner
**Status:** Demo Roadmap (Build if 2+ customers request)
**Last Updated:** November 6, 2025

---

## Current Status

**Location:** Demo Roadmap
**Decision Date:** November 6, 2025
**Decision:** Moved from Q1 2026 active roadmap to demo roadmap

---

## Why Moved To Demo Roadmap

### Customer Demand
- **Requests to date:** 0
- **Design partner interest:** None expressed
- **Market validation:** Not validated as needed feature

### Strategic Alignment
- **Core value prop:** "I won't let you forget" + "It learns YOUR playbook"
- **Weekly Planner fit:** Nice to have, not core differentiator
- **Competitive moat:** Doesn't create learning loop advantage
- **Gainsight comparison:** Gainsight has this, not our differentiator

### Resource Allocation
- **Q1 Priority:** Human OS Check-Ins (learning loop = THE moat)
- **Limited time:** 10 weeks in Q1 2026
- **Better ROI:** Check-ins justify $200/user, planner doesn't

---

## Build Trigger

**Condition:** 2+ design partners explicitly request it
**Timeline if triggered:** Q2 2026
**Estimated effort:** 40-60h (vs. original 109h, faster with snooze infrastructure)

---

## What's Built Today

**Infrastructure that helps Weekly Planner:**
- ✅ Workflow snoozing (Phase 1) - Condition-based wake logic
- ✅ Task management - Already works
- ✅ Calendar integration (partial) - OAuth placeholders in place
- ✅ Workload analysis service - Auto-surfaces work commitments
- ✅ Database schema - 7 tables deployed but not active

**Weekly Planner specific (not built):**
- ❌ Weekly plan creation UI
- ❌ Commitment prioritization logic
- ❌ Scheduling optimization
- ❌ Reflection/review workflow
- ❌ Week-over-week learning

---

## If Customers Request

### Prerequisites
- Must have 2+ design partners saying "we need this"
- Must not displace higher priorities
- Must fit strategic timeline (likely Q2 2026)

### Fast-Track Approach (40-60h vs. original 109h)
Weekly Planner becomes a **recurring workflow type** on top of workflow snoozing:

**Week 1 (16h):**
- Enable weekly plan tables
- Create weekly plan workflow template
- Build commitment selection UI

**Week 2 (16h):**
- Smart scheduling with existing CalendarService
- Workload analysis integration (already built)

**Week 3 (12h):**
- Reflection workflow (check-ins can power this)
- Week-over-week insights

**Week 4 (8h):**
- Polish + design partner testing
- Ship

**Total:** 52h (vs. original 109h)
**Why faster:** Workflow snoozing + calendar services + workload analysis already built

---

## Demo Deck Assets

**What to show customers:**
1. Mockups of weekly planning interface
2. Example: "Monday morning, see your week laid out"
3. Show: Auto-surfaced renewals, tasks, commitments
4. Explain: Smart scheduling based on energy, context, priorities
5. Mention: "Available if this resonates with your workflow"

**DO NOT:**
- Promise it's being built
- Give specific ship dates
- Over-sell beyond core value prop

**DO:**
- Gauge interest
- Ask: "Is this something you'd use?"
- Track: If 2+ say yes, escalate to roadmap discussion

---

## Related Features (Active Roadmap)

**Phase 1: Workflow Snoozing (Dec 20, 2025)**
- Core promise: "I won't let you forget"
- Condition-based wake logic
- Universal workflow abstraction

**Phase 2: Parking Lot (Jan 2026)**
- Quick capture for ideas
- Complements planning (park non-urgent items)

**Phase 3: Human OS Check-Ins (Feb-Mar 2026)**
- THE differentiator
- Learning loop foundation
- "It learns YOUR playbook"
- Justifies premium pricing

---

## Documentation References

**Detailed Specs (Archived):**
- `weekly-planner-overview.md` - Feature overview
- `weekly-planner-development-plan.md` - Original 109h plan

**Related Active Plans:**
- `docs/PLAN.md` - Current development roadmap
- `docs/STATE.md` - What's built today

---

## History

**October 2025:**
- Weekly Planner designed as Q4 priority
- 109h plan created

**November 5, 2025:**
- Reprioritization: Workflow Snoozing elevated over Weekly Planner
- Weekly Planner deferred to Q1 2026

**November 6, 2025:**
- Second reprioritization: Human OS Check-Ins elevated for Q1
- Weekly Planner moved to Demo Roadmap
- Reason: Zero customer demand, not core to learning loop moat
- Build trigger: 2+ customers must request it

---

**Next Review:** End of Q1 2026 (March 2026)
- Check: Did any customers request this?
- Decision: Stay in demo roadmap or move to active?
