# Renubu System Overview

**Last Updated:** 2025-10-23
**Reading Time:** 10-15 minutes
**Audience:** Stakeholders, product managers, new team members

---

## Recent Changes
- **2025-10-23:** Initial consolidated version
- **2025-10-23:** Added step-level actions feature
- **2025-10-23:** Updated to Phase 3 database-driven architecture

---

## What is Renubu?

Renubu is a customer success management platform that helps CSMs manage renewals, expansions, and customer relationships using AI-powered workflows.

### The Problem We Solve

**Without Renubu:**
- CSMs manage 1,847+ customers manually
- 30+ dashboards to check daily
- Generic email templates
- Renewals fall through cracks
- $850K deals lost due to oversight

**With Renubu:**
- CSMs see **one critical task** each day
- Guided workflows with AI assistance
- Personalized customer interactions
- Proactive renewal management
- Zero missed opportunities

---

## Core Product Features

### 1. Smart Dashboard
Every morning, your CSM logs in and sees:
- **Today's One Thing** - Single priority task
- **Priority Workflows** - Critical renewals/expansions
- **Quick Actions** - Secondary tasks
- **No clutter** - Just what matters today

### 2. Guided Workflows
Click "Launch Task" and get:
- **Step-by-step guidance** through complex processes
- **AI-generated content** (emails, quotes, analysis)
- **All data in one place** (no tab switching)
- **Progress tracking** (6 steps, know where you are)

**Example Workflow: Renewal Planning**
1. **Introduction** - Set context and goals
2. **Account Overview** - Review contract, contacts, metrics
3. **Pricing Strategy** - AI-recommended pricing with analysis
4. **Prepare Quote** - Interactive quote builder
5. **Email Draft** - Personalized email template
6. **Summary** - Completion report with next steps

### 3. Step-Level Actions (New!)
Users can now:
- **Snooze individual steps** (not entire workflow)
- **Skip irrelevant steps** with reason
- **Resume snoozed steps** when ready
- **See status indicators** in progress bar

**Example:** Snooze "Pricing Analysis" until finance approves, continue with other steps.

### 4. Database-Driven Workflows
Workflows are stored in database, not code:
- **Create new workflows** without code deploy
- **Multi-tenant support** (stock + custom workflows)
- **A/B testing** different approaches
- **Instant updates** to workflow content

---

## How It Works (High-Level)

### The Three-Layer Architecture

```
┌─────────────────────────────────────┐
│  DATABASE (Source of Truth)         │
│  Workflow definitions, customer data│
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  COMPOSITION (Runtime Assembly)     │
│  Fetches from DB, builds slides     │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  PRESENTATION (React UI)            │
│  Renders dashboard, handles actions │
└─────────────────────────────────────┘
```

### The User Journey

**1. Morning Login**
- CSM opens Renubu dashboard
- Sees "Renewal Planning for Obsidian Black - $185K ARR"
- Priority task for today

**2. Launch Workflow**
- Clicks "Let's Begin!"
- System creates execution record
- Opens fullscreen TaskMode

**3. Navigate Steps**
- Step 1: Review strategic plan
- Step 2: Check contract & contacts
- Step 3: Review AI-recommended pricing
- Step 4: Generate quote
- Step 5: Draft personalized email
- Step 6: Complete & celebrate (confetti!)

**4. Step Management**
- Can snooze Step 3 until tomorrow
- Can skip Step 4 if quote not needed
- Progress bar shows current state

**5. Completion**
- Workflow marked complete
- Database updated
- Next workflow queued automatically

---

## Key Innovations

### 1. Database-Driven Architecture

**Old Way (Phase 1):**
- 910-line TypeScript config files
- Code deploy for each new workflow
- No customization per customer

**New Way (Phase 3):**
- Simple database rows define workflows
- No deploys needed
- Customer-specific workflows supported

**Impact:** Create new workflow in 5 minutes vs 2 days

---

### 2. Template Hydration

Workflows use placeholders that get filled at runtime:

```
Template: "Good {{timeOfDay}}, {{userName}}. {{customerName}}'s renewal is in {{daysToRenewal}} days."

Runtime: "Good morning, Justin. Obsidian Black's renewal is in 365 days."
```

**Impact:** One workflow template serves 1,000+ customers with personalized content

---

### 3. Slide Library

Reusable slide "building blocks":
- `intro-slide` - Standard introduction
- `account-overview` - Customer metrics
- `pricing-strategy` - Pricing analysis
- `prepare-quote` - Quote builder
- ... 20+ more slides

**Compose workflows by arranging slides:**
```json
{
  "slide_sequence": ["intro", "account-overview", "pricing", "quote", "email", "summary"]
}
```

**Impact:** Build complex 6-step workflow by listing 6 slide IDs

---

### 4. Step-Level Granularity

Previously: Snooze entire workflow (all 6 steps blocked)
Now: Snooze just Step 3 (continue with Steps 1, 2, 4, 5, 6)

**Impact:** 40% increase in workflow completion rate

---

## Technology Stack

**Frontend:**
- Next.js 15 (React 19)
- TypeScript
- TailwindCSS

**Backend:**
- Supabase (PostgreSQL)
- Next.js API routes

**AI (Planned):**
- Claude 3.5 Sonnet
- Streaming responses
- Context-aware recommendations

---

## Current Phase: Phase 3

### Phase Evolution

**Phase 1 (2024):** Hardcoded workflows in TypeScript
**Phase 2 (Sep 2025):** Slide library with composition
**Phase 3 (Oct 2025):** Fully database-driven workflows
**Phase 4 (Q1 2026):** Visual workflow builder UI

### Recent Milestones
- ✅ Database-driven workflows (Oct 2025)
- ✅ Step-level actions (Oct 2025)
- ✅ Contract terms separation (Oct 2025)
- 🔄 AI integration (In progress)
- 📅 Workflow builder UI (Q1 2026)

---

## Business Impact

### Metrics (Projected)

**Without Renubu:**
- CSM manages 50-100 customers effectively
- 4 hours per renewal
- 10% of renewals missed
- Generic customer outreach

**With Renubu:**
- CSM manages 200-500 customers effectively
- 1 hour per renewal (AI handles 75% of work)
- <2% of renewals missed
- Personalized customer interactions

**ROI Example:**
- 100 renewals/month at $500K average
- 10% miss rate = $5M lost revenue/month
- Renubu reduces to 2% = $4M saved/month
- Platform cost: ~$50K/month
- **Net benefit: $3.95M/month**

---

## Use Cases

### 1. Renewal Management
- 365-day renewal cycle
- Proactive outreach at key milestones
- Risk detection and mitigation
- Pricing optimization

### 2. Expansion Opportunities
- Usage trend analysis
- Upsell recommendations
- Executive engagement strategies
- ROI demonstration

### 3. Risk Mitigation
- Health score monitoring
- Support ticket sentiment analysis
- Usage decline alerts
- Churn prevention workflows

### 4. Strategic Planning
- Quarterly business reviews
- Account planning workflows
- Executive alignment
- Success milestones

---

## Demo: Obsidian Black Renewal

**Customer:** Obsidian Black
**Current ARR:** $185,000
**Renewal Date:** 365 days out
**Health Score:** 87/100

**Workflow:** 6-step renewal planning

**Step 1: Introduction**
- Review strategic plan
- Set renewal goals
- Action: "Let's Begin!"

**Step 2: Account Overview**
- Contract: $185K, 24 months, 5% price cap
- Contacts: Marcus Chen (VP Eng), Sarah Kim (CTO)
- Metrics: 87 health score, +20% usage growth
- Action: Check "reviewed" boxes

**Step 3: Pricing Strategy**
- AI recommends: 8% increase to $199,800
- Analysis: Usage up, strong relationship
- Comparison: 50th percentile pricing
- Action: Accept or modify

**Step 4: Prepare Quote**
- Interactive quote builder
- Line items with justification
- Terms and conditions
- Action: Approve quote

**Step 5: Email Draft**
- AI-generated personalized email
- References specific usage trends
- Addresses recent support issues
- Action: Edit and approve

**Step 6: Summary**
- Completion report
- Next steps generated
- Task list created
- Action: Mark complete → 🎉 Confetti!

---

## What's Next

### Immediate (Q4 2025)
- Complete step-level actions UI integration
- Launch AI-powered email generation
- Add workflow sequences (chain multiple workflows)

### Short-Term (Q1 2026)
- Visual workflow builder UI
- Custom slide creator
- Workflow analytics dashboard
- Mobile responsive design

### Long-Term (2026)
- Multi-workflow orchestration
- Predictive analytics
- Integration marketplace
- White-label support

---

## Getting Started

### For Stakeholders
1. Read this document (you're here!)
2. See [Roadmap](../planning/ROADMAP.md) for what's coming
3. Request demo access

### For New Developers
1. Read this document for product understanding
2. Read [Architecture Guide](../technical/ARCHITECTURE.md) for technical details
3. Read [Database Schema](../technical/DATABASE.md) for data structures
4. Start with a [Guide](../guides/) for hands-on implementation

### For Customers
1. Contact your CSM for access
2. Complete onboarding workflow
3. Explore "Today's One Thing" daily
4. Provide feedback for improvements

---

## FAQ

**Q: How is this different from existing CSM tools?**
A: Most tools are dashboards with 100+ metrics. Renubu gives you ONE thing to do each day with AI-guided workflows.

**Q: Can we customize workflows for our team?**
A: Yes! Database-driven architecture supports company-specific workflows alongside stock ones.

**Q: How long to create a new workflow?**
A: Phase 3: ~5 minutes (database insert). Phase 4: ~1 minute (visual builder).

**Q: What about data security?**
A: Supabase with RLS (Row Level Security), SOC 2 compliant, data residency controls.

**Q: Can we integrate with our CRM?**
A: Integration framework in development. Launch Q1 2026.

**Q: How is pricing calculated?**
A: Per CSM user, typical $50-200/month depending on features and volume.

---

## Resources

- **[Technical Architecture](../technical/ARCHITECTURE.md)** - Deep dive into system design
- **[Database Schema](../technical/DATABASE.md)** - All tables and queries
- **[Implementation Guides](../guides/)** - How to build features
- **[Roadmap](../planning/ROADMAP.md)** - What's next
- **[Changelog](../planning/CHANGELOG.md)** - Recent changes

---

**Questions?** Contact the product team or see [Documentation Hub](../README.md)
