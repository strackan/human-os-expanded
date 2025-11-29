/**
 * Emergency Renewal Workflow
 *
 * Triggered when: 0-6 days until renewal
 * Urgency: CRITICAL - Immediate action required
 *
 * Purpose: Handle last-minute renewals with maximum urgency
 * - Rapid risk assessment
 * - Emergency stakeholder outreach
 * - Fast-track decision making
 * - Retention offers if needed
 */

import { WorkflowDefinition } from '../workflow-types';

export const EmergencyRenewalWorkflow: WorkflowDefinition = {
  // ============================================================================
  // METADATA
  // ============================================================================
  id: 'emergency-renewal',
  type: 'renewal',
  stage: 'Emergency',
  name: 'Emergency Renewal Protocol',
  description: '0-6 days until renewal - critical intervention required',

  // ============================================================================
  // SCORING (for priority calculation)
  // ============================================================================
  baseScore: 90,        // High base score (emergency = urgent)
  urgencyScore: 100,    // Maximum urgency

  // ============================================================================
  // TRIGGER CONDITIONS
  // ============================================================================
  trigger: {
    type: 'days_based',
    config: {
      daysMin: 0,
      daysMax: 6
    }
  },

  // ============================================================================
  // WORKFLOW STEPS
  // ============================================================================
  steps: [

    // ========================================================================
    // STEP 1: ASSESS EMERGENCY RISK
    // ========================================================================
    {
      id: 'assess-emergency-risk',
      name: 'Assess Emergency Risk',
      type: 'data_analysis',
      estimatedTime: '10min',

      // --------------------------------------------------------------------
      // BACKEND EXECUTION LOGIC
      // --------------------------------------------------------------------
      execution: {
        // LLM prompt for analyzing the emergency situation
        llmPrompt: `
          URGENT RENEWAL RISK ANALYSIS

          Customer: {{customer.name}}
          ARR: ${{customer.arr}}
          Days until renewal: {{workflow.daysUntilRenewal}}
          Current risk score: {{intelligence.riskScore}}

          Recent Activity:
          - Usage trend: {{data.usage.trend}} ({{data.usage.changePercent}}% change)
          - Last meeting: {{data.engagement.lastMeeting}}
          - Support tickets: {{data.engagement.supportTickets.open}} open
          - Last login: {{data.usage.lastActivity}}

          AI Summary: {{intelligence.aiSummary}}

          TASK: Provide emergency triage assessment:
          1. Immediate risk level (Critical/High/Medium)
          2. Primary blocker to renewal (if any)
          3. Recommended emergency action (call exec, offer discount, expedite feature, etc.)
          4. Talking points for emergency outreach
          5. Retention offer recommendation (discount %, contract flexibility)

          Be specific and actionable. Time is critical.
        `,

        // What data this step needs to execute
        dataRequired: [
          'customer.arr',
          'customer.renewalDate',
          'intelligence.riskScore',
          'intelligence.aiSummary',
          'data.usage.trend',
          'data.usage.changePercent',
          'data.engagement.lastMeeting',
          'data.engagement.supportTickets',
          'data.salesforce.opportunityStage'
        ],

        // Which backend processor handles this step
        processor: 'analyzers/emergencyRiskAssessment.js',

        // What this step produces (for next steps to use)
        outputs: [
          'emergency_assessment',
          'recommended_action',
          'talking_points',
          'retention_offer'
        ]
      },

      // --------------------------------------------------------------------
      // UI CONFIGURATION (What user sees and interacts with)
      // --------------------------------------------------------------------
      ui: {
        chat: {
          // Initial message when step loads
          initialMessage: {
            role: 'ai',
            text: '🚨 **EMERGENCY RENEWAL ALERT**\n\n{{customer.name}} (ARR: ${{customer.arr}}) renewal is in **{{workflow.daysUntilRenewal}} days**.\n\nRisk Score: {{intelligence.riskScore}}/100\n\n{{intelligence.aiSummary}}\n\nI\'m analyzing the situation now...',
            buttons: [
              {
                label: 'View Risk Analysis',
                value: 'view_risk',
                action: 'show_artifact',
                artifactId: 'risk-analysis'
              },
              {
                label: 'See Recommended Actions',
                value: 'view_actions',
                action: 'show_artifact',
                artifactId: 'action-plan'
              }
            ]
          },

          // What happens when user clicks buttons
          branches: {
            'view_risk': {
              response: 'Here\'s the emergency risk analysis. Red flags highlighted below.',
              actions: ['show_artifact'],
              artifactId: 'risk-analysis',
              nextButtons: [
                { label: 'Schedule Emergency Call', value: 'proceed_call' },
                { label: 'Review Retention Options', value: 'view_retention' }
              ]
            },
            'view_actions': {
              response: 'Based on the analysis, here\'s my recommended emergency action plan:',
              actions: ['show_artifact'],
              artifactId: 'action-plan',
              nextButtons: [
                { label: 'Proceed with Call', value: 'proceed_call' },
                { label: 'Draft Email First', value: 'draft_email' }
              ]
            },
            'view_retention': {
              response: 'Here are retention offer options based on their ARR and risk level:',
              actions: ['show_artifact'],
              artifactId: 'retention-offers',
              nextButtons: [
                { label: 'Use Recommended Offer', value: 'proceed_call' },
                { label: 'Customize Offer', value: 'customize' }
              ]
            }
          }
        },

        // --------------------------------------------------------------------
        // ARTIFACTS (Documents/reports shown alongside chat)
        // --------------------------------------------------------------------
        artifacts: [
          {
            id: 'risk-analysis',
            title: 'Emergency Risk Analysis - {{customer.name}}',
            type: 'report',
            icon: '🚨',
            visible: false, // Shown when user clicks button

            sections: [
              {
                id: 'alert',
                title: 'Critical Alert',
                type: 'alert',
                severity: 'critical',
                content: 'Renewal in {{workflow.daysUntilRenewal}} days. Immediate action required.'
              },
              {
                id: 'score',
                title: 'Risk Assessment',
                type: 'metric',
                content: {
                  label: 'Risk Score',
                  value: '{{intelligence.riskScore}}',
                  max: 100,
                  threshold: 70,
                  trend: '{{intelligence.sentiment}}'
                }
              },
              {
                id: 'red-flags',
                title: 'Red Flags',
                type: 'list',
                style: 'warning',
                content: '{{intelligence.insights}}'  // Array of insight objects
              },
              {
                id: 'recent-activity',
                title: 'Recent Activity',
                type: 'timeline',
                content: [
                  {
                    date: '{{data.engagement.lastMeeting}}',
                    event: 'Last Meeting',
                    status: '{{#if (olderThan data.engagement.lastMeeting 30)}}warning{{else}}ok{{/if}}'
                  },
                  {
                    date: '{{data.usage.lastActivity}}',
                    event: 'Last Login',
                    status: '{{#if (olderThan data.usage.lastActivity 7)}}warning{{else}}ok{{/if}}'
                  }
                ]
              },
              {
                id: 'contract-details',
                title: 'Contract Details',
                type: 'key-value',
                content: {
                  'ARR': '${{customer.arr}}',
                  'Renewal Date': '{{customer.renewalDate}}',
                  'Days Remaining': '{{workflow.daysUntilRenewal}}',
                  'Account Plan': '{{context.account_plan}}',
                  'Auto-Renew': '{{data.salesforce.autoRenew}}'
                }
              }
            ]
          },

          {
            id: 'action-plan',
            title: 'Emergency Action Plan',
            type: 'checklist',
            icon: '📋',
            visible: false,

            content: {
              intro: '**Recommended immediate actions** (in priority order):',
              items: [
                {
                  id: 'action-1',
                  text: 'Schedule emergency call with {{data.salesforce.contacts[0].name}} ({{data.salesforce.contacts[0].role}})',
                  priority: 'critical',
                  completed: false,
                  dueIn: '2 hours',
                  details: 'Key stakeholder. Last contacted {{data.engagement.lastMeeting}}.'
                },
                {
                  id: 'action-2',
                  text: 'Review and prepare retention offer ({{outputs.retention_offer.discountPercent}}% discount recommended)',
                  priority: 'high',
                  completed: false,
                  dueIn: '4 hours'
                },
                {
                  id: 'action-3',
                  text: 'Alert account executive: {{customer.owner.name}}',
                  priority: 'high',
                  completed: false,
                  dueIn: '1 hour'
                },
                {
                  id: 'action-4',
                  text: 'Escalate to VP Customer Success if no response within 24h',
                  priority: 'medium',
                  completed: false,
                  dueIn: '24 hours'
                }
              ]
            }
          },

          {
            id: 'retention-offers',
            title: 'Retention Offer Options',
            type: 'comparison',
            icon: '💰',
            visible: false,

            content: {
              options: [
                {
                  id: 'recommended',
                  title: 'Recommended Offer',
                  highlighted: true,
                  details: {
                    'Discount': '{{outputs.retention_offer.discountPercent}}%',
                    'New ARR': '${{outputs.retention_offer.newARR}}',
                    'Term Length': '{{outputs.retention_offer.termMonths}} months',
                    'Conditions': '{{outputs.retention_offer.conditions}}',
                    'Approval Needed': '{{outputs.retention_offer.approvalRequired}}'
                  },
                  reasoning: 'Based on ARR of ${{customer.arr}} and risk score of {{intelligence.riskScore}}'
                },
                {
                  id: 'aggressive',
                  title: 'Aggressive Retention',
                  details: {
                    'Discount': '20%',
                    'New ARR': '${{math customer.arr 0.8}}',
                    'Term Length': '24 months',
                    'Conditions': 'Multi-year commitment required',
                    'Approval Needed': 'VP approval required'
                  }
                },
                {
                  id: 'standard',
                  title: 'Standard Renewal',
                  details: {
                    'Discount': '5%',
                    'New ARR': '${{math customer.arr 0.95}}',
                    'Term Length': '12 months',
                    'Conditions': 'Standard terms',
                    'Approval Needed': 'None'
                  }
                }
              ]
            }
          }
        ]
      }
    },

    // ========================================================================
    // STEP 2: EMERGENCY OUTREACH
    // ========================================================================
    {
      id: 'emergency-outreach',
      name: 'Emergency Outreach',
      type: 'action',
      estimatedTime: '15min',

      execution: {
        llmPrompt: `
          Generate emergency outreach content for:

          Customer: {{customer.name}}
          Contact: {{data.salesforce.contacts[0].name}} ({{data.salesforce.contacts[0].role}})
          Email: {{data.salesforce.contacts[0].email}}

          Context:
          - {{workflow.daysUntilRenewal}} days until renewal
          - Risk level: {{outputs.emergency_assessment.riskLevel}}
          - Key blocker: {{outputs.emergency_assessment.primaryBlocker}}

          Create:
          1. Email subject line (urgent but professional)
          2. Email body (3 paragraphs max, action-oriented)
          3. Call script talking points (5 bullet points)
          4. Value proposition reminder (why they need us)

          Tone: Urgent but supportive. Focus on partnership, not pressure.
        `,

        dataRequired: [
          'customer.name',
          'data.salesforce.contacts',
          'outputs.emergency_assessment',
          'outputs.retention_offer'
        ],

        processor: 'generators/emergencyOutreach.js',

        outputs: [
          'outreach_email',
          'call_script',
          'talking_points'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: 'Now let\'s execute emergency outreach. I\'ve drafted personalized content based on {{customer.name}}\'s situation.\n\nReady to review?',
            buttons: [
              { label: 'Review Email Draft', value: 'review_email', action: 'show_artifact', artifactId: 'email-draft' },
              { label: 'See Call Script', value: 'review_script', action: 'show_artifact', artifactId: 'call-script' }
            ]
          },

          branches: {
            'review_email': {
              response: 'Here\'s the emergency outreach email. Feel free to customize before sending:',
              actions: ['show_artifact'],
              artifactId: 'email-draft',
              nextButtons: [
                { label: 'Send Email', value: 'send_email', action: 'send_email' },
                { label: 'Edit First', value: 'edit_email', action: 'edit_artifact' },
                { label: 'Call Instead', value: 'review_script' }
              ]
            },
            'review_script': {
              response: 'Here\'s your emergency call script with talking points:',
              actions: ['show_artifact'],
              artifactId: 'call-script',
              nextButtons: [
                { label: 'Make Call', value: 'make_call', action: 'make_call' },
                { label: 'Send Email First', value: 'review_email' }
              ]
            },
            'send_email': {
              response: '✅ Email sent to {{data.salesforce.contacts[0].email}}. I\'ll track opens and responses.\n\nNext: Follow up with call if no response in 4 hours?',
              actions: ['send_email', 'set_reminder'],
              nextButtons: [
                { label: 'Schedule Follow-Up', value: 'schedule_followup' },
                { label: 'Make Call Now', value: 'review_script' },
                { label: 'Complete Step', value: 'complete', action: 'complete_step' }
              ]
            },
            'make_call': {
              response: '📞 Call logged. How did it go?',
              actions: ['log_call'],
              nextButtons: [
                { label: 'Positive Response', value: 'call_positive' },
                { label: 'Left Voicemail', value: 'call_voicemail' },
                { label: 'No Answer', value: 'call_no_answer' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'email-draft',
            title: 'Emergency Outreach Email',
            type: 'email',
            icon: '📧',
            visible: false,
            editable: true,

            content: {
              to: '{{data.salesforce.contacts[0].email}}',
              cc: '{{customer.owner.email}}',
              subject: '{{outputs.outreach_email.subject}}',
              body: '{{outputs.outreach_email.body}}',

              attachments: [
                {
                  name: 'Contract Summary',
                  type: 'pdf',
                  generated: true
                }
              ],

              tracking: {
                trackOpens: true,
                trackClicks: true
              }
            }
          },

          {
            id: 'call-script',
            title: 'Emergency Call Script',
            type: 'script',
            icon: '📞',
            visible: false,

            content: {
              greeting: 'Hi {{data.salesforce.contacts[0].name}}, this is {{user.name}} from {{company.name}}.',

              sections: [
                {
                  title: 'Opening',
                  points: [
                    'I noticed your renewal is coming up on {{customer.renewalDate}} ({{workflow.daysUntilRenewal}} days)',
                    'I wanted to reach out personally to ensure we\'re aligned'
                  ]
                },
                {
                  title: 'Value Reminder',
                  points: '{{outputs.talking_points.valueProposition}}'
                },
                {
                  title: 'Address Concerns',
                  points: [
                    'Is there anything blocking the renewal?',
                    'How can we make this process smooth for you?'
                  ]
                },
                {
                  title: 'Offer (if needed)',
                  points: [
                    'We value your partnership. {{#if outputs.retention_offer}}I\'d like to discuss a {{outputs.retention_offer.discountPercent}}% discount for your continued commitment.{{/if}}'
                  ]
                },
                {
                  title: 'Next Steps',
                  points: [
                    'Can we schedule 30 minutes this week to finalize details?',
                    'I\'ll send a calendar invite right after this call'
                  ]
                }
              ],

              objectionHandlers: [
                {
                  objection: 'We\'re still evaluating',
                  response: 'I understand. What information do you need to make a decision? I can get that to you today.'
                },
                {
                  objection: 'Price is too high',
                  response: 'Let\'s discuss the ROI you\'ve seen. {{#if outputs.retention_offer}}I also have flexibility on pricing for a multi-year commitment.{{/if}}'
                },
                {
                  objection: 'Missing features',
                  response: 'Which features are critical? Let me connect you with our product team to discuss our roadmap.'
                }
              ]
            }
          }
        ]
      }
    },

    // ========================================================================
    // STEP 3: TRACK OUTCOME
    // ========================================================================
    {
      id: 'track-outcome',
      name: 'Track Outcome',
      type: 'review',
      estimatedTime: '5min',

      execution: {
        llmPrompt: `
          Record emergency renewal outcome for {{customer.name}}.

          Previous actions:
          - Risk assessed: {{outputs.emergency_assessment.riskLevel}}
          - Outreach completed: {{outputs.outreach_email.sent}} (email), {{outputs.call_script.completed}} (call)
          - Retention offer presented: {{outputs.retention_offer.presented}}

          Based on CSM notes, summarize:
          1. Current status (committed, still negotiating, at risk, lost)
          2. Next actions needed
          3. Follow-up date
          4. Lessons learned for future emergency renewals
        `,

        processor: 'trackers/emergencyOutcome.js',

        outputs: [
          'outcome_summary',
          'next_actions',
          'follow_up_date'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: 'Let\'s document the outcome of this emergency renewal effort.\n\nWhat\'s the current status with {{customer.name}}?',
            buttons: [
              { label: '✅ Renewed', value: 'renewed' },
              { label: '🤝 Negotiating', value: 'negotiating' },
              { label: '⚠️ Still At Risk', value: 'at_risk' },
              { label: '❌ Lost', value: 'lost' }
            ]
          },

          branches: {
            'renewed': {
              response: '🎉 Excellent! What was the key factor in saving this renewal?',
              nextButtons: [
                { label: 'Quick Response Time', value: 'factor_speed' },
                { label: 'Retention Discount', value: 'factor_discount' },
                { label: 'Executive Engagement', value: 'factor_exec' },
                { label: 'Other', value: 'factor_other' }
              ]
            },
            'negotiating': {
              response: 'What\'s the main sticking point? I\'ll help with next steps.',
              nextButtons: [
                { label: 'Pricing', value: 'blocker_price' },
                { label: 'Features', value: 'blocker_features' },
                { label: 'Contract Terms', value: 'blocker_terms' },
                { label: 'Internal Approval', value: 'blocker_approval' }
              ]
            },
            'at_risk': {
              response: 'Understood. What additional action should we take?',
              nextButtons: [
                { label: 'Executive Escalation', value: 'action_escalate' },
                { label: 'Better Offer Needed', value: 'action_offer' },
                { label: 'Technical Review', value: 'action_technical' }
              ]
            },
            'lost': {
              response: 'I\'m sorry to hear that. Let\'s document why so we can improve.\n\nWhat was the primary reason?',
              nextButtons: [
                { label: 'Switched to Competitor', value: 'lost_competitor' },
                { label: 'Budget Cuts', value: 'lost_budget' },
                { label: 'Product Fit', value: 'lost_fit' },
                { label: 'Other', value: 'lost_other' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'outcome-summary',
            title: 'Emergency Renewal Summary',
            type: 'report',
            icon: '📊',
            visible: true,

            content: {
              status: '{{outputs.outcome_summary.status}}',
              timeline: [
                { event: 'Workflow Started', time: '{{workflow.created_at}}' },
                { event: 'Risk Assessed', time: '{{steps[0].completed_at}}' },
                { event: 'Outreach Completed', time: '{{steps[1].completed_at}}' },
                { event: 'Outcome Recorded', time: 'Now' }
              ],
              metrics: {
                'Time to Resolution': '{{workflow.duration}} hours',
                'Touchpoints': '{{outputs.outcome_summary.touchpointCount}}',
                'Response Time': '{{outputs.outcome_summary.avgResponseTime}}'
              },
              nextSteps: '{{outputs.next_actions}}',
              followUpDate: '{{outputs.follow_up_date}}',
              lessonsLearned: '{{outputs.outcome_summary.lessonsLearned}}'
            }
          }
        ]
      }
    }
  ]
};

export default EmergencyRenewalWorkflow;
