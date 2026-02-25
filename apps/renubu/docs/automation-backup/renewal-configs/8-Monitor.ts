/**
 * Monitor Renewal Workflow
 *
 * Triggered when: 180+ days until renewal
 * Urgency: LOW - Proactive monitoring phase
 *
 * Purpose: Passive health monitoring and early warning detection
 * - Regular health checks
 * - Usage monitoring
 * - Relationship maintenance
 * - Early risk detection
 *
 * IMPORTANT: This workflow only fires when actionable recommendations exist.
 * No recommendations = No workflow created = No noise to CSM.
 */

import { WorkflowDefinition } from '../workflow-types';

export const MonitorRenewalWorkflow: WorkflowDefinition = {
  id: 'monitor-renewal',
  type: 'renewal',
  stage: 'Monitor',
  name: 'Renewal Monitoring',
  description: '180+ days until renewal - proactive health monitoring',

  baseScore: 20,        // Lowest priority
  urgencyScore: 10,     // Minimal urgency

  trigger: {
    type: 'days_based',
    config: {
      daysMin: 180,
      daysMax: null      // No upper limit
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
    // STEP 1: HEALTH CHECK REVIEW
    // =========================================================================
    {
      id: 'health-check',
      name: 'Health Check Review',
      type: 'data_analysis',
      estimatedTime: '10min',

      execution: {
        llmPrompt: `
          ROUTINE HEALTH CHECK - {{customer.name}}

          Customer: {{customer.name}}
          ARR: ${{customer.arr}}
          Renewal date: {{customer.renewalDate}} ({{workflow.daysUntilRenewal}} days away)

          Health Indicators:
          - Health score: {{intelligence.healthScore}}/100
          - Risk score: {{intelligence.riskScore}}/100
          - Usage trend: {{data.usage.trend}} ({{data.usage.changePercent}}%)
          - Feature adoption: {{data.usage.featureAdoption.corePlatform}}
          - Support health: {{data.engagement.supportTickets}}

          Engagement:
          - Last meeting: {{data.engagement.lastMeeting}}
          - Meeting frequency: {{data.engagement.meetingFrequency}}
          - Last QBR: {{data.engagement.lastQBR}}

          Assess:
          1. Overall health status (Excellent/Good/Fair/Concerning)
          2. Trending direction (Improving/Stable/Declining)
          3. Early warning signs (any red flags?)
          4. Notable patterns or changes
        `,

        dataRequired: [
          'intelligence.healthScore',
          'intelligence.riskScore',
          'data.usage.trend',
          'data.engagement.supportTickets',
          'data.engagement.lastMeeting'
        ],

        processor: 'analyzers/healthCheckMonitor.js',

        outputs: ['health_status', 'trending', 'early_warnings', 'patterns']
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '📊 **ROUTINE HEALTH CHECK**\n\n{{customer.name}} (ARR: ${{customer.arr}})\nRenewal in {{workflow.daysUntilRenewal}} days\n\nHealth: {{intelligence.healthScore}}/100 | Risk: {{intelligence.riskScore}}/100\n\nRunning health check...',
            buttons: [
              { label: 'View Health Report', value: 'view', action: 'show_artifact', artifactId: 'health' }
            ]
          },

          branches: {
            'view': {
              response: 'Here\'s the health assessment:',
              actions: ['show_artifact'],
              artifactId: 'health',
              nextButtons: [
                { label: 'View Recommendations', value: 'recommendations' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'health',
            title: 'Health Check - {{customer.name}}',
            type: 'report',
            icon: '📊',
            visible: false,

            sections: [
              {
                id: 'status',
                title: 'Overall Health',
                type: 'scorecard',
                content: {
                  score: '{{intelligence.healthScore}}',
                  status: '{{outputs.health_status}}',
                  trend: '{{outputs.trending}}'
                }
              },
              {
                id: 'warnings',
                title: 'Early Warning Signs',
                type: 'list',
                content: '{{outputs.early_warnings}}'
              },
              {
                id: 'patterns',
                title: 'Notable Patterns',
                type: 'list',
                content: '{{outputs.patterns}}'
              }
            ]
          }
        ]
      }
    },

    // =========================================================================
    // STEP 2: REVIEW RECOMMENDATIONS
    // =========================================================================
    {
      id: 'review-recommendations',
      name: 'Review Recommendations',
      type: 'action',
      estimatedTime: '5-15min',

      execution: {
        llmPrompt: `
          GENERATE MONITOR-STAGE RECOMMENDATIONS

          Customer: {{customer.name}}
          ARR: ${{customer.arr}}
          Renewal in: {{workflow.daysUntilRenewal}} days
          Health Status: {{outputs.health_status}}
          Trending: {{outputs.trending}}

          Context from Health Check:
          - Early Warnings: {{outputs.early_warnings}}
          - Patterns: {{outputs.patterns}}

          Full Customer Data:
          - Usage: {{data.usage}}
          - Engagement: {{data.engagement}}
          - Feature Adoption: {{data.usage.featureAdoption}}
          - Recent Product Releases: {{data.product.recentReleases}}

          VALID RECOMMENDATION TYPES for Monitor stage (180+ days):

          1. FEATURE_ADOPTION
             - new_feature_announcement: Announce new features aligned with usage
             - underutilized_feature: Highlight paid features not being used
             - advanced_capability_intro: Introduce advanced capabilities

          2. EXECUTIVE_ENGAGEMENT
             - conversation_starters: Talking points for next interaction
             - industry_insights: Share relevant industry trends/benchmarks
             - success_story_sharing: Share relevant customer success stories
             - personal_touchpoint: Send card, congratulations, personal note
             - product_roadmap_preview: Preview upcoming features

          3. PRICING_STRATEGY
             - usage_increase_justification: Document usage increases for future pricing
             - value_realization_documentation: Document ROI/value delivered

          TASK:
          Generate 0-4 recommendations that are:
          - Highly actionable and specific
          - Supported by data points from context
          - Appropriate for Monitor stage (low pressure, relationship building)
          - NOT urgent (this is 180+ days out)

          For each recommendation:
          {
            "category": "FEATURE_ADOPTION | EXECUTIVE_ENGAGEMENT | PRICING_STRATEGY",
            "subcategory": "<specific subcategory from above>",
            "title": "<5-8 words>",
            "description": "<1-2 sentences>",
            "rationale": "<why this matters now>",
            "dataPoints": [
              {
                "label": "<metric name>",
                "value": "<value>",
                "context": "<why this matters>",
                "source": "<field path>"
              }
            ],
            "impact": "low | medium | high",
            "urgency": "low | medium | high",
            "suggestedActions": ["send_email", "schedule_meeting", "review_data", "update_crm", "get_transcript", "skip", "snooze"]
          }

          Return JSON array. Empty array [] if no strong recommendations.
        `,

        dataRequired: [
          'outputs.health_status',
          'outputs.trending',
          'outputs.early_warnings',
          'outputs.patterns',
          'data.usage',
          'data.engagement',
          'data.product.recentReleases'
        ],

        processor: 'generators/monitorRecommendations.js',

        outputs: ['recommendations']
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: 'Based on the health check, here are my recommendations for {{customer.name}}:',
            buttons: 'dynamic' // Generated from recommendations
          },

          // Branches are dynamically generated based on recommendation actions
          // Example:
          // - If recommendation suggests "send_email" → Show email draft artifact
          // - If recommendation suggests "get_transcript" → Show transcript request
          // - If recommendation suggests "update_crm" → Show CRM update draft
          branches: {}
        },

        artifacts: [
          {
            id: 'recommendations',
            title: 'Recommendations - {{customer.name}}',
            type: 'recommendation_list',
            icon: '💡',
            visible: true, // Always visible in this step

            // Recommendation cards are dynamically generated
            // Each recommendation becomes a card with:
            // - Title, description, rationale
            // - Data points (evidence)
            // - Action buttons (based on suggestedActions)
            sections: [
              {
                id: 'recommendation-cards',
                title: 'Recommended Actions',
                type: 'dynamic_recommendations',
                content: '{{outputs.recommendations}}',

                // Card template for each recommendation:
                // ┌─────────────────────────────────────────────────────┐
                // │ 💡 {category} - {title}                             │
                // ├─────────────────────────────────────────────────────┤
                // │ {description}                                       │
                // │                                                     │
                // │ WHY THIS MATTERS:                                   │
                // │ {rationale}                                         │
                // │                                                     │
                // │ SUPPORTING DATA:                                    │
                // │ • {dataPoint.label}: {dataPoint.value}              │
                // │   {dataPoint.context}                               │
                // │                                                     │
                // │ [Send Email] [Schedule Meeting] [Skip] [Snooze]     │
                // └─────────────────────────────────────────────────────┘
              }
            ]
          },

          // Additional artifacts created dynamically based on actions:
          // - Email draft (if "send_email" action triggered)
          // - Meeting agenda (if "schedule_meeting" action triggered)
          // - CRM update draft (if "update_crm" action triggered)
          // - Transcript request (if "get_transcript" action triggered)
        ]
      }
    }
  ]
};

export default MonitorRenewalWorkflow;
