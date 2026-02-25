import { WorkflowConfig } from '../types/workflow';
import { ActionPlanStep } from './shared/ActionPlanStep';

/**
 * CRITICAL RENEWAL WORKFLOW
 *
 * Timeline: 7-14 days until renewal date
 *
 * Purpose:
 * High-urgency escalation workflow for renewals approaching deadline without completion.
 * Focuses on executive escalation, emergency resolution, and last-ditch save attempts.
 *
 * Triggers:
 * 1. Days-based: 7-14 days until renewal_date
 * 2. Early trigger: Signature workflow incomplete at Day 10
 * 3. Manual trigger: CSM marks renewal as "at risk - critical"
 *
 * Key Features:
 * - Conditional routing based on completion status
 * - Executive escalation (VP CS, CEO for large deals)
 * - Emergency approval fast-tracking
 * - Last-ditch negotiation options
 * - War room coordination for high-value renewals
 * - Alternative renewal structures (short-term extension, reduced scope, payment plans)
 *
 * Expected Outcomes:
 * - Signatures and payment secured before renewal date
 * - Executive visibility on at-risk renewals
 * - Alternative arrangements if full renewal not possible
 * - Documented escalation for post-mortem analysis
 *
 * Database Tables:
 * - critical_status_assessments
 * - executive_escalations
 * - emergency_resolutions
 * - alternative_renewal_options
 */

export const CriticalWorkflow: WorkflowConfig = {
  id: 'critical',
  name: 'Critical Renewal',
  description: 'High-urgency escalation and emergency resolution for renewals 7-14 days out',
  version: '1.0.0',

  trigger: {
    daysUntilRenewal: {
      min: 7,
      max: 14
    },
    earlyTriggers: [
      {
        condition: 'signature_workflow_incomplete_at_day_10',
        description: 'Signature workflow not complete with 10 days remaining'
      },
      {
        condition: 'renewal_marked_at_risk_critical',
        description: 'CSM manually marks renewal as critically at risk'
      }
    ]
  },

  context: {
    systemPrompt: `
You are an AI assistant helping Customer Success Managers handle CRITICAL RENEWAL SITUATIONS.

The renewal date is 7-14 days away. This is HIGH URGENCY.

Your role:
1. Assess exactly what's blocking completion (signatures, payment, negotiation breakdown)
2. Escalate to executives immediately with clear situation brief
3. Coordinate emergency resolution with fast-track approvals
4. Explore alternative arrangements if full renewal not possible
5. Create action plan with daily check-ins and executive oversight

CRITICAL GUIDELINES:
- Every day counts. Responses need same-day turnaround.
- Executive involvement is expected and necessary.
- Be direct and honest about risks (including churn possibility).
- Document everything for post-mortem analysis.
- For deals >$100K ARR, consider war room approach.
- If customer is ghosting, this is make-or-break time for creative outreach.

ESCALATION THRESHOLDS:
- 10-14 days: VP CS involvement, daily updates
- 7-9 days: Executive sponsor involvement, twice-daily updates
- <7 days: Transition to Emergency workflow (CEO involvement for large deals)

Remain professional, urgent, and solution-focused.
    `
  },

  steps: [
    /**
     * STEP 0: CRITICAL STATUS ASSESSMENT
     *
     * Conditional routing based on what's blocking renewal completion.
     * Determines the critical path forward.
     */
    {
      id: 'critical-status-assessment',
      name: 'Critical Status Assessment',
      type: 'conditional_routing',
      description: 'Assess renewal status and route to appropriate emergency response',

      execution: {
        llmPrompt: `
# CRITICAL STATUS ASSESSMENT

**CURRENT SITUATION:**
- Days until renewal: {{workflow.daysUntilRenewal}}
- Customer: {{customer.name}}
- ARR: {{customer.currentARR}}
- Renewal ARR: {{workflow.renewalARR}}

---

## ASSESSMENT CHECKLIST

Check the status of each critical component:

**1. SIGNATURES**
- [ ] DocuSign sent?
- [ ] Customer signed?
- [ ] Vendor counter-signed?
- [ ] Contract fully executed?

**2. PAYMENT**
- [ ] Invoice sent?
- [ ] Payment received/scheduled?
- [ ] PO received (if applicable)?

**3. SALESFORCE**
- [ ] Opportunity stage = "Closed Won"?
- [ ] Contract end date updated?
- [ ] Renewal opportunity created for next year?

**4. NEGOTIATION STATUS**
- [ ] Price agreed upon?
- [ ] Terms finalized?
- [ ] Any pending approvals?

---

## ROUTING LOGIC

Analyze the checklist above and route to the appropriate response:

### Route: ALL_COMPLETE ✅
**Condition:** All signatures complete, payment received, Salesforce updated
**Action:** Skip to post-renewal confirmation (this is rare at this stage but possible)

### Route: SIGNATURE_PENDING 📝
**Condition:** Contract ready, sent, but not signed by customer or vendor
**Priority:** HIGH
**Action:** Emergency signature push with executive follow-up

### Route: PAYMENT_PENDING 💳
**Condition:** Signatures complete but payment not received
**Priority:** HIGH
**Action:** Emergency payment collection (may need finance team escalation)

### Route: NEGOTIATION_BREAKDOWN 💔
**Condition:** Customer hasn't agreed to price/terms, negotiation stalled
**Priority:** CRITICAL
**Action:** Last-ditch negotiation with executive involvement

### Route: CUSTOMER_GHOSTING 👻
**Condition:** No response from customer for 7+ days, unclear status
**Priority:** CRITICAL
**Action:** Emergency outreach campaign (multi-channel, executive-to-executive)

### Route: AT_RISK_CHURN ⚠️
**Condition:** Customer explicitly considering not renewing or competitive eval in late stage
**Priority:** CRITICAL
**Action:** Executive save attempt with alternative options

---

## YOUR ROUTING DECISION

Based on the assessment above, select the PRIMARY route:

**Route:** [Select one of the 6 routes above]

**Reasoning:** [2-3 sentences explaining why this route was selected]

**Secondary Concerns:** [List any other blockers that need attention]

---

**Database Storage:**
- Table: critical_status_assessments
- Fields: customer_id, assessment_date, days_until_renewal, signatures_status, payment_status, negotiation_status, salesforce_status, primary_blocker, route_selected, reasoning, secondary_concerns
        `,
        processor: 'routers/criticalStatusRouter.js',
        storeIn: 'critical_assessment'
      },

      routing: {
        routes: [
          {
            id: 'ALL_COMPLETE',
            nextStepId: 'completion-confirmation',
            condition: 'All signatures, payment, and Salesforce updates complete'
          },
          {
            id: 'SIGNATURE_PENDING',
            nextStepId: 'executive-escalation',
            condition: 'Waiting on signatures from customer or vendor'
          },
          {
            id: 'PAYMENT_PENDING',
            nextStepId: 'executive-escalation',
            condition: 'Signatures complete but payment not received'
          },
          {
            id: 'NEGOTIATION_BREAKDOWN',
            nextStepId: 'executive-escalation',
            condition: 'Price/terms not agreed, negotiation stalled'
          },
          {
            id: 'CUSTOMER_GHOSTING',
            nextStepId: 'executive-escalation',
            condition: 'No customer response for 7+ days'
          },
          {
            id: 'AT_RISK_CHURN',
            nextStepId: 'executive-escalation',
            condition: 'Customer considering not renewing or competitive threat'
          }
        ],
        defaultRoute: 'executive-escalation'
      },

      ui: {
        cardTitle: '🚨 Critical Status Assessment',
        cardDescription: 'Analyzing renewal status and determining emergency response path',

        artifacts: [
          {
            id: 'status-dashboard',
            type: 'dashboard',
            title: 'Critical Status Dashboard',

            config: {
              autoRefresh: true,
              refreshInterval: 3600, // Every hour

              sections: [
                {
                  id: 'countdown',
                  type: 'countdown',
                  title: 'Days Until Renewal',
                  content: '{{workflow.daysUntilRenewal}}',
                  style: {
                    size: 'large',
                    color: '{{workflow.daysUntilRenewal <= 7 ? "red" : "orange"}}'
                  }
                },
                {
                  id: 'completion-checklist',
                  type: 'checklist',
                  title: 'Critical Completion Items',
                  items: [
                    {
                      id: 'signatures',
                      label: 'Contract Signatures',
                      status: '{{outputs.signatures_status}}',
                      icon: '{{outputs.signatures_status == "complete" ? "✅" : "⏳"}}'
                    },
                    {
                      id: 'payment',
                      label: 'Payment Received',
                      status: '{{outputs.payment_status}}',
                      icon: '{{outputs.payment_status == "complete" ? "✅" : "⏳"}}'
                    },
                    {
                      id: 'salesforce',
                      label: 'Salesforce Updated',
                      status: '{{outputs.salesforce_status}}',
                      icon: '{{outputs.salesforce_status == "complete" ? "✅" : "⏳"}}'
                    }
                  ]
                },
                {
                  id: 'primary-blocker',
                  type: 'alert',
                  title: 'Primary Blocker',
                  content: '{{outputs.primary_blocker}}',
                  severity: 'critical'
                },
                {
                  id: 'route-selected',
                  type: 'info_panel',
                  title: 'Emergency Response Path',
                  content: '{{outputs.route_selected}}: {{outputs.reasoning}}'
                }
              ]
            }
          }
        ]
      }
    },

    /**
     * STEP 1: EXECUTIVE ESCALATION
     *
     * Brief executives on the critical situation and request direct involvement.
     * For large deals (>$100K ARR), may involve CEO or board-level contacts.
     */
    {
      id: 'executive-escalation',
      name: 'Executive Escalation',
      type: 'analysis',
      description: 'Escalate to executive team with situation brief and request for direct involvement',

      execution: {
        llmPrompt: `
# EXECUTIVE ESCALATION

**CRITICAL RENEWAL ALERT**

---

## SITUATION BRIEF

**Customer:** {{customer.name}}
**ARR at Risk:** {{workflow.renewalARR}}
**Days Until Renewal:** {{workflow.daysUntilRenewal}}
**Primary Blocker:** {{critical_assessment.primary_blocker}}
**Route:** {{critical_assessment.route_selected}}

---

## ESCALATION PLAN

Create a concise executive brief (max 1 page) that answers:

### 1. WHAT'S HAPPENING?
[2-3 sentence summary of the situation]

### 2. WHY ARE WE AT RISK?
[Root cause analysis - what led to this critical state?]
- Timeline breakdown
- Missed opportunities
- Customer concerns
- Internal delays

### 3. WHAT'S AT STAKE?
- **ARR Impact:** {{workflow.renewalARR}}
- **Strategic Impact:** [Customer importance, logo value, market segment]
- **Churn Risk:** [High/Medium/Low with reasoning]

### 4. WHAT DO WE NEED FROM EXECUTIVES?

**For VP Customer Success:**
- [ ] Review and approve emergency discount (if needed)
- [ ] Daily check-in with CSM
- [ ] Remove internal blockers (legal, finance, etc.)

**For Executive Sponsor / CEO (if applicable):**
- [ ] Direct executive-to-executive outreach
- [ ] Personal call to customer's decision maker
- [ ] Approve alternative arrangements (payment plans, reduced scope)

**For Finance/Legal:**
- [ ] Fast-track contract approvals (target: 24 hours)
- [ ] Flexible payment terms approval
- [ ] PO/billing accommodations

### 5. PROPOSED ACTION PLAN

Create a day-by-day action plan until renewal date:

**Day {{workflow.daysUntilRenewal}}** (Today):
- [ ] Executive escalation (this step)
- [ ] [Other actions based on primary blocker]

**Day {{workflow.daysUntilRenewal - 1}}:**
- [ ] [Specific actions]

[Continue for each remaining day]

**Day 0** (Renewal Date):
- [ ] Final decision: Renew, extend, or churn

### 6. ACCOUNT PLAN & STRATEGIC ACCOUNT DETECTION

{{#if customer.hasAccountPlan}}
**⭐ STRATEGIC ACCOUNT - Account Plan Active**

This customer has an active Account Plan. Enhanced escalation required.

**Account Plan Details:**
- Owner: {{customer.accountPlan.owner}}
- Account Team: {{customer.accountPlan.team}}
- Last Updated: {{customer.accountPlan.lastUpdated}}

**Enhanced Escalation Actions:**
- [ ] Notify entire Account Team (AE, CSM, SA, Executive Sponsor)
- [ ] Account Plan owner becomes co-pilot with CSM
- [ ] Update Account Plan with critical renewal status
- [ ] Lower war room threshold to >$50K ARR (not >$100K)
- [ ] Link to Account Plan: [View Account Plan](/account-plans/{{customer.id}})
{{/if}}

---

### 7. WAR ROOM RECOMMENDATION

{{#if customer.hasAccountPlan && workflow.renewalARR >= 50000}}
**RECOMMEND WAR ROOM** for this strategic account renewal.

**War Room Setup:**
- Daily 15-minute standups (9am)
- Attendees: CSM, VP CS, Executive Sponsor, Account Team, Product (if needed)
- Slack channel: #war-room-{{customer.slug}}
- Decision-making authority: VP CS
- Duration: Until renewal secured or lost
- **Account Plan Integration:** All war room notes added to Account Plan
{{else if workflow.renewalARR >= 100000}}
**RECOMMEND WAR ROOM** for this high-value renewal.

**War Room Setup:**
- Daily 15-minute standups (9am)
- Attendees: CSM, VP CS, Executive Sponsor, Product (if needed)
- Slack channel: #war-room-{{customer.slug}}
- Decision-making authority: VP CS
- Duration: Until renewal secured or lost
{{else}}
**Standard escalation** sufficient (no war room needed).
- Daily email updates to VP CS
- Twice-daily check-ins with CSM manager
{{/if}}

---

## EXECUTIVE NOTIFICATION

**To:**
- {{csm.manager}} (CSM Manager)
- {{company.vpCustomerSuccess}} (VP Customer Success)
{{#if customer.hasAccountPlan}}
- {{customer.accountPlan.team}} (Account Team - Strategic Account)
{{/if}}
{{#if workflow.renewalARR >= 100000}}
- {{customer.executiveSponsor}} (Executive Sponsor)
{{/if}}
{{#if workflow.renewalARR >= 250000}}
- {{company.ceo}} (CEO)
{{/if}}

**Subject:** 🚨 CRITICAL: {{customer.name}} Renewal at Risk ({{workflow.renewalARR}} ARR, {{workflow.daysUntilRenewal}} days)

**Body:**

[Paste situation brief from above]

**Immediate Action Required:**
[List specific actions needed from each executive]

**Response Requested By:** [TODAY + 4 hours]

---

**Database Storage:**
- Table: executive_escalations
- Fields: customer_id, escalation_date, days_until_renewal, arr_at_risk, primary_blocker, executives_notified, war_room_recommended, situation_brief, proposed_action_plan
        `,
        processor: 'analyzers/executiveEscalationAnalyzer.js',
        storeIn: 'executive_escalation'
      },

      ui: {
        cardTitle: '🚨 Executive Escalation',
        cardDescription: 'Briefing executive team and requesting direct involvement',

        artifacts: [
          {
            id: 'account-plan-badge',
            type: 'badge',
            content: '⭐ Strategic Account - Account Plan Active',
            visible: '{{customer.hasAccountPlan}}',
            link: '/account-plans/{{customer.id}}',
            style: 'prominent'
          },
          {
            id: 'executive-brief',
            type: 'markdown',
            title: 'Executive Situation Brief',
            content: '{{outputs.situation_brief}}',
            downloadable: true,
            fileName: 'executive-brief-{{customer.slug}}-{{workflow.currentDate}}.md'
          },
          {
            id: 'action-plan',
            type: 'timeline',
            title: 'Day-by-Day Action Plan',
            content: '{{outputs.proposed_action_plan}}'
          }
        ],

        actions: [
          {
            id: 'send-escalation-email',
            label: 'Send Escalation Email',
            type: 'primary',

            onExecute: {
              apiEndpoint: 'POST /api/escalations/notify',
              payload: {
                customer_id: '{{customer.id}}',
                escalation_type: 'critical_renewal',
                recipients: '{{outputs.executives_notified}}',
                subject: '🚨 CRITICAL: {{customer.name}} Renewal at Risk ({{workflow.renewalARR}} ARR, {{workflow.daysUntilRenewal}} days)',
                body: '{{outputs.situation_brief}}',
                priority: 'urgent'
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: 'Executive escalation sent. Response requested within 4 hours.'
                }
              }
            }
          },
          {
            id: 'create-war-room',
            label: 'Create War Room',
            type: 'secondary',
            visible: '{{outputs.war_room_recommended == true}}',

            onExecute: {
              apiEndpoint: 'POST /api/war-rooms/create',
              payload: {
                customer_id: '{{customer.id}}',
                renewal_date: '{{customer.renewalDate}}',
                arr_at_risk: '{{workflow.renewalARR}}',
                attendees: ['{{csm.email}}', '{{csm.manager}}', '{{company.vpCustomerSuccess}}'],
                slack_channel: '#war-room-{{customer.slug}}',
                standup_time: '09:00',
                standup_frequency: 'daily'
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: 'War room created. Slack channel: #war-room-{{customer.slug}}'
                },
                // Send notification to all team members
                sendNotification: {
                  type: 'workflow_started',
                  title: 'War Room Activated',
                  message: 'War room created for {{customer.name}} (${{customer.arr}}) renewal. Daily standups begin tomorrow at 9am. Slack: #war-room-{{customer.slug}}',
                  priority: 1,
                  recipients: [
                    '{{csm.email}}',
                    '{{csm.manager}}',
                    '{{company.vpCustomerSuccess}}',
                    '{{#if customer.hasAccountPlan}}{{accountTeam.allEmails}}{{/if}}'
                  ],
                  metadata: {
                    customerId: '{{customer.id}}',
                    warRoomCreatedAt: '{{workflow.currentTimestamp}}',
                    warRoomType: 'critical',
                    dailyStandupTime: '9am',
                    slackChannel: 'war-room-{{customer.slug}}'
                  }
                }
              }
            }
          },
          {
            id: 'schedule-executive-call',
            label: 'Schedule Executive Call with Customer',
            type: 'secondary',

            onExecute: {
              openModal: {
                type: 'calendar_scheduling',
                config: {
                  attendees: {
                    required: ['{{customer.primaryContact.email}}', '{{customer.executiveSponsor.email}}'],
                    optional: ['{{csm.email}}']
                  },
                  duration: 30,
                  urgency: 'high',
                  subject: '{{customer.name}} Renewal Discussion',
                  suggestedTimes: 'next_24_hours'
                }
              }
            }
          },
          {
            id: 'create-team-slack-channel',
            label: 'Create Team Slack Channel',
            type: 'secondary',

            onExecute: {
              apiEndpoint: 'POST /api/collaboration/create-slack-channel',
              payload: {
                customer_id: '{{customer.id}}',
                channel_name: 'critical-{{customer.slug}}',
                members: ['{{csm.email}}', '{{csm.manager}}', '{{company.vpCustomerSuccess}}', '{{#if customer.hasAccountPlan}}{{customer.accountPlan.team}}{{/if}}'],
                purpose: 'Critical renewal coordination for {{customer.name}}'
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: 'Team Slack channel created: #critical-{{customer.slug}}'
                },
                // Send notification to team members
                sendNotification: {
                  type: 'workflow_started',
                  title: 'Team Slack Channel Created',
                  message: 'Slack channel #critical-{{customer.slug}} created for {{customer.name}} renewal. All team members have been added.',
                  priority: 3,
                  recipients: [
                    '{{csm.email}}',
                    '{{csm.manager}}',
                    '{{company.vpCustomerSuccess}}'
                  ],
                  metadata: {
                    customerId: '{{customer.id}}',
                    slackChannel: 'critical-{{customer.slug}}',
                    channelCreatedAt: '{{workflow.currentTimestamp}}'
                  }
                }
              }
            }
          },
          {
            id: 'notify-account-team',
            label: 'Notify Account Team',
            type: 'secondary',
            visible: '{{customer.hasAccountPlan}}',

            onExecute: {
              apiEndpoint: 'POST /api/team-escalations/notify',
              payload: {
                customer_id: '{{customer.id}}',
                escalation_level: 'critical',
                escalation_type: 'account_team',
                notification_targets: '{{customer.accountPlan.team}}',
                message: 'Strategic account {{customer.name}} has entered Critical renewal stage. Account team involvement required.'
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: 'Account team notified of critical renewal status'
                }
              }
            }
          }
        ]
      }
    },

    /**
     * STEP 2: EMERGENCY RESOLUTION
     *
     * Execute emergency actions based on primary blocker type.
     * Fast-track approvals, remove internal bottlenecks, and coordinate cross-functional response.
     */
    {
      id: 'emergency-resolution',
      name: 'Emergency Resolution',
      type: 'action',
      description: 'Execute emergency actions to resolve critical blockers',

      execution: {
        llmPrompt: `
# EMERGENCY RESOLUTION

Based on the primary blocker ({{critical_assessment.primary_blocker}}), execute emergency resolution actions.

---

## BLOCKER-SPECIFIC RESOLUTION PLANS

### IF PRIMARY BLOCKER = SIGNATURE_PENDING 📝

**Emergency Signature Push:**

1. **Customer Signature Delays**
   - Multi-channel outreach (email, phone, text, LinkedIn)
   - Executive-to-executive call (scheduled within 24 hours)
   - Offer to walk through DocuSign live on video call
   - Check if signatory changed (job change, promotion, etc.)
   - Alternative: Send physical copy for wet signature if DocuSign blocked

2. **Internal Signature Delays**
   - Fast-track legal review (4-hour SLA instead of 2 days)
   - VP CS approval to sign immediately
   - Escalate to legal team manager if needed

**Actions:**
- [ ] Multi-channel customer outreach (complete within 4 hours)
- [ ] Executive call scheduled (within 24 hours)
- [ ] Fast-track internal approvals (within 4 hours)
- [ ] Alternative signature method prepared (if needed)

---

### IF PRIMARY BLOCKER = PAYMENT_PENDING 💳

**Emergency Payment Collection:**

1. **PO Issues**
   - Contact customer's AP/procurement directly
   - Offer to submit invoice against verbal PO
   - VP CS approval for "invoice now, PO later" approach
   - Finance team escalation for flexibility

2. **Payment Method Issues**
   - Offer alternative: ACH instead of wire, credit card instead of PO
   - Split payment if needed (50% now, 50% in 30 days)
   - Finance approval for payment plan

3. **Budget Issues**
   - Reduced scope renewal (fewer seats, fewer features)
   - Quarterly payment instead of annual
   - Executive approval for discount

**Actions:**
- [ ] Direct AP/procurement contact (within 4 hours)
- [ ] Alternative payment method offered (within 8 hours)
- [ ] Finance team approval for flexibility (within 24 hours)
- [ ] Payment plan proposed (if needed)

---

### IF PRIMARY BLOCKER = NEGOTIATION_BREAKDOWN 💔

**Last-Ditch Negotiation:**

1. **Price Objection**
   - Emergency discount approval (up to 15% with VP CS, up to 20% with CEO)
   - Show ROI/value analysis (have product team create custom report)
   - Offer multi-year lock-in (3 years at reduced rate)
   - Reduced scope option (10-20% price reduction for fewer features)

2. **Terms Objection**
   - Fast-track legal for custom terms (24-hour turnaround)
   - Quarterly payment, month-to-month for 3 months, or other flexibility
   - Auto-renewal waiver for this year only

3. **Product/Feature Objection**
   - Product team creates feature roadmap commitment
   - Offer beta access to requested features
   - Executive sponsor commits to quarterly check-ins on product needs

**Actions:**
- [ ] Emergency discount approved (within 4 hours)
- [ ] Custom ROI report created (within 8 hours)
- [ ] Alternative terms proposed (within 8 hours)
- [ ] Product roadmap commitment prepared (within 24 hours)

---

### IF PRIMARY BLOCKER = CUSTOMER_GHOSTING 👻

**Emergency Outreach Campaign:**

1. **Multi-Channel Blitz**
   - Email (multiple times, different subject lines)
   - Phone (call desk phone, mobile if available)
   - Text/SMS (if mobile number available)
   - LinkedIn message
   - Physical mail (overnight FedEx with contract)

2. **Executive-to-Executive**
   - {{customer.executiveSponsor}} calls {{customer.primaryContact}}'s boss
   - CEO calls CEO (for large deals >$250K)
   - Board member reaches out (if applicable)

3. **Alternative Contacts**
   - Reach out to secondary contacts (IT, finance, other stakeholders)
   - Ask mutual connections for introduction/help
   - Check if primary contact still at company (LinkedIn, ZoomInfo)

**Actions:**
- [ ] Multi-channel outreach (email, phone, text, LinkedIn) - within 4 hours
- [ ] Executive-to-executive outreach scheduled - within 24 hours
- [ ] Alternative contacts identified and reached - within 8 hours
- [ ] Physical contract sent via overnight FedEx - within 24 hours

---

### IF PRIMARY BLOCKER = AT_RISK_CHURN ⚠️

**Executive Save Attempt:**

1. **Understand Why**
   - Emergency customer call: "What would it take to keep your business?"
   - Competitive intel: Who are they evaluating? What's the pitch?
   - Internal factors: Budget cuts? Changing priorities? Leadership change?

2. **Last-Ditch Offers**
   - Significant discount (15-25% off)
   - Reduced scope (keep them as customer, even smaller)
   - Pause/hibernation (3-month break, then resume at lower price)
   - Month-to-month bridge (give them time to evaluate, stay engaged)

3. **Executive Involvement**
   - Executive sponsor makes personal appeal
   - Product team presents roadmap aligned to customer needs
   - CEO calls CEO (for strategic/large customers)

**Actions:**
- [ ] Emergency discovery call: "What would it take?" - within 8 hours
- [ ] Competitive intelligence gathered - within 24 hours
- [ ] Last-ditch offer package prepared - within 24 hours
- [ ] Executive save call scheduled - within 48 hours

---

## RESOLUTION TRACKING

For each action above, track:

**Action:** [Description]
**Owner:** [Name]
**Deadline:** [Date/time]
**Status:** [Not started / In progress / Complete / Blocked]
**Outcome:** [Result, next steps]

---

## CROSS-FUNCTIONAL COORDINATION

**Legal Team:**
- Fast-track contract review (4-hour SLA)
- Approve custom terms if needed
- Contact: {{company.legalTeam.email}}

**Finance Team:**
- Approve payment flexibility (split payments, payment plans)
- Fast-track invoice generation
- Contact: {{company.financeTeam.email}}

**Product Team:**
- Create custom ROI/value analysis
- Provide feature roadmap commitments
- Contact: {{company.productTeam.email}}

**Executive Sponsors:**
- Make executive-to-executive outreach calls
- Approve emergency discounts
- Contact: {{customer.executiveSponsor.email}}

---

**Database Storage:**
- Table: emergency_resolutions
- Fields: customer_id, resolution_date, primary_blocker, resolution_plan, actions_taken, cross_functional_coordination, outcomes, next_steps
        `,
        processor: 'executors/emergencyResolutionExecutor.js',
        storeIn: 'emergency_resolution'
      },

      ui: {
        cardTitle: '⚡ Emergency Resolution',
        cardDescription: 'Executing emergency actions to resolve critical blockers',

        artifacts: [
          {
            id: 'resolution-plan',
            type: 'action_tracker',
            title: 'Emergency Resolution Actions',

            config: {
              groupBy: 'blocker_type',
              showDeadlines: true,
              showOwners: true,

              actions: '{{outputs.actions_taken}}',

              columns: [
                { id: 'action', label: 'Action', width: '40%' },
                { id: 'owner', label: 'Owner', width: '20%' },
                { id: 'deadline', label: 'Deadline', width: '15%' },
                { id: 'status', label: 'Status', width: '15%' },
                { id: 'outcome', label: 'Outcome', width: '10%' }
              ]
            }
          },
          {
            id: 'cross-functional-status',
            type: 'table',
            title: 'Cross-Functional Coordination',

            config: {
              data: '{{outputs.cross_functional_coordination}}',
              columns: [
                { id: 'team', label: 'Team', width: '20%' },
                { id: 'contact', label: 'Contact', width: '25%' },
                { id: 'request', label: 'Request', width: '35%' },
                { id: 'status', label: 'Status', width: '20%' }
              ]
            }
          }
        ],

        actions: [
          {
            id: 'log-action-update',
            label: 'Log Action Update',
            type: 'secondary',

            onExecute: {
              openModal: {
                type: 'form',
                config: {
                  title: 'Log Action Update',
                  fields: [
                    {
                      id: 'action',
                      type: 'select',
                      label: 'Action',
                      options: '{{outputs.actions_taken}}'
                    },
                    {
                      id: 'status',
                      type: 'select',
                      label: 'Status',
                      options: ['Not started', 'In progress', 'Complete', 'Blocked']
                    },
                    {
                      id: 'outcome',
                      type: 'textarea',
                      label: 'Outcome / Notes',
                      rows: 3
                    }
                  ],
                  onSubmit: {
                    apiEndpoint: 'POST /api/emergency-resolutions/actions/update',
                    payload: {
                      customer_id: '{{customer.id}}',
                      action: '{{form.action}}',
                      status: '{{form.status}}',
                      outcome: '{{form.outcome}}',
                      updated_at: '{{workflow.currentTimestamp}}'
                    }
                  }
                }
              }
            }
          },
          {
            id: 'request-fast-track-approval',
            label: 'Request Fast-Track Approval',
            type: 'primary',

            onExecute: {
              openModal: {
                type: 'form',
                config: {
                  title: 'Fast-Track Approval Request',
                  fields: [
                    {
                      id: 'approval_type',
                      type: 'select',
                      label: 'Approval Type',
                      options: [
                        'Emergency Discount (up to 15%)',
                        'Emergency Discount (15-20%, requires CEO)',
                        'Custom Payment Terms',
                        'Custom Contract Terms',
                        'Product Roadmap Commitment'
                      ]
                    },
                    {
                      id: 'justification',
                      type: 'textarea',
                      label: 'Justification',
                      placeholder: 'Why is this approval needed? What are the consequences if not approved?',
                      rows: 4,
                      required: true
                    },
                    {
                      id: 'approver',
                      type: 'select',
                      label: 'Approver',
                      options: ['VP Customer Success', 'CEO', 'CFO', 'Legal Team', 'Product Team']
                    }
                  ],
                  onSubmit: {
                    apiEndpoint: 'POST /api/approvals/fast-track',
                    payload: {
                      customer_id: '{{customer.id}}',
                      approval_type: '{{form.approval_type}}',
                      justification: '{{form.justification}}',
                      approver: '{{form.approver}}',
                      requested_by: '{{csm.email}}',
                      urgency: 'critical',
                      deadline: '4_hours'
                    },

                    onSuccess: {
                      notification: {
                        type: 'success',
                        message: 'Fast-track approval request sent. Target response: 4 hours.'
                      }
                    }
                  }
                }
              }
            }
          }
        ]
      }
    },

    /**
     * STEP 3: ALTERNATIVE RENEWAL OPTIONS
     *
     * If full renewal not possible, explore alternative arrangements to keep the customer.
     * Conditional step - only runs if full renewal at risk.
     */
    {
      id: 'alternative-renewal-options',
      name: 'Alternative Renewal Options',
      type: 'analysis',
      description: 'Explore alternative arrangements if full renewal not possible',
      conditional: true,

      conditionalLogic: {
        condition: 'full_renewal_at_risk',
        description: 'Only show this step if emergency resolution indicates full renewal may not be possible'
      },

      execution: {
        llmPrompt: `
# ALTERNATIVE RENEWAL OPTIONS

If full renewal is not possible, explore these alternatives to keep the customer engaged.

**Goal:** Any revenue is better than $0. Any engagement is better than churn.

---

## OPTION 1: SHORT-TERM EXTENSION 📅

**Concept:** Give customer more time to decide, maintain relationship, avoid immediate churn.

**Structures:**
- **1-Month Extension:** Same price, same terms, just 1 more month to decide
- **3-Month Bridge:** Quarter-to-quarter, gives them evaluation period
- **6-Month Half-Renewal:** Half the annual price for 6 months

**Pricing:**
- Month-to-month: Annual price / 12 * 1.2 (20% premium for flexibility)
- Quarterly: Annual price / 4 * 1.1 (10% premium)
- 6-month: Annual price / 2 (no premium)

**When to Offer:**
- Customer needs more time for budget approval
- New leadership wants to evaluate before committing
- Timing issue (fiscal year, procurement cycle)

**Proposal:**

> "I understand you're not ready to commit to a full year renewal right now. How about we do a [1-month/3-month/6-month] extension at [price]? This gives you time to [complete evaluation / get budget approval / have new leadership assess], and we stay engaged. At the end of [timeframe], we can discuss a full renewal. Sound good?"

---

## OPTION 2: REDUCED SCOPE RENEWAL 📉

**Concept:** Keep them as customer, but at reduced price/seats/features.

**Structures:**
- **Fewer Seats:** Reduce from 100 seats to 50 seats (50% price reduction)
- **Downgrade Tier:** Move from Enterprise to Professional (30-40% price reduction)
- **Remove Add-Ons:** Keep core product, remove premium features (10-20% price reduction)

**When to Offer:**
- Budget cuts (they still see value, but less budget)
- Team size reduction (layoffs, re-org)
- Feature usage analysis shows they don't use premium features

**Proposal:**

> "I see that budget is tight this year. What if we right-size the contract? Looking at your usage, you're actively using [X] seats out of [Y]. How about we renew for [X] seats at [reduced price]? You keep the product you're using, we keep the relationship, and next year when budget improves, we can scale back up."

---

## OPTION 3: PAYMENT PLAN / FLEXIBILITY 💳

**Concept:** Make it easier to pay by splitting payments.

**Structures:**
- **Quarterly Payments:** Pay 1/4 upfront, then 3 more quarterly payments
- **Monthly Payments:** Pay 1/12 each month (usually via credit card auto-charge)
- **Split Payment:** 50% now, 50% in 60 days
- **Net-60 or Net-90:** Invoice now, pay in 60-90 days (gives them time for budget)

**When to Offer:**
- Budget available but timing issue (waiting for fiscal year, budget approval, etc.)
- Cash flow constraints
- Procurement requires quarterly payments

**Proposal:**

> "I understand the full annual payment is challenging right now. What if we split it into [quarterly/monthly] payments? You get the full product, we spread the cost over time. Would that work better for your budget?"

---

## OPTION 4: PAUSE / HIBERNATION ⏸️

**Concept:** Temporarily pause the contract, resume later.

**Structures:**
- **3-Month Pause:** No charge for 3 months, resume at reduced price after
- **Hibernation Mode:** Minimal features (read-only access), 10% of annual price, can reactivate anytime
- **Season Pass:** Only active 6 months of the year (seasonal businesses)

**When to Offer:**
- Company in transition (acquisition, re-org, leadership change)
- Seasonal business with low-usage periods
- Product not needed right now but will be needed later

**Proposal:**

> "It sounds like now isn't the right time for [product], but you'll need it again in [3/6/12] months. What if we pause the contract for [timeframe] at no charge? This keeps your data safe, and when you're ready, we reactivate at [reduced price]. This way you don't lose your setup, history, or configurations."

---

## OPTION 5: PARTIAL RENEWAL (LAND & EXPAND REVERSAL) 🔄

**Concept:** Go back to smaller footprint, re-earn their business.

**Structures:**
- **Single Team Renewal:** Instead of company-wide, renew for one department
- **Pilot Re-Start:** Treat it like a new pilot, prove value again
- **Core Features Only:** Strip back to essentials, prove value, then expand

**When to Offer:**
- Customer dissatisfied with product or service
- Usage dropped significantly
- Value perception low

**Proposal:**

> "I hear that the product hasn't delivered the value you expected across the whole company. What if we scale back to [single team / core features] at [reduced price], and spend the next [6 months] proving value? If we hit [specific metrics], then we expand back to full contract. If not, no hard feelings. Fair?"

---

## DECISION FRAMEWORK

For each option above, analyze:

**1. FINANCIAL IMPACT**
- Full renewal ARR: {{workflow.renewalARR}}
- Alternative ARR: [Calculate for each option]
- Better than $0? Yes/No

**2. STRATEGIC IMPACT**
- Keep customer engaged? Yes/No
- Opportunity to expand later? Yes/No
- Logo value preserved? Yes/No

**3. CUSTOMER FIT**
- Does this address their blocker? Yes/No
- Is this genuinely helpful or just delaying churn? [Assessment]

**4. APPROVAL NEEDED**
- VP CS approval? (for >10% ARR reduction)
- CEO approval? (for >25% ARR reduction)
- Legal approval? (for custom terms)

---

## RECOMMENDATION

Based on the customer's situation ({{critical_assessment.primary_blocker}}), recommend the top 2-3 alternative options:

**Option 1:** [Name]
**Why:** [1-2 sentences]
**ARR Impact:** [Amount]
**Approval Needed:** [Yes/No, from whom]

**Option 2:** [Name]
**Why:** [1-2 sentences]
**ARR Impact:** [Amount]
**Approval Needed:** [Yes/No, from whom]

**Option 3:** [Name]
**Why:** [1-2 sentences]
**ARR Impact:** [Amount]
**Approval Needed:** [Yes/No, from whom]

---

**Database Storage:**
- Table: alternative_renewal_options
- Fields: customer_id, option_date, full_renewal_arr, alternative_options (JSON), recommended_option, arr_impact, approval_needed, customer_response
        `,
        processor: 'analyzers/alternativeOptionsAnalyzer.js',
        storeIn: 'alternative_options'
      },

      ui: {
        cardTitle: '🔄 Alternative Renewal Options',
        cardDescription: 'Exploring alternative arrangements if full renewal not possible',

        artifacts: [
          {
            id: 'options-comparison',
            type: 'table',
            title: 'Alternative Options Comparison',

            config: {
              data: '{{outputs.alternative_options}}',

              columns: [
                { id: 'option_name', label: 'Option', width: '20%' },
                { id: 'description', label: 'Description', width: '30%' },
                { id: 'arr_impact', label: 'ARR', width: '15%' },
                { id: 'strategic_value', label: 'Strategic Value', width: '20%' },
                { id: 'approval_needed', label: 'Approval Needed', width: '15%' }
              ],

              highlightRow: '{{row.recommended == true}}'
            }
          },
          {
            id: 'recommendation',
            type: 'alert',
            title: 'Recommended Option',
            content: '{{outputs.recommended_option}}',
            severity: 'info'
          }
        ],

        actions: [
          {
            id: 'propose-alternative',
            label: 'Propose Alternative to Customer',
            type: 'primary',

            onExecute: {
              openModal: {
                type: 'form',
                config: {
                  title: 'Propose Alternative Renewal',
                  fields: [
                    {
                      id: 'option',
                      type: 'select',
                      label: 'Alternative Option',
                      options: '{{outputs.alternative_options}}',
                      displayField: 'option_name'
                    },
                    {
                      id: 'custom_terms',
                      type: 'textarea',
                      label: 'Custom Terms (if applicable)',
                      placeholder: 'Any specific terms or adjustments for this customer',
                      rows: 3
                    },
                    {
                      id: 'proposal_message',
                      type: 'textarea',
                      label: 'Proposal Message to Customer',
                      placeholder: 'Draft the message you will send to the customer',
                      rows: 5,
                      required: true
                    }
                  ],
                  onSubmit: {
                    apiEndpoint: 'POST /api/renewals/propose-alternative',
                    payload: {
                      customer_id: '{{customer.id}}',
                      alternative_option: '{{form.option}}',
                      custom_terms: '{{form.custom_terms}}',
                      proposal_message: '{{form.proposal_message}}',
                      proposed_by: '{{csm.email}}',
                      proposed_at: '{{workflow.currentTimestamp}}'
                    },

                    onSuccess: {
                      notification: {
                        type: 'success',
                        message: 'Alternative renewal proposal logged. Follow up with customer.'
                      }
                    }
                  }
                }
              }
            }
          },
          {
            id: 'request-alternative-approval',
            label: 'Request Approval for Alternative',
            type: 'secondary',

            onExecute: {
              apiEndpoint: 'POST /api/approvals/alternative-renewal',
              payload: {
                customer_id: '{{customer.id}}',
                alternative_option: '{{outputs.recommended_option}}',
                arr_impact: '{{outputs.arr_impact}}',
                justification: '{{outputs.recommendation_reasoning}}',
                requested_by: '{{csm.email}}',
                urgency: 'critical'
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: 'Approval request sent for alternative renewal option'
                }
              }
            }
          }
        ]
      }
    },

    /**
     * STEP 4: ACTION PLAN
     *
     * Reuses the shared ActionPlanStep but with Critical-specific context.
     */
    {
      ...ActionPlanStep,
      id: 'action-plan',

      execution: {
        ...ActionPlanStep.execution,
        llmPrompt: `
${ActionPlanStep.execution.llmPrompt}

---

**CRITICAL RENEWAL CONTEXT:**

This is a CRITICAL renewal with {{workflow.daysUntilRenewal}} days remaining.

**Situation:**
- Primary Blocker: {{critical_assessment.primary_blocker}}
- Executive Escalation: {{executive_escalation.executives_notified}}
- Emergency Actions: {{emergency_resolution.actions_taken}}
- Alternative Options: {{alternative_options.recommended_option}}

**Action Plan Focus:**
- DAILY check-ins (not weekly)
- Executive ownership for all critical actions
- Clear DECISION POINTS (by what date do we commit to alternative option?)
- Churn prevention measures if customer decides not to renew

**Key Actions to Include:**
1. Daily executive standup (if war room)
2. Daily customer touchpoint (email, call, or meeting)
3. Fast-track approvals (4-hour SLA)
4. Alternative option proposal (if needed)
5. Decision deadline: Day X (when do we give up on full renewal?)
6. Churn handoff preparation (if renewal fails)

**Next Workflow:**
- If renewal secured by Day 7: Move to post-renewal activities
- If renewal still at risk at Day 7: Transition to Emergency Workflow
- If customer confirms they won't renew: Transition to Overdue Workflow (churn prevention/offboarding)
        `
      },

      ui: {
        ...ActionPlanStep.ui,
        cardTitle: '📋 Critical Action Plan',
        cardDescription: 'Daily action plan with executive oversight until renewal secured or lost'
      }
    }
  ]
};

export default CriticalWorkflow;
