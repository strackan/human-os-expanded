# Onboarding - Customer Success & Services

**Last Updated:** 2025-11-07
**Version:** 0.1
**Audience:** Internal (Customer Success, Sales, Implementation)

---

## Overview

This document describes the current customer onboarding process, exceptions, customer-specific scenarios, and best practices for successful Renubu implementations.

---

## Standard Onboarding Process

### Phase 1: Discovery & Setup (Week 1)

**Goals:**
- Understand customer's CS process
- Configure Renubu environment
- Define success criteria

**Activities:**

**1. Kickoff Call (1 hour)**
- [ ] Introductions
- [ ] Review customer's current CS workflow
- [ ] Identify pain points
- [ ] Set expectations and timeline
- [ ] Assign customer success manager

**2. Technical Setup (2-3 hours)**
- [ ] Create customer Supabase project (if separate instance)
- [ ] Configure OAuth (Google Calendar, Gmail)
- [ ] Set up initial users
- [ ] Import customer data (if applicable)
- [ ] Configure demo mode for training

**3. Data Migration (varies)**
- [ ] Export data from existing system (Gainsight, Salesforce, etc.)
- [ ] Map data fields to Renubu schema
- [ ] Import customers (CSV or API)
- [ ] Import contacts
- [ ] Verify data integrity

### Phase 2: Training & Configuration (Week 2)

**Goals:**
- Train users on Renubu
- Configure workflows
- Establish processes

**Activities:**

**1. Admin Training (2 hours)**
- [ ] System overview
- [ ] User management
- [ ] Workflow configuration
- [ ] Reporting and analytics
- [ ] Settings and integrations

**2. End-User Training (1 hour per cohort)**
- [ ] Navigation basics
- [ ] Creating and managing workflows
- [ ] Task management
- [ ] Using artifacts
- [ ] Snoozing workflows (Phase 1+)

**3. Workflow Configuration**
- [ ] Configure renewal workflows
- [ ] Set up account planning workflows
- [ ] Customize workflow templates
- [ ] Define automation rules

### Phase 3: Go-Live & Support (Week 3-4)

**Goals:**
- Launch to production
- Monitor usage
- Address issues

**Activities:**

**1. Pilot Launch (Week 3)**
- [ ] Select pilot group (5-10 users)
- [ ] Enable production access
- [ ] Daily check-ins
- [ ] Collect feedback
- [ ] Address issues quickly

**2. Full Rollout (Week 4)**
- [ ] Enable all users
- [ ] Monitor adoption metrics
- [ ] Provide ongoing support
- [ ] Schedule weekly check-ins

**3. Success Milestones (30/60/90 days)**
- [ ] 30-day check-in: Review adoption, address blockers
- [ ] 60-day check-in: Measure impact, identify optimization
- [ ] 90-day check-in: Business review, expansion opportunities

---

## Customer Personas

### Persona 1: Enterprise CSM Team
**Characteristics:**
- 10-50 CSMs
- Complex CS processes
- Existing tools (Salesforce, Gainsight)
- Need deep integrations

**Onboarding Approach:**
- Longer discovery (2-3 weeks)
- Phased rollout by region/segment
- Custom integrations required
- Executive sponsorship critical

**Success Criteria:**
- 80%+ adoption within 60 days
- Reduced time-to-renewal by 20%
- Improved customer health scores

### Persona 2: Startup/Scale-Up
**Characteristics:**
- 2-10 CSMs
- Less formal processes
- Lightweight tools
- Need quick wins

**Onboarding Approach:**
- Fast-track setup (1 week)
- All users at once
- Standard integrations
- Self-service focused

**Success Criteria:**
- 90%+ adoption within 30 days
- Workflows standardized
- Clear visibility into renewals

---

## Customer-Specific Scenarios

### Scenario 1: Gainsight Migration
**Common Request:** "We're moving from Gainsight, help us migrate"

**Process:**
1. **Data Export**
   - Export customers, contacts, success plans
   - Export renewal data
   - Export health scores

2. **Mapping**
   - Map Gainsight fields to Renubu schema
   - Identify custom fields needed
   - Plan data transformation

3. **Import**
   - Use Renubu CSV import
   - Validate data after import
   - Set up users and permissions

4. **Training**
   - Highlight Renubu differences
   - Emphasize AI-powered features
   - Show workflow automation

**Timeline:** 2-3 weeks

### Scenario 2: Salesforce Integration
**Common Request:** "We use Salesforce, need tight integration"

**Process:**
1. **Integration Setup** (Phase 0.2+)
   - Configure Salesforce MCP server
   - Admin approves integration
   - Map Salesforce objects to Renubu

2. **Data Sync**
   - Define sync rules (Accounts, Opportunities, Contacts)
   - Set up bi-directional sync (if needed)
   - Test data flow

3. **Workflow Configuration**
   - Create workflows that update Salesforce
   - Set up automation (e.g., update ARR on renewal)

**Timeline:** 1 week after MCP available

### Scenario 3: Google Workspace Only
**Common Request:** "We only use Google (Gmail, Calendar, Drive)"

**Process:**
1. **OAuth Setup** (Phase 0.2)
   - Configure Google Calendar integration
   - Configure Gmail integration
   - Set up permissions

2. **Workflow Design**
   - Email-based workflows
   - Calendar-based reminders
   - Drive integration (Phase 2+)

**Timeline:** 1 week after Google integrations available

---

## Default Project Plans

### Plan A: Standard Onboarding (2-4 weeks)

**Week 1: Discovery & Setup**
- Kickoff call
- Technical setup
- Data migration (if needed)

**Week 2: Training**
- Admin training
- End-user training
- Workflow configuration

**Week 3: Pilot**
- Launch to pilot group (5-10 users)
- Daily monitoring
- Issue resolution

**Week 4: Rollout**
- Full user rollout
- Ongoing support
- Success metrics review

**Total Hours:** 20-30 hours (CSM time)

### Plan B: Fast-Track (1 week)

**For:** Small teams (<10 users), simple setup

**Day 1-2:**
- Kickoff + Technical setup + Training (all in one)
- Data import

**Day 3-4:**
- Pilot testing
- Issue resolution

**Day 5:**
- Full rollout
- Hand-off to ongoing support

**Total Hours:** 8-12 hours (CSM time)

### Plan C: Enterprise (4-8 weeks)

**For:** Large teams (50+ users), complex integrations

**Weeks 1-2: Discovery & Design**
- Detailed discovery sessions
- Process mapping
- Custom integration planning
- Executive alignment

**Weeks 3-4: Setup & Configuration**
- Technical setup
- Data migration
- Custom workflow design
- Integration development

**Weeks 5-6: Pilot**
- Pilot group 1 (region A)
- Pilot group 2 (region B)
- Feedback and iteration

**Weeks 7-8: Rollout**
- Phased rollout by region/team
- Change management
- Ongoing optimization

**Total Hours:** 60-100 hours (CSM time)

---

## Best Practices

### Do's
- ✅ Set clear success criteria upfront
- ✅ Start with pilot group (not all users at once)
- ✅ Schedule regular check-ins (weekly in first month)
- ✅ Document customer-specific configurations
- ✅ Celebrate quick wins
- ✅ Collect feedback continuously

### Don'ts
- ❌ Over-customize too early (use standard workflows first)
- ❌ Skip training (leads to low adoption)
- ❌ Launch to all users without pilot
- ❌ Ignore data quality issues
- ❌ Promise features not yet built
- ❌ Lose momentum after kickoff

---

## Onboarding Metrics

### Adoption Metrics
- **User Login Rate:** % of users who log in within first week
- **Workflow Creation:** Average workflows created per user
- **Task Completion:** % of tasks marked complete
- **Feature Usage:** % using key features (snoozing, artifacts, etc.)

### Success Metrics
- **Time-to-Value:** Days until first workflow completed
- **Adoption Rate:** % of users active weekly
- **Customer Satisfaction:** NPS or CSAT score
- **Retention:** % of users still active after 90 days

### Business Impact
- **Time Saved:** Hours saved per CSM per week
- **Renewal Rate:** % improvement in renewals
- **Customer Health:** Improvement in health scores
- **Expansion:** Upsell/cross-sell opportunities identified

---

## Escalation Process

### When to Escalate

**Technical Issues:**
- Integration not working
- Data migration failures
- Performance problems
- Security concerns

**Process:**
- Contact: engineering@renubu.com
- Response Time: 4 business hours
- Resolution Time: 1-2 business days

**Product Issues:**
- Feature requests
- Workflow design questions
- Configuration challenges

**Process:**
- Contact: product@renubu.com
- Response Time: 1 business day
- Review: Weekly product meeting

**Executive Issues:**
- Customer at risk of churn
- Strategic alignment needed
- Contract/pricing concerns

**Process:**
- Contact: justin@renubu.com
- Response Time: Same day
- Resolution: As needed

---

## Templates & Resources

### Kickoff Deck Template
- Location: `docs/templates/onboarding-kickoff.pptx` (TODO)
- Includes: Agenda, timeline, success criteria, Q&A

### Training Materials
- Admin Guide: `docs/guides/admin-guide.pdf` (TODO)
- User Guide: `docs/guides/user-guide.pdf` (TODO)
- Video Tutorials: `https://help.renubu.com/videos` (Phase 1+)

### Data Import Templates
- Customer CSV: `docs/templates/customers-import.csv` (TODO)
- Contacts CSV: `docs/templates/contacts-import.csv` (TODO)

---

## Related Documentation

- [CUSTOMERS.md](./CUSTOMERS.md) - Customer-specific documentation
- [WORKFLOWS.md](./WORKFLOWS.md) - Workflow catalog
- [API.md](./API.md) - Integration documentation

---

**Note:** This is a living document. Update as onboarding process evolves with customer feedback.
