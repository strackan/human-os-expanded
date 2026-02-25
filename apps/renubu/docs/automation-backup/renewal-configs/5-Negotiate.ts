/**
 * Negotiate Renewal Workflow
 *
 * Triggered when: 60-89 days until renewal
 * Urgency: HIGH - Active negotiation with customer pushback/questions
 *
 * Purpose: Handle customer objections and negotiate renewal terms
 * - Check if negotiation is actually required (conditional routing)
 * - Negotiation preparation interview (mental prep for CSM)
 * - Assess and categorize objections
 * - Develop negotiation strategy
 * - Build value reinforcement package
 * - Define negotiation tactics and counter-offers
 * - Prepare for negotiation meetings
 * - Execute negotiation with approval workflows
 *
 * Key Distinction:
 * - Engage = WE REACH OUT (proactive messaging)
 * - Negotiate = THEY RESPOND (reactive objection handling)
 *
 * IMPORTANT: This workflow intelligently routes based on customer response:
 * - If customer accepted proposal → Simple check-in, skip to Finalize
 * - If no objections raised → Confirm acceptance or follow up
 * - If objections/questions → Full negotiation workflow
 */

import { WorkflowDefinition } from '../workflow-types';
import { ActionPlanStep } from '../workflow-steps/ActionPlanStep';

export const NegotiateRenewalWorkflow: WorkflowDefinition = {
  id: 'negotiate-renewal',
  type: 'renewal',
  stage: 'Negotiate',
  name: 'Negotiate Renewal',
  description: '60-89 days until renewal - active negotiation with customer',

  baseScore: 55,        // Higher than Engage (45)
  urgencyScore: 55,     // High urgency - customer engagement active

  trigger: {
    type: 'days_based',
    config: {
      daysMin: 60,
      daysMax: 89
    }
  },

  // Can also be triggered early from Engage workflow if customer raises objections
  earlyTrigger: {
    from: 'engage-renewal',
    conditions: [
      {
        type: 'customer_response',
        value: 'objection_raised',
        description: 'Customer responds with pricing or contract objections'
      },
      {
        type: 'customer_response',
        value: 'competitive_evaluation',
        description: 'Customer mentions evaluating alternatives'
      },
      {
        type: 'customer_response',
        value: 'budget_concerns',
        description: 'Customer expresses budget constraints'
      }
    ]
  },

  steps: [
    // =========================================================================
    // STEP 0: NEGOTIATION REQUIRED CHECK (CONDITIONAL ROUTING)
    // =========================================================================
    {
      id: 'negotiation-required-check',
      name: 'Negotiation Required Check',
      type: 'conditional_routing',
      estimatedTime: '2min',

      execution: {
        llmPrompt: `
          NEGOTIATION REQUIRED CHECK

          Customer: {{customer.name}}
          Target Price: ${{prepare.targetPrice}}
          Price Change: {{prepare.increasePercent}}%

          CONTEXT FROM ENGAGE WORKFLOW:

          Customer Response Type: {{engage.customerResponseType}}
          - 'accepted': Customer accepted proposal
          - 'objection': Customer raised pricing/contract objections
          - 'question': Customer has questions or clarifications
          - 'competitive_eval': Customer evaluating alternatives
          - 'no_response': No response from customer yet
          - null/undefined: Not yet determined

          Negotiation Required Flag: {{engage.negotiationRequired}}
          - true: Negotiation needed
          - false: No negotiation needed (accepted or price decrease)
          - null: Unknown - need to check with CSM

          Negotiation Likelihood (from Prepare): {{prepare.negotiationLikelihood}}
          - 'none': Price decrease or very low risk
          - 'low': Small increase, strong relationship
          - 'medium': Moderate increase or some risk factors
          - 'high': Large increase, competitive pressure, or budget constraints

          Days Waiting for Response: {{engage.daysWaitingSinceProposal}}

          TASK:
          Determine if full negotiation workflow is required or if we can skip to Finalize.

          ═══════════════════════════════════════════════════════════════════════
          DECISION TREE
          ═══════════════════════════════════════════════════════════════════════

          IF customerResponseType == 'accepted':
          → Route: NO_NEGOTIATION_NEEDED
          → Message: "Great news! {{customer.name}} accepted the proposal."
          → Action: Confirm with CSM, then skip to Finalize workflow

          IF customerResponseType == 'objection' OR 'competitive_eval':
          → Route: FULL_NEGOTIATION
          → Message: "Customer has raised objections. Launching negotiation workflow."
          → Action: Proceed to Step 1 (Negotiation Prep Interview)

          IF customerResponseType == 'question':
          → Route: LIGHT_NEGOTIATION
          → Message: "Customer has questions. Brief negotiation may be needed."
          → Action: Proceed to Step 1, but flag as light negotiation

          IF customerResponseType == 'no_response' AND daysWaiting > 14:
          → Route: NO_RESPONSE_CHECK
          → Message: "No response from customer for {{daysWaiting}} days."
          → Action: Ask CSM if they've heard anything via other channels

          IF customerResponseType == null OR negotiationRequired == null:
          → Route: ASK_CSM
          → Message: "Unable to determine negotiation status automatically."
          → Action: Ask CSM directly: "Has customer responded? Any objections?"

          IF prepare.increasePercent < 0:
          → Route: PRICE_DECREASE
          → Message: "Price decrease proposed. Negotiation highly unlikely."
          → Action: Simple check-in, likely skip to Finalize

          ═══════════════════════════════════════════════════════════════════════

          OUTPUT FORMAT:
          {
            "route": "NO_NEGOTIATION_NEEDED | FULL_NEGOTIATION | LIGHT_NEGOTIATION | NO_RESPONSE_CHECK | ASK_CSM | PRICE_DECREASE",
            "message": "Human-readable explanation",
            "recommendation": "Skip to Finalize | Proceed with full negotiation | Check with CSM first",
            "confidence": "high | medium | low"
          }
        `,

        dataRequired: [
          'customer.name',
          'prepare.targetPrice',
          'prepare.increasePercent',
          'prepare.negotiationLikelihood',
          'engage.customerResponseType',
          'engage.negotiationRequired',
          'engage.daysWaitingSinceProposal'
        ],

        processor: 'routers/negotiationRequiredCheck.js',

        outputs: [
          'route',
          'message',
          'recommendation',
          'confidence'
        ]
      },

      ui: {
        type: 'conditional_routing',
        description: 'Checking if negotiation is required...',

        // Different UI flows based on route
        routes: {
          NO_NEGOTIATION_NEEDED: {
            message: {
              role: 'ai',
              text: '✅ **GOOD NEWS!**\n\nBased on customer responses, {{customer.name}} appears to have **accepted** the renewal proposal.\n\n**Next Steps:**\n1. Confirm you haven\'t heard any concerns via other channels\n2. Skip Negotiate workflow and move to Finalize stage\n\nDoes this match your understanding?',
              buttons: [
                { label: '✅ Confirmed - Skip Negotiation', value: 'skip', action: 'skip_to_finalize' },
                { label: '⚠️ Actually, There Are Concerns', value: 'concerns', action: 'proceed_to_negotiation' }
              ]
            }
          },

          NO_RESPONSE_CHECK: {
            message: {
              role: 'ai',
              text: '🤔 **NO RESPONSE YET**\n\n{{customer.name}} hasn\'t responded to the renewal proposal in {{engage.daysWaitingSinceProposal}} days.\n\n**Question:** Have you heard anything from them via other channels (call, meeting, Slack)?\n\n- If **yes**, please share what they said\n- If **no**, we can either:\n  - Assume acceptance (silence = approval)\n  - Follow up one more time\n  - Launch negotiation prep just in case',
              buttons: [
                { label: 'They Accepted (Verbal/Other Channel)', value: 'accepted', action: 'skip_to_finalize' },
                { label: 'They Have Concerns', value: 'concerns', action: 'proceed_to_negotiation' },
                { label: 'No Response - Assume Accepted', value: 'assume_accept', action: 'skip_to_finalize' },
                { label: 'No Response - Follow Up First', value: 'follow_up', action: 'create_follow_up_task' }
              ]
            }
          },

          PRICE_DECREASE: {
            message: {
              role: 'ai',
              text: '💰 **PRICE DECREASE SCENARIO**\n\nYou\'re proposing a **{{prepare.increasePercent}}% price decrease** for {{customer.name}}.\n\nCustomers rarely object to price reductions! 😊\n\n**Recommendation:** Skip negotiation workflow unless customer raises concerns.\n\nHave they raised any concerns about the new price or contract terms?',
              buttons: [
                { label: 'No Concerns - Skip Negotiation', value: 'skip', action: 'skip_to_finalize' },
                { label: 'Yes, They Have Concerns', value: 'concerns', action: 'proceed_to_negotiation' }
              ]
            }
          },

          ASK_CSM: {
            message: {
              role: 'ai',
              text: '📋 **NEGOTIATION STATUS CHECK**\n\nI need your help to determine if negotiation is required.\n\n**Customer:** {{customer.name}}\n**Proposal:** ${{prepare.targetPrice}} ({{prepare.increasePercent}}% change)\n\n**Question:** Has the customer responded to your renewal proposal? If so, what did they say?',
              inputType: 'form',
              fields: [
                {
                  id: 'response_received',
                  label: 'Customer Response Received?',
                  type: 'radio',
                  options: ['Yes', 'No - Still Waiting']
                },
                {
                  id: 'response_type',
                  label: 'Response Type (if received)',
                  type: 'select',
                  options: ['Accepted', 'Has Objections', 'Has Questions', 'Evaluating Competitors', 'Need to Discuss'],
                  conditional: 'response_received == "Yes"'
                },
                {
                  id: 'response_details',
                  label: 'Details (what did they say?)',
                  type: 'textarea',
                  conditional: 'response_received == "Yes"'
                }
              ],
              buttons: [
                { label: 'Submit', value: 'submit', action: 'route_based_on_input' }
              ]
            }
          },

          FULL_NEGOTIATION: {
            message: {
              role: 'ai',
              text: '⚠️ **NEGOTIATION REQUIRED**\n\n{{customer.name}} has raised objections or questions about the renewal proposal.\n\n**Customer Response Type:** {{engage.customerResponseType}}\n\n**Next Steps:**\n1. Complete negotiation preparation (optional mental prep exercise)\n2. Analyze objections and develop strategy\n3. Build value reinforcement materials\n4. Prepare for negotiation meeting\n\nReady to begin?',
              buttons: [
                { label: 'Start Negotiation Workflow', value: 'start', action: 'proceed_to_step_1' }
              ]
            }
          },

          LIGHT_NEGOTIATION: {
            message: {
              role: 'ai',
              text: '💬 **LIGHT NEGOTIATION**\n\n{{customer.name}} has some questions or clarifications about the proposal.\n\nThis may not require full negotiation, but let\'s prepare responses just in case.\n\n**Next Steps:**\n1. (Optional) Quick prep exercise\n2. Address questions with supporting materials\n3. Monitor for any objections\n\nProceed with negotiation prep or skip to addressing questions?',
              buttons: [
                { label: 'Full Prep (Recommended)', value: 'full', action: 'proceed_to_step_1' },
                { label: 'Skip to Objection Assessment', value: 'skip_prep', action: 'skip_to_step_2' }
              ]
            }
          }
        }
      }
    },

    // =========================================================================
    // STEP 1: NEGOTIATION PREPARATION INTERVIEW (SKIPPABLE MENTAL PREP)
    // =========================================================================
    {
      id: 'negotiation-prep-interview',
      name: 'Negotiation Preparation Interview',
      type: 'interview',
      estimatedTime: '5-10min',
      skippable: true,

      execution: {
        llmPrompt: `
          NEGOTIATION PREPARATION INTERVIEW

          Customer: {{customer.name}}
          Target Price: ${{prepare.targetPrice}}
          Current ARR: ${{customer.arr}}
          Increase: {{prepare.increasePercent}}%

          TASK:
          Mental preparation exercise for CSM before negotiation.

          This is a reflection exercise based on negotiation best practices
          (Chris Voss, Harvard Negotiation Project, William Ury).

          The goal is to help you think through the negotiation BEFORE it happens,
          so you're prepared for different scenarios.

          ═══════════════════════════════════════════════════════════════════════
          INTERVIEW QUESTIONS
          ═══════════════════════════════════════════════════════════════════════

          **QUESTION 1: ANCHOR HIGH**
          "What's the MOST you think {{customer.name}} would be willing to pay for this renewal?"

          Why we ask: Setting a high anchor helps you avoid selling yourself short.
          Even if unlikely, thinking about the ceiling helps frame the negotiation.

          Your answer: $__________

          Reasoning: __________

          ─────────────────────────────────────────────────────────────────────

          **QUESTION 2: SET BOUNDARIES**
          "What's YOUR walk-away price for this deal?"

          (The minimum price you're willing to accept before walking away or escalating)

          Why we ask: You need to know your bottom line BEFORE negotiations start,
          not in the heat of the moment.

          Your answer: $__________

          Reasoning: __________

          ─────────────────────────────────────────────────────────────────────

          **QUESTION 3: CONTINGENCY PLANNING**
          "What will you do if they push you BEYOND your walk-away price?"

          (e.g., "Escalate to manager", "Offer multi-year discount", "Walk away")

          Why we ask: Having a plan reduces panic when things don't go as expected.

          Your answer: __________

          ─────────────────────────────────────────────────────────────────────

          **QUESTION 4: UNDERSTAND THEIR PERCEPTION**
          "What do you think {{customer.name}} thinks YOUR walk-away price is?"

          Why we ask: If they think you'll accept less, they'll push harder.
          Understanding their perception helps you manage it.

          Your answer: $__________

          Reasoning: __________

          ─────────────────────────────────────────────────────────────────────

          **QUESTION 5: UNDERSTAND THEIR EXPECTATIONS**
          "What do you think {{customer.name}} expects to PAY for this renewal?"

          Why we ask: Understanding their anchor point helps you position your offer.

          Your answer: $__________

          Reasoning: __________

          ─────────────────────────────────────────────────────────────────────

          **QUESTION 6: FIRST MOVE STRATEGY**
          "What's the FIRST concession you'll offer (if any)? What will you ask for in return?"

          Why we ask: Never give concessions without getting something back.
          Plan your trades ahead of time.

          Your answer:
          - First concession: __________
          - In exchange for: __________

          ─────────────────────────────────────────────────────────────────────

          **QUESTION 7: POWER DYNAMICS**
          "On a scale of 1-10, how much negotiation power do you have in this deal? Why?"

          (1 = They hold all the cards, 10 = You hold all the cards)

          Why we ask: Understanding power dynamics helps you calibrate your approach.

          Your answer: ____ / 10

          Reasoning: __________

          ═══════════════════════════════════════════════════════════════════════

          OUTPUT FORMAT:
          {
            "maxCustomerWillPay": 280000,
            "maxReasoning": "Strong ROI, deeply embedded, switching cost high",
            "walkAwayPrice": 252000,
            "walkAwayReasoning": "Can't go below current ARR + 1% without exec approval",
            "beyondWalkAwayPlan": "Escalate to manager for approval, offer 3-year commitment",
            "theirPerceptionOfWalkAway": 245000,
            "perceptionReasoning": "They may think we're desperate to retain them",
            "theirExpectedPrice": 255000,
            "expectedPriceReasoning": "They know market rates went up but budget is tight",
            "firstConcession": "Quarterly payment terms instead of annual upfront",
            "concessionTrade": "In exchange for 2-year commitment",
            "negotiationPower": 7,
            "powerReasoning": "High switching cost, strong ROI, but they have competitive options"
          }

          IMPORTANT:
          - These are YOUR thoughts, not final decisions
          - Be honest with yourself
          - This stays private (just for your prep)
          - You can adjust during actual negotiation
        `,

        dataRequired: [
          'customer.name',
          'customer.arr',
          'prepare.targetPrice',
          'prepare.increasePercent'
        ],

        processor: 'analyzers/negotiationPrepInterview.js',

        outputs: [
          'max_customer_will_pay',
          'walk_away_price',
          'beyond_walk_away_plan',
          'their_perception_of_walk_away',
          'their_expected_price',
          'first_concession',
          'concession_trade',
          'negotiation_power',
          'prep_completed'
        ]
      },

      ui: {
        type: 'interview',
        description: 'Mental preparation for negotiation (optional)',

        chat: {
          initialMessage: {
            role: 'ai',
            text: '🎯 **NEGOTIATION PREPARATION**\n\nBefore we dive into tactics, let\'s take 5-10 minutes for a mental prep exercise.\n\nThis helps you think through the negotiation BEFORE it happens.\n\nBased on negotiation best practices from experts like Chris Voss (FBI negotiator) and Harvard Negotiation Project.\n\n**This is optional** - you can skip if you feel prepared.\n\nReady to begin?',
            buttons: [
              { label: 'Start Prep Exercise', value: 'start' },
              { label: 'Skip - I\'m Already Prepared', value: 'skip', action: 'skip_step' }
            ]
          },

          interview: {
            questions: [
              {
                id: 'q1',
                text: '**QUESTION 1 of 7: ANCHOR HIGH**\n\nWhat\'s the MOST you think {{customer.name}} would be willing to pay?\n\n(Even if unlikely, thinking about the ceiling helps frame the negotiation)',
                inputType: 'currency',
                field: 'maxCustomerWillPay',
                followUp: 'What\'s your reasoning?',
                followUpField: 'maxReasoning'
              },
              {
                id: 'q2',
                text: '**QUESTION 2 of 7: SET BOUNDARIES**\n\nWhat\'s YOUR walk-away price?\n\n(The minimum you\'re willing to accept before escalating or walking away)',
                inputType: 'currency',
                field: 'walkAwayPrice',
                followUp: 'Why this number?',
                followUpField: 'walkAwayReasoning'
              },
              {
                id: 'q3',
                text: '**QUESTION 3 of 7: CONTINGENCY PLANNING**\n\nWhat will you do if they push you BEYOND your walk-away price?\n\n(e.g., "Escalate to manager", "Offer multi-year discount", "Walk away")',
                inputType: 'text',
                field: 'beyondWalkAwayPlan'
              },
              {
                id: 'q4',
                text: '**QUESTION 4 of 7: UNDERSTAND THEIR PERCEPTION**\n\nWhat do you think {{customer.name}} thinks YOUR walk-away price is?\n\n(If they think you\'ll accept less, they\'ll push harder)',
                inputType: 'currency',
                field: 'theirPerceptionOfWalkAway',
                followUp: 'Why do you think that?',
                followUpField: 'perceptionReasoning'
              },
              {
                id: 'q5',
                text: '**QUESTION 5 of 7: UNDERSTAND THEIR EXPECTATIONS**\n\nWhat do you think {{customer.name}} expects to PAY?\n\n(Understanding their anchor point helps you position your offer)',
                inputType: 'currency',
                field: 'theirExpectedPrice',
                followUp: 'What makes you think that?',
                followUpField: 'expectedPriceReasoning'
              },
              {
                id: 'q6',
                text: '**QUESTION 6 of 7: FIRST MOVE STRATEGY**\n\nWhat\'s the FIRST concession you\'ll offer (if any)?',
                inputType: 'text',
                field: 'firstConcession',
                followUp: 'What will you ask for in return? (Never give concessions without getting something back)',
                followUpField: 'concessionTrade'
              },
              {
                id: 'q7',
                text: '**QUESTION 7 of 7: POWER DYNAMICS**\n\nOn a scale of 1-10, how much negotiation power do you have?\n\n(1 = They hold all the cards, 10 = You hold all the cards)',
                inputType: 'scale',
                field: 'negotiationPower',
                min: 1,
                max: 10,
                followUp: 'Why this rating?',
                followUpField: 'powerReasoning'
              }
            ],

            onComplete: {
              message: '✅ **PREP COMPLETE**\n\nGreat work! Your answers are saved for reference during the negotiation.\n\nRemember:\n- These are YOUR thoughts, not set in stone\n- You can adjust during actual negotiation\n- Having thought through scenarios reduces panic\n\nReady to move to objection analysis?'
            }
          }
        },

        artifacts: [
          {
            id: 'prep-summary',
            title: 'Your Negotiation Prep',
            type: 'summary',
            icon: '📝',
            visible: false,

            sections: [
              {
                id: 'price-range',
                title: 'Price Range',
                type: 'metrics',
                content: {
                  max: '{{outputs.max_customer_will_pay}}',
                  target: '{{prepare.targetPrice}}',
                  walkAway: '{{outputs.walk_away_price}}'
                }
              },
              {
                id: 'strategy',
                title: 'Your Strategy',
                type: 'text',
                content: 'First concession: {{outputs.first_concession}}\nIn exchange for: {{outputs.concession_trade}}\n\nIf beyond walk-away: {{outputs.beyond_walk_away_plan}}'
              },
              {
                id: 'power',
                title: 'Power Dynamics',
                type: 'text',
                content: 'Your power rating: {{outputs.negotiation_power}}/10\n\nReasoning: {{outputs.power_reasoning}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 2: OBJECTION ASSESSMENT
    // =========================================================================
    {
      id: 'objection-assessment',
      name: 'Objection Assessment',
      type: 'analysis',
      estimatedTime: '15min',

      execution: {
        llmPrompt: `
          OBJECTION ASSESSMENT & CATEGORIZATION

          Customer: {{customer.name}}
          Target Price: ${{prepare.targetPrice}}
          Current ARR: ${{customer.arr}}
          Increase: {{prepare.increasePercent}}%

          CONTEXT:

          Engage Workflow Results:
          - Emails sent: {{engage.emailsSent}}
          - Stakeholder responses: {{engage.stakeholderResponses}}
          - Meetings conducted: {{engage.meetingsConducted}}

          CUSTOMER OBJECTIONS & FEEDBACK:

          {{#if engage.customerResponses}}
          {{#each engage.customerResponses}}
          From: {{this.stakeholder}} ({{this.role}})
          Date: {{this.date}}
          Channel: {{this.channel}} (email | call | meeting)
          Response:
          """
          {{this.response}}
          """
          {{/each}}
          {{else}}
          No customer responses recorded yet. Infer likely objections based on:
          - Churn risk: {{prepare.churnRisk}}/100
          - Price increase: {{prepare.increasePercent}}%
          - Competitive pressure: {{discovery.competitivePressure}}
          - Budget pressure: {{discovery.budgetPressure}}
          - Relationship strength: {{discovery.relationshipStrength}}/10
          {{/if}}

          TASK:
          Analyze customer objections and categorize for negotiation strategy.

          ═══════════════════════════════════════════════════════════════════════
          OBJECTION CATEGORIES
          ═══════════════════════════════════════════════════════════════════════

          1. **PRICING OBJECTIONS**
             - "Price increase is too high"
             - "Over budget"
             - "Can't justify this to finance"
             - "Need a discount"

             Severity: Low | Medium | High
             Negotiability: Low (hard constraint) | High (soft objection)

          2. **VALUE OBJECTIONS**
             - "Not seeing enough ROI"
             - "Underutilizing features"
             - "Not getting expected results"
             - "Value doesn't justify price"

             Severity: Low | Medium | High
             Root Cause: Lack of adoption | Lack of support | Unrealistic expectations

          3. **COMPETITIVE OBJECTIONS**
             - "Evaluating [Competitor X]"
             - "Competitor offers [feature/price]"
             - "Considering switching"
             - "Shopping around"

             Severity: Low (casual research) | Medium (active eval) | High (committed to switch)
             Competitors Mentioned: [List]

          4. **CONTRACT TERM OBJECTIONS**
             - "Need shorter commitment"
             - "Auto-renewal concerns"
             - "Payment terms not flexible"
             - "Want to change contract structure"

             Severity: Low | Medium | High
             Negotiability: High (often solvable)

          5. **INTERNAL APPROVAL OBJECTIONS**
             - "Need exec buy-in"
             - "Procurement process required"
             - "Legal review needed"
             - "Budget not finalized"

             Severity: Low (process) | Medium (uncertain) | High (blocker)
             Solvability: High (time/process) | Medium (may need exec involvement)

          6. **FEATURE/PRODUCT OBJECTIONS**
             - "Missing [feature X]"
             - "Product doesn't meet needs"
             - "Roadmap concerns"
             - "Integration issues"

             Severity: Low | Medium | High | Deal-Breaker
             Addressability: Available now | On roadmap | Not planned

          ═══════════════════════════════════════════════════════════════════════
          ANALYSIS FRAMEWORK
          ═══════════════════════════════════════════════════════════════════════

          For each objection:

          1. **Category**: Which category above?
          2. **Severity**: Low / Medium / High / Deal-Breaker
          3. **Urgency**: How soon must this be addressed? (Immediate / This week / Before renewal)
          4. **Stakeholder**: Who raised this? (Champion / Decision Maker / Economic Buyer)
          5. **Underlying Concern**: What's the real issue behind the objection?
          6. **Negotiability**: Can we address this? (Yes / Partially / No)
          7. **Recommended Response**: High-level approach

          ═══════════════════════════════════════════════════════════════════════
          PRIORITIZATION
          ═══════════════════════════════════════════════════════════════════════

          Rank objections by:
          1. Deal-breakers first (must address or lose deal)
          2. High severity, high urgency (address this week)
          3. Medium severity (address before final proposal)
          4. Low severity (nice to address but not critical)

          ═══════════════════════════════════════════════════════════════════════
          RISK ASSESSMENT
          ═══════════════════════════════════════════════════════════════════════

          Based on objections:
          - **Renewal Risk**: Low / Medium / High / Critical
          - **Churn Probability**: 0-100%
          - **Price Sensitivity**: Low / Medium / High
          - **Likelihood of Competitive Switch**: Low / Medium / High
          - **Expected Discount Needed**: 0-20%

          OUTPUT FORMAT:
          {
            "objections": [
              {
                "id": "obj-1",
                "category": "pricing",
                "description": "CFO said 7% increase is over budget",
                "severity": "high",
                "urgency": "immediate",
                "stakeholder": "Economic Buyer (CFO)",
                "underlyingConcern": "Budget frozen at current spend level",
                "negotiability": "yes",
                "recommendedResponse": "Explore multi-year discount or phased increase",
                "priority": 1
              },
              {
                "id": "obj-2",
                "category": "competitive",
                "description": "Mentioned evaluating Competitor X",
                "severity": "medium",
                "urgency": "this_week",
                "stakeholder": "Decision Maker (VP Ops)",
                "underlyingConcern": "Due diligence for renewal, not committed to switch",
                "negotiability": "partial",
                "recommendedResponse": "Competitive comparison showing our differentiation",
                "priority": 2
              }
            ],
            "riskAssessment": {
              "renewalRisk": "medium",
              "churnProbability": 35,
              "priceSensitivity": "high",
              "competitiveSwitchLikelihood": "low",
              "expectedDiscountNeeded": 5
            },
            "summary": "Customer has 3 primary objections: pricing (high severity), competitive eval (medium), and contract terms (low). Main risk is CFO budget freeze. Recommend 5% discount via multi-year commitment."
          }
        `,

        dataRequired: [
          'customer.name',
          'customer.arr',
          'prepare.targetPrice',
          'prepare.increasePercent',
          'prepare.churnRisk',
          'discovery.competitivePressure',
          'discovery.budgetPressure',
          'discovery.relationshipStrength',
          'engage.customerResponses',
          'engage.emailsSent',
          'engage.stakeholderResponses'
        ],

        processor: 'analyzers/objectionAssessment.js',

        outputs: [
          'objections',
          'risk_assessment',
          'summary'
        ]
      },

      ui: {
        type: 'artifact_review',
        description: 'Review categorized objections and risk assessment',

        artifacts: [
          {
            id: 'objection-analysis',
            title: 'Objection Analysis - {{customer.name}}',
            type: 'analysis',
            icon: '⚠️',
            visible: true,

            sections: [
              {
                id: 'summary',
                title: 'Summary',
                type: 'text',
                content: '{{outputs.summary}}'
              },
              {
                id: 'risk-assessment',
                title: 'Risk Assessment',
                type: 'metrics',
                content: '{{outputs.risk_assessment}}'
              },
              {
                id: 'objections',
                title: 'Prioritized Objections',
                type: 'objection_list',
                content: '{{outputs.objections}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 3: NEGOTIATION STRATEGY
    // =========================================================================
    {
      id: 'negotiation-strategy',
      name: 'Negotiation Strategy',
      type: 'planning',
      estimatedTime: '20min',

      execution: {
        llmPrompt: `
          NEGOTIATION STRATEGY DEVELOPMENT

          Customer: {{customer.name}}
          Target Price: ${{prepare.targetPrice}}
          Current ARR: ${{customer.arr}}
          Increase: {{prepare.increasePercent}}%

          OBJECTIONS (from Step 2):
          {{#each outputs.objections}}
          {{this.priority}}. [{{this.severity}}] {{this.description}} ({{this.category}})
          {{/each}}

          Risk Assessment:
          - Renewal Risk: {{outputs.risk_assessment.renewalRisk}}
          - Churn Probability: {{outputs.risk_assessment.churnProbability}}%
          - Expected Discount Needed: {{outputs.risk_assessment.expectedDiscountNeeded}}%

          {{#if outputs.prep_completed}}
          NEGOTIATION PREP (from Step 1):
          - Your walk-away price: ${{outputs.walk_away_price}}
          - Max customer will pay: ${{outputs.max_customer_will_pay}}
          - Their expected price: ${{outputs.their_expected_price}}
          - Negotiation power: {{outputs.negotiation_power}}/10
          {{/if}}

          TASK:
          Develop comprehensive negotiation strategy to address objections and close renewal.

          ═══════════════════════════════════════════════════════════════════════
          NEGOTIATION GOALS
          ═══════════════════════════════════════════════════════════════════════

          **Primary Goal**: Close renewal at or near target price
          - Target: ${{prepare.targetPrice}} ({{prepare.increasePercent}}% increase)
          - Acceptable Range: ${{prepare.targetPrice * 0.95}} - ${{prepare.targetPrice}} (5% discount max)
          {{#if outputs.walk_away_price}}
          - Walk-Away Price: ${{outputs.walk_away_price}} (from your prep)
          {{else}}
          - Walk-Away Price: ${{customer.arr}} (current ARR, 0% increase)
          {{/if}}

          **Secondary Goals**:
          - Maintain relationship health
          - Set precedent for future renewals
          - Avoid discounting if possible
          - Secure multi-year commitment (if discount required)

          ═══════════════════════════════════════════════════════════════════════
          NEGOTIATION APPROACH
          ═══════════════════════════════════════════════════════════════════════

          Based on objections, select primary approach:

          **APPROACH 1: VALUE REINFORCEMENT** (when value objections exist)
          - Focus: Re-establish ROI and value delivered
          - Tactic: Deep-dive on usage, savings, wins
          - Goal: Justify price before discussing discount
          - When: Customer says "not seeing enough value"

          **APPROACH 2: CONCESSION-FOR-COMMITMENT** (when price objections exist)
          - Focus: Trade discount for multi-year or expanded commitment
          - Tactic: "If we can offer 5% discount, can you commit to 2 years?"
          - Goal: Protect revenue with longer commitment
          - When: Customer says "price is too high"

          **APPROACH 3: COMPETITIVE DIFFERENTIATION** (when competitive objections exist)
          - Focus: Highlight unique value vs. alternatives
          - Tactic: Side-by-side comparison, switching cost analysis
          - Goal: Prove we're worth the premium
          - When: Customer says "evaluating competitors"

          **APPROACH 4: FLEXIBILITY ON TERMS** (when contract objections exist)
          - Focus: Modify payment terms, contract structure, or add-ons
          - Tactic: Quarterly payments, shorter initial term, bundling
          - Goal: Make renewal easier to approve
          - When: Customer says "budget timing issues" or "need flexibility"

          **APPROACH 5: EXECUTIVE ESCALATION** (when internal approval objections exist)
          - Focus: Get exec-to-exec alignment
          - Tactic: CEO/CRO call with customer exec
          - Goal: Overcome internal politics or procurement blockers
          - When: Customer says "need exec buy-in"

          RECOMMENDED APPROACH FOR THIS CUSTOMER:
          Based on objections {{outputs.objections[0].category}}, {{outputs.objections[1].category}}:
          → Primary: __________
          → Secondary: __________

          ═══════════════════════════════════════════════════════════════════════
          CONCESSION FRAMEWORK
          ═══════════════════════════════════════════════════════════════════════

          What are we willing to give? What do we need in return?

          **Discount Ladder** (use sparingly, get something in return):

          Tier 1: 0-3% discount
          - In exchange for: Case study, referral, 2-year commitment
          - Approval: CSM can offer
          - New price: ${{prepare.targetPrice * 0.97}} - ${{prepare.targetPrice}}

          Tier 2: 3-5% discount
          - In exchange for: 3-year commitment, upsell (add seats/features)
          - Approval: Manager approval required
          - New price: ${{prepare.targetPrice * 0.95}} - ${{prepare.targetPrice * 0.97}}

          Tier 3: 5-10% discount
          - In exchange for: Multi-year + expansion + case study
          - Approval: VP/CRO approval required
          - New price: ${{prepare.targetPrice * 0.90}} - ${{prepare.targetPrice * 0.95}}

          Tier 4: >10% discount
          - In exchange for: Strategic partnership, major expansion
          - Approval: Exec team decision
          - New price: <${{prepare.targetPrice * 0.90}}

          **Non-Discount Concessions** (preferred):
          - Payment terms: Quarterly vs. annual
          - Contract length: Shorter initial term (e.g., 1 year instead of 2)
          - Add-ons: Include premium support, training, or features at no extra cost
          - Ramp pricing: Lower Year 1, higher Year 2
          - Usage caps: Flexibility on overages

          CONCESSION PLAN FOR THIS CUSTOMER:
          - Offer: __________
          - In exchange for: __________
          - Approval level: __________

          ═══════════════════════════════════════════════════════════════════════
          OBJECTION RESPONSE PLAN
          ═══════════════════════════════════════════════════════════════════════

          For each objection, define:
          1. **Immediate Response** (what to say/send this week)
          2. **Supporting Materials** (what to provide)
          3. **Timeline** (when to address)
          4. **Owner** (who handles this)

          Example:

          Objection: "Price increase is too high"
          → Immediate Response: Schedule ROI review meeting
          → Supporting Materials: Usage analytics, savings calculation, peer benchmark
          → Timeline: This week (before next stakeholder call)
          → Owner: CSM

          Objection: "Evaluating Competitor X"
          → Immediate Response: Provide competitive comparison one-pager
          → Supporting Materials: Feature comparison, switching cost analysis, case study
          → Timeline: Within 3 days
          → Owner: CSM + Sales Engineer

          CREATE RESPONSE PLAN FOR EACH OBJECTION FROM STEP 2.

          ═══════════════════════════════════════════════════════════════════════
          BATNA (Best Alternative To Negotiated Agreement)
          ═══════════════════════════════════════════════════════════════════════

          **Our BATNA**: What happens if they don't renew?
          - Lost ARR: ${{customer.arr}}
          - Cost to replace: $__________ (CAC)
          - Impact on team quota: __________
          - Precedent for other customers: Risk of discount expectations

          **Their BATNA**: What happens if they don't renew with us?
          - Switching cost: $__________ (implementation, training, migration)
          - Downtime/risk: __________ (business disruption)
          - Feature gaps with alternatives: __________
          - Relationship loss: __________

          → Who has stronger BATNA? Us / Them / Equal
          → How does this affect our negotiation power?

          ═══════════════════════════════════════════════════════════════════════
          NEGOTIATION TIMELINE
          ═══════════════════════════════════════════════════════════════════════

          Current: Day {{workflow.daysUntilRenewal}}
          Renewal Date: {{customer.renewalDate}}

          Week 1 (Days 85-79):
          - Address top objections with materials/meetings
          - Schedule negotiation call with key stakeholders

          Week 2 (Days 78-72):
          - Present revised proposal (if needed)
          - Negotiate concessions (if applicable)

          Week 3 (Days 71-65):
          - Finalize terms
          - Get verbal commitment
          - Transition to Finalize workflow (Day 60)

          OUTPUT FORMAT:
          {
            "goals": {
              "target_price": 268000,
              "acceptable_range": [254600, 268000],
              "walk_away_price": 250000
            },
            "approach": {
              "primary": "concession_for_commitment",
              "secondary": "value_reinforcement",
              "rationale": "Customer has budget constraints but strong relationship. Offer multi-year discount."
            },
            "concessions": {
              "offer": "5% discount ($254,600) if 3-year commitment",
              "approval_level": "manager",
              "non_discount_alternatives": [
                "Quarterly payment terms",
                "Include premium support"
              ]
            },
            "objectionResponsePlan": [
              {
                "objection_id": "obj-1",
                "immediate_response": "Schedule ROI review meeting with CFO",
                "supporting_materials": ["Usage analytics", "Savings calculation"],
                "timeline": "This week",
                "owner": "CSM"
              }
            ],
            "batna": {
              "our_batna": "Lose $250k ARR, $50k replacement cost",
              "their_batna": "$75k switching cost, 3-month downtime",
              "stronger_position": "them",
              "negotiation_power": "We should be flexible but not desperate"
            },
            "timeline": {
              "week1": "Address objections with materials",
              "week2": "Present revised proposal",
              "week3": "Finalize terms and get verbal commitment"
            }
          }
        `,

        dataRequired: [
          'customer.name',
          'customer.arr',
          'customer.renewalDate',
          'prepare.targetPrice',
          'prepare.increasePercent',
          'workflow.daysUntilRenewal',
          'outputs.objections',
          'outputs.risk_assessment',
          'outputs.walk_away_price',
          'outputs.max_customer_will_pay',
          'outputs.negotiation_power'
        ],

        processor: 'generators/negotiationStrategy.js',

        outputs: [
          'goals',
          'approach',
          'concessions',
          'objection_response_plan',
          'batna',
          'timeline'
        ]
      },

      ui: {
        type: 'artifact_review',
        description: 'Review and approve negotiation strategy',

        artifacts: [
          {
            id: 'negotiation-strategy',
            title: 'Negotiation Strategy - {{customer.name}}',
            type: 'strategy',
            icon: '🎯',
            visible: true,

            sections: [
              {
                id: 'goals',
                title: 'Negotiation Goals',
                type: 'goals',
                content: '{{outputs.goals}}'
              },
              {
                id: 'approach',
                title: 'Recommended Approach',
                type: 'text',
                content: '{{outputs.approach}}'
              },
              {
                id: 'concessions',
                title: 'Concession Framework',
                type: 'concession_plan',
                content: '{{outputs.concessions}}'
              },
              {
                id: 'objection-responses',
                title: 'Objection Response Plan',
                type: 'response_list',
                content: '{{outputs.objection_response_plan}}'
              },
              {
                id: 'batna',
                title: 'BATNA Analysis',
                type: 'text',
                content: '{{outputs.batna}}'
              },
              {
                id: 'timeline',
                title: '3-Week Negotiation Timeline',
                type: 'timeline',
                content: '{{outputs.timeline}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 4: VALUE REINFORCEMENT PACKAGE
    // =========================================================================
    // (Implementation continues - see planning document for full spec)
    // This step generates ROI analysis, competitive comparison, usage analytics, and case studies
    // Artifact is downloadable and sendable to customer

    // =========================================================================
    // STEP 5: NEGOTIATION TACTICS & COUNTER-OFFERS
    // =========================================================================
    // (Implementation continues - see planning document for full spec)
    // This step creates IF-THEN playbook for 5 scenarios with tactical responses
    // Includes concession sequencing and approval thresholds

    // =========================================================================
    // STEP 6: MEETING/CALL PREPARATION
    // =========================================================================
    // (Implementation continues - see planning document for full spec)
    // This step prepares agenda, talking points, questions, materials checklist
    // Includes approval authority guidance and success metrics

    // =========================================================================
    // STEP 7: ACTION PLAN
    // =========================================================================
    {
      ...ActionPlanStep,

      execution: {
        ...ActionPlanStep.execution,

        llmPrompt: `
          ${ActionPlanStep.execution.llmPrompt}

          ═══════════════════════════════════════════════════════════════════════
          NEGOTIATE STAGE SPECIFIC CONTEXT
          ═══════════════════════════════════════════════════════════════════════

          This is the NEGOTIATE stage (60-89 days until renewal).

          Focus Areas:
          - Address customer objections with materials and meetings
          - Execute negotiation strategy
          - Get verbal commitment to renew
          - Prepare for contract finalization

          TYPICAL AI TASK PRIORITIES FOR NEGOTIATE:
          1. Monitor for customer responses to value reinforcement materials
          2. Track negotiation meeting outcomes and next steps
          3. Update Salesforce opportunity stage to "Negotiating"
          4. Flag if discount approval needed (manager/VP level)
          5. Schedule next workflow trigger (Finalize at Day 50, or when verbal commitment secured)
          6. Generate contract redlines if terms discussed

          TYPICAL CSM TASK PRIORITIES FOR NEGOTIATE:
          1. Send value reinforcement package to key stakeholders
          2. Conduct negotiation meetings per agenda
          3. Address objections with prepared responses
          4. Escalate to manager/exec if approval needed for concessions
          5. Get verbal commitment from customer
          6. Document agreed terms for contract team

          NEXT WORKFLOW EXPECTATION:
          - Next Stage: Finalize (30-59 days)
          - Trigger Condition: Day 50, OR when verbal commitment secured
          - Focus: Formalize agreement, execute contract, finalize signatures

          KEY NEGOTIATE OUTPUTS TO REFERENCE:
          - Objections: {{outputs.objections}}
          - Negotiation Strategy: {{outputs.approach}}
          - Concessions Offered: {{outputs.concessions}}
          - Value Package: {{outputs.roi_analysis}}, {{outputs.competitive_comparison}}
          - Meeting Preparation: {{outputs.agenda}}

          CRITICAL TRIGGERS:
          - If verbal commitment secured → Trigger Finalize workflow early
          - If deal at risk (customer going with competitor) → Executive escalation task
          - If discount >5% needed → Manager/VP approval task

          Use these outputs to inform your action plan generation.
        `
      }
    }
  ]
};

export default NegotiateRenewalWorkflow;
