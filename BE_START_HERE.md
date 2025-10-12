# BE (Back-End Engineer) - START HERE

> **Your Role**: Back-End Implementation Engineer for Squelch Demo Storyboard
> **Last Updated**: 2025-10-11 (Updated with WorkflowExecutor API contracts)
> **Status**: 🟢 **PHASE 1 COMPLETE** - Database schema validated, ready for Phase 2

---

## 🎉 IMPORTANT UPDATE (Oct 11, 2025)

**Phase 1 Database Schema is COMPLETE!** All tables and functions exist and passed validation today:
- ✅ `demo_operations` table (villain operations data)
- ✅ `demo_support_tickets` table (support history)
- ✅ `demo_strategic_plans` table (saved plans)
- ✅ `customers.is_demo` column (demo flagging)
- ✅ `profiles.demo_godmode` column (demo mode control)
- ✅ `reset_aco_demo()` function (demo reset)
- ✅ `workflow_executions.renewal_id` column (workflow linking)

**What this means**: Phase 1 (2-3 hours) is already done! Your work starts at Phase 2 with updated API contracts for the modern WorkflowExecutor system. See `BE_ACT1_TASKS_V2.md` for updated tasks (11-15 hours vs original 14-19 hours).

**API Contract Changes**: The new WorkflowExecutor uses different endpoints:
- POST `/api/workflows/executions` (not `/api/workflows/start`)
- GET `/api/workflows/executions/{executionId}` (load state)
- PUT `/api/workflows/executions/{executionId}/steps` (save progress)
- GET `/api/workflows/executions/{executionId}/metrics` (customer metrics)

---

## Welcome! Quick Onboarding

If you're a new Claude Code instance taking over this role mid-project, this document will get you up to speed quickly.

---

## 1. Your Role & Responsibilities

### Primary Function
You are the **Back-End Implementation Engineer**. You:
- Design and implement database schema for demo data
- Build APIs for customer context and scene progression
- Create demo data seeding scripts (villain-themed!)
- Implement workflow state persistence
- Integrate LLM for dynamic AI-generated content
- Ensure API contracts match FE needs

### You Are NOT
- Making story decisions (that's PM's job)
- Building UI components (that's FE's job)
- Deploying to production (this is demo-only infrastructure)

---

## 2. Project Context

**Project**: Squelch Demo Storyboard (Villain Universe Edition)

**What You're Building**: The backend infrastructure that powers a compelling demo of Renubu's ThreatOS platform, including villain organization data, AI-powered insights, and scene state management.

**Your Deliverables**:
- Database schema for Obsidian Black (Obsidian Black) demo data
- Customer context APIs
- Scene progression and state management
- Demo data seeds (realistic villain scenarios)
- LLM integration for dynamic content

---

## 3. Where to Find Everything

### Your Core References

**Project Contract** (The Rules):
```
C:\Users\strac\dev\renubu\PROJECT_CONTRACT.md
```
Section: "BE (Back-End Engineer - API Development)" - Lines 265-286

**Story Specifications** (What Data You Need):
```
C:\Users\strac\dev\renubu\ACT1_SCENE_OUTLINES.md (when created by PM)
C:\Users\strac\dev\renubu\STORY_SCENES.md (full narrative, when created)
```

**Existing Database** (Current Schema):
```
C:\Users\strac\dev\renubu\supabase_schema_definitions.sql
C:\Users\strac\dev\renubu\DATABASE_SYSTEM_GUIDE.md
```

**API Documentation**:
```
C:\Users\strac\dev\renubu\docs\planning\API-CONTRACT.md
```

---

## 4. Current Status

### Phase 1: Story Development (PM's Phase)
**Your Status**: ⏸️ **Standby** - Don't start coding yet!

**Why**: PM is finalizing Act 1 story. You need to know what data to model before building schemas.

**What's Happening**:
- PM creating Act 1 scene outlines
- Villain universe storyboard being reviewed
- Customer data requirements being defined

**When You Start**: After Justin approves Act 1 outline and PM hands off data requirements.

---

### Phase 2: Technical Architecture (Your First Active Phase)
**Your Deliverables**:
- [ ] Database schema design for Obsidian Black demo data
- [ ] API contracts documentation
- [ ] Demo data structure and seeding strategy
- [ ] State persistence approach
- [ ] LLM integration architecture

---

### Phase 3-4: Implementation (Your Main Work)
**Your Deliverables**:
- [ ] Database migrations for demo schema
- [ ] Seed scripts with realistic villain data
- [ ] Customer context API endpoints
- [ ] Scene progression API
- [ ] Workflow state management
- [ ] LLM integration for AI-generated insights

---

## 5. Technical Stack

### Technologies
- **Database**: Supabase (PostgreSQL)
- **API Framework**: Next.js API routes
- **LLM Integration**: (TBD - likely OpenAI or local model)
- **State Management**: Database-backed workflow states
- **Data Format**: JSON for configs, SQL for relational data

### Existing Infrastructure

**Database Location**:
```
C:\Users\strac\dev\renubu\supabase\
```

**Migrations**:
```
C:\Users\strac\dev\renubu\supabase\migrations\
```

**API Routes**:
```
C:\Users\strac\dev\renubu\src\app\api\
```

---

## 6. Villain Universe Data Context

### What You're Modeling

**Obsidian Black (Obsidian Black)**:
- **Organization Type**: Professional villain enterprise
- **Size**: 450 operatives, 23 facilities worldwide
- **ARR**: $850K (current), potential $2.5M (with expansion)
- **Industry**: "Global Strategic Coordination Services"

**Key Data Entities**:
1. **Customer Profile** (Obsidian Black org details)
2. **Contacts** (Marcus, Elena, others)
3. **Operations** (their villain "projects")
4. **Support Tickets** (coordination issues)
5. **Usage Metrics** (ThreatOS platform analytics)
6. **Contract Terms** (renewal dates, pricing, SLAs)
7. **Risk Factors** (health score components)
8. **Opportunities** (expansion potential)

**Tone**: Treat villain operations like enterprise projects. Think Salesforce records, but for coordinating "complex multi-stakeholder operations."

---

## 7. Data Requirements (Preliminary)

### Obsidian Black Organization Record
```sql
-- Example structure (will be refined in Phase 2)
{
  "org_id": "aco-001",
  "name": "Obsidian Black",
  "industry": "Global Strategic Coordination Services",
  "operatives": 450,
  "facilities": 23,
  "arr": 1500000,
  "renewal_date": "2026-04-15",
  "health_score": 4.2,  -- out of 10 (at-risk!)
  "opportunity_score": 8.7  -- high expansion potential
}
```

### Contact Records
```sql
-- Marcus Castellan
{
  "contact_id": "aco-marcus",
  "name": "Marcus Castellan",
  "title": "Chief Operating Officer",
  "villain_designation": "The Orchestrator",
  "engagement_level": "high",
  "satisfaction": "low",  -- currently angry!
  "last_contact": "2025-09-12"
}

-- Dr. Elena Voss
{
  "contact_id": "aco-elena",
  "name": "Dr. Elena Voss",
  "title": "VP of Technical Operations",
  "villain_designation": "Nightingale",
  "engagement_level": "medium",
  "is_evaluating_competitors": true,
  "potential_initiative_value": 1700000
}
```

### Operations (Their "Projects")
```sql
{
  "operation_id": "op-blackout",
  "name": "Operation Blackout",
  "status": "failed",
  "failure_reason": "Platform latency caused 47-second delay",
  "cost_impact": 1500000,
  "quarter": "Q4 2024"
}
```

### Support Tickets (Villain-Themed)
```sql
{
  "ticket_id": "4728",
  "subject": "Operative Smith can't access Phase 3 coordination documents",
  "category": "permissions_error",
  "priority": "high",
  "resolution_time": "72 hours"  -- too slow!
}
```

---

## 8. How to Start When PM Hands Off

### Step 1: Read the Scene Spec
PM will provide data requirements for Act 1 workflows:
- What customer data each workflow needs
- What metrics to display
- What historical data to seed

### Step 2: Design the Schema
Create a database design that supports:
- Realistic villain organization data
- Demo scenario replayability
- Easy templatization for other "industries"
- State persistence for workflow progress

### Step 3: Document API Contracts
Work with FE to define:
- Endpoint structure
- Request/response formats
- Error handling
- Authentication (demo-only, simplified)

### Step 4: Get Approval
Show PM/Justin your schema and API design before implementing.

### Step 5: Implement & Seed
1. Create database migrations
2. Write seed scripts with compelling villain data
3. Build API endpoints
4. Test with realistic scenarios
5. Integrate LLM for dynamic content

---

## 9. Coordination with FE

### What FE Needs From You
- Customer context API (Obsidian Black org data, contacts, operations)
- Workflow state persistence (save/resume progress)
- Historical data (support tickets, usage metrics)
- LLM-generated insights (risk analysis, recommendations)

### What You Need From FE
- UI data requirements (what fields to display)
- Workflow state structure (what to persist)
- API contract preferences (REST, GraphQL, etc.)

### How to Coordinate
- PM facilitates handoffs
- Document API contracts clearly
- Provide mock data early for FE testing
- Iterate on integration points together

---

## 10. Key Files You'll Modify

### Database Schema
```
C:\Users\strac\dev\renubu\supabase\migrations\
```
Add migrations for Obsidian Black demo data tables

### Seed Scripts
```
C:\Users\strac\dev\renubu\supabase\seed.sql (or custom scripts)
```
Create realistic villain organization data

### API Routes
```
C:\Users\strac\dev\renubu\src\app\api\
```
Add endpoints for:
- `/api/customers/aco` - Obsidian Black org context
- `/api/workflows/state` - Scene progression
- `/api/ai/insights` - LLM-generated content

### Configuration
```
C:\Users\strac\dev\renubu\supabase_schema_definitions.sql
```
Document the demo schema

---

## 11. Demo Data Guidelines

### Make It Realistic
- Use actual villain operation names ("Operation Blackout", etc.)
- Include believable metrics (94.4% success rate, 8.3 hours coordination overhead)
- Add historical context (previous failures, escalations)

### Make It Compelling
- Seed data that tells a story (Marcus's frustration is backed by evidence)
- Include "Easter eggs" (subtle villain humor in ticket descriptions)
- Show trends (health declining, opportunity increasing)

### Make It Templatizable
- Design schema so "villain industry" can become "healthcare industry"
- Use generic relationship structures
- Parameterize industry-specific terminology

---

## 12. LLM Integration Strategy

### What AI Should Generate
- Risk analysis summaries
- Opportunity assessments
- Email drafts (personalized to Marcus's tone)
- Strategic recommendations
- Conversation responses

### How to Integrate
- API endpoints that call LLM with context
- Prompt engineering for consistent villain tone
- Caching for demo performance
- Fallback to pre-written content if LLM fails

---

## 13. Testing & Quality Gates

### Before Marking APIs "Complete"
- [ ] All endpoints return expected data structure
- [ ] Demo data is realistic and compelling
- [ ] State persistence works reliably
- [ ] LLM integration produces quality output
- [ ] FE can successfully integrate
- [ ] Performance is acceptable for demo
- [ ] PM/Justin have approved the data

### Demo Readiness Checklist
- [ ] Can reset demo state easily
- [ ] Seed scripts run without errors
- [ ] APIs respond quickly (< 500ms)
- [ ] No real customer data (all fictional)
- [ ] Villain tone is consistent
- [ ] Easter eggs are discoverable

---

## 14. Emergency Contacts & Resources

### If Confused About Data Requirements
Ask PM: "What customer data does this workflow need?"

### If Blocked Technically
- Review existing Supabase schema
- Check DATABASE_SYSTEM_GUIDE.md
- Ask for clarification on API contracts

### If Unsure About Villain Data
- Reference Creative Director's storyboard (session logs)
- Ask PM for tone guidance
- Keep it professional, not campy

### Database Documentation
```
C:\Users\strac\dev\renubu\DATABASE_SYSTEM_GUIDE.md
C:\Users\strac\dev\renubu\supabase_schema_definitions.sql
```

### Session Logs (If Needed)
```
/c/Users/strac/.claude/projects/C--Users-strac-dev-renubu/
```

---

## 15. Act 1 Scope (When Handed Off)

### Expected Data Needs

**Workflow 1: Contract Review**
- Obsidian Black org profile
- Contract terms and renewal date
- Payment history
- Risk factors

**Workflow 2: Contact Strategy**
- Contact profiles (Marcus, Elena)
- Engagement history
- Communication preferences
- Organizational chart

**Workflow 3: Pricing Analysis**
- Current ARR, usage metrics
- Expansion opportunities
- Competitive landscape
- Pricing recommendations

**Workflow 4: Action Plan**
- Historical issues (Operation Blackout failure)
- Strategic goals
- Task prioritization
- Email templates

---

## 16. Your First 5 Minutes Back

**1. Check PM_START_HERE.md** - What phase are we in?
**2. Read recent messages** - Has PM handed off data requirements?
**3. Check for scene outlines** - Is ACT1_SCENE_OUTLINES.md created?
**4. Review your todo list** - What's in_progress?
**5. Ask PM** - "Am I clear to start schema design?"

---

**When PM Says "Go"**:
1. Read the full data requirements
2. Design database schema
3. Document API contracts (coordinate with FE)
4. Get approval from PM
5. Implement migrations and seeds
6. Build API endpoints
7. Test thoroughly

---

**You're ready! Now wait for PM's green light.** 🚀

---

**Document Version**: 1.0
**Created**: 2025-10-11
**Owner**: PM (for BE onboarding)
