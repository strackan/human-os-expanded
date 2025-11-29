import { WorkflowConfig } from '../types/workflow';
import { ActionPlanStep } from './shared/ActionPlanStep';

/**
 * OVERDUE RENEWAL WORKFLOW
 *
 * Timeline: ≤-1 days (renewal date has passed, but renewal still in progress)
 *
 * Purpose:
 * Complete administrative items after renewal date passes. This workflow assumes the
 * customer still intends to renew - they just haven't finished the paperwork yet
 * (signatures pending, payment pending, Salesforce not updated, etc.).
 *
 * This is NOT a churn workflow. If there's actual churn risk (customer declining,
 * ghosting, competitive threat), that's handled by separate Risk workflows.
 *
 * Triggers:
 * 1. Days-based: ≤-1 days (renewal date passed without completion)
 * 2. Manual trigger: CSM marks renewal as "overdue - completing paperwork"
 *
 * Key Features:
 * - Status check (what's still pending?)
 * - Daily follow-up actions (chase signatures, process payment)
 * - Grace period management (keep service active during completion)
 * - Completion tracking (mark items done, finalize renewal)
 * - Simple operational urgency (not panic or desperation)
 *
 * Expected Outcomes:
 * - Signatures completed
 * - Payment received
 * - Salesforce updated to "Closed Won"
 * - Service continues without interruption
 * - Renewal administratively closed
 *
 * Database Tables:
 * - overdue_status_checks
 * - completion_follow_ups
 */

export const OverdueWorkflow: WorkflowConfig = {
  id: 'overdue',
  name: 'Overdue Renewal',
  description: 'Administrative completion after renewal date passes',
  version: '1.0.0',

  trigger: {
    daysUntilRenewal: {
      max: -1
    },
    manualTriggers: [
      {
        condition: 'renewal_marked_overdue',
        description: 'CSM manually marks renewal as overdue but still in progress'
      }
    ]
  },

  context: {
    systemPrompt: `
You are an AI assistant helping Customer Success Managers complete OVERDUE RENEWALS.

The renewal date has passed, but the renewal is still in progress. The customer hasn't churned - they just haven't finished the paperwork yet.

Your role:
1. Check what's still pending (signatures, payment, Salesforce updates)
2. Execute daily follow-ups to complete pending items
3. Manage grace period (keep service active while completing)
4. Track completion and finalize renewal

IMPORTANT CONTEXT:
- This is NOT a churn situation. The customer intends to renew.
- The issue is ADMINISTRATIVE - paperwork hasn't been completed yet.
- Tone should be operational urgency, not panic or desperation.
- Focus on completing tasks, not saving the customer.

TYPICAL SCENARIOS:
- Signatures sent but customer hasn't signed yet (busy, forgot, email in spam)
- Signatures complete but payment not processed (AP delay, invoice issue)
- Everything done but Salesforce not updated (internal admin issue)
- Customer verbally committed but DocuSign not sent yet (our delay)

GRACE PERIOD:
- Most SaaS companies allow 30 days grace period after renewal date
- Service stays active during grace period
- No disruption to customer experience
- This gives time to complete paperwork without pressure

DAILY ACTIONS:
- Send signature reminder (if pending)
- Follow up on payment (call AP if needed)
- Update Salesforce when items complete
- Mark renewal as "Closed Won" when fully complete

Remain professional, helpful, and operationally focused.
    `
  },

  steps: [
    /**
     * STEP 0: OVERDUE STATUS CHECK
     *
     * Determine what administrative items are still pending.
     */
    {
      id: 'overdue-status-check',
      name: 'Overdue Status Check',
      type: 'conditional_routing',
      description: 'Check what administrative items are still pending',

      execution: {
        llmPrompt: `
# OVERDUE STATUS CHECK

**Customer:** {{customer.name}}
**Renewal Date:** {{customer.renewalDate}}
**Days Overdue:** {{Math.abs(workflow.daysUntilRenewal)}}
**Renewal ARR:** {{workflow.renewalARR}}

---

## ADMINISTRATIVE COMPLETION CHECKLIST

Check the status of each completion item:

### 1. SIGNATURES ✍️
- [ ] DocuSign envelope sent to customer?
- [ ] Customer signed?
- [ ] Vendor counter-signed?
- [ ] Contract fully executed?

**Status:** [COMPLETE / IN_PROGRESS / NOT_STARTED / BLOCKED]

**If BLOCKED, why?** [Description]

---

### 2. PAYMENT 💳
- [ ] Invoice sent to customer?
- [ ] Payment received?
- [ ] Payment scheduled/confirmed?
- [ ] PO received (if applicable)?

**Status:** [COMPLETE / IN_PROGRESS / NOT_STARTED / BLOCKED]

**If BLOCKED, why?** [Description]

---

### 3. SALESFORCE / CRM 📊
- [ ] Opportunity stage updated to "Closed Won"?
- [ ] Contract end date updated?
- [ ] Renewal opportunity created for next year?
- [ ] ARR updated in CRM?

**Status:** [COMPLETE / IN_PROGRESS / NOT_STARTED / BLOCKED]

**If BLOCKED, why?** [Description]

---

### 4. SERVICE CONTINUITY 🔄
- [ ] Customer service still active?
- [ ] No disruption to customer access?
- [ ] Grace period documented?

**Status:** [ACTIVE / AT_RISK / DISRUPTED]

**If AT_RISK or DISRUPTED, why?** [Description]

---

## CUSTOMER COMMUNICATION STATUS

**Last customer contact:** [Date]

**Customer stance:**
- [ ] Verbally committed to renewal
- [ ] Actively working on completion (e.g., getting signatures, processing payment)
- [ ] Slow to respond but not declining
- [ ] Unclear/no recent communication

**Select one:** [COMMITTED / ACTIVE / SLOW / UNCLEAR]

---

## OVERDUE ROUTING DECISION

Based on the completion checklist above, select the PRIMARY blocker:

### Route: SIGNATURES_PENDING ✍️
**Condition:** DocuSign sent but not signed, OR not sent yet
**Action:** Daily signature follow-up

### Route: PAYMENT_PENDING 💳
**Condition:** Signatures complete but payment not received
**Action:** Daily payment follow-up

### Route: INTERNAL_ADMIN_PENDING 📋
**Condition:** All external items done (signatures + payment), just need to update our systems
**Action:** Internal completion tasks

### Route: MULTIPLE_PENDING 🔄
**Condition:** Multiple items still pending
**Action:** Comprehensive daily follow-up

### Route: COMPLETION_READY ✅
**Condition:** Everything done, just need to mark as closed
**Action:** Final completion and close workflow

---

## YOUR ROUTING DECISION

**Primary Blocker:** [Select one of the 5 routes above]

**Secondary Blockers (if any):** [List other pending items]

**Days in Grace Period:** {{Math.abs(workflow.daysUntilRenewal)}} days

**Urgency Level:**
{{#if Math.abs(workflow.daysUntilRenewal) <= 7}}
- **LOW:** Recently overdue, plenty of grace period remaining
{{else if Math.abs(workflow.daysUntilRenewal) <= 21}}
- **MODERATE:** Mid-grace period, should complete soon
{{else}}
- **HIGH:** Approaching end of grace period (typically 30 days)
{{/if}}

**Recommended Action (next 24 hours):** [What should happen today?]

---

**Database Storage:**
- Table: overdue_status_checks
- Fields: customer_id, check_date, days_overdue, signatures_status, payment_status, salesforce_status, service_status, customer_stance, primary_blocker, secondary_blockers, urgency_level, recommended_action
        `,
        processor: 'routers/overdueStatusRouter.js',
        storeIn: 'overdue_status'
      },

      routing: {
        routes: [
          {
            id: 'SIGNATURES_PENDING',
            nextStepId: 'daily-follow-up',
            condition: 'Signatures not complete'
          },
          {
            id: 'PAYMENT_PENDING',
            nextStepId: 'daily-follow-up',
            condition: 'Payment not received'
          },
          {
            id: 'INTERNAL_ADMIN_PENDING',
            nextStepId: 'daily-follow-up',
            condition: 'Internal systems not updated'
          },
          {
            id: 'MULTIPLE_PENDING',
            nextStepId: 'daily-follow-up',
            condition: 'Multiple items pending'
          },
          {
            id: 'COMPLETION_READY',
            nextStepId: 'renewal-completion',
            condition: 'All items complete, ready to close'
          }
        ],
        defaultRoute: 'daily-follow-up'
      },

      ui: {
        cardTitle: '📋 Overdue Status Check',
        cardDescription: 'Days overdue: {{Math.abs(workflow.daysUntilRenewal)}} | Checking what\'s still pending',

        artifacts: [
          {
            id: 'overdue-summary',
            type: 'summary_panel',
            title: 'Overdue Summary',

            config: {
              fields: [
                { label: 'Days Overdue', value: '{{Math.abs(workflow.daysUntilRenewal)}}' },
                { label: 'Renewal ARR', value: '{{workflow.renewalARR}}', format: 'currency' },
                { label: 'Customer Stance', value: '{{outputs.customer_stance}}' },
                { label: 'Grace Period Status', value: '{{outputs.service_status}}' }
              ]
            }
          },
          {
            id: 'completion-checklist',
            type: 'checklist',
            title: 'Completion Checklist',

            config: {
              sections: [
                {
                  title: 'Signatures',
                  status: '{{outputs.signatures_status}}',
                  icon: '{{outputs.signatures_status == "COMPLETE" ? "✅" : "⏳"}}'
                },
                {
                  title: 'Payment',
                  status: '{{outputs.payment_status}}',
                  icon: '{{outputs.payment_status == "COMPLETE" ? "✅" : "⏳"}}'
                },
                {
                  title: 'Salesforce/CRM',
                  status: '{{outputs.salesforce_status}}',
                  icon: '{{outputs.salesforce_status == "COMPLETE" ? "✅" : "⏳"}}'
                },
                {
                  title: 'Service Active',
                  status: '{{outputs.service_status}}',
                  icon: '{{outputs.service_status == "ACTIVE" ? "✅" : "⚠️"}}'
                }
              ]
            }
          },
          {
            id: 'primary-blocker',
            type: 'alert',
            title: 'Primary Blocker',
            config: {
              content: '**{{outputs.primary_blocker}}**{{#if outputs.secondary_blockers}} (Also pending: {{outputs.secondary_blockers}}){{/if}}',
              severity: '{{outputs.urgency_level == "HIGH" ? "error" : outputs.urgency_level == "MODERATE" ? "warning" : "info"}}'
            }
          },
          {
            id: 'next-action',
            type: 'action_item',
            title: 'Next 24 Hours',
            content: '{{outputs.recommended_action}}',
            style: {
              highlight: true
            }
          }
        ]
      }
    },

    /**
     * STEP 1: DAILY FOLLOW-UP
     *
     * Execute daily follow-up actions to complete pending items.
     */
    {
      id: 'daily-follow-up',
      name: 'Daily Follow-Up',
      type: 'action',
      description: 'Daily actions to complete pending administrative items',

      execution: {
        llmPrompt: `
# DAILY FOLLOW-UP

**Primary Blocker:** {{overdue_status.primary_blocker}}
**Days Overdue:** {{Math.abs(workflow.daysUntilRenewal)}}
**Customer Stance:** {{overdue_status.customer_stance}}

---

## FOLLOW-UP ACTIONS BY BLOCKER TYPE

### IF PRIMARY BLOCKER = SIGNATURES_PENDING ✍️

**Daily Signature Follow-Up:**

**1. Check DocuSign Status**
- [ ] Log into DocuSign, check envelope status
- [ ] Identify which signatories haven't signed
- [ ] Check when envelope was last viewed

**2. Customer Signature Reminders**

**If Not Viewed (0 views):**
- Email likely in spam or wrong address
- Actions:
  - [ ] Call customer directly: "Did you receive the DocuSign?"
  - [ ] Resend DocuSign (different subject line)
  - [ ] Text/SMS if mobile number available
  - [ ] Offer to walk through on phone

**If Viewed But Not Signed (1+ views):**
- Customer saw it but hasn't acted
- Actions:
  - [ ] Send gentle reminder email (see template below)
  - [ ] Call: "I saw you viewed the contract. Any questions or concerns?"
  - [ ] Offer assistance: "I can walk you through it if helpful"

**If Waiting on Additional Signatories:**
- Customer signed, waiting on others (legal, finance, exec)
- Actions:
  - [ ] Call customer: "Your signature is in! Who else needs to sign?"
  - [ ] Offer to contact additional signatories directly
  - [ ] Ask if there's a faster path (different signatory, wet signature)

**3. Internal Signature Delays**

**If Waiting on Vendor Counter-Signature:**
- Customer signed, waiting on us
- Actions:
  - [ ] Alert legal team: Contract needs counter-signature TODAY
  - [ ] Get VP CS or authorized signer to sign within 4 hours
  - [ ] Don't make customer wait on our side

**Email Template (Customer Signature Reminder):**

Subject: Quick reminder: {{customer.name}} Contract Signature

> Hi [Name],
>
> Just following up on the renewal contract sent via DocuSign. I know things get busy!
>
> The contract just needs your signature to finalize everything. Takes about 2 minutes.
>
> [DocuSign Link]
>
> Any questions or issues with the contract? I'm happy to help.
>
> Thanks!
> {{csm.name}}

**Daily Cadence:**
- Send reminder every 24 hours until signed
- Call every 2-3 days
- More frequent if approaching end of grace period (21+ days overdue)

---

### IF PRIMARY BLOCKER = PAYMENT_PENDING 💳

**Daily Payment Follow-Up:**

**1. Check Payment Status**
- [ ] Check if invoice sent to customer
- [ ] Confirm invoice went to correct billing contact/AP department
- [ ] Check if payment received/scheduled

**2. Customer Payment Follow-Up**

**If Invoice Not Sent:**
- Internal issue - fix immediately
- Actions:
  - [ ] Alert finance team to send invoice TODAY
  - [ ] Verify billing contact email address
  - [ ] Send invoice within 4 hours

**If Invoice Sent But Not Paid:**
- Follow up with customer AP/finance
- Actions:
  - [ ] Call customer billing contact: "Did you receive the invoice?"
  - [ ] Ask about payment timeline: "When can we expect payment?"
  - [ ] Offer to resend invoice if they didn't receive
  - [ ] Check if they need different format (PDF, paper check, wire instructions)

**If Waiting on PO:**
- Customer needs PO before payment
- Actions:
  - [ ] Call customer procurement: "What's the status of the PO?"
  - [ ] Offer to help expedite: "What do you need from us?"
  - [ ] Ask if we can accept verbal PO and paperwork can follow

**If Payment Method Issues:**
- Credit card declined, wire transfer issues, etc.
- Actions:
  - [ ] Call billing contact immediately: "There's an issue with payment"
  - [ ] Offer alternative payment methods
  - [ ] Work with finance team to resolve

**3. Internal Payment Delays**

**If Payment Received But Not Applied:**
- Finance hasn't applied payment to account
- Actions:
  - [ ] Alert finance team: Payment received, needs to be applied
  - [ ] Update Salesforce once payment applied

**Email Template (Payment Follow-Up):**

Subject: {{customer.name}} Renewal Invoice - Payment Status

> Hi [Billing Contact],
>
> I wanted to follow up on the renewal invoice (Invoice #{{invoice_number}}) sent on {{invoice_date}}.
>
> Could you confirm:
> - Did you receive the invoice?
> - When can we expect payment?
> - Do you need anything from us to process?
>
> Invoice attached for your convenience.
>
> Thanks!
> {{csm.name}}

**Daily Cadence:**
- Call billing contact every 2-3 days
- Email reminder every 3-4 days
- More frequent if approaching end of grace period

---

### IF PRIMARY BLOCKER = INTERNAL_ADMIN_PENDING 📋

**Internal Completion Tasks:**

Customer has done their part (signed, paid). We need to update our systems.

**1. Salesforce Update**
- [ ] Update opportunity stage to "Closed Won"
- [ ] Update contract end date to new renewal date
- [ ] Update ARR to reflect new contract value
- [ ] Create renewal opportunity for next year
- [ ] Add notes about overdue completion

**2. System Provisioning**
- [ ] Ensure customer access continues uninterrupted
- [ ] Update subscription/billing system
- [ ] Update support portal entitlements
- [ ] Send confirmation email to customer

**3. Internal Notifications**
- [ ] Notify finance: Renewal complete, payment received
- [ ] Notify product/engineering: Customer renewed (if relevant)
- [ ] Update CSM dashboard

**Timeline:**
- Complete all internal tasks within 24 hours
- Don't make customer wait on our admin

---

### IF PRIMARY BLOCKER = MULTIPLE_PENDING 🔄

**Comprehensive Daily Follow-Up:**

Multiple items still pending - prioritize and tackle each.

**Priority Order:**
1. **Signatures** (highest priority - nothing else can happen without this)
2. **Payment** (second priority - needed for completion)
3. **Internal Admin** (last priority - we control this)

**Daily Actions:**
- [ ] Execute signature follow-up (see above)
- [ ] Execute payment follow-up (see above)
- [ ] Execute internal admin tasks (see above)
- [ ] Log all actions and customer responses

**Daily Check-In:**
- Review status every morning
- Update completion checklist
- Adjust follow-up strategy if needed

---

## GRACE PERIOD MANAGEMENT

**Grace Period Timeline:**

**Days 1-7 (Recently Overdue):**
- Low urgency, normal follow-up cadence
- Customer likely just delayed, will complete soon
- Friendly reminders

**Days 8-21 (Mid-Grace Period):**
- Moderate urgency, increase follow-up frequency
- Call customer to understand timeline
- Offer assistance to expedite

**Days 22-30 (End of Grace Period):**
- High urgency, daily follow-up
- Alert customer to grace period ending
- Escalate internally if needed

**After Day 30 (Beyond Grace Period):**
- Critical urgency
- Executive involvement (VP CS)
- Service interruption risk
- May need to move to Risk workflow if customer isn't responsive

---

## ESCALATION BY DAYS OVERDUE

**Team Involvement Required:**

**Days 1-7: Manager FYI**
- [ ] Send daily status email to CSM Manager
- [ ] Include in weekly 1:1 discussion
- Manager awareness, not involvement yet
- **If Account Plan:** Manager notified on Day 1 (not Day 7)

**Days 8-14: Manager Involvement**
- [ ] Weekly check-in with manager (30 minutes)
- [ ] Manager reviews follow-up strategy
- [ ] Manager can reach out to customer if needed
- **If Account Plan:** Notify Account Team on Day 8

**Days 15-21: VP CS Involvement**
- [ ] VP CS added to status updates (twice weekly)
- [ ] If has account plan: Full Account Team activated
- [ ] Consider executive outreach to customer
- [ ] Escalation email to executives

**Days 22-30: Daily Team Sync**
- [ ] Create Slack channel: #overdue-{{customer.slug}}
- [ ] Daily 15-min standup (CSM, Manager, VP CS)
- [ ] Executive Sponsor notified (if exists)
- [ ] Service interruption warning to customer
- [ ] Account Team daily involvement (if account plan)

**Day 30+: War Room Activation**
- [ ] Full war room (like Critical workflow)
- [ ] Legal + Finance involved (service interruption, contract implications)
- [ ] Consider Risk workflow if customer unresponsive
- [ ] Daily updates to executive team
- [ ] Service interruption planning begins

**Account Plan Acceleration:**
If customer has Account Plan, escalate 7 days earlier:
- Manager involvement: Day 1 (not Day 8)
- VP CS involvement: Day 8 (not Day 15)
- Daily team sync: Day 15 (not Day 22)
- War room: Day 23 (not Day 30)

---

## FOLLOW-UP TRACKER

For each follow-up action taken today:

**Action:** [Description]
**Method:** [Email / Phone / Text / Other]
**Contact:** [Person contacted]
**Outcome:** [Response, next steps]
**Next Follow-Up:** [Date/time]

---

**Database Storage:**
- Table: completion_follow_ups
- Fields: customer_id, follow_up_date, days_overdue, primary_blocker, follow_up_actions (JSONB), customer_responses, outcomes, next_follow_up_date
        `,
        processor: 'executors/dailyFollowUpExecutor.js',
        storeIn: 'daily_follow_up'
      },

      // Flexible day-based escalation notifications
      notifications: [
        // Day 7: Manager FYI
        {
          condition: '{{eq workflow.daysOverdue 7}}',
          type: 'overdue_alert',
          title: '📧 Renewal 1 Week Overdue',
          message: '{{customer.name}} renewal is 1 week overdue. Your manager has been notified for awareness.',
          priority: 3,
          recipients: ['{{csm.email}}'],
          metadata: {
            customerId: '{{customer.id}}',
            workflowStage: 'overdue',
            daysOverdue: 7,
            escalationLevel: 'manager_fyi'
          }
        },

        // Day 8: Manager Involvement
        {
          condition: '{{eq workflow.daysOverdue 8}}',
          type: 'key_task_pending',
          title: '👔 Manager Check-in Required',
          message: 'Schedule weekly check-in with manager to review {{customer.name}} renewal completion strategy',
          priority: 3,
          recipients: ['{{csm.email}}'],
          metadata: {
            customerId: '{{customer.id}}',
            daysOverdue: 8,
            requiresManagerCheckIn: true
          }
        },

        // Day 15: VP CS Involvement
        {
          condition: '{{eq workflow.daysOverdue 15}}',
          type: 'escalation_required',
          title: '🚨 VP CS Involvement Required',
          message: '{{customer.name}} (${{customer.arr}}) is 15 days overdue. VP CS has been looped in for strategic guidance.',
          priority: 1,
          recipients: ['{{csm.email}}', '{{csm.manager}}', '{{company.vpCustomerSuccess}}'],
          metadata: {
            customerId: '{{customer.id}}',
            daysOverdue: 15,
            arr: '{{customer.arr}}',
            escalationLevel: 'vp_cs'
          }
        },

        // Day 22: Daily Team Sync
        {
          condition: '{{eq workflow.daysOverdue 22}}',
          type: 'task_requires_decision',
          title: '📅 Daily Team Sync Required',
          message: 'Create Slack channel and schedule daily standup for {{customer.name}} renewal completion',
          priority: 2,
          recipients: ['{{csm.email}}', '{{csm.manager}}'],
          metadata: {
            customerId: '{{customer.id}}',
            daysOverdue: 22,
            requiresSlackChannel: true,
            slackChannelName: 'overdue-{{customer.slug}}'
          }
        },

        // Day 30: War Room
        {
          condition: '{{eq workflow.daysOverdue 30}}',
          type: 'task_requires_decision',
          title: '⚠️ War Room Activation Required',
          message: '{{customer.name}} is 30 days overdue. Immediate war room activation needed. Legal and Finance must be involved.',
          priority: 1,
          recipients: [
            '{{csm.email}}',
            '{{csm.manager}}',
            '{{company.vpCustomerSuccess}}',
            '{{#if (gte customer.arr 250000)}}{{company.ceo}}{{/if}}'
          ],
          metadata: {
            customerId: '{{customer.id}}',
            daysOverdue: 30,
            requiresWarRoom: true,
            serviceInterruptionRisk: true
          }
        },

        // Strategic Account: Accelerated Escalation (Day 8 with Account Plan)
        {
          condition: '{{and (eq workflow.daysOverdue 8) customer.hasAccountPlan}}',
          type: 'escalation_required',
          title: '⭐ Strategic Account Requires Attention',
          message: 'Strategic account {{customer.name}} is 8 days overdue. Account team has been notified per account plan protocol.',
          priority: 1,
          recipients: ['{{csm.email}}', '{{accountTeam.allEmails}}'],
          metadata: {
            customerId: '{{customer.id}}',
            isStrategic: true,
            hasAccountPlan: true,
            daysOverdue: 8,
            accountPlanAcceleration: true
          }
        },

        // Strategic Account: VP CS Involvement (Day 8 instead of 15)
        {
          condition: '{{and (eq workflow.daysOverdue 8) customer.hasAccountPlan}}',
          type: 'escalation_required',
          title: '🚨 Strategic Account - VP CS Involvement',
          message: 'VP CS involvement required for strategic account {{customer.name}} (Day 8 - accelerated timeline)',
          priority: 1,
          recipients: ['{{company.vpCustomerSuccess}}', '{{csm.email}}', '{{csm.manager}}'],
          metadata: {
            customerId: '{{customer.id}}',
            isStrategic: true,
            daysOverdue: 8,
            escalationLevel: 'vp_cs',
            accountPlanAcceleration: true
          }
        }
      ],

      ui: {
        cardTitle: '📞 Daily Follow-Up',
        cardDescription: 'Day {{Math.abs(workflow.daysUntilRenewal)}} overdue - Completing {{overdue_status.primary_blocker}}',

        artifacts: [
          {
            id: 'follow-up-actions',
            type: 'action_list',
            title: 'Today\'s Follow-Up Actions',

            config: {
              actions: '{{outputs.follow_up_actions}}',
              groupBy: 'blocker_type',
              showMethod: true,
              allowCheck: true
            }
          },
          {
            id: 'follow-up-log',
            type: 'table',
            title: 'Follow-Up History',

            config: {
              data: '{{outputs.follow_up_history}}',
              columns: [
                { id: 'date', label: 'Date', width: '15%' },
                { id: 'action', label: 'Action', width: '30%' },
                { id: 'contact', label: 'Contact', width: '20%' },
                { id: 'outcome', label: 'Outcome', width: '35%' }
              ],
              sortBy: 'date',
              sortDirection: 'desc'
            }
          },
          {
            id: 'grace-period-alert',
            type: 'alert',
            title: 'Grace Period Status',
            config: {
              content: '{{#if Math.abs(workflow.daysUntilRenewal) >= 22}}⚠️ Approaching end of grace period (Day {{Math.abs(workflow.daysUntilRenewal)}} of ~30){{else}}Grace period: Day {{Math.abs(workflow.daysUntilRenewal)}} of ~30{{/if}}',
              severity: '{{Math.abs(workflow.daysUntilRenewal) >= 22 ? "error" : Math.abs(workflow.daysUntilRenewal) >= 8 ? "warning" : "info"}}'
            }
          },
          {
            id: 'escalation-timeline',
            type: 'timeline',
            title: 'Team Escalation Timeline',
            config: {
              currentDay: '{{Math.abs(workflow.daysUntilRenewal)}}',
              milestones: [
                {
                  day: '{{customer.hasAccountPlan ? 1 : 7}}',
                  label: 'Manager FYI',
                  status: '{{Math.abs(workflow.daysUntilRenewal) >= (customer.hasAccountPlan ? 1 : 7) ? "complete" : "upcoming"}}',
                  description: 'Daily status emails to manager'
                },
                {
                  day: '{{customer.hasAccountPlan ? 1 : 8}}',
                  label: 'Manager Involvement',
                  status: '{{Math.abs(workflow.daysUntilRenewal) >= (customer.hasAccountPlan ? 1 : 8) ? "complete" : "upcoming"}}',
                  description: 'Weekly check-ins with manager'
                },
                {
                  day: '{{customer.hasAccountPlan ? 8 : 15}}',
                  label: 'VP CS + Account Team',
                  status: '{{Math.abs(workflow.daysUntilRenewal) >= (customer.hasAccountPlan ? 8 : 15) ? "complete" : "upcoming"}}',
                  description: 'Executive involvement begins'
                },
                {
                  day: '{{customer.hasAccountPlan ? 15 : 22}}',
                  label: 'Daily Team Sync',
                  status: '{{Math.abs(workflow.daysUntilRenewal) >= (customer.hasAccountPlan ? 15 : 22) ? "complete" : "upcoming"}}',
                  description: 'Daily standups with team'
                },
                {
                  day: '{{customer.hasAccountPlan ? 23 : 30}}',
                  label: 'War Room',
                  status: '{{Math.abs(workflow.daysUntilRenewal) >= (customer.hasAccountPlan ? 23 : 30) ? "complete" : "upcoming"}}',
                  description: 'Full war room activation'
                }
              ],
              adjustForAccountPlan: true,
              showAccountPlanBadge: '{{customer.hasAccountPlan}}'
            }
          }
        ],

        actions: [
          {
            id: 'log-follow-up',
            label: 'Log Follow-Up Action',
            type: 'primary',

            onExecute: {
              openModal: {
                type: 'form',
                config: {
                  title: 'Log Follow-Up Action',
                  fields: [
                    {
                      id: 'action_type',
                      type: 'select',
                      label: 'Action Type',
                      options: ['Signature reminder (email)', 'Signature reminder (call)', 'Payment follow-up (email)', 'Payment follow-up (call)', 'Internal admin update', 'Other'],
                      required: true
                    },
                    {
                      id: 'contact_person',
                      type: 'text',
                      label: 'Contact Person',
                      placeholder: 'Who did you contact?'
                    },
                    {
                      id: 'outcome',
                      type: 'textarea',
                      label: 'Outcome',
                      placeholder: 'What happened? What did they say?',
                      rows: 3,
                      required: true
                    },
                    {
                      id: 'item_completed',
                      type: 'checkbox',
                      label: 'Item completed (signature received, payment processed, etc.)',
                      value: false
                    },
                    {
                      id: 'next_follow_up',
                      type: 'date',
                      label: 'Next Follow-Up Date',
                      value: '{{workflow.currentDate + 1 day}}'
                    }
                  ],
                  onSubmit: {
                    apiEndpoint: 'POST /api/overdue-renewals/log-follow-up',
                    payload: {
                      customer_id: '{{customer.id}}',
                      action_type: '{{form.action_type}}',
                      contact_person: '{{form.contact_person}}',
                      outcome: '{{form.outcome}}',
                      item_completed: '{{form.item_completed}}',
                      next_follow_up: '{{form.next_follow_up}}',
                      logged_by: '{{csm.email}}',
                      logged_at: '{{workflow.currentTimestamp}}'
                    },

                    onSuccess: {
                      notification: {
                        type: 'success',
                        message: 'Follow-up logged. Next follow-up: {{form.next_follow_up}}'
                      }
                    }
                  }
                }
              }
            }
          },
          {
            id: 'send-signature-reminder',
            label: 'Send Signature Reminder',
            type: 'secondary',
            visible: '{{overdue_status.primary_blocker == "SIGNATURES_PENDING"}}',

            onExecute: {
              apiEndpoint: 'POST /api/docusign/send-reminder',
              payload: {
                customer_id: '{{customer.id}}',
                envelope_id: '{{workflow.docusign_envelope_id}}'
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: 'DocuSign reminder sent to customer'
                }
              }
            }
          },
          {
            id: 'resend-invoice',
            label: 'Resend Invoice',
            type: 'secondary',
            visible: '{{overdue_status.primary_blocker == "PAYMENT_PENDING"}}',

            onExecute: {
              openModal: {
                type: 'form',
                config: {
                  title: 'Resend Invoice',
                  fields: [
                    {
                      id: 'billing_email',
                      type: 'email',
                      label: 'Billing Email',
                      value: '{{customer.billingContact.email}}',
                      required: true
                    },
                    {
                      id: 'include_message',
                      type: 'textarea',
                      label: 'Include Message',
                      placeholder: 'Optional message to include with invoice',
                      rows: 2
                    }
                  ],
                  onSubmit: {
                    apiEndpoint: 'POST /api/invoices/resend',
                    payload: {
                      customer_id: '{{customer.id}}',
                      billing_email: '{{form.billing_email}}',
                      include_message: '{{form.include_message}}'
                    },

                    onSuccess: {
                      notification: {
                        type: 'success',
                        message: 'Invoice resent to {{form.billing_email}}'
                      }
                    }
                  }
                }
              }
            }
          },
          {
            id: 'update-completion-status',
            label: 'Mark Item Complete',
            type: 'secondary',

            onExecute: {
              openModal: {
                type: 'form',
                config: {
                  title: 'Mark Item Complete',
                  fields: [
                    {
                      id: 'completion_item',
                      type: 'select',
                      label: 'Completed Item',
                      options: ['Signatures', 'Payment', 'Salesforce/CRM Update', 'All Items'],
                      required: true
                    },
                    {
                      id: 'completion_notes',
                      type: 'textarea',
                      label: 'Completion Notes',
                      placeholder: 'Any notes about completion',
                      rows: 2
                    }
                  ],
                  onSubmit: {
                    apiEndpoint: 'POST /api/overdue-renewals/mark-complete',
                    payload: {
                      customer_id: '{{customer.id}}',
                      completion_item: '{{form.completion_item}}',
                      completion_notes: '{{form.completion_notes}}',
                      completed_by: '{{csm.email}}',
                      completed_at: '{{workflow.currentTimestamp}}'
                    },

                    onSuccess: {
                      notification: {
                        type: 'success',
                        message: '{{form.completion_item}} marked as complete'
                      }
                    }
                  }
                }
              }
            }
          },
          {
            id: 'notify-manager',
            label: 'Send Manager Status Update',
            type: 'secondary',
            visible: '{{Math.abs(workflow.daysUntilRenewal) >= 1}}',

            onExecute: {
              apiEndpoint: 'POST /api/overdue-renewals/notify-manager',
              payload: {
                customer_id: '{{customer.id}}',
                days_overdue: '{{Math.abs(workflow.daysUntilRenewal)}}',
                primary_blocker: '{{overdue_status.primary_blocker}}',
                status_summary: '{{daily_follow_up.status_summary}}',
                manager_email: '{{csm.manager}}'
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: 'Manager status update sent'
                }
              }
            }
          },
          {
            id: 'create-team-sync',
            label: 'Create Team Sync',
            type: 'primary',
            visible: '{{Math.abs(workflow.daysUntilRenewal) >= 22}}',

            onExecute: {
              openModal: {
                type: 'calendar_scheduling',
                config: {
                  title: 'Schedule Overdue Team Sync',
                  attendees: {
                    required: ['{{csm.email}}', '{{csm.manager}}', '{{company.vpCustomerSuccess}}'],
                    optional: ['{{#if customer.hasAccountPlan}}{{customer.accountPlan.team}}{{/if}}']
                  },
                  frequency: 'daily',
                  times: ['09:00'],
                  duration: 15,
                  until: 'renewal_complete',
                  urgency: 'high'
                }
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: 'Daily team sync scheduled'
                }
              }
            }
          }
        ]
      }
    },

    /**
     * STEP 2: RENEWAL COMPLETION
     *
     * Finalize and close the renewal now that all items are complete.
     */
    {
      id: 'renewal-completion',
      name: 'Renewal Completion',
      type: 'analysis',
      description: 'Finalize and close renewal',

      execution: {
        llmPrompt: `
# RENEWAL COMPLETION

**Customer:** {{customer.name}}
**Renewal ARR:** {{workflow.renewalARR}}
**Days Overdue:** {{Math.abs(workflow.daysUntilRenewal)}}

All administrative items are now complete. Let's finalize and close the renewal.

---

## FINAL COMPLETION CHECKLIST

Verify all items are complete:

**External (Customer):**
- [x] Contract signed by customer
- [x] Contract counter-signed by vendor
- [x] Payment received or scheduled

**Internal (Us):**
- [ ] Salesforce updated to "Closed Won"
- [ ] Contract end date updated
- [ ] Renewal opportunity created for next year
- [ ] ARR updated in systems
- [ ] Customer service continues uninterrupted
- [ ] Customer notification sent

---

## CUSTOMER NOTIFICATION

Send completion confirmation to customer:

**Email Template:**

Subject: {{customer.name}} Renewal Complete - Thank You!

> Hi [Name],
>
> Great news! Your renewal is now complete. All signatures and payment have been received.
>
> **Renewal Details:**
> - Contract Term: {{workflow.contractStartDate}} to {{workflow.contractEndDate}}
> - Annual Value: {{workflow.renewalARR}}
> - Your service continues uninterrupted
>
> Thank you for renewing with us! We appreciate your continued partnership.
>
> If you have any questions, I'm here to help.
>
> Best,
> {{csm.name}}

**Send:** Today

---

## INTERNAL NOTIFICATIONS

**Notify Teams:**
- [ ] Finance: Renewal complete, payment received, invoice closed
- [ ] Sales (if applicable): Customer renewed, opportunity closed won
- [ ] Executive team (if >$100K ARR): Strategic renewal completed
- [ ] Operations: Update customer record to "Active - Renewed"

---

## POST-COMPLETION NOTES

**Document Overdue Period:**
- Days overdue: {{Math.abs(workflow.daysUntilRenewal)}}
- Reason for delay: [What caused the delay?]
- How resolved: [What actions completed it?]

**Lessons Learned:**
- Could we have completed this faster?
- What was the main blocker?
- How can we avoid this next year?

**Next Year Planning:**
- Start renewal process earlier (add {{Math.abs(workflow.daysUntilRenewal) + 30}} days buffer)
- Set earlier reminder for signatures
- Proactive payment follow-up

---

## WORKFLOW TRANSITION

**Close Overdue Workflow:**
- Mark as complete
- Archive overdue tracking

**Transition to Monitor Workflow:**
- Return customer to Monitor workflow (180+ days from new renewal date)
- Set early intervention triggers for next year
- Flag as "Previously Overdue" - start next renewal earlier

---

**Database Storage:**
- Table: renewal_completions
- Fields: customer_id, completion_date, days_overdue, total_overdue_duration, delay_reason, resolution_actions, lessons_learned, customer_notified, next_year_notes
        `,
        processor: 'analyzers/renewalCompletionAnalyzer.js',
        storeIn: 'renewal_completion'
      },

      ui: {
        cardTitle: '✅ Renewal Completion',
        cardDescription: 'Finalizing renewal and closing workflow',

        artifacts: [
          {
            id: 'completion-summary',
            type: 'summary_panel',
            title: 'Completion Summary',

            config: {
              fields: [
                { label: 'Total Days Overdue', value: '{{Math.abs(workflow.daysUntilRenewal)}}' },
                { label: 'Renewal ARR', value: '{{workflow.renewalARR}}', format: 'currency' },
                { label: 'Delay Reason', value: '{{outputs.delay_reason}}' },
                { label: 'Resolution', value: '{{outputs.resolution_actions}}' }
              ]
            }
          },
          {
            id: 'completion-email',
            type: 'markdown',
            title: 'Customer Completion Email',
            content: '{{outputs.customer_notification_email}}',
            editable: true
          },
          {
            id: 'lessons-learned',
            type: 'document',
            title: 'Lessons Learned',
            content: '{{outputs.lessons_learned}}',
            editable: true
          }
        ],

        actions: [
          {
            id: 'send-completion-email',
            label: 'Send Completion Email to Customer',
            type: 'primary',

            onExecute: {
              apiEndpoint: 'POST /api/renewals/send-completion-email',
              payload: {
                customer_id: '{{customer.id}}',
                email_content: '{{outputs.customer_notification_email}}',
                sent_by: '{{csm.email}}'
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: 'Completion email sent to customer'
                }
              }
            }
          },
          {
            id: 'finalize-renewal',
            label: 'Finalize Renewal',
            type: 'primary',

            onExecute: {
              apiEndpoint: 'POST /api/renewals/finalize',
              payload: {
                customer_id: '{{customer.id}}',
                renewal_arr: '{{workflow.renewalARR}}',
                days_overdue: '{{Math.abs(workflow.daysUntilRenewal)}}',
                delay_reason: '{{outputs.delay_reason}}',
                lessons_learned: '{{outputs.lessons_learned}}',
                finalized_by: '{{csm.email}}'
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: '🎉 Renewal finalized! Transitioning to Monitor workflow.'
                },

                redirect: '/workflows/monitor?customer_id={{customer.id}}'
              }
            }
          }
        ]
      }
    },

    /**
     * STEP 3: ACTION PLAN
     *
     * Reuses the shared ActionPlanStep but with Overdue-specific context.
     */
    {
      ...ActionPlanStep,
      id: 'action-plan',

      execution: {
        ...ActionPlanStep.execution,
        llmPrompt: `
${ActionPlanStep.execution.llmPrompt}

---

**OVERDUE RENEWAL CONTEXT:**

The renewal date has passed ({{Math.abs(workflow.daysUntilRenewal)}} days overdue), but renewal is still in progress.

**Current Status:**
- Primary Blocker: {{overdue_status.primary_blocker}}
- Customer Stance: {{overdue_status.customer_stance}}
- Grace Period: Day {{Math.abs(workflow.daysUntilRenewal)}} of ~30

**Action Plan Focus:**

**Daily Tasks:**
- Send signature reminder (if signatures pending)
- Follow up on payment (if payment pending)
- Update Salesforce when items complete
- Log all follow-up actions and customer responses

**Weekly Tasks:**
- Review completion progress
- Escalate if no progress for 7+ days
- Adjust follow-up strategy if needed

**Grace Period Monitoring:**
- {{#if Math.abs(workflow.daysUntilRenewal) < 22}}
  Continue normal daily follow-up
{{else}}
  ⚠️ Approaching end of grace period - escalate frequency and involve management
{{/if}}

**Completion Criteria:**
- All signatures complete
- Payment received
- Salesforce updated to "Closed Won"
- Customer notification sent

**Next Workflow:**
- When complete → Monitor Workflow (180+ days from new renewal date)
- If customer unresponsive after 30 days → May need Risk workflow assessment
        `
      },

      ui: {
        ...ActionPlanStep.ui,
        cardTitle: '📋 Overdue Action Plan',
        cardDescription: 'Day {{Math.abs(workflow.daysUntilRenewal)}} - Daily follow-up until complete'
      }
    }
  ]
};

export default OverdueWorkflow;
