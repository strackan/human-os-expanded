/**
 * Prepare Renewal Workflow
 *
 * Triggered when: 120-149 days until renewal
 * Urgency: MEDIUM - Final pricing decision and engagement strategy
 *
 * Purpose: Lock in pricing and approach before active engagement begins
 * - Fresh 30-day data snapshot (usage, engagement, risk, sentiment)
 * - Pricing strategy interview (goals, constraints, risk tolerance)
 * - Pricing optimization engine (multi-factor algorithm)
 * - Engagement strategy (when, who, how)
 * - 120-day action plan
 *
 * Key Decision: Finalize pricing recommendation with confidence scoring
 *
 * IMPORTANT: This workflow is where pricing gets LOCKED IN.
 * Uses outputs from Discovery workflow (stakeholders, contract constraints, CSM assessment).
 */

import { WorkflowDefinition } from '../workflow-types';
import { ActionPlanStep } from '../workflow-steps/ActionPlanStep';

export const PrepareRenewalWorkflow: WorkflowDefinition = {
  id: 'prepare-renewal',
  type: 'renewal',
  stage: 'Prepare',
  name: 'Prepare Renewal',
  description: '120-149 days until renewal - final pricing decision and engagement strategy',

  baseScore: 35,        // Higher than Discovery (25)
  urgencyScore: 35,     // Medium urgency

  trigger: {
    type: 'days_based',
    config: {
      daysMin: 120,
      daysMax: 149
    }
  },

  steps: [
    // =========================================================================
    // STEP 1: FRESH DATA REVIEW (30-DAY SNAPSHOT)
    // =========================================================================
    {
      id: 'data-snapshot',
      name: '30-Day Data Snapshot',
      type: 'analysis',
      estimatedTime: '5min (auto-generated)',

      execution: {
        llmPrompt: `
          30-DAY DATA SNAPSHOT ANALYSIS

          Customer: {{customer.name}}
          Current ARR: ${{customer.arr}}
          Renewal in: {{workflow.daysUntilRenewal}} days

          TASK:
          Analyze recent data (last 30 days) to identify trends, risks, and opportunities.
          Compare to previous 30-day period and overall baseline.

          DATA SOURCES TO ANALYZE:

          1. USAGE METRICS
             - Daily active users (DAU)
             - Feature usage by module
             - API calls / integrations activity
             - Data volume (storage, processing)
             - Session duration and frequency

             Calculate:
             - Usage growth % (vs. previous 30 days)
             - Feature adoption % (features used / features available)
             - User engagement trend (increasing / stable / declining)

          2. ENGAGEMENT METRICS
             - Login frequency by user type
             - Power users vs. casual users
             - New user onboarding completion
             - Training/webinar attendance
             - Support portal usage

             Identify:
             - Engagement health score (0-100)
             - User growth/churn within account
             - Engagement trend

          3. SUPPORT & SATISFACTION
             - Support ticket volume
             - Ticket severity distribution
             - Average resolution time
             - CSAT scores (if available)
             - Support ticket sentiment analysis

             Assess:
             - Support trend (improving / stable / concerning)
             - Customer satisfaction level

          4. RISK INDICATORS (PLACEHOLDERS - FUTURE INTEGRATION)
             - Churn risk score: {{data.riskScore.churnRisk || 'N/A'}}
             - Budget pressure indicators: {{data.riskScore.budgetPressure || 'N/A'}}
             - Competitive threat level: {{data.riskScore.competitiveThreat || 'N/A'}}
             - Overall risk score: {{data.riskScore.overall || 'N/A'}}

          5. SENTIMENT ANALYSIS (PLACEHOLDERS - FUTURE INTEGRATION)
             - NPS score: {{data.sentiment.nps || 'N/A'}}
             - Communication sentiment: {{data.sentiment.emailSentiment || 'N/A'}}
             - Support ticket sentiment: {{data.sentiment.supportSentiment || 'N/A'}}
             - Overall sentiment trend: {{data.sentiment.trend || 'N/A'}}

          6. OPPORTUNITY INDICATORS (PLACEHOLDERS)
             - Expansion opportunity score: {{data.opportunity.expansionScore || 'N/A'}}
             - Upsell signals: {{data.opportunity.upsellSignals || 'N/A'}}
             - Cross-sell potential: {{data.opportunity.crossSellPotential || 'N/A'}}

          ANALYSIS OUTPUTS:

          For EACH category, provide:
          - Current value
          - Trend direction: ↑ improving / → stable / ↓ declining
          - % change vs. previous period
          - Key findings (2-3 bullet points)
          - Data quality indicator: complete / partial / placeholder

          TREND SUMMARY:
          - Overall health: Excellent / Good / Stable / Concerning / At Risk
          - Confidence in data: High / Medium / Low
          - Notable changes (positive or negative)
          - Red flags requiring immediate attention

          OUTPUT FORMAT:
          Structured JSON with:
          {
            "usageMetrics": { ... },
            "engagementMetrics": { ... },
            "supportMetrics": { ... },
            "riskIndicators": { ... },
            "sentimentAnalysis": { ... },
            "opportunityIndicators": { ... },
            "overallHealth": "...",
            "dataConfidence": "...",
            "keyFindings": [...],
            "redFlags": [...]
          }
        `,

        dataRequired: [
          'customer.arr',
          'customer.seatCount',
          'data.usage.last30Days',      // From analytics system
          'data.engagement.last30Days',  // From product analytics
          'data.support.last30Days',     // From support system
          'data.riskScore',              // PLACEHOLDER - From risk scoring engine
          'data.sentiment',              // PLACEHOLDER - From sentiment analysis
          'data.opportunity'             // PLACEHOLDER - From opportunity scoring
        ],

        processor: 'analyzers/dataSnapshotAnalyzer.js',

        outputs: [
          'usage_growth',
          'feature_adoption',
          'engagement_trend',
          'support_trend',
          'risk_score',
          'sentiment_score',
          'opportunity_score',
          'overall_health',
          'data_confidence',
          'key_findings',
          'red_flags'
        ]
      },

      ui: {
        type: 'artifact_review',
        description: 'Review 30-day data snapshot showing trends and health indicators',

        artifacts: [
          {
            id: 'data-snapshot',
            title: '30-Day Data Snapshot - {{customer.name}}',
            type: 'data_report',
            icon: '📊',
            visible: true,

            sections: [
              {
                id: 'health-overview',
                title: 'Overall Health',
                type: 'status',
                content: `
                  Health Status: {{outputs.overall_health}}
                  Data Confidence: {{outputs.data_confidence}}
                `
              },
              {
                id: 'usage',
                title: 'Usage Metrics (Last 30 Days)',
                type: 'metrics',
                content: `
                  Usage Growth: {{outputs.usage_growth}}
                  Feature Adoption: {{outputs.feature_adoption}}
                  Trend: {{outputs.engagement_trend}}
                `
              },
              {
                id: 'support',
                title: 'Support & Satisfaction',
                type: 'metrics',
                content: '{{outputs.support_trend}}'
              },
              {
                id: 'risk',
                title: '⚠️ Risk Indicators',
                type: 'list',
                content: '{{outputs.risk_score}}'
              },
              {
                id: 'opportunities',
                title: '💡 Opportunities',
                type: 'list',
                content: '{{outputs.opportunity_score}}'
              },
              {
                id: 'key-findings',
                title: 'Key Findings',
                type: 'list',
                content: '{{outputs.key_findings}}'
              },
              {
                id: 'red-flags',
                title: '🚨 Red Flags',
                type: 'list',
                content: '{{outputs.red_flags}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 2: PRICING STRATEGY INTERVIEW
    // =========================================================================
    {
      id: 'pricing-strategy-interview',
      name: 'Pricing Strategy Interview',
      type: 'planning',
      estimatedTime: '15-20min',

      execution: {
        llmPrompt: `
          PRICING STRATEGY INTERVIEW

          Customer: {{customer.name}}
          Current ARR: ${{customer.arr}}
          Renewal in: {{workflow.daysUntilRenewal}} days

          CONTEXT FROM DISCOVERY:
          - Relationship Strength: {{discovery.relationship_strength}}/10
          - Renewal Confidence: {{discovery.renewal_confidence}}/10
          - Contract Price Cap: {{discovery.price_increase_cap}}
          - Stakeholder Gaps: {{discovery.gaps}}

          CONTEXT FROM DATA SNAPSHOT:
          - Usage Growth: {{outputs.usage_growth}}
          - Overall Health: {{outputs.overall_health}}
          - Risk Score: {{outputs.risk_score}}

          TASK:
          Interview CSM to understand pricing goals and constraints.
          Use this to guide the Pricing Optimization Engine in Step 3.

          QUESTIONS (in order):

          1. **Pricing Goal**
             What is your primary pricing objective for this renewal?

             Options:
             - Maintain current price (prioritize retention)
             - Modest increase (3-5%, safe approach)
             - Market-aligned increase (5-8%, value-based)
             - Aggressive increase (8%+, maximize NRR)
             - Defensive discount (at-risk account)

             Why this matters:
             This sets the baseline strategy. Conservative vs. aggressive.

          2. **Renewal Confidence at Current Price**
             How confident are you that customer will renew at CURRENT price?

             Scale: 1-10
             - 9-10: Very confident, could likely increase
             - 7-8: Confident, some risk with increase
             - 5-6: Moderate confidence, increase adds risk
             - 3-4: Low confidence, maintain or discount
             - 1-2: At risk, defensive pricing needed

          3. **Value Perception Change**
             Since last renewal, has customer's perception of value improved?

             Options:
             - Significantly improved (quantified ROI, new use cases)
             - Moderately improved (increased usage, positive feedback)
             - Neutral (stable, no major changes)
             - Declined (complaints, reduced usage)

             Context:
             - Discovery findings: {{discovery.strengths}}
             - Recent data: {{outputs.key_findings}}

          4. **Risk Tolerance**
             What is your risk tolerance for this renewal?

             Options:
             - Low: Prioritize retention over revenue
             - Medium: Balanced approach (reasonable increase, manage risk)
             - High: Willing to push for maximum value

             Consider:
             - Customer importance (strategic vs. transactional)
             - Budget quarter (Q4 might be tighter)
             - Internal NRR targets

          5. **NRR Target**
             What is your Net Revenue Retention target for this customer?

             - Flat ARR: ${{customer.arr}} (0% growth)
             - Growth ARR: $________ (___% growth)
             - At-risk: Focus on retention, accept lower ARR

             Context:
             - Current ARR: ${{customer.arr}}
             - Contract allows up to {{discovery.price_increase_cap}} increase

          6. **Competitive Pressure**
             Is there competitive pricing pressure on this renewal?

             Options:
             - Yes, customer evaluating alternatives (provide details)
             - Some awareness, no active evaluation
             - No, customer not looking elsewhere

             Impact on pricing:
             - Active competition → conservative pricing
             - No competition → more pricing flexibility

          7. **Special Considerations**
             Any other factors influencing pricing strategy?

             Examples:
             - Multi-year deal opportunity
             - Expansion/upsell bundling
             - Budget cycle constraints
             - Executive relationship dynamics
             - Strategic account status

          ANALYSIS:
          Based on answers, determine:
          - Recommended pricing approach (conservative / balanced / aggressive)
          - Key constraints to respect
          - Risk factors to account for
          - Opportunities to leverage

          OUTPUT FORMAT:
          Structured JSON with interview responses and analysis.
        `,

        dataRequired: [
          'customer.arr',
          'discovery.relationship_strength',
          'discovery.renewal_confidence',
          'discovery.price_increase_cap',
          'outputs.usage_growth',
          'outputs.overall_health',
          'outputs.risk_score'
        ],

        processor: 'interviewers/pricingStrategyInterview.js',

        outputs: [
          'pricing_goal',
          'renewal_confidence_current_price',
          'value_perception_change',
          'risk_tolerance',
          'nrr_target',
          'competitive_pressure',
          'special_considerations',
          'recommended_approach'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '💰 **PRICING STRATEGY INTERVIEW**\n\n{{customer.name}} - Current ARR: ${{customer.arr}}\nRenewal in {{workflow.daysUntilRenewal}} days\n\nLet\'s define your pricing strategy for this renewal.\n\n**Question 1:** What is your primary pricing objective?\n\n• Maintain current price (prioritize retention)\n• Modest increase (3-5%, safe approach)\n• Market-aligned increase (5-8%, value-based)\n• Aggressive increase (8%+, maximize NRR)\n• Defensive discount (at-risk account)',
            buttons: [
              { label: 'Maintain', value: 'maintain' },
              { label: 'Modest Increase', value: 'modest' },
              { label: 'Market-Aligned', value: 'market' },
              { label: 'Aggressive', value: 'aggressive' },
              { label: 'Defensive', value: 'defensive' }
            ]
          },

          branches: {
            // Question flow based on responses
            // UI will handle progressive disclosure
          }
        },

        artifacts: [
          {
            id: 'pricing-strategy',
            title: 'Pricing Strategy - {{customer.name}}',
            type: 'plan',
            icon: '🎯',
            visible: false,

            sections: [
              {
                id: 'strategy',
                title: 'Pricing Approach',
                type: 'data',
                content: `
                  Goal: {{outputs.pricing_goal}}
                  Risk Tolerance: {{outputs.risk_tolerance}}
                  NRR Target: {{outputs.nrr_target}}
                `
              },
              {
                id: 'constraints',
                title: 'Constraints & Considerations',
                type: 'list',
                content: '{{outputs.special_considerations}}'
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
    // STEP 3: PRICING OPTIMIZATION ENGINE
    // =========================================================================
    {
      id: 'pricing-optimization',
      name: 'Pricing Optimization',
      type: 'analysis',
      estimatedTime: '5min (AI analysis)',

      execution: {
        llmPrompt: `
          PRICING OPTIMIZATION ENGINE

          Customer: {{customer.name}}
          Current ARR: ${{customer.arr}}
          Renewal in: {{workflow.daysUntilRenewal}} days

          INPUTS FROM PREVIOUS STEPS:

          Discovery Context:
          - Relationship: {{discovery.relationship_strength}}/10
          - Confidence: {{discovery.renewal_confidence}}/10
          - Contract Cap: {{discovery.price_increase_cap}}
          - Stakeholders: {{discovery.stakeholders}}
          - Red Flags: {{discovery.red_flags}}
          - Strengths: {{discovery.strengths}}

          Data Snapshot:
          - Usage Growth: {{outputs.usage_growth}}
          - Feature Adoption: {{outputs.feature_adoption}}
          - Risk Score: {{outputs.risk_score}}
          - Sentiment: {{outputs.sentiment_score}}
          - Overall Health: {{outputs.overall_health}}

          Pricing Strategy:
          - Goal: {{outputs.pricing_goal}}
          - Risk Tolerance: {{outputs.risk_tolerance}}
          - NRR Target: {{outputs.nrr_target}}
          - Competitive Pressure: {{outputs.competitive_pressure}}

          PRICING OPTIMIZATION ALGORITHM:

          This is a multi-factor pricing recommendation engine.
          Analyze ALL available data to recommend optimal price.

          FACTORS TO CONSIDER:

          1. STICKINESS SCORE (0-100)
             - Feature adoption: {{outputs.feature_adoption}}%
             - Integration count: {{data.integrations}} (switching cost)
             - Data volume: {{data.dataVolume}} TB (switching cost)
             - Active users: {{data.activeUsers}} of {{customer.seatCount}}
             - Customizations: {{data.customizations}} (switching cost)
             - Customer tenure: {{data.tenure}} months

             High stickiness = more pricing power

          2. VALUE LEVERAGE INDEX
             - Quantified value: {{discovery.quantified_value || 'N/A'}}
             - Usage growth trend: {{outputs.usage_growth}}
             - Value perception: {{outputs.value_perception_change}}

             Value delivered > Price paid = pricing leverage

          3. MARKET POSITION
             - Peer benchmark: Customer pays {{data.peerBenchmark || 'N/A'}} vs. market avg
             - Competitive position: {{outputs.competitive_pressure}}
             - Market trend: {{data.marketTrend || 'growing'}}

             Underpriced vs. peers = opportunity to increase

          4. RISK FACTORS
             - Churn risk: {{outputs.risk_score}}
             - Budget pressure: {{discovery.budget_pressure || 'N/A'}}
             - Competitive threat: {{discovery.competitive_threat || 'N/A'}}
             - Relationship strength: {{discovery.relationship_strength}}/10

             Higher risk = more conservative pricing

          5. TREND DATA (30-day)
             - Usage trend: {{outputs.engagement_trend}}
             - Support trend: {{outputs.support_trend}}
             - Sentiment trend: {{outputs.sentiment_score}}

             Positive trends = confidence in increase

          PRICING CALCULATION:

          Step 1: Calculate base increase
          - Stickiness influence: 0-8%
          - Value leverage influence: 0-5%
          - Market position influence: 0-3%
          - Trend adjustment: -2% to +2%

          Step 2: Apply risk multiplier
          - High risk: 0.5x (reduce increase by 50%)
          - Medium risk: 0.75x (reduce by 25%)
          - Low risk: 1.1x (can be more aggressive)

          Step 3: Apply constraints
          - Contract cap: {{discovery.price_increase_cap}}
          - CSM risk tolerance: {{outputs.risk_tolerance}}

          Step 4: Calculate confidence score (0-100)
          Based on data quality:
          - Complete usage data: +20
          - Complete financial data: +20
          - Sentiment data: +15 (if available)
          - Competitive data: +15 (if available)
          - Risk score: +15 (if available)
          - Discovery insights: +15

          GENERATE 3 SCENARIOS:

          1. Conservative Scenario
             - Lower increase (3-5%)
             - Very high probability (90-95%)
             - Low churn risk
             - Pros/Cons

          2. Recommended Scenario (PRIMARY)
             - Optimal increase based on all factors
             - Probability: 75-85%
             - Balanced risk/reward
             - Detailed reasoning with data points
             - Pros/Cons

          3. Aggressive Scenario
             - Higher increase (8-10%+)
             - Lower probability (60-70%)
             - Higher potential revenue
             - Pros/Cons

          OUTPUT FORMAT:
          {
            "recommendation": {
              "targetPrice": <number>,
              "increaseAmount": <number>,
              "increasePercent": <number>,
              "confidence": <0-100>,
              "reasoning": [<array of data-backed reasons>],
              "scenarios": [
                {
                  "scenario": "Conservative",
                  "targetPrice": <number>,
                  "increasePercent": <number>,
                  "probability": <number>,
                  "pros": [<array>],
                  "cons": [<array>]
                },
                {
                  "scenario": "Recommended",
                  "targetPrice": <number>,
                  "increasePercent": <number>,
                  "probability": <number>,
                  "pros": [<array>],
                  "cons": [<array>]
                },
                {
                  "scenario": "Aggressive",
                  "targetPrice": <number>,
                  "increasePercent": <number>,
                  "probability": <number>,
                  "pros": [<array>],
                  "cons": [<array>]
                }
              ]
            },
            "factors": {
              "stickinessScore": <0-100>,
              "valueIndex": <number>,
              "peerBenchmarkRatio": <number>,
              "churnRisk": <0-100>,
              "dataQuality": {
                "usage": "complete | partial | placeholder",
                "financial": "complete | partial | placeholder",
                "sentiment": "complete | partial | placeholder",
                "competitive": "complete | partial | placeholder",
                "risk": "complete | partial | placeholder"
              }
            }
          }
        `,

        dataRequired: [
          'customer.arr',
          'customer.seatCount',
          'discovery',
          'outputs.usage_growth',
          'outputs.feature_adoption',
          'outputs.risk_score',
          'outputs.sentiment_score',
          'outputs.pricing_goal',
          'outputs.risk_tolerance',
          'data.integrations',
          'data.dataVolume',
          'data.activeUsers',
          'data.customizations',
          'data.tenure'
        ],

        processor: 'generators/pricingOptimizationEngine.js',

        outputs: [
          'target_price',
          'increase_amount',
          'increase_percent',
          'confidence_score',
          'reasoning',
          'scenarios',
          'stickiness_score',
          'value_index',
          'peer_benchmark_ratio',
          'churn_risk',
          'data_quality'
        ]
      },

      ui: {
        type: 'artifact_review',
        description: 'Review AI-generated pricing recommendation with confidence scoring',

        artifacts: [
          {
            id: 'pricing-recommendation',
            title: 'Pricing Recommendation - {{customer.name}}',
            type: 'pricing_analysis',
            icon: '💵',
            visible: true,

            sections: [
              {
                id: 'recommendation',
                title: '✅ Recommended Price',
                type: 'pricing_card',
                content: `
                  Current ARR: ${{customer.arr}}
                  Target ARR: ${{outputs.target_price}}
                  Increase: +${{outputs.increase_amount}} ({{outputs.increase_percent}}%)
                  Confidence: {{outputs.confidence_score}}/100
                `
              },
              {
                id: 'reasoning',
                title: 'Data-Backed Reasoning',
                type: 'list',
                content: '{{outputs.reasoning}}'
              },
              {
                id: 'scenarios',
                title: 'Alternative Scenarios',
                type: 'scenario_cards',
                content: '{{outputs.scenarios}}'
              },
              {
                id: 'factors',
                title: 'Pricing Factors Analysis',
                type: 'metrics',
                content: `
                  Stickiness Score: {{outputs.stickiness_score}}/100
                  Value Index: {{outputs.value_index}}
                  Peer Benchmark: {{outputs.peer_benchmark_ratio}}
                  Churn Risk: {{outputs.churn_risk}}/100
                `
              },
              {
                id: 'data-quality',
                title: 'Data Quality Indicators',
                type: 'quality_badges',
                content: '{{outputs.data_quality}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 4: ENGAGEMENT STRATEGY
    // =========================================================================
    {
      id: 'engagement-strategy',
      name: 'Engagement Strategy',
      type: 'planning',
      estimatedTime: '10-15min',

      execution: {
        llmPrompt: `
          ENGAGEMENT STRATEGY PLANNING

          Customer: {{customer.name}}
          Target Price: ${{outputs.target_price}}
          Increase: {{outputs.increase_percent}}%
          Renewal in: {{workflow.daysUntilRenewal}} days

          CONTEXT:
          - Stakeholders: {{discovery.stakeholders}}
          - Pricing Confidence: {{outputs.confidence_score}}/100
          - Key Risks: {{discovery.red_flags}}
          - Key Strengths: {{discovery.strengths}}

          TASK:
          Define HOW and WHEN to engage customer for renewal conversation.

          DECISIONS TO MAKE:

          1. **TIMING: When to Engage?**

             Current date: {{workflow.currentDate}}
             Days until renewal: {{workflow.daysUntilRenewal}}
             Contract notice deadline: Day {{discovery.notice_deadline || 90}}

             Recommended timing:
             - First engagement: Day 105-110 (informal value conversation)
             - Pricing preview: Day 95-100 (prepare for notice deadline)
             - Formal proposal: Day 90 (at Engage stage start)

             Consider:
             - Customer budget cycles
             - Stakeholder availability
             - Time needed for internal approvals
             - Notice period requirements

             Decision: Engage on Day _____ (date: ______)

          2. **WHO: Engagement Sequence**

             Available stakeholders:
             {{#each discovery.stakeholders}}
             - {{this.name}} ({{this.role}}): Relationship {{this.relationshipStrength}}/10, Sentiment: {{this.sentiment}}
             {{/each}}

             Recommended sequence:
             1. Start with Champion (build internal support first)
             2. Then Decision Maker (get business buy-in)
             3. Finally Economic Buyer (present with champion support)

             OR if risk is high:
             1. Economic Buyer first (secure budget)
             2. Then Decision Maker (operational approval)
             3. Champion reinforces (technical advocacy)

             Your sequence:
             1. _____________ (role: ______, why: ______)
             2. _____________ (role: ______, why: ______)
             3. _____________ (role: ______, why: ______)

          3. **HOW: Engagement Approach**

             Based on pricing recommendation and risk level:

             If pricing increase is modest (3-5%) and confidence high:
             → "Business as Usual" approach
             → Focus on continuity, value delivered
             → Simple renewal conversation

             If pricing increase is significant (5-8%) or confidence medium:
             → "Value-First" approach
             → Lead with ROI, quantified benefits
             → Justify increase with data
             → Recommended collateral: ROI deck, usage report, case studies

             If at-risk or competitive pressure:
             → "Strategic Partnership" approach
             → Executive engagement
             → Focus on long-term value, roadmap alignment
             → Recommended collateral: Strategic roadmap, benchmark data

             Your approach: _____________
             Rationale: _____________

          4. **MESSAGING**

             Core message based on pricing scenario:

             Conservative increase (3-5%):
             "We've delivered [X value], usage has grown [Y%], and we're keeping pricing aligned with market while continuing to invest in your success."

             Market-aligned increase (5-8%):
             "Your team has achieved [quantified results], adoption has increased [X%], and our pricing reflects the expanded value you're realizing. Here's the ROI breakdown..."

             Aggressive increase (8%+):
             "You've transformed [business outcome] using our platform, realizing [$ savings/revenue], and we're proposing pricing that aligns with this strategic value while remaining competitive with market rates."

             Your messaging framework:
             - Value hook: _______________
             - Supporting data: _______________
             - Pricing framing: _______________

          5. **COLLATERAL NEEDED**

             Based on your approach, what materials do you need?

             Common collateral:
             □ ROI/Value Realization Report
             □ Usage Analytics Dashboard
             □ Competitive Benchmark Analysis
             □ Product Roadmap Preview
             □ Case Studies/Reference Stories
             □ Pricing Justification Document
             □ Contract Comparison (old vs. new)
             □ Executive Summary Deck

             Select and prioritize: _____________

          OUTPUT FORMAT:
          {
            "timing": {
              "firstEngagement": "Day 105 (2025-11-15)",
              "pricingPreview": "Day 95 (2025-11-25)",
              "formalProposal": "Day 90 (2025-11-30)"
            },
            "sequence": [
              { "order": 1, "stakeholder": "...", "role": "...", "objective": "..." },
              { "order": 2, "stakeholder": "...", "role": "...", "objective": "..." },
              { "order": 3, "stakeholder": "...", "role": "...", "objective": "..." }
            ],
            "approach": "Value-First | Business as Usual | Strategic Partnership",
            "messaging": {
              "valueHook": "...",
              "supportingData": [...],
              "pricingFraming": "..."
            },
            "collateral": [
              { "item": "ROI Report", "priority": "High", "dueBy": "Day 100" },
              ...
            ]
          }
        `,

        dataRequired: [
          'customer.name',
          'workflow.daysUntilRenewal',
          'outputs.target_price',
          'outputs.increase_percent',
          'outputs.confidence_score',
          'discovery.stakeholders',
          'discovery.red_flags',
          'discovery.strengths',
          'discovery.notice_deadline'
        ],

        processor: 'generators/engagementStrategy.js',

        outputs: [
          'engagement_timing',
          'stakeholder_sequence',
          'engagement_approach',
          'messaging_framework',
          'required_collateral'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '📅 **ENGAGEMENT STRATEGY**\n\n{{customer.name}}\nTarget Price: ${{outputs.target_price}} ({{outputs.increase_percent}}% increase)\nConfidence: {{outputs.confidence_score}}/100\n\nLet\'s plan your engagement strategy.\n\n**Question 1:** When should you start the renewal conversation?\n\nRecommendation: Day 105 (in ~15 days)\nRationale: Gives time for value briefing before Day 90 notice deadline',
            buttons: [
              { label: 'Day 105 (Recommended)', value: 'day_105' },
              { label: 'Day 110 (Earlier)', value: 'day_110' },
              { label: 'Day 100 (Later)', value: 'day_100' },
              { label: 'Custom Date', value: 'custom' }
            ]
          },

          branches: {
            // Progressive engagement planning
          }
        },

        artifacts: [
          {
            id: 'engagement-playbook',
            title: 'Engagement Playbook - {{customer.name}}',
            type: 'plan',
            icon: '📋',
            visible: false,

            sections: [
              {
                id: 'timeline',
                title: 'Engagement Timeline',
                type: 'timeline',
                content: '{{outputs.engagement_timing}}'
              },
              {
                id: 'sequence',
                title: 'Stakeholder Sequence',
                type: 'ordered_list',
                content: '{{outputs.stakeholder_sequence}}'
              },
              {
                id: 'approach',
                title: 'Engagement Approach',
                type: 'text',
                content: '{{outputs.engagement_approach}}'
              },
              {
                id: 'messaging',
                title: 'Messaging Framework',
                type: 'data',
                content: '{{outputs.messaging_framework}}'
              },
              {
                id: 'collateral',
                title: 'Required Collateral',
                type: 'checklist',
                content: '{{outputs.required_collateral}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 5: ACTION PLAN (120-DAY EXECUTION)
    // =========================================================================
    {
      ...ActionPlanStep,

      execution: {
        ...ActionPlanStep.execution,

        llmPrompt: `
          ${ActionPlanStep.execution.llmPrompt}

          ═══════════════════════════════════════════════════════════════════════
          PREPARE STAGE SPECIFIC CONTEXT
          ═══════════════════════════════════════════════════════════════════════

          This is the PREPARE stage (120-149 days until renewal).

          Focus Areas:
          - Final pricing decision locked in
          - Engagement strategy ready to execute
          - Collateral preparation for value presentation
          - 120-day execution plan to Engage stage

          TYPICAL AI TASK PRIORITIES FOR PREPARE:
          1. Update Salesforce opportunity with target price (${{outputs.target_price}})
          2. Generate ROI/Value Realization Report (if required collateral)
          3. Schedule engagement timeline reminders (Day 105, 95, 90)
          4. Create pricing justification document
          5. Schedule next workflow trigger (Engage stage at Day 100)

          TYPICAL CSM TASK PRIORITIES FOR PREPARE:
          1. Prepare required collateral (ROI deck, usage reports, benchmarks)
          2. Conduct stakeholder pre-engagement (champion alignment)
          3. Schedule engagement meetings per timeline
          4. Coordinate internal approvals (pricing, legal, finance)
          5. Practice value presentation / pricing conversation

          NEXT WORKFLOW EXPECTATION:
          - Next Stage: Engage (90-119 days)
          - Trigger Condition: Day 100, OR when pricing finalized
          - Focus: Active stakeholder engagement, proposal presentation

          KEY PREPARE OUTPUTS TO REFERENCE:
          - Data Snapshot: {{outputs.usage_growth}}, {{outputs.overall_health}}
          - Pricing Strategy: {{outputs.pricing_goal}}, {{outputs.nrr_target}}
          - Pricing Recommendation: ${{outputs.target_price}} ({{outputs.increase_percent}}% increase), Confidence: {{outputs.confidence_score}}/100
          - Engagement Strategy: {{outputs.engagement_approach}}, Timeline: {{outputs.engagement_timing}}
          - Required Collateral: {{outputs.required_collateral}}

          PRICING LOCKED IN:
          This is a KEY milestone. Pricing decision is FINAL after this step.
          Action plan should include tasks to lock in pricing internally and prepare for customer engagement.

          Use these outputs to inform your action plan generation.
        `
      }
    }
  ]
};

export default PrepareRenewalWorkflow;
