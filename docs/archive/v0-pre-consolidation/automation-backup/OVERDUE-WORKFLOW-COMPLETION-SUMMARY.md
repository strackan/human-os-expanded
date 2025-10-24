# OVERDUE RENEWAL WORKFLOW - COMPLETION SUMMARY

**Date:** 2025-10-08
**Workflow:** Overdue Renewal / Churn (10-Overdue.ts)
**Timeline:** ≤-1 days (renewal date has passed, no renewal)
**Status:** ✅ Complete

---

## OVERVIEW

The Overdue Renewal Workflow handles post-churn processing when a customer has not renewed their contract and the renewal date has passed. This workflow focuses on professional offboarding, maintaining positive relationships, and creating win-back strategies for potential future re-engagement.

**File Location:** `renewal-configs/10-Overdue.ts`
**Lines of Code:** ~1,400
**Processor Files Referenced:** 4 new processors

---

## WORKFLOW STRUCTURE

### Trigger Conditions

**Primary Trigger:**
- Days until renewal: ≤-1 (renewal date has passed)

**Early Triggers:**
- Customer explicitly confirms non-renewal during Emergency workflow
- CSM manually marks customer as "churned"

### Workflow Steps

**Total Steps:** 4 (5 including routing step)

1. **Churn Assessment** (Step 0) - Conditional Routing
2. **Last-Minute Save Attempt** (Step 1) - Conditional Action
3. **Offboarding Execution** (Step 2) - Action
4. **Win-Back Strategy** (Step 3) - Analysis
5. **Action Plan** (Step 4) - Shared step with Overdue context

---

## DETAILED STEP BREAKDOWN

### STEP 0: CHURN ASSESSMENT

**Type:** Conditional Routing
**Purpose:** Understand why customer churned and determine if last-minute save still possible

**7 Primary Churn Reasons:**

1. **Budget Cuts / Cost**
   - Customer said "too expensive" or "budget cuts"
   - Company had layoffs or financial constraints
   - ROI didn't justify cost

2. **Competitive Loss**
   - Switched to competitor
   - Better features, lower price, better service

3. **Product Dissatisfaction**
   - Product didn't meet expectations
   - Missing features, bugs, performance issues

4. **Lack of Usage / Value**
   - Low product adoption
   - User engagement dropped
   - Value not realized

5. **No Response / Ghosting**
   - Never responded to renewal outreach
   - Unable to make contact

6. **Company Shutdown / Acquisition**
   - Went out of business
   - Acquired and consolidating vendors

7. **Other**
   - Unique circumstances

**Churn Category Classification:**

- **Controllable:** We could have prevented with different actions
- **Partially Controllable:** Some factors we could have influenced
- **Uncontrollable:** External factors beyond our control (shutdown, macro economics)

**Last-Minute Save Assessment:**

Three routing options:

1. **LAST_MINUTE_SAVE** ⏰
   - Contract passed but customer responsive
   - Open to conversation
   - Worth one final attempt

2. **SOFT_CHURN_GRACE** 🕐
   - In grace period, still using product
   - May renew if given a few more days
   - Could offer short-term extension

3. **HARD_CHURN_ACCEPT** ❌
   - Explicitly declined
   - Already switched to competitor
   - No realistic chance of reversal

**Historical Context:**

- Years as customer
- Lifetime revenue
- Last NPS/CSAT score
- Previous renewals count
- Previous churn threats
- Relationship quality assessment

**UI Features:**
- Churn summary panel (days overdue, lost ARR, years as customer, lifetime revenue)
- Primary churn reason alert (color-coded by churn category)
- Next steps assessment panel (routing decision + save probability)

**Database:**
- Table: `churn_assessments`
- Fields: customer_id, assessment_date, days_overdue, lost_arr, primary_churn_reason, churn_category, supporting_details, routing_decision, save_probability, historical_context (years_as_customer, lifetime_revenue, relationship_quality)

**Processor:** `analyzers/churnAssessmentAnalyzer.js`

---

### STEP 1: LAST-MINUTE SAVE ATTEMPT (Conditional)

**Type:** Conditional Action
**Purpose:** One final attempt to reverse churn if assessment indicates it's possible
**Condition:** Only runs if routing = LAST_MINUTE_SAVE or SOFT_CHURN_GRACE

**Save Strategy by Churn Reason:**

#### Budget Cuts / Cost

**Approach:** Emergency Discount or Reduced Scope

**Offers:**
- Aggressive discount (30-40% off, CEO approval)
- Reduced scope (fewer seats, downgrade tier, 50% reduction)
- Extended payment terms (quarterly, monthly, Net-90, split payments)
- Grace period (30 days free, then reduced rate)

**Script Template:**
> "I understand budget is tight. We value our relationship with {{customer.name}}. What if we could reduce your cost by [X]% with [reduced scope/payment plan]? This keeps you as a customer, and when budget improves, we can scale back up. Can we make this work?"

#### Competitive Loss

**Approach:** Win-Back Differentiation

**Offers:**
- Feature comparison (show what competitor doesn't have)
- Service advantage (CSM support, expertise)
- Price match (if feasible)
- Switching costs reminder (migration effort, learning curve)
- Roadmap commitment (features coming soon)

**Script Template:**
> "I understand you're considering [Competitor]. Before you make the final switch, can we have a 30-minute call to show you [X features we have that they don't]? We'd also like to understand what they're offering that we're not. If you still prefer them, we'll respect that. Fair?"

#### Product Dissatisfaction

**Approach:** Product Improvement Commitment

**Offers:**
- Product roadmap commitment (specific features by dates)
- Beta access to new features
- Custom development (enterprise customers)
- Service improvement (dedicated CSM, weekly check-ins)
- Discount for patience (20-30% off while building features)

**Script Template:**
> "I hear that the product hasn't met your expectations around [features]. Our product team is committed to building [specific features] by [date]. What if we offered you [discount]% off for the next 6 months while we build these, plus beta access? If we don't deliver, you can cancel anytime. Worth giving us another shot?"

#### Lack of Usage / Value

**Approach:** Reboot Value Realization

**Offers:**
- Onboarding reboot (dedicated CSM, implementation support)
- Value realization plan (90-day plan to drive adoption, demonstrate ROI)
- Executive alignment (executive sponsor oversight)
- Usage-based pricing (pay only for what you use)
- Extended trial (60 days free to realize value)

**Script Template:**
> "I know adoption has been lower than we both hoped. That's on us. What if we gave you 60 days free, plus dedicated onboarding support, to reboot your usage? We'll create a value realization plan with measurable goals. If you don't hit those goals, you can walk away with no cost. Deal?"

#### No Response / Ghosting

**Approach:** Simple Re-Engagement

**Offers:**
- Direct ask ("Are you still interested in renewing?")
- Assume positive intent ("I'm assuming you've been busy")
- Offer extension ("30-day extension at no extra cost")
- Make it easy ("5-minute simple renewal agreement")

**Script Template:**
> "Hi [Name], I haven't heard from you and wanted to check in. Your renewal date was [date]. Are you still interested in continuing? If you need more time, I can send a 30-day extension agreement. Let me know - happy to make this easy."

**Execution Plan:**

- Action: [Specific offer/approach based on churn reason]
- Owner: [CSM, VP CS, CEO]
- Timeline: Contact customer TODAY, decision deadline max 3 days
- Offer Details: Discount, terms, conditions, expiration
- Approval Status: Required from [VP CS, CEO, etc.], requested/approved

**Decision Point:**

After outreach, customer responds:
1. **YES - Accept Offer:** Finalize renewal immediately
2. **MAYBE - Need Time:** Set firm deadline (max 3 days)
3. **NO - Decline:** Accept gracefully, move to offboarding

**UI Features:**
- Last-minute offer panel (offer type, discount, terms, expiration)
- Customer message draft (editable markdown)
- "Send Last-Minute Offer" button (confirmation modal)
- "Log Customer Response" button
  - Fields: Response type, Details, Next steps

**Database:**
- Table: `last_minute_save_attempts`
- Fields: customer_id, attempt_date, days_overdue, churn_reason, offer_type, offer_details, approval_required, approved_by, customer_outreach_method, customer_message, customer_response, outcome_status

**Processor:** `executors/lastMinuteSaveExecutor.js`

---

### STEP 2: OFFBOARDING EXECUTION

**Type:** Action
**Purpose:** Professional offboarding - data export, access deprovision, final billing

**7 Offboarding Task Categories:**

#### 1. Customer Communication

**Offboarding Kickoff Email Template:**

Subject: {{customer.name}} Account Offboarding - Next Steps

Key sections:
- **Your Data:** Complete export in preferred format, ready within 7 days, 90-day retention
- **Account Access:** Active for 30 days, then deprovisioned
- **Final Billing:** Final invoice with pro-rated amount
- **Questions:** CSM contact info, offer to help with transition
- **Thank You:** Appreciate their business, door open for future

**Send:** TODAY

#### 2. Data Export

**Data to Export:**
- User accounts and profiles
- Customer data and records
- Configuration settings
- Reports and analytics history
- Documents and files
- Integration settings and API keys
- Audit logs and activity history

**Export Format:** CSV, JSON, PDF, Database dump (customer preference)

**Timeline:**
- Prepare: 3 business days
- QA/verify: 1 business day
- Deliver: 5 business days total

**Delivery:** Secure download link (password protected), expires in 30 days, retain for 90 days

#### 3. Access Deprovision

**Timeline:**

**Immediate (Today):**
- Disable auto-renewals and billing
- Update Salesforce to "Closed Lost"
- Remove from active CSM portfolio
- Cancel scheduled renewals/invoices

**Grace Period (30 days):**
- Keep account active
- Allow read-only access (if possible)
- Customer can download data, view history

**After Grace Period:**
- Deprovision user accounts
- Disable login access
- Archive account data
- Remove API access
- Uninstall integrations

#### 4. Final Billing

**Calculate:**
- Pro-rated usage from last billing to churn date
- Outstanding invoices
- Credits/refunds owed
- **Total Final Charge**

**Actions:**
- Generate and send final invoice
- Process refunds if applicable (14 business days)
- Payment due: 30 days

#### 5. Internal Notifications

**Teams to Notify:**
- Finance (final billing, collections)
- Legal (contract closure)
- Product (churn reason, feature feedback)
- Security/IT (access deprovision)
- Sales (if enterprise/strategic)
- Executive Team (if >$100K ARR)

**Churn Notification Format:**
- Customer name, Lost ARR, Churn reason
- Competitor (if applicable)
- Offboarding date
- Action required (team-specific)

#### 6. Account Cleanup

**In Our Systems:**
- Update CRM to "Churned"
- Archive customer data (90-day retention)
- Remove from marketing emails (unless opt-in)
- Update health score to "Churned"
- Close open support tickets
- Cancel scheduled meetings/QBRs

**In Customer's Systems:**
- Provide uninstall documentation
- Instructions for removing integrations
- Offer migration support (be helpful, not bitter)

#### 7. Relationship Maintenance

**Stay Connected:**
- Send LinkedIn connection request
- Add to "Alumni" list (quarterly newsletter, product launches)
- Invite to industry events/webinars

**Exit Feedback Request (1 week after churn):**

> "Now that you've had a week to settle, I'd love to get your candid feedback. Understanding why customers leave helps us improve. Would you be willing to have a 15-minute call? If you prefer, I can send a quick survey instead."

**Offboarding Task Tracker:**

Table format with columns:
- Task, Owner, Due Date, Status, Notes

**UI Features:**
- Offboarding task checklist (grouped by category, checkable, shows owner and due date)
- Offboarding email draft (editable markdown, downloadable)
- Final billing summary panel (pro-rated usage, outstanding balance, credits, total)
- "Send Offboarding Email" button
- "Request Data Export" button
  - Fields: Export format, Data scope, Delivery email, Due date
- "Update Task Status" button

**Database:**
- Table: `offboarding_tasks`
- Fields: customer_id, task_type, task_description, owner, due_date, status (not_started | in_progress | complete), notes, completed_at

**Processor:** `executors/offboardingExecutor.js`

---

### STEP 3: WIN-BACK STRATEGY

**Type:** Analysis
**Purpose:** Create strategy for potential future re-engagement

**Win-Back Assessment Factors:**

1. **Churn Reason Reversibility**
   - Budget cuts: May improve (fiscal year reset, funding round)
   - Competitive: Competitor may disappoint, we may improve
   - Product gaps: We may build needed features
   - No usage: May have new use case
   - Company shutdown: Not reversible

2. **Relationship Quality**
   - Strong: High win-back probability
   - Moderate: Possible if we address concerns
   - Weak: Low win-back probability
   - Burned bridge: Not worth pursuing

3. **Strategic Value**
   - High ARR (>$50K): Dedicated win-back effort
   - Logo value: Strategic customer in key market
   - Expansion potential: Could grow significantly
   - Reference value: Strong case study

4. **Competitive Dynamics**
   - Switched to competitor: Track performance, reach out if they stumble
   - Lost on features: Build features, then re-engage
   - Lost on price: May have budget in future

**Win-Back Decision:** YES / NO / MAYBE

**Timing by Churn Reason:**

**Budget Cuts:**
- Re-engage at: Fiscal year reset (January or July)
- OR when signs of new funding
- Target: 6-12 months

**Competitive Loss:**
- Re-engage at: 6-12 months (honeymoon period over)
- OR when we build missing features
- OR when signs of dissatisfaction
- Target: 6-9 months

**Product Dissatisfaction:**
- Re-engage at: When we've built needed features
- Quarterly product update emails
- Target: When features delivered

**Lack of Usage:**
- Re-engage at: New use case (job change, company growth, new project)
- Monitor LinkedIn for signals
- Target: 12 months (let them miss us)

**Re-Engagement Message Framework:**

Template structure:
> "Hi [Name], It's been [X months] since {{customer.name}} churned. I wanted to reach out because [specific reason]:
>
> [Reason-specific pitch: Budget improved, competitor issues, new features built, new use case]
>
> No pressure - just wanted to reach out. If you're open to a 15-minute call, I'd love to catch up."

**Sweetener Offers:**

- Win-back discount (20-30% off first year)
- Waive onboarding fee (free re-onboarding)
- Free trial period (30-60 days)
- Upgrade offer (same price, better tier)
- Customer success package (dedicated CSM, priority support)
- Early access (beta features)

**Monitoring & Signals:**

**Company Signals:**
- Funding announcements
- Hiring spree
- New leadership
- Expansion to new markets
- Press mentions of problems we solve

**Individual Signals:**
- Contact leaves competitor (unhappy?)
- Contact gets promoted (more budget)
- Contact changes companies (may bring us)
- LinkedIn posts about challenges we solve

**Competitive Signals:**
- Competitor outage/issues
- Competitor raises prices
- Competitor bad reviews
- Competitor acquired

**Product Signals:**
- We launch requested features
- We win awards in their industry
- We sign their competitor as customer

**Win-Back Campaign Structure:**

**Month 1-3 (Stay Connected):**
- Alumni newsletter (quarterly updates)
- LinkedIn connection and engagement
- Invite to webinars/events

**Month 4-6 (Soft Signals):**
- Send relevant content (case studies, whitepapers)
- Product launch announcements
- Check-in email: "How's everything?"

**Month 7-12 (Active Re-Engagement):**
- Direct win-back outreach (email + phone)
- Offer incentive (discount, free trial)
- Demo new features
- Executive involvement if high-value

**Post-12 Months:**
- Annual check-in
- Monitor for signals
- Maintain low-intensity relationship

**Win-Back Success Metrics:**

- **Win-Back Rate:** % churned customers who return within 12 months (target: 10-15%)
- **Win-Back Time:** Average time from churn to return
- **Win-Back ARR:** Total ARR recovered
- **Win-Back ROI:** (Win-back ARR - Campaign Cost) / Campaign Cost

**UI Features:**
- Win-back assessment alert (YES/MAYBE/NO with reasoning)
- Win-back campaign timeline (visible if YES/MAYBE)
- Re-engagement message template (editable markdown)
- "Create Win-Back Campaign" button
  - Fields: Re-engagement date, Campaign owner, Win-back offer, Monitoring enabled
- "Skip Win-Back" button (if NO)

**Database:**
- Table: `win_back_strategies`
- Fields: customer_id, churn_date, churn_reason, win_back_recommended, target_reengagement_date, reengagement_approach, sweetener_offer, monitoring_signals, campaign_touchpoints, win_back_outcome (pending | successful | unsuccessful)

**Processor:** `analyzers/winBackStrategyAnalyzer.js`

---

### STEP 4: ACTION PLAN

**Type:** Analysis (Shared ActionPlanStep with Overdue context)
**Purpose:** Comprehensive offboarding and win-back action plan

**Action Plan Focus:**

**Immediate (Next 7 days):**
- Send offboarding email
- Request data export preparation
- Notify internal teams
- Update Salesforce to "Closed Lost"

**Short-term (7-30 days):**
- Deliver data export
- Deprovision access after grace period
- Process final billing/refunds
- Request exit feedback
- Complete all offboarding tasks

**Long-term (30+ days):**
- If win-back recommended: Execute campaign per timeline, monitor signals, re-engage at target date
- If not: Archive account after 90 days, remove from active monitoring

**Post-Mortem:**
- Schedule within 2 weeks
- Document lessons learned
- Create action items for process improvement

**Next Steps:**
- Close Overdue workflow after offboarding complete
- Move to "Churned" status in CRM
- Add to win-back monitoring list (if applicable)

---

## KEY INNOVATIONS

### 1. Churn Reason Classification System

**7 primary reasons + Controllability assessment:**
- Helps identify if churn was preventable
- Informs process improvement efforts
- Guides win-back strategy timing and approach

**Benefits:**
- Clear categorization for analysis
- Identify trends (e.g., "Most churns due to budget cuts in Q4")
- Targeted win-back strategies by churn type

### 2. Last-Minute Save with Churn-Specific Offers

**Tailored offers for each churn reason:**
- Budget: Aggressive discounts, reduced scope, payment plans
- Competitive: Feature comparison, service advantage, roadmap
- Product: Improvement commitment, beta access, discounts
- Usage: Onboarding reboot, value realization plan, extended trial
- Ghosting: Simple re-engagement, extensions

**Benefits:**
- Addresses root cause of churn
- Higher save rate than generic offers
- Shows we understand their situation

### 3. Professional Offboarding Process

**7-category comprehensive checklist:**
- Customer communication, Data export, Access deprovision
- Final billing, Internal notifications, Account cleanup
- Relationship maintenance

**Philosophy:** "Handle exits better than onboarding"

**Benefits:**
- Maintains relationship for future business
- Reduces negative word-of-mouth
- Professional brand reputation
- Customers may return or refer others

### 4. Data Export as Churn Mitigation

**Complete data export within 7 days:**
- Shows respect for customer data
- Reduces switching friction (ironically makes them less defensive)
- Demonstrates trustworthiness

**Benefits:**
- Some customers return because data export was so easy
- Positive last impression
- Compliance with data ownership regulations

### 5. Win-Back Campaign System

**Structured re-engagement over 12 months:**
- Month 1-3: Stay connected (low touch)
- Month 4-6: Soft signals (content, updates)
- Month 7-12: Active re-engagement (direct outreach, offers)

**Signal Monitoring:**
- Company signals (funding, hiring, leadership)
- Individual signals (job changes, promotions)
- Competitive signals (competitor issues)
- Product signals (feature launches)

**Benefits:**
- Stays top of mind without being pushy
- Catches customers at right time (when circumstances change)
- 10-15% win-back rate is significant ARR recovery

### 6. Alumni Relationship Maintenance

**"Alumni" list approach:**
- Quarterly newsletters
- Product launch invitations
- Industry event invitations
- LinkedIn connections

**Philosophy:** "Once a customer, always part of the family"

**Benefits:**
- Many customers return when circumstances change
- Alumni become advocates and referral sources
- Shows confidence in product (we want them to see improvements)

### 7. Exit Feedback Collection

**Two-stage feedback approach:**
1. Immediate: As part of offboarding (Why did you leave?)
2. Delayed: 1 week later (Now that you've settled, how do you feel?)

**Benefits:**
- Delayed feedback often more honest and reflective
- Provides product improvement insights
- Shows we genuinely want to learn and improve
- Demonstrates maturity (not defensive)

---

## TECHNICAL IMPLEMENTATION NOTES

### Database Schema

**New Tables:**

```sql
-- Churn assessments
CREATE TABLE churn_assessments (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  assessment_date TIMESTAMP,
  days_overdue INTEGER,
  lost_arr DECIMAL(12, 2),

  primary_churn_reason VARCHAR(100),
  churn_category VARCHAR(50), -- 'controllable' | 'partially_controllable' | 'uncontrollable'
  supporting_details TEXT,

  routing_decision VARCHAR(50), -- 'LAST_MINUTE_SAVE' | 'SOFT_CHURN_GRACE' | 'HARD_CHURN_ACCEPT'
  save_probability VARCHAR(50), -- 'High' | 'Medium' | 'Low' | 'None'

  historical_context JSONB, -- {years_as_customer, lifetime_revenue, relationship_quality}

  created_at TIMESTAMP DEFAULT NOW()
);

-- Last-minute save attempts
CREATE TABLE last_minute_save_attempts (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  attempt_date TIMESTAMP,
  days_overdue INTEGER,
  churn_reason VARCHAR(100),

  offer_type VARCHAR(100),
  offer_details JSONB,
  approval_required BOOLEAN,
  approved_by VARCHAR(255),

  customer_outreach_method VARCHAR(50),
  customer_message TEXT,
  customer_response TEXT,
  outcome_status VARCHAR(50), -- 'sent' | 'accepted' | 'declined' | 'no_response'

  created_at TIMESTAMP DEFAULT NOW()
);

-- Offboarding tasks
CREATE TABLE offboarding_tasks (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),

  task_type VARCHAR(100), -- 'customer_communication' | 'data_export' | 'access_deprovision' | etc.
  task_description TEXT,
  owner VARCHAR(255),
  due_date DATE,
  status VARCHAR(50), -- 'not_started' | 'in_progress' | 'complete'
  notes TEXT,
  completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer feedback
CREATE TABLE customer_feedback (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  feedback_date TIMESTAMP,

  feedback_type VARCHAR(50), -- 'exit_interview' | 'survey' | 'email_response'
  feedback_source VARCHAR(50), -- 'call' | 'email' | 'survey'
  feedback_text TEXT,

  satisfaction_score INTEGER, -- 1-10
  likelihood_to_return INTEGER, -- 1-10
  likelihood_to_recommend INTEGER, -- NPS score

  created_at TIMESTAMP DEFAULT NOW()
);

-- Win-back strategies
CREATE TABLE win_back_strategies (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  churn_date DATE,
  churn_reason VARCHAR(100),

  win_back_recommended VARCHAR(10), -- 'YES' | 'NO' | 'MAYBE'
  target_reengagement_date DATE,
  reengagement_approach TEXT,
  sweetener_offer VARCHAR(100),

  monitoring_signals JSONB, -- Array of signals to watch for
  campaign_touchpoints JSONB, -- Structured campaign timeline

  campaign_status VARCHAR(50), -- 'pending' | 'active' | 'paused' | 'completed'
  win_back_outcome VARCHAR(50), -- 'pending' | 'successful' | 'unsuccessful'
  outcome_date TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);
```

### Processor Files

**New Processor Files Needed:**

1. **analyzers/churnAssessmentAnalyzer.js**
   - Analyzes churn reason from customer history
   - Classifies controllability (controllable/partially/uncontrollable)
   - Assesses save probability
   - Routes to appropriate next step

2. **executors/lastMinuteSaveExecutor.js**
   - Generates churn-reason-specific save offers
   - Creates customer outreach message
   - Tracks offer acceptance/decline
   - Handles approval workflows

3. **executors/offboardingExecutor.js**
   - Generates comprehensive offboarding task checklist
   - Assigns owners and due dates
   - Drafts customer communication
   - Calculates final billing
   - Coordinates with internal teams

4. **analyzers/winBackStrategyAnalyzer.js**
   - Assesses win-back viability
   - Determines optimal re-engagement timing
   - Creates campaign touchpoint schedule
   - Identifies monitoring signals
   - Generates re-engagement messaging

### API Endpoints

**New Endpoints:**

```typescript
// Last-minute save
POST /api/churns/send-last-minute-offer
  - Sends final save attempt offer to customer
  - Parameters: customer_id, offer_type, offer_details, customer_message

POST /api/churns/log-save-attempt-response
  - Logs customer response to save attempt
  - Parameters: customer_id, response_type, response_details, next_steps

// Offboarding
POST /api/offboarding/send-email
  - Sends offboarding kickoff email to customer
  - Parameters: customer_id, email_content

POST /api/offboarding/request-data-export
  - Requests data export from data team
  - Parameters: customer_id, export_format, export_scope, delivery_email, due_date

POST /api/offboarding/update-task
  - Updates offboarding task status
  - Parameters: customer_id, task_id, status, notes

// Win-back
POST /api/win-back/create-campaign
  - Creates automated win-back campaign
  - Parameters: customer_id, reengagement_date, campaign_owner, sweetener_offer, monitoring_enabled, campaign_touchpoints

POST /api/win-back/skip
  - Marks customer as not suitable for win-back
  - Parameters: customer_id, reason
```

### Integration Points

**Email Integration:**
- Offboarding email templates
- Alumni newsletter subscription
- Exit feedback request emails

**Data Export Integration:**
- Automated data extraction from product database
- Secure file transfer (password-protected links)
- Format conversion (CSV, JSON, PDF)

**Calendar Integration:**
- Win-back campaign scheduling
- Exit interview/feedback call scheduling

**CRM Integration (Salesforce):**
- Update opportunity to "Closed Lost"
- Log churn reason and details
- Create win-back opportunity (if applicable)

**Marketing Automation:**
- Add to alumni list
- Trigger win-back campaign workflows
- Monitor engagement signals

---

## USER EXPERIENCE

### CSM Perspective

**When Overdue workflow triggers (renewal date passed):**

1. CSM sees churn assessment with reason classification
2. AI determines if last-minute save is possible
3. If yes: CSM executes tailored save offer
4. If no or save fails: CSM executes professional offboarding checklist
5. Data export requested and delivered within 7 days
6. Exit feedback collected
7. Win-back strategy created (if recommended)
8. CSM maintains relationship through alumni program

**Benefits for CSM:**
- Clear offboarding process (not left guessing)
- Professional relationship maintained (not burned bridges)
- Win-back campaigns automated
- Learning from churn for future improvement

### Customer Perspective

**What customer experiences:**

1. Professional offboarding email (not guilt trips or pleas)
2. Easy data export (all their data within 7 days)
3. Clear timeline (when access ends, when billing stops)
4. Graceful exit (we thank them and wish them well)
5. Exit feedback request (we want to learn and improve)
6. Staying connected (alumni newsletter, events, LinkedIn)
7. Re-engagement in future (when timing is right, not pushy)

**Benefits for Customer:**
- Feel respected (their decision accepted)
- Easy transition (data export, clear timeline)
- Professional relationship maintained (may return or refer)
- Positive last impression (remember us fondly)

### Executive Perspective

**When notified of churn:**

1. Receives churn notification with reason and details
2. Reviews if churn was controllable or uncontrollable
3. Participates in post-mortem (if high-value customer)
4. Reviews churn trends quarterly (identify systemic issues)
5. Approves win-back campaigns for strategic accounts

**Benefits for Executives:**
- Clear churn reason categorization (for analysis)
- Learning opportunities (post-mortems, process improvement)
- Win-back ROI visibility (recovered ARR from campaigns)

---

## SUCCESS METRICS

### Offboarding Completion Rate
- **Target:** 100% of churned customers receive professional offboarding
- **Measure:** Track offboarding task completion

### Data Export Timeliness
- **Target:** 100% of data exports delivered within 7 days
- **Measure:** Track request date to delivery date

### Exit Feedback Collection Rate
- **Target:** 50% of churned customers provide feedback
- **Measure:** Track feedback requests vs. responses

### Win-Back Rate
- **Target:** 10-15% of churned customers return within 12 months (industry average)
- **Measure:** Track churns vs. win-backs

### Win-Back ARR
- **Target:** Recover 5-10% of churned ARR through win-back campaigns
- **Measure:** Track total churned ARR vs. win-back ARR

### Alumni Engagement
- **Target:** 30% of churned customers stay subscribed to alumni newsletter
- **Measure:** Track alumni list size and engagement rates

### Relationship Quality Post-Churn
- **Target:** 70% of churned customers maintain positive relationship (LinkedIn connections, event attendance, referrals)
- **Measure:** Track LinkedIn connections, event RSVPs, referrals from churned customers

---

## INTEGRATION WITH OTHER WORKFLOWS

### From Emergency Workflow (9-Emergency.ts)
- **Early Trigger:** Customer confirms non-renewal during Emergency workflow
- **Handoff Data:** Churn reason, last contact date, final offers made

### To Win-Back Campaign System
- **Trigger:** Win-back strategy created with target re-engagement date
- **Handoff Data:** Churn reason, sweetener offer, campaign touchpoints, monitoring signals

### Closes Workflow Cycle
- Overdue is the final workflow in the 10-workflow cycle
- After offboarding complete, customer exits active CSM portfolio
- If win-back successful, customer re-enters at Monitor workflow (1-Monitor.ts)

---

## CONCLUSION

The Overdue Renewal Workflow handles post-churn processing with professionalism, grace, and forward-thinking win-back strategy. By executing comprehensive offboarding, maintaining positive relationships, and creating structured win-back campaigns, we maximize the possibility of future re-engagement while learning from every churn.

**Key Success Factors:**
1. **Professional Offboarding:** Handle exits better than onboarding
2. **Data Export:** Easy, complete, within 7 days
3. **Relationship Maintenance:** Alumni program keeps door open
4. **Win-Back Strategy:** Structured re-engagement at optimal timing
5. **Learning Culture:** Exit feedback and post-mortems drive improvement

**Workflow Series Complete:** All 10 renewal workflows now built:
1. Monitor → 2. Discovery → 3. Prepare → 4. Engage → 5. Negotiate → 6. Finalize → 7. Signature → 8. Critical → 9. Emergency → 10. Overdue

**Next Steps:** Processor implementation, API endpoints, database migrations, UI development, testing, and deployment.

---

**Workflow Status:** ✅ COMPLETE
**Workflow Series Status:** ✅ ALL 10 WORKFLOWS COMPLETE
**Date Completed:** 2025-10-08
