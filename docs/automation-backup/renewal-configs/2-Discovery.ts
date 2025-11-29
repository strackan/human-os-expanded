/**
 * Discovery Renewal Workflow
 *
 * Triggered when: 150-179 days until renewal
 * Urgency: LOW-MEDIUM - Early discovery and planning phase
 *
 * Purpose: Deep discovery to prepare for renewal planning
 * - CSM subjective assessment (audio + AI interview)
 * - Contract analysis and obstacle identification
 * - Preliminary pricing strategy
 * - Stakeholder mapping and relationship assessment
 * - AI-driven recommendations based on discoveries
 * - Action Plan generation (AI tasks + CSM tasks)
 *
 * IMPORTANT: This workflow only fires when actionable recommendations exist.
 * No recommendations = No workflow created = No noise to CSM.
 */

import { WorkflowDefinition } from '../workflow-types';
import { ActionPlanStep, DiscoveryActionPlanConfig } from '../workflow-steps/ActionPlanStep';

export const DiscoveryRenewalWorkflow: WorkflowDefinition = {
  id: 'discovery-renewal',
  type: 'renewal',
  stage: 'Discovery',
  name: 'Renewal Discovery',
  description: '150-179 days until renewal - deep discovery and early planning',

  baseScore: 25,        // Slightly higher than Monitor (20)
  urgencyScore: 25,     // Low-medium urgency

  trigger: {
    type: 'days_based',
    config: {
      daysMin: 150,
      daysMax: 179
    },

    // NEW: Conditional workflow creation
    // Only create workflow if LLM generates actionable recommendations
    conditionalCreation: {
      check: 'recommendations_exist',
      processor: 'recommendation-engine.js',
      minimumRecommendations: 1 // Must have at least 1 recommendation
    }
  },

  steps: [
    // =========================================================================
    // STEP 1: CSM SUBJECTIVE ASSESSMENT
    // =========================================================================
    {
      id: 'csm-assessment',
      name: 'CSM Subjective Assessment',
      type: 'planning',
      estimatedTime: '15-20min',

      execution: {
        llmPrompt: `
          AI INTERVIEW: CSM SUBJECTIVE ASSESSMENT

          You are interviewing CSM about {{customer.name}}.
          Goal: Gather comprehensive subjective assessment before renewal planning begins.

          Customer Context:
          - Customer: {{customer.name}}
          - ARR: ${{customer.arr}}
          - Renewal date: {{customer.renewalDate}} ({{workflow.daysUntilRenewal}} days away)
          - Owner: {{customer.owner}}

          REQUIRED INFORMATION TO GATHER:

          1. Relationship Strength (1-10 rating)
             - How would you rate the overall relationship?
             - Why this rating?

          2. Renewal Confidence (1-10 rating)
             - How confident are you in renewal?
             - What makes you confident/concerned?

          3. Red Flags & Concerns
             - Any specific red flags or warning signs?
             - What keeps you up at night about this customer?
             - Any recent concerning developments?

          4. What's Working Well
             - What aspects of the relationship are strong?
             - What does the customer value most?
             - Any recent wins or positive developments?

          5. Main Risks & Obstacles
             - What are the biggest risks to renewal?
             - Any competitive threats?
             - Internal challenges at customer?

          6. Customer Sentiment
             - Overall sentiment (Very Positive / Positive / Neutral / Negative / Very Negative)?
             - Key stakeholder sentiments?
             - Any recent sentiment shifts?

          INTERVIEW APPROACH:
          - Start with high-level questions
          - Ask clarifying follow-ups when answers are vague
          - Dig deeper on red flags and concerns
          - Don't move to next topic until you have detailed understanding
          - Be conversational but thorough
          - Continue until ALL 6 areas are comprehensively covered

          AUDIO TRANSCRIPTION MODE:
          If CSM provides audio transcription:
          - Extract all relevant information from transcript
          - Identify gaps in coverage
          - Generate specific follow-up questions for missing information
          - Summarize what was covered and what still needs clarification

          OUTPUT FORMAT:
          Generate structured assessment with ratings, detailed notes, and specific quotes.
        `,

        dataRequired: [
          'customer.name',
          'customer.arr',
          'customer.renewalDate',
          'workflow.daysUntilRenewal',
          'customer.owner'
        ],

        processor: 'interviewers/csmAssessmentInterview.js',

        outputs: [
          'relationship_strength',
          'renewal_confidence',
          'red_flags',
          'strengths',
          'risks',
          'sentiment',
          'assessment_summary'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '🎤 **CSM SUBJECTIVE ASSESSMENT**\n\n{{customer.name}} (ARR: ${{customer.arr}})\nRenewal in {{workflow.daysUntilRenewal}} days\n\nLet\'s capture your insights about this customer. You can:\n\n1️⃣ Record audio and upload for transcription\n2️⃣ Have an AI-guided interview (text-based)\n\nHow would you like to proceed?',
            buttons: [
              { label: '🎤 Upload Audio Recording', value: 'audio', action: 'upload_audio' },
              { label: '💬 Start AI Interview', value: 'interview', action: 'start_interview' },
              { label: 'Skip for Now', value: 'skip' }
            ]
          },

          branches: {
            'audio': {
              response: 'Great! Upload your audio recording and I\'ll transcribe and analyze it.',
              actions: ['show_upload', 'process_audio'],
              nextButtons: [
                { label: 'View Analysis', value: 'view_analysis' }
              ]
            },
            'interview': {
              response: 'Perfect! Let\'s start the interview. I\'ll ask you a series of questions about {{customer.name}}.\n\n**Question 1:** On a scale of 1-10, how would you rate the overall relationship with {{customer.name}}?',
              actions: ['start_interview_mode'],
              // Interview mode continues with dynamic questions until all 6 areas covered
            },
            'view_analysis': {
              response: 'Here\'s your comprehensive assessment based on our conversation:',
              actions: ['show_artifact'],
              artifactId: 'csm-assessment',
              nextButtons: [
                { label: 'Continue to Contract Analysis', value: 'next_step' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'csm-assessment',
            title: 'CSM Assessment - {{customer.name}}',
            type: 'report',
            icon: '📋',
            visible: false,

            sections: [
              {
                id: 'ratings',
                title: 'Overall Ratings',
                type: 'scorecard',
                content: {
                  relationshipStrength: '{{outputs.relationship_strength}}',
                  renewalConfidence: '{{outputs.renewal_confidence}}',
                  sentiment: '{{outputs.sentiment}}'
                }
              },
              {
                id: 'red-flags',
                title: '🚨 Red Flags & Concerns',
                type: 'list',
                content: '{{outputs.red_flags}}'
              },
              {
                id: 'strengths',
                title: '✅ What\'s Working Well',
                type: 'list',
                content: '{{outputs.strengths}}'
              },
              {
                id: 'risks',
                title: '⚠️ Main Risks & Obstacles',
                type: 'list',
                content: '{{outputs.risks}}'
              },
              {
                id: 'summary',
                title: 'Executive Summary',
                type: 'text',
                content: '{{outputs.assessment_summary}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 2: CONTRACT ANALYSIS & OBSTACLES
    // =========================================================================
    {
      id: 'contract-analysis',
      name: 'Contract Analysis & Obstacles',
      type: 'data_analysis',
      estimatedTime: '10-15min',

      execution: {
        llmPrompt: `
          CONTRACT ANALYSIS & OBSTACLE IDENTIFICATION

          Customer: {{customer.name}}
          ARR: ${{customer.arr}}
          Renewal in: {{workflow.daysUntilRenewal}} days

          CONTRACT DATA:
          {{#if data.contract.exists}}
          - Contract Number: {{data.contract.number}}
          - Start Date: {{data.contract.startDate}}
          - End Date: {{data.contract.endDate}}
          - Initial ARR: ${{data.contract.initialArr}}
          - Document: {{data.contract.documentUrl}}

          EXTRACTED TERMS:
          {{data.contract.extractedTerms}}
          {{else}}
          NO CONTRACT FOUND IN DATABASE
          {{/if}}

          TASK:
          Analyze contract terms and identify obstacles to renewal success.

          CRITICAL OBSTACLES (must identify):
          1. **Notice Period Requirements**
             - When must renewal notice be given?
             - Calculate deadline based on {{workflow.daysUntilRenewal}} days

          2. **Pricing Constraints**
             - Any caps on price increases?
             - Volume discounts or commitments?
             - MFN (Most Favored Nation) clauses?

          3. **Auto-Renewal Status**
             - Does contract auto-renew?
             - If yes, when is opt-out deadline?

          4. **Termination Clauses**
             - Early termination penalties?
             - Exit requirements?

          5. **Volume/Usage Commitments**
             - Minimum seat counts?
             - Usage-based minimums?

          6. **Other Considerations**
             - Payment terms changes?
             - SOW requirements?
             - Any unusual terms?

          OBSTACLE SEVERITY CLASSIFICATION:
          - 🔴 CRITICAL: Must address immediately (impacts renewal timeline)
          - 🟡 IMPORTANT: Should address soon (impacts negotiation)
          - ✅ FAVORABLE: Works in our favor

          OUTPUT FORMAT:
          Structured list of obstacles by severity with:
          - Specific term/clause
          - Why it matters
          - Recommended action
          - Deadline (if applicable)

          If no contract exists, output instructions for contract upload.
        `,

        dataRequired: [
          'data.contract', // Will be null if no contract
          'workflow.daysUntilRenewal'
        ],

        processor: 'analyzers/contractObstacles.js',

        outputs: [
          'contract_exists',
          'critical_obstacles',
          'important_obstacles',
          'favorable_terms',
          'notice_deadline',
          'pricing_constraints'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '📄 **CONTRACT ANALYSIS**\n\nAnalyzing contract terms for {{customer.name}}...',
            buttons: [
              { label: 'View Contract Analysis', value: 'view', action: 'show_artifact', artifactId: 'contract-analysis' }
            ]
          },

          branches: {
            'view': {
              response: 'Here\'s the contract analysis with identified obstacles:',
              actions: ['show_artifact'],
              artifactId: 'contract-analysis',
              nextButtons: [
                { label: 'Continue to Pricing Strategy', value: 'next_step' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'contract-analysis',
            title: 'Contract Analysis - {{customer.name}}',
            type: 'report',
            icon: '📄',
            visible: false,

            sections: [
              {
                id: 'contract-info',
                title: 'Contract Information',
                type: 'data',
                content: `
                  {{#if outputs.contract_exists}}
                  Contract: {{data.contract.number}}
                  Term: {{data.contract.startDate}} - {{data.contract.endDate}}
                  Initial ARR: ${{data.contract.initialArr}}
                  {{else}}
                  ⚠️ NO CONTRACT FOUND

                  Please upload current contract for analysis:
                  [Upload Contract Button]
                  {{/if}}
                `
              },
              {
                id: 'critical',
                title: '🔴 CRITICAL OBSTACLES',
                type: 'list',
                content: '{{outputs.critical_obstacles}}'
              },
              {
                id: 'important',
                title: '🟡 IMPORTANT CONSIDERATIONS',
                type: 'list',
                content: '{{outputs.important_obstacles}}'
              },
              {
                id: 'favorable',
                title: '✅ FAVORABLE TERMS',
                type: 'list',
                content: '{{outputs.favorable_terms}}'
              },
              {
                id: 'deadlines',
                title: '📅 KEY DEADLINES',
                type: 'data',
                content: '{{outputs.notice_deadline}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 3: PRELIMINARY PRICING STRATEGY
    // =========================================================================
    {
      id: 'pricing-strategy',
      name: 'Preliminary Pricing Strategy',
      type: 'planning',
      estimatedTime: '10min',

      execution: {
        llmPrompt: `
          PRELIMINARY PRICING STRATEGY

          Customer: {{customer.name}}
          Current ARR: ${{customer.arr}}
          Contract ARR: ${{data.contract.initialArr}}
          Renewal in: {{workflow.daysUntilRenewal}} days

          CSM Assessment Context:
          - Renewal Confidence: {{outputs.renewal_confidence}}/10
          - Relationship Strength: {{outputs.relationship_strength}}/10
          - Main Risks: {{outputs.risks}}

          Contract Constraints:
          - Pricing Constraints: {{outputs.pricing_constraints}}

          TASK:
          Guide CSM through preliminary pricing strategy planning.

          QUESTIONS TO ASK (in order):

          1. **Target ARR**
             What is your target ARR for this renewal?
             (Consider: current ARR, growth, market conditions, customer value)

          2. **Price Increase Plan**
             Are you planning a price increase?
             - Yes (proceed to Q3)
             - No (skip to Q5)
             - TBD / Need guidance (provide recommendation)

          3. **Increase Percentage** (if Yes to Q2)
             What percentage increase are you considering?
             - Provide context on:
               * Industry norms
               * Contract constraints
               * Customer price sensitivity
               * Historical increases

          4. **Risk Assessment**
             What is your risk level for this pricing strategy?
             - Low: Customer will accept
             - Medium: May require justification
             - High: Significant pushback expected

          5. **Rationale**
             What is your rationale for this pricing approach?
             (Document reasoning for future reference)

          6. **Customer Price Sensitivity**
             How price-sensitive is this customer?
             - Low: Price is not primary concern
             - Medium: Will negotiate but reasonable
             - High: Very price-conscious, difficult negotiations

          PROVIDE GUIDANCE:
          - Market benchmarks
          - Contract constraints
          - Risk factors from CSM assessment
          - Recommended approach based on context

          OUTPUT FORMAT:
          Structured pricing strategy with:
          - Current vs Target ARR
          - Price increase % (if applicable)
          - Risk level and mitigation strategies
          - Rationale and supporting evidence
          - Next steps
        `,

        dataRequired: [
          'customer.arr',
          'data.contract.initialArr',
          'outputs.renewal_confidence',
          'outputs.relationship_strength',
          'outputs.pricing_constraints'
        ],

        processor: 'generators/pricingStrategy.js',

        outputs: [
          'target_arr',
          'price_increase_planned',
          'increase_percentage',
          'risk_level',
          'rationale',
          'price_sensitivity',
          'recommended_approach'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '💰 **PRELIMINARY PRICING STRATEGY**\n\n{{customer.name}} - Current ARR: ${{customer.arr}}\n\nLet\'s develop a preliminary pricing strategy for this renewal. This is not final - just an early directional plan.\n\n**Question 1:** What is your target ARR for this renewal?\n\n(Consider current ARR, customer growth, market conditions, value delivered)',
            buttons: [] // Dynamic form-based interaction
          },

          branches: {
            // Pricing form interaction branches
            // UI will handle form submission and progress through questions
          }
        },

        artifacts: [
          {
            id: 'pricing-strategy',
            title: 'Pricing Strategy Brief - {{customer.name}}',
            type: 'plan',
            icon: '💰',
            visible: false,

            sections: [
              {
                id: 'overview',
                title: 'Strategy Overview',
                type: 'data',
                content: `
                  Current ARR: ${{customer.arr}}
                  Target ARR: ${{outputs.target_arr}}
                  Change: {{outputs.increase_percentage}}%

                  Price Increase: {{outputs.price_increase_planned}}
                  Risk Level: {{outputs.risk_level}}
                `
              },
              {
                id: 'rationale',
                title: 'Rationale',
                type: 'text',
                content: '{{outputs.rationale}}'
              },
              {
                id: 'constraints',
                title: 'Contract Constraints',
                type: 'text',
                content: '{{outputs.pricing_constraints}}'
              },
              {
                id: 'sensitivity',
                title: 'Customer Price Sensitivity',
                type: 'data',
                content: 'Sensitivity Level: {{outputs.price_sensitivity}}'
              },
              {
                id: 'recommendation',
                title: 'Recommended Approach',
                type: 'text',
                content: '{{outputs.recommended_approach}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 4: STAKEHOLDER MAPPING
    // =========================================================================
    {
      id: 'stakeholder-mapping',
      name: 'Stakeholder Mapping',
      type: 'planning',
      estimatedTime: '15min',

      execution: {
        llmPrompt: `
          STAKEHOLDER MAPPING

          Customer: {{customer.name}}
          Renewal in: {{workflow.daysUntilRenewal}} days

          TASK:
          Map key stakeholders and assess relationship landscape for renewal planning.

          DEFAULT PERSONA CATEGORIES:
          1. **Executive Sponsor** (Economic Buyer)
             - Signs contracts and approves budget
             - C-level or VP
             - Ultimate decision maker

          2. **Technical Champion** (Day-to-day User)
             - Uses product daily
             - Understands value firsthand
             - Can advocate internally

          3. **Decision Maker** (Business Owner)
             - Business unit leader
             - Evaluates ROI
             - Influences purchase decisions

          FOR EACH STAKEHOLDER COLLECT:
          - Name
          - Title
          - Role/Persona (Executive Sponsor, Technical Champion, Decision Maker, Other)
          - Relationship Strength (1-10 rating)
          - Sentiment: 😊 Positive / 😐 Neutral / 😟 Negative
          - Last Contact Date
          - Key Concerns/Interests
          - Notes

          RELATIONSHIP STRENGTH GUIDE:
          10: Champion - Strong advocate, highly engaged
          8-9: Supportive - Positive relationship, engaged
          6-7: Neutral - Professional but not invested
          4-5: Distant - Limited engagement, concerns
          1-3: At Risk - Negative sentiment, potential blocker

          ANALYSIS:
          - Identify gaps (missing Executive Sponsor? No champion?)
          - Assess overall relationship health
          - Flag stakeholders needing attention
          - Recommend relationship-building actions

          OUTPUT FORMAT:
          Structured stakeholder data with:
          - Complete stakeholder profiles
          - Relationship health assessment
          - Gaps and risks
          - Recommended actions
        `,

        dataRequired: [
          'customer.name',
          'workflow.daysUntilRenewal',
          'data.salesforce.contacts' // Pre-populate if available
        ],

        processor: 'generators/stakeholderMap.js',

        outputs: [
          'stakeholders',
          'relationship_health',
          'gaps',
          'recommended_actions'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '👥 **STAKEHOLDER MAPPING**\n\n{{customer.name}}\n\nLet\'s map the key stakeholders involved in the renewal decision.\n\nI\'ll show you default persona cards (Executive Sponsor, Technical Champion, Decision Maker). You can edit these or add new stakeholders.',
            buttons: [
              { label: 'Start Stakeholder Mapping', value: 'start', action: 'show_artifact', artifactId: 'stakeholder-map' }
            ]
          },

          branches: {
            'start': {
              response: 'Here\'s the stakeholder mapping interface:',
              actions: ['show_artifact', 'enable_edit_mode'],
              artifactId: 'stakeholder-map'
            }
          }
        },

        artifacts: [
          {
            id: 'stakeholder-map',
            title: 'Stakeholder Map - {{customer.name}}',
            type: 'stakeholder_cards',
            icon: '👥',
            visible: false,

            // Special artifact type with CRUD interface for stakeholder cards
            config: {
              cardLayout: 'grid', // Compact card grid (not org chart)
              enableAdd: true,
              enableEdit: true,
              enableRemove: true,
              defaultPersonas: [
                {
                  role: 'Executive Sponsor',
                  icon: '👔',
                  description: 'Economic buyer - signs contracts',
                  required: true
                },
                {
                  role: 'Technical Champion',
                  icon: '⚙️',
                  description: 'Day-to-day user and advocate',
                  required: true
                },
                {
                  role: 'Decision Maker',
                  icon: '💼',
                  description: 'Business owner and ROI evaluator',
                  required: false
                }
              ]
            },

            sections: [
              {
                id: 'stakeholder-cards',
                title: 'Key Stakeholders',
                type: 'card_grid',
                content: '{{outputs.stakeholders}}',

                // Card template:
                // ┌────────────────────────────┐
                // │ 👔 Executive Sponsor        │
                // ├────────────────────────────┤
                // │ Sarah Chen                  │
                // │ VP of Operations            │
                // │                             │
                // │ Relationship: ⭐⭐⭐⭐⭐⭐⭐⭐ (8/10) │
                // │ Sentiment: 😊 Positive      │
                // │ Last Contact: 2 weeks ago   │
                // │                             │
                // │ Notes: Strong advocate...   │
                // │                             │
                // │ [Edit] [Remove]             │
                // └────────────────────────────┘
              },
              {
                id: 'analysis',
                title: 'Relationship Health Analysis',
                type: 'text',
                content: '{{outputs.relationship_health}}'
              },
              {
                id: 'gaps',
                title: '⚠️ Gaps & Risks',
                type: 'list',
                content: '{{outputs.gaps}}'
              },
              {
                id: 'actions',
                title: '📋 Recommended Actions',
                type: 'list',
                content: '{{outputs.recommended_actions}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 5: REVIEW RECOMMENDATIONS
    // =========================================================================
    {
      id: 'review-recommendations',
      name: 'Review Recommendations',
      type: 'action',
      estimatedTime: '10-15min',

      execution: {
        llmPrompt: `
          GENERATE DISCOVERY-STAGE RECOMMENDATIONS

          Customer: {{customer.name}}
          ARR: ${{customer.arr}}
          Renewal in: {{workflow.daysUntilRenewal}} days

          CONTEXT FROM PREVIOUS STEPS:

          CSM Assessment:
          - Relationship Strength: {{outputs.relationship_strength}}/10
          - Renewal Confidence: {{outputs.renewal_confidence}}/10
          - Red Flags: {{outputs.red_flags}}
          - Risks: {{outputs.risks}}

          Contract Analysis:
          - Critical Obstacles: {{outputs.critical_obstacles}}
          - Notice Deadline: {{outputs.notice_deadline}}
          - Pricing Constraints: {{outputs.pricing_constraints}}

          Pricing Strategy:
          - Target ARR: {{outputs.target_arr}}
          - Price Increase: {{outputs.price_increase_planned}}
          - Risk Level: {{outputs.risk_level}}

          Stakeholder Map:
          - Stakeholders: {{outputs.stakeholders}}
          - Gaps: {{outputs.gaps}}
          - Relationship Health: {{outputs.relationship_health}}

          Full Customer Data:
          - Usage: {{data.usage}}
          - Engagement: {{data.engagement}}
          - Salesforce: {{data.salesforce}}

          VALID RECOMMENDATION TYPES for Discovery stage (150-179 days):

          1. EXECUTIVE_ENGAGEMENT
             - personal_touchpoint: Build relationship with new executives
             - executive_meeting: Strategic alignment meeting
             - success_story_sharing: Share relevant case studies
             - product_roadmap_preview: Preview upcoming features

          2. FEATURE_ADOPTION
             - underutilized_feature: Address low adoption of paid features
             - advanced_capability_intro: Introduce advanced capabilities
             - training_recommendation: Recommend training for key users

          3. PRICING_STRATEGY
             - value_realization_documentation: Document ROI/value
             - usage_increase_justification: Justify pricing based on usage
             - benchmark_comparison: Compare to market pricing

          4. PROCEDURAL
             - contract_amendment_needed: Address contract obstacles early
             - stakeholder_gap: Fill missing stakeholder relationships
             - documentation_needed: Gather missing renewal information

          TASK:
          Generate 2-5 recommendations that are:
          - Highly actionable and specific
          - Based on discoveries from Steps 1-4
          - Appropriate for Discovery stage (relationship building, information gathering)
          - Address identified gaps, risks, or opportunities
          - NOT urgent (still 150+ days out)

          PRIORITIZE:
          - Contract obstacles that need early attention
          - Stakeholder relationship gaps
          - Pricing justification needs
          - Risk mitigation actions

          For each recommendation:
          {
            "category": "EXECUTIVE_ENGAGEMENT | FEATURE_ADOPTION | PRICING_STRATEGY | PROCEDURAL",
            "subcategory": "<specific subcategory from above>",
            "title": "<5-8 words>",
            "description": "<1-2 sentences>",
            "rationale": "<why this matters based on discoveries>",
            "dataPoints": [
              {
                "label": "<metric/finding>",
                "value": "<value from assessments>",
                "context": "<why this matters>",
                "source": "<which step this came from>"
              }
            ],
            "impact": "low | medium | high",
            "urgency": "low | medium",
            "suggestedActions": ["send_email", "schedule_meeting", "update_crm", "review_data", "skip", "snooze"]
          }

          Return JSON array. Empty array [] if no strong recommendations.
        `,

        dataRequired: [
          'outputs.relationship_strength',
          'outputs.renewal_confidence',
          'outputs.red_flags',
          'outputs.risks',
          'outputs.critical_obstacles',
          'outputs.notice_deadline',
          'outputs.target_arr',
          'outputs.price_increase_planned',
          'outputs.stakeholders',
          'outputs.gaps',
          'data.usage',
          'data.engagement',
          'data.salesforce'
        ],

        processor: 'generators/discoveryRecommendations.js',

        outputs: ['recommendations']
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: 'Based on your Discovery assessment, here are my recommendations for {{customer.name}}:',
            buttons: 'dynamic' // Generated from recommendations
          },

          branches: {}
        },

        artifacts: [
          {
            id: 'recommendations',
            title: 'Discovery Recommendations - {{customer.name}}',
            type: 'recommendation_list',
            icon: '💡',
            visible: true,

            sections: [
              {
                id: 'recommendation-cards',
                title: 'Recommended Actions',
                type: 'dynamic_recommendations',
                content: '{{outputs.recommendations}}',

                // Each recommendation becomes a RecommendationCard component
                // (Built in Checkpoint 3)
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

      // Merge Discovery-specific context enhancement
      execution: {
        ...ActionPlanStep.execution,

        // Add Discovery-specific guidance to LLM prompt
        llmPrompt: `
          ${ActionPlanStep.execution.llmPrompt}

          ═══════════════════════════════════════════════════════════════════════
          DISCOVERY STAGE SPECIFIC CONTEXT
          ═══════════════════════════════════════════════════════════════════════

          This is the DISCOVERY stage (150-179 days until renewal).

          Focus Areas:
          - Relationship building and stakeholder mapping
          - Data gathering (CSM insights, contract analysis, pricing strategy)
          - Early identification of risks and opportunities
          - Foundation setting for future stages

          TYPICAL AI TASK PRIORITIES FOR DISCOVERY:
          1. Update CRM with CSM assessment insights (relationship strength, confidence ratings)
          2. Set calendar reminders for contract notice deadlines (Day 90 notice period)
          3. Create stakeholder engagement tracking
          4. Schedule next workflow trigger (Prepare stage at ~140 days)
          5. Set up competitive intelligence monitoring (if competitor mentioned)

          TYPICAL CSM TASK PRIORITIES FOR DISCOVERY:
          1. Address stakeholder gaps (e.g., CFO engagement if not yet established)
          2. Reschedule missed QBRs or check-ins
          3. Create value realization documentation
          4. Gather competitive intelligence
          5. Build multi-threaded relationships
          6. Address contract obstacles that need early attention

          NEXT WORKFLOW EXPECTATION:
          - Next Stage: Prepare (120-149 days)
          - Trigger Condition: ~140 days until renewal, OR when discovery tasks completed
          - Focus: Prepare renewal proposal and executive engagement

          KEY DISCOVERY OUTPUTS TO REFERENCE:
          - CSM Assessment: {{outputs.relationship_strength}}/10, {{outputs.renewal_confidence}}/10
          - Contract: {{outputs.critical_obstacles}}, {{outputs.notice_deadline}}
          - Pricing: {{outputs.target_arr}}, {{outputs.risk_level}}
          - Stakeholders: {{outputs.gaps}}, {{outputs.recommended_actions}}
          - Recommendations: {{outputs.recommendations}}

          Use these discoveries to inform your action plan generation.
        `
      }
    }
  ]
};

export default DiscoveryRenewalWorkflow;
