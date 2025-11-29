import { WorkflowConfig } from '../types/workflow';
import { ActionPlanStep } from './shared/ActionPlanStep';

/**
 * EMERGENCY RENEWAL WORKFLOW
 *
 * Timeline: 0-6 days until renewal date (or renewal date has passed, but contract not expired)
 *
 * Purpose:
 * Absolute final push to secure renewal before contract expires. This is the last chance
 * to save the customer. If renewal doesn't happen, prepare for churn.
 *
 * Triggers:
 * 1. Days-based: 0-6 days until renewal_date
 * 2. Early trigger: Critical workflow incomplete at Day 6
 * 3. Manual trigger: CSM marks renewal as "emergency - last chance"
 *
 * Key Features:
 * - Extreme urgency (hourly updates, not daily)
 * - CEO involvement for large/strategic deals
 * - Final decision point: Renew or churn
 * - Accept alternative options or prepare for loss
 * - Immediate churn preparation if customer confirms non-renewal
 * - Extension offers to buy time (1 week, 1 month)
 *
 * Expected Outcomes:
 * - Last-minute renewal secured (full or alternative)
 * - Short-term extension to buy more time
 * - Graceful churn with offboarding plan
 * - Post-mortem documentation for learning
 *
 * Database Tables:
 * - emergency_status_checks
 * - final_push_attempts
 * - renewal_outcomes
 */

export const EmergencyWorkflow: WorkflowConfig = {
  id: 'emergency',
  name: 'Emergency Renewal',
  description: 'Final push to secure renewal in last 0-6 days before expiration',
  version: '1.0.0',

  trigger: {
    daysUntilRenewal: {
      min: 0,
      max: 6
    },
    earlyTriggers: [
      {
        condition: 'critical_workflow_incomplete_at_day_6',
        description: 'Critical workflow not resolved with 6 days remaining'
      },
      {
        condition: 'renewal_marked_emergency',
        description: 'CSM manually marks renewal as emergency'
      }
    ]
  },

  context: {
    systemPrompt: `
You are an AI assistant helping Customer Success Managers with EMERGENCY RENEWAL SITUATIONS.

The renewal date is 0-6 days away. This is EXTREME URGENCY - the absolute final chance to save this renewal.

Your role:
1. Conduct rapid status check (what's the current state?)
2. Execute final push (last-ditch effort to secure renewal)
3. Accept outcome (renewal secured or churn preparation)
4. Document everything for post-mortem analysis

EMERGENCY GUIDELINES:
- Time is measured in HOURS, not days. Every hour matters.
- Be brutally honest about the situation. No sugarcoating.
- CEO involvement expected for deals >$100K ARR.
- If customer says "no", accept it gracefully and prepare for churn.
- Offer short-term extensions (1 week, 1 month) to buy time if needed.
- Focus on what's achievable in the time remaining, not ideal outcomes.
- Document everything - this will be a learning opportunity regardless of outcome.

DECISION POINT:
By the end of this workflow, there are only 3 outcomes:
1. ✅ Renewal secured (full, alternative, or extension)
2. ⏳ Short-term extension bought more time
3. ❌ Churn confirmed - begin offboarding

This is not the time for lengthy analysis or interviews. Act decisively.

Remain professional, calm, and focused on the best possible outcome given the constraints.
    `
  },

  steps: [
    /**
     * STEP 0: EMERGENCY STATUS CHECK
     *
     * Rapid assessment of current situation. No lengthy analysis - just facts.
     */
    {
      id: 'emergency-status-check',
      name: 'Emergency Status Check',
      type: 'conditional_routing',
      description: 'Rapid assessment of renewal status with extreme urgency',

      execution: {
        llmPrompt: `
# EMERGENCY STATUS CHECK

**⏰ TIME REMAINING: {{workflow.daysUntilRenewal}} DAYS**
**Customer:** {{customer.name}}
**ARR at Risk:** {{workflow.renewalARR}}

---

## RAPID STATUS ASSESSMENT

Answer these questions with FACTS ONLY (no speculation):

### 1. CONTRACT STATUS
- [ ] Is contract fully executed (signed by both parties)? **YES / NO / PARTIAL**
- [ ] If NO or PARTIAL, what's blocking? [1 sentence]

### 2. PAYMENT STATUS
- [ ] Has payment been received? **YES / NO / SCHEDULED**
- [ ] If NO, what's the issue? [1 sentence]

### 3. CUSTOMER STANCE
- [ ] Has customer explicitly said they WILL renew? **YES / NO / UNCLEAR**
- [ ] Has customer explicitly said they WON'T renew? **YES / NO / UNCLEAR**
- [ ] Last customer contact: [Date/time]
- [ ] Customer responsiveness: **RESPONSIVE / SLOW / GHOSTING**

### 4. EXECUTIVE INVOLVEMENT
- [ ] Is VP CS aware and involved? **YES / NO**
- [ ] Is CEO aware (if >$100K ARR)? **YES / NO**
- [ ] Has executive-to-executive outreach happened? **YES / NO / SCHEDULED**

### 5. PREVIOUS ESCALATION
- [ ] Did this come from Critical workflow? **YES / NO**
- [ ] If YES, what emergency actions were taken? [List]
- [ ] If YES, what was the outcome? [1 sentence]

---

## ROUTING DECISION

Based on the status above, select ONE route:

### Route: RENEWAL_IN_PROGRESS ⏳
**Condition:** Contract signed OR customer confirmed renewal, just waiting on final admin steps
**Assessment:** Renewal is happening, just need to finalize paperwork/payment
**Urgency:** HIGH (ensure it doesn't slip through the cracks)
**Next Step:** Finalize administrative items, confirm completion

### Route: FINAL_PUSH_NEEDED 🚨
**Condition:** Customer hasn't committed yet, but is responsive and engaged
**Assessment:** Still a chance to close this - need final push
**Urgency:** EXTREME (CEO involvement if large deal)
**Next Step:** Final negotiation, executive involvement, last offers

### Route: CUSTOMER_GHOSTING_EMERGENCY 👻
**Condition:** Customer not responding, unclear if they'll renew
**Assessment:** Need to make contact IMMEDIATELY or accept loss
**Urgency:** CRITICAL (multi-channel blitz, in-person visit if possible)
**Next Step:** Emergency multi-channel outreach, physical visit, nuclear options

### Route: CUSTOMER_DECLINED_CHURN ❌
**Condition:** Customer explicitly said they won't renew or confirmed churn
**Assessment:** Renewal is lost - focus on graceful offboarding and learning
**Urgency:** HIGH (begin churn preparation immediately)
**Next Step:** Accept loss, prepare for churn, schedule post-mortem

### Route: EXTENSION_POSSIBLE 📅
**Condition:** Customer needs more time, willing to do short-term extension
**Assessment:** Can buy 1-4 weeks with extension to finalize full renewal
**Urgency:** HIGH (get extension signed immediately, then use time for full renewal)
**Next Step:** Offer 1-week or 1-month extension, finalize quickly

---

## YOUR ROUTING DECISION

**Selected Route:** [One of the 5 routes above]

**Reasoning (max 2 sentences):** [Why this route?]

**Time Remaining:** {{workflow.daysUntilRenewal}} days ({{workflow.hoursUntilRenewal}} hours)

**Recommended Action (1 sentence):** [What should happen in the next 4 hours?]

---

**Database Storage:**
- Table: emergency_status_checks
- Fields: customer_id, check_date, days_until_renewal, hours_until_renewal, contract_status, payment_status, customer_stance, executive_involvement, route_selected, reasoning, recommended_action
        `,
        processor: 'routers/emergencyStatusRouter.js',
        storeIn: 'emergency_status'
      },

      routing: {
        routes: [
          {
            id: 'RENEWAL_IN_PROGRESS',
            nextStepId: 'final-push',
            condition: 'Renewal confirmed, finalizing paperwork/payment'
          },
          {
            id: 'FINAL_PUSH_NEEDED',
            nextStepId: 'final-push',
            condition: 'Customer engaged, need final push to close'
          },
          {
            id: 'CUSTOMER_GHOSTING_EMERGENCY',
            nextStepId: 'final-push',
            condition: 'Customer not responding, emergency contact needed'
          },
          {
            id: 'CUSTOMER_DECLINED_CHURN',
            nextStepId: 'acceptance-and-preparation',
            condition: 'Customer confirmed non-renewal, begin churn prep'
          },
          {
            id: 'EXTENSION_POSSIBLE',
            nextStepId: 'final-push',
            condition: 'Customer willing to do short-term extension'
          }
        ],
        defaultRoute: 'final-push'
      },

      ui: {
        cardTitle: '🚨 EMERGENCY STATUS CHECK',
        cardDescription: 'Rapid assessment - time remaining: {{workflow.daysUntilRenewal}} days',

        artifacts: [
          {
            id: 'emergency-countdown',
            type: 'countdown',
            title: 'TIME REMAINING',

            config: {
              target: '{{customer.renewalDate}}',
              display: 'days_hours_minutes',
              size: 'xlarge',
              color: 'red',
              showMilliseconds: false,

              alerts: [
                {
                  threshold: '3_days',
                  message: '⚠️ 3 DAYS REMAINING',
                  severity: 'critical'
                },
                {
                  threshold: '1_day',
                  message: '🚨 24 HOURS REMAINING',
                  severity: 'critical'
                },
                {
                  threshold: '12_hours',
                  message: '🔥 12 HOURS REMAINING',
                  severity: 'critical'
                },
                {
                  threshold: '0',
                  message: '❌ RENEWAL DATE PASSED',
                  severity: 'critical'
                }
              ]
            }
          },
          {
            id: 'status-summary',
            type: 'status_grid',
            title: 'Current Status',

            config: {
              grid: [
                {
                  label: 'Contract',
                  value: '{{outputs.contract_status}}',
                  icon: '{{outputs.contract_status == "YES" ? "✅" : "❌"}}'
                },
                {
                  label: 'Payment',
                  value: '{{outputs.payment_status}}',
                  icon: '{{outputs.payment_status == "YES" ? "✅" : "❌"}}'
                },
                {
                  label: 'Customer Stance',
                  value: '{{outputs.customer_stance}}',
                  icon: '{{outputs.customer_stance == "YES" ? "✅" : "❌"}}'
                },
                {
                  label: 'Executive Involved',
                  value: '{{outputs.executive_involvement}}',
                  icon: '{{outputs.executive_involvement == "YES" ? "✅" : "⚠️"}}'
                }
              ]
            }
          },
          {
            id: 'route-decision',
            type: 'alert',
            title: 'Emergency Response Path',
            content: '**{{outputs.route_selected}}**: {{outputs.reasoning}}',
            severity: 'critical'
          },
          {
            id: 'next-4-hours',
            type: 'action_item',
            title: 'NEXT 4 HOURS',
            content: '{{outputs.recommended_action}}',
            style: {
              highlight: true,
              urgent: true
            }
          }
        ]
      }
    },

    /**
     * STEP 1: FINAL PUSH
     *
     * Last-ditch effort to secure renewal based on current situation.
     * This is the final chance - be decisive and accept realistic outcomes.
     */
    {
      id: 'final-push',
      name: 'Final Push',
      type: 'action',
      description: 'Execute final effort to secure renewal before expiration',

      execution: {
        llmPrompt: `
# FINAL PUSH

**Route:** {{emergency_status.route_selected}}
**Time Remaining:** {{workflow.daysUntilRenewal}} days ({{workflow.hoursUntilRenewal}} hours)

Based on the emergency status, execute the appropriate final push strategy.

---

## STRATEGY BY ROUTE

### IF ROUTE = RENEWAL_IN_PROGRESS ⏳

**Situation:** Renewal is happening, just need to finalize admin items.

**Actions (Execute in next 4 hours):**

1. **Contract Finalization**
   - [ ] If signatures pending: Call customer NOW, walk through DocuSign on phone
   - [ ] If waiting on vendor signature: Get VP CS or CEO to sign immediately (within 1 hour)
   - [ ] If waiting on legal review: Fast-track with legal team manager (30-minute SLA)

2. **Payment Processing**
   - [ ] If invoice sent but not paid: Call AP/finance directly, request immediate payment
   - [ ] If waiting on PO: Accept verbal PO, process immediately, paperwork can follow
   - [ ] If credit card: Process charge now (don't wait for signature if verbal commitment)

3. **Salesforce & Systems**
   - [ ] Update Salesforce to "Closed Won" as soon as contract signed
   - [ ] Provision access immediately (don't wait for payment if contract signed)
   - [ ] Send welcome-back email to customer

**Success Criteria:** Contract signed + payment received/scheduled within 24 hours

---

### IF ROUTE = FINAL_PUSH_NEEDED 🚨

**Situation:** Customer engaged but hasn't committed. Final negotiation needed.

**Actions (Execute in next 4 hours):**

1. **Executive Involvement (IMMEDIATE)**
   - [ ] {{#if workflow.renewalARR >= 100000}}CEO calls customer CEO/decision maker within 4 hours{{/if}}
   - [ ] {{#if workflow.renewalARR < 100000}}VP CS calls customer decision maker within 2 hours{{/if}}
   - [ ] Executive Sponsor sends personal appeal email (NOW)

2. **Final Offer (Best and Final)**
   - Emergency discount (up to 25% off with CEO approval)
   - Shortest possible contract (month-to-month, 3-month, 6-month)
   - Payment flexibility (Net-90, quarterly payments, split payment)
   - Reduced scope (fewer seats, downgrade tier, remove features)
   - Product roadmap commitment (specific features by specific dates)

3. **Urgency & Deadline**
   - Set HARD DEADLINE: "We need your decision by [DATE/TIME, max 24 hours from now]"
   - Explain consequences: "After [deadline], we cannot honor this pricing/these terms"
   - Be direct: "We want to keep you as a customer. What will it take?"

4. **Same-Day Decision Path**
   - [ ] Get verbal commitment on phone call
   - [ ] Send DocuSign immediately after verbal commit
   - [ ] Fast-track all approvals (legal, finance, executive) - 1-hour SLA
   - [ ] Process payment same day if possible

**Success Criteria:** Verbal commitment within 24 hours, contract signed within 48 hours

---

### IF ROUTE = CUSTOMER_GHOSTING_EMERGENCY 👻

**Situation:** Customer not responding. Need to make contact or accept loss.

**Actions (Execute in next 4 hours):**

1. **Multi-Channel BLITZ (Execute ALL simultaneously)**
   - [ ] Email: 3 different emails (different subject lines, escalating urgency)
   - [ ] Phone: Call desk phone, mobile, any other numbers (keep trying every 2 hours)
   - [ ] Text/SMS: Send text to mobile if available
   - [ ] LinkedIn: Send direct message + InMail
   - [ ] Physical mail: Overnight FedEx with contract and personal letter from CEO
   - [ ] In-person visit: If geographic proximity, GO TO THEIR OFFICE TODAY

2. **Executive-to-Executive (NUCLEAR OPTION)**
   - [ ] CEO calls customer CEO (even if unreachable, leave voicemail + email)
   - [ ] Board connections: If any board members have connections, activate NOW
   - [ ] Investor connections: If customer is VC-backed, reach through investors
   - [ ] Industry connections: Reach through mutual customers, partners, advisors

3. **Alternative Contacts**
   - [ ] Reach every single contact in account (IT, finance, other teams)
   - [ ] Ask: "Is [primary contact] still there? Are they the right person?"
   - [ ] Find anyone who can connect you to decision maker

4. **Acceptance Timeline**
   - Continue blitz for 24-48 hours (depending on time remaining)
   - {{#if workflow.daysUntilRenewal >= 3}}Continue through Day 2, then accept loss{{/if}}
   - {{#if workflow.daysUntilRenewal < 3}}Continue through today only, then accept loss{{/if}}
   - Document all contact attempts for post-mortem

**Success Criteria:** Make contact with decision maker, OR accept loss if no response by [deadline]

---

### IF ROUTE = EXTENSION_POSSIBLE 📅

**Situation:** Customer needs more time. Offer short-term extension to buy time.

**Actions (Execute in next 2 hours):**

1. **Extension Offer (Send IMMEDIATELY)**

**1-Week Extension:**
> "I understand you need more time to finalize the renewal. How about we do a 1-week extension at the same current rate? This keeps your service uninterrupted while you [complete budget approval / evaluate / make decision]. We can send a simple 1-page extension agreement that takes 5 minutes to sign. Sound good?"

**1-Month Extension:**
> "I understand timing is challenging right now. Let's do a 1-month extension at {{customer.currentARR / 12}} (monthly rate). This gives you time to [reason], and we'll work on a full annual renewal over the next month. Deal?"

2. **Extension Pricing**
   - 1-week: Pro-rated from annual (ARR / 52 weeks)
   - 1-month: Monthly rate (ARR / 12)
   - 3-month: Quarterly rate (ARR / 4)
   - NO PREMIUM - make it easy to say yes

3. **Fast Execution**
   - [ ] Send simple extension agreement (1 page, via DocuSign)
   - [ ] Get signed within 4 hours
   - [ ] Process immediately - don't wait for full renewal paperwork
   - [ ] Use extension period to finalize full renewal

4. **Extension Conditions**
   - Customer must sign extension by [tomorrow at latest]
   - During extension period, work toward full renewal
   - If no progress during extension, accept churn at end of extension

**Success Criteria:** Extension signed within 24 hours, buys time to close full renewal

---

## FINAL PUSH EXECUTION TRACKER

For each action above, track:

**Action:** [Description]
**Owner:** [Name - CEO, VP CS, CSM, Executive Sponsor]
**Deadline:** [Specific date/time within next 4-24 hours]
**Status:** [Not started / In progress / Complete / Failed]
**Outcome:** [Result, customer response]

---

## EXECUTIVE INVOLVEMENT PROTOCOL

**For deals >$250K ARR:**
- CEO makes direct customer outreach within 4 hours
- Board-level connections activated if available
- Personal letter from CEO via overnight FedEx

**For deals $100K-$250K ARR:**
- VP CS makes direct customer outreach within 4 hours
- Executive Sponsor sends personal appeal
- CEO available for call if needed

**For deals <$100K ARR:**
- VP CS or CSM Manager makes outreach within 4 hours
- Executive Sponsor sends email
- Escalate to VP CS if customer requests executive involvement

---

## REALITY CHECK

**Be honest with yourself:**

{{#if workflow.daysUntilRenewal <= 1}}
With 1 day or less remaining, we can realistically only close deals that are:
- Already verbally committed (just need signature)
- Willing to do immediate verbal commit + same-day DocuSign
- Willing to do short-term extension (1 week, 1 month)

If customer is "still evaluating" or "needs more time to decide", a full renewal is unlikely. Offer extension or accept churn.
{{/if}}

{{#if workflow.daysUntilRenewal > 1 && workflow.daysUntilRenewal <= 3}}
With 2-3 days remaining, we can still close deals, but only if:
- Customer is responsive and engaged
- Decision maker available for call/meeting
- Approval process is short (no lengthy procurement)

If customer is slow-responding or has long approval process, offer extension or accept churn.
{{/if}}

{{#if workflow.daysUntilRenewal > 3}}
With 4-6 days remaining, we have a fighting chance if:
- Customer is responsive
- Executive involvement happens immediately
- Best-and-final offer is compelling

But be realistic - if we're at Day 4-6 and customer hasn't committed, there's likely a real reason (budget cuts, competitive eval, dissatisfaction). Consider alternative options or prepare for loss.
{{/if}}

---

**Database Storage:**
- Table: final_push_attempts
- Fields: customer_id, push_date, route, time_remaining_days, time_remaining_hours, actions_taken (JSONB), executive_involvement, offers_made, customer_response, outcome_status
        `,
        processor: 'executors/finalPushExecutor.js',
        storeIn: 'final_push'
      },

      ui: {
        cardTitle: '🚨 FINAL PUSH',
        cardDescription: 'Last-ditch effort - {{workflow.hoursUntilRenewal}} hours remaining',

        artifacts: [
          {
            id: 'final-push-tracker',
            type: 'action_tracker',
            title: 'Final Push Action Tracker',

            config: {
              refreshInterval: 1800, // Every 30 minutes
              autoRefresh: true,

              actions: '{{outputs.actions_taken}}',

              columns: [
                { id: 'action', label: 'Action', width: '35%' },
                { id: 'owner', label: 'Owner', width: '20%' },
                { id: 'deadline', label: 'Deadline', width: '15%', highlight: 'overdue' },
                { id: 'status', label: 'Status', width: '15%' },
                { id: 'outcome', label: 'Outcome', width: '15%' }
              ],

              showCompletionPercent: true
            }
          },
          {
            id: 'executive-involvement',
            type: 'timeline',
            title: 'Executive Involvement',
            content: '{{outputs.executive_involvement}}'
          },
          {
            id: 'customer-response',
            type: 'chat_log',
            title: 'Customer Interactions',
            content: '{{outputs.customer_response}}',
            autoRefresh: true
          }
        ],

        actions: [
          {
            id: 'log-customer-interaction',
            label: 'Log Customer Interaction',
            type: 'primary',

            onExecute: {
              openModal: {
                type: 'form',
                config: {
                  title: 'Log Customer Interaction',
                  fields: [
                    {
                      id: 'interaction_type',
                      type: 'select',
                      label: 'Interaction Type',
                      options: ['Phone call', 'Email', 'Text/SMS', 'LinkedIn', 'In-person', 'Other']
                    },
                    {
                      id: 'contact_person',
                      type: 'text',
                      label: 'Contact Person',
                      placeholder: 'Who did you speak with?'
                    },
                    {
                      id: 'customer_response',
                      type: 'textarea',
                      label: 'Customer Response',
                      placeholder: 'What did they say? What is their stance?',
                      rows: 4,
                      required: true
                    },
                    {
                      id: 'next_steps',
                      type: 'textarea',
                      label: 'Next Steps',
                      placeholder: 'What are the next steps?',
                      rows: 2
                    },
                    {
                      id: 'will_renew',
                      type: 'select',
                      label: 'Will they renew?',
                      options: ['Yes - committed', 'Likely - positive signals', 'Uncertain - still deciding', 'Unlikely - negative signals', 'No - confirmed churn']
                    }
                  ],
                  onSubmit: {
                    apiEndpoint: 'POST /api/emergency-renewals/log-interaction',
                    payload: {
                      customer_id: '{{customer.id}}',
                      interaction_type: '{{form.interaction_type}}',
                      contact_person: '{{form.contact_person}}',
                      customer_response: '{{form.customer_response}}',
                      next_steps: '{{form.next_steps}}',
                      will_renew: '{{form.will_renew}}',
                      logged_by: '{{csm.email}}',
                      logged_at: '{{workflow.currentTimestamp}}'
                    }
                  }
                }
              }
            }
          },
          {
            id: 'send-extension-offer',
            label: 'Send Extension Offer',
            type: 'secondary',
            visible: '{{emergency_status.route_selected == "EXTENSION_POSSIBLE"}}',

            onExecute: {
              openModal: {
                type: 'form',
                config: {
                  title: 'Send Extension Offer',
                  fields: [
                    {
                      id: 'extension_duration',
                      type: 'select',
                      label: 'Extension Duration',
                      options: ['1 week', '2 weeks', '1 month', '3 months']
                    },
                    {
                      id: 'extension_price',
                      type: 'number',
                      label: 'Extension Price',
                      placeholder: 'Auto-calculated based on duration',
                      readonly: true,
                      value: '{{customer.currentARR / (extension_duration == "1 week" ? 52 : extension_duration == "2 weeks" ? 26 : extension_duration == "1 month" ? 12 : 4)}}'
                    },
                    {
                      id: 'extension_reason',
                      type: 'textarea',
                      label: 'Reason for Extension',
                      placeholder: 'Why does customer need more time?',
                      rows: 2
                    }
                  ],
                  onSubmit: {
                    apiEndpoint: 'POST /api/renewals/send-extension-offer',
                    payload: {
                      customer_id: '{{customer.id}}',
                      extension_duration: '{{form.extension_duration}}',
                      extension_price: '{{form.extension_price}}',
                      extension_reason: '{{form.extension_reason}}',
                      sent_by: '{{csm.email}}'
                    },

                    onSuccess: {
                      notification: {
                        type: 'success',
                        message: 'Extension offer sent to customer via DocuSign'
                      }
                    }
                  }
                }
              }
            }
          },
          {
            id: 'request-ceo-involvement',
            label: 'Request CEO Involvement',
            type: 'secondary',
            visible: '{{workflow.renewalARR >= 100000}}',

            onExecute: {
              apiEndpoint: 'POST /api/escalations/request-ceo',
              payload: {
                customer_id: '{{customer.id}}',
                arr_at_risk: '{{workflow.renewalARR}}',
                time_remaining: '{{workflow.hoursUntilRenewal}} hours',
                situation_summary: '{{emergency_status.reasoning}}',
                requested_action: 'CEO-to-CEO call within 4 hours',
                requested_by: '{{csm.email}}'
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: 'CEO involvement requested. Target response: 1 hour.'
                }
              }
            }
          }
        ]
      }
    },

    /**
     * STEP 1.5: MANDATORY TEAM ESCALATION
     *
     * Alert team and coordinate emergency response. No CSM operates alone at this stage.
     */
    {
      id: 'mandatory-team-escalation',
      name: 'Mandatory Team Escalation',
      type: 'action',
      description: 'Alert team and coordinate emergency response',

      execution: {
        llmPrompt: `
# MANDATORY TEAM ESCALATION

Emergency renewals require team coordination. No CSM operates alone at this stage.

---

## IMMEDIATE NOTIFICATIONS (Within 1 hour)

**All Emergency Renewals:**
- [ ] CSM Manager notified
- [ ] VP Customer Success notified
- [ ] Emergency logged in team dashboard

**>$50K ARR:**
- [ ] Executive Sponsor notified
- [ ] Daily team sync scheduled (CSM, Manager, VP CS)

**>$100K ARR:**
- [ ] CEO notified
- [ ] Twice-daily standups (morning + afternoon)
- [ ] Create Slack channel: #emergency-{{customer.slug}}

**Has Account Plan:**
- [ ] Notify entire Account Team (AE, CSM, SA, Executive Sponsor)
- [ ] Account Plan owner becomes co-pilot
- [ ] Update Account Plan with emergency status
- [ ] Link to Account Plan: [View Plan](/account-plans/{{customer.id}})

---

## TEAM SYNC STRUCTURE

**Daily Sync Agenda (15 minutes):**
1. Status update (what's changed in last 24 hours)
2. Blockers (what needs team help)
3. Actions (who's doing what today)
4. Decision needed (anything requiring approval)

**Attendees:**
- CSM (owner)
- CSM Manager (required)
- VP CS (>$50K)
- CEO (>$100K)
- Account Team (if account plan exists)

**Frequency:**
- Standard: Daily at 9am
- High-value (>$100K): Twice-daily at 9am + 3pm

---

## COLLABORATION SETUP

**Create Slack Channel:**
- Name: #emergency-{{customer.slug}}
- Members: Team sync attendees + Finance + Legal
- Purpose: Real-time coordination, fast decisions
- Pin: Situation brief, customer contact info, contract status

**Calendar Invite:**
- Daily standup (9am) OR twice-daily (9am + 3pm for >$100K)
- Duration: 15 minutes
- Recurring until renewal secured or lost
- Required attendees: CSM, Manager, VP CS

---

## MANAGER ACKNOWLEDGMENT REQUIRED

Before proceeding with emergency actions, CSM Manager must acknowledge:
- [ ] I have reviewed the emergency situation
- [ ] I am aware of the timeline and blockers ({{workflow.hoursUntilRenewal}} hours remaining)
- [ ] I commit to daily involvement until resolved

**This is a gate** - workflow cannot proceed without manager acknowledgment.

**Manager Signs Off:** {{manager.name}} on {{currentTimestamp}}

---

**Database Storage:**
- Table: team_escalations
- Fields: customer_id, workflow_stage (emergency), escalation_date, manager_notified, vp_cs_notified, ceo_notified, account_team_notified, slack_channel_created, team_sync_scheduled, manager_acknowledged, manager_acknowledged_by, manager_acknowledged_at
        `,
        processor: 'executors/teamEscalationExecutor.js',
        storeIn: 'team_escalation'
      },

      // Emergency escalation notifications
      notifications: [
        // Manager acknowledgment required (immediate)
        {
          type: 'approval_needed',
          title: 'Manager Acknowledgment Required',
          message: 'Emergency renewal for {{customer.name}} (${{customer.arr}}) requires your immediate acknowledgment. {{workflow.hoursUntilRenewal}} hours remaining until renewal.',
          priority: 1,
          recipients: ['{{csm.manager}}'],
          metadata: {
            customerId: '{{customer.id}}',
            workflowStage: 'emergency',
            hoursRemaining: '{{workflow.hoursUntilRenewal}}',
            arr: '{{customer.arr}}',
            requiresAcknowledgment: true,
            csmEmail: '{{csm.email}}',
            csmName: '{{csm.name}}'
          }
        },

        // CSM notification that manager was alerted
        {
          type: 'workflow_started',
          title: 'Emergency Team Escalation Initiated',
          message: 'Your manager has been notified about {{customer.name}} emergency renewal. They must acknowledge before you can proceed with emergency actions.',
          priority: 2,
          recipients: ['{{csm.email}}'],
          metadata: {
            customerId: '{{customer.id}}',
            managerNotified: true,
            managerEmail: '{{csm.manager}}'
          }
        },

        // High-value renewal: CEO notification
        {
          condition: '{{gte workflow.renewalARR 250000}}',
          type: 'escalation_required',
          title: 'High-Value Emergency Renewal',
          message: 'Emergency: ${{customer.arr}} renewal ({{customer.name}}) has {{workflow.hoursUntilRenewal}} hours remaining. Your visibility is requested.',
          priority: 1,
          recipients: ['{{company.ceo}}', '{{company.vpCustomerSuccess}}'],
          metadata: {
            customerId: '{{customer.id}}',
            arr: '{{customer.arr}}',
            hoursRemaining: '{{workflow.hoursUntilRenewal}}',
            highValue: true
          }
        },

        // Strategic account: Full team notification
        {
          condition: '{{customer.hasAccountPlan}}',
          type: 'escalation_required',
          title: 'Strategic Account Emergency',
          message: 'Strategic account {{customer.name}} in emergency status. Full account team has been alerted.',
          priority: 1,
          recipients: ['{{accountTeam.allEmails}}'],
          metadata: {
            customerId: '{{customer.id}}',
            isStrategic: true,
            hasAccountPlan: true,
            accountTeamNotified: true
          }
        }
      ],

      ui: {
        cardTitle: '👥 Mandatory Team Escalation',
        cardDescription: 'Coordinating emergency response - team involvement required',

        artifacts: [
          {
            id: 'escalation-status',
            type: 'checklist',
            title: 'Team Notification Status',
            config: {
              items: '{{outputs.team_notifications}}',
              showTimestamps: true,
              allowCheck: false
            }
          },
          {
            id: 'team-sync-schedule',
            type: 'timeline',
            title: 'Scheduled Team Syncs',
            content: '{{outputs.team_sync_schedule}}'
          },
          {
            id: 'account-plan-badge',
            type: 'badge',
            content: '⭐ Strategic Account - Account Plan Active',
            visible: '{{customer.hasAccountPlan}}',
            link: '/account-plans/{{customer.id}}',
            style: 'prominent'
          }
        ],

        actions: [
          {
            id: 'create-slack-channel',
            label: 'Create Emergency Slack Channel',
            type: 'primary',

            onExecute: {
              apiEndpoint: 'POST /api/collaboration/create-slack-channel',
              payload: {
                customer_id: '{{customer.id}}',
                channel_name: 'emergency-{{customer.slug}}',
                members: ['{{csm.email}}', '{{csm.manager}}', '{{company.vpCustomerSuccess}}', '{{#if customer.hasAccountPlan}}{{customer.accountPlan.team}}{{/if}}', '{{#if workflow.renewalARR >= 100000}}{{company.ceo}}{{/if}}'],
                purpose: 'Emergency coordination for {{customer.name}} renewal ({{workflow.hoursUntilRenewal}} hours remaining)'
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: 'Emergency Slack channel created: #emergency-{{customer.slug}}'
                }
              }
            }
          },
          {
            id: 'schedule-team-sync',
            label: 'Schedule Team Sync',
            type: 'primary',

            onExecute: {
              openModal: {
                type: 'calendar_scheduling',
                config: {
                  title: 'Schedule Emergency Team Sync',
                  attendees: {
                    required: ['{{csm.email}}', '{{csm.manager}}', '{{company.vpCustomerSuccess}}'],
                    optional: ['{{#if customer.hasAccountPlan}}{{customer.accountPlan.team}}{{/if}}', '{{#if workflow.renewalARR >= 100000}}{{company.ceo}}{{/if}}']
                  },
                  frequency: '{{workflow.renewalARR >= 100000 ? "twice_daily" : "daily"}}',
                  times: '{{workflow.renewalARR >= 100000 ? ["09:00", "15:00"] : ["09:00"]}}',
                  duration: 15,
                  until: 'renewal_resolved',
                  urgency: 'critical'
                }
              }
            }
          },
          {
            id: 'manager-acknowledge',
            label: 'Manager Acknowledgment (Required)',
            type: 'primary',
            requiresRole: 'manager',

            onExecute: {
              apiEndpoint: 'POST /api/team-escalations/manager-acknowledge',
              payload: {
                customer_id: '{{customer.id}}',
                workflow_stage: 'emergency',
                manager_email: '{{csm.manager}}',
                acknowledged_at: '{{workflow.currentTimestamp}}',
                hours_remaining: '{{workflow.hoursUntilRenewal}}'
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: 'Manager acknowledgment recorded. Emergency actions can now proceed.'
                },
                unlockNextStep: true,
                // Send notification to CSM and VP CS
                sendNotification: {
                  type: 'workflow_started',
                  title: 'Manager Acknowledged Emergency',
                  message: '{{csm.managerName}} has acknowledged {{customer.name}} emergency renewal. You can now proceed with emergency actions.',
                  priority: 2,
                  recipients: ['{{csm.email}}', '{{company.vpCustomerSuccess}}'],
                  metadata: {
                    customerId: '{{customer.id}}',
                    acknowledgedBy: '{{csm.managerName}}',
                    acknowledgedAt: '{{workflow.currentTimestamp}}',
                    managerEmail: '{{csm.manager}}'
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
                escalation_level: 'emergency',
                escalation_type: 'account_team',
                notification_targets: '{{customer.accountPlan.team}}',
                message: 'EMERGENCY: Strategic account {{customer.name}} has {{workflow.hoursUntilRenewal}} hours until renewal. Immediate account team involvement required.'
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: 'Account team notified of emergency renewal status'
                }
              }
            }
          }
        ]
      }
    },

    /**
     * STEP 2: ACCEPTANCE & PREPARATION
     *
     * Accept the outcome (renewal secured or churn confirmed) and prepare accordingly.
     */
    {
      id: 'acceptance-and-preparation',
      name: 'Acceptance & Preparation',
      type: 'analysis',
      description: 'Accept renewal outcome and prepare next steps',

      execution: {
        llmPrompt: `
# ACCEPTANCE & PREPARATION

Based on the final push outcome, accept the result and prepare for next steps.

---

## OUTCOME ASSESSMENT

**What happened?**

Review the final push results:
- Actions taken: {{final_push.actions_taken}}
- Customer response: {{final_push.customer_response}}
- Outcome status: {{final_push.outcome_status}}

**Select ONE outcome:**

### OUTCOME 1: ✅ RENEWAL SECURED

**Customer committed to renewal (full, alternative, or extension).**

**Preparation Steps:**

1. **Finalize Immediately**
   - [ ] If not already signed: Send DocuSign NOW, follow up until signed
   - [ ] If not already paid: Process payment NOW
   - [ ] Update Salesforce to "Closed Won"
   - [ ] Provision/maintain access (don't let it lapse)

2. **Customer Communication**
   - [ ] Send thank-you note from CSM
   - [ ] Send thank-you note from executive involved (CEO, VP CS)
   - [ ] Acknowledge it was close: "We know this came down to the wire. Let's make sure next year is smoother."
   - [ ] Schedule post-renewal check-in (within 2 weeks)

3. **Internal Debrief**
   - [ ] Schedule post-mortem with CSM, Manager, VP CS
   - [ ] Document: Why did this go to Emergency? What could we have done earlier?
   - [ ] Action items: What do we need to change to prevent this next time?

4. **Transition**
   - [ ] Return to Monitor workflow (180+ days)
   - [ ] Set early intervention triggers for next year (don't let this happen again)
   - [ ] Flag customer as "high touch" - needs more frequent check-ins

---

### OUTCOME 2: ⏳ EXTENSION SIGNED

**Customer signed short-term extension (1 week, 1 month, 3 months).**

**Preparation Steps:**

1. **Extension Management**
   - [ ] Confirm extension signed and payment received
   - [ ] Update Salesforce: Add extension as separate opportunity/line item
   - [ ] Set calendar reminder for extension end date
   - [ ] Don't let service lapse during extension period

2. **Use Extension Period Wisely**
   - [ ] Schedule call with customer within 48 hours: "Let's discuss the full renewal"
   - [ ] Address whatever blocker caused the delay (budget, evaluation, etc.)
   - [ ] Work toward full annual renewal during extension
   - [ ] If customer isn't progressing, accept churn at end of extension

3. **Transition**
   - {{#if extension_duration <= "1 month"}}
     - Remain in Emergency workflow during extension (don't drop vigilance)
     - Daily check-ins on full renewal progress
   {{/if}}
   - {{#if extension_duration > "1 month"}}
     - Move to Negotiate or Finalize workflow (depending on customer readiness)
     - Weekly check-ins on full renewal progress
   {{/if}}

---

### OUTCOME 3: ❌ CHURN CONFIRMED

**Customer explicitly declined renewal OR did not respond by renewal date.**

**This is the outcome we didn't want, but we must accept it professionally and learn from it.**

**Preparation Steps:**

1. **Immediate Actions**
   - [ ] Update Salesforce to "Closed Lost"
   - [ ] Document churn reason: [Budget cuts / Competitive loss / Product dissatisfaction / No response / Other]
   - [ ] Schedule offboarding timeline (when does access end?)
   - [ ] Notify internal teams: Product, Finance, Legal, Executive team

2. **Customer Communication (Graceful Exit)**
   - [ ] Send offboarding email: "We're sorry to see you go. Here's what to expect..."
   - [ ] Offer data export: "We'll provide all your data in [format] by [date]"
   - [ ] Maintain professionalism: "If circumstances change, we'd love to work together again."
   - [ ] Ask for feedback: "Would you be willing to share why you decided not to renew?"

3. **Offboarding Tasks**
   - [ ] Data export prepared and delivered to customer
   - [ ] Access deprovisioned on [date]
   - [ ] Final invoice (if any balance due)
   - [ ] Contract formally closed
   - [ ] Remove from CSM's active portfolio

4. **Post-Mortem (REQUIRED)**
   - [ ] Schedule post-mortem within 1 week: CSM, Manager, VP CS
   - [ ] Answer: What went wrong? When did we lose them? What could we have done differently?
   - [ ] Document lessons learned
   - [ ] Action items: Process changes, earlier interventions, product feedback

5. **Win-Back Strategy (Optional)**
   - [ ] If competitive loss: Track competitor performance, reach out in 6 months
   - [ ] If budget cuts: Reach out when budget resets (next fiscal year)
   - [ ] If dissatisfaction: Address issues in product roadmap, reach out in 1 year
   - [ ] Add to "win-back" list with target re-engagement date

6. **Transition**
   - Move to Overdue workflow (10-Overdue.ts) for formal churn processing and offboarding
   - Close Emergency workflow

---

## OUTCOME DECISION

**Selected Outcome:** [RENEWAL_SECURED / EXTENSION_SIGNED / CHURN_CONFIRMED]

**Reasoning:** [2-3 sentences explaining the outcome]

**Next Steps (top 3 immediate actions):**
1. [Action]
2. [Action]
3. [Action]

**Transition:** [Which workflow or state next?]

---

## POST-MORTEM PREPARATION

Regardless of outcome (success or failure), we need to learn from this emergency situation.

**Post-Mortem Questions:**

1. **Timeline Analysis:** When did this renewal start to go off track? (Discovery? Engage? Negotiate?)

2. **Root Cause:** What was the primary reason we ended up in Emergency? (Customer ghosting? Internal delays? Pricing objection? Product dissatisfaction?)

3. **Missed Opportunities:** What could we have done in earlier workflows to prevent this emergency?

4. **Process Improvements:** What changes should we make to workflows, triggers, or playbooks?

5. **CSM Performance:** Did CSM execute the earlier workflows effectively? Any coaching needed?

6. **Product/Service Issues:** Were there product/service issues that contributed to the emergency?

7. **Early Warning Signs:** What signals did we miss that this would be difficult?

**Post-Mortem Deliverable:**

Document with:
- Timeline of key events
- Root cause analysis
- Action items (owner + deadline)
- Process improvement recommendations
- Scheduled follow-up (30 days) to review action item progress

---

**Database Storage:**
- Table: renewal_outcomes
- Fields: customer_id, outcome_date, outcome_type (renewal_secured | extension_signed | churn_confirmed), outcome_details (JSONB), post_mortem_scheduled, post_mortem_date, lessons_learned, action_items
        `,
        processor: 'analyzers/renewalOutcomeAnalyzer.js',
        storeIn: 'renewal_outcome'
      },

      ui: {
        cardTitle: '📋 Acceptance & Preparation',
        cardDescription: 'Accepting outcome and preparing next steps',

        artifacts: [
          {
            id: 'outcome-summary',
            type: 'alert',
            title: 'Renewal Outcome',

            config: {
              content: '{{outputs.outcome_type}}: {{outputs.reasoning}}',
              severity: '{{outputs.outcome_type == "RENEWAL_SECURED" ? "success" : outputs.outcome_type == "EXTENSION_SIGNED" ? "warning" : "error"}}'
            }
          },
          {
            id: 'next-steps-checklist',
            type: 'checklist',
            title: 'Immediate Next Steps',

            config: {
              items: '{{outputs.next_steps}}',
              allowCheck: true,
              showProgress: true
            }
          },
          {
            id: 'post-mortem-prep',
            type: 'document',
            title: 'Post-Mortem Preparation',
            content: '{{outputs.post_mortem_questions}}',
            editable: true
          }
        ],

        actions: [
          {
            id: 'finalize-renewal',
            label: 'Finalize Renewal',
            type: 'primary',
            visible: '{{outputs.outcome_type == "RENEWAL_SECURED"}}',

            onExecute: {
              apiEndpoint: 'POST /api/renewals/finalize',
              payload: {
                customer_id: '{{customer.id}}',
                renewal_arr: '{{workflow.renewalARR}}',
                contract_signed: true,
                payment_received: true,
                salesforce_updated: true,
                finalized_by: '{{csm.email}}'
              },

              onSuccess: {
                notification: {
                  type: 'success',
                  message: '🎉 Renewal finalized! Transitioning to Monitor workflow.'
                }
              }
            }
          },
          {
            id: 'process-churn',
            label: 'Process Churn',
            type: 'primary',
            visible: '{{outputs.outcome_type == "CHURN_CONFIRMED"}}',

            onExecute: {
              openModal: {
                type: 'form',
                config: {
                  title: 'Process Churn',
                  fields: [
                    {
                      id: 'churn_reason',
                      type: 'select',
                      label: 'Churn Reason',
                      options: ['Budget cuts / cost', 'Competitive loss', 'Product dissatisfaction', 'Lack of usage / value', 'No response / ghosting', 'Company shutdown / acquisition', 'Other'],
                      required: true
                    },
                    {
                      id: 'churn_details',
                      type: 'textarea',
                      label: 'Churn Details',
                      placeholder: 'Additional context about why the customer churned',
                      rows: 3
                    },
                    {
                      id: 'competitor_name',
                      type: 'text',
                      label: 'Competitor (if applicable)',
                      visible: '{{form.churn_reason == "Competitive loss"}}'
                    },
                    {
                      id: 'access_end_date',
                      type: 'date',
                      label: 'Access End Date',
                      required: true
                    },
                    {
                      id: 'win_back_target',
                      type: 'date',
                      label: 'Win-Back Target Date (optional)',
                      placeholder: 'When should we attempt to win this customer back?'
                    }
                  ],
                  onSubmit: {
                    apiEndpoint: 'POST /api/churns/process',
                    payload: {
                      customer_id: '{{customer.id}}',
                      churn_reason: '{{form.churn_reason}}',
                      churn_details: '{{form.churn_details}}',
                      competitor_name: '{{form.competitor_name}}',
                      access_end_date: '{{form.access_end_date}}',
                      win_back_target: '{{form.win_back_target}}',
                      processed_by: '{{csm.email}}'
                    },

                    onSuccess: {
                      notification: {
                        type: 'info',
                        message: 'Churn processed. Transitioning to Overdue workflow for offboarding.'
                      }
                    }
                  }
                }
              }
            }
          },
          {
            id: 'schedule-post-mortem',
            label: 'Schedule Post-Mortem',
            type: 'secondary',

            onExecute: {
              openModal: {
                type: 'calendar_scheduling',
                config: {
                  title: 'Schedule Post-Mortem Meeting',
                  attendees: {
                    required: ['{{csm.email}}', '{{csm.manager}}', '{{company.vpCustomerSuccess}}'],
                    optional: []
                  },
                  duration: 60,
                  subject: 'Post-Mortem: {{customer.name}} Emergency Renewal',
                  description: 'Review emergency renewal outcome, identify lessons learned, and create action items for process improvement.',
                  suggestedTimes: 'next_week',
                  attach: '{{outputs.post_mortem_prep}}'
                }
              }
            }
          }
        ]
      }
    },

    /**
     * STEP 3: ACTION PLAN
     *
     * Reuses the shared ActionPlanStep but with Emergency-specific context.
     */
    {
      ...ActionPlanStep,
      id: 'action-plan',

      execution: {
        ...ActionPlanStep.execution,
        llmPrompt: `
${ActionPlanStep.execution.llmPrompt}

---

**EMERGENCY RENEWAL CONTEXT:**

This is an EMERGENCY renewal with {{workflow.daysUntilRenewal}} days ({{workflow.hoursUntilRenewal}} hours) remaining.

**Outcome:** {{renewal_outcome.outcome_type}}

**Action Plan Focus Based on Outcome:**

### IF RENEWAL SECURED:
- Finalize all paperwork/payment immediately (within 24 hours)
- Customer thank-you and relationship repair
- Schedule post-mortem (within 1 week)
- Transition to Monitor workflow with "high touch" flag
- Set early intervention triggers for next year

### IF EXTENSION SIGNED:
- Daily check-ins during extension period
- Work toward full renewal before extension ends
- Address underlying blocker (budget, evaluation, etc.)
- If no progress by midpoint of extension, prepare for churn

### IF CHURN CONFIRMED:
- Execute offboarding plan (data export, access deprovision)
- Maintain professional relationship (graceful exit)
- Post-mortem (REQUIRED within 1 week)
- Win-back strategy (if applicable)
- Transition to Overdue workflow

**Next Workflow:**
- Renewal Secured → Monitor Workflow (180+ days)
- Extension Signed → Remain in Emergency or move to Finalize (depending on extension length)
- Churn Confirmed → Overdue Workflow (offboarding and post-churn activities)
        `
      },

      ui: {
        ...ActionPlanStep.ui,
        cardTitle: '📋 Emergency Action Plan',
        cardDescription: 'Outcome: {{renewal_outcome.outcome_type}} - Executing next steps'
      }
    }
  ]
};

export default EmergencyWorkflow;
