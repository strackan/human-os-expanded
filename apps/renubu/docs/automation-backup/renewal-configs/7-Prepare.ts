/**
 * Prepare Renewal Workflow
 *
 * Triggered when: 120-179 days until renewal
 * Urgency: MEDIUM - Strategic planning phase
 *
 * Purpose: Proactive renewal preparation with time for strategic planning
 * - Long-term relationship assessment
 * - Strategic expansion opportunities
 * - Success plan development
 * - Proactive value demonstration
 */

import { WorkflowDefinition } from '../workflow-types';

export const PrepareRenewalWorkflow: WorkflowDefinition = {
  // ============================================================================
  // METADATA
  // ============================================================================
  id: 'prepare-renewal',
  type: 'renewal',
  stage: 'Prepare',
  name: 'Strategic Renewal Preparation',
  description: '120-179 days until renewal - strategic planning phase',

  // ============================================================================
  // SCORING (for priority calculation)
  // ============================================================================
  baseScore: 50,        // Moderate base score (strategic timing)
  urgencyScore: 40,     // Moderate urgency

  // ============================================================================
  // TRIGGER CONDITIONS
  // ============================================================================
  trigger: {
    type: 'days_based',
    config: {
      daysMin: 120,
      daysMax: 179
    }
  },

  // ============================================================================
  // WORKFLOW STEPS
  // ============================================================================
  steps: [

    // ========================================================================
    // STEP 1: STRATEGIC RELATIONSHIP ASSESSMENT
    // ========================================================================
    {
      id: 'strategic-relationship-assessment',
      name: 'Strategic Relationship Assessment',
      type: 'data_analysis',
      estimatedTime: '20min',

      execution: {
        llmPrompt: `
          STRATEGIC RENEWAL ASSESSMENT

          Customer: {{customer.name}}
          ARR: ${{customer.arr}}
          Days until renewal: {{workflow.daysUntilRenewal}} ({{math workflow.daysUntilRenewal / 30}} months)

          Relationship Health:
          - Overall health score: {{intelligence.healthScore}}/100
          - Risk score: {{intelligence.riskScore}}/100
          - Sentiment: {{intelligence.sentiment}}
          - Last QBR: {{data.engagement.qbrStatus.lastQBR}}
          - QBR completion status: {{data.engagement.qbrStatus.completed}}

          Performance Metrics:
          - Current ARR: ${{customer.arr}}
          - ARR history: {{data.financials.arrHistory}}
          - Usage utilization: {{data.usage.utilizationRate}}
          - Feature adoption: Core {{data.usage.featureAdoption.corePlatform}}, Advanced {{data.usage.featureAdoption.advancedFeatures}}
          - Active users: {{data.usage.activeUsers}} / {{data.usage.licensedUsers}}
          - Usage trend: {{data.usage.trend}} ({{data.usage.changePercent}}%)

          Engagement Quality:
          - Meeting frequency: {{data.engagement.meetingFrequency}}
          - Last meeting: {{data.engagement.lastMeeting}}
          - Support tickets resolved: {{data.engagement.supportTickets.resolved}}
          - Avg resolution time: {{data.engagement.supportTickets.avgResolutionTime}}

          Business Context:
          - Account plan type: {{context.account_plan}}
          - Primary contacts: {{data.salesforce.contacts}}
          - Opportunity details: {{data.salesforce.opportunities}}

          AI Insights: {{intelligence.aiSummary}}
          Recommendations: {{intelligence.recommendations}}

          TASK: Provide strategic renewal assessment:
          1. **Relationship Strength Analysis**
             - Overall relationship quality (Strong/Moderate/Needs Work)
             - Key stakeholder relationships and engagement level
             - Executive sponsorship status

          2. **Value Delivery Assessment**
             - ROI delivered to date
             - Feature adoption vs. potential
             - Unrealized value opportunities

          3. **Expansion Potential**
             - Upsell opportunities (additional seats, features, products)
             - Cross-sell potential
             - Multi-year commitment feasibility
             - Target ARR for renewal (realistic growth %)

          4. **Risk & Opportunity Profile**
             - Early warning signs to monitor
             - Competitive threats (if any)
             - Champion stability
             - Success factors to amplify

          5. **Strategic Action Plan** (4-6 month timeline)
             - Month 1-2: Relationship strengthening initiatives
             - Month 3-4: Value demonstration and expansion discussions
             - Month 5-6: Renewal preparation and proposal
             - Key milestones and check-in points

          6. **Recommended Approach**
             - Renewal strategy (maintain, expand, defend)
             - Engagement cadence recommendation
             - Success metrics to track
             - Next immediate action

          Be strategic and forward-looking. We have time to build value and strengthen the relationship.
        `,

        dataRequired: [
          'customer.arr',
          'customer.renewalDate',
          'intelligence.healthScore',
          'intelligence.riskScore',
          'intelligence.sentiment',
          'intelligence.aiSummary',
          'intelligence.recommendations',
          'data.usage.utilizationRate',
          'data.usage.featureAdoption',
          'data.usage.trend',
          'data.engagement.qbrStatus',
          'data.engagement.meetingFrequency',
          'data.engagement.supportTickets',
          'data.financials.arrHistory',
          'data.salesforce.contacts',
          'context.account_plan'
        ],

        processor: 'analyzers/strategicRenewalAssessment.js',

        outputs: [
          'relationship_strength',
          'value_delivered',
          'expansion_opportunities',
          'risk_opportunity_profile',
          'strategic_action_plan',
          'renewal_approach'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '📋 **STRATEGIC RENEWAL PLANNING**\n\n{{customer.name}} (ARR: ${{customer.arr}}) renewal is in **{{workflow.daysUntilRenewal}} days** (~{{math workflow.daysUntilRenewal / 30}} months).\n\nHealth Score: {{intelligence.healthScore}}/100 | Risk Score: {{intelligence.riskScore}}/100\n\nWe have time to be strategic. Running comprehensive assessment...',
            buttons: [
              { label: 'View Strategic Assessment', value: 'view_assessment', action: 'show_artifact', artifactId: 'strategic-assessment' },
              { label: 'See Expansion Opportunities', value: 'view_expansion', action: 'show_artifact', artifactId: 'expansion-analysis' },
              { label: 'Review Action Plan', value: 'view_plan', action: 'show_artifact', artifactId: 'strategic-plan' }
            ]
          },

          branches: {
            'view_assessment': {
              response: 'Here\'s the comprehensive strategic assessment for {{customer.name}}:',
              actions: ['show_artifact'],
              artifactId: 'strategic-assessment',
              nextButtons: [
                { label: 'See Expansion Opportunities', value: 'view_expansion' },
                { label: 'Review Action Plan', value: 'view_plan' },
                { label: 'Proceed to Planning', value: 'proceed' }
              ]
            },
            'view_expansion': {
              response: 'Based on their usage and potential, here are expansion opportunities:',
              actions: ['show_artifact'],
              artifactId: 'expansion-analysis',
              nextButtons: [
                { label: 'View Assessment', value: 'view_assessment' },
                { label: 'Review Action Plan', value: 'view_plan' }
              ]
            },
            'view_plan': {
              response: 'Here\'s your {{math workflow.daysUntilRenewal / 30}}-month strategic action plan:',
              actions: ['show_artifact'],
              artifactId: 'strategic-plan',
              nextButtons: [
                { label: 'Start Planning', value: 'proceed' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'strategic-assessment',
            title: 'Strategic Assessment - {{customer.name}}',
            type: 'report',
            icon: '🎯',
            visible: false,

            sections: [
              {
                id: 'relationship',
                title: 'Relationship Strength',
                type: 'scorecard',
                content: {
                  score: '{{outputs.relationship_strength.score}}',
                  level: '{{outputs.relationship_strength.quality}}',
                  factors: '{{outputs.relationship_strength.factors}}',
                  executiveSponsor: '{{outputs.relationship_strength.executiveSponsor}}'
                }
              },
              {
                id: 'value',
                title: 'Value Delivered',
                type: 'metrics',
                content: {
                  roi: '{{outputs.value_delivered.roi}}',
                  adoption: '{{outputs.value_delivered.featureAdoption}}',
                  unrealized: '{{outputs.value_delivered.unrealizedOpportunities}}'
                }
              },
              {
                id: 'risk-opportunity',
                title: 'Risk & Opportunity Profile',
                type: 'split',
                content: {
                  risks: {
                    title: 'Early Warning Signs',
                    items: '{{outputs.risk_opportunity_profile.risks}}',
                    severity: '{{outputs.risk_opportunity_profile.riskLevel}}'
                  },
                  opportunities: {
                    title: 'Success Factors',
                    items: '{{outputs.risk_opportunity_profile.opportunities}}',
                    potential: '{{outputs.risk_opportunity_profile.opportunityLevel}}'
                  }
                }
              },
              {
                id: 'approach',
                title: 'Recommended Approach',
                type: 'card',
                highlighted: true,
                content: {
                  strategy: '{{outputs.renewal_approach.strategy}}',
                  rationale: '{{outputs.renewal_approach.rationale}}',
                  targetARR: '{{outputs.renewal_approach.targetARR}}',
                  growthPercent: '{{outputs.renewal_approach.growthPercent}}',
                  engagement: '{{outputs.renewal_approach.engagementCadence}}'
                }
              }
            ]
          },

          {
            id: 'expansion-analysis',
            title: 'Expansion Opportunities - {{customer.name}}',
            type: 'opportunities',
            icon: '💡',
            visible: false,

            content: {
              currentARR: '{{customer.arr}}',
              targetARR: '{{outputs.expansion_opportunities.targetARR}}',
              potentialGrowth: '{{outputs.expansion_opportunities.growthPercent}}%',

              opportunities: [
                {
                  type: 'Seat Expansion',
                  description: '{{outputs.expansion_opportunities.seatExpansion.description}}',
                  potentialARR: '{{outputs.expansion_opportunities.seatExpansion.potentialARR}}',
                  confidence: '{{outputs.expansion_opportunities.seatExpansion.confidence}}',
                  timeframe: '{{outputs.expansion_opportunities.seatExpansion.timeframe}}',
                  nextSteps: '{{outputs.expansion_opportunities.seatExpansion.nextSteps}}'
                },
                {
                  type: 'Feature Upsell',
                  description: '{{outputs.expansion_opportunities.featureUpsell.description}}',
                  potentialARR: '{{outputs.expansion_opportunities.featureUpsell.potentialARR}}',
                  confidence: '{{outputs.expansion_opportunities.featureUpsell.confidence}}'
                },
                {
                  type: 'Multi-Year Commitment',
                  description: '{{outputs.expansion_opportunities.multiYear.description}}',
                  discount: '{{outputs.expansion_opportunities.multiYear.discountOffered}}',
                  netBenefit: '{{outputs.expansion_opportunities.multiYear.netBenefit}}'
                }
              ]
            }
          },

          {
            id: 'strategic-plan',
            title: '{{math workflow.daysUntilRenewal / 30}}-Month Strategic Plan',
            type: 'timeline',
            icon: '📅',
            visible: false,

            content: {
              overview: '{{outputs.strategic_action_plan.overview}}',

              phases: [
                {
                  name: 'Month 1-2: Strengthen Relationships',
                  timeframe: 'Days 1-60',
                  focus: 'Build executive relationships, demonstrate value, identify champions',
                  activities: '{{outputs.strategic_action_plan.phase1.activities}}',
                  goals: '{{outputs.strategic_action_plan.phase1.goals}}',
                  successMetrics: '{{outputs.strategic_action_plan.phase1.metrics}}'
                },
                {
                  name: 'Month 3-4: Value Expansion',
                  timeframe: 'Days 61-120',
                  focus: 'Increase adoption, introduce new features, explore expansion',
                  activities: '{{outputs.strategic_action_plan.phase2.activities}}',
                  goals: '{{outputs.strategic_action_plan.phase2.goals}}',
                  successMetrics: '{{outputs.strategic_action_plan.phase2.metrics}}'
                },
                {
                  name: 'Month 5-6: Renewal Preparation',
                  timeframe: 'Days 121-{{workflow.daysUntilRenewal}}',
                  focus: 'Formal renewal discussions, proposal preparation, negotiation',
                  activities: '{{outputs.strategic_action_plan.phase3.activities}}',
                  goals: '{{outputs.strategic_action_plan.phase3.goals}}',
                  successMetrics: '{{outputs.strategic_action_plan.phase3.metrics}}'
                }
              ],

              milestones: [
                { day: 30, event: 'Executive QBR completed', critical: true },
                { day: 60, event: 'Champion engagement secured', critical: true },
                { day: 90, event: 'Value expansion discussion initiated', critical: false },
                { day: 120, event: 'Renewal proposal drafted', critical: true },
                { day: '{{workflow.daysUntilRenewal}} - 30', event: 'Formal renewal conversation', critical: true }
              ],

              nextImmediate: '{{outputs.strategic_action_plan.nextImmediate}}'
            }
          }
        ]
      }
    },

    // ========================================================================
    // STEP 2: VALUE DEMONSTRATION PLAN
    // ========================================================================
    {
      id: 'value-demonstration-plan',
      name: 'Value Demonstration Plan',
      type: 'planning',
      estimatedTime: '15min',

      execution: {
        llmPrompt: `
          Create value demonstration plan for {{customer.name}}.

          Context:
          - Current ARR: ${{customer.arr}}
          - Health score: {{intelligence.healthScore}}/100
          - Usage rate: {{data.usage.utilizationRate}}
          - Feature adoption: {{data.usage.featureAdoption}}
          - Months until renewal: {{math workflow.daysUntilRenewal / 30}}

          Value Delivered: {{outputs.value_delivered}}
          Unrealized Opportunities: {{outputs.value_delivered.unrealizedOpportunities}}

          Create a comprehensive plan to demonstrate and amplify value:

          1. **ROI Quantification**
             - Calculate concrete ROI metrics (time saved, cost reduced, revenue enabled)
             - Document success stories and wins
             - Prepare business case materials

          2. **Success Story Development**
             - Identify 3-5 key wins to highlight
             - Create compelling narratives
             - Gather testimonials from key users

          3. **Feature Adoption Initiatives**
             - Identify underutilized features with high value
             - Create adoption campaign plan
             - Training and enablement recommendations

          4. **Executive Value Presentation**
             - Create executive business review deck
             - Prepare value summary one-pager
             - Draft renewal conversation talking points

          5. **Ongoing Value Tracking**
             - KPIs to monitor monthly
             - Success metrics to share in QBRs
             - Dashboard for customer visibility

          Make it actionable with specific deliverables and owners.
        `,

        dataRequired: [
          'customer.arr',
          'data.usage',
          'outputs.value_delivered',
          'outputs.expansion_opportunities'
        ],

        processor: 'generators/valueDemonstrationPlan.js',

        outputs: [
          'roi_quantification',
          'success_stories',
          'adoption_initiatives',
          'executive_materials',
          'tracking_plan'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: 'Let\'s build a value demonstration plan. We have {{math workflow.daysUntilRenewal / 30}} months to strengthen the case for renewal.\n\nWhat would you like to focus on first?',
            buttons: [
              { label: 'Quantify ROI', value: 'roi', action: 'show_artifact', artifactId: 'roi-calculator' },
              { label: 'Document Success Stories', value: 'stories', action: 'show_artifact', artifactId: 'success-stories' },
              { label: 'Plan Feature Adoption', value: 'adoption', action: 'show_artifact', artifactId: 'adoption-plan' },
              { label: 'Create Executive Materials', value: 'exec', action: 'show_artifact', artifactId: 'exec-materials' }
            ]
          },

          branches: {
            'roi': {
              response: 'Here\'s the ROI analysis for {{customer.name}}. You can customize the metrics:',
              actions: ['show_artifact'],
              artifactId: 'roi-calculator',
              nextButtons: [
                { label: 'Export ROI Report', value: 'export_roi', action: 'export_pdf' },
                { label: 'Next: Success Stories', value: 'stories' }
              ]
            },
            'stories': {
              response: 'I\'ve identified key success stories to highlight:',
              actions: ['show_artifact'],
              artifactId: 'success-stories',
              nextButtons: [
                { label: 'Add More Stories', value: 'add_story', action: 'create_item' },
                { label: 'Next: Adoption Plan', value: 'adoption' }
              ]
            },
            'adoption': {
              response: 'Here\'s a plan to increase feature adoption and demonstrate more value:',
              actions: ['show_artifact'],
              artifactId: 'adoption-plan',
              nextButtons: [
                { label: 'Create Training Materials', value: 'training', action: 'generate_training' },
                { label: 'Next: Executive Materials', value: 'exec' }
              ]
            },
            'exec': {
              response: 'I\'ve prepared executive-level materials for renewal conversations:',
              actions: ['show_artifact'],
              artifactId: 'exec-materials',
              nextButtons: [
                { label: 'Customize Materials', value: 'customize', action: 'edit_artifact' },
                { label: 'Complete Step', value: 'complete', action: 'complete_step' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'roi-calculator',
            title: 'ROI Analysis - {{customer.name}}',
            type: 'calculator',
            icon: '📈',
            visible: false,
            editable: true,

            content: {
              currentARR: '{{customer.arr}}',

              calculations: [
                {
                  metric: 'Time Saved',
                  calculation: '{{outputs.roi_quantification.timeSaved}}',
                  dollarValue: '{{outputs.roi_quantification.timeSavedValue}}',
                  methodology: '{{outputs.roi_quantification.timeSavedMethod}}'
                },
                {
                  metric: 'Cost Reduction',
                  calculation: '{{outputs.roi_quantification.costReduced}}',
                  dollarValue: '{{outputs.roi_quantification.costReducedValue}}'
                },
                {
                  metric: 'Revenue Enabled',
                  calculation: '{{outputs.roi_quantification.revenueEnabled}}',
                  dollarValue: '{{outputs.roi_quantification.revenueValue}}'
                }
              ],

              totalROI: {
                value: '{{outputs.roi_quantification.totalROI}}',
                multiple: '{{outputs.roi_quantification.roiMultiple}}x',
                paybackPeriod: '{{outputs.roi_quantification.paybackMonths}} months'
              }
            }
          },

          {
            id: 'success-stories',
            title: 'Success Stories',
            type: 'collection',
            icon: '⭐',
            visible: false,

            content: {
              stories: '{{outputs.success_stories}}',

              template: {
                title: '[Story Title]',
                challenge: '[What problem did they face?]',
                solution: '[How did we help?]',
                result: '[What was the measurable outcome?]',
                quote: '[Optional testimonial]',
                stakeholder: '[Who can speak to this?]'
              }
            }
          },

          {
            id: 'adoption-plan',
            title: 'Feature Adoption Plan',
            type: 'action_plan',
            icon: '🎯',
            visible: false,

            content: {
              underutilizedFeatures: '{{outputs.adoption_initiatives.underutilized}}',

              initiatives: '{{outputs.adoption_initiatives.campaigns}}',

              timeline: '{{outputs.adoption_initiatives.timeline}}',

              successMetrics: '{{outputs.adoption_initiatives.metrics}}'
            }
          },

          {
            id: 'exec-materials',
            title: 'Executive Materials Package',
            type: 'document_package',
            icon: '📊',
            visible: false,
            editable: true,

            content: {
              businessReviewDeck: {
                title: 'Executive Business Review - {{customer.name}}',
                slides: '{{outputs.executive_materials.deck}}'
              },

              onePager: {
                title: 'Value Summary',
                content: '{{outputs.executive_materials.onePager}}'
              },

              talkingPoints: {
                title: 'Renewal Conversation Guide',
                points: '{{outputs.executive_materials.talkingPoints}}'
              }
            }
          }
        ]
      }
    },

    // ========================================================================
    // STEP 3: RELATIONSHIP BUILDING
    // ========================================================================
    {
      id: 'relationship-building',
      name: 'Relationship Building',
      type: 'action',
      estimatedTime: '10min',

      execution: {
        llmPrompt: `
          Create relationship building plan for {{customer.name}} renewal.

          Relationship Strength: {{outputs.relationship_strength}}
          Stakeholders: {{data.salesforce.contacts}}
          Last QBR: {{data.engagement.qbrStatus.lastQBR}}

          Develop multi-touch relationship strategy:
          1. QBR cadence and agenda planning
          2. Executive engagement plan
          3. Champion cultivation approach
          4. Team training and enablement sessions
          5. Regular check-in schedule

          Make it personal and relationship-focused, not just transactional.
        `,

        dataRequired: [
          'data.salesforce.contacts',
          'outputs.relationship_strength',
          'outputs.strategic_action_plan'
        ],

        processor: 'generators/relationshipPlan.js',

        outputs: [
          'qbr_plan',
          'executive_engagement',
          'touch_calendar'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: 'Time to strengthen relationships with {{customer.name}}. I\'ve created a relationship building plan for the next {{math workflow.daysUntilRenewal / 30}} months.\n\nWhat would you like to schedule first?',
            buttons: [
              { label: 'Schedule QBR', value: 'qbr', action: 'show_artifact', artifactId: 'qbr-plan' },
              { label: 'Plan Executive Engagement', value: 'exec', action: 'show_artifact', artifactId: 'exec-plan' },
              { label: 'View Touch Calendar', value: 'calendar', action: 'show_artifact', artifactId: 'touch-calendar' }
            ]
          },

          branches: {
            'qbr': {
              response: 'Here\'s your QBR plan with suggested agenda and cadence:',
              actions: ['show_artifact'],
              artifactId: 'qbr-plan',
              nextButtons: [
                { label: 'Send QBR Invite', value: 'send_qbr', action: 'send_calendar_invite' },
                { label: 'Next: Executive Plan', value: 'exec' }
              ]
            },
            'exec': {
              response: 'Here\'s your executive engagement strategy:',
              actions: ['show_artifact'],
              artifactId: 'exec-plan',
              nextButtons: [
                { label: 'Draft Executive Email', value: 'draft_exec', action: 'generate_email' },
                { label: 'View Calendar', value: 'calendar' }
              ]
            },
            'calendar': {
              response: 'Here\'s your complete touch calendar for the next {{math workflow.daysUntilRenewal / 30}} months:',
              actions: ['show_artifact'],
              artifactId: 'touch-calendar',
              nextButtons: [
                { label: 'Add to My Calendar', value: 'sync', action: 'calendar_sync' },
                { label: 'Complete Step', value: 'complete', action: 'complete_step' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'qbr-plan',
            title: 'QBR Plan',
            type: 'meeting_plan',
            icon: '📅',
            visible: false,

            content: {
              cadence: '{{outputs.qbr_plan.cadence}}',
              nextQBR: '{{outputs.qbr_plan.nextDate}}',

              agenda: '{{outputs.qbr_plan.agenda}}',

              invitees: '{{outputs.qbr_plan.invitees}}',

              preparationChecklist: '{{outputs.qbr_plan.preparation}}'
            }
          },

          {
            id: 'exec-plan',
            title: 'Executive Engagement Plan',
            type: 'engagement_plan',
            icon: '🤝',
            visible: false,

            content: {
              executiveContacts: '{{outputs.executive_engagement.contacts}}',

              engagementStrategy: '{{outputs.executive_engagement.strategy}}',

              touchpoints: '{{outputs.executive_engagement.touchpoints}}'
            }
          },

          {
            id: 'touch-calendar',
            title: 'Relationship Touch Calendar',
            type: 'calendar',
            icon: '📆',
            visible: false,

            content: {
              touches: '{{outputs.touch_calendar}}'
            }
          }
        ]
      }
    }
  ]
};

export default PrepareRenewalWorkflow;
