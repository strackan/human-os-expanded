/**
 * Engage Renewal Workflow
 *
 * Triggered when: 90-119 days until renewal
 * Urgency: MEDIUM-HIGH - Active customer engagement with renewal proposal
 *
 * Purpose: Execute proactive outreach to customer with renewal proposal
 * - Stakeholder prioritization and sequencing
 * - Pricing communication strategy (how to present the increase)
 * - AI-generated email drafts (editable, sendable from artifact)
 * - Outreach execution timeline
 * - Scenario rehearsal (light objection handling prep)
 * - Action plan for outreach execution
 *
 * Key Distinction:
 * - Engage = WE REACH OUT (proactive messaging, proposal delivery)
 * - Negotiate = THEY RESPOND (handling objections, discussing terms)
 *
 * IMPORTANT: This is about OUTREACH PLANNING & EXECUTION, not negotiation.
 * Pricing is already locked in from Prepare workflow.
 */

import { WorkflowDefinition } from '../workflow-types';
import { ActionPlanStep } from '../workflow-steps/ActionPlanStep';

export const EngageRenewalWorkflow: WorkflowDefinition = {
  id: 'engage-renewal',
  type: 'renewal',
  stage: 'Engage',
  name: 'Engage Renewal',
  description: '90-119 days until renewal - active customer engagement with proposal',

  baseScore: 45,        // Higher than Prepare (35)
  urgencyScore: 45,     // Medium-high urgency

  trigger: {
    type: 'days_based',
    config: {
      daysMin: 90,
      daysMax: 119
    }
  },

  steps: [
    // =========================================================================
    // STEP 1: STAKEHOLDER PRIORITIZATION & SEQUENCING
    // =========================================================================
    {
      id: 'stakeholder-prioritization',
      name: 'Stakeholder Prioritization',
      type: 'planning',
      estimatedTime: '10min',

      execution: {
        llmPrompt: `
          STAKEHOLDER PRIORITIZATION & SEQUENCING

          Customer: {{customer.name}}
          Target Price: ${{prepare.targetPrice}}
          Price Increase: {{prepare.increasePercent}}%
          Renewal in: {{workflow.daysUntilRenewal}} days

          CONTEXT FROM PREVIOUS WORKFLOWS:

          Discovery Stakeholders:
          {{#each discovery.stakeholders}}
          - {{this.name}} ({{this.role}}): Relationship {{this.relationshipStrength}}/10, Sentiment: {{this.sentiment}}
          {{/each}}

          Prepare Engagement Strategy:
          - Recommended Sequence: {{prepare.stakeholderSequence}}
          - Engagement Approach: {{prepare.engagementApproach}}
          - Timing: {{prepare.engagementTiming}}

          TASK:
          Finalize stakeholder prioritization and contact sequence for renewal outreach.

          CONSIDERATIONS:

          1. **Who Controls the Decision?**
             - Economic Buyer: Signs contract, controls budget
             - Decision Maker: Evaluates options, makes recommendation
             - Champion: Internal advocate, influences decision
             - User: Day-to-day user, may block if unhappy

             In this case:
             {{#each discovery.stakeholders}}
             - {{this.name}}: {{this.role}} ({{this.influence}})
             {{/each}}

          2. **Relationship Strength by Stakeholder**
             Order by relationship strength:
             {{#each discovery.stakeholders}}
             {{this.relationshipStrength}}/10: {{this.name}} ({{this.role}})
             {{/each}}

          3. **Recommended Sequence Strategy**

             **Champion-First Approach** (low-medium risk):
             1. Champion (build internal support)
             2. Decision Maker (get business buy-in)
             3. Economic Buyer (present with backing)
             Pros: Build momentum, test messaging, champion advocates
             Cons: Takes longer, champion may lack influence

             **Economic Buyer-First Approach** (higher confidence):
             1. Economic Buyer (secure budget commitment)
             2. Decision Maker (operational approval)
             3. Champion (reinforce from users)
             Pros: Fast decision, shows confidence
             Cons: Risky if relationship weak or price sensitive

             **Parallel Approach** (time-constrained):
             1. Champion + Decision Maker (same day/week)
             2. Economic Buyer (after alignment)
             Pros: Efficient, builds consensus
             Cons: Harder to coordinate messaging

             Based on:
             - Price increase: {{prepare.increasePercent}}% (modest/significant?)
             - Churn risk: {{prepare.churnRisk}}/100
             - Relationship strength: {{discovery.relationshipStrength}}/10
             - Days until renewal: {{workflow.daysUntilRenewal}}

             Recommended: __________

          4. **Owner Assignment**
             Who sends each message?
             - CSM (relationship continuity)
             - Account Executive (commercial discussion)
             - Executive (C-level to C-level)

             Assign owner per stakeholder:
             - Champion: ________ (usually CSM)
             - Decision Maker: ________ (CSM or AE)
             - Economic Buyer: ________ (AE or Exec if price sensitive)

          5. **Timing & Cadence**
             Current date: {{workflow.currentDate}}
             Days until Day 90 (notice deadline): {{discovery.noticeDeadline - workflow.daysUntilRenewal}}

             Recommended timeline:
             - Week 1 (today): Champion outreach
             - Week 1-2 (+3-5 days): Decision Maker outreach
             - Week 2-3 (+7-10 days): Economic Buyer outreach
             - Week 3-4 (+14 days): Follow-ups and closing

             Adjust based on:
             - Stakeholder availability
             - Notice deadline urgency
             - Customer response speed

          OUTPUT FORMAT:
          {
            "sequence": [
              {
                "order": 1,
                "stakeholder": "Sarah Chen",
                "role": "Champion (VP Ops)",
                "owner": "CSM",
                "timing": "Week 1 (Day 115)",
                "rationale": "Strong relationship (8/10), will advocate internally",
                "objective": "Secure internal support and feedback before exec outreach"
              },
              {
                "order": 2,
                "stakeholder": "...",
                "role": "...",
                "owner": "...",
                "timing": "...",
                "rationale": "...",
                "objective": "..."
              },
              ...
            ],
            "approach": "champion_first | economic_buyer_first | parallel",
            "rationale": "Why this sequence makes sense given context",
            "riskMitigation": "How this sequence mitigates identified risks"
          }
        `,

        dataRequired: [
          'customer.name',
          'workflow.daysUntilRenewal',
          'prepare.targetPrice',
          'prepare.increasePercent',
          'prepare.stakeholderSequence',
          'prepare.engagementApproach',
          'discovery.stakeholders',
          'discovery.relationshipStrength',
          'discovery.noticeDeadline',
          'prepare.churnRisk'
        ],

        processor: 'generators/stakeholderSequence.js',

        outputs: [
          'sequence',
          'approach',
          'rationale',
          'risk_mitigation'
        ]
      },

      ui: {
        type: 'artifact_review',
        description: 'Review and approve stakeholder contact sequence',

        artifacts: [
          {
            id: 'stakeholder-sequence',
            title: 'Stakeholder Sequence - {{customer.name}}',
            type: 'sequence_plan',
            icon: '👥',
            visible: true,

            sections: [
              {
                id: 'sequence',
                title: 'Contact Sequence',
                type: 'ordered_list',
                content: '{{outputs.sequence}}'
              },
              {
                id: 'approach',
                title: 'Approach',
                type: 'text',
                content: 'Strategy: {{outputs.approach}}\n\nRationale: {{outputs.rationale}}'
              },
              {
                id: 'risk-mitigation',
                title: 'Risk Mitigation',
                type: 'text',
                content: '{{outputs.risk_mitigation}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 2: PRICING COMMUNICATION STRATEGY
    // =========================================================================
    {
      id: 'pricing-communication',
      name: 'Pricing Communication Strategy',
      type: 'planning',
      estimatedTime: '10min',

      execution: {
        llmPrompt: `
          PRICING COMMUNICATION STRATEGY

          Customer: {{customer.name}}
          Current Price: ${{customer.arr}}
          Target Price: ${{prepare.targetPrice}}
          Increase: {{prepare.increasePercent}}%
          Confidence: {{prepare.confidenceScore}}/100

          TASK:
          Decide HOW to communicate the pricing increase in your outreach.

          THE BIG QUESTION:
          How prominently should pricing be featured in initial outreach?

          ═══════════════════════════════════════════════════════════════════════
          OPTION 1: LEAD WITH PRICE
          ═══════════════════════════════════════════════════════════════════════

          Email Subject: "Acme Renewal - $268,000 Proposal for 2026"

          Body opens with:
          "We're proposing $268,000 for your 2026 renewal (7% increase from current $250k).
          Here's why this reflects the value you're realizing..."

          WHEN TO USE:
          - Small increase (3-5%)
          - Very strong relationship (9-10/10)
          - Customer expects transparency
          - No competitive pressure

          PROS:
          ✓ Transparent and direct
          ✓ Sets expectations immediately
          ✓ Shows confidence in value
          ✓ Avoids "gotcha" moment later

          CONS:
          ✗ Price becomes focus before value
          ✗ May trigger sticker shock
          ✗ Harder to backtrack if pushback

          ═══════════════════════════════════════════════════════════════════════
          OPTION 2: VALUE-FIRST, PRICE LATER
          ═══════════════════════════════════════════════════════════════════════

          Email Subject: "Acme 2026 Renewal - Your Success Story"

          Body structure:
          1. Value delivered ($52k savings, 35% usage growth)
          2. Continued partnership benefits
          3. "Investment for 2026: $268,000 (7% increase)"

          WHEN TO USE:
          - Moderate increase (5-8%)
          - Need to justify pricing
          - Strong ROI story exists
          - Budget-conscious buyer

          PROS:
          ✓ Anchors on value first
          ✓ Justifies increase before stating it
          ✓ Softens price impact
          ✓ Natural flow: value → price

          CONS:
          ✗ Price still in email (can't avoid)
          ✗ May feel manipulative if too salesy
          ✗ Requires strong value narrative

          ═══════════════════════════════════════════════════════════════════════
          OPTION 3: BURY THE PRICE
          ═══════════════════════════════════════════════════════════════════════

          Email Subject: "Your 2026 Renewal with [Company]"

          Body structure:
          1. Partnership recap
          2. Value highlights
          3. "Attached is your renewal proposal with terms for review"
          (Price only in PDF attachment, not email)

          WHEN TO USE:
          - Large increase (8%+)
          - Price-sensitive customer
          - Competitive evaluation likely
          - Want meeting first, then price

          PROS:
          ✓ Doesn't lead with price
          ✓ Encourages meeting request
          ✓ Allows verbal explanation first

          CONS:
          ✗ Can feel evasive
          ✗ Customer may not open attachment
          ✗ Delays pricing conversation
          ✗ May reduce trust

          ═══════════════════════════════════════════════════════════════════════
          OPTION 4: NO PRICE MENTIONED
          ═══════════════════════════════════════════════════════════════════════

          Email Subject: "Let's Discuss Your 2026 Renewal"

          Body structure:
          1. "Your renewal is coming up in 90 days"
          2. "Let's schedule time to discuss your goals and our partnership"
          3. No price mentioned, no proposal attached

          WHEN TO USE:
          - Very large increase or decrease
          - Relationship at risk
          - Complex negotiation expected
          - Need exec alignment first

          PROS:
          ✓ Most flexible
          ✓ Allows discovery first
          ✓ Can adjust based on meeting

          CONS:
          ✗ Delays decision
          ✗ Customer may demand price upfront
          ✗ Can signal lack of confidence
          ✗ Wastes time if price is non-negotiable

          ═══════════════════════════════════════════════════════════════════════
          RECOMMENDATION LOGIC
          ═══════════════════════════════════════════════════════════════════════

          Based on your context:

          Price Increase: {{prepare.increasePercent}}%
          → If <5%: Consider Option 1 (Lead with Price)
          → If 5-8%: Consider Option 2 (Value-First)
          → If >8%: Consider Option 3 or 4 (Bury or Defer)

          Relationship Strength: {{discovery.relationshipStrength}}/10
          → If >8: Can be more direct (Option 1 or 2)
          → If 6-8: Value-first safer (Option 2)
          → If <6: Defer to meeting (Option 4)

          Price Sensitivity: {{prepare.priceSensitivity}}
          → High: Bury or defer (Option 3 or 4)
          → Medium: Value-first (Option 2)
          → Low: Lead with price (Option 1)

          Competitive Pressure: {{discovery.competitivePressure}}
          → High: Defer to meeting (Option 4)
          → Medium: Value-first (Option 2)
          → Low: Direct (Option 1 or 2)

          YOUR DECISION:
          Based on the above factors, which approach do you want to take?

          Also consider:
          - Customer communication style (formal vs. casual)
          - Your relationship with each stakeholder
          - Whether stakeholder expects pricing upfront
          - Your confidence in defending the increase

          OUTPUT FORMAT:
          {
            "approach": "lead_with_price | value_first | bury_price | no_price",
            "rationale": "Why this approach makes sense for this customer",
            "stakeholderVariations": [
              {
                "stakeholder": "Champion",
                "approach": "value_first",
                "rationale": "Strong relationship, can explain increase"
              },
              {
                "stakeholder": "Economic Buyer",
                "approach": "lead_with_price",
                "rationale": "CFO expects transparency, modest increase"
              }
            ],
            "fallbackPlan": "If customer responds negatively to initial approach, pivot to..."
          }
        `,

        dataRequired: [
          'customer.arr',
          'prepare.targetPrice',
          'prepare.increasePercent',
          'prepare.confidenceScore',
          'discovery.relationshipStrength',
          'discovery.competitivePressure',
          'prepare.priceSensitivity'
        ],

        processor: 'generators/pricingCommunicationStrategy.js',

        outputs: [
          'approach',
          'rationale',
          'stakeholder_variations',
          'fallback_plan'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '💰 **PRICING COMMUNICATION STRATEGY**\n\nTarget Price: ${{prepare.targetPrice}} ({{prepare.increasePercent}}% increase)\n\nHow should we communicate the pricing increase?\n\n**Option 1:** Lead with Price (transparent, direct)\n**Option 2:** Value-First, Price Later (justify before stating)\n**Option 3:** Bury Price (in attachment only)\n**Option 4:** No Price Mentioned (defer to meeting)\n\nRecommendation based on {{prepare.increasePercent}}% increase and {{discovery.relationshipStrength}}/10 relationship: {{#if prepare.increasePercent < 5}}Option 1{{else if prepare.increasePercent < 8}}Option 2{{else}}Option 3 or 4{{/if}}',
            buttons: [
              { label: 'Lead with Price', value: 'lead' },
              { label: 'Value-First', value: 'value_first' },
              { label: 'Bury Price', value: 'bury' },
              { label: 'No Price', value: 'no_price' }
            ]
          }
        },

        artifacts: [
          {
            id: 'pricing-communication-strategy',
            title: 'Pricing Communication Strategy',
            type: 'plan',
            icon: '💬',
            visible: false,

            sections: [
              {
                id: 'approach',
                title: 'Selected Approach',
                type: 'text',
                content: '{{outputs.approach}}\n\nRationale: {{outputs.rationale}}'
              },
              {
                id: 'stakeholder-variations',
                title: 'Stakeholder-Specific Approaches',
                type: 'list',
                content: '{{outputs.stakeholder_variations}}'
              },
              {
                id: 'fallback',
                title: 'Fallback Plan',
                type: 'text',
                content: '{{outputs.fallback_plan}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 3: MESSAGE CRAFTING (EMAIL GENERATION)
    // =========================================================================
    {
      id: 'message-crafting',
      name: 'Message Crafting',
      type: 'outreach',
      estimatedTime: '15-20min',

      execution: {
        llmPrompt: `
          MESSAGE CRAFTING - RENEWAL OUTREACH EMAILS

          Customer: {{customer.name}}
          Target Price: ${{prepare.targetPrice}}
          Increase: {{prepare.increasePercent}}%

          CONTEXT:
          - Stakeholder Sequence: {{outputs.sequence}}
          - Pricing Communication: {{outputs.approach}}
          - Engagement Approach: {{prepare.engagementApproach}}

          TASK:
          Generate full email drafts for each stakeholder in the sequence.

          REQUIREMENTS:

          1. **Personalization**
             - Use stakeholder name, role, and relationship context
             - Reference specific interactions or wins
             - Match tone to stakeholder (exec = formal, champion = casual)

          2. **Pricing Communication**
             Follow the selected approach:
             - {{outputs.approach}}

          3. **Value Narrative**
             Include customer-specific value:
             - Quantified ROI: {{discovery.quantifiedValue}}
             - Usage growth: {{prepare.usageGrowth}}
             - Key wins: {{discovery.strengths}}

          4. **Call to Action**
             Clear next step:
             - Meeting request (with calendar link)
             - Reply for questions
             - Review attached proposal

          5. **Format**
             - Subject line
             - Email body (3-5 paragraphs)
             - Signature
             - Attachments (if applicable)

          GENERATE EMAILS FOR EACH STAKEHOLDER:

          {{#each outputs.sequence}}
          ─────────────────────────────────────────────────────────────────────
          EMAIL {{this.order}}: {{this.stakeholder}} ({{this.role}})
          ─────────────────────────────────────────────────────────────────────

          Stakeholder Context:
          - Relationship: {{this.relationshipStrength}}/10
          - Sentiment: {{this.sentiment}}
          - Owner: {{this.owner}}
          - Objective: {{this.objective}}

          Pricing Approach for this stakeholder:
          {{#if outputs.stakeholder_variations}}
          {{#each outputs.stakeholder_variations}}
          {{#if this.stakeholder == ../this.stakeholder}}
          - {{this.approach}}: {{this.rationale}}
          {{/if}}
          {{/each}}
          {{else}}
          - Default: {{outputs.approach}}
          {{/if}}

          Generate:
          - Subject: [compelling subject line]
          - Body: [personalized email with value narrative, pricing (if applicable), CTA]
          - Tone: [formal | professional | casual based on stakeholder]
          - Attachments: [if pricing in attachment: "Renewal Proposal - {{customer.name}} 2026.pdf"]

          {{/each}}

          OUTPUT FORMAT:
          {
            "emails": [
              {
                "stakeholder": "Sarah Chen",
                "role": "Champion (VP Ops)",
                "subject": "...",
                "body": "...",
                "tone": "professional",
                "attachments": [],
                "sendTiming": "Week 1 (Day 115)",
                "owner": "CSM"
              },
              ...
            ]
          }

          IMPORTANT:
          - Emails must be FULLY WRITTEN and READY TO SEND
          - Include merge fields for personalization (e.g., {{customer.name}})
          - Make them authentic, not robotic
          - Focus on partnership and value, not just transaction
        `,

        dataRequired: [
          'customer.name',
          'prepare.targetPrice',
          'prepare.increasePercent',
          'outputs.sequence',
          'outputs.approach',
          'outputs.stakeholder_variations',
          'prepare.engagementApproach',
          'discovery.quantifiedValue',
          'discovery.strengths',
          'prepare.usageGrowth'
        ],

        processor: 'generators/emailDraftGenerator.js',

        outputs: [
          'emails'
        ]
      },

      ui: {
        type: 'artifact_interaction',
        description: 'Review, edit, and send AI-generated email drafts',

        artifacts: [
          {
            id: 'email-drafts',
            title: 'Renewal Outreach Emails - {{customer.name}}',
            type: 'email_drafts',
            icon: '✉️',
            visible: true,
            editable: true,  // Can edit email content

            // Email draft artifact supports inline editing + actions
            config: {
              allowEditing: true,
              allowSending: true,
              allowSaveToDrafts: true,

              actions: [
                {
                  id: 'send-email',
                  label: 'Send Email',
                  type: 'primary',
                  requiresConfirmation: true,
                  confirmMessage: 'Send this email to {{stakeholder}}?',

                  onExecute: {
                    apiEndpoint: 'POST /api/emails/send',
                    payload: {
                      to: '{{stakeholder.email}}',
                      from: '{{currentUser.email}}',
                      subject: '{{email.subject}}',
                      body: '{{email.body}}',
                      attachments: '{{email.attachments}}',
                      trackEngagement: true,
                      customerId: '{{customer.id}}',
                      workflowExecutionId: '{{workflow.id}}'
                    },
                    onSuccess: {
                      createAITask: {
                        action: 'Track Email Engagement',
                        processor: 'email-engagement-tracker.js',
                        metadata: {
                          emailId: '{{response.emailId}}',
                          stakeholder: '{{stakeholder.name}}',
                          sentAt: '{{response.sentAt}}'
                        }
                      },
                      notification: 'Email sent to {{stakeholder}}',
                      updateArtifact: {
                        status: 'sent',
                        sentAt: '{{response.sentAt}}'
                      }
                    }
                  }
                },
                {
                  id: 'save-to-drafts',
                  label: 'Save to Drafts',
                  type: 'secondary',

                  onExecute: {
                    apiEndpoint: 'POST /api/emails/drafts',
                    payload: {
                      to: '{{stakeholder.email}}',
                      subject: '{{email.subject}}',
                      body: '{{email.body}}',
                      customerId: '{{customer.id}}'
                    },
                    onSuccess: {
                      notification: 'Email saved to drafts',
                      updateArtifact: {
                        status: 'draft',
                        savedAt: '{{response.savedAt}}'
                      }
                    }
                  }
                },
                {
                  id: 'preview',
                  label: 'Preview',
                  type: 'tertiary',

                  onExecute: {
                    openPreviewModal: true
                  }
                }
              ]
            },

            sections: [
              {
                id: 'email-list',
                title: 'Stakeholder Emails',
                type: 'email_cards',
                content: '{{outputs.emails}}',

                // Each email card shows:
                // - Stakeholder name + role
                // - Subject line (editable)
                // - Body preview (expandable, editable)
                // - Send timing
                // - Status (draft, sent, scheduled)
                // - Actions: Send, Save to Drafts, Preview, Edit
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 4: OUTREACH EXECUTION PLAN
    // =========================================================================
    {
      id: 'outreach-execution-plan',
      name: 'Outreach Execution Plan',
      type: 'planning',
      estimatedTime: '10min',

      execution: {
        llmPrompt: `
          OUTREACH EXECUTION PLAN

          Customer: {{customer.name}}
          Days until renewal: {{workflow.daysUntilRenewal}}
          Notice deadline: Day {{discovery.noticeDeadline}}

          Stakeholder Sequence:
          {{#each outputs.sequence}}
          {{this.order}}. {{this.stakeholder}} ({{this.timing}})
          {{/each}}

          TASK:
          Create detailed execution timeline with follow-up cadence.

          TIMELINE STRUCTURE:

          Week 1 (Days 115-111):
          - Day 115: Send email to {{outputs.sequence[0].stakeholder}}
          - Day 117: If no response, send polite follow-up
          - Day 118: If no response, call attempt

          Week 2 (Days 110-104):
          - Day 110: Send email to {{outputs.sequence[1].stakeholder}}
          - Day 112: Follow up on first email (if needed)
          - Day 113: If meeting scheduled, conduct meeting
          - Day 114: Send thank you / recap email

          Week 3 (Days 103-97):
          - Day 105: Send email to {{outputs.sequence[2].stakeholder}}
          - Day 107: Follow up
          - Day 100: Economic buyer meeting (if scheduled)

          Week 4 (Days 96-90):
          - Day 95: Final follow-ups
          - Day 92: Ensure all stakeholders aligned
          - Day 90: NOTICE DEADLINE - formal proposal delivered

          FOLLOW-UP RULES:

          No Response After 3 Days:
          → Send reminder: "Just wanted to make sure you saw my email about..."

          No Response After 7 Days:
          → Escalate: Different channel (call, exec intro, champion nudge)

          Meeting Scheduled:
          → Confirmation 2 days before
          → Recap email within 24 hours after
          → Track action items

          Objections Raised:
          → Document objection
          → Prepare response
          → If significant pushback → Flag for potential Negotiate stage trigger

          TRIGGERS:

          Positive Signal:
          → "Looks good, let's discuss details" → Accelerate timeline

          Neutral Signal:
          → "I'll review and get back to you" → Standard follow-up cadence

          Negative Signal:
          → "Price is too high" or "Evaluating alternatives" → Trigger Negotiate workflow early

          No Response:
          → After 2 weeks, escalate to exec level

          OUTPUT FORMAT:
          {
            "timeline": [
              {
                "day": 115,
                "date": "2025-11-15",
                "action": "Send email to Champion (Sarah Chen)",
                "owner": "CSM",
                "status": "pending"
              },
              {
                "day": 117,
                "date": "2025-11-17",
                "action": "Follow-up if no response from Champion",
                "owner": "CSM",
                "conditional": "if no response by Day 117",
                "status": "pending"
              },
              ...
            ],
            "followUpRules": {
              "noResponse3Days": "Send polite reminder email",
              "noResponse7Days": "Call or executive escalation",
              "meetingScheduled": "Confirmation 2 days prior, recap within 24 hours",
              "objectionsRaised": "Document and prepare response, flag for Negotiate"
            },
            "triggers": {
              "positiveSignal": "Accelerate to Day 90 notice",
              "negativeSignal": "Early Negotiate workflow trigger",
              "noResponse14Days": "Executive escalation"
            }
          }
        `,

        dataRequired: [
          'customer.name',
          'workflow.daysUntilRenewal',
          'discovery.noticeDeadline',
          'outputs.sequence'
        ],

        processor: 'generators/outreachExecutionPlan.js',

        outputs: [
          'timeline',
          'follow_up_rules',
          'triggers'
        ]
      },

      ui: {
        type: 'artifact_review',
        description: 'Review outreach timeline and follow-up plan',

        artifacts: [
          {
            id: 'execution-timeline',
            title: 'Outreach Execution Plan',
            type: 'timeline',
            icon: '📅',
            visible: true,

            sections: [
              {
                id: 'timeline',
                title: 'Execution Timeline',
                type: 'timeline_view',
                content: '{{outputs.timeline}}'
              },
              {
                id: 'follow-up-rules',
                title: 'Follow-Up Rules',
                type: 'rules_list',
                content: '{{outputs.follow_up_rules}}'
              },
              {
                id: 'triggers',
                title: 'Response Triggers',
                type: 'conditional_rules',
                content: '{{outputs.triggers}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 5: SCENARIO REHEARSAL (LIGHT)
    // =========================================================================
    {
      id: 'scenario-rehearsal',
      name: 'Scenario Rehearsal',
      type: 'planning',
      estimatedTime: '5-10min',

      execution: {
        llmPrompt: `
          SCENARIO REHEARSAL - OBJECTION HANDLING PREP

          Customer: {{customer.name}}
          Price Increase: {{prepare.increasePercent}}%
          Churn Risk: {{prepare.churnRisk}}/100

          TASK:
          Prepare CSM for likely customer responses with 1-2 key scenarios.

          Based on customer context, identify most likely objection scenarios:

          SCENARIO 1: [Most Likely Based on Context]

          If Churn Risk > 50 OR Price Increase > 7%:
          → **"That's a significant price increase"**

          If Budget Pressure High:
          → **"Budget is tight this year"**

          If Competitive Pressure:
          → **"We're evaluating other options"**

          If Relationship Weak (<6/10):
          → **"Let me think about it" (avoiding decision)**

          SCENARIO 2: [Second Most Likely]

          [Second most probable objection based on context]

          FOR EACH SCENARIO:

          **Customer Response (simulated):**
          [Realistic customer pushback quote]

          **Recommended Response:**
          1. Acknowledge: "I understand..."
          2. Reframe: "Let me share some context..."
          3. Value Anchor: "You've realized [X value]..."
          4. Bridge: "Would it help if we..."

          **Supporting Data to Reference:**
          - Usage growth: {{prepare.usageGrowth}}
          - Quantified value: {{discovery.quantifiedValue}}
          - Peer benchmark: {{prepare.peerBenchmarkRatio}}

          **Next Step:**
          - If soft objection → Schedule follow-up
          - If hard objection → Offer alternative (scenario review, exec call)

          OUTPUT FORMAT:
          {
            "scenarios": [
              {
                "scenario": "Price Increase Objection",
                "likelihood": "high",
                "customerResponse": "\"That's a 7% increase - that's more than we budgeted for.\"",
                "recommendedResponse": {
                  "acknowledge": "I completely understand budget considerations are critical...",
                  "reframe": "Let me share the context behind this pricing...",
                  "valueAnchor": "Your team has realized $52k in savings while usage grew 35%...",
                  "bridge": "Would it help to review the ROI breakdown together?"
                },
                "supportingData": [
                  "$52k quantified savings",
                  "35% usage growth",
                  "8% below peer average pricing"
                ],
                "nextStep": "Offer ROI review meeting to walk through value justification"
              },
              {
                "scenario": "...",
                ...
              }
            ]
          }

          IMPORTANT:
          - Keep it light (1-2 scenarios max)
          - Focus on most probable objections
          - Provide specific, actionable responses
          - Use customer's actual data for credibility
        `,

        dataRequired: [
          'customer.name',
          'prepare.increasePercent',
          'prepare.churnRisk',
          'discovery.budgetPressure',
          'discovery.competitivePressure',
          'discovery.relationshipStrength',
          'prepare.usageGrowth',
          'discovery.quantifiedValue',
          'prepare.peerBenchmarkRatio'
        ],

        processor: 'generators/scenarioRehearsal.js',

        outputs: [
          'scenarios'
        ]
      },

      ui: {
        type: 'artifact_review',
        description: 'Review likely objection scenarios and prepare responses',

        artifacts: [
          {
            id: 'scenario-rehearsal',
            title: 'Objection Scenarios - {{customer.name}}',
            type: 'scenario_cards',
            icon: '🎭',
            visible: true,

            sections: [
              {
                id: 'scenarios',
                title: 'Likely Objections & Responses',
                type: 'scenario_list',
                content: '{{outputs.scenarios}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 6: ACTION PLAN
    // =========================================================================
    {
      ...ActionPlanStep,

      execution: {
        ...ActionPlanStep.execution,

        llmPrompt: `
          ${ActionPlanStep.execution.llmPrompt}

          ═══════════════════════════════════════════════════════════════════════
          ENGAGE STAGE SPECIFIC CONTEXT
          ═══════════════════════════════════════════════════════════════════════

          This is the ENGAGE stage (90-119 days until renewal).

          Focus Areas:
          - Execute proactive outreach with renewal proposal
          - Track stakeholder engagement and responses
          - Handle initial questions (not full negotiation yet)
          - Progress toward verbal commitment

          TYPICAL AI TASK PRIORITIES FOR ENGAGE:
          1. Track email engagement (opens, clicks, replies) for sent emails
          2. Set follow-up reminders per execution plan (Day 3, Day 7 nudges)
          3. Update Salesforce opportunity stage to "Renewal Proposed"
          4. Monitor for customer responses and flag objections
          5. Schedule next workflow trigger (Negotiate at Day 70, or early if objections)

          TYPICAL CSM TASK PRIORITIES FOR ENGAGE:
          1. Send emails to stakeholders per sequence (from Step 3 drafts)
          2. Conduct stakeholder meetings/calls as scheduled
          3. Follow up on no-responses per execution plan
          4. Document customer feedback and objections
          5. Prepare for potential negotiation if pushback occurs

          NEXT WORKFLOW EXPECTATION:
          - Next Stage: Negotiate (60-89 days)
          - Trigger Condition: Day 70, OR when customer raises objections/questions
          - Focus: Handle objections, negotiate terms, finalize agreement

          KEY ENGAGE OUTPUTS TO REFERENCE:
          - Stakeholder Sequence: {{outputs.sequence}}
          - Pricing Communication: {{outputs.approach}}
          - Email Drafts: {{outputs.emails}} (sent or scheduled)
          - Execution Timeline: {{outputs.timeline}}
          - Scenario Rehearsal: {{outputs.scenarios}}

          CRITICAL TRIGGERS:
          - If customer raises pricing objections → Consider early Negotiate trigger
          - If no responses after 2 weeks → Executive escalation task
          - If positive signal ("looks good") → Accelerate to Day 90 notice

          Use these outputs to inform your action plan generation.
        `
      }
    }
  ]
};

export default EngageRenewalWorkflow;
